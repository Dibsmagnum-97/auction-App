from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True) 
    gender = Column(String, default="Male") 
    role = Column(String, default="PARTICIPANT")    
    team_name = Column(String, nullable=True)       
    budget = Column(Integer, default=10000)
    team_size = Column(Integer, default=0)
    is_auctioned = Column(Boolean, default=False)   
    auctioned_to = Column(String, nullable=True)    
    auction_price = Column(Integer, default=0)

# --- NEW: Match Schedule Table ---
class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    team1 = Column(String, index=True)
    team2 = Column(String, index=True)
    match_date = Column(String)
    match_time = Column(String)
    status = Column(String, default="Upcoming") # Upcoming, Live, Completed