import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, User, Clock, MessageSquare, Headset, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import SkeuSelect from './ui/SkeuSelect';
import SkeuDatePicker from './ui/SkeuDatePicker';

interface Message {
    id?: number;
    sender: 'user' | 'assistant' | 'admin' | 'system';
    message: string;
    timestamp: string;
    chat_type?: string;
}

interface ChatSession {
    id: string;
    status: string;
    chat_type: string;
    created_at: string;
    updated_at: string;
    messages: Message[];
}

const AdminSupport: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const today = new Date().toISOString().split('T')[0];
    const [appliedDate, setAppliedDate] = useState<string>(today);
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [isUserTyping, setIsUserTyping] = useState<Record<string, boolean>>({});
    const notificationSound = useRef<HTMLAudioElement | null>(null);
    const socketRef = useRef<any>(null);
    const activeSessionIdRef = useRef<string | undefined>(undefined);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isEmitTypingRef = useRef(false);

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    const fetchSessions = async () => {
        try {
            const statusParam = statusFilter === 'all' ? 'active,waiting' : statusFilter;
            const res = await axios.get(`${API_BASE_URL}/api/support/sessions?type=LIVE&date=${appliedDate}&status=${statusParam}`, { headers: getAuthHeaders() });
            setSessions(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch sessions error:", err);
            setLoading(false);
        }
    };

    const fetchActiveSound = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/public/settings/notification-sound`);
            if (res.data.url) {
                notificationSound.current = new Audio(res.data.url);
            } else {
                // Fallback to default if no sound is selected
                notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            }
        } catch (err) {
            console.error("Error fetching active sound:", err);
            notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        }
    };

    useEffect(() => {
        fetchActiveSound();
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // Poll for new sessions
        return () => clearInterval(interval);
    }, [appliedDate, statusFilter]);

    const playNotification = () => {
        if (notificationSound.current) {
            notificationSound.current.currentTime = 0;
            notificationSound.current.play().catch(e => console.log("Audio play blocked", e));
        }
    };

    useEffect(() => {
        activeSessionIdRef.current = selectedSession?.id;
        if (selectedSession) {
            setMessages(selectedSession.messages || []);
            // Join socket room only if the session is not ended
            if (socketRef.current && selectedSession.status !== 'ended') {
                socketRef.current.emit('join_support', { session_id: selectedSession.id, role: 'admin' });
            }
        }
    }, [selectedSession]);

    useEffect(() => {
        socketRef.current = io(API_BASE_URL, { transports: ['websocket'] });

        socketRef.current.on('receive_live_message', (msg: Message) => {
            if (msg.sender === 'user') playNotification();

            const isForActiveSession = (msg as any).session_id === activeSessionIdRef.current;

            if (isForActiveSession) {
                setMessages(prev => {
                    const exists = prev.some(m => m.id === msg.id && msg.id !== undefined);
                    if (exists) return prev;
                    return [...prev, msg];
                });
            }

            // Update session list with new message
            setSessions(prev => {
                return prev.map(s => {
                    if ((msg as any).session_id === s.id) {
                        return { ...s, messages: [...(s.messages || []), msg] };
                    }
                    return s;
                });
            });
        });

        socketRef.current.on('new_support_request', () => {
            playNotification();
            fetchSessions();
        });

        socketRef.current.on('typing_start', (data: any) => {
            if (data.sender === 'user') {
                setIsUserTyping(prev => ({ ...prev, [data.session_id || activeSessionIdRef.current]: true }));
            }
        });

        socketRef.current.on('typing_stop', (data: any) => {
            if (data.sender === 'user') {
                setIsUserTyping(prev => ({ ...prev, [data.session_id || activeSessionIdRef.current]: false }));
            }
        });

        socketRef.current.on('chat_ended', (data: any) => {
            setSessions(prev => prev.map(s => {
                if (s.id === data.session_id) {
                    const updatedSession = { ...s, status: 'ended' };
                    if (data.systemMessage) {
                        updatedSession.messages = [...(s.messages || []), data.systemMessage];
                    }
                    return updatedSession;
                }
                return s;
            }));

            if (activeSessionIdRef.current === data.session_id) {
                setSelectedSession(prev => prev ? { ...prev, status: 'ended' } : null);
                if (data.systemMessage) {
                    setMessages(prev => [...prev, data.systemMessage]);
                }
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !selectedSession) return;

        socketRef.current.emit('send_live_message', {
            session_id: selectedSession.id,
            message: inputValue,
            sender: 'admin'
        });

        isEmitTypingRef.current = false;
        socketRef.current.emit('typing_stop', { session_id: selectedSession.id, sender: 'admin' });
        setInputValue('');
    };

    const handleInputChange = (val: string) => {
        setInputValue(val);
        if (selectedSession && socketRef.current) {
            if (!isEmitTypingRef.current) {
                isEmitTypingRef.current = true;
                socketRef.current.emit('typing_start', { session_id: selectedSession.id, sender: 'admin' });
            }

            // Auto-stop typing after 3 seconds of no activity
            if ((window as any).typingTimeout) clearTimeout((window as any).typingTimeout);
            (window as any).typingTimeout = setTimeout(() => {
                isEmitTypingRef.current = false;
                socketRef.current.emit('typing_stop', { session_id: selectedSession.id, sender: 'admin' });
            }, 3000);
        }
    };

    const handleCloseSession = () => {
        if (!selectedSession || selectedSession.status === 'ended') return;

        socketRef.current.emit('admin_close_session', {
            session_id: selectedSession.id
        });
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] gap-6 antialiased">
            {/* Session List */}
            <div className="w-80 skeu-card flex flex-col !overflow-visible bg-white/50 backdrop-blur-sm">
                <div className="p-4 warm-divider border-b flex flex-col gap-3 rounded-t-[32px]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-textPrimary flex items-center gap-2">
                            <MessageSquare size={16} /> Sessions
                        </h2>
                        <button onClick={fetchSessions} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                            <Clock size={14} className="text-textSecondary" />
                        </button>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-textSecondary uppercase tracking-widest">
                            <Filter size={12} /> Filters
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <SkeuSelect
                                options={[
                                    { label: 'All Statuses', value: 'all' },
                                    { label: 'Active', value: 'active' },
                                    { label: 'Waiting', value: 'waiting' },
                                    { label: 'Ended', value: 'ended' }
                                ]}
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
                <div className="flex-1 overflow-y-auto p-2 space-y-2 rounded-b-[32px]">
                    {loading ? (
                        <div className="flex items-center justify-center p-10"><div className="w-6 h-6 rounded-full animate-spin border-2 border-t-transparent" style={{ borderColor: '#E7E0D5', borderTopColor: '#B45309' }} /></div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-xs font-bold text-textSecondary uppercase opacity-50">No Chats Found</p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className={`w-full text-left p-4 rounded-xl transition-all ${selectedSession?.id === session.id
                                    ? 'skeu-btn-primary scale-[1.02] shadow-amber-500/20'
                                    : 'bg-white hover:bg-stone-50 border border-stone-200/60 shadow-sm'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-tighter truncate max-w-[120px] ${selectedSession?.id === session.id ? 'text-white' : 'text-textPrimary'}`}>
                                        {session.id}
                                    </span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${session.status === 'waiting' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                                        {isUserTyping[session.id] ? 'Typing...' : session.status}
                                    </span>
                                </div>
                                <div className={`text-[9px] font-medium truncate ${selectedSession?.id === session.id ? 'text-white/80' : 'text-textSecondary'}`}>
                                    {session.messages?.[session.messages.length - 1]?.message || "No messages yet"}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 skeu-card flex flex-col overflow-hidden bg-white/80 backdrop-blur-md relative">
                <AnimatePresence mode="wait">
                    {selectedSession ? (
                        <motion.div
                            key={selectedSession.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full"
                        >
                            {/* Chat Header */}
                            <div className="p-4 warm-divider border-b flex items-center justify-between bg-white/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-textPrimary tracking-tight uppercase">Customer: {selectedSession.id.split('_')[1] || selectedSession.id}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isUserTyping[selectedSession.id] ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`} />
                                            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">
                                                {isUserTyping[selectedSession.id] ? 'Typing...' : 'In Live Chat'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedSession.status !== 'ended' && (
                                        <button
                                            onClick={handleCloseSession}
                                            className="px-3 py-1.5 skeu-btn-dark text-[9px] uppercase tracking-widest"
                                        >
                                            Close Session
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-stone-50/20 to-transparent">
                                {messages.map((msg, i) => (
                                    <React.Fragment key={i}>
                                        {msg.chat_type === 'SYSTEM' ? (
                                            <div className="flex justify-center my-6">
                                                <span className="bg-stone-200/50 text-stone-500 font-bold text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                                    {msg.message}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.sender === 'admin'
                                                    ? 'skeu-btn-primary font-bold rounded-tr-none'
                                                    : msg.sender === 'assistant'
                                                        ? 'bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-none font-medium italic text-amber-900'
                                                        : 'bg-white border border-stone-200 rounded-2xl rounded-tl-none text-textPrimary'
                                                    }`}>
                                                    {msg.message}
                                                    <div className={`text-[8px] mt-1 uppercase font-bold tracking-widest opacity-40 ${msg.sender === 'admin' ? 'text-white' : 'text-textSecondary'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Input - Only show for LIVE active chats */}
                            {selectedSession.status === 'ended' ? (
                                <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-center min-h-[100px]">
                                    <div className="flex flex-col items-center gap-1.5 text-textSecondary">
                                        <MessageSquare size={16} className="text-stone-300" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Customer left the chat</span>
                                        <span className="text-xs font-medium opacity-60">Input is disabled until the user reconnects.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-white/50 border-t border-stone-100 backdrop-blur-sm relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Type your response to customer..."
                                            className="w-full skeu-input py-4 pl-5 pr-14 text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                            value={inputValue}
                                            onChange={e => handleInputChange(e.target.value)}
                                            onBlur={() => {
                                                if (selectedSession && socketRef.current) {
                                                    socketRef.current.emit('typing_stop', { session_id: selectedSession.id, sender: 'admin' });
                                                }
                                            }}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim()}
                                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${inputValue.trim() ? 'skeu-btn-primary scale-100 shadow-lg' : 'text-stone-300 opacity-50 scale-90'}`}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-1.5 opacity-40">
                                            <Headset size={10} className="text-indigo-600" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-textPrimary">Meet My Star Live Support Interface</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
                            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
                                <MessageSquare size={40} className="text-textSecondary" />
                            </div>
                            <h3 className="text-lg font-black text-textPrimary uppercase tracking-widest mb-2">Select a Conversation</h3>
                            <p className="max-w-xs text-xs font-bold text-textSecondary uppercase leading-relaxed">Choose an active session from the left to start assisting customers in real-time.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminSupport;
