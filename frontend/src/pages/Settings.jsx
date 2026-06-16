import { useEffect, useState } from 'react';
import Layout from '../components/Layout'; // Ensure path is correct
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/settings')
      .then(r => setSettings(r.data.data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/api/settings', {
        botName: settings.botName,
        aiEnabled: settings.aiEnabled,
        aiDailyTokenBudget: parseInt(settings.aiDailyTokenBudget),
        aiMaxCallsPerUserPerHour: parseInt(settings.aiMaxCallsPerUserPerHour),
        autoFollowUpEnabled: settings.autoFollowUpEnabled,
        followUpDelayHours: parseInt(settings.followUpDelayHours),
      });
      setSettings(data.data.settings);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { 
      setSaving(false); 
    }
  };

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <Layout title="System Settings">
      <div className="max-w-[1400px] w-full mx-auto p-8 space-y-6">
        
        {/* Header Block */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure automation variables and AI instance clusters.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <Loader2 size={24} className="animate-spin text-indigo-600 opacity-50" />
          </div>
        ) : settings && (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Cards Allocation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Bot Config */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>🤖</span> Bot Configuration
                </h3>
                
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Bot Instance Name</label>
                  <input 
                    type="text"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium" 
                    value={settings.botName} 
                    onChange={e => update('botName', e.target.value)} 
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="space-y-0.5">
                    <label className="block text-[13px] font-semibold text-gray-800">AI Responses</label>
                    <p className="text-xs text-gray-400 font-medium">Allow automated LLM generative replies</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update('aiEnabled', !settings.aiEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.aiEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        settings.aiEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Cost Control */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>💰</span> Cost Control
                </h3>
                
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Daily Token Budget</label>
                  <input 
                    type="number" 
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium" 
                    value={settings.aiDailyTokenBudget}
                    onChange={e => update('aiDailyTokenBudget', e.target.value)} 
                    min={1000} 
                    required
                  />
                  <p className="text-[11px] text-gray-400 font-medium">Tokens allocation threshold across runtime channels (free tier system limit).</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Max AI Calls / User / Hour</label>
                  <input 
                    type="number" 
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium" 
                    value={settings.aiMaxCallsPerUserPerHour}
                    onChange={e => update('aiMaxCallsPerUserPerHour', e.target.value)} 
                    min={1} 
                    max={100} 
                    required
                  />
                </div>
              </div>

              {/* 3. Follow-up */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>📬</span> Follow-up Settings
                </h3>
                
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                  <div className="space-y-0.5">
                    <label className="block text-[13px] font-semibold text-gray-800">Auto Follow-up</label>
                    <p className="text-xs text-gray-400 font-medium">Trigger sequences on communication delay</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update('autoFollowUpEnabled', !settings.autoFollowUpEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.autoFollowUpEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        settings.autoFollowUpEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Follow-up Delay (hours)</label>
                  <input 
                    type="number" 
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 font-medium" 
                    value={settings.followUpDelayHours}
                    onChange={e => update('followUpDelayHours', e.target.value)} 
                    min={1} 
                    max={168} 
                    disabled={!settings.autoFollowUpEnabled}
                  />
                </div>
              </div>

              {/* 4. Integration Status */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                    <span>🔗</span> Integration Status
                  </h3>
                  
                  <div className="divide-y divide-gray-50">
                    {[
                      ['WhatsApp Cloud API', settings.whatsappConfigured],
                      ['AI Provider (Groq/OpenAI)', settings.aiApiKeyConfigured],
                      ['Cloud Storage (Cloudinary)', settings.cloudinaryConfigured],
                    ].map(([label, ok]) => (
                      <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <span className="text-[13px] font-medium text-gray-600">{label}</span>
                        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${
                          ok 
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                            : 'text-rose-700 bg-rose-50 border-rose-100'
                        }`}>
                          {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          <span>{ok ? 'Connected' : 'Disconnected'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                  ⚠️ API tokens are safely provisioned via structural environment variables (<code className="px-1 py-0.5 rounded bg-gray-200/50 font-mono font-semibold text-gray-700 text-[10px]">.env</code> configurations) — never directly serialized inside primary databases.
                </p>
              </div>

            </div>

            {/* Save Button Action Row */}
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </Layout>
  );
}