import React, { useState } from 'react';
import Registration from './components/Registration';
import AuctionRoom from './components/AuctionRoom';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState(null);

  const renderPage = () => {
    if (!user) return <Registration onLogin={(userData) => { setUser(userData); setCurrentPage('auction'); }} />;
    
    switch (currentPage) {
      case 'auction': return <AuctionRoom user={user} />;
      case 'admin': return user.role === 'ADMIN' ? <AdminPanel /> : <AuctionRoom user={user} />;
      default: return <AuctionRoom user={user} />;
    }
  };

  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 shadow-sm fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">L</div>
            <span className="text-2xl font-black tracking-tight">League<span className="text-indigo-600">Auction</span></span>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <>
                {user.role === 'ADMIN' && (
                  <button onClick={() => setCurrentPage(currentPage === 'admin' ? 'auction' : 'admin')} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition">
                    {currentPage === 'admin' ? 'Go to Live Arena' : 'Admin Dashboard'}
                  </button>
                )}
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold leading-none">{user.name}</span>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase">{user.team_name || user.role}</span>
                  </div>
                  <button onClick={() => {setUser(null); setCurrentPage('auth');}} className="text-xs text-red-500 hover:underline font-bold ml-3 border-l border-slate-300 pl-3">Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-12 min-h-screen flex justify-center">
        {renderPage()}
      </main>
    </div>
  );
}