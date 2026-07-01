import React, { useState, useEffect, useRef } from 'react';

export default function AuctionRoom({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("Base Price");
  const [biddingClosed, setBiddingClosed] = useState(true);
  const ws = useRef(null);

  // NEW: State for Owner's Squad
  const [squad, setSquad] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // NEW: Function to fetch the Owner's specific team members
  const fetchSquad = async () => {
    if (user.role !== 'OWNER') return;
    try {
      const res = await fetch(`https://auction-app-hfsu.onrender.com/api/users`);
      const allUsers = await res.json();
      const mySquad = allUsers.filter(u => u.auctioned_to === user.team_name && u.role === 'PARTICIPANT');
      setSquad(mySquad);
    } catch (err) { console.error("Failed to fetch squad"); }
  };

  useEffect(() => {
    fetchSquad(); // Fetch squad when component mounts
    
    ws.current = new WebSocket(`wss://auction-app-hfsu.onrender.com/ws/auction`);

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'LUDO_SPIN') {
        setIsSpinning(true); setActiveCandidate(null); setBiddingClosed(false);
      } 
      else if (data.type === 'STATE_UPDATE') {
        setIsSpinning(false);
        setActiveCandidate(data.candidate);
        setCurrentBid(data.current_bid);
        setHighestBidder(data.highest_bidder);
        setBiddingClosed(data.bidding_closed);

        if (data.bidding_closed && user.role === 'OWNER') {
          // Refresh budget and squad when a bid closes
          const res = await fetch(`https://auction-app-hfsu.onrender.com/api/users/${user.phone}`);
          const updatedUser = await res.json();
          setUser(updatedUser);
          fetchSquad(); 
        }
      }
      else if (data.type === 'ERROR') {
        alert(data.message);
        setIsSpinning(false);
      }
    };
    return () => { if (ws.current) ws.current.close(); };
  }, [user.phone, user.role, user.team_name]);

  const sendAction = (action, extraData = {}) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, ...extraData }));
    }
  };

  // NEW: Function for Owner to save edited player details
  const handleSavePlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://auction-app-hfsu.onrender.com/api/owner/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingPlayer.name, phone: editingPlayer.phone })
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || "Update failed");
        return;
      }
      setEditingPlayer(null);
      fetchSquad(); // Refresh the table
    } catch (err) { alert("Error connecting to server"); }
  };

  const canAfford = user.budget >= (currentBid + 100);
  const isTeamFull = user.team_size >= 10;
  const disableBid = !activeCandidate || isSpinning || biddingClosed || !canAfford || isTeamFull;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* THE STAGE */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative min-h-[500px] flex flex-col items-center justify-center p-8">
          {!activeCandidate && !isSpinning ? (
            <div className="text-slate-400 font-bold text-xl flex flex-col items-center">
              <span className="text-6xl mb-4">🎲</span> Awaiting Ludo Selection...
            </div>
          ) : (
            <div className="w-full text-center relative z-10">
              {isSpinning && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-indigo-600"><span className="text-6xl animate-spin mb-4">⚙️</span><h2 className="text-3xl font-black">Ludo Algorithm Rolling...</h2></div>}

              <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center mb-6 shadow-inner text-5xl ${activeCandidate?.gender === 'Female' ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200'}`}>
                {activeCandidate?.gender === 'Female' ? '👩🏽' : '👨🏽'}
              </div>
              <h2 className="text-5xl font-black text-slate-900 mb-1">{activeCandidate?.name}</h2>
              <div className="text-slate-500 font-bold mb-4">{activeCandidate?.gender} Division | ID: #{activeCandidate?.id}</div>
              
              {!isSpinning && (
                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-inner">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Live Highest Bid</div>
                  <div className="text-7xl font-black text-emerald-500 mb-4">₹{currentBid}</div>
                  <div className="text-lg text-slate-600 font-medium">Leading Franchise: <span className="text-slate-900 font-black">{highestBidder}</span></div>
                </div>
              )}

              {biddingClosed && activeCandidate && (
                <div className="absolute inset-0 bg-emerald-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white z-30 rounded-3xl">
                  <span className="text-7xl mb-6">🔨</span><h3 className="text-5xl font-black mb-4">SOLD!</h3>
                  <p className="text-2xl font-medium">Drafted by <span className="font-bold text-emerald-400">{highestBidder}</span> for ₹{currentBid}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="font-black text-slate-900 mb-6 text-2xl border-b border-slate-100 pb-4">Control Interface</h3>
          
          {user.role === 'ADMIN' ? (
            <div className="space-y-4">
              <button onClick={() => sendAction('SPIN_LUDO', { gender: 'Male' })} disabled={isSpinning || (!biddingClosed && activeCandidate)} className="w-full py-4 rounded-2xl text-lg font-black text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50 shadow-md">🎲 Spin Mens Section</button>
              <button onClick={() => sendAction('SPIN_LUDO', { gender: 'Female' })} disabled={isSpinning || (!biddingClosed && activeCandidate)} className="w-full py-4 rounded-2xl text-lg font-black text-white bg-pink-500 hover:bg-pink-600 transition disabled:opacity-50 shadow-md">🎲 Spin Womens Section</button>
              <button onClick={() => sendAction('CLOSE_BID')} disabled={isSpinning || biddingClosed || !activeCandidate} className="w-full py-4 rounded-2xl text-lg font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 transition disabled:opacity-50 mt-4">Drop Hammer (Sell)</button>
            </div>
          ) : user.role === 'OWNER' ? (
            <div>
              <div className="flex justify-between items-center mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-center"><span className="block text-xs font-bold text-slate-400 uppercase">Budget</span><span className={`text-xl font-black ${user.budget < 1000 ? 'text-red-500' : 'text-slate-800'}`}>₹{user.budget}</span></div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center"><span className="block text-xs font-bold text-slate-400 uppercase">Squad</span><span className={`text-xl font-black ${isTeamFull ? 'text-red-500' : 'text-slate-800'}`}>{user.team_size}/10</span></div>
              </div>

              <button onClick={() => sendAction('BID', { team_name: user.team_name, owner_phone: user.phone })} disabled={disableBid} className={`w-full py-6 rounded-2xl text-3xl font-black text-white transition transform shadow-lg ${disableBid ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-1 hover:shadow-emerald-500/30'}`}>
                BID +₹100
              </button>
              
              {!canAfford && !isTeamFull && <p className="text-red-500 text-sm font-bold text-center mt-3">Insufficient Budget for next bid!</p>}
              {isTeamFull && <p className="text-red-500 text-sm font-bold text-center mt-3">Squad is full (10/10 Players)!</p>}
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-4xl block mb-2">👀</span><p className="font-bold text-slate-500">You are a Candidate. Sit tight and watch the auction!</p>
            </div>
          )}
        </div>
      </div>

      {/* NEW: OWNER SQUAD TABLE */}
      {user.role === 'OWNER' && (
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-4">
          <h3 className="font-black text-2xl text-slate-900 mb-6 border-b border-slate-100 pb-4">{user.team_name} - Official Squad</h3>
          
          {squad.length === 0 ? (
            <p className="text-slate-500 font-medium text-center py-6 bg-slate-50 rounded-xl">No players drafted yet. Start bidding!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                    <th className="pb-3">Player Name</th>
                    <th className="pb-3">Phone Number</th>
                    <th className="pb-3">Gender</th>
                    <th className="pb-3">Price Paid</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {squad.map((player) => (
                    <tr key={player.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="py-4 font-black text-slate-800">{player.name}</td>
                      <td className="py-4 font-semibold text-slate-600">{player.phone}</td>
                      <td className="py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${player.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>{player.gender}</span></td>
                      <td className="py-4 font-bold text-emerald-600">₹{player.auction_price}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => setEditingPlayer(player)} className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold text-xs transition">Edit Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NEW: EDIT PLAYER MODAL (For Owners) */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Edit Player Details</h2>
            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Player Name</label>
                <input type="text" required className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold" value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                <input type="text" required className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold" value={editingPlayer.phone} onChange={e => setEditingPlayer({...editingPlayer, phone: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingPlayer(null)} className="px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}