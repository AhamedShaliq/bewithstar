import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

const FAN_IMAGES = [
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2000&auto=format&fit=crop", // Concert Crowd
    "https://images.unsplash.com/photo-1540039155732-d68a9af3e245?q=80&w=2000&auto=format&fit=crop", // Stadium Cheers
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop", // Nightlife Party
    "https://images.unsplash.com/photo-1470229722913-7c092db62220?q=80&w=2000&auto=format&fit=crop", // Excited Fans
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2000&auto=format&fit=crop", // Live Event
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2000&auto=format&fit=crop"  // VIP Crowd
];

const BackgroundLayer = ({ image, index, total, scrollProgress }: { image: string, index: number, total: number, scrollProgress: number }) => {
    const mvProgress = useMotionValue(scrollProgress);
    useEffect(() => {
        mvProgress.set(scrollProgress);
    }, [scrollProgress, mvProgress]);

    const smoothProgress = useSpring(mvProgress, { stiffness: 80, damping: 25 });

    const target = index / (total - 1);

    // Smooth crossfade: peak opacity at exactly the target
    const range = [target - 0.25, target, target + 0.25];
    const opacity = useTransform(smoothProgress, range, [0, 0.45, 0]);

    // Slow cinematic zoom-in effect tied to scroll
    const scale = useTransform(smoothProgress, range, [1.05, 1, 1.05]);

    return (
        <motion.img
            src={image}
            alt="Background Fans"
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
            style={{ opacity, scale, filter: 'grayscale(20%)' }}
        />
    );
};

export const FanBackground = ({ progress }: { progress: number }) => {
    return (
        <div className="fixed inset-0 z-0 bg-background overflow-hidden pointer-events-none">
            {FAN_IMAGES.map((img, idx) => (
                <BackgroundLayer
                    key={idx}
                    image={img}
                    index={idx}
                    total={FAN_IMAGES.length}
                    scrollProgress={progress}
                />
            ))}
            {/* Cinematic bright frosted overlay to ensure dark text is perfectly readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80 pointer-events-none" />
        </div>
    );
};
