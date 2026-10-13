import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';

interface CriterionInput {
    name: string;
    description: string;
    max_points: string;
}

interface Props {
    courseId: number;
    courseName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const emptyCriterion = (): CriterionInput => ({ name: '', description: '', max_points: '' });

const CreateRubricModal = ({ courseId, courseName, onClose, onSuccess }: Props) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [criteria, setCriteria] = useState<CriterionInput[]>([emptyCriterion()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const updateCriterion = (index: number, field: keyof CriterionInput, value: string) => {
        setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    };

    const addCriterion = () => setCriteria((prev) => [...prev, emptyCriterion()]);

    const removeCriterion = (index: number) => {
        if (criteria.length === 1) return;
        setCriteria((prev) => prev.filter((_, i) => i !== index));
    };

    const totalPoints = criteria.reduce((sum, c) => sum + (parseFloat(c.max_points) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Rubric title is required');
            return;
        }

        const parsed = criteria.map((c, i) => ({
            name: c.name.trim(),
            description: c.description.trim() || null,
            max_points: parseFloat(c.max_points),
            order: i,
        }));

        for (const [i, c] of parsed.entries()) {
            if (!c.name) {
                setError(`Criterion ${i + 1} needs a name`);
                return;
            }
            if (isNaN(c.max_points) || c.max_points <= 0) {
                setError(`Criterion "${c.name}" needs max points greater than 0`);
                return;
            }
        }

        setLoading(true);
        try {
            await api.post('/rubrics/', {
                title: title.trim(),
                description: description.trim() || null,
                course_id: courseId,
                criteria: parsed,
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create rubric');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white text-sm';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-bg-secondary rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Rubric</h2>
                        <p className="text-text-secondary text-sm mt-1">{courseName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Assignment Grading Rubric"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${inputClass} min-h-[80px]`}
                            placeholder="What is this rubric used for?"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-text-secondary">
                                Criteria <span className="text-text-secondary/70">(total: {totalPoints} pts)</span>
                            </label>
                            <button
                                type="button"
                                onClick={addCriterion}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add criterion
                            </button>
                        </div>

                        <div className="space-y-3">
                            {criteria.map((criterion, index) => (
                                <div key={index} className="bg-bg-primary rounded-lg p-4 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                            Criterion {index + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeCriterion(index)}
                                            disabled={criteria.length === 1}
                                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            value={criterion.name}
                                            onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                                            className={`${inputClass} sm:col-span-2`}
                                            placeholder="Criterion name (e.g. Code Quality)"
                                        />
                                        <input
                                            type="number"
                                            value={criterion.max_points}
                                            onChange={(e) => updateCriterion(index, 'max_points', e.target.value)}
                                            className={inputClass}
                                            placeholder="Max pts"
                                            min="0"
                                            step="0.5"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={criterion.description}
                                        onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                                        className={inputClass}
                                        placeholder="Description (optional)"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Rubric'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRubricModal;
