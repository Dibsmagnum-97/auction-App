import React, { useState, useEffect } from 'react';

export default function LeagueDashboard({ user }) {
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');

  const fetchData = async () => {
    try {
      const matchRes = await fetch('https://auction-app-hfsu.onrender.com/api/matches');
      setMatches(await matchRes.json());
      
      const userRes = await fetch('https://auction-app-hfsu.onrender.com/api/users');
      setUsers(await userRes.json());
    } catch (err) { console.error("Failed to fetch data"); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    await fetch('https://auction-app-hfsu.onrender.com/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team1, team2, match_date: matchDate, match_time: matchTime })
    });
    setTeam1(''); setTeam2(''); setMatchDate(''); setMatchTime('');
    fetchData();
  };

  const handleDeleteMatch = async (id) => {
    if (window.confirm("Delete this match?")) {
      await fetch(`https://auction-app-hfsu.onrender.com/api/admin/matches/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // Participant's own team (if drafted)
  const myTeam = user.is_auctioned ? users.filter(u => u.auctioned_to === user.auctioned_to && u.role === 'PARTICIPANT') : [];
  
  // NEW: Filter all Franchises and all Drafted Players to show the full league overview
  const franchises = users.filter(u => u.role === 'OWNER');
  const draftedParticipants = users.filter(u => u.role === 'PARTICIPANT' && u.is_auctioned);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      
      {/* LEFT COLUMN: Matches Schedule */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 transition-colors">
          <h3 className="font-black text-2xl text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">🏏 Official Match Schedule</h3>
          
          {matches.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 font-medium text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">No matches scheduled yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map(m => (
                <div key={m.id} className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center group">
                  {user.role === 'ADMIN' && (
                    <button onClick={() => handleDeleteMatch(m.id)} className="absolute top-3 right-3 text-red-500 bg-red-100 dark:bg-red-900/30 p-2 rounded-full opacity-0 group-hover:opacity-100 transition">🗑️</button>
                  )}
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-black rounded-full mb-4">{m.status}</span>
                  <div className="flex items-center justify-center gap-4 w-full mb-4">
                    <span className="font-black text-lg text-slate-800 dark:text-white w-1/3 truncate">{m.team1}</span>
                    <span className="text-slate-400 font-black italic">VS</span>
                    <span className="font-black text-lg text-slate-800 dark:text-white w-1/3 truncate">{m.team2}</span>
                  </div>
                  <div className="w-full border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>📅 {m.match_date}</span>
                    <span>⏰ {m.match_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Contextual Dashboard (Admin Tools OR Participant Team) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* SUPER ADMIN: Schedule Maker */}
        {user.role === 'ADMIN' && (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-xl text-slate-900 dark:text-white mb-4">Set New Match</h3>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <input required type="text" placeholder="Team 1 Name" className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500" value={team1} onChange={e => setTeam1(e.target.value)} />
              <div className="text-center font-black text-slate-300">VS</div>
              <input required type="text" placeholder="Team 2 Name" className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500" value={team2} onChange={e => setTeam2(e.target.value)} />
              <input required type="date" className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
              <input required type="time" className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white outline-none focus:border-indigo-500" value={matchTime} onChange={e => setMatchTime(e.target.value)} />
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition">Publish Match</button>
            </form>
          </div>
        )}

        {/* PARTICIPANT: My Team View */}
        {user.role === 'PARTICIPANT' && (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2">My Franchise</h3>
            {!user.is_auctioned ? (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl font-bold text-sm text-center">
                You are currently in the Draft Pool. Waiting to be auctioned!
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-emerald-600 mb-4">Drafted by: <span className="text-lg font-black block">{user.auctioned_to}</span></p>
                <h4 className="font-bold text-slate-500 dark:text-slate-400 uppercase text-xs mb-3">Your Teammates</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {myTeam.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block">{t.name} {t.id === user.id && '(You)'}</span>
                        <span className="text-[10px] uppercase font-black text-slate-400">{t.gender}</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-500">₹{t.auction_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* NEW: FULL LEAGUE FRANCHISES & ROSTERS (Visible to everyone) */}
      <div className="lg:col-span-3 mt-4 space-y-6">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 transition-colors">
          <h3 className="font-black text-2xl text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">🛡️ All League Franchises</h3>
          
          {franchises.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 font-medium text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">No franchises have been established yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {franchises.map(franchise => {
                // Find players drafted by this specific owner
                const teamSquad = draftedParticipants.filter(p => p.auctioned_to === franchise.team_name);
                
                return (
                  <div key={franchise.id} className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                    {/* Franchise Header */}
                    <div className="bg-indigo-600 dark:bg-indigo-900 p-5">
                      <h4 className="font-black text-white text-xl uppercase tracking-wider">{franchise.team_name}</h4>
                      <p className="text-indigo-200 text-xs font-bold mt-1">Owner: <span className="text-white">{franchise.name}</span></p>
                    </div>
                    
                    {/* Franchise Stats & Players */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <span>Squad: <span className={`text-sm ml-1 ${franchise.team_size >= 10 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{franchise.team_size}/10</span></span>
                        <span>Purse: <span className="text-slate-800 dark:text-slate-200">₹{franchise.budget}</span></span>
                      </div>
                      
                      {teamSquad.length === 0 ? (
                        <p className="text-sm font-medium text-center text-slate-400 dark:text-slate-500 py-6">No players drafted yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 flex-1">
                          {teamSquad.map(player => (
                            <div key={player.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-white block text-sm">{player.name}</span>
                                <span className={`text-[10px] uppercase font-black ${player.gender === 'Female' ? 'text-pink-500' : 'text-blue-500'}`}>{player.gender}</span>
                              </div>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">₹{player.auction_price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}