import React, { useState } from 'react';

export default function Registration({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const response = await fetch(`https://auction-app-hfsu.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Authentication failed');
      
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 h-fit mt-10">
      
      <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Login</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Sign Up</button>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">{isLogin ? 'Welcome Back' : 'Join the Draft'}</h2>
        <p className="text-slate-500 text-sm">Enter your Name and Phone Number to continue.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
          <input 
            type="text" required placeholder="John Doe"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-600 outline-none transition-all font-medium"
            value={name} onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
          <input 
            type="tel" required placeholder="e.g. 9876543210"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-0 focus:border-indigo-600 outline-none transition-all font-medium"
            value={phone} onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 mt-4">
          {loading ? 'Processing...' : (isLogin ? 'Enter Arena' : 'Register as Participant')}
        </button>
      </form>
    </div>
  );
}