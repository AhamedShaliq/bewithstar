import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Calendar, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage, getAllImages } from '../utils/imageUtils';
import { useDeviceDetect } from '../hooks/useDeviceDetect';

interface Star {
    // ... existing Star interface ...
    id: number;
    name: string;
    category: string;
    country: string;
    short_bio: string;
    full_bio: string;
    image_url: string;
    availability_status: string;
}

const StarCarousel = () => {
    const { isMobile } = useDeviceDetect();
    const [stars, setStars] = useState<Star[]>([]);
    const [selectedStar, setSelectedStar] = useState<Star | null>(null);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-slide logic for Modal Gallery
    useEffect(() => {
        if (!selectedStar) {
            setCurrentImgIndex(0);
            return;
        }

        const images = getAllImages(selectedStar.image_url);
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImgIndex(prev => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedStar]);

    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Fetch Stars
                const starRes = await fetch(`${API_BASE_URL}/api/stars`);
                const starData = await starRes.json();

                if (!Array.isArray(starData)) return;

                // 2. Fetch User Location (with simple session caching)
                let countryName = sessionStorage.getItem('user_country') || '';

                if (!countryName) {
                    try {
                        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                        if (geoRes.ok) {
                            const geoData = await geoRes.json();
                            if (geoData && geoData.country) {
                                countryName = geoData.country;
                                sessionStorage.setItem('user_country', countryName);
                            }
                        }
                    } catch (err) {
                        // Suppress noisy network errors
                    }
                }

                // 3. Sort Stars (prioritize matching country)
                if (countryName) {
                    starData.sort((a, b) => {
                        const aMatch = a.country === countryName ? 1 : 0;
                        const bMatch = b.country === countryName ? 1 : 0;
                        return bMatch - aMatch;
                    });
                }

                // 4. Limit to 10 stars max for "Featured Icons" section
                setStars(starData.slice(0, 10));
            } catch (err) {
                console.error('Error fetching stars:', err);
            }
        };

        initData();
    }, []);

    // Mobile Auto-Swipe logic (Infinite Loop)
    useEffect(() => {
        if (typeof window === 'undefined' || window.innerWidth > 1024 || !scrollRef.current || stars.length === 0) return;

        const interval = setInterval(() => {
            const container = scrollRef.current;
            if (!container) return;

            const cardWidth = 304; // 280px width + 24px gap
            const currentScroll = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const halfWidth = scrollWidth / 2;

            // Seamless reset: If we've passed the halfway point, jump back silently
            // We do this BEFORE the next scroll to ensure we always have content ahead
            if (currentScroll >= halfWidth - cardWidth) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = currentScroll - halfWidth;
                container.getBoundingClientRect(); // trigger reflow
                container.style.scrollBehavior = 'smooth';
            }

            container.scrollTo({
                left: container.scrollLeft + cardWidth,
                behavior: 'smooth'
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [stars]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedStar) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedStar]);

    // Desktop marquee (tripled for safety)
    const marqueeStars = [...stars, ...stars, ...stars];
    // Mobile doubled for infinite slider
    const mobileStars = [...stars, ...stars];

    const modalImages = selectedStar ? getAllImages(selectedStar.image_url) : [];

    return (
        <section id="discover" className="py-24 warm-divider relative overflow-hidden" style={{ background: '#FAF8F5' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <span className="skeu-badge inline-block px-5 py-2 text-xs uppercase tracking-widest mb-6">
                        Global Talent Network
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-textPrimary tracking-tighter">Featured Icons</h2>
                    <div className="w-20 h-1 mx-auto mt-6 rounded-full" style={{ background: 'linear-gradient(90deg, #F59E0B, #B45309)' }} />
                </motion.div>
            </div>

            {stars.length === 0 ? (
                <div className="text-center text-textSecondary py-20 flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#E7E0D5', borderTopColor: '#B45309' }} />
                    Loading the stars...
                </div>
            ) : (
                <div className="w-full relative max-w-[100vw] mx-auto overflow-hidden text-left pb-12">
                    <style>{`
                        @keyframes marquee {
                            0% { transform: translate3d(0, 0, 0); }
                            100% { transform: translate3d(-33.333%, 0, 0); }
                        }
                        
                        .cinematic-marquee-container {
                            display: flex;
                            width: max-content;
                            will-change: transform;
                            animation: marquee 60s linear infinite;
                            padding: 2rem 0;
                        }

                        .cinematic-marquee-container:hover {
                            animation-play-state: paused;
                        }

                        .star-card-container {
                            flex-shrink: 0;
                            width: 280px;
                            margin-right: 1.5rem;
                            scroll-snap-align: center;
                        }

                        @media (min-width: 768px) {
                            .star-card-container {
                                width: 380px;
                                margin-right: 2rem;
                            }
                        }

                        /* Only show marquee on desktop */
                        @media (max-width: 1024px) {
                            .cinematic-marquee-container {
                                animation: none;
                                width: auto;
                                display: flex;
                                flex-wrap: nowrap;
                                padding: 2rem 1rem;
                            }
                            .marquee-wrapper {
                                overflow-x: auto;
                                scroll-behavior: smooth;
                                -webkit-overflow-scrolling: touch;
                                scroll-snap-type: x mandatory;
                            }
                        }

                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>

                    <div ref={scrollRef} className="marquee-wrapper no-scrollbar">
                        <div className="cinematic-marquee-container">
                            {/* Render different lists based on viewport for optimal performance */}
                            {(typeof window !== 'undefined' && window.innerWidth > 1024 ? marqueeStars : mobileStars).map((star, idx) => (
                                <div
                                    key={`${star.id}-${idx}`}
                                    className="star-card-container"
                                >
                                    <motion.div
                                        whileHover={{ y: -10 }}
                                        className="relative group cursor-pointer h-[450px] md:h-[500px] xl:h-[600px] bg-black w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-500"
                                        onClick={() => setSelectedStar(star)}
                                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                                    >
                                        <img
                                            src={getPrimaryImage(star.image_url)}
                                            alt={star.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] group-hover:scale-110 opacity-75 group-hover:opacity-100 ease-out"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/50 to-transparent z-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-90" />

                                        <div className={`absolute bottom-0 left-0 w-full p-6 md:p-8 z-20 flex flex-col justify-end h-full transition-all duration-500 transform group-hover:translate-y-0 ${isMobile ? 'translate-y-0' : 'translate-y-6'}`}>
                                            <div className="flex flex-wrap items-center gap-2 mb-3 lg:mb-4">
                                                <span className="inline-block px-3 py-1 rounded bg-black/40 backdrop-blur-md text-[#F59E0B] border border-[#F59E0B]/20 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
                                                    {star.category}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-white/90 text-[10px] md:text-xs font-semibold uppercase tracking-wider backdrop-blur-md bg-white/5 px-2.5 py-1 rounded border border-white/10">
                                                    <Globe size={12} className="text-[#F59E0B]" />
                                                    {star.country}
                                                </span>
                                            </div>

                                            <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter drop-shadow-xl leading-none">{star.name}</h3>

                                            <p className={`text-gray-300 text-sm md:text-base line-clamp-2 mb-4 lg:mb-6 drop-shadow-md font-medium leading-relaxed group-hover:opacity-100 transition-opacity duration-500 lg:delay-100 ${isMobile ? 'opacity-100' : 'opacity-0'}`}>
                                                {star.short_bio}
                                            </p>

                                            <div className={`group-hover:opacity-100 transition-all duration-500 lg:delay-[200ms] relative overflow-hidden bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest flex items-center justify-between w-full hover:bg-white/20 ${isMobile ? 'opacity-100' : 'opacity-0'}`}>
                                                <span className="text-xs lg:text-sm">Explore Profile</span>
                                                <span className="text-[#F59E0B] font-black relative group-hover:translate-x-1 transition-transform">→</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Explore More CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex justify-center mt-12 mb-8 relative z-20"
            >
                <a
                    href="/discover"
                    className={`skeu-btn-primary font-black uppercase tracking-[0.2em] inline-flex items-center justify-center group shadow-xl hover:shadow-amber-200/50 transition-all duration-500 hover:-translate-y-1 mx-auto ${isMobile ? 'px-6 py-4 text-xs w-auto gap-3' : 'px-12 py-5 text-sm w-auto gap-4'}`}
                >
                    <span className="text-center">Unlock the Full Collection</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={14} className="text-white translate-x-px" />
                    </div>
                </a>
            </motion.div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedStar !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="skeu-card text-textPrimary max-w-4xl w-full overflow-hidden relative flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh]"
                        >
                            <button
                                onClick={() => setSelectedStar(null)}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors text-textSecondary hover:text-textPrimary"
                                style={{ background: 'linear-gradient(180deg,#FFFFFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.08)' }}
                            >
                                <X size={18} />
                            </button>

                            <div className="w-full md:w-1/2 h-96 md:h-auto relative bg-stone-100 overflow-hidden flex-shrink-0">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentImgIndex}
                                        src={modalImages[currentImgIndex]}
                                        alt={`${selectedStar.name}-${currentImgIndex}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        className="w-full h-full object-cover object-top"
                                    />
                                </AnimatePresence>

                                {/* Progress Bars for Gallery */}
                                {modalImages.length > 1 && (
                                    <div className="absolute top-4 left-4 right-4 z-10 flex gap-1.5">
                                        {modalImages.map((_, i) => (
                                            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm">
                                                <motion.div
                                                    key={`${i}-${i === currentImgIndex}`}
                                                    className="h-full bg-amber-500"
                                                    initial={{ width: i < currentImgIndex ? '100%' : '0%' }}
                                                    animate={{ width: i <= currentImgIndex ? '100%' : '0%' }}
                                                    transition={{ duration: i === currentImgIndex ? 3 : 0, ease: "linear" }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-white/20 to-transparent pointer-events-none" />
                            </div>

                            <div className="p-8 md:p-12 w-full md:w-1/2 overflow-y-auto" data-lenis-prevent>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="skeu-badge px-3 py-1 text-xs uppercase tracking-wider">{selectedStar.category}</span>
                                    <span className="text-border">•</span>
                                    <span className="flex items-center text-textSecondary text-sm"><Globe size={14} className="mr-1" /> {selectedStar.country}</span>
                                </div>

                                <h3 className="text-4xl font-black mb-6 text-textPrimary tracking-tight">{selectedStar.name}</h3>

                                <p className="text-textSecondary leading-relaxed mb-8">{selectedStar.full_bio}</p>

                                <div className="p-5 rounded-xl mb-8" style={{ background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
                                    <h4 className="flex items-center text-xs uppercase tracking-widest font-bold text-textPrimary mb-3">
                                        <Calendar size={14} className="mr-2" style={{ color: '#B45309' }} /> Booking Status
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {selectedStar.availability_status !== 'Unavailable' ? (
                                            <CheckCircle size={20} style={{ color: '#B45309' }} />
                                        ) : (
                                            <XCircle className="text-red-500" size={20} />
                                        )}
                                        <span className={`font-semibold text-lg ${selectedStar.availability_status !== 'Unavailable' ? 'text-textPrimary' : 'text-red-600'}`}>
                                            {selectedStar.availability_status}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    disabled={selectedStar.availability_status === 'Unavailable'}
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('talentSelect', { detail: { starId: selectedStar.id } }));
                                        setSelectedStar(null);
                                    }}
                                    className={`w-full block text-center py-4 text-sm font-black uppercase tracking-widest ${selectedStar.availability_status !== 'Unavailable'
                                        ? 'skeu-btn-primary cursor-pointer'
                                        : 'bg-stone-200 text-stone-400 border border-stone-300 rounded-xl cursor-not-allowed hidden-pointer-events'
                                        }`}
                                >
                                    {selectedStar.availability_status !== 'Unavailable' ? 'Request Booking' : 'Currently Unavailable'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default StarCarousel;
