import React, { useState } from 'react';

export default function Registration({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    // Clean payload: just Name, Phone, and Division
    const payload = isLogin ? { name, phone } : { name, phone, gender };

    try {
      const response = await fetch(`https://auction-app-hfsu.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 h-fit mt-10 transition-colors">
      
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Login</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Sign Up</button>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{isLogin ? 'Welcome Back' : 'Join the Draft'}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {isLogin ? 'Enter your details to continue.' : 'Register to enter the draft pool.'}
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-800">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
          <input type="text" required placeholder="John Doe" className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-0 focus:border-indigo-600 outline-none transition-all font-medium" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
          <input type="tel" required placeholder="e.g. 9876543210" className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-0 focus:border-indigo-600 outline-none transition-all font-medium" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        
        {!isLogin && (
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Division</label>
            <select className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:ring-0 focus:border-indigo-600 outline-none transition-all font-medium" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg mt-4 uppercase tracking-wider">
          {loading ? 'Processing...' : (isLogin ? 'Enter Arena' : 'Submit Registration')}
        </button>

        {/* ADMIN APPROVAL WARNING (ONLY SHOWS ON SIGNUP) */}
        {!isLogin && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center font-bold">
            Your registration requires Admin approval before you are eligible to be drafted.
          </p>
        )}
      </form>
    </div>
  );
}