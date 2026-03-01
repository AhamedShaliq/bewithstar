import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Shield, Lock, Eye, CheckCircle2, Server, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScatteredCards from '../components/ScatteredCards';

const Privacy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const pageRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: pageRef,
        offset: ["start start", "end end"]
    });

    // Subtly parallax the background pattern
    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    const policies = [
        {
            icon: <Eye />,
            title: "Information We Collect",
            desc: "At bewithstar, we collect information that you provide directly to us. This includes when you create an account, submit an inquiry for elite talent booking, or coordinate logistics for a global event. We curate personal information such as your name, corporate email address, encrypted payment data, and highly confidential event itineraries."
        },
        {
            icon: <Server />,
            title: "How We Use Your Data",
            desc: "The information we collect is strictly utilized to provide, maintain, and elevate our premium services. We process this data to seamlessly negotiate high-stakes transactions, send precise logistical updates, verify global compliance standards, and offer unmatched personalized concierge support throughout the talent booking lifecycle."
        },
        {
            icon: <Globe />,
            title: "Information Sharing",
            desc: "Exclusivity is our promise. We do not mass-share your data. For premium talent negotiations, specific logistical data may be shared confidentially—and only when strictly necessary—with the talent's management team, authorized legal counsel, and vetted elite vendors ensuring flawless event execution."
        },
        {
            icon: <Lock />,
            title: "Military-Grade Security",
            desc: "bewithstar takes unapologetically stringent measures to protect your information. We employ industry-leading zero-trust architecture, edge-encrypted data states, and multi-factor access protocols to maintain the absolute confidentiality of our high-profile clients."
        }
    ];

    return (
        <div ref={pageRef} className="bg-background text-textPrimary min-h-screen relative overflow-hidden flex flex-col">
            {/* Cinematic Animated Background */}
            <motion.div
                style={{ y: bgY }}
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
            >
                <div className="w-[100vw] h-[200vh] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
            </motion.div>

            {/* Ambient Lighting */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-amber-200/40 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-stone-200/60 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Scattered Talent Cards Background */}
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden z-[1]">
                <ScatteredCards />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-32 lg:pt-40 pb-24">
                    {/* Hero Header */}
                    <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="skeu-badge inline-flex items-center gap-3 px-6 py-2 text-xs uppercase tracking-[0.6em] font-black mb-10 bg-white/60 border-stone-200 text-amber-600 shadow-sm backdrop-blur-md"
                        >
                            <Shield size={16} /> Privacy Policy
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[1] md:leading-[0.9] mb-8 text-textPrimary flex flex-col items-center text-center"
                        >
                            <span>YOUR PRIVACY,</span>
                            <span className="text-stone-400 italic font-medium flex items-center justify-center gap-2 md:gap-6 mt-2 md:mt-4">
                                <Lock className="w-8 h-8 sm:w-10 sm:h-10 md:w-20 md:h-20 text-amber-500 stroke-[2.5] shrink-0" />
                                PROTECTED.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.3 }}
                            className="text-textSecondary text-xl font-medium tracking-wide"
                        >
                            We treat your personal and logistical data with the same exclusivity and discretion as the world-class talent we represent.
                        </motion.p>
                    </div>

                    {/* Policy Clauses - Staggered Scroll Animations */}
                    <div className="space-y-8 md:space-y-12">
                        {policies.map((policy, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="skeu-card p-8 md:p-12 bg-white/80 backdrop-blur-md flex flex-col md:flex-row gap-8 md:gap-10 relative overflow-hidden group border border-stone-200/50"
                            >
                                {/* Ambient glow for card */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500 pointer-events-none" />

                                {/* Skeuomorphic Icon Block */}
                                <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-3xl skeu-card bg-amber-50 border-stone-200 flex items-center justify-center text-amber-600 shadow-md group-hover:scale-105 transition-transform duration-500">
                                    <div className="scale-[1.3] md:scale-[1.5]">
                                        {policy.icon}
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 relative z-10 pt-1 md:pt-2">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-amber-500/20 text-4xl md:text-5xl font-black tracking-tighter">0{idx + 1}</span>
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-textPrimary leading-none">{policy.title}</h2>
                                    </div>
                                    <p className="text-textSecondary text-base md:text-lg font-medium leading-relaxed">
                                        {policy.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-32 p-12 skeu-card bg-stone-50 border-stone-200 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-[60px] pointer-events-none" />
                        <h3 className="text-3xl font-black tracking-tighter mb-4 text-textPrimary">Have specific compliance questions?</h3>
                        <p className="text-textSecondary font-medium mb-8 max-w-2xl mx-auto">
                            Our legal and concierge teams are available 24/7 to discuss any stringent privacy requirements you may have prior to booking.
                        </p>
                        <a href="mailto:privacy@bewithstar.com" className="skeu-btn-primary inline-flex items-center gap-3 px-8 py-4 font-bold text-sm uppercase tracking-widest shadow-lg">
                            <CheckCircle2 size={18} />
                            Contact Privacy Team
                        </a>
                    </motion.div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Privacy;
