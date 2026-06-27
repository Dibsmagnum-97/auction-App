import React, { useState } from 'react';

export default function Registration({ onRegister }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('OWNER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Prepare data matching your FastAPI backend format
      const formData = new FormData();
      formData.append('username', username);
      formData.append('role', role);
      
      // Creating a dummy image blob to satisfy the backend's image requirement 
      // without cluttering your new UI with an upload button.
      const dummyImage = new Blob(["dummy"], { type: "image/jpeg" });
      formData.append('image', dummyImage, "dummy.jpg");

      // 2. Call the API (Change localhost to your Render URL if testing live!)
      // Example: 'https://your-backend-app.onrender.com/register'
      const response = await fetch('https://auction-app-hfsu.onrender.com/register', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Authentication failed. Backend might be down.');
      }

      const data = await response.json();
      
      // 3. Pass the true database user object to the App to grant access
      onRegister(data.user);

    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-fit mt-10 mx-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Identify Yourself</h2>
      <p className="text-gray-500 mb-6">Enter your credentials to access the bidding room.</p>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Username / Franchise Name</label>
          <input 
            type="text" required 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" 
            placeholder="e.g. Mumbai Titans"
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Account Role</label>
          <select 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
            value={role} onChange={(e) => setRole(e.target.value)}
          >
            <option value="OWNER">Franchise Owner (Bidder)</option>
            <option value="ADMIN">Auction Admin (Moderator)</option>
          </select>
        </div>

        <button 
          type="submit" disabled={loading}
          className={`w-full text-white font-bold py-3.5 rounded-lg transition-all shadow-md mt-4 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {loading ? 'Authenticating with Server...' : 'Join Auction Room'}
        </button>
      </form>
    </div>
  );
}