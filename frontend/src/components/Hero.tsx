import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage } from '../utils/imageUtils';
import { useDeviceDetect } from '../hooks/useDeviceDetect';

interface Star { id: number; name: string; image_url: string; category: string; country?: string; }

// Pre-computed scattered positions for up to 12 cards (% from center, rotation, scale, z-index depth blur)
const CARD_LAYOUT = [
    { x: '-40vw', y: '-25vh', rot: -15, scale: 0.9, blur: 1, baseOp: 0.4 },
    { x: '35vw', y: '-30vh', rot: 12, scale: 0.7, blur: 3, baseOp: 0.25 },
    { x: '-45vw', y: '20vh', rot: 18, scale: 1.1, blur: 0, baseOp: 0.5 },
    { x: '42vw', y: '25vh', rot: -10, scale: 0.85, blur: 2, baseOp: 0.35 },
    { x: '-15vw', y: '-40vh', rot: 8, scale: 0.65, blur: 4, baseOp: 0.2 },
    { x: '25vw', y: '-42vh', rot: -20, scale: 0.95, blur: 1, baseOp: 0.45 },
    { x: '-30vw', y: '35vh', rot: -12, scale: 0.75, blur: 3, baseOp: 0.25 },
    { x: '38vw', y: '40vh', rot: 15, scale: 1.05, blur: 0, baseOp: 0.45 },
    { x: '-5vw', y: '-48vh', rot: -5, scale: 0.6, blur: 5, baseOp: 0.15 },
    { x: '48vw', y: '-10vh', rot: -8, scale: 0.8, blur: 2, baseOp: 0.3 },
    { x: '-48vw', y: '-5vh', rot: 10, scale: 0.9, blur: 1, baseOp: 0.4 },
    { x: '10vw', y: '45vh', rot: -6, scale: 0.7, blur: 3, baseOp: 0.25 },
];

const HeroCard = ({ star, index }: { star: Star, index: number }) => {
    const layout = CARD_LAYOUT[index % CARD_LAYOUT.length];

    return (
        <motion.div
            whileHover={{
                scale: layout.scale * 1.08,
                zIndex: 60,
                filter: `blur(${layout.blur * 0.5}px)`, // Keep some cinematic blur
                opacity: 1,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
            }}
            className="absolute will-change-transform"
            style={{
                left: '50%',
                top: '50%',
                x: '-50%',
                y: '-50%',
                transformOrigin: 'center center',
            }}
            initial={{
                x: '-50%',
                y: '-50%',
                scale: layout.scale * 3,
                opacity: 0,
                rotate: layout.rot * 2,
                filter: 'blur(20px)',
            }}
            animate={{
                // Convert relative vw/vh to actual pixel-like offsets or just keep as is
                // But since we are centered, layout.x ('-40vw') works as an offset from 50%
                x: `calc(-50% + ${layout.x})`,
                y: `calc(-50% + ${layout.y})`,
                scale: layout.scale,
                opacity: layout.baseOp,
                rotate: layout.rot,
                filter: `blur(${layout.blur}px)`,
            }}
            transition={{
                duration: 3.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 + index * 0.15,
            }}
        >
            {/* The drift animation is moved here, but we use 'animate' carefully */}
            <motion.div
                animate={{
                    x: [0, (index % 2 === 0 ? 10 : -10), 0],
                    y: [0, (index % 3 === 0 ? -15 : 15), 0],
                    rotate: [0, (index % 2 === 0 ? 2 : -2), 0],
                }}
                transition={{
                    duration: 15 + (index % 5) * 2,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: 3.5 + index * 0.15,
                }}
            >
                <div className="w-[140px] h-[190px] md:w-[180px] md:h-[240px] rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-300"
                    style={{
                        background: 'linear-gradient(180deg,#FFF,#F5F0E8)',
                        border: '1px solid rgba(231,224,213,0.3)',
                    }}
                >
                    <img src={getPrimaryImage(star.image_url)} alt={star.name} className="w-full h-full object-cover pointer-events-none select-none" />
                </div>
            </motion.div>
        </motion.div>
    );
};

