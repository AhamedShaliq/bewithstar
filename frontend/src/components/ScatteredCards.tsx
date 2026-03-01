import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Lock } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage } from '../utils/imageUtils';

interface Star { id: number; name: string; image_url: string; category: string; }

interface ScatteredCardsProps {
    icon?: React.ElementType;
}

const ScatteredCards = ({ icon: Icon = Lock }: ScatteredCardsProps) => {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/stars`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setStars(data.slice(0, 5)); })
            .catch(() => { });
    }, []);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"] // Track over the entire page height
    });

    // Apply a spring physics layer over the scroll progress to remove jitter
    const smoothScroll = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 20,
        mass: 0.5
    });

    // Reduce the extreme movement to create a subtle, smooth parallax rather than aggressive drifting
    const yMove1 = useTransform(smoothScroll, [0, 1], [0, -80]);
    const yMove2 = useTransform(smoothScroll, [0, 1], [0, -140]);
    const yMove3 = useTransform(smoothScroll, [0, 1], [0, -100]);

    if (stars.length < 5) return null;

    return (
        <div ref={containerRef} className="fixed inset-0 w-[100vw] h-[100vh] pointer-events-none overflow-hidden z-0">

            {/* MOBILE LAYOUT: Less intrusive, pushed to edges, highly transparent */}
            <div className="block md:hidden absolute inset-0 w-full h-full">
                <motion.div
                    style={{ y: yMove1 }}
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 0.15, scale: 1, x: 0, rotate: -6 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[10%] left-[-20%] w-32 h-44 rounded-2xl overflow-hidden shadow-2xl z-0 blur-[3px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[0].image_url)} alt={stars[0].name} className="w-full h-full object-cover blur-sm scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-8 h-8 text-white/70" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    style={{ y: yMove3 }}
                    initial={{ opacity: 0, scale: 0.8, x: 20, rotate: 10 }}
                    whileInView={{ opacity: 0.2, scale: 1, x: 0, rotate: -5 }}
                    viewport={{ once: false, margin: "-10%" }}
                    transition={{ duration: 2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[60%] right-[-15%] w-36 h-48 rounded-2xl overflow-hidden shadow-xl z-0 blur-[3px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[1].image_url)} alt={stars[1].name} className="w-full h-full object-cover blur-md scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-8 h-8 text-white/70" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* DESKTOP LAYOUT: Existing layout exactly as requested, enclosed to hide on smaller screens */}
            <div className="hidden md:block absolute inset-0 w-full h-full">
                {/* Left Cards */}
                <motion.div
                    style={{ y: yMove1 }}
                    initial={{ opacity: 0, scale: 0.8, x: -50 }}
                    animate={{ opacity: 0.4, scale: 1, x: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[20%] left-[-5%] md:left-[5%] w-32 h-44 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl z-0 blur-[2px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[0].image_url)} alt={stars[0].name} className="w-full h-full object-cover blur-sm scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-8 h-8 md:w-10 md:h-10 text-white/70" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    style={{ y: yMove2 }}
                    initial={{ opacity: 0, scale: 0.8, x: -80, rotate: 15 }}
                    whileInView={{ opacity: 0.6, scale: 1, x: 0, rotate: 12 }}
                    viewport={{ once: false, margin: "-10%" }}
                    transition={{ duration: 1.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[60%] left-[-10%] md:left-[10%] w-40 h-56 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] z-0 blur-[1px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[1].image_url)} alt={stars[1].name} className="w-full h-full object-cover blur-md scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-10 h-10 md:w-12 md:h-12 text-white/70" />
                        </div>
                    </div>
                </motion.div>

                {/* Right Cards */}
                <motion.div
                    style={{ y: yMove3 }}
                    initial={{ opacity: 0, scale: 0.8, x: 50, rotate: -5 }}
                    animate={{ opacity: 0.4, scale: 1, x: 0, rotate: 8 }}
                    transition={{ duration: 1.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[15%] right-[-5%] md:right-[5%] w-36 h-48 md:w-52 md:h-68 rounded-2xl overflow-hidden shadow-2xl z-0 blur-[2px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[2].image_url)} alt={stars[2].name} className="w-full h-full object-cover blur-sm scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-8 h-8 md:w-10 md:h-10 text-white/70" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    style={{ y: yMove2 }}
                    initial={{ opacity: 0, scale: 0.8, x: 80, rotate: -20 }}
                    whileInView={{ opacity: 0.6, scale: 1, x: 0, rotate: -15 }}
                    viewport={{ once: false, margin: "-10%" }}
                    transition={{ duration: 2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[55%] right-[-10%] md:right-[15%] w-44 h-60 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] z-0 blur-[1px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[3].image_url)} alt={stars[3].name} className="w-full h-full object-cover blur-md scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-10 h-10 md:w-12 md:h-12 text-white/70" />
                        </div>
                    </div>
                </motion.div>

                {/* Center Top Subtle Card */}
                <motion.div
                    style={{ y: yMove1 }}
                    initial={{ opacity: 0, scale: 0.9, y: -50 }}
                    animate={{ opacity: 0.2, scale: 1, y: 0, rotate: -2 }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[-10%] md:top-[5%] left-[50%] -translate-x-1/2 w-48 h-64 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl z-0 blur-[4px]"
                >
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.8)' }}>
                        <img src={getPrimaryImage(stars[4].image_url)} alt={stars[4].name} className="w-full h-full object-cover blur-md scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Icon className="w-12 h-12 md:w-16 md:h-16 text-white/70" />
                        </div>
                    </div>
                </motion.div>
            </div>

        </div>
    );
};

export default ScatteredCards;
