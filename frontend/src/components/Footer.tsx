import { BookOpen, Github, Twitter, Linkedin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-bg-secondary border-t border-white/5 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <span className="text-xl font-bold tracking-tight">LMS<span className="text-primary">.pro</span></span>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                            Empowering the next generation of learners and educators with cutting-edge digital tools.
                        </p>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-bold mb-6 text-white">Product</h4>
                        <ul className="space-y-4 text-sm text-text-secondary">
                            <li><Link to="#" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Demo</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-white">Company</h4>
                        <ul className="space-y-4 text-sm text-text-secondary">
                            <li><Link to="#" className="hover:text-primary transition-colors">About</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Careers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-white">Legal</h4>
                        <ul className="space-y-4 text-sm text-text-secondary">
                            <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-text-secondary text-sm">
                        © {new Date().getFullYear()} LMS.pro. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-text-secondary hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                        <a href="#" className="text-text-secondary hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-text-secondary hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                    </div>
                </div>

                <div className="text-center mt-8 text-xs text-text-secondary flex items-center justify-center gap-1">
                    Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Asim
                </div>
            </div>
        </footer>
    );
};

export default Footer;
