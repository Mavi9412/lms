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

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0A0A0B]/80 backdrop-blur-lg border-b border-white/5 shadow-xl' : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        LMS
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-sm font-medium transition-colors ${isActive(link.path)
                                ? 'text-primary'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {!user ? (
                        <>
                            <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                Log in
                            </Link>
                            <Link to="/register" className="btn btn-primary text-sm py-2 px-5 shadow-lg shadow-primary/25">
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <Link to="/dashboard" className="btn btn-primary text-sm py-2 px-5 shadow-lg shadow-primary/25">
                            Dashboard
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-white/10 p-6 animate-in slide-in-from-top-5">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`text-base font-medium p-2 rounded-lg transition-colors ${isActive(link.path)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="h-px bg-white/10 my-2" />
                        {!user ? (
                            <>
                                <Link
                                    to="/login"
                                    className="text-center py-2 text-zinc-400 hover:text-white font-medium"
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
                            </>
                        ) : (
                            <Link
                                to="/dashboard"
                                className="btn btn-primary w-full justify-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
