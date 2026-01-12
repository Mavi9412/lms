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
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Courses', path: '/courses' },
        { name: 'About', path: '/about' }, // Placeholder
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">LMS<span className="text-primary">.pro</span></span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-white ${isActive(link.path) ? 'text-white' : 'text-text-secondary'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                        {user ? (
                            <Link to="/profile" className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-white transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/30 transition-colors">
                                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="hidden lg:inline">{user.full_name?.split(' ')[0]}</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold hover:text-white text-text-secondary transition-colors">
                                    Log in
                                </Link>
                                <Link to="/register" className="btn btn-primary text-sm py-2 px-5 shadow-lg shadow-primary/25">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
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
            )}
        </nav>
    );
};

export default Navbar;
