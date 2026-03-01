import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
    label: string;
    value: string;
    image?: string;
    sublabel?: string;
}

interface SkeuSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    isSearchable?: boolean;
    disabled?: boolean;
}

const SkeuSelect = ({ options, value, onChange, placeholder = "Select...", className = "", isSearchable = false, disabled = false }: SkeuSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const selectedOption = options.find(o => o.value === value);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [options, searchTerm]);

    useEffect(() => {
        if (isOpen && listRef.current && value) {
            const selectedElement = listRef.current.querySelector('[data-selected="true"]');
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'instant' });
            }
        }
        if (isOpen && isSearchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, value, isSearchable]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) setSearchTerm('');
        setIsOpen(!isOpen);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className} ${disabled ? 'cursor-not-allowed' : ''}`}>
            <div
                onClick={handleToggle}
                className={`skeu-input w-full px-4 py-3 flex items-center justify-between transition-all duration-200 select-none group ${disabled ? 'cursor-not-allowed bg-stone-50/50' : 'cursor-pointer'}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.image && (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-inner">
                            <img src={selectedOption.image} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className={`text-sm truncate ${value ? 'text-textPrimary font-semibold' : 'text-textSecondary/60 font-medium'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                {!disabled && (
                    <ChevronDown
                        className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} group-hover:scale-110 flex-shrink-0`}
                    />
                )}
                {disabled && (
                    <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 mt-2 z-[100] skeu-card overflow-hidden shadow-2xl origin-top w-full min-w-[240px]"
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {isSearchable && (
                            <div className="p-2 border-b border-stone-100 bg-stone-50/50">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="skeu-input w-full pl-8 pr-8 py-2 text-xs"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setIsOpen(false);
                                        }}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-textSecondary hover:text-textPrimary"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div
                            ref={listRef}
                            className="max-h-[280px] overflow-y-auto"
                            data-lenis-prevent
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        data-selected={value === option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`px-4 py-3 text-sm cursor-pointer transition-colors duration-150 flex items-center gap-3
                                            ${value === option.value
                                                ? 'bg-amber-50 text-amber-900 font-bold'
                                                : 'text-textPrimary hover:bg-stone-50'}`}
                                    >
                                        {option.image && (
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 flex-shrink-0">
                                                <img src={option.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate">{option.label}</span>
                                            {option.sublabel && (
                                                <span className="text-[10px] text-textSecondary font-medium uppercase tracking-wider">{option.sublabel}</span>
                                            )}
                                        </div>
                                        {value === option.value && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-600" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-xs text-textSecondary font-medium">
                                    No results matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SkeuSelect;
