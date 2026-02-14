import { useEffect, useState } from 'react';
import { Megaphone, MessageCircle, Send, Pin, BookOpen, ChevronDown, Plus } from 'lucide-react';
import api from '../services/api';

interface Announcement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
    course_id: number;
    creator_name: string;
}

interface Course {
    course_id: number;
    course_title: string;
    course_code: string;
}

interface DiscussionThread {
    id: number;
    title: string;
    content: string;
    created_at: string;
    course_id: number;
    creator_name: string;
    reply_count?: number;
}

const StudentCommunication = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [discussions, setDiscussions] = useState<DiscussionThread[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'announcements' | 'discussions'>('announcements');

    // New query/message form
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (courses.length > 0) {
            fetchData();
        }
    }, [selectedCourse, courses, activeTab]);

    const fetchCourses = async () => {
        try {
            const userResponse = await api.get('/auth/me');
            const enrollmentsResponse = await api.get(`/users/${userResponse.data.id}/enrollments`);
            setCourses(enrollmentsResponse.data || []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'announcements') {
                await fetchAnnouncements();
            } else {
                await fetchDiscussions();
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        const allAnnouncements: Announcement[] = [];

        const coursesToFetch = selectedCourse
            ? courses.filter(c => c.course_id === selectedCourse)
            : courses;

        for (const course of coursesToFetch) {
            try {
                const response = await api.get(`/announcements/course/${course.course_id}`);
                allAnnouncements.push(...response.data);
            } catch (error) {
                console.error(`Failed to fetch announcements for course ${course.course_id}:`, error);
            }
        }

        // Sort: pinned first, then by date
        allAnnouncements.sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setAnnouncements(allAnnouncements);
    };

    const fetchDiscussions = async () => {
        const allDiscussions: DiscussionThread[] = [];

        const coursesToFetch = selectedCourse
            ? courses.filter(c => c.course_id === selectedCourse)
            : courses;

        for (const course of coursesToFetch) {
            try {
                const response = await api.get(`/discussions/course/${course.course_id}`);
                allDiscussions.push(...response.data);
            } catch (error) {
                console.error(`Failed to fetch discussions for course ${course.course_id}:`, error);
            }
        }

        // Sort by date
        allDiscussions.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setDiscussions(allDiscussions);
    };

    const handleSubmitQuery = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCourse) {
            alert('Please select a course first');
            return;
        }

        if (!messageTitle.trim() || !messageContent.trim()) {
            alert('Please fill in both title and message');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/discussions/', {
                course_id: selectedCourse,
                title: messageTitle,
                content: messageContent
            });

            // Reset form
            setMessageTitle('');
            setMessageContent('');
            setShowMessageForm(false);

            // Refresh discussions
            if (activeTab === 'discussions') {
                await fetchDiscussions();
            }

            alert('Query posted successfully!');
        } catch (error: any) {
            console.error('Failed to post query:', error);
            alert(error.response?.data?.detail || 'Failed to post query');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMins = Math.floor(diffTime / (1000 * 60));
                return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            }
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        }
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const getCourseName = (courseId: number) => {
        const course = courses.find(c => c.course_id === courseId);
        return course ? `${course.course_code}` : 'Unknown Course';
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Communication
                </h1>
                <p className="text-text-secondary mt-1">View announcements and ask course-related questions</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'announcements'
                            ? 'bg-primary text-white'
                            : 'bg-bg-secondary text-text-secondary hover:bg-white/10'
                        }`}
                >
                    <Megaphone className="w-5 h-5" />
                    Announcements
                </button>
                <button
                    onClick={() => setActiveTab('discussions')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'discussions'
                            ? 'bg-primary text-white'
                            : 'bg-bg-secondary text-text-secondary hover:bg-white/10'
                        }`}
                >
                    <MessageCircle className="w-5 h-5" />
                    Questions & Queries
                </button>
            </div>

            {/* Course Filter */}
            <div className="bg-bg-secondary rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <label className="text-sm font-medium text-text-secondary">Filter by Course:</label>
                    <div className="relative flex-1 max-w-md">
                        <select
                            value={selectedCourse || ''}
                            onChange={(e) => setSelectedCourse(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full bg-bg-primary border border-white/10 px-4 py-2 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-primary"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.course_id} value={course.course_id}>
                                    {course.course_code} - {course.course_title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                    </div>
                </div>

                {activeTab === 'discussions' && selectedCourse && (
                    <button
                        onClick={() => setShowMessageForm(!showMessageForm)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Ask Question
                    </button>
                )}
            </div>

            {/* New Question Form */}
            {showMessageForm && activeTab === 'discussions' && (
                <div className="bg-bg-secondary rounded-xl p-6 mb-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Ask a Question</h3>
                    <form onSubmit={handleSubmitQuery} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Question Title
                            </label>
                            <input
                                type="text"
                                value={messageTitle}
                                onChange={(e) => setMessageTitle(e.target.value)}
                                placeholder="Enter question title..."
                                className="w-full px-4 py-2 bg-bg-primary border border-white/10 rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Question Details
                            </label>
                            <textarea
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                placeholder="Describe your question in detail..."
                                rows={4}
                                className="w-full px-4 py-2 bg-bg-primary border border-white/10 rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-primary resize-none"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                {submitting ? 'Posting...' : 'Post Question'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMessageForm(false);
                                    setMessageTitle('');
                                    setMessageContent('');
                                }}
                                className="bg-bg-primary hover:bg-white/10 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* Announcements List */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-4">
                            {announcements.length === 0 ? (
                                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                                    <Megaphone className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No Announcements</h3>
                                    <p className="text-text-secondary">
                                        {selectedCourse ? 'No announcements for this course yet' : 'No announcements from your courses'}
                                    </p>
                                </div>
                            ) : (
                                announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className={`bg-bg-secondary rounded-xl p-6 border transition-all duration-300 ${announcement.is_pinned
                                                ? 'border-primary/50 bg-primary/5'
                                                : 'border-white/5 hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${announcement.is_pinned ? 'bg-primary/20' : 'bg-white/5'
                                                }`}>
                                                {announcement.is_pinned ? (
                                                    <Pin className="w-6 h-6 text-primary" />
                                                ) : (
                                                    <Megaphone className="w-6 h-6 text-text-secondary" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-white mb-1">
                                                            {announcement.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                                                            <span className="text-primary font-medium">
                                                                {getCourseName(announcement.course_id)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{announcement.creator_name}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(announcement.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    {announcement.is_pinned && (
                                                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                                            Pinned
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-text-secondary whitespace-pre-wrap">
                                                    {announcement.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Discussions List */}
                    {activeTab === 'discussions' && (
                        <div className="space-y-4">
                            {discussions.length === 0 ? (
                                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                                    <MessageCircle className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No Questions Yet</h3>
                                    <p className="text-text-secondary mb-4">
                                        {selectedCourse ? 'No questions posted for this course yet' : 'No questions in your courses'}
                                    </p>
                                    {selectedCourse && (
                                        <button
                                            onClick={() => setShowMessageForm(true)}
                                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Ask First Question
                                        </button>
                                    )}
                                </div>
                            ) : (
                                discussions.map((discussion) => (
                                    <div
                                        key={discussion.id}
                                        className="bg-bg-secondary rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all duration-300"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <MessageCircle className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {discussion.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-text-secondary mb-3">
                                                    <span className="text-primary font-medium">
                                                        {getCourseName(discussion.course_id)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{discussion.creator_name}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(discussion.created_at)}</span>
                                                    {discussion.reply_count !== undefined && discussion.reply_count > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{discussion.reply_count} {discussion.reply_count === 1 ? 'reply' : 'replies'}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-text-secondary line-clamp-3 whitespace-pre-wrap">
                                                    {discussion.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentCommunication;
