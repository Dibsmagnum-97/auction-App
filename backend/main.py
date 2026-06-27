import os
import shutil
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and serve it statically
os.makedirs("static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- REST API: User Registration & Image Upload ---
@app.post("/register")
async def register_user(
    username: str = Form(...),
    role: str = Form("USER"),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save Image
    file_location = f"static/images/{image.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(image.file, file_object)
    
    image_url = f"http://localhost:8000/{file_location}"
    
    # Save to DB
    new_user = models.User(username=username, role=role, image_url=image_url)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully", "user": new_user}

# --- WebSocket: Round Robin Auction Logic ---
class AuctionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.participants = [] # List of dicts: {"username": str, "image": str}
        self.current_turn_index = 0
        self.current_highest_bid = 0
        self.highest_bidder = None

    async def connect(self, websocket: WebSocket, username: str, image_url: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        user_data = {"username": username, "image": image_url}
        if user_data not in self.participants:
            self.participants.append(user_data)
        
        await self.broadcast({
            "type": "SYSTEM",
            "message": f"{username} joined the auction!",
            "participants": self.participants,
            "current_bid": self.current_highest_bid,
            "turn": self.get_current_turn()
        })

    def disconnect(self, websocket: WebSocket, username: str):
        self.active_connections.remove(websocket)
        self.participants = [p for p in self.participants if p["username"] != username]

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

    def get_current_turn(self):
        if not self.participants:
            return None
        # Ensure index is within bounds
        self.current_turn_index = self.current_turn_index % len(self.participants)
        return self.participants[self.current_turn_index]["username"]

    async def next_turn(self):
        if len(self.participants) <= 1:
            winner = self.participants[0]['username'] if self.participants else "No one"
            await self.broadcast({
                "type": "GAMEOVER",
                "message": f"Auction Ended! Winner is {winner} with ${self.current_highest_bid}",
                "winner": winner
            })
            return

        self.current_turn_index = (self.current_turn_index + 1) % len(self.participants)
        
        await self.broadcast({
            "type": "UPDATE",
            "turn": self.get_current_turn(),
            "current_bid": self.current_highest_bid,
            "participants": self.participants
        })

manager = AuctionManager()

@app.websocket("/ws/auction/{username}")
async def auction_endpoint(websocket: WebSocket, username: str, db: Session = Depends(get_db)):
    # Fetch user to get their image
    user = db.query(models.User).filter(models.User.username == username).first()
    image_url = user.image_url if user else "https://via.placeholder.com/150"
    
    await manager.connect(websocket, username, image_url)
    try:
        while True:
            data = await websocket.receive_json()
            current_turn_user = manager.get_current_turn()

            if data["action"] == "BID" and current_turn_user == username:
                manager.current_highest_bid += data["amount"]
                manager.highest_bidder = username
                await manager.broadcast({
                    "type": "LOG", 
                    "message": f"{username} bid ${manager.current_highest_bid}!"
                })
                await manager.next_turn()
                
            elif data["action"] == "PASS" and current_turn_user == username:
                manager.participants = [p for p in manager.participants if p["username"] != username]
                await manager.broadcast({
                    "type": "LOG", 
                    "message": f"{username} passed and left the round."
                })
                await manager.next_turn()

    except WebSocketDisconnect:
        manager.disconnect(websocket, username)
        await manager.broadcast({"type": "LOG", "message": f"{username} disconnected."})