import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import api from '../../services/api';

const AdminAllocations = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [teachersRes, sectionsRes] = await Promise.all([
                api.get('/admin/users?role=teacher'),
                api.get(`/academic/sections?_t=${Date.now()}`)
            ]);
            setTeachers(teachersRes.data);
            setSections(sectionsRes.data);
        } catch (error) {
            console.error('Failed to fetch allocations data');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleAssign = async (sectionId: number, teacherId: string) => {
        if (!teacherId) return;

        const selectedTeacher = teachers.find(t => t.id === parseInt(teacherId));

        // Optimistic Update
        setSections(prev => prev.map(sec =>
            sec.id === sectionId
                ? { ...sec, teacher: selectedTeacher }
                : sec
        ));

        try {
            await api.post(`/admin/sections/${sectionId}/assign-teacher/${teacherId}`);
            // Silently refresh to confirm data without showing spinner
            fetchData(true);
        } catch (error) {
            console.error('Assignment failed:', error);
            alert('Failed to assign teacher');
            fetchData(true); // Revert
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-6">Course Allocations</h1>
            <p className="text-text-secondary mb-8">Assign teachers to active course sections.</p>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="glass rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-text-secondary text-sm">
                            <tr>
                                <th className="px-6 py-3">Section</th>
                                <th className="px-6 py-3">Course</th>
                                <th className="px-6 py-3">Current Instructor</th>
                                <th className="px-6 py-3">Assign New</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sections.map((section: any) => (
                                <tr key={section.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium">{section.name}</td>
                                    <td className="px-6 py-4">{section.course?.title}</td>
                                    <td className="px-6 py-4">
                                        {section.teacher ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <UserCheck className="w-4 h-4" />
                                                {section.teacher.full_name}
                                            </div>
                                        ) : (
                                            <span className="text-red-400 text-sm">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <SearchableSelect
                                            options={teachers.map(t => ({ value: t.id, label: t.full_name }))}
                                            onSelect={(val) => handleAssign(section.id, val)}
                                            placeholder="Select Teacher"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sections.length === 0 && (
                        <div className="p-12 text-center text-text-secondary">
                            No sections found. Create sections in Academic Structure first.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Searchable Select Component
const SearchableSelect = ({ options, onSelect, placeholder = "Select..." }: { options: any[], onSelect: (val: string) => void, placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, dropdownRef]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={setDropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="select-field cursor-pointer flex items-center justify-between"
            >
                <span className="text-text-secondary">{placeholder}</span>
                <div className="border-[4px] border-transparent border-t-text-secondary translate-y-1 ml-2"></div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#0f172a] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-white/10 sticky top-0 bg-[#0f172a]">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search teacher..."
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary placeholder:text-text-secondary/50"
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-text-secondary text-center">
                                No teachers found
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onSelect(opt.value);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className="px-4 py-2 text-sm text-text-primary hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAllocations;
