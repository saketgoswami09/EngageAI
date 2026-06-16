import { useEffect, useState } from 'react';
import Layout from '../components/Layout'; // Ensure path is correct for your project
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { UploadCloud, Eye, Trash2, FileText, Loader2, FileUp, CheckCircle } from 'lucide-react';

// Modern Tailwind semantic colors context tracking for validation checks
const STATUS_BADGE = { 
  pending: 'text-gray-600 bg-gray-50 border-gray-200', 
  processing: 'text-blue-600 bg-blue-50 border-blue-200', 
  valid: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
  invalid: 'text-amber-700 bg-amber-50 border-amber-200', 
  failed: 'text-rose-700 bg-rose-50 border-rose-200' 
};

/* ── Reusable Premium Empty State ────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600 shadow-sm shrink-0">
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 max-w-[260px] leading-relaxed">{subtitle}</p>
    </div>
  );
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/api/documents?limit=50');
      setDocuments(data.data.documents);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('userId', '000000000000000000000000'); // placeholder preserved
    try {
      await api.post('/api/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded & processing OCR...');
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { 
      setUploading(false); 
      e.target.value = ''; 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/api/documents/${id}`);
      toast.success('Deleted successfully');
      setDocuments(d => d.filter(x => x._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch { 
      toast.error('Delete failed'); 
    }
  };

  return (
    <Layout title="Knowledge Base Docs">
      <div className="max-w-[1400px] w-full mx-auto p-8">
        <div className="flex gap-8 items-start">
          
          {/* ── LEFT PANE: DOCUMENTS INDEX LIST ── */}
          <div className="flex-1 min-w-0 space-y-6">
            
            {/* Action Bar Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Documents</h1>
                <p className="text-sm text-gray-500 mt-1">Context storage mapping vector chunks into live system configurations.</p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-black rounded-xl transition-all shadow-sm cursor-pointer select-none disabled:opacity-50">
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-white/70" />
                    <span>Uploading logs...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>Upload Resource</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.webp,.pdf" 
                  onChange={handleUpload} 
                  className="hidden" 
                  disabled={uploading} 
                />
              </label>
            </div>

            {/* Structured Border Matrix Container */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">File Resource</th>
                      <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">OCR Engine Status</th>
                      <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <Loader2 size={24} className="animate-spin text-indigo-600 opacity-50 mx-auto" />
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState 
                            icon={FileUp} 
                            title="No documents mapped yet" 
                            subtitle="Upload primary PDFs or raw images to start pipeline ingestion loops." 
                          />
                        </td>
                      </tr>
                    ) : documents.map(doc => {
                      const isActive = selected?._id === doc._id;
                      return (
                        <tr 
                          key={doc._id} 
                          onClick={() => setSelected(doc)}
                          className={`cursor-pointer transition-colors ${isActive ? 'bg-indigo-50/40' : 'hover:bg-gray-50/50'}`}
                        >
                          <td className="px-6 py-4 max-w-[240px] truncate font-semibold text-gray-900 text-[14px]">
                            {doc.originalName || doc.filename}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-600 bg-gray-100 uppercase">
                              {doc.documentType || 'RAW'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${STATUS_BADGE[doc.validationStatus] || 'text-gray-500 bg-gray-50'}`}>
                              {doc.validationStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px] text-gray-500">
                            {doc.createdAt ? format(new Date(doc.createdAt), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <a 
                                href={doc.storageUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <Eye size={15} />
                              </a>
                              <button 
                                onClick={() => handleDelete(doc._id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ── RIGHT PANE: FLOATING STICKY EXTRACTED CONTEXT PANEL ── */}
          {selected && (
            <div className="w-[340px] bg-white border border-gray-100 rounded-2xl p-5 shadow-lg shrink-0 sticky top-6 animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <FileText size={16} className="text-indigo-600" />
                  <span>Metadata Context</span>
                </h3>
                <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase font-bold">Details</span>
              </div>

              {/* Document Media Preview Box */}
              <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 h-40 group flex items-center justify-center">
                <img 
                  src={selected.storageUrl} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={e => { e.target.style.display = 'none'; }} 
                />
              </div>

              <div className="text-xs font-medium text-gray-500 line-clamp-2 break-all bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-mono">
                {selected.originalName}
              </div>

              {/* Custom Parsed Fields Loop */}
              {selected.extractedFields && Object.keys(selected.extractedFields).length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-500" /> Extracted Properties
                  </div>
                  <div className="border border-gray-50 rounded-xl divide-y divide-gray-50 overflow-hidden">
                    {Object.entries(selected.extractedFields).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-start gap-4 p-2.5 text-xs bg-white">
                        <span className="text-gray-400 capitalize shrink-0 font-medium">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-900 font-semibold text-right break-all">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OCR Deep Content Block */}
              {selected.ocrText && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Indexed OCR Text Layer</div>
                  <div className="text-[11.5px] text-gray-500 max-h-32 overflow-y-auto bg-gray-50/80 border border-gray-100 p-3 rounded-xl font-mono leading-relaxed custom-scrollbar whitespace-pre-wrap">
                    {selected.ocrText}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSelected(null)}
                className="w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl transition-all"
              >
                Dismiss View
              </button>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}