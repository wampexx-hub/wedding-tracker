import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, LogOut, Users, DollarSign, PieChart, Search, Key, Eye, X,
    Menu, Home, Settings, ChevronRight, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Shield
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Modals state
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDataModal, setShowDataModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    const handleDeleteUser = async (username) => {
        if (window.confirm(`${username} kullanıcısını silmek istediğinize emin misiniz?`)) {
            try {
                const response = await fetch(`/api/admin/users/${username}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchUsers();
                    fetchStats();
                } else {
                    alert('Kullanıcı silinemedi.');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleToggleAdmin = async (user) => {
        if (user.username === 'admin') return;
        const newStatus = !user.isAdmin;
        const action = newStatus ? 'admin yapmak' : 'admin yetkisini almak';

        if (window.confirm(`${user.username} kullanıcısını ${action} istediğinize emin misiniz?`)) {
            try {
                const response = await fetch(`/api/admin/users/${user.username}/role`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isAdmin: newStatus }),
                });

                if (response.ok) {
                    fetchUsers();
                } else {
                    const data = await response.json();
                    alert(data.error || 'İşlem başarısız.');
                }
            } catch (error) {
                console.error('Error updating user role:', error);
            }
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.username}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                alert('Şifre başarıyla güncellendi.');
                setShowPasswordModal(false);
                setNewPassword('');
                setSelectedUser(null);
            } else {
                alert('Şifre güncellenemedi.');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
        }
    };

    const handleViewData = async (user) => {
        setSelectedUser(user);
        try {
            const response = await fetch(`/api/data?user=${user.username}`);
            const data = await response.json();
            setUserData(data);
            setShowDataModal(true);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.surname && u.surname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Mock data for charts (since we don't have real historical data in this simple backend)
    const userGrowthData = [
        { name: 'Ocak', users: 4 },
        { name: 'Şubat', users: 7 },
        { name: 'Mart', users: 12 },
        { name: 'Nisan', users: 18 },
        { name: 'Mayıs', users: 24 },
        { name: 'Haziran', users: stats?.totalUsers || 30 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Calculate category distribution from all users (mocking for now as we don't fetch all expenses at once)
    // In a real app, we would aggregate this on the backend.
    const categoryData = [
        { name: 'Mekan', value: 40000 },
        { name: 'Gelinlik', value: 15000 },
        { name: 'Fotoğraf', value: 8000 },
        { name: 'Müzik', value: 5000 },
        { name: 'Diğer', value: 12000 },
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-20 transition-all duration-300 ease-in-out flex flex-col
                ${sidebarOpen ? 'w-64' : 'w-20'} lg:relative`}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
                            <div className="bg-pink-600 p-1.5 rounded-lg text-white">
                                <Users size={20} />
                            </div>
                            <span>Admin<span className="text-pink-600">Panel</span></span>
                        </div>
                    ) : (
                        <div className="bg-pink-600 p-2 rounded-lg text-white">
                            <Users size={24} />
                        </div>
                    )}
                </div>

                <div className="flex-1 py-6 flex flex-col gap-2 px-3">
                    <SidebarItem
                        icon={<Home size={20} />}
                        text="Genel Bakış"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        collapsed={!sidebarOpen}
                    />
                    <SidebarItem
                        icon={<Users size={20} />}
                        text="Kullanıcılar"
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        collapsed={!sidebarOpen}
                    />
                    <SidebarItem
                        icon={<PieChart size={20} />}
                        text="İstatistikler"
                        active={activeTab === 'stats'}
                        onClick={() => setActiveTab('stats')}
                        collapsed={!sidebarOpen}
                    />
                    <SidebarItem
                        icon={<ArrowDownRight size={20} />}
                        text="Yedek İndir"
                        onClick={() => window.location.href = '/api/admin/backup'}
                        collapsed={!sidebarOpen}
                    />
                    <div className="mt-auto">
                        <SidebarItem
                            icon={<LogOut size={20} />}
                            text="Çıkış Yap"
                            onClick={handleLogout}
                            collapsed={!sidebarOpen}
                            danger
                        />
                    </div>
                </div>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-500 hover:text-pink-600 hidden lg:block"
                >
                    {sidebarOpen ? <ChevronRight size={14} className="rotate-180" /> : <ChevronRight size={14} />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen bg-gray-50/50">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'dashboard' && 'Genel Bakış'}
                            {activeTab === 'users' && 'Kullanıcı Yönetimi'}
                            {activeTab === 'stats' && 'Detaylı İstatistikler'}
                        </h2>
                        <p className="text-sm text-gray-500">Hoşgeldin, {user.username}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5">
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-pink-600 font-bold">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard
                                    title="Toplam Kullanıcı"
                                    value={stats?.totalUsers || 0}
                                    icon={<Users size={24} />}
                                    color="blue"
                                    trend="+12%"
                                />
                                <StatCard
                                    title="Toplam Harcama"
                                    value={stats?.totalExpenses || 0}
                                    icon={<PieChart size={24} />}
                                    color="green"
                                    trend="+5%"
                                />
                                <StatCard
                                    title="Toplam Bütçe"
                                    value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats?.totalBudgetAmount || 0)}
                                    icon={<DollarSign size={24} />}
                                    color="purple"
                                    trend="+8%"
                                />
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Kullanıcı Artışı</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={userGrowthData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Line type="monotone" dataKey="users" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Harcama Dağılımı (Tahmini)</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {categoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Users Table Preview */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-800">Son Kayıt Olanlar</h3>
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className="text-sm text-pink-600 font-medium hover:text-pink-700 flex items-center gap-1"
                                    >
                                        Tümünü Gör <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase">Kullanıcı</th>
                                                <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase">E-posta</th>
                                                <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users.slice(0, 5).map((u) => (
                                                <tr key={u.username} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-4 font-medium text-gray-900">{u.username}</td>
                                                    <td className="px-8 py-4 text-gray-500">{u.email}</td>
                                                    <td className="px-8 py-4 text-gray-500">
                                                        {new Date(u.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '/')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı, e-posta veya isim ara..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                                        Filtrele
                                    </button>
                                    <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200">
                                        Dışa Aktar
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                                            <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">İletişim</th>
                                            <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
                                            <th className="px-8 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((u) => (
                                                <tr key={u.username} className="group hover:bg-blue-50/30 transition-colors duration-200">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 font-bold mr-4 shadow-sm group-hover:scale-110 transition-transform">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{u.username}</div>
                                                                <div className="text-sm text-gray-500">{u.name} {u.surname}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <div className="text-sm text-gray-900">{u.email}</div>
                                                        <div className="text-xs text-gray-500">{u.phone}</div>
                                                    </td>
                                                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(u.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '/')}
                                                    </td>
                                                    <td className="px-8 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {u.isAdmin && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 mr-2">
                                                                    Admin
                                                                </span>
                                                            )}
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                <ActionButton
                                                                    onClick={() => handleViewData(u)}
                                                                    icon={<Eye size={18} />}
                                                                    color="blue"
                                                                    tooltip="Verileri Gör"
                                                                />
                                                                <ActionButton
                                                                    onClick={() => { setSelectedUser(u); setShowPasswordModal(true); }}
                                                                    icon={<Key size={18} />}
                                                                    color="amber"
                                                                    tooltip="Şifre Değiştir"
                                                                />
                                                                {u.username !== 'admin' && (
                                                                    <>
                                                                        <ActionButton
                                                                            onClick={() => handleToggleAdmin(u)}
                                                                            icon={<Shield size={18} className={u.isAdmin ? "fill-current" : ""} />}
                                                                            color={u.isAdmin ? "purple" : "gray"}
                                                                            tooltip={u.isAdmin ? "Admin Yetkisini Al" : "Admin Yap"}
                                                                        />
                                                                        <ActionButton
                                                                            onClick={() => handleDeleteUser(u.username)}
                                                                            icon={<Trash2 size={18} />}
                                                                            color="red"
                                                                            tooltip="Sil"
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Search size={48} className="text-gray-200" />
                                                        <p>Aradığınız kriterlere uygun kullanıcı bulunamadı.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Detailed Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-gray-500 text-sm font-medium mb-1">Ortalama Bütçe</p>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {stats?.totalUsers ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalBudgetAmount / stats.totalUsers) : '₺0'}
                                    </h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-gray-500 text-sm font-medium mb-1">Ortalama Harcama</p>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {stats?.totalUsers ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalExpenses / stats.totalUsers) : '0'}
                                    </h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-gray-500 text-sm font-medium mb-1">En Çok Harcanan Kategori</p>
                                    <h3 className="text-xl font-bold text-pink-600 truncate" title={stats?.topCategory?.name}>
                                        {stats?.topCategory?.name || '-'}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats?.topCategory?.amount || 0)}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-gray-500 text-sm font-medium mb-1">En Çok Tercih Edilen Yer</p>
                                    <h3 className="text-xl font-bold text-purple-600 truncate" title={stats?.topVendor?.name}>
                                        {stats?.topVendor?.name || '-'}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats?.topVendor?.amount || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Large Charts */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-8">Aylık Kullanıcı Kayıt İstatistiği</h3>
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={(() => {
                                            // Calculate real user growth by month
                                            const monthCounts = {};
                                            users.forEach(u => {
                                                const date = new Date(u.createdAt);
                                                const key = date.toLocaleDateString('tr-TR', { month: 'long' });
                                                monthCounts[key] = (monthCounts[key] || 0) + 1;
                                            });
                                            // Sort by month order (simplified for this example, just taking keys)
                                            return Object.keys(monthCounts).map(key => ({ name: key, users: monthCounts[key] }));
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                            <Tooltip
                                                cursor={{ fill: '#fdf2f8' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="users" fill="#ec4899" radius={[8, 8, 0, 0]} barSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Reset Modal */}
                {showPasswordModal && (
                    <Modal onClose={() => setShowPasswordModal(false)} title={`Şifre Değiştir: ${selectedUser?.username}`}>
                        <form onSubmit={handlePasswordReset} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                    placeholder="Yeni şifreyi girin"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                                >
                                    Güncelle
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* User Data Modal */}
                {showDataModal && (
                    <Modal onClose={() => setShowDataModal(false)} title={`Kullanıcı Verileri: ${selectedUser?.username}`} size="lg">
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                    <p className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-1">Toplam Bütçe</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(userData?.budget || 0)}
                                    </p>
                                </div>
                                <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100">
                                    <p className="text-pink-600 text-sm font-bold uppercase tracking-wider mb-1">Toplam Harcama</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(userData?.expenses?.reduce((a, b) => a + Number(b.amount), 0) || 0)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Son Harcamalar</h4>
                                {userData?.expenses?.length > 0 ? (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Başlık</th>
                                                    <th className="px-4 py-3 text-xs font-medium text-gray-500">Kategori</th>
                                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">Tutar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {userData.expenses.map((exp, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 text-sm text-gray-800">{exp.title}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{exp.category}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">
                                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(exp.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500">Harcama kaydı bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </main>
        </div>
    );
};

// Sub-components for cleaner code

const SidebarItem = ({ icon, text, active, onClick, collapsed, danger }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
        ${active
                ? 'bg-pink-50 text-pink-600 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        ${danger ? 'hover:bg-red-50 hover:text-red-600 mt-auto' : ''}
        `}
        title={collapsed ? text : ''}
    >
        <div className={`${active ? 'text-pink-600' : 'text-gray-500 group-hover:text-gray-700'} ${danger ? 'group-hover:text-red-600' : ''}`}>
            {icon}
        </div>
        {!collapsed && <span>{text}</span>}
        {active && !collapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-pink-600"></div>}
    </button>
);

const StatCard = ({ title, value, icon, color, trend }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

const ActionButton = ({ onClick, icon, color, tooltip }) => {
    const colorClasses = {
        blue: 'text-blue-600 hover:bg-blue-50',
        amber: 'text-amber-600 hover:bg-amber-50',
        red: 'text-red-600 hover:bg-red-50',
        purple: 'text-purple-600 hover:bg-purple-50',
        gray: 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
    };

    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors ${colorClasses[color]}`}
            title={tooltip}
        >
            {icon}
        </button>
    );
};

const Modal = ({ children, onClose, title, size = 'md' }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div
            className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200
            ${size === 'lg' ? 'max-w-3xl' : 'max-w-md'}`}
        >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default AdminDashboard;
