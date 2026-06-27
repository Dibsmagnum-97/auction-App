import React, { useState } from 'react';

export default function Registration({ view, setView, onAuthenticate }) {
  
  // Handles Mock Authentication
  const handleAuth = (e, mockName, mockRole) => {
    e.preventDefault();
    onAuthenticate({ name: mockName, role: mockRole });
    setView('auction'); // Send them to the live room
  };

  if (view === 'login') {
    return (
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-fit mt-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-500 mb-8">Sign in to access the auction arena.</p>
        <form onSubmit={(e) => handleAuth(e, "Demo Owner", "OWNER")} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input type="email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="owner@franchise.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md">
            Log In
          </button>
        </form>
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-fit mt-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-500 mb-8">Register as an Owner or Participant.</p>
        <form onSubmit={(e) => handleAuth(e, "New User", "OWNER")} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
              <input type="text" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
              <input type="text" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none bg-white">
              <option value="OWNER">Franchise Owner (Bidder)</option>
              <option value="PARTICIPANT">Candidate (Auctioned)</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md">
            Create Account
          </button>
        </form>
      </div>
    );
  }

  if (view === 'contact') {
    return (
      <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-xl border border-gray-100 h-fit mt-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h2>
        <p className="text-gray-500 mb-8">Have a question about the auction? Drop us a message.</p>
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Message Sent!"); setView('home'); }}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
            <input type="text" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
            <textarea rows="5" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none resize-none"></textarea>
          </div>
          <button type="submit" className="bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-lg hover:bg-indigo-700 transition-all shadow-md">
            Send Message
          </button>
        </form>
      </div>
    );
  }

  return null;
}