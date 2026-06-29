import React, { useState, useEffect, useRef } from 'react';

export default function AuctionRoom({ user }) {
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("Base Price");
  const [biddingClosed, setBiddingClosed] = useState(true);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://auction-app-hfsu.onrender.com/ws/auction`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'LUDO_SPIN') {
        setIsSpinning(true);
        setActiveCandidate(null);
        setBiddingClosed(false);
      } 
      else if (data.type === 'STATE_UPDATE') {
        setIsSpinning(false);
        setActiveCandidate(data.candidate);
        setCurrentBid(data.current_bid);
        setHighestBidder(data.highest_bidder);
        setBiddingClosed(data.bidding_closed);
      }
    };

    return () => { if (ws.current) ws.current.close(); };
  }, []);

  const sendAction = (action, extraData = {}) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, ...extraData }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* THE STAGE */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative min-h-[500px] flex flex-col items-center justify-center p-8">
          
          {!activeCandidate && !isSpinning ? (
            <div className="text-slate-400 font-bold text-xl flex flex-col items-center">
              <span className="text-6xl mb-4">🎲</span>
              Awaiting Ludo Selection...
            </div>
          ) : (
            <div className="w-full text-center relative z-10">
              {isSpinning && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-indigo-600"><span className="text-6xl animate-spin mb-4">⚙️</span><h2 className="text-3xl font-black">Ludo Algorithm Rolling...</h2></div>}

              <div className="w-32 h-32 mx-auto bg-slate-50 rounded-full border-4 border-indigo-100 flex items-center justify-center mb-6 shadow-inner text-5xl">👤</div>
              <h2 className="text-5xl font-black text-slate-900 mb-2">{activeCandidate?.name}</h2>
              <div className="text-slate-500 font-bold">Candidate ID: #{activeCandidate?.id}</div>
              
              {!isSpinning && (
                <div className="mt-8 bg-slate-50 border border-slate-200 rounded-3xl p-8 shadow-inner">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Live Highest Bid</div>
                  <div className="text-7xl font-black text-emerald-500 mb-4">${currentBid}</div>
                  <div className="text-lg text-slate-600 font-medium">Leading Franchise: <span className="text-slate-900 font-black">{highestBidder}</span></div>
                </div>
              )}

              {biddingClosed && activeCandidate && (
                <div className="absolute inset-0 bg-emerald-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white z-30 rounded-3xl">
                  <span className="text-7xl mb-6">🔨</span>
                  <h3 className="text-5xl font-black mb-4">SOLD!</h3>
                  <p className="text-2xl font-medium">Drafted by <span className="font-bold text-emerald-400">{highestBidder}</span> for ${currentBid}</p>
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
              <button onClick={() => sendAction('SPIN_LUDO')} disabled={isSpinning || (!biddingClosed && activeCandidate)} className="w-full py-5 rounded-2xl text-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50">Trigger Ludo Spin</button>
              <button onClick={() => sendAction('CLOSE_BID')} disabled={isSpinning || biddingClosed || !activeCandidate} className="w-full py-4 rounded-2xl text-lg font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 transition disabled:opacity-50">Drop Hammer (Sell)</button>
            </div>
          ) : user.role === 'OWNER' ? (
            <button onClick={() => sendAction('BID', { team_name: user.team_name })} disabled={!activeCandidate || isSpinning || biddingClosed} className="w-full py-6 rounded-2xl text-3xl font-black text-white bg-emerald-500 hover:bg-emerald-400 transition transform hover:-translate-y-1 shadow-[0_10px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:transform-none">
              BID +$100
            </button>
          ) : (
            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-4xl block mb-2">👀</span>
              <p className="font-bold text-slate-500">You are registered as a Candidate. Sit tight and watch the auction!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}