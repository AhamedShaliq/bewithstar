import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Scale, FileText, Briefcase, CreditCard, ShieldAlert, AlertTriangle, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScatteredCards from '../components/ScatteredCards';

const Terms = () => {
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

    const terms = [
        {
            icon: <Scale />,
            title: "Acceptance of Terms",
            desc: "By accessing or using the bewithstar platform and our premium talent booking services, you agree to be bound by these definitive Terms of Service. If you do not agree to all the terms and conditions outlined here, you may not access our exclusive network or utilize our concierge services."
        },
        {
            icon: <Briefcase />,
            title: "Elite Service Architecture",
            desc: "bewithstar operates as a premier digital concierage, architecting the booking of elite global talent for exclusive events, global campaigns, and high-profile engagements. We act as an intermediary, streamlining complex logistics, legal agreements, and communications between clients and verified talent representation."
        },
        {
            icon: <FileText />,
            title: "Inquiries & Final Approvals",
            desc: "All bookings are subject to the rigid schedules and final approval of the requested talent. Submission of an inquiry initiates a review process but does not constitute a confirmed contract. bewithstar reserves the right to reject any inquiry that it deems misaligned with our premium brand standards."
        },
        {
            icon: <CreditCard />,
            title: "Financial Commitments & Milestones",
            desc: "Specific payment milestones, non-refundable retainers, and rigorous cancellation policies are detailed in individual contracts negotiated for each specific engagement. Due to the high-demand nature of our elite roster, initial deposits are strictly non-refundable once an event date is legally secured."
        },
        {
            icon: <ShieldAlert />,
            title: "Intellectual Property Exclusivity",
            desc: "The proprietary content, layout, architectural design, data models, and graphics on this platform are protected by international intellectual property laws and are exclusively owned by bewithstar. No part of this digital experience may be reproduced or transmitted without explicit executive authorization."
        },
        {
            icon: <AlertTriangle />,
            title: "Limitation of Liability",
            desc: "bewithstar shall consistently act with the highest degree of professional integrity; however, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or inability to utilize our premium services."
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
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-amber-200/40 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-stone-200/60 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Scattered Talent Cards Background */}
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden z-[1]">
                <ScatteredCards icon={FileText} />
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
                            <FileText size={16} /> Terms of Service
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[1] md:leading-[0.9] mb-8 text-textPrimary flex flex-col items-center text-center"
                        >
                            <span>TERMS OF</span>
                            <span className="text-stone-400 italic font-medium flex items-center justify-center gap-2 md:gap-6 mt-2 md:mt-4">
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 md:w-20 md:h-20 text-amber-500 stroke-[2.5] shrink-0 hidden md:block" />
                                ENGAGEMENT.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.3 }}
                            className="text-textSecondary text-xl font-medium tracking-wide"
                        >
                            The uncompromising foundational agreements that govern our elite global talent network.
                        </motion.p>
                    </div>

                    {/* Terms Clauses - Staggered Scroll Animations */}
                    <div className="space-y-8 md:space-y-12">
                        {terms.map((term, idx) => (
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
                                        {term.icon}
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 relative z-10 pt-1 md:pt-2">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-amber-500/20 text-4xl md:text-5xl font-black tracking-tighter">0{idx + 1}</span>
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-textPrimary leading-none">{term.title}</h2>
                                    </div>
                                    <p className="text-textSecondary text-base md:text-lg font-medium leading-relaxed">
                                        {term.desc}
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
                        <h3 className="text-3xl font-black tracking-tighter mb-4 text-textPrimary">Require a formal agreement review?</h3>
                        <p className="text-textSecondary font-medium mb-8 max-w-2xl mx-auto">
                            For questions related to formal performance agreements or these Terms of Service, please consult our dedicated legal counsel.
                        </p>
                        <a href="mailto:legal@bewithstar.com" className="skeu-btn-primary inline-flex items-center gap-3 px-8 py-4 font-bold text-sm uppercase tracking-widest shadow-lg">
                            <Send size={18} />
                            Contact Legal Counsel
                        </a>
                    </motion.div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Terms;
