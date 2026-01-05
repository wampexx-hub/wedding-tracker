
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Calendar, CreditCard, Shield, Trash2, Key, Ban } from 'lucide-react';

const UserDetail = ({ username, onBack }) => {
    // const { username } = useParams(); // Removed in favor of props
    // const navigate = useNavigate(); // Removed in favor of onBack
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUserFullData = async () => {
            try {
                // Fetch basic user info
                // We might need a specific endpoint for single user details from admin API if not in the list
                // For now, reusing the list might be inefficient, so let's check if we can fetch individual
                // Or we fetch data via /api/data?user=username which gives expenses/budget

                const dataRes = await fetch(`/api/data?user=${username}`);
                const dataObj = await dataRes.json();
                setUserData(dataObj);

                // Fetch user metadata (admin status, email etc) - Currently leveraging admin list or we need a new endpoint
                // Let's rely on passed state or fetch from admin list. 
                // Better: Create /api/admin/users/:username endpoint in server.js
                const userRes = await fetch(`/api/admin/users`);
                const users = await userRes.json();
                const foundUser = users.find(u => u.username === username);
                setUser(foundUser);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchUserFullData();
    }, [username]);

    const handleBan = async () => {
        const newBanStatus = !user.isBanned;
        const action = newBanStatus ? 'askıya almak' : 'askıyı kaldırmak';

        if (window.confirm(`${user.username} kullanıcısını ${action} istediğinize emin misiniz?`)) {
            try {
                const response = await fetch(`/api/admin/users/${user.username}/ban`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isBanned: newBanStatus }),
                });

                if (response.ok) {
                    setUser({ ...user, isBanned: newBanStatus });
                    alert(`Kullanıcı ${newBanStatus ? 'askıya alındı' : 'aktif edildi'}.`);
                } else {
                    alert('İşlem başarısız.');
                }
            } catch (error) {
                console.error('Error banning user:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`${user.username} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            try {
                const response = await fetch(`/api/admin/users/${user.username}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert('Kullanıcı başarıyla silindi.');
                    navigate('/admin');
                } else {
                    alert('Silme işlemi başarısız.');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    // Quick Reset via Prompt for now
    const handleResetPassword = async () => {
        const newPassword = prompt('Yeni şifreyi giriniz:', '');
        if (!newPassword) return;

        try {
            const response = await fetch(`/api/admin/users/${user.username}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                alert('Şifre başarıyla güncellendi.');
            } else {
                alert('Şifre güncellenemedi.');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
        }
    };


    if (loading) return <div className="p-8">Yükleniyor...</div>;
    if (!user) return <div className="p-8">Kullanıcı bulunamadı.</div>;

    const totalSpent = userData?.expenses?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
    const budget = userData?.budget || 0;
    const remaining = budget - totalSpent;

    return (
        <div className="bg-gray-50 p-6 rounded-2xl animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-900 font-medium">
                <ArrowLeft size={18} />
                Listeye Dön
            </button>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile Header */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5">
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-3xl font-bold text-pink-600">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{user.name} {user.surname}</h1>
                                {user.isBanned && (
                                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">ASKIYA ALINDI</span>
                                )}
                            </div>
                            <p className="text-gray-500">@{user.username}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Mail size={14} /> {user.email}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBan}
                            className={`p-2 rounded-lg border transition-colors ${user.isBanned ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}
                            title={user.isBanned ? "Askıyı Kaldır" : "Askıya Al"}
                        >
                            {user.isBanned ? <Shield size={20} /> : <Ban size={20} />}
                        </button>
                        <button
                            onClick={handleResetPassword}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200 bg-white"
                            title="Şifre Sıfırla"
                        >
                            <Key size={20} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 bg-white"
                            title="Kullanıcıyı Sil"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Toplam Bütçe</p>
                        <p className="text-2xl font-bold text-gray-900">₺{budget.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Toplam Harcama</p>
                        <p className="text-2xl font-bold text-pink-600">₺{totalSpent.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Kalan Bütçe</p>
                        <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₺{remaining.toLocaleString('tr-TR')}
                        </p>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Harcama Hareketleri</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500">Başlık</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500">Kategori</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500">Tarih</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userData?.expenses?.map((exp, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm text-gray-900">{exp.title}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{exp.category}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">
                                        {new Date(exp.date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                                        ₺{Number(exp.price).toLocaleString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
