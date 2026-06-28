import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [promotePhone, setPromotePhone] = useState('');
  const [teamName, setTeamName] = useState('');
  
  // New States for Super Admin Editing Powers
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    const res = await fetch('https://auction-app-hfsu.onrender.com/api/users');
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Standard Promotion
  const handlePromote = async (e) => {
    e.preventDefault();
    await fetch('https://auction-app-hfsu.onrender.com/api/admin/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: promotePhone, team_name: teamName })
    });
    setPromotePhone(''); setTeamName('');
    fetchUsers();
  };

  // SUPER ADMIN POWER: Delete User
  const handleDelete = async (userId, userPhone) => {
    if (userPhone === "0000000000") {
      alert("You cannot delete the Super Admin!");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      await fetch(`https://auction-app-hfsu.onrender.com/api/admin/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  // SUPER ADMIN POWER: Save forceful edits
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await fetch(`https://auction-app-hfsu.onrender.com/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser)
    });
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 relative">
      
      {/* 1. Quick Promote Tool */}
      <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 h-fit">
        <h3 className="font-black text-xl mb-4">Quick Promote</h3>
        <form onSubmit={handlePromote} className="space-y-4">
          <select required className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={promotePhone} onChange={e => setPromotePhone(e.target.value)}>
            <option value="">Select Participant...</option>
            {users.filter(u => u.role === 'PARTICIPANT').map(u => (
              <option key={u.phone} value={u.phone}>{u.name} ({u.phone})</option>
            ))}
          </select>
          <input required type="text" placeholder="Team Name (e.g. Mumbai Titans)" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={teamName} onChange={e => setTeamName(e.target.value)} />
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">Assign Team Owner</button>
        </form>
      </div>

      {/* 2. Super Admin Database Table */}
      <div className="md:col-span-3 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-xl">System Database Controls</h3>
          <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{users.length} Total Users</span>
        </div>
        
        <div className="overflow-y-auto max-h-[600px] border-t border-slate-100 pt-4 custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                <th className="pb-3">Name & Phone</th>
                <th className="pb-3">Role / Team</th>
                <th className="pb-3">Auction Status</th>
                <th className="pb-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-4 font-semibold">
                    {u.name} 
                    {u.phone === "0000000000" && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">SUPER ADMIN</span>}
                    <span className="text-xs text-slate-400 block mt-1">{u.phone}</span>
                  </td>
                  <td className="py-4 font-bold text-indigo-600">{u.team_name || u.role}</td>
                  <td className="py-4">
                    {u.is_auctioned ? (
                      <div>
                        <span className="text-green-600 font-bold block">Sold to {u.auctioned_to}</span>
                        <span className="text-xs text-slate-500 font-semibold">${u.auction_price}</span>
                      </div>
                    ) : 'Available'}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button 
                      onClick={() => setEditingUser(u)} 
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-xs transition"
                    >
                      Edit
                    </button>
                    {u.phone !== "0000000000" && (
                      <button 
                        onClick={() => handleDelete(u.id, u.phone)} 
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. The Super Admin "God Mode" Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Force Edit User Data</h2>
            
            <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
              
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input type="text" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                <input type="text" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} disabled={editingUser.phone === "0000000000"} />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
                <select className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} disabled={editingUser.phone === "0000000000"}>
                  <option value="PARTICIPANT">PARTICIPANT</option>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Team Name (If Owner)</label>
                <input type="text" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={editingUser.team_name || ''} onChange={e => setEditingUser({...editingUser, team_name: e.target.value})} />
              </div>

              <div className="col-span-2 border-t border-slate-200 my-2 pt-4">
                <h4 className="font-bold text-slate-900 mb-4">Auction Status Controls</h4>
              </div>

              <div className="col-span-2 flex items-center gap-3 mb-2">
                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={editingUser.is_auctioned} onChange={e => setEditingUser({...editingUser, is_auctioned: e.target.checked})} />
                <label className="font-bold text-slate-700">Mark as Sold / Auctioned</label>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sold To (Team Name)</label>
                <input type="text" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={editingUser.auctioned_to || ''} onChange={e => setEditingUser({...editingUser, auctioned_to: e.target.value})} disabled={!editingUser.is_auctioned} />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sold For (Price)</label>
                <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600" value={editingUser.auction_price} onChange={e => setEditingUser({...editingUser, auction_price: Number(e.target.value)})} disabled={!editingUser.is_auctioned} />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition">Save Forceful Edits</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}