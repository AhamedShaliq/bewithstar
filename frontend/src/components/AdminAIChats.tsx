import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Clock, MessageSquare, Headset, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import SkeuSelect from './ui/SkeuSelect';
import SkeuDatePicker from './ui/SkeuDatePicker';

interface Message {
    id: number;
    sender: 'USER' | 'AI' | 'SUPPORT';
    content: string;
    created_at: string;
}

interface MetaData {
    user_name?: string;
    user_email?: string;
    star_name?: string;
}

interface ChatSession {
    id: string;
    status: 'active' | 'waiting' | 'ended';
    chat_type: 'AI' | 'LIVE';
    created_at: string;
    updated_at: string;
    messages: Message[];
    metadata?: MetaData;
}

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Ended', value: 'ended' },
    { label: 'All Statuses', value: 'all' } // Added 'All' option for AI chats
];

const AdminAIChats = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters matching the new pattern
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const today = new Date().toISOString().split('T')[0];
    const [appliedDate, setAppliedDate] = useState<string>(today);
    const [selectedDate, setSelectedDate] = useState<string>(today);

    const fetchSessions = async () => {
        try {
            // For AI chats, if status is 'all', we send empty status to get everything for that date
            const statusParam = statusFilter === 'all' ? '' : statusFilter;
            const res = await axios.get(`${API_BASE_URL}/api/support/sessions?type=AI&date=${appliedDate}&status=${statusParam}`, { headers: getAuthHeaders() });
            setSessions(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch sessions error:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // Poll for new sessions
        return () => clearInterval(interval);
    }, [appliedDate, statusFilter]);

    // Select the first session automatically if none is selected and sessions load
    useEffect(() => {
        if (!selectedSession && sessions.length > 0) {
            setSelectedSession(sessions[0]);
        }
    }, [sessions, selectedSession]);


    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
            {/* Sidebar List */}
            <div className="w-1/3 flex flex-col skeu-card shadow-sm border border-[#E7E0D5] !overflow-visible bg-white/50">
                <div className="p-4 bg-gradient-to-b from-stone-50 to-white border-b border-stone-100 flex-shrink-0 rounded-t-[32px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-inner">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight text-textPrimary">AI Chat Logs</h2>
                            <p className="text-[10px] uppercase font-bold text-textSecondary tracking-widest leading-tight">View-only analytics</p>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="flex flex-col gap-3 pt-3 mt-2 border-t border-stone-100">
                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 text-[10px] font-black text-textSecondary uppercase tracking-widest">
                                <Filter size={12} /> Filters
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <SkeuSelect
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={(v) => setStatusFilter(v)}
                                    placeholder="Filter by Status"
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <SkeuDatePicker
                                    value={selectedDate}
                                    onChange={(date) => setSelectedDate(date)}
                                    className="flex-1"
                                    allowPastDates={true}
                                />
                                <button
                                    onClick={() => setAppliedDate(selectedDate)}
                                    className="skeu-btn-primary min-w-[70px] text-[10px] py-3 uppercase tracking-widest"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 rounded-b-[32px]">
                    {loading ? (
                        <div className="flex items-center justify-center p-10"><div className="w-6 h-6 rounded-full animate-spin border-2 border-t-transparent" style={{ borderColor: '#E7E0D5', borderTopColor: '#10b981' }} /></div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                                <MessageSquare size={20} className="text-stone-300" />
                            </div>
                            <p className="text-xs font-bold text-textSecondary uppercase opacity-50 tracking-widest">No AI Chats Found</p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-200 border group
                                        ${selectedSession?.id === session.id
                                        ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-stone-200 hover:shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-stone-300'}`} />
                                        <span className="text-xs font-bold text-textPrimary truncate max-w-[120px]">
                                            {session.metadata?.user_name || "Guest User"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-textSecondary font-semibold uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatTime(session.updated_at)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-textSecondary font-medium">
                                    <Bot size={12} className="text-emerald-500" />
                                    <span className="truncate">Talked about {session.metadata?.star_name || "a star"}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col skeu-card shadow-sm border border-[#E7E0D5] overflow-hidden bg-white/50 relative">
                {selectedSession ? (
                    <>
                        <div className="p-4 bg-gradient-to-b from-stone-50 to-white border-b border-stone-100 flex justify-between items-center shadow-sm relative z-10 w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                                    <Headset size={20} className="text-textSecondary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-textPrimary">{selectedSession.metadata?.user_name || "Guest User"}</h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full 
                                            ${selectedSession.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}`}>
                                            {selectedSession.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-textSecondary flex items-center gap-2 mt-0.5 font-medium">
                                        <Bot size={12} />
                                        <span>Automated AI Response Log</span>
                                        {selectedSession.metadata?.star_name && (
                                            <>
                                                <span>•</span>
                                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    Re: {selectedSession.metadata.star_name}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
                            {selectedSession.messages.map((msg, idx) => {
                                const isAI = msg.sender === 'AI';
                                const showAvatar = idx === 0 || selectedSession.messages[idx - 1].sender !== msg.sender;

                                return (
                                    <div key={msg.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'} group`}>
                                        <div className={`flex gap-3 max-w-[75%] ${!isAI && 'flex-row-reverse'}`}>

                                            {showAvatar ? (
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 border mt-1
                                                    ${isAI
                                                        ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-600'
                                                        : 'bg-white border-stone-200 text-textSecondary'}`}
                                                >
                                                    {isAI ? <Bot size={16} /> : <MessageSquare size={16} />}
                                                </div>
                                            ) : <div className="w-8 flex-shrink-0" />}

                                            <div className={`flex flex-col ${!isAI ? 'items-end' : 'items-start'}`}>
                                                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatTime(msg.created_at)}
                                                </span>
                                                <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm relative text-left whitespace-pre-wrap
                                                    ${isAI
                                                        ? 'bg-white border border-stone-200 text-textPrimary rounded-2xl rounded-tl-sm'
                                                        : 'bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 text-white rounded-2xl rounded-tr-sm'}`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-textSecondary bg-stone-50">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center mb-4">
                            <Bot size={32} className="text-stone-300" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest">Select an AI Chat</p>
                        <p className="text-xs font-medium mt-1 opacity-70">View past automated interactions</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAIChats;
