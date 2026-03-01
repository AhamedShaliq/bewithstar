import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES } from '../utils/countries';
import { COUNTRY_CODES } from '../utils/countryCodes';
import { API_BASE_URL } from '../utils/apiConfig';
import { getPrimaryImage } from '../utils/imageUtils';
import SkeuSelect from './ui/SkeuSelect';
import SkeuDatePicker from './ui/SkeuDatePicker';
interface Star {
    id: number;
    name: string;
    category: string;
    image_url: string;
}

const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
};

interface ContactFormProps {
    isModal?: boolean;
    lockedStarId?: string;
    onSuccess?: () => void;
}

import { isValidPhoneNumber } from 'libphonenumber-js';
import { getMaxLength } from '../utils/phoneLengths';

const ContactForm = ({ isModal = false, lockedStarId = '', onSuccess }: ContactFormProps) => {
    const [formData, setFormData] = useState({
        fullName: '', company: '', email: '',
        isoCode: 'IN', // Default to India ISO
        phone: '',
        country: '',
        starId: lockedStarId || '',
        eventType: 'Keynote Speech',
        eventDate: getMinDate(), message: ''
    });
    const [stars, setStars] = useState<Star[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMSG, setErrorMSG] = useState('');
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Fetch Stars
        fetch(`${API_BASE_URL}/api/stars`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setStars(data); })
            .catch(err => console.error(err));

        // 2. Geolocation for default country
        const initGeo = async () => {
            let cachedCountry = sessionStorage.getItem('user_country') || '';
            let cachedISO = sessionStorage.getItem('user_iso') || 'IN';

            const setDefaults = (country: string, iso: string) => {
                setFormData(prev => ({ ...prev, country, isoCode: iso }));
                sessionStorage.setItem('user_country', country);
                sessionStorage.setItem('user_iso', iso);
            };

            if (cachedCountry) {
                setFormData(prev => ({ ...prev, country: cachedCountry, isoCode: cachedISO }));
            } else {
                try {
                    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.country) {
                            const matchedCode = COUNTRY_CODES.find(c => c.name === data.country || c.code === data.country_code);
                            const iso = matchedCode ? matchedCode.code : 'IN';
                            setDefaults(data.country, iso);
                        } else {
                            setDefaults('India', 'IN');
                        }
                    } else {
                        setDefaults('India', 'IN');
                    }
                } catch {
                    setDefaults('India', 'IN');
                }
            }
        };
        initGeo();

        // 3. Listen for custom selection event
        const handleTalentSelect = (e: any) => {
            if (lockedStarId) return;
            const starId = e.detail?.starId;
            if (starId) {
                setFormData(prev => ({ ...prev, starId: starId.toString() }));
                setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };

        window.addEventListener('talentSelect', handleTalentSelect as any);

        // 4. Check URL Params on mount
        if (!lockedStarId) {
            const params = new URLSearchParams(window.location.search);
            const urlStarId = params.get('starId');
            if (urlStarId) {
                setFormData(prev => ({ ...prev, starId: urlStarId }));
                setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 800);
            }
        }

        return () => window.removeEventListener('talentSelect', handleTalentSelect as any);
    }, [lockedStarId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            // Strict Filter: Allow ONLY digits
            const digitsOnly = value.replace(/\D/g, '');
            // Dynamic Max Length based on Country
            const maxLen = getMaxLength(formData.isoCode);
            if (digitsOnly.length <= maxLen) {
                setFormData({ ...formData, [name]: digitsOnly });
            }
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setErrorMSG(''); setSuccess(false);

        // Phone Validation Logic
        const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.isoCode);
        const dialCode = selectedCountry?.dial_code || '';
        const fullPhone = `${dialCode}${formData.phone}`; // No need to replace spaces if we only allow digits

        if (formData.phone && !isValidPhoneNumber(fullPhone, formData.isoCode as any)) {
            setErrorMSG(`Invalid phone number format for ${selectedCountry?.name}.`);
            setLoading(false);
            return;
        }

        try {
            const payload = {
                full_name: formData.fullName, company: formData.company,
                email: formData.email,
                phone: `${dialCode} ${formData.phone}`.trim(),
                country: formData.country,
                star_id: formData.starId ? parseInt(formData.starId) : null,
                event_type: formData.eventType, event_date: formData.eventDate, message: formData.message
            };
            const res = await axios.post(`${API_BASE_URL}/api/contact`, payload);
            if (res.status === 201) {
                setSuccess(true);
                setFormData({
                    fullName: '', company: '', email: '',
                    isoCode: formData.isoCode, // Keep country
                    phone: '', country: formData.country,
                    starId: '', eventType: 'Keynote Speech',
                    eventDate: getMinDate(), message: ''
                });
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 2000);
                }
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) setErrorMSG(err.response?.data?.error || 'Submission failed.');
            else setErrorMSG('Submission failed.');
        } finally { setLoading(false); }
    };
    const inputClass = 'skeu-input w-full px-4 py-3 text-sm text-textPrimary placeholder-textSecondary/60 font-medium';
    const labelClass = 'block text-[10px] md:text-xs font-black text-textPrimary/80 mb-2 uppercase tracking-[0.2em]';

    return (
        <section id="contact" ref={formRef} className={`${isModal ? '' : 'py-24 warm-divider border-t border-stone-200/60'} relative`} style={isModal ? {} : { background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)' }}>
            <div className={`${isModal ? 'w-full' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'} relative z-10`}>
                <motion.div
                    initial={isModal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    whileInView={isModal ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {!isModal && (
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                            <span className="skeu-badge inline-block px-5 py-2 text-xs uppercase tracking-widest mb-6">Direct Access</span>
                            <h2 className="text-4xl md:text-5xl font-black text-textPrimary tracking-tighter mb-4">Request a Meeting</h2>
                            <div className="w-20 h-1 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, #F59E0B, #B45309)' }} />
                        </motion.div>
                    )}

                    <motion.div initial={isModal ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className={`${isModal ? '' : 'skeu-card p-8 md:p-12'}`}
                    >
                        <AnimatePresence>
                            {success && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 p-6 rounded-2xl flex flex-col items-center"
                                    style={{ background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)', border: '1px solid #F59E0B', boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 6px rgba(180,83,9,0.15)' }}
                                >
                                    <svg className="w-10 h-10 mb-2" style={{ color: '#B45309' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="font-bold text-lg text-amber-900">Request Submitted Successfully</p>
                                    <p className="text-sm mt-1 font-medium text-amber-800">An agent will be in touch within 24 hours.</p>
                                </motion.div>
                            )}
                            {errorMSG && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 p-4 rounded-xl border border-red-200" style={{ background: '#FFF5F5', boxShadow: 'inset 0 2px 4px rgba(220,38,38,0.06)' }}
                                >
                                    <p className="text-sm text-center font-semibold text-red-600">{errorMSG}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-7">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                                {[
                                    { label: 'Full Name *', name: 'fullName', type: 'text', placeholder: 'John Doe', required: true },
                                    { label: 'Company / Organization', name: 'company', type: 'text', placeholder: 'Acme Corp', required: false },
                                    { label: 'Official Email *', name: 'email', type: 'email', placeholder: 'john@example.com', required: true },
                                    { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '(555) 000-0000', required: false },
                                    { label: 'Your Country *', name: 'country', type: 'select', placeholder: 'Select Country', required: true, options: COUNTRIES },
                                ].map(f => (
                                    <div key={f.name} className="relative">
                                        <label className={labelClass}>{f.label}</label>
                                        {f.type === 'select' ? (
                                            <SkeuSelect
                                                isSearchable
                                                options={f.options?.map(o => ({ label: o, value: o })) || []}
                                                value={formData[f.name as keyof typeof formData] as string}
                                                onChange={(val) => setFormData(prev => ({ ...prev, [f.name]: val }))}
                                                placeholder={f.placeholder}
                                            />
                                        ) : f.name === 'phone' ? (
                                            <div className="flex gap-2">
                                                <div className="w-[135px] flex-shrink-0">
                                                    <SkeuSelect
                                                        isSearchable
                                                        options={COUNTRY_CODES.map(c => ({
                                                            label: `${c.code} (${c.dial_code})`,
                                                            value: c.code
                                                        }))}
                                                        value={formData.isoCode}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, isoCode: val }))}
                                                        className="text-center"
                                                    />
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    required={f.required}
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                    placeholder={f.placeholder}
                                                />
                                            </div>
                                        ) : (
                                            <input type={f.type} name={f.name} required={f.required} value={formData[f.name as keyof typeof formData] as string} onChange={handleChange} className={inputClass} placeholder={f.placeholder} />
                                        )}
                                    </div>
                                ))}
                                <div className="relative">
                                    <label className={labelClass}>Requested Talent</label>
                                    <SkeuSelect
                                        isSearchable
                                        disabled={lockedStarId !== ''}
                                        options={[
                                            { label: 'General Inquiry', value: '' },
                                            ...stars.map(s => ({
                                                label: s.name,
                                                sublabel: s.category,
                                                value: s.id.toString(),
                                                image: s.image_url ? getPrimaryImage(s.image_url) : undefined
                                            }))
                                        ]}
                                        value={formData.starId}
                                        onChange={(val) => setFormData(prev => ({ ...prev, starId: val }))}
                                        placeholder="General Inquiry"
                                    />
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Event Type *</label>
                                    <SkeuSelect
                                        options={['Keynote Speech', 'Brand Endorsement', 'Private Event', 'Panel Discussion', 'Other'].map(t => ({ label: t, value: t }))}
                                        value={formData.eventType}
                                        onChange={(val) => setFormData(prev => ({ ...prev, eventType: val }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Event Date *</label>
                                    <SkeuDatePicker
                                        value={formData.eventDate}
                                        onChange={(val) => setFormData(prev => ({ ...prev, eventDate: val }))}
                                        placeholder="Select Preferred Date"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Message & Details *</label>
                                <textarea name="message" rows={4} required value={formData.message} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Please describe the nature of your request..." />
                            </div>

                            <button type="submit" disabled={loading} className="skeu-btn-primary w-full py-4 text-sm uppercase tracking-widest">
                                {loading ? 'Submitting request…' : 'Submit Secure Inquiry'}
                            </button>
                            <p className="text-center text-xs text-textSecondary font-medium">
                                By submitting, you agree to our privacy and confidentiality agreements.
                            </p>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ContactForm;
