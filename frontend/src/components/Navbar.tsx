import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Compass, Menu, X } from 'lucide-react';
import axios from 'axios';
import MMStarLogo from '../assets/MMstar_logo.png';
import { API_BASE_URL } from '../utils/apiConfig';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [headerTransparent, setHeaderTransparent] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/public/settings`);
                setHeaderTransparent(res.data.header_transparent ?? true);
            } catch (err) {
                console.error('Error fetching navbar settings:', err);
            }
        };
        fetchSettings();

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent background scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
    ];

    return (
        <nav
            className="fixed top-0 w-full z-50 transition-all duration-300"
            style={scrolled || !headerTransparent ? {
                background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(250,248,245,0.95) 100%)',
                borderBottom: '1px solid #E7E0D5',
                boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 12px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
            } : {
                background: 'transparent',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <Link to="/" className="font-bold text-1xl tracking-tighter cursor-pointer flex items-center group">
                    <img
                        src={MMStarLogo}
                        alt="Meet My Star Logo"
                        className="h-20 sm:h-28 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105 -my-3 sm:-my-5"
                    />
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex space-x-8 items-center">
                    {navLinks.map(link => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="text-sm tracking-wide font-medium transition-colors relative group text-textSecondary hover:text-textPrimary"
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] rounded-full transition-all duration-300 group-hover:w-full"
                                style={{ background: 'linear-gradient(90deg, #F59E0B, #B45309)' }}
                            />
                        </Link>
                    ))}
                    <Link
                        to="/discover"
                        className="skeu-btn-primary text-sm px-6 py-2.5 flex items-center gap-2 group"
                    >
                        <Compass className="w-4 h-4 text-amber-100 group-hover:rotate-45 transition-transform duration-500 will-change-transform" />
                        Explore Stars
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    <Link
                        to="/discover"
                        className="skeu-btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1.5 group"
                    >
                        <Compass className="w-3.5 h-3.5 text-amber-100 group-hover:rotate-45 transition-transform duration-500" />
                        Explore
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl transition-all duration-300"
                        style={{
                            background: 'rgba(255,255,255,0.7)',
                            border: '1px solid #E7E0D5',
                            boxShadow: '0 1px 0 white inset, 0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6 text-stone-600" /> : <Menu className="w-6 h-6 text-stone-600" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="md:hidden absolute top-full left-0 w-full mt-2 px-4 pb-6"
                    >
                        <div
                            className="rounded-[2.5rem] overflow-hidden border border-stone-200/50 shadow-2xl p-6 space-y-4"
                            data-lenis-prevent
                            style={{
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            {navLinks.map(link => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full py-4 px-6 rounded-2xl text-lg font-medium text-stone-700 active:scale-95 transition-all text-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.5)',
                                        border: '1px solid rgba(231, 224, 213, 0.5)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
