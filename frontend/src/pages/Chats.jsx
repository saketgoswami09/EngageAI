import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout'; // Ensure path is correct for your project
import api from '../api/axios'; // Restored your original axios instance
import { format } from 'date-fns';
import { RefreshCw, Bot, MessageSquare, Wifi, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = { 
  active: 'text-emerald-700 bg-emerald-50 border border-emerald-200', 
  bot: 'text-indigo-700 bg-indigo-50 border border-indigo-200', 
  agent: 'text-amber-700 bg-amber-50 border border-amber-200', 
  closed: 'text-gray-600 bg-gray-50 border border-gray-200', 
  idle: 'text-gray-600 bg-gray-50 border border-gray-200' 
};

function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 text-indigo-600 shadow-sm">
        <Icon size={28} />
      </div>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-[13px] text-gray-500 max-w-[260px] leading-relaxed mb-6">{subtitle}</p>
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

export default function Chats() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // RESTORED: Your exact original live data fetching logic for conversations
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/conversations?limit=50');
      setConversations(data.data.conversations);
    } finally { 
      setLoading(false); 
    }
  };

  // RESTORED: Your exact original live data fetching logic for selected message threads
  const selectConversation = async (conv) => {
    setSelected(conv);
    setMsgLoading(true);
    try {
      const { data } = await api.get(`/api/conversations/${conv._id}/messages?limit=100`);
      setMessages(data.data.messages);
    } finally { 
      setMsgLoading(false); 
    }
  };

  return (
    <Layout title="Chats">
      <div className="flex h-[calc(100vh-72px)] w-full overflow-hidden bg-white">
        
        {/* ─── CONVERSATION LIST ────────────────────────────────────────── */}
        <div className="w-[340px] flex flex-col border-r border-gray-100 bg-white shrink-0 z-10">
          <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="font-semibold text-[15px] tracking-tight text-gray-900">Conversations</span>
            <button 
              onClick={fetchConversations} 
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-indigo-600 opacity-50" />
              </div>
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={Wifi}
                title="No conversations yet"
                subtitle="Connect your WhatsApp number to start receiving messages from customers."
                actionLabel="Go to Settings"
                onAction={() => navigate('/settings')}
              />
            ) : (
              conversations.map(conv => {
                const isActive = selected?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => selectConversation(conv)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-indigo-50/60 border-indigo-100/60 shadow-[0_1px_2px_rgba(99,102,241,0.05)]' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-semibold text-[14px] truncate pr-2 ${isActive ? 'text-indigo-950' : 'text-gray-900'}`}>
                        {conv.userId?.name || conv.phone}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${STATUS_BADGE[conv.status] || 'text-gray-600 bg-gray-50'}`}>
                        {conv.status || 'IDLE'}
                      </span>
                    </div>
                    <div className="text-[13px] text-gray-500 font-medium font-mono tracking-tight">{conv.phone}</div>
                    <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
                      <span>{conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'MMM d, HH:mm') : '—'}</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">{conv.messageCount} msgs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── CHAT THREAD ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-[#F8F9FC] relative">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                subtitle="Pick a chat from the list on the left to view messages and AI responses."
              />
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="h-16 px-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div>
                  <h3 className="font-semibold text-[15px] text-gray-900">{selected.userId?.name || selected.phone}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {selected.phone} <span className="mx-1.5 text-gray-300">•</span> {selected.messageCount} messages
                  </p>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar relative">
                {msgLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#F8F9FC]/80 backdrop-blur-sm z-10">
                    <Loader2 size={28} className="animate-spin text-indigo-600" />
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div 
                        key={msg._id} 
                        className={`flex flex-col max-w-[75%] ${isOutbound ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <div className={`px-4 py-3 rounded-[18px] text-[14.5px] leading-relaxed shadow-sm transition-all ${
                          isOutbound
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          {msg.content}
                          
                          {/* AI Context Badge */}
                          {msg.generatedByAI && (
                            <div className={`mt-2.5 pt-2.5 border-t flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase ${
                              isOutbound ? 'border-indigo-500 text-indigo-100' : 'border-gray-100 text-gray-400'
                            }`}>
                              <Bot size={12} className={isOutbound ? 'text-indigo-200' : 'text-gray-400'} />
                              <span>AI Generated</span>
                              <span className="mx-0.5 opacity-50">•</span>
                              <span>{msg.tokensUsed} tokens</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-gray-400 mt-1.5 px-1.5">
                          {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-1 shrink-0" />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}