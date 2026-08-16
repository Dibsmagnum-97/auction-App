import asyncio
import random
from typing import List, Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import SessionLocal, engine, Base

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    if not db.query(models.User).filter(models.User.phone == "0000000000").first():
        admin = models.User(name="Super Admin", phone="0000000000", role="ADMIN", gender="Male")
        db.add(admin)
        db.commit()
    db.close()

# --- REST API SCHEMAS ---
# --- SCHEMAS ---
class AuthRequest(BaseModel):
    name: str
    phone: str
    gender: Optional[str] = "Male"

class PromoteRequest(BaseModel):
    phone: str
    team_name: str

class UserEditRequest(BaseModel):
    name: str
    phone: str
    gender: str
    role: str
    team_name: Optional[str] = None
    budget: int
    team_size: int
    is_auctioned: bool
    auctioned_to: Optional[str] = None
    auction_price: int
    is_approved: bool # NEW

class ParticipantEditRequest(BaseModel):
    name: str
    gender: str
# --- REST API ROUTES ---
@app.post("/api/signup")
def signup(req: AuthRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered.")
    
    new_user = models.User(
        name=req.name, 
        phone=req.phone, 
        gender=req.gender, 
        role="PARTICIPANT",
        is_approved=False # Requires admin approval
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == req.phone, models.User.name == req.name).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Name or Phone Number.")
    return user

# NEW: Route for frontend to refresh owner budget after a bid closes
@app.get("/api/users/{phone}")
def get_user_by_phone(phone: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == phone).first()
    return user

@app.get("/api/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/api/participant/edit/{phone}")
def edit_own_profile(phone: str, req: ParticipantEditRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = req.name
    user.gender = req.gender
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/admin/promote")
def promote_to_owner(req: PromoteRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "OWNER"
    user.team_name = req.team_name
    db.commit()
    return {"message": f"{user.name} is now Owner of {req.team_name}"}

@app.put("/api/admin/users/{user_id}")
def edit_user(user_id: int, req: UserEditRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = req.name
    user.phone = req.phone
    user.gender = req.gender
    user.role = req.role
    user.team_name = req.team_name if req.team_name else None
    user.budget = req.budget
    user.team_size = req.team_size
    user.is_auctioned = req.is_auctioned
    user.auctioned_to = req.auctioned_to if req.auctioned_to else None
    user.auction_price = req.auction_price
    user.is_approved = req.is_approved # Admin approval toggle
    db.commit()
    return {"message": "User successfully updated"}
 
@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.phone == "0000000000":
        raise HTTPException(status_code=400, detail="Cannot delete Super Admin.")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

# --- NEW: Schema for Owner updating a player ---
class PlayerUpdateRequest(BaseModel):
    name: str
    phone: str

# --- NEW: Route for Owner to update their player's details ---
@app.put("/api/owner/players/{user_id}")
def update_player_details(user_id: int, req: PlayerUpdateRequest, db: Session = Depends(get_db)):
    player = db.query(models.User).filter(models.User.id == user_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if the new phone number already belongs to someone else
    existing_phone = db.query(models.User).filter(models.User.phone == req.phone).first()
    if existing_phone and existing_phone.id != user_id:
        raise HTTPException(status_code=400, detail="Phone number already registered to another user.")
    
    player.name = req.name
    player.phone = req.phone
    db.commit()
    return {"message": "Player updated successfully"}


# --- NEW: Match Schemas ---
class MatchRequest(BaseModel):
    team1: str
    team2: str
    match_date: str
    match_time: str
    status: Optional[str] = "Upcoming"

# --- NEW: Match REST API Routes ---
@app.get("/api/matches")
def get_matches(db: Session = Depends(get_db)):
    return db.query(models.Match).all()

@app.post("/api/admin/matches")
def create_match(req: MatchRequest, db: Session = Depends(get_db)):
    new_match = models.Match(**req.dict())
    db.add(new_match)
    db.commit()
    return {"message": "Match scheduled successfully"}

@app.put("/api/admin/matches/{match_id}")
def update_match(match_id: int, req: MatchRequest, db: Session = Depends(get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match.team1 = req.team1
    match.team2 = req.team2
    match.match_date = req.match_date
    match.match_time = req.match_time
    match.status = req.status
    db.commit()
    return {"message": "Match updated"}

@app.delete("/api/admin/matches/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()
    return {"message": "Match deleted"}
# --- WEBSOCKET AUCTION MANAGER ---
class LiveAuctionState:
    def __init__(self):
        self.connections: List[WebSocket] = []
        self.active_candidate: Optional[dict] = None
        self.current_bid = 0
        self.highest_bidder = "Base Price"
        self.highest_bidder_phone = None # NEW: Track phone to deduct budget later
        self.bidding_closed = True

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)
        await self.broadcast_state()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast_state(self):
        state = {
            "type": "STATE_UPDATE",
            "candidate": self.active_candidate,
            "current_bid": self.current_bid,
            "highest_bidder": self.highest_bidder,
            "bidding_closed": self.bidding_closed
        }
        for connection in self.connections:
            try:
                await connection.send_json(state)
            except:
                pass

    async def broadcast_spin(self):
        for connection in self.connections:
            try:
                await connection.send_json({"type": "LUDO_SPIN"})
            except:
                pass

auction_state = LiveAuctionState()

@app.websocket("/ws/auction")
async def auction_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    await auction_state.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "SPIN_DRAFT": # Changed from SPIN_LUDO
                target_gender = data.get("gender", "Male")
                
                # CRITICAL: Only select users who are APPROVED by Admin
                available = db.query(models.User).filter(
                    models.User.role == "PARTICIPANT", 
                    models.User.is_auctioned == False,
                    models.User.gender == target_gender,
                    models.User.is_approved == True 
                ).all()
                
                if not available:
                    await websocket.send_json({"type": "ERROR", "message": f"No approved {target_gender} candidates left!"})
                    continue
                
                await auction_state.broadcast_spin()
                await asyncio.sleep(3.0) # slightly longer for new UI animation
                
                chosen = random.choice(available)
                auction_state.active_candidate = {"id": chosen.id, "name": chosen.name, "phone": chosen.phone, "gender": chosen.gender}
                auction_state.current_bid = 500
                auction_state.highest_bidder = "Base Price"
                auction_state.highest_bidder_phone = None
                auction_state.bidding_closed = False
                await auction_state.broadcast_state()

            elif action == "BID" and not auction_state.bidding_closed:
                team_name = data.get("team_name")
                owner_phone = data.get("owner_phone")
                
                # NEW: Verify Budget and Team Size before allowing bid
                owner = db.query(models.User).filter(models.User.phone == owner_phone).first()
                if owner and owner.budget >= (auction_state.current_bid + 100) and owner.team_size < 10:
                    auction_state.current_bid += 100
                    auction_state.highest_bidder = team_name
                    auction_state.highest_bidder_phone = owner_phone
                    await auction_state.broadcast_state()

            elif action == "CLOSE_BID":
                auction_state.bidding_closed = True
                
                # NEW: Finalize Sale, Deduct Budget, Increase Team Size
                if auction_state.active_candidate and auction_state.highest_bidder != "Base Price":
                    candidate = db.query(models.User).filter(models.User.phone == auction_state.active_candidate["phone"]).first()
                    owner = db.query(models.User).filter(models.User.phone == auction_state.highest_bidder_phone).first()
                    
                    if candidate and owner:
                        candidate.is_auctioned = True
                        candidate.auctioned_to = owner.team_name
                        candidate.auction_price = auction_state.current_bid
                        
                        owner.budget -= auction_state.current_bid
                        owner.team_size += 1
                        db.commit()
                
                await auction_state.broadcast_state()

    except WebSocketDisconnect:
        auction_state.disconnect(websocket)