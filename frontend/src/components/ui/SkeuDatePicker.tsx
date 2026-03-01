import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface SkeuDatePickerProps {
    value: string; // ISO format: YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    allowPastDates?: boolean;
}

const SkeuDatePicker = ({ value, onChange, placeholder = "Select Date", className = "", allowPastDates = false }: SkeuDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Date ranges
    const minSelectableDate = useMemo(() => {
        if (allowPastDates) {
            // Allows selecting any past date (practical limit: year 2000)
            return new Date(2000, 0, 1);
        }
        const d = new Date();
        d.setDate(d.getDate() + 14);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [allowPastDates]);

    // Current view month (independent of value)
    const [viewDate, setViewDate] = useState(() => {
        const initialView = value ? new Date(value) : new Date();
        return initialView < minSelectableDate ? new Date(minSelectableDate) : initialView;
    });

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    // Outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Calendar generation
    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

    const days = useMemo(() => {
        const d = [];
        const totalDays = daysInMonth(currentMonth, currentYear);

        // Prev month padding
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startDayOfMonth - 1; i >= 0; i--) {
            d.push({ day: prevMonthLastDay - i, month: currentMonth - 1, year: currentYear, current: false });
        }

        // This month
        for (let i = 1; i <= totalDays; i++) {
            d.push({ day: i, month: currentMonth, year: currentYear, current: true });
        }

        // Next month padding
        const totalCells = (d.length <= 35) ? 35 : 42;
        const remaining = totalCells - d.length;
        for (let i = 1; i <= remaining; i++) {
            d.push({ day: i, month: currentMonth + 1, year: currentYear, current: false });
        }

        return d;
    }, [currentMonth, currentYear, startDayOfMonth]);

    const handleDateSelect = (d: number, m: number, y: number) => {
        const selected = new Date(y, m, d);
        if (selected >= minSelectableDate) {
            const formatted = selected.toISOString().split('T')[0];
            onChange(formatted);
            setIsOpen(false);
        }
    };

    const isSelected = (d: number, m: number, y: number) => {
        if (!value) return false;
        const v = new Date(value);
        return v.getDate() === d && v.getMonth() === m && v.getFullYear() === y;
    };

    const isSelectable = (d: number, m: number, y: number) => {
        const check = new Date(y, m, d);
        check.setHours(0, 0, 0, 0);
        return check >= minSelectableDate;
    };

    const moveMonth = (delta: number) => {
        setViewDate(new Date(currentYear, currentMonth + delta, 1));
    };

    const formattedValue = value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Input Toggle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="skeu-input w-full px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-200 select-none group"
            >
                <span className={`text-sm whitespace-nowrap ${value ? 'text-textPrimary font-semibold' : 'text-textSecondary/60 font-medium'}`}>
                    {formattedValue || placeholder}
                </span>
                <CalendarIcon
                    className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 mt-2 z-[100] skeu-card p-5 shadow-2xl w-[320px] origin-top bg-white"
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-black text-textPrimary uppercase tracking-widest">
                                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)}
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => moveMonth(-1)}
                                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-textSecondary transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveMonth(1)}
                                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-textSecondary transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Weekday labels */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
                                <div key={w} className="text-[10px] font-black text-textSecondary text-center uppercase py-1">
                                    {w}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((d, i) => {
                                const selectable = isSelectable(d.day, d.month, d.year);
                                const selected = isSelected(d.day, d.month, d.year);

                                const isToday = () => {
                                    const todayDate = new Date();
                                    return todayDate.getDate() === d.day && todayDate.getMonth() === d.month && todayDate.getFullYear() === d.year;
                                };

                                const today = isToday();

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!selectable}
                                        onClick={() => handleDateSelect(d.day, d.month, d.year)}
                                        className={`
                                            h-9 text-xs font-bold rounded-lg transition-all duration-200 relative
                                            ${!d.current ? 'opacity-25' : ''}
                                            ${selectable
                                                ? 'text-textPrimary hover:bg-amber-50 hover:text-amber-900 border border-transparent hover:border-amber-200'
                                                : 'text-textSecondary/30 cursor-not-allowed'}
                                            ${selected ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-[inset_0_1px_2px_rgba(180,83,9,0.1)]' : ''}
                                            ${today && !selected ? 'ring-1 ring-inset ring-amber-400 bg-amber-50/30' : ''}
                                        `}
                                    >
                                        {d.day}
                                        {selected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-600" />}
                                        {today && !selected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400/60" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend / Actions */}
                        {!allowPastDates ? (
                            <div className="mt-6 pt-4 border-t border-stone-100">
                                <p className="text-[10px] text-textSecondary font-medium leading-tight">
                                    <span className="text-amber-600 font-bold uppercase">Note:</span> Talent bookings require a minimum 2-week lead time for coordination.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 pt-4 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        handleDateSelect(now.getDate(), now.getMonth(), now.getFullYear());
                                    }}
                                    className="w-full px-4 py-2.5 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-200 transition-colors shadow-sm shadow-amber-900/5 text-center flex items-center justify-center gap-2"
                                >
                                    Select Today
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SkeuDatePicker;
