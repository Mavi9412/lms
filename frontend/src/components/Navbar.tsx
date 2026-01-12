import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Courses', path: '/courses' },
        { name: 'About', path: '/about' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-bg-primary/80 backdrop-blur-lg border-b border-white/5 shadow-xl' : 'bg-transparent'
                }`}
        >
            <Link to="/register" className="btn btn-primary text-sm py-2 px-5 shadow-lg shadow-primary/25">
                Get Started
            </Link>
        </>
    )
}
                    </div >
                </div >

    {/* Mobile Menu Button */ }
    < button
className = "md:hidden p-2 text-text-primary hover:bg-white/5 rounded-lg transition-colors"
onClick = {() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
    { isMobileMenuOpen?<X className = "w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button >
            </div >

    {/* Mobile Menu */ }
{
    isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-white/10 p-6 animate-in slide-in-from-top-5">
            <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`text-base font-medium p-2 rounded-lg transition-colors ${isActive(link.path)
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {link.name}
                    </Link>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <Link
                    to="/login"
                    className="text-center py-2 text-text-secondary hover:text-white font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Log in
                </Link>
                <Link
                    to="/register"
                    className="btn btn-primary w-full justify-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Get Started
                </Link>
            </div>
        </div>
    )
}
        </nav >
    );
};

export default Navbar;
