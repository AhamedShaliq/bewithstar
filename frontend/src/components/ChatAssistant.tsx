import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Star as StarIcon, Headset } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Lottie from 'lottie-react';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage } from '../utils/imageUtils';
import dazzbitLogo from '../assets/dazzbit-logo.json';

interface Star {
    id: number;
    name: string;
    category: string;
    image_url: string;
}

interface Message {
    id?: number;
    sender: 'user' | 'assistant' | 'admin' | 'system';
    message: string;
    suggestions?: string[];
    stars?: Star[];
    showForm?: boolean;
    timestamp?: string;
    chat_type?: 'AI' | 'LIVE' | 'SYSTEM';
}

// Exported utility handles this now
const StarCard: React.FC<{ star: Star, onInquire: (s: Star) => void }> = ({ star, onInquire }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="skeu-card overflow-hidden flex flex-col w-32 shrink-0 cursor-pointer group"
        onClick={() => onInquire(star)}
    >
        <div className="h-24 bg-stone-100 relative overflow-hidden">
            <img
                src={getPrimaryImage(star.image_url)}
                alt={star.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute top-1 right-1 skeu-badge px-1 py-0.5 rounded shadow-sm scale-75">
                <StarIcon size={8} fill="currentColor" />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Inquire</span>
            </div>
        </div>
        <div className="p-2 bg-white/50">
            <p className="text-[10px] font-black text-textPrimary truncate uppercase">{star.name}</p>
            <p className="text-[8px] font-extrabold text-amber-600 uppercase tracking-tighter opacity-80">{star.category}</p>
        </div>
    </motion.div>
);

const ChatInquiryForm: React.FC<{ star?: Star, onSubmitSuccess: () => void }> = ({ star, onSubmitSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '', company: '', email: '', phone: '', message: star ? `I am interested in inquiring about ${star.name}.` : ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/contact`, {
                full_name: formData.fullName,
                company: formData.company,
                email: formData.email,
                phone: formData.phone,
                star_id: star?.id || null,
                message: formData.message,
                event_type: 'Chat Inquiry',
                country: sessionStorage.getItem('user_country') || 'Unknown'
            });
            setSuccess(true);
            setTimeout(onSubmitSuccess, 2000);
        } catch (err) {
            console.error("Form error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (success) return (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
            <p className="text-xs font-bold text-emerald-700">Inquiry Sent Successfully!</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3 bg-stone-100/50 p-4 rounded-2xl border border-stone-200/50 mt-3 shadow-inner">
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest pl-1">Full Name *</label>
                <input
                    required
                    type="text"
                    className="w-full skeu-input text-xs p-2.5"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest pl-1">Company / Organization</label>
                <input
                    type="text"
                    className="w-full skeu-input text-xs p-2.5"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest pl-1">Official Email Address</label>
                <input
                    required
                    type="email"
                    className="w-full skeu-input text-xs p-2.5"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest pl-1">Phone Number</label>
                <input
                    type="tel"
                    className="w-full skeu-input text-xs p-2.5"
                    placeholder="(555) 000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
            </div>
            <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest pl-1">Message</label>
                <textarea
                    required
                    rows={2}
                    className="w-full skeu-input text-xs p-2.5 resize-none"
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 skeu-btn-primary text-[10px] uppercase tracking-widest mt-1"
            >
                {loading ? 'Submitting...' : 'Send Inquiry'}
            </button>
        </form>
    );
};

const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const [isSupportConnected, setIsSupportConnected] = useState(false);
    const [isChatEnded, setIsChatEnded] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [chatMode, setChatMode] = useState<'AI' | 'LIVE'>('AI');
    const [selectedStar, setSelectedStar] = useState<Star | undefined>(undefined);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showInactivityPrompt, setShowInactivityPrompt] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<any>(null);
    const [hasJoinedLive, setHasJoinedLive] = useState(false);
    const pendingLiveMessageRef = useRef<string | null>(null);
    const isEmitTypingRef = useRef(false);

    const endChatSession = async (reason: string) => {
        if (!sessionId) return;
        try {
            await axios.post(`${API_BASE_URL}/api/chat/end`, {
                session_id: sessionId,
                reason,
                chatMode
            });
        } catch (e) {
            console.error('Failed to end chat explicitly', e);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (sessionId && !isChatEnded) {
                const blob = new Blob([JSON.stringify({ session_id: sessionId, reason: 'browser_closed', chatMode })], {
                    type: 'application/json'
                });
                navigator.sendBeacon(`${API_BASE_URL}/api/chat/end`, blob);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [sessionId, isChatEnded, chatMode]);

    const initializeSession = () => {
        let sid = localStorage.getItem('chat_session_id');
        let isNew = false;
        if (!sid) {
            sid = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
            localStorage.setItem('chat_session_id', sid);
            isNew = true;
        }
        setSessionId(sid);

        const fetchHistory = async () => {
            try {
                if (isNew) {
                    setMessages([{
                        sender: 'assistant',
                        message: "Welcome to Meet My Star. I am Dazzbit, your personal assistant. How can I assist your talent acquisition needs today?",
                        suggestions: ["Explore Talent", "Actors", "Influencers", "Speakers"],
                        chat_type: 'AI'
                    }]);
                    return;
                }
                const res = await axios.get(`${API_BASE_URL}/api/chat/history/${sid}`);
                if (res.data.length > 0) {
                    setMessages(res.data);
                } else {
                    setMessages([{
                        sender: 'assistant',
                        message: "Welcome to Meet My Star. I am Dazzbit, your personal assistant. How can I assist your talent acquisition needs today?",
                        suggestions: ["Explore Talent", "Actors", "Influencers", "Speakers"],
                        chat_type: 'AI'
                    }]);
                }
            } catch (err) {
                console.error("History fetch error:", err);
            }
        };

        fetchHistory();
    };

    // Initialize session and history
    useEffect(() => {
        initializeSession();
    }, []);

    // Prevent background scrolling when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Socket.io connection for Live mode
    useEffect(() => {
        if (hasJoinedLive && !socketRef.current && sessionId) {
            socketRef.current = io(API_BASE_URL, { transports: ['websocket'] });

            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_support', { session_id: sessionId });
                if (pendingLiveMessageRef.current) {
                    const country = sessionStorage.getItem('user_country') || 'unknown';
                    socketRef.current.emit('send_live_message', {
                        session_id: sessionId,
                        message: pendingLiveMessageRef.current,
                        sender: 'user',
                        country
                    });
                    pendingLiveMessageRef.current = null;
                }
            });

            socketRef.current.on('receive_live_message', (msg: Message) => {
                setLastActivity(Date.now()); // Reset inactivity on receiving a message
                setMessages(prev => {
                    if (msg.id && prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, { ...msg, chat_type: 'LIVE' }];
                });
                if (msg.sender === 'admin') {
                    setIsAgentTyping(false);
                    setIsSupportConnected(true);
                }
            });

            socketRef.current.on('agent_joined', () => {
                setIsSupportConnected(true);
            });

            socketRef.current.on('typing_start', (data: any) => {
                if (data.sender === 'admin') setIsAgentTyping(true);
            });

            socketRef.current.on('typing_stop', (data: any) => {
                if (data.sender === 'admin') setIsAgentTyping(false);
            });

            socketRef.current.on('chat_ended', (data: any) => {
                setIsChatEnded(true);
                setHasJoinedLive(false);
                if (data && data.systemMessage) {
                    setMessages(prev => [...prev, data.systemMessage]);
                }
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [hasJoinedLive, sessionId]);

    // Inactivity Timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (chatMode !== 'LIVE' || isChatEnded) return;

            const now = Date.now();
            const inactiveTime = now - lastActivity;

            if (inactiveTime > 8 * 60 * 1000) {
                endChatSession('inactivity');
                setIsChatEnded(true);
                setHasJoinedLive(false);
                setShowInactivityPrompt(false);
            } else if (inactiveTime > 5 * 60 * 1000 && isOpen && !showInactivityPrompt) {
                setShowInactivityPrompt(true);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [lastActivity, isOpen, showInactivityPrompt, chatMode, isChatEnded]);

    const resetChat = () => {
        endChatSession('user_left');

        if (chatMode === 'LIVE' && !isChatEnded) {
            setIsChatEnded(true);
            setHasJoinedLive(false);
            return;
        }

        localStorage.removeItem('chat_session_id');
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setChatMode('AI');
        setShowInactivityPrompt(false);
        setIsChatEnded(false);
        setIsSupportConnected(false);
        initializeSession();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);

    const handleInquire = (star: Star) => {
        setLastActivity(Date.now());
        setSelectedStar(star);
        setMessages(prev => [...prev, {
            sender: 'assistant',
            message: `Excellent choice. To provide an executive quote for ${star.name}, please provide a few more details below:`,
            showForm: true,
            chat_type: 'AI'
        }]);
    };

    const handleSendMessage = async (textOverride?: string) => {
        const text = textOverride || inputValue;
        if (!text.trim() && !isChatEnded) return;

        let activeSessionId = sessionId;

        if (isChatEnded) {
            setIsChatEnded(false);
            setIsSupportConnected(false); // Reset to waiting
            if (chatMode === 'LIVE') setHasJoinedLive(true);
        }

        if (!text.trim()) return;

        setLastActivity(Date.now());
        setShowInactivityPrompt(false);
        setInputValue('');

        if (chatMode === 'AI') {
            const userMsg: Message = { sender: 'user', message: text, chat_type: 'AI' };
            setMessages(prev => [...prev, userMsg]);
            setIsTyping(true);
            try {
                const country = sessionStorage.getItem('user_country') || 'unknown';
                const res = await axios.post(`${API_BASE_URL}/api/chat`, {
                    session_id: activeSessionId,
                    message: text,
                    sender: 'user',
                    country
                });
                if (res.data.assistantMessage) {
                    setTimeout(() => {
                        setIsTyping(false);
                        setMessages(prev => [...prev, res.data.assistantMessage]);
                    }, 800);
                }
            } catch (err) {
                console.error("Chat send error:", err);
                setIsTyping(false);
            }
        } else {

            isEmitTypingRef.current = false;
            if (socketRef.current) {
                socketRef.current.emit('typing_stop', { session_id: activeSessionId, sender: 'user' });
            }

            if (!socketRef.current) {
                // Socket will automatically connect on render due to sessionId state change and hasJoinedLive.
                // We queue the message.
                pendingLiveMessageRef.current = text;
                setHasJoinedLive(true);
            } else {
                const country = sessionStorage.getItem('user_country') || 'unknown';
                socketRef.current.emit('send_live_message', {
                    session_id: activeSessionId,
                    message: text,
                    sender: 'user',
                    country
                });
            }
        }
    };

    const toggleChat = (mode: 'AI' | 'LIVE') => {
        if (isOpen && chatMode === mode) {
            setIsOpen(false);
        } else {
            setChatMode(mode);
            if (mode === 'LIVE') setHasJoinedLive(true);
            setIsOpen(true);
            setLastActivity(Date.now());
        }
    };

    return (
        <div className="fixed bottom-0 right-0 z-[200] pointer-events-none md:pointer-events-auto w-full md:w-auto">
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Mobile Backdrop Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm md:hidden z-[-1]"
                                onClick={() => setIsOpen(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%", transition: { duration: 0.25 } }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed inset-x-0 bottom-0 z-[200] flex h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:fixed md:inset-auto md:bottom-24 md:right-4 md:h-[680px] md:w-[420px] md:rounded-3xl md:border md:border-stone-100"
                            >
                                {/* Header */}
                                <div className="p-5 flex items-center justify-between warm-divider border-b border-stone-200/60 bg-white/80 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            className={`w-14 h-14 flex items-center justify-center transition-all duration-300 ${chatMode === 'AI' ? '' : 'w-12 h-12 rounded-2xl skeu-button bg-indigo-500 text-white shadow-[0_4px_15px_rgba(79,70,229,0.3)]'}`}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {chatMode === 'AI' ? (
                                                <div className="w-16 h-16 scale-125">
                                                    <Lottie animationData={dazzbitLogo} loop={true} autoplay={true} />
                                                </div>
                                            ) : (
                                                <Headset size={24} strokeWidth={2.5} />
                                            )}
                                        </motion.div>
                                        <div>
                                            <h3 className="text-sm font-black text-textPrimary tracking-tight">
                                                {chatMode === 'AI' ? 'Dazzbit AI' : 'Live Specialist Support'}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${chatMode === 'AI' ? 'bg-emerald-500' : isSupportConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">
                                                    {chatMode === 'AI' ? 'Online' : isChatEnded ? 'Ended' : isSupportConnected ? 'Connected' : 'Waiting for Specialist...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {chatMode === 'LIVE' && !isChatEnded && messages.some(m => m.chat_type === 'LIVE') && (
                                            <button
                                                onClick={resetChat}
                                                className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                            >
                                                Leave Chat
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 rounded-full hover:bg-stone-200/50 transition-colors text-textSecondary hover:text-textPrimary"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div
                                    ref={scrollRef}
                                    data-lenis-prevent
                                    className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-stone-50/30 to-white overscroll-contain"
                                >
                                    <AnimatePresence mode="wait">
                                        {showInactivityPrompt && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                                className="p-4 skeu-card bg-amber-50/95 border-amber-200 shadow-xl mb-4 text-center sticky top-0 z-50 backdrop-blur-sm"
                                            >
                                                <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight mb-3">Are you still there? Chat will close soon.</p>
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setLastActivity(Date.now());
                                                            setShowInactivityPrompt(false);
                                                        }}
                                                        className="px-4 py-2 skeu-btn-primary text-[10px] uppercase font-bold"
                                                    >
                                                        I'm Here
                                                    </button>
                                                    <button
                                                        onClick={resetChat}
                                                        className="px-4 py-2 skeu-btn-dark text-[10px] uppercase font-bold"
                                                    >
                                                        Leave Chat
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {messages.filter(m => m.chat_type === chatMode).map((msg, i) => (
                                        <div key={i} className="space-y-4">
                                            {msg.sender === 'system' ? (
                                                <div className="flex justify-center my-6">
                                                    <span className="bg-stone-200/50 text-stone-500 font-bold text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                                        {msg.message}
                                                    </span>
                                                </div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.sender === 'user'
                                                        ? 'skeu-btn-primary font-bold rounded-tr-none'
                                                        : msg.sender === 'admin'
                                                            ? 'bg-indigo-600 text-white font-bold rounded-tl-none ring-4 ring-indigo-500/10 shadow-indigo-200 shadow-md'
                                                            : 'skeu-card bg-neutral-50 rounded-2xl rounded-tl-none p-4 border-stone-200/50 text-textPrimary'
                                                        }`}>
                                                        {msg.message}
                                                        {msg.sender === 'admin' && (
                                                            <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1 opacity-80">
                                                                <Headset size={10} />
                                                                <span className="text-[9px] uppercase tracking-widest font-black">Live Specialist</span>
                                                            </div>
                                                        )}
                                                        {msg.showForm && (
                                                            <ChatInquiryForm star={selectedStar} onSubmitSuccess={() => handleSendMessage("Request sent!")} />
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {msg.stars && msg.stars.length > 0 && (
                                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                                                    {msg.stars.map(star => (
                                                        <StarCard key={star.id} star={star} onInquire={handleInquire} />
                                                    ))}
                                                </div>
                                            )}

                                            {i === messages.length - 1 && msg.suggestions && msg.suggestions.length > 0 && !isTyping && chatMode === 'AI' && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {msg.suggestions.map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleSendMessage(suggestion)}
                                                            className="px-4 py-2 bg-white border border-amber-200 text-amber-900 rounded-full text-xs font-bold hover:bg-amber-50 transition-all shadow-sm"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(isTyping || isAgentTyping) && (
                                        <div className="flex justify-start">
                                            <div className="skeu-card rounded-2xl rounded-tl-none p-4 bg-neutral-50 flex gap-1.5 items-center">
                                                {isAgentTyping && <Headset size={10} className="text-indigo-600 mr-1" />}
                                                <span className="w-1 h-1 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1 h-1 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1 h-1 rounded-full bg-stone-400 animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-stone-100">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={isChatEnded ? "Chat has ended. Type to restart..." : chatMode === 'AI' ? "Type your inquiry..." : "Reply to support..."}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                if (chatMode === 'LIVE' && socketRef.current && !isChatEnded) {
                                                    if (!isEmitTypingRef.current) {
                                                        isEmitTypingRef.current = true;
                                                        socketRef.current.emit('typing_start', { session_id: sessionId, sender: 'user' });
                                                    }

                                                    if ((window as any).userTypingTimeout) clearTimeout((window as any).userTypingTimeout);
                                                    (window as any).userTypingTimeout = setTimeout(() => {
                                                        isEmitTypingRef.current = false;
                                                        socketRef.current?.emit('typing_stop', { session_id: sessionId, sender: 'user' });
                                                    }, 3000);
                                                }
                                            }}
                                            onBlur={() => {
                                                if (chatMode === 'LIVE' && socketRef.current) {
                                                    isEmitTypingRef.current = false;
                                                    socketRef.current.emit('typing_stop', { session_id: sessionId, sender: 'user' });
                                                }
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="w-full skeu-input py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-amber-500/20"
                                        />
                                        <button
                                            onClick={() => handleSendMessage()}
                                            disabled={!inputValue.trim() || isTyping}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${inputValue.trim() && !isTyping
                                                ? 'skeu-btn-primary'
                                                : 'text-stone-300 opacity-50 scale-90'
                                                }`}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-textSecondary mt-3 font-black uppercase tracking-widest opacity-50">
                                        {chatMode === 'AI' ? 'Powered by Dazzbit AI' : 'Live Chat with Support Specialist'}
                                    </p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Triggers */}
            <div className="fixed bottom-4 right-2 z-[190] flex flex-col items-end gap-3 px-2 pointer-events-auto">
                <div className="flex flex-col gap-5">
                    {/* Live Support Trigger */}
                    <div className="relative group">
                        <motion.button
                            animate={chatMode === 'LIVE' && isOpen ? { scale: 1.25, rotate: 360 } : { scale: 1.1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleChat('LIVE')}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${chatMode === 'LIVE' && isOpen
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/50 shadow-indigo-500/40'
                                : 'bg-white text-indigo-600 border-2 border-indigo-100'}`}
                        >
                            <Headset size={26} strokeWidth={2.5} />
                            {/* Pulsing indicator */}
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                            </span>
                        </motion.button>
                        {/* Tooltip */}
                        <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                            Support
                        </div>
                    </div>

                    {/* AI Bot Trigger */}
                    <div className="relative group">
                        <motion.button
                            animate={chatMode === 'AI' && isOpen ? { scale: 1.50 } : { scale: 1.25 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            whileHover={{ scale: 1.55 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleChat('AI')}
                            className={`w-16 h-16 flex items-center justify-center transition-all duration-500 ${chatMode === 'AI' && isOpen
                                ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                                : ''}`}
                        >
                            <div className="w-13 h-13 pointer-events-none scale-140">
                                <Lottie animationData={dazzbitLogo} loop={true} autoplay={true} />
                            </div>
                        </motion.button>
                        {/* Tooltip */}
                        <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-900 text-white text-[10px] font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                            Dazzbit AI
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;
