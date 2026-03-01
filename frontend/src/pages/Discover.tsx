import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, X, ChevronRight, SlidersHorizontal, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkeuSelect from '../components/ui/SkeuSelect';
import ContactForm from '../components/ContactForm';
import { useDeviceDetect } from '../hooks/useDeviceDetect';
import { getPrimaryImage, getAllImages } from '../utils/imageUtils';
import PremiumSpinner from '../components/ui/PremiumSpinner';

interface Star {
    id: number;
    name: string;
    category: string;
    country: string;
    short_bio: string;
    full_bio: string;
    image_url: string;
    availability_status: string;
}

const CATEGORIES = ['All Categories', 'Actor', 'Musician', 'Athlete', 'Influencer', 'Speaker', 'Comedian', 'Politician', 'Other'];
const ITEMS_PER_PAGE = 12;

// Pre-computed scattered positions for up to 12 cards (% from center, rotation, scale, z-index depth blur)
const CARD_LAYOUT = [
    { x: '-40vw', y: '-25vh', rot: -15, scale: 0.9, blur: 1, baseOp: 0.4 },
    { x: '35vw', y: '-30vh', rot: 12, scale: 0.7, blur: 3, baseOp: 0.25 },
    { x: '-45vw', y: '20vh', rot: 18, scale: 1.1, blur: 0, baseOp: 0.5 },
    { x: '42vw', y: '25vh', rot: -10, scale: 0.85, blur: 2, baseOp: 0.35 },
    { x: '-15vw', y: '-40vh', rot: 8, scale: 0.65, blur: 4, baseOp: 0.2 },
    { x: '25vw', y: '-42vh', rot: -20, scale: 0.95, blur: 1, baseOp: 0.45 },
    { x: '-30vw', y: '35vh', rot: -12, scale: 0.75, blur: 3, baseOp: 0.25 },
    { x: '38vw', y: '40vh', rot: 15, scale: 1.05, blur: 0, baseOp: 0.45 },
    { x: '-5vw', y: '-48vh', rot: -5, scale: 0.6, blur: 5, baseOp: 0.15 },
    { x: '48vw', y: '-10vh', rot: -8, scale: 0.8, blur: 2, baseOp: 0.3 },
    { x: '-48vw', y: '-5vh', rot: 10, scale: 0.9, blur: 1, baseOp: 0.4 },
    { x: '10vw', y: '45vh', rot: -6, scale: 0.7, blur: 3, baseOp: 0.25 },
];

const HeroCard = ({ star, index }: { star: Star, index: number }) => {
    const layout = CARD_LAYOUT[index % CARD_LAYOUT.length];
    return (
        <motion.div
            whileHover={{ scale: layout.scale * 1.0, zIndex: 60, filter: `blur(${layout.blur * 0.5}px)`, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            className="absolute will-change-transform"
            style={{ left: '50%', top: '50%', x: '-50%', y: '-50%', transformOrigin: 'center center' }}
            initial={{ x: '-50%', y: '-50%', scale: layout.scale * 3, opacity: 0, rotate: layout.rot * 2, filter: 'blur(20px)' }}
            animate={{ x: `calc(-50% + ${layout.x})`, y: `calc(-50% + ${layout.y})`, scale: layout.scale, opacity: layout.baseOp, rotate: layout.rot, filter: `blur(${layout.blur}px)` }}
            transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 + index * 0.15 }}
        >
            <motion.div animate={{ x: [0, (index % 2 === 0 ? 10 : -10), 0], y: [0, (index % 3 === 0 ? -15 : 15), 0], rotate: [0, (index % 2 === 0 ? 2 : -2), 0] }} transition={{ duration: 15 + (index % 5) * 2, repeat: Infinity, ease: 'linear', delay: 3.5 + index * 0.15 }}>
                <div className="w-[140px] h-[190px] md:w-[180px] md:h-[240px] rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-300 pointer-events-none select-none" style={{ background: 'linear-gradient(180deg,#FFF,#F5F0E8)', border: '1px solid rgba(231,224,213,0.3)' }}>
                    <img src={getPrimaryImage(star.image_url)} alt={star.name} className="w-full h-full object-cover" />
                </div>
            </motion.div>
        </motion.div>
    );
};

