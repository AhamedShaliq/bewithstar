import Hero from '../components/Hero';
import StarCarousel from '../components/StarCarousel';
import GlobalAccess from '../components/GlobalAccess';
import ContactForm from '../components/ContactForm';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SmoothScroll from '../components/SmoothScroll';

const LandingPage = () => {
    return (
        <SmoothScroll>
            <div className="w-full relative overflow-hidden">
                <Navbar />
                <Hero />
                <StarCarousel />
                <ContactForm />
                <GlobalAccess />
                <Footer />
            </div>
        </SmoothScroll>
    );
};

export default LandingPage;
