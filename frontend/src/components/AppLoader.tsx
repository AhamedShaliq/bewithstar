import { motion } from 'framer-motion';
import PremiumSpinner from './ui/PremiumSpinner';

const AppLoader = () => {
    const letters = "MEETMYSTAR".split('');

    return (
        <motion.div
            key="app-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background h-[100dvh] w-screen overflow-hidden"
        >
            {/* Spinning Star Logo */}
            <PremiumSpinner size="md" className="mb-8" />

            {/* Typography - Staggered Letters loading effect */}
            <div className="flex items-center justify-center ml-2">
                {letters.map((char, i) => {
                    const isAmber = i >= 2 && i <= 5; // "WITH"
                    return (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{
                                duration: 0.5,
                                delay: i * 0.1, // Stagger each letter by 100ms
                                ease: 'easeOut'
                            }}
                            className={`text-xl md:text-2xl font-black tracking-[0.2em] ${isAmber ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-textPrimary'}`}
                        >
                            {char}
                        </motion.span>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default AppLoader;
