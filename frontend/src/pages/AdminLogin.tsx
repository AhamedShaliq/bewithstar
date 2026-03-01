import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMSG, setErrorMSG] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setErrorMSG('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { username, password });
            if (res.data.token) { localStorage.setItem('token', res.data.token); navigate('/admin'); }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) setErrorMSG(error.response?.data?.error || 'Authentication failed.');
            else setErrorMSG('Authentication failed.');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)' }}
        >
            {/* Ambient warm glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
            />

            <a href="/" className="mb-12 font-bold text-2xl tracking-tighter text-textPrimary flex items-center gap-2 group z-10 transition-transform hover:scale-105">
                <motion.div whileHover={{ rotate: 90, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}
                    className="w-5 h-5 rounded-md"
                    style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)', boxShadow: '0 1px 0 rgba(255,220,100,0.5) inset, 0 2px 4px rgba(180,83,9,0.3)' }}
                />
                Star<span className="font-medium text-textSecondary">Connect</span>
            </a>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="skeu-card w-full max-w-md p-8 md:p-10 z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-textPrimary tracking-tight mb-2">Secure Gateway</h1>
                    <p className="text-textSecondary text-sm font-medium">Authorized personnel only.</p>
                </div>

                {errorMSG && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 rounded-xl flex items-center gap-3 border border-red-200"
                        style={{ background: '#FFF5F5', boxShadow: 'inset 0 2px 4px rgba(220,38,38,0.06)' }}
                    >
                        <ShieldAlert size={18} className="text-red-500 shrink-0" />
                        <span className="text-sm font-semibold text-red-600">{errorMSG}</span>
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-textPrimary mb-2 uppercase tracking-widest">Username</label>
                        <input
                            required type="text" value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="skeu-input w-full px-4 py-3 text-textPrimary"
                            placeholder="adminID"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-textPrimary mb-2 uppercase tracking-widest">Passphrase</label>
                        <input
                            required type="password" value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="skeu-input w-full px-4 py-3 text-textPrimary"
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" disabled={isLoading}
                        className={`skeu-btn-primary w-full py-4 text-sm uppercase tracking-widest mt-2 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Authenticating…' : 'Establish Connection'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
