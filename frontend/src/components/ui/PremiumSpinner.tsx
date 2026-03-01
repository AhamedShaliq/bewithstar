import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface PremiumSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const PremiumSpinner = ({ size = 'md', className = '' }: PremiumSpinnerProps) => {
    const sizeClasses = {
        sm: 'w-12 h-12 p-2',
        md: 'w-24 h-24 p-4',
        lg: 'w-32 h-32 p-6'
    };

    const iconSizes = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className={`relative ${className}`}
        >
            <div
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative z-10`}
                style={{
                    background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
                    boxShadow: '0 0 40px rgba(245,158,11,0.15), inset 0 0 20px rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.2)'
                }}
            >
                <Star
                    className={`${iconSizes[size]} text-amber-500 fill-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]`}
                />
            </div>
        </motion.div>
    );
};

export default PremiumSpinner;
