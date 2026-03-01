import { Link } from 'react-router-dom';
import MMStarLogo from '../assets/MMstar_logo.png';

const Footer = () => {
    return (
        <footer className="warm-divider py-8" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F0E8 100%)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                    <Link to="/" className="inline-block mb-1">
                        <img
                            src={MMStarLogo}
                            alt="Meet My Star Logo"
                            className="h-16 md:h-20 w-auto drop-shadow-sm opacity-90 transition-opacity hover:opacity-100 -my-2"
                        />
                    </Link>
                    <p className="text-sm text-textSecondary font-medium">
                        © {new Date().getFullYear()} Meet My Star. All rights reserved.
                    </p>
                </div>

                <div className="flex gap-8 text-sm">
                    {['About', 'Privacy', 'Terms', 'Contact'].map(link => (
                        <Link
                            key={link}
                            to={link === 'About' ? '/about' : link === 'Contact' ? '/#contact' : `/${link.toLowerCase()}`}
                            className="text-textSecondary hover:text-accent font-medium transition-colors duration-200"
                        >
                            {link}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
