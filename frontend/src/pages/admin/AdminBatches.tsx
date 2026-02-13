import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Power, Search } from 'lucide-react';
import api from '../../services/api';
import CreateBatchModal from '../../components/modals/CreateBatchModal';
import EditBatchModal from '../../components/modals/EditBatchModal';

interface Batch {
    id: number;
    name: string;
    program_id: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
}

interface Program {
    id: number;
    name: string;
    code: string;
    department_id: number;
}

const AdminBatches = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

    useEffect(() => {
        fetchBatches();
        fetchPrograms();
    }, [selectedProgram]);

    const fetchBatches = async () => {
        try {
            const url = selectedProgram
                ? `/admin/batches?program_id=${selectedProgram}`
                : '/admin/batches';
            const response = await api.get(url);
            setBatches(response.data);
        } catch (error) {
            console.error('Failed to fetch batches:', error);
        }
    };

    const fetchPrograms = async () => {
        try {
            const response = await api.get('/academic/programs');
            setPrograms(response.data);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        }
    };

    const handleToggleActive = async (batchId: number, currentStatus: boolean) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this batch?`)) return;

        try {
            const response = await api.patch(`/admin/batches/${batchId}/toggle-active`);
            setBatches(batches.map(b =>
                b.id === batchId ? { ...b, is_active: response.data.is_active } : b
            ));
        } catch (error: any) {
            alert(error.response?.data?.detail || `Failed to ${action} batch`);
        }
    };

    const handleDelete = async (batchId: number) => {
        if (!confirm('Are you sure you want to delete this batch? Students must be removed first.')) return;

        try {
            await api.delete(`/admin/batches/${batchId}`);
            setBatches(batches.filter(b => b.id !== batchId));
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to delete batch');
        }
    };

    const getProgramName = (programId: number) => {
        const program = programs.find(p => p.id === programId);
        return program ? program.name : 'Unknown';
    };

    const filteredBatches = batches.filter(batch =>
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProgramName(batch.program_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Batch Management
                    </h1>
                    <p className="text-text-secondary mt-1">Manage student cohorts and batches</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-shadow font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add Batch
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                    />
                </div>
                <select
                    value={selectedProgram || ''}
                    onChange={(e) => setSelectedProgram(e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-3 bg-bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary transition-colors text-white"
                >
                    <option value="">All Programs</option>
                    {programs.map(program => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                </select>
            </div>

            {/* Batches Table */}
            <div className="bg-bg-secondary rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Batch Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Program</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Start Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">End Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredBatches.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                        No batches found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredBatches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{batch.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {getProgramName(batch.program_id)}
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {new Date(batch.start_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {batch.end_date ? new Date(batch.end_date).toLocaleDateString() : 'Ongoing'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${batch.is_active
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {batch.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(batch.id, batch.is_active)}
                                                    className={`p-2 rounded-lg transition-colors ${batch.is_active
                                                        ? 'hover:bg-red-500/20 text-red-400'
                                                        : 'hover:bg-green-500/20 text-green-400'
                                                        }`}
                                                    title={batch.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingBatch(batch)}
                                                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                    title="Edit Batch"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(batch.id)}
                                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                    title="Delete Batch"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Batch Modal */}
            {showCreateModal && (
                <CreateBatchModal
                    programs={programs}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchBatches}
                />
            )}

            {/* Edit Batch Modal */}
            {editingBatch && (
                <EditBatchModal
                    batch={editingBatch}
                    programs={programs}
                    onClose={() => setEditingBatch(null)}
                    onSuccess={fetchBatches}
                />
            )}
        </div>
    );
};

export default AdminBatches;
