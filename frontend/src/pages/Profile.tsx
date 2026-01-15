import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, BookOpen, LogOut } from 'lucide-react';
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
        <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="glass rounded-2xl p-6 border border-white/5 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary/20">
                            {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold mb-1">{user.full_name}</h2>
                        <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-text-secondary border border-white/5 capitalize mb-6">
                            {user.role}
                        </span>

                        <button
                            onClick={handleLogout}
                            className="w-full btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Details & Stats */}
                <div className="md:col-span-2 space-y-6">
                    {/* User Info */}
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Account Details
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-bg-secondary/50 rounded-xl border border-white/5">
                                <Mail className="w-5 h-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-secondary mb-0.5">Email Address</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-bg-secondary/50 rounded-xl border border-white/5">
                                <Shield className="w-5 h-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-secondary mb-0.5">Account Role</p>
                                    <p className="font-medium capitalize">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Placeholder */}
                    <div className="glass rounded-2xl p-8 border border-white/5">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Learning Progress
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-bg-secondary/50 p-4 rounded-xl border border-white/5 text-center">
                                <div className="text-3xl font-bold text-white mb-1">{stats.coursesEnrolled}</div>
                                <div className="text-text-secondary text-sm">Courses Enrolled</div>
                            </div>
                            <div className="bg-bg-secondary/50 p-4 rounded-xl border border-white/5 text-center">
                                <div className="text-3xl font-bold text-white mb-1">{stats.lessonsCompleted}</div>
                                <div className="text-text-secondary text-sm">Lessons Completed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
