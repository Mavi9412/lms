import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, Clock, User as UserIcon } from 'lucide-react';

id: number;
title: string;
description: string;
teacher_id: number;
created_at: string;
}

const Courses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

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

    if (loading) return <div className="text-white text-center mt-20">Loading courses...</div>;

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Available Courses</h1>
                    <p className="text-text-secondary">Explore and enroll in courses to enhance your skills.</p>
                </div>

                {isTeacher && (
                    <button className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create Course
                    </button>
                    // Note: Create Course Modal/Page logic to be added later
                )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="card group hover:scale-[1.02] transition-transform duration-300">
                        <div className="h-48 bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                            {/* Placeholder for Course Image */}
                            <BookOpen className="w-16 h-16 text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">{course.title}</h3>
                        <p className="text-text-secondary mb-4 line-clamp-2">{course.description}</p>

                        <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-4 mt-auto">
                            <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                <span>Instructor ID: {course.teacher_id}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(course.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {courses.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-xl">No courses available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;
