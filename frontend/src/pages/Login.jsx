import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MessageSquare, Eye, EyeOff, Loader2, Clipboard, Key } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Quick Access Helper for Recruiters
  const handleQuickAccess = (type, value) => {
    navigator.clipboard.writeText(value);
    if (type === 'email') {
      setEmail(value);
      toast.success('Email copied & filled!');
    } else {
      setPassword(value);
      toast.success('Password copied & filled!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans text-gray-900">
      
      {/* Main Login Card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 p-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        
        {/* Logo and Header Block */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare size={22} className="text-white" />
          </div>
          <div className="pt-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">EngageAI</h1>
            <p className="text-xs text-gray-500 mt-1">Sign in to your admin dashboard</p>
          </div>
        </div>

        {/* ─── NEW: RECRUITER QUICK ACCESS WIDGET ─── */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key size={12} className="text-indigo-500" /> Recruiter Quick Access
            </span>
            <button 
              type="button"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('admin123');
                toast.success('All fields loaded!');
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              Fill All
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {/* Email Quick-Fill Action Button */}
            <button
              type="button"
              onClick={() => handleQuickAccess('email', 'admin@example.com')}
              className="flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-100 hover:border-gray-200 rounded-lg group transition-all text-xs text-gray-600 focus:outline-none"
            >
              <span className="truncate pr-2">
                <span className="text-gray-400 font-medium mr-1">Email:</span> admin@example.com
              </span>
              <Clipboard size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>

            {/* Password Quick-Fill Action Button */}
            <button
              type="button"
              onClick={() => handleQuickAccess('password', 'admin123')}
              className="flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-100 hover:border-gray-200 rounded-lg group transition-all text-xs text-gray-600 focus:outline-none"
            >
              <span>
                <span className="text-gray-400 font-medium mr-1">Pass:</span> admin123
              </span>
              <Clipboard size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* Input Interactive Fields Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address</label>
            <input
              id="email"
              type="email"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5 relative">
            <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full flex justify-center items-center py-2.5 px-4 text-sm font-semibold rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed pt-3 cursor-pointer"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin text-white/80" /> : 'Sign In'}
          </button>
        </form>

        {/* Info Helper Footer */}
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-2.5">
          <span className="text-sm leading-none pt-0.5">💡</span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-700 font-semibold"></strong> This deployment showcases the core platform architecture and AI workflow.

For simplicity, the current demo operates on a single WhatsApp Business account. Multi-tenant support is part of the planned roadmap.

Feel free to explore the dashboard, conversations, leads, and analytics using the demo account <code className="px-1 py-0.5 rounded bg-gray-200/50 text-gray-700 font-mono text-[10px]">POST /api/auth/register</code>.
          </p>
        </div>

      </div>
    </div>
  );
}