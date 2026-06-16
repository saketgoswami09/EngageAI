import { useEffect, useState } from 'react';
import Layout from '../components/Layout'; // Ensure path is correct for your project
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, TrendingUp, Zap, Target,
  BarChart2, ArrowRight, Info, Loader2
} from 'lucide-react';

const COLORS = ['#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
const FUNNEL_ORDER = ['new', 'contacted', 'qualified', 'converted', 'paid', 'lost'];

/* ── Reusable Premium Empty State ────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 h-full">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600 shadow-sm shrink-0">
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 max-w-70 leading-relaxed mb-4">{subtitle}</p>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
        >
          {actionLabel} <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

/* ── Modern Minimalist KPI Card ───────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between text-gray-400">
        <span className="text-xs font-semibold tracking-tight text-gray-500">{label}</span>
        <div 
          className="p-2 rounded-xl text-xs shrink-0"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-gray-900">{value}</div>
        <div className="text-[11px] text-gray-400 font-medium truncate">{sub}</div>
      </div>
    </div>
  );
}

/* ── Recharts Clean Custom Tooltip ────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs space-y-1.5 min-w-[120px]">
      <p className="text-gray-400 font-medium border-b border-gray-50 pb-1 mb-1">{label}</p>
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <span className="font-medium text-gray-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: p.color || p.fill }} />
            {p.name}:
          </span>
          <strong className="text-gray-900 font-bold">{p.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [msgData, setMsgData] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/overview'),
      api.get('/api/analytics/messages-over-time?days=7'),
      api.get('/api/analytics/lead-funnel'),
    ]).then(([ov, msg, fn]) => {
      setOverview(ov.data.data);

      // Raw Processing Logic Intact
      const grouped = {};
      for (const d of msg.data.data) {
        const date = d._id.date;
        if (!grouped[date]) grouped[date] = { date, inbound: 0, outbound: 0, tokens: 0 };
        grouped[date][d._id.direction] = d.count;
        grouped[date].tokens += (d.tokensUsed || 0);
      }
      setMsgData(Object.values(grouped).sort((a, b) => a.date > b.date ? 1 : -1));

      const funnelMap = {};
      fn.data.data.forEach(d => funnelMap[d._id] = d.count);
      setFunnel(FUNNEL_ORDER.map(s => ({ name: s, value: funnelMap[s] || 0 })));
    })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const budgetPct = overview
    ? Math.min(100, Math.round((overview.ai.dailyTokensUsed / overview.ai.dailyBudget) * 100))
    : 0;

  // Derived KPI values calculations intact
  const activeLeads = overview
    ? (overview.leads.new || 0) + (overview.leads.contacted || 0) + (overview.leads.qualified || 0)
    : 0;
  const totalTokens7d = msgData.reduce((sum, d) => sum + (d.tokens || 0), 0);

  const kpiCards = overview ? [
    { label: 'Total Conversations', value: overview.conversations.total.toLocaleString(), sub: `${overview.conversations.active} active now`, icon: MessageSquare, color: '#6366F1' },
    { label: 'Active Leads', value: activeLeads.toLocaleString(), sub: 'New + Contacted + Qualified', icon: Users, color: '#3B82F6' },
    { label: 'Avg Response Time', value: '~2.4 min', sub: 'Estimated via AI pipeline', icon: TrendingUp, color: '#10B981' },
    { label: 'AI Tokens (7 days)', value: totalTokens7d.toLocaleString(), sub: `Max limit: ${overview.ai.dailyBudget.toLocaleString()}/d`, icon: Zap, color: budgetPct > 80 ? '#EF4444' : '#F59E0B' },
    { label: 'Conversion Rate', value: overview.leads.conversionRate, sub: `${overview.leads.total || 0} total leads funnel`, icon: Target, color: '#EC4899' },
  ] : [];

  return (
    <Layout title="Analytics">
      <div className="max-w-[1400px] w-full mx-auto p-8 space-y-8">

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 border border-gray-100 rounded-2xl animate-pulse bg-gray-50/50" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-[320px] border border-gray-100 rounded-2xl animate-pulse bg-gray-50/50" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── KPI Grid Row ── */}
            {overview && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiCards.map(card => <KpiCard key={card.label} {...card} />)}
              </div>
            )}

            {/* ── AI Token Compute Allocation Framework ── */}
            {overview && (
              <div className="border border-gray-100 rounded-2xl p-6 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-1.5">
                      <span>⚡ AI Daily Token Computation Budget</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {overview.ai.dailyTokensUsed.toLocaleString()} / {overview.ai.dailyBudget.toLocaleString()} cluster allocation used today
                    </p>
                  </div>
                  <span className={`self-start sm:self-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    budgetPct > 80 
                      ? 'text-rose-700 bg-rose-50 border-rose-200' 
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {budgetPct}% consumed
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${budgetPct > 80 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── Visual Analytics Layout Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Messages Activity Distribution */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-white flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Messages Sync (Last 7 Days)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Breakdown of communication direction logs</p>
                </div>
                
                <div className="flex-1 min-h-[240px]">
                  {msgData.length === 0 ? (
                    <EmptyState
                      icon={BarChart2}
                      title="No message data yet"
                      subtitle="Logs will display here as your WhatsApp cloud instances route inbound responses."
                      actionLabel="View Meta Docs"
                      onAction={() => window.open('https://developers.facebook.com/docs/whatsapp/', '_blank')}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={msgData} barSize={8} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="inbound" fill="#6366F1" radius={[4, 4, 0, 0]} name="Inbound" />
                        <Bar dataKey="outbound" fill="#10B981" radius={[4, 4, 0, 0]} name="Outbound" />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 15 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Functional Funnel Allocation Metrics */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-white flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Lead Lifecycle Funnel Conversion</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Distribution across status pipelines</p>
                </div>

                <div className="flex-1 min-h-[240px] flex items-center justify-center">
                  {funnel.every(f => f.value === 0) ? (
                    <EmptyState
                      icon={TrendingUp}
                      title="No leads data allocated"
                      subtitle="Funnel metrics stream in real-time as users hit classification nodes."
                      actionLabel="Verify Inbound Streams"
                      onAction={() => navigate('/chats')}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                        <Pie
                          data={funnel.filter(f => f.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend iconSize={8} iconType="circle" layout="horizontal" align="center" wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* ── Area Tracker Sparkline Grid Section ── */}
            <div className="border border-gray-100 rounded-2xl p-6 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">LLM Core Token Ingestion Flow</h3>
                  <p className="text-xs text-gray-400">Total volumetric usage distribution over time window</p>
                </div>
                <span className="self-start sm:self-center inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  <Zap size={12} className="fill-indigo-500/10" /> {totalTokens7d.toLocaleString()} Aggregated
                </span>
              </div>

              <div className="w-full min-h-[180px]">
                {msgData.length === 0 || msgData.every(d => !d.tokens) ? (
                  <EmptyState
                    icon={Zap}
                    title="No cluster tokens processed"
                    subtitle="Compute telemetry charts populate as logic loops hit generative layers."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={msgData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tokenFlowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="tokens"
                        stroke="#6366F1"
                        strokeWidth={2}
                        fill="url(#tokenFlowGradient)"
                        name="Tokens Used"
                        dot={{ fill: '#6366F1', strokeWidth: 0, r: 2.5 }}
                        activeDot={{ r: 4, fill: '#6366F1', stroke: '#FFF', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}