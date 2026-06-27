import React, { useState } from 'react';

// Create 100 Mock Candidates
const CANDIDATES = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Candidate #${i + 1}`,
  basePrice: 500,
}));

export default function AuctionRoom({ user }) {
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("None");
  const [biddingClosed, setBiddingClosed] = useState(false);

  // The "Ludo" Selection Algorithm (Roulette Effect)
  const spinForCandidate = () => {
    setIsSpinning(true);
    setActiveCandidate(null);
    setCurrentBid(0);
    setHighestBidder("None");
    setBiddingClosed(false);

    let counter = 0;
    const maxSpins = 20;

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * CANDIDATES.length);
      setActiveCandidate(CANDIDATES[randomIdx]);
      counter++;

      if (counter >= maxSpins) {
        clearInterval(interval);
        setIsSpinning(false);
        setCurrentBid(CANDIDATES[randomIdx].basePrice);
      }
    }, 100);
  };

  const handleBid = () => {
    setCurrentBid(prev => prev + 100);
    setHighestBidder(user.name);
  };
  const placeBid = () => {
    // Send the bid up to the Python backend
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'BID', amount: 100 }));
    }
    
    // Update locally for instant feedback
    setCurrentBid(prev => prev + 100);
    setHighestBidder(user.username);
  };
  useEffect(() => {
    // Connect to the actual Python WebSocket API
    // Change 'ws://https://auction-app-hfsu.onrender.com' to 'wss://your-backend-app.onrender.com' if testing live!
    const wsUrl = `ws://https://auction-app-hfsu.onrender.com/ws/auction/${user.username}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Update the frontend based on backend broadcasts
      if (data.type === 'SYSTEM' || data.type === 'UPDATE') {
        if (data.current_bid !== undefined) setCurrentBid(data.current_bid);
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user.username]);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      
      {/* LEFT PANEL: Candidate Block */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Admin Controls for Ludo Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">Candidate Pool</h3>
            <p className="text-sm text-gray-500">100 Candidates loaded in algorithm.</p>
          </div>
          <button 
            onClick={spinForCandidate} 
            disabled={isSpinning || (!biddingClosed && activeCandidate != null)}
            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md ${isSpinning ? 'bg-gray-300 text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'}`}
          >
            {isSpinning ? 'Rolling Ludo Generator...' : 'Select Next Candidate'}
          </button>
        </div>

        {/* Live Candidate Spotlight */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center">
          {!activeCandidate ? (
            <div className="text-gray-400 font-medium text-lg flex flex-col items-center">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Waiting for Ludo Selection...
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center relative">
              
              {isSpinning && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center text-3xl font-black text-indigo-600">Selecting...</div>}

              <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-indigo-100 flex items-center justify-center mb-6 shadow-inner">
                <span className="text-4xl">👤</span>
              </div>
              <h2 className={`text-4xl font-black text-gray-900 mb-2 ${isSpinning ? 'blur-sm' : ''}`}>
                {activeCandidate.name}
              </h2>
              <div className="inline-block bg-indigo-50 text-indigo-700 font-bold px-4 py-1 rounded-full border border-indigo-100 mb-8">
                Base Price: ${activeCandidate.basePrice}
              </div>

              {!isSpinning && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-inner">
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Current Highest Bid</div>
                  <div className="text-6xl font-black text-green-600 mb-2">${currentBid}</div>
                  <div className="text-gray-600 font-medium">Bidder: <span className="text-gray-900 font-bold">{highestBidder}</span></div>
                </div>
              )}

              {biddingClosed && (
                <div className="absolute inset-0 bg-green-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                  <span className="text-6xl mb-4">🔨</span>
                  <h3 className="text-4xl font-black mb-2">SOLD!</h3>
                  <p className="text-xl">To {highestBidder} for ${currentBid}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Owner Tools */}
      <div className="flex flex-col gap-6">
        
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-6 text-xl">Owner Control Panel</h3>
          
          <button 
            onClick={handleBid}
            disabled={!activeCandidate || isSpinning || biddingClosed}
            className={`w-full py-5 rounded-2xl text-2xl font-black transition-all mb-4 shadow-lg ${
              !activeCandidate || isSpinning || biddingClosed 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-400 text-white hover:-translate-y-1 hover:shadow-green-500/30'
            }`}
          >
            BID +$100
          </button>

          <button 
            onClick={() => setBiddingClosed(true)}
            disabled={!activeCandidate || isSpinning || biddingClosed}
            className={`w-full py-3 rounded-xl font-bold transition-all border-2 ${
              !activeCandidate || isSpinning || biddingClosed
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-red-500 text-red-600 hover:bg-red-50'
            }`}
          >
            End Bidding (Admin)
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex-1">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Active Owners in Room
          </h3>
          <div className="space-y-3">
            {['Mumbai Titans', 'Kolkata Knights', user?.name].map((owner, idx) => (
              owner && (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${highestBidder === owner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">🏢</div>
                    <span className="font-semibold text-gray-800">{owner}</span>
                  </div>
                  {highestBidder === owner && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Leading</span>}
                </div>
              )
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}