import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, Check, Trash2, Volume2, Settings as SettingsIcon } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import PremiumSpinner from './ui/PremiumSpinner';

interface NotificationSound {
    id: number;
    name: string;
    url: string;
}

const AdminSettings = () => {
    const [sounds, setSounds] = useState<NotificationSound[]>([]);
    const [activeSoundId, setActiveSoundId] = useState<number | null>(null);
    const [headerTransparent, setHeaderTransparent] = useState(true);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchSettings();
        fetchSounds();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/settings`, { headers });
            setActiveSoundId(res.data.active_notification_sound_id);
            setHeaderTransparent(res.data.header_transparent ?? true);
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const fetchSounds = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/notification-sounds`, { headers });
            setSounds(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching sounds:', err);
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        setSuccessMsg('');

        const formData = new FormData();
        formData.append('audio', file);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/notification-sounds/upload`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            setSounds([res.data, ...sounds]);
            setSuccessMsg('Sound uploaded successfully!');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to upload sound');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this sound?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/admin/notification-sounds/${id}`, { headers });
            setSounds(sounds.filter(s => s.id !== id));
            if (activeSoundId === id) setActiveSoundId(null);
            setSuccessMsg('Sound deleted successfully');
        } catch (err) {
            setError('Failed to delete sound');
        }
    };

    const handleSetActive = async (id: number) => {
        try {
            await axios.post(`${API_BASE_URL}/api/admin/settings/notification-sound`, { sound_id: id }, { headers });
            setActiveSoundId(id);
            setSuccessMsg('Active notification sound updated');
        } catch (err) {
            setError('Failed to update active sound');
        }
    };

    const handleToggleHeader = async () => {
        try {
            const newValue = !headerTransparent;
            await axios.post(`${API_BASE_URL}/api/admin/settings/header-transparency`, { transparent: newValue }, { headers });
            setHeaderTransparent(newValue);
            setSuccessMsg(`Header transparency ${newValue ? 'enabled' : 'disabled'}`);
        } catch (err) {
            setError('Failed to update header setting');
        }
    };

    const playPreview = (url: string) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        audioRef.current = new Audio(url);
        audioRef.current.play();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <SettingsIcon size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-textPrimary tracking-tight uppercase">Support Settings</h2>
                    <p className="text-xs font-bold text-textSecondary uppercase tracking-widest">Customize your live support experience</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="md:col-span-1">
                    <div className="skeu-card p-6 bg-white/50 backdrop-blur-sm sticky top-6">
                        <h3 className="text-sm font-black text-textPrimary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Upload size={16} className="text-amber-500" /> Upload Sound
                        </h3>
                        <p className="text-[10px] text-textSecondary font-medium mb-6 leading-relaxed">
                            Upload your custom notification alert for new chat messages. Supported formats: MP3, WAV, OGG.
                        </p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="audio/*"
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`w-full py-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all
                                ${uploading
                                    ? 'border-amber-200 bg-amber-50/50'
                                    : 'border-stone-200 hover:border-amber-400 hover:bg-amber-50/30'}`}
                        >
                            {uploading ? (
                                <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                        <Volume2 size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-textPrimary">Choose File</span>
                                </>
                            )}
                        </button>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 text-[10px] font-bold text-rose-600 uppercase text-center"
                                >
                                    {error}
                                </motion.p>
                            )}
                            {successMsg && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 text-[10px] font-bold text-emerald-600 uppercase text-center"
                                >
                                    {successMsg}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Website Configuration */}
                    <div className="skeu-card p-6 bg-white/50 backdrop-blur-sm mt-8">
                        <h3 className="text-sm font-black text-textPrimary uppercase tracking-widest mb-4 flex items-center gap-2">
                            <SettingsIcon size={16} className="text-amber-500" /> Site Layout
                        </h3>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-stone-200/60 shadow-sm">
                            <div>
                                <p className="text-xs font-black text-textPrimary uppercase tracking-tight">Transparent Header</p>
                                <p className="text-[9px] text-textSecondary font-medium uppercase tracking-widest mt-0.5">
                                    {headerTransparent ? 'Header is glass-style' : 'Header is solid white'}
                                </p>
                            </div>
                            <button
                                onClick={handleToggleHeader}
                                className={`w-12 h-6 rounded-full transition-all relative ${headerTransparent ? 'bg-amber-500 shadow-inner' : 'bg-stone-200'}`}
                            >
                                <motion.div
                                    animate={{ x: headerTransparent ? 26 : 4 }}
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sound List Section */}
                <div className="md:col-span-2">
                    <div className="skeu-card p-6 bg-white/50 backdrop-blur-sm">
                        <h3 className="text-sm font-black text-textPrimary uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Volume2 size={16} className="text-amber-500" /> Notification Sounds
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <PremiumSpinner size="sm" />
                            </div>
                        ) : sounds.length === 0 ? (
                            <div className="text-center py-12 bg-stone-50/50 rounded-2xl border border-stone-100">
                                <p className="text-xs font-bold text-textSecondary uppercase opacity-50">No sounds uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sounds.map((sound) => (
                                    <div
                                        key={sound.id}
                                        className={`p-4 rounded-xl border transition-all flex items-center justify-between
                                            ${activeSoundId === sound.id
                                                ? 'bg-amber-50 border-amber-200 shadow-[inset_0_2px_4px_rgba(180,83,9,0.05)]'
                                                : 'bg-white border-stone-200/60 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => playPreview(sound.url)}
                                                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center text-textSecondary"
                                            >
                                                <Play size={14} fill="currentColor" />
                                            </button>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-textPrimary uppercase truncate tracking-tight">{sound.name}</p>
                                                {activeSoundId === sound.id && (
                                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                                        <Check size={10} /> Active Tone
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {activeSoundId !== sound.id && (
                                                <button
                                                    onClick={() => handleSetActive(sound.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Set Active
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(sound.id)}
                                                className="p-2 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
