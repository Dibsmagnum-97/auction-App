from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # Phone replaces username/email as the unique login identifier
    phone = Column(String, unique=True, index=True) 
    
    # Roles can be: ADMIN, OWNER, or PARTICIPANT
    role = Column(String, default="PARTICIPANT")    
    
    # Franchise details (Only populated if the Admin promotes them to OWNER)
    team_name = Column(String, nullable=True)       
    
    # Auction tracking (Used to filter the Ludo Algorithm pool)
    is_auctioned = Column(Boolean, default=False)   
    auctioned_to = Column(String, nullable=True)    
    auction_price = Column(Integer, default=0)