import React, { useState } from 'react';
import Registration from './components/Registration';
import AuctionRoom from './components/AuctionRoom';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-500/30">
      {/* PROFESSIONAL NAVBAR */}
      <nav className="bg-white border-b border-gray-200 shadow-sm fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
              A
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              Auction<span className="text-indigo-600">Hub</span>
            </span>
          </div>

          <div className="hidden md:flex gap-8 font-medium text-gray-600">
            <button onClick={() => setCurrentPage('home')} className={`hover:text-indigo-600 transition-colors ${currentPage === 'home' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}>Home</button>
            <button onClick={() => setCurrentPage('contact')} className={`hover:text-indigo-600 transition-colors ${currentPage === 'contact' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}>Contact</button>
            {user && <button onClick={() => setCurrentPage('auction')} className={`hover:text-indigo-600 transition-colors ${currentPage === 'auction' ? 'text-indigo-600 border-b-2 border-indigo-600' : ''}`}>Live Arena</button>}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-gray-800 leading-none">{user.name}</span>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase">{user.role}</span>
                </div>
                <button onClick={() => {setUser(null); setCurrentPage('home');}} className="ml-2 text-xs text-red-500 hover:underline">Logout</button>
              </div>
            ) : (
              <>
                <button onClick={() => setCurrentPage('login')} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Log In</button>
                <button onClick={() => setCurrentPage('signup')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT ROUTING */}
      <main className="pt-28 pb-12 min-h-screen flex justify-center">
        {currentPage === 'home' && (
          <div className="text-center max-w-3xl mx-auto px-6 mt-20">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              The Elite Platform for <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Candidate Auctions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Watch the Ludo-algorithm select candidates randomly from the pool of 100 participants, while franchise owners battle it out in real-time to secure the best talent.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setCurrentPage('signup')} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-xl transition-all hover:-translate-y-1">
                Register to Bid
              </button>
              <button onClick={() => setCurrentPage('contact')} className="bg-white text-gray-800 border-2 border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all">
                Contact Support
              </button>
            </div>
          </div>
        )}

        {(currentPage === 'login' || currentPage === 'signup' || currentPage === 'contact') && (
          <Registration view={currentPage} setView={setCurrentPage} onAuthenticate={setUser} />
        )}

        {currentPage === 'auction' && user && (
          <AuctionRoom user={user} />
        )}
      </main>
    </div>
  );
}