const Discover = () => {
    const { isMobile } = useDeviceDetect();
    const [stars, setStars] = useState<Star[]>([]);
    const [heroStars, setHeroStars] = useState<Star[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedCountry, setSelectedCountry] = useState('All Countries');
    const [selectedStar, setSelectedStar] = useState<Star | null>(null);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingStar, setBookingStar] = useState<Star | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Auto-slide logic for Modal Gallery
    useEffect(() => {
        if (!selectedStar) {
            setCurrentImgIndex(0);
            return;
        }

        const images = getAllImages(selectedStar.image_url);
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImgIndex(prev => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedStar]);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchAllStars = async () => {
            try {
                // Fetch user country for hero sorting priority
                let userCountry = sessionStorage.getItem('user_country') || '';
                if (!userCountry) {
                    try {
                        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                        if (ipRes.ok) {
                            const ipData = await ipRes.json();
                            userCountry = ipData.country || '';
                            if (userCountry) sessionStorage.setItem('user_country', userCountry);
                        }
                    } catch (e) {
                        // Fail silently for geo
                    }
                }

                // Fetch stars
                const r = await fetch(`${API_BASE_URL}/api/stars`);
                const data = await r.json();

                if (Array.isArray(data)) {
                    setStars(data);

                    // Prepare hero stars (sorted by country, sliced to 12)
                    let sortedData = [...data];
                    if (userCountry) {
                        sortedData.sort((a, b) => {
                            const aMatch = a.country?.toLowerCase() === userCountry.toLowerCase() ? 1 : 0;
                            const bMatch = b.country?.toLowerCase() === userCountry.toLowerCase() ? 1 : 0;
                            return bMatch - aMatch;
                        });
                    }
                    setHeroStars(sortedData.slice(0, 12));
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching stars:', err);
                setLoading(false);
            }
        };

        fetchAllStars();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedCountry]);

    // Lock body scroll when modals are open
    useEffect(() => {
        if (selectedStar || isBookingOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedStar, isBookingOpen]);

    const countryOptions = useMemo(() => {
        const uniqueCountries = Array.from(new Set(stars.map(s => s.country))).sort();
        return [
            { label: 'All Countries', value: 'All Countries' },
            ...uniqueCountries.map(c => ({ label: c, value: c }))
        ];
    }, [stars]);

    const categoryOptions = CATEGORIES.map(c => ({ label: c, value: c }));

    const filteredStars = useMemo(() => {
        return stars.filter(star => {
            const matchesSearch = star.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                star.short_bio.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All Categories' || star.category === selectedCategory;
            const matchesCountry = selectedCountry === 'All Countries' || star.country === selectedCountry;
            return matchesSearch && matchesCategory && matchesCountry;
        });
    }, [stars, searchTerm, selectedCategory, selectedCountry]);

    const totalPages = Math.ceil(filteredStars.length / ITEMS_PER_PAGE);
    const paginatedStars = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredStars.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredStars, currentPage]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const gridElement = document.getElementById('results-grid');
        if (gridElement) {
            const offset = 140; // Sticky header offset
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = gridElement.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const modalImages = selectedStar ? getAllImages(selectedStar.image_url) : [];

    return (
        <div className="min-h-screen bg-background flex flex-col pt-24 relative">
            <Navbar />

            {/* Scattered Hero Cards Background Layer - Restricted height with a fading mask so cards don't bleed into results */}
            <div
                className="absolute top-0 left-0 right-0 h-[70vh] lg:h-[60vh] z-0 pointer-events-none opacity-40 overflow-hidden"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
                }}
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                {/* Inner container provides the 100vh physical bounds so the `vh` card layout math works perfectly */}
                <div className="absolute top-0 left-0 right-0 h-[100vh]">
                    {heroStars.map((star, i) => (
                        <HeroCard key={star.id} star={star} index={i} />
                    ))}
                </div>
            </div>

            {/* Header Section */}
            <section className="py-12 md:py-20 relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center justify-center min-h-[40vh]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="skeu-badge inline-block px-5 py-2 text-xs uppercase tracking-widest mb-6">
                            Elite Talent Roster
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-textPrimary tracking-tighter mb-6">
                            Discover Your Next Icon
                        </h1>
                        <p className="text-textSecondary max-w-2xl mx-auto font-medium text-lg md:text-xl leading-relaxed">
                            Browse through our curated collection of global talents across film, music, sports, and media.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Filters Section - Mobile Optimized */}
            <section className="sticky top-20 z-40 py-4 border-y border-stone-200/60 bg-white/90 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">

                        {/* Search & Filters Layout - Mobile Drawer / Desktop Row */}
                        <div className="w-full flex flex-col lg:flex-row gap-3 lg:items-center">

                            {/* Top Bar: Search Input + Mobile Filter Toggle */}
                            <div className="flex w-full lg:w-auto lg:flex-1 gap-2 lg:gap-4 items-center">
                                {/* Search Input */}
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or keyword..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="skeu-input w-full pl-9 pr-3 py-2 text-sm lg:py-2.5"
                                    />
                                </div>

                                {/* Mobile Filter Toggle Button */}
                                <button
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className={`lg:hidden skeu-btn flex flex-shrink-0 items-center justify-center h-10 px-4 gap-2 transition-colors ${showMobileFilters ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-textSecondary hover:text-textPrimary'}`}
                                >
                                    <SlidersHorizontal size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">Filters</span>
                                </button>
                            </div>

                            {/* Collapsible Dropdowns Container */}
                            <AnimatePresence initial={false}>
                                {(showMobileFilters || !isMobile) && (
                                    <motion.div
                                        initial={isMobile ? { height: 0, opacity: 0, overflow: 'hidden' } : false}
                                        animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                                        exit={isMobile ? { height: 0, opacity: 0, overflow: 'hidden' } : undefined}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        className="w-full lg:w-auto flex flex-col sm:flex-row lg:items-center gap-2 lg:gap-3 lg:flex-shrink-0"
                                    >
                                        <div className="flex-1 lg:w-48">
                                            <SkeuSelect
                                                options={categoryOptions}
                                                value={selectedCategory}
                                                onChange={setSelectedCategory}
                                                placeholder="Category"
                                            />
                                        </div>
                                        <div className="flex-1 lg:w-56">
                                            <SkeuSelect
                                                options={countryOptions}
                                                value={selectedCountry}
                                                onChange={setSelectedCountry}
                                                placeholder="Country"
                                            />
                                        </div>

                                        {/* Clear Button */}
                                        {(searchTerm || selectedCategory !== 'All Categories' || selectedCountry !== 'All Countries') && (
                                            <div className="w-full lg:w-auto flex justify-end lg:justify-center mt-2 lg:mt-0">
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setSelectedCategory('All Categories');
                                                        setSelectedCountry('All Countries');
                                                    }}
                                                    className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors py-2 lg:py-0"
                                                >
                                                    <X size={14} /> Clear
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>
                </div>
            </section>

            {/* Results Grid */}
            <main className="flex-grow py-12 md:py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <PremiumSpinner size="md" />
                            <p className="text-textSecondary font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Syncing with the stars...</p>
                        </div>
                    ) : paginatedStars.length > 0 ? (
                        <>
                            <div id="results-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {paginatedStars.map((star, idx) => (
                                    <motion.div
                                        key={star.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group cursor-pointer"
                                        onClick={() => setSelectedStar(star)}
                                    >
                                        <div className="relative aspect-[3/4] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl md:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-stone-100">
                                            <img
                                                src={getPrimaryImage(star.image_url)}
                                                alt={star.name}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                                            <div className={`absolute bottom-0 left-0 w-full p-6 text-white group-hover:translate-y-0 transition-transform duration-500 ${isMobile ? 'translate-y-0' : 'translate-y-2'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-amber-500 text-black">
                                                        {star.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black tracking-tighter mb-1">{star.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium">
                                                    <Globe size={12} className="text-amber-500" />
                                                    {star.country}
                                                </div>

                                                <div className={`mt-4 flex items-center justify-between group-hover:opacity-100 transition-opacity duration-500 ${isMobile ? 'opacity-100' : 'opacity-0'}`}>
                                                    <span className="text-xs font-bold uppercase tracking-widest text-amber-500">View Details</span>
                                                    <ChevronRight size={16} className="text-amber-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-20 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`p-3 rounded-xl skeu-card transition-all duration-300 ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5'}`}
                                    >
                                        <ChevronRight className="rotate-180 w-5 h-5 text-amber-600" />
                                    </button>

                                    <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-stone-50 border border-stone-200/60 shadow-inner">
                                        {[...Array(totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Simple logic to show current, first, last, and neighbors
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-black transition-all duration-300 
                                                        ${currentPage === pageNum
                                                                ? 'bg-amber-500 text-black shadow-[0_2px_10px_rgba(245,158,11,0.3)] scale-110'
                                                                : 'text-textSecondary hover:bg-stone-200/50 hover:text-textPrimary'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === currentPage - 2 ||
                                                pageNum === currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="text-stone-300 font-bold px-1">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`p-3 rounded-xl skeu-card transition-all duration-300 ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5'}`}
                                    >
                                        <ChevronRight className="w-5 h-5 text-amber-600" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-6">
                                <Search className="w-8 h-8 text-stone-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-textPrimary mb-2">No icons found</h3>
                            <p className="text-textSecondary max-w-sm mx-auto">
                                We couldn't find any stars matching your current criteria. Try adjusting your search or filters.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('All Categories');
                                    setSelectedCountry('All Countries');
                                }}
                                className="mt-8 skeu-btn-primary px-8 py-3 text-xs uppercase tracking-widest"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* Modal - Reusing logic from Carousel for consistency */}
            <AnimatePresence>
                {selectedStar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="skeu-card text-textPrimary max-w-4xl w-full overflow-hidden relative flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh]"
                        >
                            <button
                                onClick={() => setSelectedStar(null)}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors text-textSecondary hover:text-textPrimary"
                                style={{ background: 'linear-gradient(180deg,#FFFFFF,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.08)' }}
                            >
                                <X size={20} />
                            </button>

                            <div className="w-full md:w-1/2 h-96 md:h-auto relative bg-stone-100 overflow-hidden flex-shrink-0">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentImgIndex}
                                        src={modalImages[currentImgIndex]}
                                        alt={`${selectedStar.name}-${currentImgIndex}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        className="w-full h-full object-cover object-top"
                                    />
                                </AnimatePresence>

                                {/* Progress Bars for Gallery */}
                                {modalImages.length > 1 && (
                                    <div className="absolute top-4 left-4 right-4 z-10 flex gap-1.5">
                                        {modalImages.map((_, i) => (
                                            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm">
                                                <motion.div
                                                    key={`${i}-${i === currentImgIndex}`}
                                                    className="h-full bg-amber-500"
                                                    initial={{ width: i < currentImgIndex ? '100%' : '0%' }}
                                                    animate={{ width: i <= currentImgIndex ? '100%' : '0%' }}
                                                    transition={{ duration: i === currentImgIndex ? 3 : 0, ease: "linear" }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-white/20 to-transparent pointer-events-none" />
                            </div>

                            <div className="p-8 md:p-12 w-full md:w-1/2 overflow-y-auto" data-lenis-prevent>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="skeu-badge px-3 py-1 text-xs uppercase tracking-wider">{selectedStar.category}</span>
                                    <span className="text-stone-300">•</span>
                                    <span className="flex items-center text-textSecondary text-sm"><Globe size={14} className="mr-1" /> {selectedStar.country}</span>
                                </div>

                                <h3 className="text-4xl font-black mb-6 text-textPrimary tracking-tight">{selectedStar.name}</h3>
                                <p className="text-textSecondary leading-relaxed mb-8">{selectedStar.full_bio}</p>

                                <div className="p-5 rounded-xl mb-8" style={{ background: 'linear-gradient(180deg,#FEFDFB,#F5F0E8)', border: '1px solid #E7E0D5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
                                    <h4 className="flex items-center text-xs uppercase tracking-widest font-bold text-textPrimary mb-3">
                                        <Calendar size={14} className="mr-2" style={{ color: '#B45309' }} /> Booking Status
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {selectedStar.availability_status === 'Available' ? (
                                            <CheckCircle size={20} style={{ color: '#B45309' }} />
                                        ) : (
                                            <XCircle className="text-red-500" size={20} />
                                        )}
                                        <span className={`font-semibold text-lg ${selectedStar.availability_status === 'Available' ? 'text-textPrimary' : 'text-red-600'}`}>
                                            {selectedStar.availability_status}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    disabled={selectedStar.availability_status === 'Unavailable'}
                                    onClick={() => {
                                        setBookingStar(selectedStar);
                                        setIsBookingOpen(true);
                                        setSelectedStar(null);
                                    }}
                                    className={`w-full block text-center py-4 text-sm font-black uppercase tracking-widest ${selectedStar.availability_status !== 'Unavailable'
                                        ? 'skeu-btn-primary cursor-pointer'
                                        : 'bg-stone-200 text-stone-400 border border-stone-300 rounded-xl cursor-not-allowed hidden-pointer-events'
                                        }`}
                                >
                                    {selectedStar.availability_status !== 'Unavailable' ? 'Inquire Now' : 'Currently Unavailable'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Booking Modal */}
            <AnimatePresence>
                {isBookingOpen && bookingStar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="skeu-card text-textPrimary max-w-2xl w-full relative"
                        >
                            <button
                                onClick={() => setIsBookingOpen(false)}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors text-textSecondary hover:text-textPrimary bg-white/80 border border-stone-200"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]" data-lenis-prevent>
                                <div className="text-center mb-8">
                                    <span className="skeu-badge inline-block px-4 py-1.5 text-[10px] uppercase tracking-widest mb-3">Priority Inquiry</span>
                                    <h2 className="text-3xl font-black text-textPrimary tracking-tighter">Book {bookingStar.name}</h2>
                                    <div className="w-12 h-0.5 mx-auto mt-4 bg-amber-500 rounded-full" />
                                </div>

                                <ContactForm
                                    isModal
                                    lockedStarId={bookingStar.id.toString()}
                                    onSuccess={() => setIsBookingOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Discover;
