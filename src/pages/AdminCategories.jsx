
import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, ArrowLeft, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminCategories = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', color: '#ec4899', type: 'expense' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
            if (res.ok) {
                setNewCategory({ name: '', color: '#ec4899', type: 'expense' });
                fetchCategories();
            } else {
                alert('Ekleme başarısız (İsim aynı olabilir)');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            if (res.ok) fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    const handleMove = async (index, direction) => {
        const newCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newCategories.length) return;

        // Swap
        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

        // Update Ranks locally
        const updated = newCategories.map((cat, idx) => ({ ...cat, rank: idx }));
        setCategories(updated);

        // Sync with Server (Debounce could be good, but simple is fine for now)
        try {
            await fetch('/api/admin/categories/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: updated.map(c => ({ id: c.id, rank: c.rank })) })
            });
        } catch (error) {
            console.error('Reorder failed', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Kategori Yönetimi</h2>
                            <p className="text-sm text-gray-500">Harcama kategorilerini düzenleyin</p>
                        </div>
                    </div>

                    {/* Add Form */}
                    <form onSubmit={handleAdd} className="flex gap-4 items-end mb-8 bg-gray-50 p-4 rounded-xl">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kategori Adı</label>
                            <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded-lg"
                                placeholder="Örn: Kına Gecesi"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Renk</label>
                            <input
                                type="color"
                                value={newCategory.color}
                                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                className="h-10 w-20 p-1 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 flex items-center gap-2 h-10"
                        >
                            <Plus size={18} /> Ekle
                        </button>
                    </form>

                    {/* List */}
                    {loading ? (
                        <div>Yükleniyor...</div>
                    ) : (
                        <div className="space-y-3">
                            {categories.map((cat, index) => (
                                <div key={cat.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white group">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col gap-1 mr-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleMove(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleMove(index, 'down')}
                                                disabled={index === categories.length - 1}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: cat.color }}>
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800 block text-lg">{cat.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Sıra: {(cat.rank !== undefined && cat.rank !== null ? cat.rank : index) + 1}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(cat.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">Kategori bulunamadı.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;
