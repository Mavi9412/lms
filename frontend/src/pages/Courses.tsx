import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, Clock, User as UserIcon, Search } from 'lucide-react';

interface Course {
    id: number;
    title: string;
    description: string;
    teacher_id: number;
    created_at: string;
}

const Courses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/');
                setCourses(response.data);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Available Courses</h1>
                    <p className="text-text-secondary">Explore and enroll in courses to enhance your skills.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="bg-bg-secondary border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>


                    {isTeacher && (
                        <button className="btn btn-primary flex items-center gap-2 whitespace-nowrap shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Create Course</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course, index) => (
                    <div
                        key={course.id}
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 border border-white/5 bg-bg-card/50 backdrop-blur-sm cursor-pointer"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="h-48 bg-gradient-to-br from-bg-secondary to-gray-800 rounded-t-xl mb-4 flex items-center justify-center overflow-hidden relative group-hover:from-gray-800 group-hover:to-gray-700 transition-colors">
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BookOpen className="w-16 h-16 text-gray-600 group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                                {course.id % 2 === 0 ? 'Beginner' : 'Advanced'} {/* Dummy Level */}
                            </div>
                        </div>

                        <div className="p-6 pt-2">
                            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                            <p className="text-text-secondary mb-6 line-clamp-2 text-sm leading-relaxed">{course.description}</p>

                            <div className="flex items-center justify-between text-xs text-text-secondary border-t border-white/5 pt-4 mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                        <UserIcon className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="font-medium">Instructor {course.teacher_id}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-bg-secondary px-2 py-1 rounded-md">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(course.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredCourses.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-secondary">
                        <div className="bg-bg-secondary/50 p-6 rounded-full mb-4">
                            <Search className="w-12 h-12 opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                        <p>Try adjusting your search terms or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;
