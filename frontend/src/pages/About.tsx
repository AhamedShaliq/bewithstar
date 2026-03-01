import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Star, ArrowUpRight,
    Handshake, Lock, Heart, Trophy, MapPin
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../utils/apiConfig';

const About = () => {
    const bgImages = [
        `${API_BASE_URL}/uploads/aboutup/Celebrity_1.png`,
        `${API_BASE_URL}/uploads/aboutup/Celebrity_2.png`,
        `${API_BASE_URL}/uploads/aboutup/Celebrity_3.png`,
        `${API_BASE_URL}/uploads/aboutup/Celebrity_4.png`,
        `${API_BASE_URL}/uploads/aboutup/Celebrity_5.png`,
        `${API_BASE_URL}/uploads/aboutup/Celebrity_6.png`
    ];

    const missions = [
        { icon: <Handshake strokeWidth={1.5} />, title: "Connections", desc: "Bridging the gap between immense talent and monumental brands." },
        { icon: <Lock strokeWidth={1.5} />, title: "Trust", desc: "Establishing secure, transparent partnerships." },
        { icon: <Zap strokeWidth={1.5} />, title: "Innovation", desc: "Tech-driven execution in a manual industry." },
        { icon: <MapPin strokeWidth={1.5} />, title: "Reach", desc: "International resonance across borders." },
        { icon: <Trophy strokeWidth={1.5} />, title: "Excellence", desc: "Nurturing influence to create legacies." },
        { icon: <Heart strokeWidth={1.5} />, title: "Memories", desc: "Curating moments that leave cultural impact." }
    ];

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(heroProgress, [0, 1], ["0%", "50%"]);
    const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
    const imageScale = useTransform(heroProgress, [0, 1], [1, 1.1]);

    const statsRef = useRef<HTMLDivElement>(null);

    return (
        <div className="bg-stone-50 text-stone-900 min-h-screen font-sans overflow-x-hidden selection:bg-amber-500/30">
            <Navbar />

            {/* SCENE 1: THE EXHIBITION HERO */}
            <section ref={heroRef} className="relative min-h-[110vh] flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
                {/* Ambient Background Light */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2  w-[120vw] h-[100vh] bg-gradient-radial from-amber-100/40 via-stone-50 to-stone-50 mix-blend-multiply opacity-70 blur-3xl pointer-events-none" />

                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="relative z-10 max-w-7xl w-full flex flex-col md:flex-row items-center gap-12 lg:gap-24"
                >
                    <div className="w-full md:w-1/2 space-y-8 text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
                            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/60 border border-white/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
                        >
                            <Star size={14} className="text-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-600">The Standard</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
                            className="text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter leading-[0.9] text-stone-900"
                        >
                            CULTURAL<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700 italic font-serif">LEGACY.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
                            className="text-xl md:text-2xl text-stone-500 font-light max-w-lg leading-relaxed mix-blend-multiply mx-auto md:mx-0"
                        >
                            We don't just facilitate bookings; we curate the moments that define generations.
                        </motion.p>
                    </div>

                    {/* The Skeuomorphic Image Frame */}
                    <div className="w-full md:w-1/2 flex justify-center lg:justify-end">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="relative w-full max-w-[450px] aspect-[3/4] rounded-[2.5rem] bg-white p-3 border border-stone-200/50 shadow-[0_40px_80px_rgba(0,0,0,0.08),inset_0_2px_10px_rgba(255,255,255,1)]"
                        >
                            <div className="w-full h-full rounded-[2rem] overflow-hidden bg-stone-100 shadow-[inset_0_4px_20px_rgba(0,0,0,0.06)] relative border border-stone-200/50">
                                <motion.img
                                    style={{ scale: imageScale }}
                                    src={bgImages[0]}
                                    alt="Hero Star"
                                    className="w-full h-full object-cover object-top drop-shadow-2xl"
                                />
                                {/* Glass Reflection Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/40 mix-blend-overlay pointer-events-none" />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* SCENE 2: THE NARRATIVE (Elegant staggered blocks) */}
            <section className="relative py-32 bg-white border-y border-stone-200 shadow-[0_0_50px_rgba(0,0,0,0.02)] z-20">
                <div className="max-w-6xl mx-auto px-6 space-y-32">

                    {/* Genesis */}
                    <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
                        <div className="w-full md:w-1/2 order-2 md:order-1 relative">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1 }}
                                className="relative rounded-3xl overflow-hidden bg-stone-100/50 aspect-square flex items-end justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.03)] border border-stone-100"
                            >
                                <img src={bgImages[1]} alt="Genesis" className="w-[100%] md:w-[100%] h-auto object-contain object-bottom origin-bottom scale-[1.60] translate-y-3 drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)]" />
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1, delay: 0.2 }}
                            className="w-full md:w-1/2 space-y-8 order-1 md:order-2 text-center md:text-left"
                        >
                            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-stone-900 leading-[1.1]">
                                The <br /><span className="italic font-serif text-amber-600">Genesis.</span>
                            </h2>
                            <p className="text-2xl text-stone-500 font-light leading-relaxed">
                                Founded in 2014, bewithstar began with a single mission: to revolutionize the accessibility of elite talent across global borders.
                            </p>
                        </motion.div>
                    </div>

                    {/* Scale */}
                    <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1, delay: 0.2 }}
                            className="w-full md:w-1/2 space-y-8 text-center md:text-right"
                        >
                            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-stone-900 leading-[1.1]">
                                The <br /><span className="italic font-serif text-amber-600">Scale.</span>
                            </h2>
                            <p className="text-2xl text-stone-500 font-light leading-relaxed md:ml-auto">
                                What started as an exclusive collective rapidly scaled into a robust infrastructure, supporting the world's most influential icons.
                            </p>
                        </motion.div>
                        <div className="w-full md:w-1/2 relative">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1 }}
                                className="relative rounded-3xl overflow-hidden bg-stone-100/50 aspect-[4/3] flex items-end justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.03)] border border-stone-100"
                            >
                                <img src={bgImages[4]} alt="Scale" className="w-[65%] md:w-[75%] h-auto object-contain object-bottom origin-bottom scale-[1.60] translate-y-3 drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)]" />
                            </motion.div>
                        </div>
                    </div>

                </div>
            </section>

            {/* SCENE 3: THE BENTO DASHBOARD */}
            <section className="relative py-32 px-6 lg:px-12 bg-stone-50 z-10 overflow-hidden border-b border-stone-200">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />

                <div className="max-w-7xl mx-auto space-y-16 relative">
                    <div className="text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-5xl md:text-6xl font-bold tracking-tight text-stone-900"
                        >
                            Core Capabilities.
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {missions.map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-5%" }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="group bg-white p-8 rounded-3xl border border-stone-200/70 shadow-[0_8px_20px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.08),inset_0_2px_5px_rgba(255,255,255,1)] transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-stone-100 to-transparent opacity-50 pointer-events-none" />

                                <div className="w-14 h-14 rounded-2xl bg-amber-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] border border-amber-100 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                    {m.icon}
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-stone-900 group-hover:text-amber-700 transition-colors relative z-10">{m.title}</h3>
                                <p className="text-stone-500 font-medium leading-relaxed relative z-10">{m.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SCENE 4: EXECUTIVE RIBBON (Compact Impact) */}
            <section ref={statsRef} className="relative py-8 md:py-12 bg-stone-50 border-y border-stone-100 z-20 shadow-[inset_0_-10px_30px_rgba(0,0,0,0.02)]">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-stone-200 shadow-[0_15px_35px_rgba(0,0,0,0.03)] py-6 md:py-8 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 relative overflow-hidden"
                    >
                        {/* Subtle Glass Highlight */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-stone-200/40 to-transparent" />

                        {[
                            { label: "Countries Active", value: "50+", delay: 0 },
                            { label: "Elite Talents", value: "200+", delay: 0.1 },
                            { label: "Audience Reach", value: "10B+", delay: 0.2 }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-1 items-center justify-center w-full relative">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: stat.delay }}
                                    className="text-center group py-2 md:py-0"
                                >
                                    <div className="text-3xl lg:text-4xl font-bold tracking-tighter text-stone-900 mb-0.5 group-hover:text-amber-600 transition-colors duration-300">
                                        {stat.value}
                                    </div>
                                    <div className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[8px] opacity-80">
                                        {stat.label}
                                    </div>
                                </motion.div>

                                {/* Dividers */}
                                {i < 2 && (
                                    <>
                                        {/* Vertical Divider (Desktop) */}
                                        <div className="hidden md:block absolute -right-[1px] top-1/2 -translate-y-1/2 w-px h-10 bg-gradient-to-b from-transparent via-stone-200/60 to-transparent" />
                                        {/* Horizontal Divider (Mobile) */}
                                        <div className="md:hidden absolute -bottom-4 inset-x-12 h-px bg-gradient-to-r from-transparent via-stone-200/60 to-transparent" />
                                    </>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* SCENE 5: FINALE CTA */}
            <section className="relative pt-32 pb-48 flex flex-col items-center justify-center px-6 overflow-hidden bg-stone-100 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.03)] border-b border-stone-200">

                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
                    className="text-center max-w-3xl relative z-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200 bg-white/60 shadow-sm text-stone-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        The Next Chapter
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-12 text-stone-900">
                        Start Your <br />
                        <span className="text-amber-600 italic font-serif">Legacy.</span>
                    </h2>

                    <Link
                        to="/#contact"
                        className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 rounded-full bg-stone-900 text-white font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-amber-600 hover:shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:-translate-y-1"
                    >
                        <span>Begin Inquiry</span>
                        <ArrowUpRight strokeWidth={2.5} size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                </motion.div>

                {/* Ambient Statues */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.3 }}
                    className="absolute bottom-0 w-full flex justify-between px-0 lg:px-12 z-10 pointer-events-none opacity-40 mix-blend-multiply"
                >
                    <img src={bgImages[5]} alt="Statue Left" className="h-[30vh] md:h-[65vh] object-contain object-bottom -translate-x-[20%] translate-y-[20%]" />
                    <img src={bgImages[2]} alt="Statue Right" className="h-[35vh] md:h-[50vh] object-contain object-bottom translate-x-[20%] translate-y-[40%]" />
                </motion.div>

            </section>

            <Footer />
        </div>
    );
};

export default About;
