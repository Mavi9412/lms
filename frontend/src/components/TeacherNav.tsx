import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Layers,
    ClipboardList,
    FileQuestion,
    FolderOpen,
    CalendarCheck,
    Megaphone,
    Award,
} from 'lucide-react';

const links = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
    { name: 'Sections', path: '/teacher/sections', icon: Layers },
    { name: 'Assignments', path: '/teacher/assignments', icon: ClipboardList },
    { name: 'Quizzes', path: '/teacher/quizzes', icon: FileQuestion },
    { name: 'Materials', path: '/teacher/materials', icon: FolderOpen },
    { name: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    { name: 'Rubrics', path: '/teacher/rubrics', icon: Award },
];

const TeacherNav = () => {
    const location = useLocation();

    const isActive = (path: string) =>
        path === '/teacher'
            ? location.pathname === '/teacher' || location.pathname === '/teacher/dashboard'
            : location.pathname.startsWith(path);

    return (
        <div className="border-b border-white/5 bg-bg-secondary/60 backdrop-blur sticky top-20 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-1 overflow-x-auto py-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    active
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {link.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TeacherNav;
