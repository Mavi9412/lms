import { useState } from 'react';
import { Save, Lock, AlertCircle } from 'lucide-react';
// import api from '../../services/api';

const AdminPolicies = () => {
    // These could be fetched from backend, but using local state for now as placeholder
    const [attendanceMin, setAttendanceMin] = useState(75);
    const [gradingLocked, setGradingLocked] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Need to implement backend endpoint for this
            // await api.put('/admin/policies', { attendanceMin, gradingLocked });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
            alert('Policies updated successfully');
        } catch (error) {
            alert('Failed to update policies');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-6">Institutional Policies</h1>

            <div className="grid gap-6">
                {/* Attendance Policy */}
                <div className="glass rounded-xl p-6 border border-white/5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Attendance Requirements</h2>
                            <p className="text-text-secondary mb-4">Set the minimum attendance percentage required for students to sit in final exams.</p>

                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="bg-bg-primary border border-white/10 rounded-lg px-4 py-2 w-24 text-center focus:ring-1 ring-primary outline-none"
                                    value={attendanceMin}
                                    onChange={(e) => setAttendanceMin(parseInt(e.target.value))}
                                />
                                <span className="font-bold text-xl">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grading Lock */}
                <div className="glass rounded-xl p-6 border border-white/5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Grading System Lock</h2>
                            <p className="text-text-secondary mb-4">
                                When active, teachers cannot modify grades for past semesters.
                                This is usually enabled after the final result declaration.
                            </p>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className={`w-12 h-6 rounded-full transition-colors relative ${gradingLocked ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gradingLocked ? 'left-7' : 'left-1'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={gradingLocked}
                                    onChange={(e) => setGradingLocked(e.target.checked)}
                                />
                                <span className="font-medium">{gradingLocked ? 'Grades Locked' : 'Grades Unlocked'}</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2 px-8"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Policy Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPolicies;
