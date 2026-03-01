import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, Activity, Users, CalendarDays, Star, PlusCircle,
    Pencil, Trash2, X, CheckCircle, Mail, Globe, Building2, ChevronDown,
    Monitor, Smartphone, Tablet, BarChart3, Clock, TrendingUp
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { COUNTRIES } from '../utils/countries';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage, getAllImages } from '../utils/imageUtils';
import SkeuSelect from '../components/ui/SkeuSelect';
import AdminSupport from '../components/AdminSupport';
import AdminAIChats from '../components/AdminAIChats';
import AdminSettings from '../components/AdminSettings';
import PremiumSpinner from '../components/ui/PremiumSpinner';



// ── Types ────────────────────────────────────────────────────────
interface AnalyticsStat { event_type: string; _count: { id: number }; }
interface AnalyticsEvent {
    id: number;
    event_type: string;
    page: string | null;
    country: string | null;
    city: string | null;
    ip_address: string | null;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    session_id: string | null;
    timestamp: string;
}
interface DashboardData {
    totalRequests: number;
    stats: AnalyticsStat[];
    recentPageViews: AnalyticsEvent[];
    countryStats: { country: string; _count: { id: number } }[];
    deviceStats: { device_type: string; _count: { id: number } }[];
    dailyVisitsChart: { date: string; visits: number }[];
    engagementChart: { date: string; avgDuration: number }[];
    topPagesChart: { page: string; views: number }[];
}

interface StarRecord {
    id: number;
    name: string;
    category: string;
    country: string;
    short_bio: string;
    full_bio: string;
    image_url: string;
    availability_status: string;
    created_at: string;
    _count?: { requests: number };
}

interface ContactRequest {
    id: number;
    full_name: string;
    company: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    event_type: string;
    event_date: string | null;
    message: string;
    created_at: string;
    star: { name: string };
}

interface GlobalSettings {
    id: string;
    hero_show_cards: boolean;
    hero_show_image: boolean;
    hero_image_url: string | null;
}

const BLANK_STAR = {
    name: '', category: 'Actor', country: '', short_bio: '', full_bio: '', image_url: '', availability_status: 'Available'
};
const CATEGORIES = ['Actor', 'Musician', 'Athlete', 'Influencer', 'Speaker', 'Comedian', 'Politician', 'Other'];
const STATUSES = ['Available', 'Booked', 'Unavailable'];

// ── Skeuomorphic helpers ─────────────────────────────────────────
const skeuCard = "skeu-card p-6";
const inputCls = "skeu-input w-full px-4 py-2.5 text-sm text-textPrimary placeholder-textSecondary/60";
const labelCls = "block text-xs font-bold text-textPrimary mb-1.5 uppercase tracking-widest";

// ── Tab button ───────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${active ? 'skeu-btn-primary' : 'text-textSecondary hover:text-textPrimary'}`}
        style={active ? {} : { background: 'transparent' }}
    >{children}</button>
);

