import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, User, AlertCircle, Shield, ArrowRight } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/signup', formData);
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 relative py-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="w-full max-w-md glass p-8 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                    <p className="text-text-secondary">Join our community today</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                required
                                className="w-full bg-bg-secondary/50 border border-white/10 text-text-primary rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="email"
                                required
                                className="w-full bg-bg-secondary/50 border border-white/10 text-text-primary rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="password"
                                required
                                className="w-full bg-bg-secondary/50 border border-white/10 text-text-primary rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
                        <div className="relative group">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <select
                                className="w-full bg-bg-secondary/50 border border-white/10 text-text-primary rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="student" className="bg-bg-secondary text-text-primary">Student</option>
                                <option value="teacher" className="bg-bg-secondary text-text-primary">Teacher</option>
                                <option value="admin" className="bg-bg-secondary text-text-primary">Admin</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-3 text-lg font-semibold shadow-lg shadow-primary/25 relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? 'Creating Account...' : <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                        </span>
                    </button>
                </form>

                <p className="mt-8 text-center text-text-secondary">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
