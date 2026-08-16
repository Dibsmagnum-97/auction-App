import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [promotePhone, setPromotePhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('https://auction-app-hfsu.onrender.com/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handlePromote = async (e) => {
    e.preventDefault();
    await fetch('https://auction-app-hfsu.onrender.com/api/admin/promote', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ phone: promotePhone, team_name: teamName }) 
    });
    setPromotePhone(''); setTeamName(''); fetchUsers();
  };

  const handleDelete = async (userId, userPhone) => {
    if (userPhone === "0000000000") return alert("Cannot delete Super Admin!");
    if (window.confirm("Permanently delete user?")) {
      await fetch(`https://auction-app-hfsu.onrender.com/api/admin/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await fetch(`https://auction-app-hfsu.onrender.com/api/admin/users/${editingUser.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(editingUser) 
    });
    setEditingUser(null); fetchUsers();
  };

  const franchises = users.filter(u => u.role === 'OWNER');
  const participants = users.filter(u => u.role === 'PARTICIPANT');
  const draftedPlayers = participants.filter(u => u.is_auctioned).sort((a, b) => a.auctioned_to.localeCompare(b.auctioned_to));

  return (
    <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 relative pb-20">
      
      {/* 1. Sidebar Tools (Promote & Franchise Stats) */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 h-fit transition-colors">
          <h3 className="font-black text-xl mb-4 text-slate-900 dark:text-white">Quick Promote</h3>
          <form onSubmit={handlePromote} className="space-y-4">
            <select required className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-600 bg-transparent dark:bg-slate-800 dark:text-white text-sm font-semibold" value={promotePhone} onChange={e => setPromotePhone(e.target.value)}>
              <option value="" className="dark:text-slate-900">Select Candidate...</option>
              {participants.map(u => (<option key={u.phone} value={u.phone} className="dark:text-slate-900">{u.name} ({u.gender})</option>))}
            </select>
            <input required type="text" placeholder="Team Name (e.g. Titans)" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-600 bg-transparent dark:text-white font-semibold" value={teamName} onChange={e => setTeamName(e.target.value)} />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition">Assign Owner</button>
          </form>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 transition-colors">
          <h3 className="font-black text-lg mb-4 text-slate-800 dark:text-white">Franchise Status</h3>
          <div className="space-y-3">
            {franchises.length === 0 ? <p className="text-sm text-slate-400 font-medium">No teams created yet.</p> : 
              franchises.map(f => (
                <div key={f.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col">
                  <span className="font-black text-indigo-700 dark:text-indigo-400">{f.team_name}</span>
                  <div className="flex justify-between mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Purse: ₹{f.budget}</span>
                    <span className={f.team_size >= 10 ? 'text-red-500' : ''}>Squad: {f.team_size}/10</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* 2. Main Area Container */}
      <div className="md:col-span-3 space-y-8">
        
        {/* TOP TABLE: Master System Database */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-xl text-slate-900 dark:text-white">System Database Controls</h3>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1 rounded-full">{users.length} Registered</span>
          </div>
          
          <div className="overflow-y-auto max-h-[500px] border-t border-slate-100 dark:border-slate-700 pt-4 custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-3 px-2">Participant Details</th>
                  <th className="pb-3 px-2">Status / Placement</th>
                  <th className="pb-3 px-2 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${u.gender === 'Female' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>{u.gender}</span>
                        <span className="font-black text-slate-800 dark:text-white">{u.name}</span>
                        {u.phone === "0000000000" && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                      </div>
                      <span className="text-xs font-bold text-slate-400 block">{u.phone} | {u.role}</span>
                      
                      {/* APPROVAL BADGE */}
                      {u.role === 'PARTICIPANT' && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${u.is_approved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {u.is_approved ? 'Approved for Draft' : 'Pending Approval'}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    <td className="py-4 px-2">
                      {u.role === 'OWNER' ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-black px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">{u.team_name}</span>
                      ) : u.is_auctioned ? (
                        <div className="flex flex-col border-l-2 border-emerald-400 pl-3">
                          <span className="text-slate-800 dark:text-slate-300 font-semibold text-xs">Acquired by</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{u.auctioned_to} <span className="text-slate-500 font-bold ml-1">(₹{u.auction_price})</span></span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">In Draft Pool</span>
                      )}
                    </td>

                    <td className="py-4 px-2 text-right space-x-2">
                      <button onClick={() => setEditingUser(u)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition">Edit</button>
                      {u.phone !== "0000000000" && (
                        <button onClick={() => handleDelete(u.id, u.phone)} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 font-bold text-xs transition">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM TABLE: Drafted Players by Team */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-xl text-emerald-700 dark:text-emerald-400">Team Rosters & Player List</h3>
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full">{draftedPlayers.length} Drafted</span>
          </div>
          
          <div className="overflow-y-auto max-h-[500px] border-t border-slate-100 dark:border-slate-700 pt-4 custom-scrollbar">
            {draftedPlayers.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 font-medium text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-xl">No players have been auctioned to any team yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-3 px-2">Franchise (Team Name)</th>
                    <th className="pb-3 px-2">Player Name</th>
                    <th className="pb-3 px-2">Contact Info</th>
                    <th className="pb-3 px-2 text-right">Price Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {draftedPlayers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <td className="py-4 px-2 font-black text-indigo-700 dark:text-indigo-400">{u.auctioned_to}</td>
                      <td className="py-4 px-2">
                        <span className="font-bold text-slate-800 dark:text-white">{u.name}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${u.gender === 'Female' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>{u.gender}</span>
                      </td>
                      <td className="py-4 px-2 font-semibold text-slate-600 dark:text-slate-400">{u.phone}</td>
                      <td className="py-4 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{u.auction_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* 3. The Super Admin "God Mode" Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Force Edit Database Record</h2>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
              
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Name</label><input type="text" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Phone</label><input type="text" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none font-semibold disabled:opacity-50" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} disabled={editingUser.phone === "0000000000"} /></div>
              
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                <select className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold" value={editingUser.gender} onChange={e => setEditingUser({...editingUser, gender: e.target.value})}>
                  <option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                <select className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold disabled:opacity-50" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} disabled={editingUser.phone === "0000000000"}>
                  <option value="PARTICIPANT">PARTICIPANT</option><option value="OWNER">OWNER</option><option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* DRAFT APPROVAL STATUS */}
              <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 my-2 pt-4">
                <h4 className="font-bold text-amber-600 dark:text-amber-500 mb-2">Draft Approval Status</h4>
              </div>
              <div className="col-span-2 flex items-center gap-3 mb-2">
                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={editingUser.is_approved || false} onChange={e => setEditingUser({...editingUser, is_approved: e.target.checked})} />
                <label className="font-bold text-slate-700 dark:text-slate-300">Approve User for Draft Selection</label>
              </div>

              {/* FRANCHISE OWNER CONTROLS */}
              <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 my-2 pt-4"><h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">Franchise Owner Controls (If Applicable)</h4></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Team Name</label><input type="text" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold" value={editingUser.team_name || ''} onChange={e => setEditingUser({...editingUser, team_name: e.target.value})} /></div>
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Remaining Budget</label><input type="number" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold" value={editingUser.budget} onChange={e => setEditingUser({...editingUser, budget: Number(e.target.value)})} /></div>
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Current Squad Size</label><input type="number" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold" value={editingUser.team_size} onChange={e => setEditingUser({...editingUser, team_size: Number(e.target.value)})} /></div>

              {/* CANDIDATE AUCTION STATUS */}
              <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 my-2 pt-4"><h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Candidate Auction Status</h4></div>
              <div className="col-span-2 flex items-center gap-3 mb-2"><input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={editingUser.is_auctioned} onChange={e => setEditingUser({...editingUser, is_auctioned: e.target.checked})} /><label className="font-bold text-slate-700 dark:text-slate-300">Mark as Sold</label></div>
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Sold To (Team Name)</label><input type="text" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold disabled:opacity-50" value={editingUser.auctioned_to || ''} onChange={e => setEditingUser({...editingUser, auctioned_to: e.target.value})} disabled={!editingUser.is_auctioned} /></div>
              <div className="col-span-1"><label className="block text-xs font-bold text-slate-500 mb-1">Sold For (Price)</label><input type="number" className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl outline-none focus:border-indigo-500 font-semibold disabled:opacity-50" value={editingUser.auction_price} onChange={e => setEditingUser({...editingUser, auction_price: Number(e.target.value)})} disabled={!editingUser.is_auctioned} /></div>

              <div className="col-span-2 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition">Save Edits</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}