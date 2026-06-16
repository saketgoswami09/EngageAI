import { useEffect, useState } from 'react';
import Layout from '../components/Layout'; // Ensure path is correct for your project
import { 
  Users, MessageSquare, TrendingUp, FileText, Target, 
  Info, ArrowUp, ArrowDown, ChevronDown, Check, Settings
} from 'lucide-react';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-blue-500 bg-blue-50/50 border-blue-100' },
  contacted: { label: 'Contacted', color: 'text-amber-500 bg-amber-50/50 border-amber-100' },
  qualified: { label: 'Qualified', color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100' },
  converted: { label: 'Converted', color: 'text-emerald-500 bg-emerald-50/50 border-emerald-100' },
  paid: { label: 'Paid', color: 'text-teal-500 bg-teal-50/50 border-teal-100' },
  lost: { label: 'Lost', color: 'text-rose-500 bg-rose-50/50 border-rose-100' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('1 Y');

  useEffect(() => {
    // Tumhara actual API call yahan aayega
    // api.get('/api/analytics/overview').then(...)
    
    const timer = setTimeout(() => {
      setStats({
        users: { total: 12450, newToday: 12 },
        messages: { total: 84320, today: 340 },
        conversations: { active: 129, total: 2450 },
        leads: { 
          conversionRate: '24%', total: 1212, new: 45, contacted: 112, 
          qualified: 89, converted: 24, paid: 18, lost: 5 
        },
        documents: { total: 32 },
        ai: { dailyTokensUsed: 18202, dailyBudget: 20000 }
      });
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const budgetPct = stats ? Math.min(100, Math.round((stats.ai.dailyTokensUsed / stats.ai.dailyBudget) * 100)) : 0;

  return (
    <Layout title="Dashboard">
      <div className="max-w-[1400px] w-full mx-auto p-8 space-y-8">
        
        {/* Status System Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100">
            <Check size={14} />
            <span>Last updated now</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Settings size={15} className="text-gray-400" />
            <span>Customize Viewport</span>
          </button>
        </div>

        {/* Loading Matrix Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[135px] border border-gray-100 rounded-2xl animate-pulse bg-gray-50/50" />
            ))}
          </div>
        ) : (
          <>
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiWidget 
                icon={<Target size={18} />} 
                title="Active Conversations" 
                value={stats?.conversations.active} 
                sub="vs last week" 
                trend="up" 
                trendVal="2%" 
              />
              <KpiWidget 
                icon={<MessageSquare size={18} />} 
                title="Messages Processed" 
                value={stats?.messages.today} 
                sub="total logs tracked" 
                trend="down" 
                trendVal="4%" 
              />
              <KpiWidget 
                icon={<Users size={18} />} 
                title="Conversion Metrics" 
                value={stats?.leads.conversionRate} 
                sub="vs initial benchmark" 
                trend="up" 
                trendVal="2%" 
              />
            </div>

            {/* Platform Resource Layout System */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Token & System Budget Chart */}
              <div className="lg:col-span-2 border border-gray-100 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">AI Compute Resources</h3>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <div className="flex items-center text-xs font-medium text-gray-400 gap-1 bg-gray-50/80 border border-gray-100 p-1 rounded-xl">
                    {['1 D', '1 W', '1 M', '1 Y'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setActivePeriod(p)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${activePeriod === p ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-700'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold tracking-tight">{stats?.ai.dailyTokensUsed.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 font-medium">tokens spent today out of {stats?.ai.dailyBudget.toLocaleString()} allocation</span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${budgetPct > 80 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium flex justify-between">
                    <span>Resource Usage Efficiency</span>
                    <span className="font-semibold text-gray-700">{budgetPct}% utilization</span>
                  </p>
                </div>
              </div>

              {/* Data Documents */}
              <div className="border border-gray-100 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 tracking-tight">Knowledge Base Core</h4>
                  <p className="text-xs text-gray-400">Context matrix uploaded into live AI clusters</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-indigo-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats?.documents.total} Indexed</div>
                    <div className="text-xs text-gray-400 font-medium">Vector chunks functional</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Lifecycle */}
            <div className="border border-gray-100 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Lead Lifecycle Pipeline</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Comprehensive funnel matrix tracking conversational states</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.keys(STATUS_CONFIG).map(status => {
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div key={status} className={`p-4 border rounded-xl flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01] ${cfg.color}`}>
                      <span className="text-xs font-semibold tracking-wide uppercase opacity-80">{cfg.label}</span>
                      <span className="text-3xl font-bold tracking-tight">{stats?.leads[status] || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

// Widget Subcomponent
function KpiWidget({ icon, title, value, sub, trend, trendVal }) {
  const isUp = trend === 'up';
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between text-gray-400">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-700">
            {icon}
          </div>
          <span className="text-xs font-semibold tracking-tight text-gray-500">{title}</span>
        </div>
        <Info size={15} className="text-gray-300 hover:text-gray-400 cursor-pointer" />
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <span className="text-3xl font-bold tracking-tight text-gray-900">{value}</span>
        <div className="flex flex-col items-end text-right">
          <span className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${
            isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
          }`}>
            {isUp ? <ArrowUp size={10} className="mr-0.5" /> : <ArrowDown size={10} className="mr-0.5" />}
            {trendVal}
          </span>
          <span className="text-[10px] text-gray-400 font-medium mt-1">{sub}</span>
        </div>
      </div>
    </div>
  );
}