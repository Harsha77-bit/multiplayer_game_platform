import React, { useState } from 'react';
import { Gamepad2 } from 'lucide-react';

const AVATARS = ['👾', '🤖', '👻', '👽', '🤠', '🦸', '🥷', '🧙'];

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      onLogin({ username: username.trim(), avatar, roomId: roomId.trim().toLowerCase() });
    }
  };

  return (
    <div className="glass-panel p-8 w-full max-w-md flex flex-col items-center animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue"></div>
      
      <div className="bg-dark-900 p-4 rounded-full border border-dark-700 mb-6 relative">
        <div className="absolute inset-0 rounded-full animate-pulse-fast opacity-50 bg-neon-blue blur-xl"></div>
        <Gamepad2 size={48} className="text-neon-blue relative z-10" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">ENTER NEXUS</h2>
      <p className="text-gray-400 mb-8 text-center text-sm">Join the lobby to start playing or creating.</p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Choose Avatar</label>
          <div className="flex flex-wrap justify-center gap-3 bg-dark-900 p-4 rounded-xl border border-dark-700">
            {AVATARS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  avatar === a ? 'bg-dark-700 ring-2 ring-neon-blue scale-110 shadow-[0_0_15px_rgba(0,243,255,0.5)]' : 'hover:bg-dark-800 opacity-60 hover:opacity-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Callsign</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username..."
            className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
            required
            maxLength={15}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Room Code</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="e.g. ALPHA_SQUAD"
            className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all uppercase"
            required
            maxLength={15}
          />
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !roomId.trim()}
          className="mt-4 w-full bg-gradient-to-r from-neon-blue to-blue-600 hover:from-blue-400 hover:to-neon-blue text-white font-bold py-3 rounded-lg uppercase tracking-widest shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Initialize
        </button>
      </form>
    </div>
  );
}

export default Login;
