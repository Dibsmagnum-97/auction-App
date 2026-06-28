import asyncio
import random
from typing import List, Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

import models
from database import SessionLocal, engine, Base

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- INITIALIZE DEFAULT ADMIN ---
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    if not db.query(models.User).filter(models.User.phone == "0000000000").first():
        admin = models.User(name="Super Admin", phone="0000000000", role="ADMIN")
        db.add(admin)
        db.commit()
    db.close()

# --- REST API SCHEMAS ---
class AuthRequest(BaseModel):
    name: str
    phone: str

class PromoteRequest(BaseModel):
    phone: str
    team_name: str

# NEW: Schema for the Super Admin to edit absolutely anything about a user
class UserEditRequest(BaseModel):
    name: str
    phone: str
    role: str
    team_name: Optional[str] = None
    is_auctioned: bool
    auctioned_to: Optional[str] = None
    auction_price: int

# --- REST API ROUTES ---
@app.post("/api/signup")
def signup(req: AuthRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered.")
    new_user = models.User(name=req.name, phone=req.phone, role="PARTICIPANT")
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

@app.get("/api/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.post("/api/admin/promote")
def promote_to_owner(req: PromoteRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "OWNER"
    user.team_name = req.team_name
    db.commit()
    return {"message": f"{user.name} is now Owner of {req.team_name}"}

# NEW: Super Admin API to forcefully edit a user
@app.put("/api/admin/users/{user_id}")
def edit_user(user_id: int, req: UserEditRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = req.name
    user.phone = req.phone
    user.role = req.role
    user.team_name = req.team_name if req.team_name else None
    user.is_auctioned = req.is_auctioned
    user.auctioned_to = req.auctioned_to if req.auctioned_to else None
    user.auction_price = req.auction_price
    db.commit()
    return {"message": "User successfully updated"}

# NEW: Super Admin API to delete a user
@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.phone == "0000000000":
        raise HTTPException(status_code=400, detail="Cannot delete the Super Admin account.")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# --- WEBSOCKET AUCTION MANAGER (Untouched existing logic) ---
class LiveAuctionState:
    def __init__(self):
        self.connections: List[WebSocket] = []
        self.active_candidate: Optional[dict] = None
        self.current_bid = 0
        self.highest_bidder = "Base Price"
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

            if action == "SPIN_LUDO":
                available = db.query(models.User).filter(models.User.role == "PARTICIPANT", models.User.is_auctioned == False).all()
                if not available:
                    await websocket.send_json({"type": "ERROR", "message": "No candidates left!"})
                    continue
                
                await auction_state.broadcast_spin()
                await asyncio.sleep(2.5) 
                
                chosen = random.choice(available)
                auction_state.active_candidate = {"id": chosen.id, "name": chosen.name, "phone": chosen.phone}
                auction_state.current_bid = 500
                auction_state.highest_bidder = "Base Price"
                auction_state.bidding_closed = False
                await auction_state.broadcast_state()

            elif action == "BID" and not auction_state.bidding_closed:
                team_name = data.get("team_name")
                auction_state.current_bid += 100
                auction_state.highest_bidder = team_name
                await auction_state.broadcast_state()

            elif action == "CLOSE_BID":
                auction_state.bidding_closed = True
                
                if auction_state.active_candidate and auction_state.highest_bidder != "Base Price":
                    user = db.query(models.User).filter(models.User.phone == auction_state.active_candidate["phone"]).first()
                    if user:
                        user.is_auctioned = True
                        user.auctioned_to = auction_state.highest_bidder
                        user.auction_price = auction_state.current_bid
                        db.commit()
                
                await auction_state.broadcast_state()

    except WebSocketDisconnect:
        auction_state.disconnect(websocket)