import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-bg-secondary border-t border-white/5 pt-16 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <span className="text-xl font-bold tracking-tight">University <span className="text-primary">LMS</span></span>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            A centralized academic learning management platform providing structured courses, assessments, and attendance for students and faculty.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Academic Portal</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li><Link to="/courses" className="hover:text-primary transition-colors">Course Catalog</Link></li>
                            <li><Link to="/login" className="hover:text-primary transition-colors">Student & Faculty Sign In</Link></li>
                            <li><Link to="/register" className="hover:text-primary transition-colors">Student Registration</Link></li>
                        </ul>
                    </div>

                    {/* Portals */}
                    <div>
                        <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Portals</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li><Link to="/dashboard" className="hover:text-primary transition-colors">Student Dashboard</Link></li>
                            <li><Link to="/teacher/dashboard" className="hover:text-primary transition-colors">Teacher Portal</Link></li>
                            <li><Link to="/admin" className="hover:text-primary transition-colors">Admin Management</Link></li>
                        </ul>
                    </div>

                    {/* Academic Structure */}
                    <div>
                        <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Academic Structure</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li className="flex items-center gap-2 text-zinc-400">
                                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                                <span>Computer Science (BSCS)</span>
                            </li>
                            <li className="flex items-center gap-2 text-zinc-400">
                                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                                <span>Software Engineering (BSSE)</span>
                            </li>
                            <li className="flex items-center gap-2 text-zinc-400">
                                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                                <span>Role-Based Access (RBAC)</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-text-secondary text-sm">
                        © {new Date().getFullYear()} University Learning Management System (LMS). All rights reserved.
                    </p>
                    <div className="text-xs text-text-secondary">
                        Academic Year 2025–2026 • Semester Management System
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
