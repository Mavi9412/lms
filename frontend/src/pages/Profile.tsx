import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, BookOpen, LogOut, Trophy, Flame, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats] = useState({
        coursesEnrolled: 0,
        lessonsCompleted: 0 // Placeholder for now
    });

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-80 gradient-mesh opacity-20 z-0" />

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-end gap-8 mb-12 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full gradient-primary p-[3px] shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500">
                            <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center text-4xl font-bold text-white overflow-hidden relative">
                                <span className="relative z-10">{user.full_name.charAt(0).toUpperCase()}</span>
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-bg-card p-1.5 rounded-full border border-white/10 shadow-lg">
                            <Shield className="w-5 h-5 text-accent-success" />
                        </div>
                    </div>

                    <div className="flex-1 pb-2">
                        <h1 className="text-4xl font-bold mb-2 text-white/90">{user.full_name}</h1>
                        <div className="flex items-center gap-4 text-text-secondary">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium capitalize">
                                <User className="w-3.5 h-3.5" />
                                {user.role}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm">
                                <Mail className="w-3.5 h-3.5" />
                                {user.email}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn bg-white/5 hover:bg-red-500/20 text-text-secondary hover:text-red-400 border border-white/10 hover:border-red-500/30 backdrop-blur-sm transition-all duration-300"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                <div className="grid md:grid-cols-12 gap-8">
                    {/* Left Column - Stats */}
                    <div className="md:col-span-8 space-y-8">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="card-premium hover-glow group cursor-default">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                                        Active
                                    </span>
                                </div>
                                <div className="stat-number text-3xl font-bold text-white mb-1">{stats.coursesEnrolled}</div>
                                <p className="text-text-secondary text-sm">Enrolled Courses</p>
                            </div>

                            <div className="card-premium hover-glow group cursor-default">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl bg-secondary/10 text-secondary group-hover:scale-110 transition-transform duration-300">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-secondary/10 text-secondary border border-secondary/20">
                                        Rank
                                    </span>
                                </div>
                                <div className="stat-number text-3xl font-bold text-white mb-1">{stats.lessonsCompleted}</div>
                                <p className="text-text-secondary text-sm">Lessons Completed</p>
                            </div>
                        </div>

                        {/* Recent Activity (Glass Panel) */}
                        <div className="glass-premium rounded-2xl p-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                Recent Activity
                            </h3>

                            <div className="space-y-4">
                                {/* Empty State for now */}
                                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/5">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                        <Calendar className="w-5 h-5 text-text-secondary" />
                                    </div>
                                    <p className="text-text-secondary font-medium">No recent activity</p>
                                    <p className="text-xs text-text-secondary/60 mt-1">Start a course to see your progress here</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Account Info */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="glass-premium rounded-2xl p-6 sticky top-24 border-t-4 border-t-primary">
                            <h3 className="text-lg font-bold mb-6">Account Details</h3>

                            <div className="space-y-6">
                                <div className="group">
                                    <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1.5 block group-hover:text-primary transition-colors">Full Name</label>
                                    <p className="text-white font-medium p-3 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                                        {user.full_name}
                                    </p>
                                </div>

                                <div className="group">
                                    <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1.5 block group-hover:text-primary transition-colors">Email Address</label>
                                    <p className="text-white font-medium p-3 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors truncate">
                                        {user.email}
                                    </p>
                                </div>

                                <div className="group">
                                    <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1.5 block group-hover:text-primary transition-colors">Member Since</label>
                                    <p className="text-white font-medium p-3 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                                        {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
