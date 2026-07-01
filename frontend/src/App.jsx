import React, { useState, useEffect } from 'react';
import Registration from './components/Registration';
import AuctionRoom from './components/AuctionRoom';
import AdminPanel from './components/AdminPanel';
import LeagueDashboard from './components/LeagueDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState(null);
  
  // NEW: Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode class to the HTML root element
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const renderPage = () => {
    if (!user) return <Registration onLogin={(userData) => { setUser(userData); setCurrentPage('auction'); }} />;
    
    switch (currentPage) {
      case 'auction': return <AuctionRoom user={user} />;
      case 'dashboard': return <LeagueDashboard user={user} />;
      case 'admin': return user.role === 'ADMIN' ? <AdminPanel /> : <AuctionRoom user={user} />;
      default: return <AuctionRoom user={user} />;
    }
  };

  return (
    // NEW: Added Cricket Background Image and dynamic text coloring
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} relative`}>
      
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop')" }}
      ></div>

      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm fixed top-0 w-full z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">L</div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">League<span className="text-indigo-600">Auction</span></span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Dark Mode Toggle Button */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              {darkMode ? '☀️' : '🌙'}
            </button>

            {user && (
              <div className="flex items-center gap-2 md:gap-4">
                
                {/* Navigation Tabs */}
                <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setCurrentPage('auction')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === 'auction' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Live Draft</button>
                  <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === 'dashboard' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Schedule</button>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => setCurrentPage('admin')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === 'admin' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Admin DB</button>
                  )}
                </div>

                {/* User Profile Bug */}
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold leading-none dark:text-white">{user.name}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">{user.team_name || user.role}</span>
                  </div>
                  <button onClick={() => {setUser(null); setCurrentPage('auth');}} className="text-xs text-red-500 hover:text-red-600 font-bold ml-3 border-l border-slate-300 dark:border-slate-600 pl-3">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation fallback (visible only on small screens) */}
      {user && (
        <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex justify-around p-3">
          <button onClick={() => setCurrentPage('auction')} className={`text-sm font-bold ${currentPage === 'auction' ? 'text-indigo-600' : 'text-slate-500'}`}>Draft</button>
          <button onClick={() => setCurrentPage('dashboard')} className={`text-sm font-bold ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'}`}>Schedule</button>
          {user.role === 'ADMIN' && <button onClick={() => setCurrentPage('admin')} className={`text-sm font-bold ${currentPage === 'admin' ? 'text-indigo-600' : 'text-slate-500'}`}>Admin</button>}
        </div>
      )}

      <main className="pt-28 pb-20 md:pb-12 min-h-screen flex justify-center relative z-10">
        {renderPage()}
      </main>
    </div>
  );
}