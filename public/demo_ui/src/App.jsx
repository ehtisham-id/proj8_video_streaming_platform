import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Play, Trash2, LogOut, User, CreditCard, Activity } from 'lucide-react';

const API_BASE = 'http://localhost';

const App = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
      setView('videos');
    }
  }, []);

  const handleAuth = async (e, isLogin) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
      ...(formData.get('name') ? { name: formData.get('name') } : {})
    };
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        // auth service returns { accessToken, refreshToken }
        const tokenValue = data.accessToken || data.token || data.access_token || data.access;
        if (data.refreshToken) {
          try { localStorage.setItem('refreshToken', data.refreshToken); } catch (e) { }
        }
        localStorage.setItem('token', tokenValue);
        setUser({ token: tokenValue });
        setView('videos');
        showMessage(isLogin ? 'Logged in' : 'Account created');
        fetchVideos();
      } else {
        showMessage(data.message || 'Auth failed');
      }
    } catch (err) {
      showMessage('Network error');
    }
    setLoading(false);
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
    } catch (err) { }
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
    setVideos([]);
    showMessage('Logged out');
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_BASE}/videos`, {
        headers: { 'Authorization': `Bearer ${user?.token || localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setVideos(data.videos || []);
    } catch (err) {
      showMessage('Failed to load videos');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setLoading(true);
    try {
      const token = user?.token || localStorage.getItem('token');
      if (!token) {
        showMessage('Not authenticated');
        setLoading(false);
        e.target.value = '';
        return;
      }

      const res = await fetch(`${API_BASE}/videos/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('Video uploaded');
        fetchVideos();
      } else {
        showMessage(data.message || 'Upload failed');
      }
    } catch (err) {
      showMessage('Upload error');
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return;
    try {
      const res = await fetch(`${API_BASE}/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        showMessage('Video deleted');
        fetchVideos();
      }
    } catch (err) {
      showMessage('Delete failed');
    }
  };

  const playVideo = (videoId) => {
    setView('player');
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = `${API_BASE}/stream/${videoId}/master.m3u8`;
        videoRef.current.load();
      }
    }, 100);
  };

  const AuthView = ({ isLogin }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 animate-fade-in">
        <div className="flex justify-center mb-8">
          <Camera className="w-16 h-16 text-purple-400 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <form onSubmit={(e) => handleAuth(e, isLogin)} className="space-y-6">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full name"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button
          onClick={handleGoogleAuth}
          className="w-full mt-4 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <p className="text-center mt-6 text-gray-300">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setView(isLogin ? 'signup' : 'login')}
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );

  const VideosView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">VideoStream</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('subscription')}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pro
            </button>
            <button
              onClick={() => setView('metrics')}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <label className="flex items-center justify-center gap-3 w-full px-6 py-8 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition">
            <Upload className="w-6 h-6 text-purple-400" />
            <span className="text-white font-semibold">
              {loading ? 'Uploading...' : 'Upload Video'}
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-purple-500 transition group"
            >
              <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Play className="w-16 h-16 text-white/50" />
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2 truncate">
                  {video.title || video.filename || 'Untitled'}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => playVideo(video.id)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && !loading && (
          <div className="text-center py-20">
            <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No videos yet. Upload your first video!</p>
          </div>
        )}
      </div>
    </div>
  );

  const PlayerView = () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-6xl p-4">
        <button
          onClick={() => setView('videos')}
          className="mb-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
        >
          ← Back
        </button>
        <video
          ref={videoRef}
          controls
          className="w-full rounded-xl shadow-2xl"
          autoPlay
        >
          Your browser does not support HLS video playback.
        </video>
      </div>
    </div>
  );

  const SubscriptionView = () => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
      fetchStatus();
    }, []);

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/subscriptions/status`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) setStatus(data);
      } catch (err) { }
    };

    const handleSubscribe = async () => {
      try {
        const res = await fetch(`${API_BASE}/subscriptions/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ plan: 'pro' })
        });
        if (res.ok) {
          showMessage('Subscription started');
          fetchStatus();
        }
      } catch (err) {
        showMessage('Subscription failed');
      }
    };

    const handleCancel = async () => {
      try {
        const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          showMessage('Subscription cancelled');
          fetchStatus();
        }
      } catch (err) {
        showMessage('Cancellation failed');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-8">
        <button
          onClick={() => setView('videos')}
          className="mb-8 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
        >
          ← Back
        </button>
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">Subscription</h2>
          {status && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <p className="text-white">Status: <span className="text-purple-400 font-semibold">{status.active ? 'Active' : 'Inactive'}</span></p>
            </div>
          )}
          <div className="space-y-4">
            <button
              onClick={handleSubscribe}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Start Pro Plan - $9.99/mo
            </button>
            <button
              onClick={handleCancel}
              className="w-full py-4 bg-red-600/20 text-red-300 rounded-lg font-semibold hover:bg-red-600/30 transition"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MetricsView = () => {
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
      fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/metrics/streaming`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) setMetrics(data);
      } catch (err) { }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-8">
        <button
          onClick={() => setView('videos')}
          className="mb-8 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
        >
          ← Back
        </button>
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">Metrics</h2>
          {metrics ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">{key}</p>
                  <p className="text-white text-2xl font-bold">{JSON.stringify(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60">Loading metrics...</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {message && (
        <div className="fixed top-4 right-4 px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg z-50 animate-fade-in">
          {message}
        </div>
      )}

      {view === 'login' && <AuthView isLogin={true} />}
      {view === 'signup' && <AuthView isLogin={false} />}
      {view === 'videos' && <VideosView />}
      {view === 'player' && <PlayerView />}
      {view === 'subscription' && <SubscriptionView />}
      {view === 'metrics' && <MetricsView />}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default App;