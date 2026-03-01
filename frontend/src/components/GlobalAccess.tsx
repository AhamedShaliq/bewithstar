import { Globe2, ShieldCheck, Award, Briefcase } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const features = [
    {
        icon: <Globe2 className="w-7 h-7" />,
        title: 'Global Representation',
        description: 'Access an elite network of talent across continents, transcending geographical boundaries.',
    },
    {
        icon: <ShieldCheck className="w-7 h-7" />,
        title: 'Secure Communication',
        description: 'End-to-end encrypted inquiries ensuring absolute discretion for high-profile negotiations.',
    },
    {
        icon: <Award className="w-7 h-7" />,
        title: 'Verified Talent Network',
        description: 'Every profile is directly authenticated, guaranteeing direct access to management teams.',
    },
    {
        icon: <Briefcase className="w-7 h-7" />,
        title: 'Discretion & Professionalism',
        description: 'Vetted procedures designed for premium brands and ultra-high-net-worth individuals.',
    },
];

const GlobalAccess = () => {
    const { scrollYProgress } = useScroll();
    const bgY = useTransform(scrollYProgress, [0, 1], [-50, 50]);

    return (
        <section id="discover" className="py-24 md:py-32 warm-divider relative overflow-hidden" style={{ background: '#FAF8F5' }}>

            {/* Warm ambient */}
            <motion.div
                style={{ y: bgY, background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vw] pointer-events-none"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <span className="skeu-badge inline-block px-5 py-2 text-xs uppercase tracking-widest mb-6">
                        The Premium Gateway
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-textPrimary tracking-tighter mb-6">
                        Exclusive Access
                    </h2>
                    <div className="w-20 h-1 mx-auto mb-6 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #F59E0B, #B45309)' }}
                    />
                    <p className="text-textSecondary max-w-2xl mx-auto font-medium leading-relaxed text-lg">
                        bewithstar provides a frictionless, high-end portal designed for decision makers to connect directly with global icons.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.6 }}
                            className="skeu-card p-8 group transition-all duration-300 hover:-translate-y-2"
                        >
                            {/* Icon in embossed circle */}
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
                                style={{
                                    background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
                                    border: '1px solid #F59E0B',
                                    borderBottomColor: '#D97706',
                                    boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 6px rgba(180,83,9,0.15)',
                                    color: '#B45309',
                                }}
                            >
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold mb-3 text-textPrimary tracking-tight">{feature.title}</h3>
                            <p className="text-sm text-textSecondary leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GlobalAccess;
