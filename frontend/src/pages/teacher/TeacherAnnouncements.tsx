import { useEffect, useState } from 'react';
import { Plus, Pin, Edit, Trash2, Megaphone } from 'lucide-react';
import api from '../../services/api';
import CreateAnnouncementModal from '../../components/modals/CreateAnnouncementModal';

interface Section {
    id: number;
    name: string;
    course_id: number;
    course_title: string;
    course_code: string;
}

interface Announcement {
    id: number;
    course_id: number;
    title: string;
    content: string;
    created_by: number;
    is_pinned: boolean;
    created_at: string;
    creator_name: string;
}

const TeacherAnnouncements = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchAnnouncements();
        }
    }, [selectedSection]);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setCurrentUserId(response.data.id);
        } catch (error) {
            console.error('Failed to fetch current user:', error);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await api.get('/teacher/sections');
            setSections(response.data);
            if (response.data.length > 0) {
                setSelectedSection(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        if (!selectedSection) return;

        setLoading(true);
        try {
            const response = await api.get(`/announcements/course/${selectedSection.course_id}`);
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setShowCreateModal(true);
    };

    const handleDelete = async (announcementId: number) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await api.delete(`/announcements/${announcementId}`);
            fetchAnnouncements();
        } catch (error) {
            console.error('Failed to delete announcement:', error);
            alert('Failed to delete announcement');
        }
    };

    const handleTogglePin = async (announcement: Announcement) => {
        try {
            await api.put(`/announcements/${announcement.id}`, {
                course_id: announcement.course_id,
                title: announcement.title,
                content: announcement.content,
                is_pinned: !announcement.is_pinned
            });
            fetchAnnouncements();
        } catch (error) {
            console.error('Failed to toggle pin:', error);
            alert('Failed to update announcement');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && sections.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Announcements
                    </h1>
                    <p className="text-text-secondary mt-1">Post and manage course announcements</p>
                </div>
                {selectedSection && (
                    <button
                        onClick={() => {
                            setEditingAnnouncement(null);
                            setShowCreateModal(true);
                        }}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Announcement
                    </button>
                )}
            </div>

            {/* Section Selector */}
            <div className="bg-bg-secondary rounded-xl p-6 mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Section
                </label>
                <select
                    value={selectedSection?.id || ''}
                    onChange={(e) => {
                        const section = sections.find(s => s.id === parseInt(e.target.value));
                        setSelectedSection(section || null);
                    }}
                    className="w-full md:w-1/2 px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                >
                    {sections.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.course_code} - {section.name} ({section.course_title})
                        </option>
                    ))}
                </select>
            </div>

            {/* Announcements List */}
            {loading ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-text-secondary mt-4">Loading announcements...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="bg-bg-secondary rounded-xl p-12 text-center">
                    <Megaphone className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Announcements Yet</h3>
                    <p className="text-text-secondary mb-6">Create your first announcement for this course</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        New Announcement
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className={`bg-bg-secondary rounded-xl border p-6 transition-all duration-300 ${announcement.is_pinned
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-white/5 hover:border-primary/30'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {announcement.is_pinned && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <Pin className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-medium text-primary uppercase">Pinned</span>
                                        </div>
                                    )}
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {announcement.title}
                                    </h3>
                                    <p className="text-text-secondary mb-4 whitespace-pre-wrap">
                                        {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                                        <span>By {announcement.creator_name}</span>
                                        <span>•</span>
                                        <span>{formatDate(announcement.created_at)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {currentUserId === announcement.created_by && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleTogglePin(announcement)}
                                            className={`p-2 rounded-lg transition-colors ${announcement.is_pinned
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                                                }`}
                                            title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                                        >
                                            <Pin className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(announcement)}
                                            className="p-2 bg-white/5 hover:bg-white/10 text-text-secondary rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && selectedSection && (
                <CreateAnnouncementModal
                    courseId={selectedSection.course_id}
                    courseName={`${selectedSection.course_code} - ${selectedSection.name}`}
                    announcement={editingAnnouncement}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingAnnouncement(null);
                    }}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default TeacherAnnouncements;