// ── Star Form Modal ──────────────────────────────────────────────
const StarFormModal = ({
    initial, onSave, onClose
}: {
    initial: typeof BLANK_STAR & { id?: number };
    onSave: (data: typeof BLANK_STAR) => Promise<void>;
    onClose: () => void;
}) => {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [imgTab, setImgTab] = useState<'url' | 'upload'>('url');
    const [urlInput, setUrlInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<string[]>(() => getAllImages(initial.image_url));

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    // Sync images array → form.image_url (JSON array)
    const syncImages = (imgs: string[]) => {
        setImages(imgs);
        setForm(f => ({ ...f, image_url: JSON.stringify(imgs) }));
    };

    const addUrl = () => {
        const url = urlInput.trim();
        if (!url) return;
        syncImages([...images, url]);
        setUrlInput('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('images', f));
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')} ` },
                body: formData,
            });
            if (res.ok) {
                const { urls } = await res.json();
                syncImages([...images, ...urls]);
            }
        } finally { setUploading(false); e.target.value = ''; }
    };

    const removeImage = (idx: number) => syncImages(images.filter((_, i) => i !== idx));
    const moveFirst = (idx: number) => { const arr = [...images]; arr.unshift(arr.splice(idx, 1)[0]); syncImages(arr); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) { alert('Please add at least one image.'); return; }
        setSaving(true);
        await onSave({ ...form, image_url: JSON.stringify(images) });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(28,25,23,0.6)', backdropFilter: 'blur(10px)' }}
        >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="skeu-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-textPrimary tracking-tight">
                        {initial.id ? 'Edit Star' : 'Add New Star'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-textSecondary hover:text-textPrimary"
                        style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.07)' }}
                    ><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={labelCls}>Name *</label>
                            <input className={inputCls} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cristiano Ronaldo" /></div>
                        <div className="relative"><label className={labelCls}>Country *</label>
                            <SkeuSelect
                                options={COUNTRIES.map(c => ({ label: c, value: c }))}
                                value={form.country}
                                onChange={val => set('country', val)}
                                placeholder="Select Country"
                            /></div>
                        <div className="relative"><label className={labelCls}>Category</label>
                            <SkeuSelect
                                options={CATEGORIES.map(c => ({ label: c, value: c }))}
                                value={form.category}
                                onChange={val => set('category', val)}
                            /></div>
                        <div className="relative"><label className={labelCls}>Availability</label>
                            <SkeuSelect
                                options={STATUSES.map(s => ({ label: s, value: s }))}
                                value={form.availability_status}
                                onChange={val => set('availability_status', val)}
                            /></div>
                    </div>

                    {/* ── Images Section ── */}
                    <div>
                        <label className={labelCls}>Images {images.length === 0 && <span className="text-red-400">(required)</span>}</label>

                        {/* Tab switcher */}
                        <div className="flex gap-1.5 mb-3 p-1 rounded-lg w-fit"
                            style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                            {(['url', 'upload'] as const).map(t => (
                                <button key={t} type="button" onClick={() => setImgTab(t)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${imgTab === t ? 'skeu-btn-primary' : 'text-textSecondary'}`}
                                    style={imgTab === t ? {} : { background: 'transparent' }}
                                >{t === 'url' ? '🔗 Paste URL' : '📁 Upload File'}</button>
                            ))}
                        </div>

                        {/* URL input */}
                        {imgTab === 'url' && (
                            <div className="flex gap-2">
                                <input className={`${inputCls} flex-1`} value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
                                    placeholder="https://example.com/photo.jpg" />
                                <button type="button" onClick={addUrl} className="skeu-btn-primary px-4 py-2 text-sm">Add</button>
                            </div>
                        )}

                        {/* File upload */}
                        {imgTab === 'upload' && (
                            <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all ${uploading ? 'opacity-60 pointer-events-none' : 'hover:border-amber-400'}`}
                                style={{ border: '2px dashed #D6CEC3', background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)' }}
                            >
                                <span className="text-2xl">{uploading ? '⏳' : '📷'}</span>
                                <span className="text-sm font-semibold text-textSecondary">{uploading ? 'Uploading…' : 'Click to select images (multiple allowed)'}</span>
                                <span className="text-xs text-textSecondary">JPG, PNG, WEBP — max 10 MB each</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        )}

                        {/* Image preview grid */}
                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {images.map((url, idx) => (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden"
                                        style={{ border: idx === 0 ? '2px solid #B45309' : '1px solid #E7E0D5', boxShadow: idx === 0 ? '0 0 0 1px #F59E0B40' : undefined }}
                                    >
                                        <img src={getPrimaryImage(url)} alt="" className="w-full h-20 object-cover" onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23F5F0E8"/><text x="40" y="45" text-anchor="middle" font-size="20">🖼️</text></svg>'; }} />
                                        {idx === 0 && <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(180deg,#F59E0B,#B45309)', color: '#fff' }}>Primary</span>}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                            {idx !== 0 && (
                                                <button type="button" onClick={() => moveFirst(idx)}
                                                    className="text-[10px] font-bold text-white bg-amber-600 px-1.5 py-0.5 rounded transition-all"
                                                    title="Set as primary"
                                                >★</button>
                                            )}
                                            <button type="button" onClick={() => removeImage(idx)}
                                                className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded"
                                                title="Remove"
                                            >✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-textSecondary mt-2 font-medium">First image = primary (shown on card). Hover to set primary or remove.</p>
                    </div>

                    <div><label className={labelCls}>Short Bio *</label>
                        <textarea className={`${inputCls} resize-none`} required rows={2} value={form.short_bio} onChange={e => set('short_bio', e.target.value)} placeholder="One-liner shown on the card..." /></div>
                    <div><label className={labelCls}>Full Bio *</label>
                        <textarea className={`${inputCls} resize-none`} required rows={4} value={form.full_bio} onChange={e => set('full_bio', e.target.value)} placeholder="Detailed biography shown in modal..." /></div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving} className={`skeu-btn-primary flex-1 py-3 text-sm uppercase tracking-widest ${saving ? 'opacity-60' : ''}`}>
                            {saving ? 'Saving…' : (initial.id ? 'Save Changes' : 'Add Star')}
                        </button>
                        <button type="button" onClick={onClose} className="skeu-btn-dark px-6 py-3 text-sm uppercase tracking-widest">Cancel</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────
const AdminPortal = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'overview' | 'stars' | 'requests' | 'support' | 'aichats' | 'settings'>('overview');
    const [settings, setSettings] = useState<GlobalSettings>({
        id: 'current',
        hero_show_cards: true,
        hero_show_image: false,
        hero_image_url: null
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [heroUploading, setHeroUploading] = useState(false);

    // Overview state
    const [data, setData] = useState<DashboardData | null>(null);
    // Stars state
    const [stars, setStars] = useState<StarRecord[]>([]);
    const [starsLoading, setStarsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingStar, setEditingStar] = useState<StarRecord | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [filterCat, setFilterCat] = useState('All');
    // Requests state
    const [requests, setRequests] = useState<ContactRequest[]>([]);
    const [reqLoading, setReqLoading] = useState(false);
    const [expandedReq, setExpandedReq] = useState<number | null>(null);

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')} `,
        'Content-Type': 'application/json'
    });

    // Auth guard + overview fetch
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/admin/login'); return; }
        fetch(`${API_BASE_URL}/api/analytics`, { headers: getAuthHeaders() })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setData)
            .catch(() => { localStorage.removeItem('token'); navigate('/admin/login'); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch stars
    const fetchStars = useCallback(async () => {
        setStarsLoading(true);
        const r = await fetch(`${API_BASE_URL}/api/admin/stars`, { headers: getAuthHeaders() });
        if (r.ok) setStars(await r.json());
        setStarsLoading(false);
    }, []);

    // Fetch requests
    const fetchRequests = useCallback(async () => {
        setReqLoading(true);
        const r = await fetch(`${API_BASE_URL}/api/admin/requests`, { headers: getAuthHeaders() });
        if (r.ok) setRequests(await r.json());
        setReqLoading(false);
    }, []);

    const fetchSettings = useCallback(async () => {
        setSettingsLoading(true);
        const r = await fetch(`${API_BASE_URL}/api/settings`);
        if (r.ok) setSettings(await r.json());
        setSettingsLoading(false);
    }, []);

    useEffect(() => { if (tab === 'stars') fetchStars(); }, [tab, fetchStars]);
    useEffect(() => { if (tab === 'requests') fetchRequests(); }, [tab, fetchRequests]);
    useEffect(() => { if (tab === 'settings') fetchSettings(); }, [tab, fetchSettings]);

    const saveSettings = async (newSettings: GlobalSettings) => {
        const r = await fetch(`${API_BASE_URL}/api/admin/settings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newSettings)
        });
        if (r.ok) setSettings(await r.json());
    };

    const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setHeroUploading(true);
        const formData = new FormData();
        formData.append('images', file);
        try {
            const r = await fetch(`${API_BASE_URL}/api/admin/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')} ` },
                body: formData
            });
            if (r.ok) {
                const { urls } = await r.json();
                const newSettings = { ...settings, hero_show_image: true, hero_image_url: urls[0] };
                await saveSettings(newSettings);
            }
        } catch (err) {
            console.error('Hero upload failed', err);
        } finally {
            setHeroUploading(false);
        }
    };

    const handleSaveStar = async (form: typeof BLANK_STAR) => {
        const isEdit = !!editingStar;
        const url = isEdit ? `${API_BASE_URL}/api/admin/stars/${editingStar!.id}` : `${API_BASE_URL}/api/admin/stars`;
        const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: getAuthHeaders(), body: JSON.stringify(form) });
        if (r.ok) { setShowForm(false); setEditingStar(null); fetchStars(); }
    };

    const handleDelete = async (id: number) => {
        await fetch(`${API_BASE_URL}/api/admin/stars/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setDeleteConfirm(null);
        fetchStars();
    };

    const statusColor = (s: string) => s === 'Available' ? '#B45309' : s === 'Booked' ? '#1D4ED8' : '#6B7280';

    const filteredStars = filterCat === 'All' ? stars : stars.filter(s => s.category === filterCat);

    return (
        <div className="min-h-screen text-textPrimary" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)' }}>
            {/* ── Navbar ── */}
            <div className="sticky top-0 z-50 border-b"
                style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,248,245,0.96))', borderColor: '#E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 8px rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center gap-4">
                        <a href="/" className="font-bold text-xl tracking-tighter text-textPrimary flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md" style={{ background: 'linear-gradient(135deg,#F59E0B,#B45309)', boxShadow: '0 1px 0 rgba(255,220,100,0.5) inset, 0 2px 4px rgba(180,83,9,0.25)' }} />
                            be<span className="text-textSecondary font-medium">withstar</span>
                        </a>
                        <span className="text-border text-lg">|</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-textSecondary">Admin</span>
                    </div>
                    <button onClick={() => { localStorage.removeItem('token'); navigate('/admin/login'); }}
                        className="flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-lg transition-all text-textSecondary hover:text-red-600"
                        style={{ background: 'linear-gradient(180deg,#FFF,#FAF7F2)', border: '1px solid #E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.06)' }}
                    >
                        <LogOut size={14} /> Disconnect
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* ── Tabs ── */}
                <div className="flex gap-2 mb-8 p-1.5 rounded-xl w-fit"
                    style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>📊 Overview</TabBtn>
                    <TabBtn active={tab === 'stars'} onClick={() => setTab('stars')}>⭐ Stars</TabBtn>
                    <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')}>📥 Requests</TabBtn>
                    <TabBtn active={tab === 'support'} onClick={() => setTab('support')}>💬 Support</TabBtn>
                    <TabBtn active={tab === 'aichats'} onClick={() => setTab('aichats')}>🤖 AI Chats</TabBtn>
                    <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}>⚙️ Settings</TabBtn>
                </div>

                {/* ══ OVERVIEW TAB ══════════════════════════════════════ */}
                {tab === 'overview' && (
                    <div>
                        <h1 className="text-2xl font-black tracking-tight mb-1">Dashboard</h1>
                        <p className="text-textSecondary text-sm font-medium mb-8">System Overview & Analytics</p>

                        {!data ? (
                            <div className="flex items-center justify-center py-32">
                                <PremiumSpinner size="sm" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${skeuCard} relative overflow-hidden group`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={56} style={{ color: '#B45309' }} /></div>
                                    <h2 className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-3">Total Inquiries</h2>
                                    <p className="text-5xl font-black tracking-tighter mb-2" style={{ background: 'linear-gradient(135deg,#B45309,#F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{data.totalRequests}</p>
                                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: '#B45309' }}><Activity size={13} /> Active Volume</p>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${skeuCard} lg:col-span-2`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#FEF3C7,#FDE68A)', border: '1px solid #F59E0B', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset' }}>
                                            <CalendarDays size={16} style={{ color: '#B45309' }} />
                                        </div>
                                        <h2 className="text-base font-bold text-textPrimary">Activity Breakdown</h2>
                                    </div>
                                    <ul className="space-y-2">
                                        {data.stats?.map((s, i) => (
                                            <li key={i} className="flex justify-between items-center p-3.5 rounded-xl"
                                                style={{ background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg,#F59E0B,#B45309)' }} />
                                                    <span className="capitalize font-semibold text-sm text-textPrimary">{s.event_type.replace('_', ' ')}</span>
                                                </div>
                                                <span className="font-bold text-white text-xs px-3 py-1 rounded-md" style={{ background: 'linear-gradient(180deg,#F59E0B,#B45309)', boxShadow: '0 1px 0 rgba(255,220,120,0.4) inset' }}>{s._count.id}</span>
                                            </li>
                                        ))}
                                        {(!data.stats || data.stats.length === 0) && <li className="p-6 text-center text-textSecondary text-sm font-medium" style={{ border: '1px dashed #D6CEC3', borderRadius: '0.75rem' }}>No data yet.</li>}
                                    </ul>
                                </motion.div>

                                {/* 📈 Daily Traffic Trend */}
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${skeuCard} lg:col-span-3 min-h-[350px] relative`}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#DCFCE7,#BBF7D0)', border: '1px solid #22C55E' }}>
                                                <TrendingUp size={16} className="text-green-700" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-textPrimary tracking-tight">Daily Traffic Trend</h2>
                                                <p className="text-[10px] text-textSecondary font-bold uppercase tracking-widest">Last 14 Days Visits</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.dailyVisitsChart}>
                                                <defs>
                                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0D5" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716C' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716C' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E7E0D5', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                                    itemStyle={{ color: '#F59E0B' }}
                                                />
                                                <Area type="monotone" dataKey="visits" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* ⏱ Engagement Stats */}
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${skeuCard} lg:col-span-3 min-h-[350px]`}>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#FEE2E2,#FECACA)', border: '1px solid #EF4444' }}>
                                            <Clock size={16} className="text-red-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black text-textPrimary tracking-tight">Platform Engagement</h2>
                                            <p className="text-[10px] text-textSecondary font-bold uppercase tracking-widest">Avg Stay Duration (Sec)</p>
                                        </div>
                                    </div>
                                    <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data.engagementChart}>
                                                <defs>
                                                    <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0D5" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716C' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716C' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E7E0D5', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                                    itemStyle={{ color: '#3B82F6' }}
                                                />
                                                <Area type="monotone" dataKey="avgDuration" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorDur)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* 📊 Popular Content */}
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${skeuCard} lg:col-span-4 min-h-[350px]`}>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#F3E8FF,#E9D5FF)', border: '1px solid #A855F7' }}>
                                            <BarChart3 size={16} className="text-purple-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black text-textPrimary tracking-tight">Popular Content</h2>
                                            <p className="text-[10px] text-textSecondary font-bold uppercase tracking-widest">Top Pages by View Count</p>
                                        </div>
                                    </div>
                                    <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.topPagesChart} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E7E0D5" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="page" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 10, fontWeight: 800, fill: '#57534E' }} />
                                                <Tooltip
                                                    cursor={{ fill: '#F5F0E8', opacity: 0.4 }}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E7E0D5', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                                />
                                                <Bar dataKey="views" radius={[0, 10, 10, 0]} barSize={20}>
                                                    {data.topPagesChart?.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#A855F7' : '#C084FC'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* 🌐 Geographic Distribution */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={skeuCard}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#DBEAFE,#BFDBFE)', border: '1px solid #3B82F6', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset' }}>
                                            <Globe size={16} className="text-blue-700" />
                                        </div>
                                        <h2 className="text-base font-bold text-textPrimary">Top Regions</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {data.countryStats?.slice(0, 5).map((c, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="text-xs font-bold text-textSecondary uppercase tracking-widest w-8">{c.country}</span>
                                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (c._count.id / (data.stats.find(s => s.event_type === 'page_view')?._count.id || 1)) * 100)}%` }} />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-textPrimary ml-4">{c._count.id}</span>
                                            </div>
                                        ))}
                                        {(!data.countryStats || data.countryStats.length === 0) && <p className="text-xs text-textSecondary text-center py-4">No regional data yet.</p>}
                                    </div>
                                </motion.div>

                                {/* 📱 Device & Browser */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={skeuCard}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#F1F5F9,#E2E8F0)', border: '1px solid #94A3B8', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset' }}>
                                            <Monitor size={16} className="text-stone-600" />
                                        </div>
                                        <h2 className="text-base font-bold text-textPrimary">Browser & Hardware</h2>
                                    </div>
                                    <div className="flex gap-4">
                                        {['desktop', 'mobile', 'tablet'].map(type => {
                                            const stat = data.deviceStats?.find(d => d.device_type === type);
                                            const Icons = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };
                                            const Icon = Icons[type as keyof typeof Icons];
                                            return (
                                                <div key={type} className="flex-1 p-3 rounded-xl text-center" style={{ background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)', border: '1px solid #E7E0D5' }}>
                                                    <Icon size={18} className="mx-auto mb-2 text-textSecondary" />
                                                    <p className="text-[10px] font-bold text-textSecondary uppercase mb-1">{type}</p>
                                                    <p className="text-lg font-black text-textPrimary">{stat?._count?.id || 0}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>

                                {/* 🕵️ Recent Live Activity */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`${skeuCard} lg:col-span-3`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#DCFCE7,#BBF7D0)', border: '1px solid #22C55E', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset' }}>
                                                <Activity size={16} className="text-green-700" />
                                            </div>
                                            <h2 className="text-base font-bold text-textPrimary">Recent Visitor Stream</h2>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center gap-1.5 animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Monitoring Live
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-separate border-spacing-y-2">
                                            <thead>
                                                <tr className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">
                                                    <th className="pb-2 px-1">Visitor</th>
                                                    <th className="pb-2 px-1">Location</th>
                                                    <th className="pb-2 px-1">Page</th>
                                                    <th className="pb-2 px-1">Tech Stack</th>
                                                    <th className="pb-2 px-1">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.recentPageViews?.map((view) => (
                                                    <tr key={view.id} className="group hover:-translate-y-0.5 transition-transform">
                                                        <td className="p-3 bg-white border border-stone-200 rounded-l-xl">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#F59E0B,#B45309)', color: '#fff' }}>
                                                                    {view.ip_address?.split('.').pop()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-textPrimary">{view.ip_address}</p>
                                                                    <p className="text-[9px] text-textSecondary font-medium font-mono">{view.session_id?.substring(0, 8)}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 bg-white border-y border-stone-200">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm">🌐</span>
                                                                <div>
                                                                    <p className="text-xs font-bold text-textPrimary uppercase tracking-tighter">{view.country}</p>
                                                                    <p className="text-[9px] text-textSecondary font-medium">{view.city || 'Unknown'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 bg-white border-y border-stone-200">
                                                            <span className="text-xs font-mono bg-stone-50 px-2 py-1 rounded border border-stone-100 text-amber-800">{view.page}</span>
                                                        </td>
                                                        <td className="p-3 bg-white border-y border-stone-200">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">{view.browser}</span>
                                                                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">{view.os}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 bg-white border border-l-0 border-stone-200 rounded-r-xl">
                                                            <span className="text-[10px] font-bold text-textSecondary">
                                                                {new Date(view.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(!data.recentPageViews || data.recentPageViews.length === 0) && (
                                            <div className="py-12 text-center bg-white/50 rounded-xl border-2 border-dashed border-stone-200">
                                                <p className="text-xs text-textSecondary font-medium">No recent page clicks detected yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ STARS TAB ══════════════════════════════════════════ */}
                {tab === 'stars' && (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-black tracking-tight mb-1">Stars</h1>
                                <p className="text-textSecondary text-sm font-medium">Manage the talent roster</p>
                            </div>
                            <button onClick={() => { setEditingStar(null); setShowForm(true); }} className="skeu-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
                                <PlusCircle size={16} /> Add Star
                            </button>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex gap-2 flex-wrap mb-6">
                            {['All', ...CATEGORIES].map(c => (
                                <button key={c} onClick={() => setFilterCat(c)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterCat === c ? 'skeu-btn-primary' : 'text-textSecondary'}`}
                                    style={filterCat === c ? {} : { background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}
                                >{c}</button>
                            ))}
                        </div>

                        {starsLoading ? (
                            <div className="flex justify-center py-24"><PremiumSpinner size="sm" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredStars.map(star => (
                                    <motion.div key={star.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                        className="skeu-card overflow-hidden group"
                                    >
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden">
                                            <img src={getPrimaryImage(star.image_url)} alt={star.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                                <span className="text-white font-bold text-lg drop-shadow-md">{star.name}</span>
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                                    style={{ background: 'linear-gradient(180deg,#F59E0B,#B45309)', color: '#fff', boxShadow: '0 1px 0 rgba(255,220,120,0.4) inset' }}
                                                >{star.category}</span>
                                            </div>
                                        </div>
                                        {/* Body */}
                                        <div className="p-5">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Globe size={12} className="text-textSecondary" />
                                                    <span className="text-xs text-textSecondary font-medium">{star.country}</span>
                                                </div>
                                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ color: statusColor(star.availability_status), background: statusColor(star.availability_status) + '18', border: `1px solid ${statusColor(star.availability_status)}40` }}>
                                                    {star.availability_status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-textSecondary line-clamp-2 mb-4 leading-relaxed">{star.short_bio}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-textSecondary font-semibold">{star._count?.requests ?? 0} requests</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingStar(star); setShowForm(true); }}
                                                        className="p-2 rounded-lg text-textSecondary hover:text-textPrimary transition-colors"
                                                        style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}
                                                        title="Edit"
                                                    ><Pencil size={14} /></button>
                                                    <button onClick={() => setDeleteConfirm(star.id)}
                                                        className="p-2 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                                                        style={{ background: 'linear-gradient(180deg,#FFF5F5,#FFE0E0)', border: '1px solid #FECACA', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}
                                                        title="Delete"
                                                    ><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {filteredStars.length === 0 && (
                                    <div className="col-span-3 py-20 text-center">
                                        <Star size={36} className="mx-auto text-textSecondary mb-3 opacity-40" />
                                        <p className="text-textSecondary font-medium">No stars found. Add one!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ REQUESTS TAB ═══════════════════════════════════════ */}
                {tab === 'requests' && (
                    <div>
                        <h1 className="text-2xl font-black tracking-tight mb-1">Contact Requests</h1>
                        <p className="text-textSecondary text-sm font-medium mb-6">All incoming inquiries</p>

                        {reqLoading ? (
                            <div className="flex justify-center py-24"><PremiumSpinner size="sm" /></div>
                        ) : (
                            <div className="space-y-3">
                                {requests.map(req => (
                                    <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="skeu-card overflow-hidden">
                                        <button onClick={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                                            className="w-full p-5 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                                                    style={{ background: 'linear-gradient(180deg,#FEF3C7,#FDE68A)', border: '1px solid #F59E0B', color: '#B45309', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset' }}
                                                >{req.full_name[0]}</div>
                                                <div>
                                                    <p className="font-bold text-textPrimary text-sm">{req.full_name}</p>
                                                    <p className="text-xs text-textSecondary font-medium">{req.event_type} · <span style={{ color: '#B45309' }}>{req.star?.name}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-textSecondary hidden sm:block font-medium">{new Date(req.created_at).toLocaleDateString()}</span>
                                                <ChevronDown size={16} className={`text-textSecondary transition-transform ${expandedReq === req.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {expandedReq === req.id && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t"
                                                    style={{ borderColor: '#E7E0D5' }}
                                                >
                                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail size={14} style={{ color: '#B45309' }} />
                                                            <span className="text-textSecondary">Email:</span>
                                                            <span className="font-semibold text-textPrimary">{req.email}</span>
                                                        </div>
                                                        {req.phone && <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-textSecondary">Phone:</span>
                                                            <span className="font-semibold text-textPrimary">{req.phone}</span>
                                                        </div>}
                                                        {req.company && <div className="flex items-center gap-2 text-sm">
                                                            <Building2 size={14} style={{ color: '#B45309' }} />
                                                            <span className="text-textSecondary">Company:</span>
                                                            <span className="font-semibold text-textPrimary">{req.company}</span>
                                                        </div>}
                                                        {req.country && <div className="flex items-center gap-2 text-sm">
                                                            <Globe size={14} style={{ color: '#B45309' }} />
                                                            <span className="text-textSecondary">Country:</span>
                                                            <span className="font-semibold text-textPrimary">{req.country}</span>
                                                        </div>}
                                                        {req.event_date && <div className="flex items-center gap-2 text-sm">
                                                            <CalendarDays size={14} style={{ color: '#B45309' }} />
                                                            <span className="text-textSecondary">Event Date:</span>
                                                            <span className="font-semibold text-textPrimary">{req.event_date}</span>
                                                        </div>}
                                                        <div className="sm:col-span-2 p-4 rounded-xl text-sm" style={{ background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)' }}>
                                                            <p className="text-xs font-bold uppercase tracking-widest text-textSecondary mb-2">Message</p>
                                                            <p className="text-textPrimary leading-relaxed">{req.message}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                                {requests.length === 0 && (
                                    <div className="py-20 text-center">
                                        <Mail size={36} className="mx-auto text-textSecondary mb-3 opacity-40" />
                                        <p className="text-textSecondary font-medium">No requests yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ SUPPORT TAB ═══════════════════════════════════════ */}
                {tab === 'support' && (
                    <>
                        <h1 className="text-2xl font-black tracking-tight mb-1">Live Support</h1>
                        <p className="text-textSecondary text-sm font-medium mb-6">Manage real-time customer inquiries</p>
                        <AdminSupport />
                    </>
                )}

                {/* ══ AI CHATS TAB ══════════════════════════════════════ */}
                {tab === 'aichats' && (
                    <>
                        <h1 className="text-2xl font-black tracking-tight mb-1">AI Chat Logs</h1>
                        <p className="text-textSecondary text-sm font-medium mb-6">Review automated Dazzbit AI interactions</p>
                        <AdminAIChats />
                    </>
                )}

                {/* ══ SETTINGS TAB ══════════════════════════════════════ */}
                {tab === 'settings' && (
                    <div className="max-w-3xl">
                        <h1 className="text-2xl font-black tracking-tight mb-1">Global Settings</h1>
                        <p className="text-textSecondary text-sm font-medium mb-8">Customize system behavior and appearance</p>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Hero Section Card */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={skeuCard}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(180deg,#FEF3C7,#FDE68A)', border: '1px solid #F59E0B', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset' }}>
                                        <Globe size={16} style={{ color: '#B45309' }} />
                                    </div>
                                    <h2 className="text-base font-bold text-textPrimary">Hero Section Customization</h2>
                                </div>

                                {settingsLoading ? (
                                    <div className="flex justify-center py-10"><PremiumSpinner size="sm" /></div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Toggles */}
                                        <div className="flex flex-col gap-4">
                                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all hover:bg-white/40"
                                                style={{ border: '1px solid #E7E0D5', background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${settings.hero_show_cards ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                                                        <Activity size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-textPrimary uppercase tracking-tight">Show Scattered Cards</p>
                                                        <p className="text-[10px] text-textSecondary font-medium">Render background drifting talent cards</p>
                                                    </div>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5 accent-amber-600"
                                                    checked={settings.hero_show_cards}
                                                    onChange={e => saveSettings({ ...settings, hero_show_cards: e.target.checked })}
                                                />
                                            </label>

                                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all hover:bg-white/40"
                                                style={{ border: '1px solid #E7E0D5', background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${settings.hero_show_image ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                                                        <PlusCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-textPrimary uppercase tracking-tight">Show Hero Image</p>
                                                        <p className="text-[10px] text-textSecondary font-medium">Use a custom static image background</p>
                                                    </div>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5 accent-amber-600"
                                                    checked={settings.hero_show_image}
                                                    onChange={e => saveSettings({ ...settings, hero_show_image: e.target.checked })}
                                                />
                                            </label>
                                        </div>

                                        {/* Hero Image Upload */}
                                        <div className="pt-4 border-t" style={{ borderColor: '#E7E0D5' }}>
                                            <p className={labelCls}>Hero Background Image</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden bg-stone-50">
                                                    {settings.hero_image_url ? (
                                                        <img src={settings.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <PlusCircle size={24} className="text-stone-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <input type="file" id="hero-upload" hidden accept="image/*" onChange={handleHeroUpload} />
                                                    <button onClick={() => document.getElementById('hero-upload')?.click()}
                                                        disabled={heroUploading}
                                                        className="skeu-btn-primary px-4 py-2 text-xs mb-2"
                                                    >
                                                        {heroUploading ? 'Uploading...' : 'Change Hero Image'}
                                                    </button>
                                                    <p className="text-[10px] text-textSecondary font-medium">Recommended size: 1920x1080px. Max 10MB.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Live Support Notification Sounds */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={skeuCard}>
                                <AdminSettings />
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Star Form Modal ── */}
            <AnimatePresence>
                {showForm && (
                    <StarFormModal
                        initial={editingStar ? { ...editingStar } : { ...BLANK_STAR }}
                        onSave={handleSaveStar}
                        onClose={() => { setShowForm(false); setEditingStar(null); }}
                    />
                )}
            </AnimatePresence>

            {/* ── Delete Confirm Modal ── */}
            <AnimatePresence>
                {deleteConfirm !== null && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        style={{ background: 'rgba(28,25,23,0.6)', backdropFilter: 'blur(10px)' }}
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="skeu-card p-8 max-w-sm w-full text-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                                style={{ background: 'linear-gradient(180deg,#FFF5F5,#FFE0E0)', border: '1px solid #FECACA', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}
                            >
                                <Trash2 size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-textPrimary mb-2">Delete Star?</h3>
                            <p className="text-textSecondary text-sm mb-6 font-medium">This will permanently delete the star and all their associated requests and analytics.</p>
                            <div className="flex gap-3">
                                <button onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-3 rounded-lg font-bold text-white text-sm uppercase tracking-widest transition-all hover:-translate-y-0.5"
                                    style={{ background: 'linear-gradient(180deg,#EF4444,#DC2626)', border: '1px solid #B91C1C', boxShadow: '0 1px 0 rgba(255,150,150,0.3) inset, 0 3px 8px rgba(239,68,68,0.3)' }}
                                >Delete</button>
                                <button onClick={() => setDeleteConfirm(null)} className="skeu-btn-dark flex-1 py-3 text-sm uppercase tracking-widest">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Unused icon import used here to silence TS (CheckCircle used in StarCarousel) */}
            <span className="hidden"><CheckCircle size={0} /><Star size={0} /></span>
        </div>
    );
};

export default AdminPortal;
