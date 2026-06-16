import { useEffect, useState } from 'react';
import Layout from '../components/Layout'; // Ensure path is correct
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Search, RefreshCw, Users, Wifi, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_LIST = ['all', 'new', 'contacted', 'qualified', 'converted', 'paid', 'lost'];

// Tailwind v4 specific token mapping for badges
const BADGE_MAP = { 
  new: 'text-blue-700 bg-blue-50 border border-blue-200', 
  contacted: 'text-amber-700 bg-amber-50 border border-amber-200', 
  qualified: 'text-indigo-700 bg-indigo-50 border border-indigo-200', 
  converted: 'text-emerald-700 bg-emerald-50 border border-emerald-200', 
  paid: 'text-teal-700 bg-teal-50 border border-teal-200', 
  lost: 'text-rose-700 bg-rose-50 border border-rose-200' 
};

const TRANSITIONS = { 
  new: ['contacted', 'lost'], 
  contacted: ['qualified', 'lost'], 
  qualified: ['converted', 'lost'], 
  converted: ['paid', 'lost'], 
  paid: [], 
  lost: ['new'] 
};

/* ── Premium Tailwind Empty State ────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 text-indigo-600 shadow-sm">
        <Icon size={28} />
      </div>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-[13px] text-gray-500 max-w-[300px] leading-relaxed mb-6">{subtitle}</p>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
        >
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchLeads(); }, [page, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page, 
        limit: 20, 
        ...(statusFilter !== 'all' && { status: statusFilter }), 
        ...(search && { search }) 
      });
      const { data } = await api.get(`/api/leads?${params}`);
      setLeads(data.data.leads);
      setTotal(data.data.total);
    } catch (err) {
      toast.error('Failed to fetch leads');
    } finally { 
      setLoading(false); 
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.patch(`/api/leads/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { 
      setUpdating(null); 
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <Layout title="Lead Management">
      <div className="max-w-[1400px] w-full mx-auto p-8 space-y-6">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Leads Pipeline</h1>
            <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total leads recorded</p>
          </div>
          <button 
            onClick={fetchLeads}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-gray-400" : "text-gray-500"} /> 
            Refresh
          </button>
        </div>

        {/* ── Search & Filters Bar ── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-2 pl-4 rounded-2xl border border-gray-100 shadow-sm">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              className="w-full pl-7 pr-4 py-2 text-[14px] bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-400 text-gray-900" 
              placeholder="Search name, phone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && fetchLeads()} 
            />
          </div>

          <div className="hidden lg:block w-px h-6 bg-gray-100 mx-2"></div>

          {/* Segmented Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto custom-scrollbar pb-2 lg:pb-0">
            {STATUS_LIST.map(s => {
              const isActive = statusFilter === s;
              return (
                <button 
                  key={s} 
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all capitalize ${
                    isActive 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Data Table ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-center">Follow-ups</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Loader2 size={24} className="animate-spin text-indigo-600 opacity-50 mx-auto" />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <EmptyState
                        icon={statusFilter !== 'all' ? Users : Wifi}
                        title={statusFilter !== 'all' ? `No "${statusFilter}" leads` : 'No leads yet'}
                        subtitle={statusFilter !== 'all'
                          ? `There are no leads with "${statusFilter}" status. Try a different filter.`
                          : 'Connect your WhatsApp number to start capturing leads from customer conversations.'}
                        actionLabel={statusFilter !== 'all' ? undefined : 'Connect WhatsApp'}
                        onAction={() => navigate('/settings')}
                      />
                    </td>
                  </tr>
                ) : leads.map(lead => (
                  <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-[14px] font-semibold text-gray-900">
                      {lead.name || <span className="text-gray-400 font-medium">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-600 font-mono tracking-tight">
                      {lead.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${BADGE_MAP[lead.status] || 'text-gray-600 bg-gray-50 border border-gray-200'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500 capitalize">
                      {lead.source || 'Direct'}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-600 font-medium text-center">
                      {lead.followUpCount || 0}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500">
                      {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {TRANSITIONS[lead.status]?.length > 0 ? (
                        <div className="relative inline-block text-left">
                          <select 
                            className="appearance-none bg-white border border-gray-200 text-gray-700 text-[12px] font-medium py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            value="" 
                            onChange={e => e.target.value && updateStatus(lead._id, e.target.value)}
                            disabled={updating === lead._id}
                          >
                            <option value="" disabled>Move to...</option>
                            {TRANSITIONS[lead.status].map(s => (
                              <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="inline-block text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          Terminal State
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination Logic ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              const isActive = page === pageNum;
              return (
                <button 
                  key={pageNum} 
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}