const Hero = () => {
    const { isMobile } = useDeviceDetect();
    const [stars, setStars] = useState<Star[]>([]);
    const [settings, setSettings] = useState({
        hero_show_cards: true,
        hero_show_image: false,
        hero_image_url: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/settings`);
                if (res.ok) setSettings(await res.json());
            } catch (e) { /* silent */ }
        };
        fetchSettings();

        const fetchStars = async () => {
            try {
                let userCountry = sessionStorage.getItem('user_country') || '';
                if (!userCountry) {
                    try {
                        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                        if (ipRes.ok) {
                            const ipData = await ipRes.json();
                            userCountry = ipData.country || '';
                            if (userCountry) sessionStorage.setItem('user_country', userCountry);
                        }
                    } catch (e) {
                        // Fail silently, fallback to no country emphasis
                    }
                }

                const res = await fetch(`${API_BASE_URL}/api/stars`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    let sortedData = [...data];
                    if (userCountry) {
                        sortedData.sort((a, b) => {
                            const aMatch = a.country?.toLowerCase() === userCountry.toLowerCase() ? 1 : 0;
                            const bMatch = b.country?.toLowerCase() === userCountry.toLowerCase() ? 1 : 0;
                            return bMatch - aMatch;
                        });
                    }
                    const limit = isMobile ? 4 : 12;
                    setStars(sortedData.slice(0, limit));
                }
            } catch (err) {
                // silently fail — background effect only
            }
        };

        fetchStars();
    }, []);

    return (
        <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">

            {/* ── Custom Hero Image Background ── */}
            {settings.hero_show_image && settings.hero_image_url && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.35 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        src={settings.hero_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
                </div>
            )}

            {/* ── Ambient glows ── */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
                />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(180,83,9,0.06) 0%, transparent 70%)' }}
                />
                {/* Linen texture */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23B45309'/%3E%3Crect x='0' y='0' width='2' height='2' fill='%23F5F0E8'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23F5F0E8'/%3E%3C/svg%3E\")",
                        backgroundSize: '4px 4px'
                    }}
                />
            </div>

            {/* ── Deep Space Drift Cards (background layer) ── */}
            {settings.hero_show_cards && stars.length > 0 && (
                <div
                    className="absolute inset-0 z-[1] overflow-hidden pointer-events-none"
                >
                    {stars.map((star, i) => (
                        <HeroCard key={star.id} star={star} index={i} />
                    ))}

                    {/* Center radial gradient to ensure text readability */}
                    <div className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle at 50% 50%, rgba(250,248,245,0.85) 0%, rgba(250,248,245,0.4) 45%, transparent 75%)',
                            pointerEvents: 'none',
                        }}
                    />
                </div>
            )}

            {/* ── Hero Content (above cards) ── */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center pt-28 pb-16">

                {/* Skeuomorphic Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
                    className="skeu-badge mb-10 px-5 py-2 flex items-center gap-2"
                >
                    <span className="w-2 h-2 rounded-full"
                        style={{ background: 'radial-gradient(circle, #FBBF24 30%, #B45309 100%)' }}
                    />
                    <span className="text-xs uppercase tracking-widest font-semibold text-amber-800">Premium Gateway Access</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-textPrimary mb-8 tracking-tighter leading-[1.05]"
                >
                    Connect With<br className="hidden md:block" />
                    Global{' '}
                    <span className="py-2" style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 60%, #92400E 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>Icons</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-2xl text-textSecondary mb-14 font-medium max-w-2xl leading-relaxed"
                >
                    Book, meet, and collaborate with the world's most exclusive talents through a frictionless, secure platform.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.1 }}
                    className="flex flex-col sm:flex-row justify-center items-center gap-5 w-full max-w-2xl mx-auto"
                >
                    <Link to="/discover" className={`skeu-btn-primary tracking-wide uppercase flex items-center justify-center group w-auto ${isMobile ? 'px-6 py-4 text-xs gap-3' : 'px-10 py-4 text-sm gap-3'}`}>
                        <Compass className="w-4 h-4 md:w-5 md:h-5 text-amber-100 group-hover:rotate-45 transition-transform duration-500 will-change-transform" />
                        <span>Discover The Elite</span>
                    </Link>
                    <a href="#contact" className={`skeu-btn-dark tracking-wide uppercase flex items-center justify-center gap-2 w-auto ${isMobile ? 'px-6 py-4 text-xs' : 'px-10 py-4 text-sm'}`}>
                        Submit Inquiry
                    </a>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 1 }}
                    className="mt-20 flex gap-12 justify-center"
                >
                    {[
                        { value: '500+', label: 'Global Icons' },
                        { value: '40+', label: 'Countries' },
                        { value: '10K+', label: 'Events Booked' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl font-black tracking-tighter"
                                style={{
                                    background: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >{stat.value}</div>
                            <div className="text-xs uppercase tracking-widest text-textSecondary mt-1 font-semibold">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <div className="w-5 h-9 rounded-full flex justify-center p-1"
                    style={{
                        border: '1.5px solid #D6CEC3',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8)',
                        background: 'linear-gradient(180deg, #FAF8F5 0%, #F0EBE3 100%)',
                    }}
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="w-1 h-1.5 rounded-full"
                        style={{ background: 'linear-gradient(180deg, #F59E0B, #B45309)' }}
                    />
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
