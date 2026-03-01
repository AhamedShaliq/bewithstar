import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: ReactNode;
}

const SmoothScroll = ({ children }: SmoothScrollProps) => {
    const location = useLocation();

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        const raf = (time: number) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };

        requestAnimationFrame(raf);

        // Handle React Router Hash Jumps natively with Lenis
        if (location.hash) {
            // Slight delay to ensure DOM layout is complete before calculating jump height
            setTimeout(() => {
                lenis.scrollTo(location.hash, { offset: 0, duration: 1.5 });
            }, 100);
        } else {
            lenis.scrollTo(0, { immediate: true });
        }

        return () => {
            lenis.destroy();
        };
    }, [location.pathname, location.hash]); // Refresh instance on route or hash changes

    return <>{children}</>;
};

export default SmoothScroll;
