import React, { useState, useEffect } from 'react';
import Registration from './components/Registration';
import AuctionRoom from './components/AuctionRoom';
import AdminPanel from './components/AdminPanel';
import LeagueDashboard from './components/LeagueDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // Defaulting to dark mode for the premium look
  
  // Profile Edit State
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('');

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://auction-app-hfsu.onrender.com/api/participant/edit/${user.phone}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, gender: editGender })
      });
      const updatedData = await res.json();
      setUser(updatedData);
      setShowProfile(false);
    } catch (err) { alert("Failed to update profile"); }
  };

  const openProfile = () => {
    setEditName(user.name);
    setEditGender(user.gender);
    setShowProfile(true);
  };

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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} relative overflow-hidden`}>
      
      {/* 3D ANIMATED CRICKET BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Slowly zooming stadium image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-30 mix-blend-luminosity transform scale-110 animate-[zoomInOut_30s_ease-in-out_infinite]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop')" }}
        ></div>
        {/* Dynamic color overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/80 to-slate-950 dark:from-slate-950 dark:via-blue-950/80 dark:to-slate-950 mix-blend-multiply"></div>
      </div>

      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">🏏</div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">League<span className="text-indigo-600">Draft</span></span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition">
              {darkMode ? '☀️' : '🌙'}
            </button>

            {user && (
              <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setCurrentPage('auction')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === 'auction' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Draft Arena</button>
                  <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === 'dashboard' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Tournament</button>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => setCurrentPage('admin')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === 'admin' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>System DB</button>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition" onClick={openProfile}>
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-bold leading-none dark:text-white">{user.name}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">{user.team_name || user.role}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setUser(null); setCurrentPage('auth'); }} className="text-xs text-red-500 hover:text-red-600 font-bold ml-3 border-l border-slate-300 dark:border-slate-600 pl-3">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* USER PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-200 dark:border-slate-700 relative z-50">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Modify Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input type="text" required className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500 font-bold" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Division</label>
                <select className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold" value={editGender} onChange={e => setEditGender(e.target.value)}>
                  <option value="Male">Mens Section</option>
                  <option value="Female">Womens Section</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">* Phone number cannot be changed.</p>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowProfile(false)} className="px-4 py-2 font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="pt-28 pb-20 md:pb-12 min-h-screen flex justify-center relative z-10">
        {renderPage()}
      </main>
    </div>
  );
}