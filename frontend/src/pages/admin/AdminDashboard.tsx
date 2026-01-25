import { useEffect, useState } from 'react';
import { Users, BookOpen, Building2, GraduationCap } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        courses: 0,
        departments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch admin stats', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-bg-secondary border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="text-text-secondary">{title}</p>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-2">System Overview</h1>
            <p className="text-text-secondary mb-8">Welcome back, Admin. Here's what's happening today.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Students"
                    value={stats.students}
                    icon={GraduationCap}
                    color="bg-blue-500/20"
                />
                <StatCard
                    title="Total Teachers"
                    value={stats.teachers}
                    icon={Users}
                    color="bg-purple-500/20"
                />
                <StatCard
                    title="Active Courses"
                    value={stats.courses}
                    icon={BookOpen}
                    color="bg-orange-500/20"
                />
                <StatCard
                    title="Departments"
                    value={stats.departments}
                    icon={Building2}
                    color="bg-green-500/20"
                />
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-bg-secondary border border-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">System Notices</h2>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
                    Admin Module is currently in active development. User Management and Policy controls are being enabled.
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
