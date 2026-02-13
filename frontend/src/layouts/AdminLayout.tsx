import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Building2,
    BookOpen,
    Settings,
    LogOut,
    Shield,
    GraduationCap
} from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user || user.role !== 'admin') {
        navigate('/login');
        return null;
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: GraduationCap, label: 'Batch Management', path: '/admin/batches' },
        { icon: BookOpen, label: 'Course Management', path: '/admin/courses' },
        { icon: Building2, label: 'Academic Structure', path: '/admin/academic' },
        { icon: BookOpen, label: 'Course Allocations', path: '/admin/allocations' },
        { icon: Settings, label: 'Policies', path: '/admin/policies' },
    ];

    return (
        <div className="flex h-screen bg-bg-primary text-white font-inter overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-bg-secondary border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 text-primary">
                        <Shield className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">Admin<span className="text-white">Panel</span></span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user.full_name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.full_name}</p>
                            <p className="text-xs text-text-secondary truncate">System Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
