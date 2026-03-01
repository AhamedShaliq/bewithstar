import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage } from '../utils/imageUtils';

interface Star {
    id: number;
    name: string;
    image_url: string;
}

interface Star {
    id: number;
    name: string;
    image_url: string;
}

interface FloatingStarsProps {
    progress: number; // 0 to 1 value from Swiper
}

// Map each photo to a specific horizontal "slice" of the total scroll progress
// so it triggers explicitly during its designated scene.
const STAR_CONFIG = [
    { progressTarget: 0.15, top: '20%', left: '10%', scale: 0.8 },
    { progressTarget: 0.25, top: '70%', left: '80%', scale: 1.1 },
    { progressTarget: 0.35, top: '15%', left: '60%', scale: 0.9 },
    { progressTarget: 0.45, top: '60%', left: '20%', scale: 1.2 },
    { progressTarget: 0.55, top: '80%', left: '50%', scale: 0.8 },
    { progressTarget: 0.65, top: '30%', left: '85%', scale: 1 },
    { progressTarget: 0.75, top: '10%', left: '30%', scale: 1.1 },
    { progressTarget: 0.85, top: '50%', left: '15%', scale: 0.9 },
];

const FloatingStarPicture = ({
    star,
    config,
    scrollProgress
}: {
    star: Star,
    config: typeof STAR_CONFIG[0],
    scrollProgress: number
}) => {
    // Convert raw primitive scroll progress to a reactive Framer Motion value.
    // Every time the component re-renders with a new primitive progress, update the motion value.
    const mvProgress = useMotionValue(scrollProgress);
    useEffect(() => {
        mvProgress.set(scrollProgress);
    }, [scrollProgress, mvProgress]);

    // Create a smoothed spring version of the progress for fluid physics
    const smoothProgress = useSpring(mvProgress, { stiffness: 100, damping: 20 });

    // The peak animation happens when smoothProgress == config.progressTarget
    // We map a range (-0.1 to 0 to +0.1) around the target
    const range = [
        config.progressTarget - 0.15, // start appearing
        config.progressTarget,        // peak
        config.progressTarget + 0.15  // fully disappeared
    ];

    // Map progress to scale, opacity, and flash
    const scale = useTransform(smoothProgress, range, [0.5 * config.scale, 1.2 * config.scale, 0.5 * config.scale]);
    const opacity = useTransform(smoothProgress, range, [0, 0.8, 0]);

    // Flash happens strictly at the peak
    const flashOpacity = useTransform(
        smoothProgress,
        [config.progressTarget - 0.05, config.progressTarget, config.progressTarget + 0.05],
        [0, 0.5, 0]
    );

    // Parallax drift backwards during the appearance window
    const x = useTransform(smoothProgress, range, [100, 0, -100]);

    return (
        <motion.div
            className="absolute rounded-2xl overflow-hidden shadow-2xl z-0 pointer-events-none"
            style={{
                top: config.top,
                left: config.left,
                width: 200,
                height: 280,
                scale,
                opacity,
                rotate: (config.progressTarget * 100) % 20 - 10,
                x
            }}
        >
            <div className="w-full h-full relative" style={{ border: '2px solid rgba(255,255,255,0.8)' }}>
                <img
                    src={getPrimaryImage(star.image_url)}
                    alt={star.name}
                    className="w-full h-full object-cover mix-blend-overlay"
                />

                <motion.div
                    className="absolute inset-0 bg-white mix-blend-overlay"
                    style={{ opacity: flashOpacity }}
                />
            </div>
        </motion.div>
    );
};

export const FloatingStars = ({ progress }: FloatingStarsProps) => {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/stars`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Grab enough stars to fill our config slots
                    setStars(data.slice(0, STAR_CONFIG.length));
                }
            })
            .catch(console.error);
    }, []);

    if (stars.length === 0) return null;

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {stars.map((star, idx) => (
                <FloatingStarPicture
                    key={star.id}
                    star={star}
                    config={STAR_CONFIG[idx % STAR_CONFIG.length]}
                    scrollProgress={progress}
                />
            ))}
        </div>
    );
};
