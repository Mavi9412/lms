
import { useAuth } from '../context/AuthContext';
import { BookOpen, GraduationCap, Users, Clock, ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();

    // Stats configuration based on role
    const getStats = () => {
        if (user?.role === 'teacher') {
            return [
                { label: 'Total Courses', value: '4', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Total Students', value: '128', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Total Hours', value: '42', icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
            ];
        } else if (user?.role === 'admin') {
            return [
                { label: 'Total Users', value: '256', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Active Courses', value: '12', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'System Status', value: 'Good', icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
            ];
        }
        // Student stats
        return [
            { label: 'Enrolled Courses', value: '3', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Completed', value: '1', icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Learning Hours', value: '12', icon: Clock, color: 'text-green-500', bg: 'bg-green-500/10' },
        ];
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">
                    Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">{user?.full_name}</span>
                </h1>
                <p className="text-text-secondary text-lg">Here's what's happening with your learning journey today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {getStats().map((stat, index) => (
                    <div key={index} className="glass p-6 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {user?.role === 'teacher' ? 'Your Courses' : 'Continue Learning'}
                        </h2>
                        <Link to="/courses" className="text-primary hover:text-primary-hover flex items-center gap-2 text-sm font-semibold group">
                            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="glass p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <PlayCircle className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">Advanced Web Development</h3>
                                    <p className="text-text-secondary text-sm">Lesson 4: React Hooks In-Depth</p>
                                </div>
                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-2/3 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="font-bold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            {user?.role === 'teacher' ? (
                                <button className="w-full btn btn-primary py-2.5">Create New Course</button>
                            ) : (
                                <Link to="/courses" className="w-full btn btn-primary py-2.5 text-center block">Browse Courses</Link>
                            )}
                            <button className="w-full btn bg-white/5 hover:bg-white/10 border border-white/10 py-2.5">View Profile</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
