import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface Batch {
    id: number;
    name: string;
    program_id: number;
    start_date: string;
    end_date: string | null;
}

interface Program {
    id: number;
    name: string;
}

interface EditBatchModalProps {
    batch: Batch;
    programs: Program[];
    onClose: () => void;
    onSuccess: () => void;
}

const EditBatchModal = ({ batch, programs, onClose, onSuccess }: EditBatchModalProps) => {
    const [formData, setFormData] = useState({
        name: batch.name,
        program_id: batch.program_id.toString(),
        start_date: new Date(batch.start_date).toISOString().split('T')[0],
        end_date: batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                name: formData.name,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
            };

            await api.patch(`/admin/batches/${batch.id}`, data);
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to update batch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Edit Batch</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Batch Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Fall 2022, Batch 2020-2024"
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Program
                        </label>
                        <select
                            disabled
                            value={formData.program_id}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg opacity-50 cursor-not-allowed text-white"
                        >
                            {programs.map(program => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-text-secondary mt-1">Program cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            End Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                        />
                        <p className="text-xs text-text-secondary mt-1">Leave empty for ongoing batches</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-shadow font-medium disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBatchModal;
