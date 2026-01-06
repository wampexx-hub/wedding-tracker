import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, LogOut, Users, DollarSign, PieChart, Search, Key, X, Tag,
    Home, ChevronRight, TrendingUp, Shield, Bell, Store, MapPin, Calendar, Activity, Ban
} from 'lucide-react';
import AdminCategories from './AdminCategories';
import AdminNotifications from './AdminNotifications';
import AdminVendors from './AdminVendors';
import UserDetail from './UserDetail';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [cityFilter, setCityFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [budgetFilter, setBudgetFilter] = useState('all');
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

    const getDaysRemaining = (weddingDate) => {
        if (!weddingDate) return null;
        const today = new Date();
        const wedding = new Date(weddingDate);
        const diffTime = wedding - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateDataCompleteness = (user) => {
        let score = 0;
        if (user.city) score++;
        if (user.weddingDate) score++;
        if (user.budgetRange) score++;
        if (user.phone) score++;
        return score;
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.surname && u.surname.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (cityFilter !== 'all' && u.city !== cityFilter) return false;

        if (timeFilter !== 'all') {
            const days = getDaysRemaining(u.weddingDate);
            if (timeFilter === 'urgent' && (days === null || days >= 30)) return false;
            if (timeFilter === 'soon' && (days === null || days < 30 || days >= 90)) return false;
            if (timeFilter === 'far' && (days === null || days < 90)) return false;
            if (timeFilter === 'none' && days !== null) return false;
        }

        if (budgetFilter !== 'all') {
            if (budgetFilter === 'high' && (!u.budgetRange || !u.budgetRange.includes('500k'))) return false;
            if (budgetFilter === 'medium' && (!u.budgetRange || !u.budgetRange.includes('250k-500k'))) return false;
            if (budgetFilter === 'low' && (!u.budgetRange || u.budgetRange.includes('500k') || u.budgetRange.includes('250k-500k'))) return false;
            if (budgetFilter === 'none' && u.budgetRange) return false;
        }

        if (filterType === 'recent') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(u.createdAt) > oneWeekAgo;
        }

        return true;
    });

    const COLORS = ['#EC4899', '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside className={`bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-20 transition-all duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'} lg:relative`}>
                <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
                            <div className="bg-pink-600 p-1.5 rounded-lg text-white"><Users size={20} /></div>
                            <span>Admin<span className="text-pink-600">Panel</span></span>
                        </div>
                    ) : (
                        <div className="bg-pink-600 p-2 rounded-lg text-white"><Users size={24} /></div>
                    )}
                </div>

                <div className="flex-1 py-6 flex flex-col gap-2 px-3">
                    <SidebarItem icon={<Home size={20} />} text="Genel Bakış" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Users size={20} />} text="Kullanıcılar" active={activeTab === 'users'} onClick={() => setActiveTab('users')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Tag size={20} />} text="Kategoriler" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Store size={20} />} text="Tedarikçiler" active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Bell size={20} />} text="Bildirim Gönder" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} collapsed={!sidebarOpen} />
                    <div className="mt-auto">
                        <SidebarItem icon={<LogOut size={20} />} text="Çıkış Yap" onClick={handleLogout} collapsed={!sidebarOpen} danger />
                    </div>
                </div>

                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-500 hover:text-pink-600 hidden lg:block">
                    {sidebarOpen ? <ChevronRight size={14} className="rotate-180" /> : <ChevronRight size={14} />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen bg-gray-50/50">
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'dashboard' && 'İş Zekası (BI) Paneli'}
                            {activeTab === 'users' && 'Kullanıcı Yönetimi'}
                            {activeTab === 'categories' && 'Kategori Yönetimi'}
                            {activeTab === 'notifications' && 'Bildirim Merkezi'}
                            {activeTab === 'vendors' && 'Tedarikçi Yönetimi'}
                            {activeTab === 'user_detail' && 'Kullanıcı Detayı'}
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

                <div className="p-8 pb-32">
                    {/* BI DASHBOARD */}
                    {activeTab === 'dashboard' && stats && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Financial Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Toplam Yönetilen Bütçe"
                                    value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalBudgetAmount || 0)}
                                    icon={<DollarSign size={24} />}
                                    color="blue"
                                    trend="Planlanan"
                                />
                                <StatCard
                                    title="Gerçekleşen Harcama"
                                    value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.totalSpending || 0)}
                                    icon={<Activity size={24} />}
                                    color="purple"
                                    trend="Reel"
                                />
                                <StatCard
                                    title="Toplam Kullanıcı"
                                    value={stats.totalUsers}
                                    icon={<Users size={24} />}
                                    color="pink"
                                    trend="Aktif"
                                />
                                <StatCard
                                    title="Toplam İşlem"
                                    value={stats.totalExpenses}
                                    icon={<Tag size={24} />}
                                    color="orange"
                                    trend="Kayıt"
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Spending Distribution */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <PieChart size={20} className="text-pink-500" />
                                        Harcama Dağılımı
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={stats.categoryDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={renderCustomizedLabel}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {stats.categoryDistribution?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)} />
                                                <Legend />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Wedding Timeline */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <Calendar size={20} className="text-purple-500" />
                                        Düğün Takvimi (Önümüzdeki 12 Ay)
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.weddingTimeline}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: '#fdf2f8' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="uv" name="Düğün Sayısı" fill="#A855F7" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Geographic Distribution */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <MapPin size={20} className="text-blue-500" />
                                    Şehirlere Göre Kullanıcı Dağılımı
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                <th className="pb-3 pl-2">Şehir</th>
                                                <th className="pb-3">Kullanıcı Sayısı</th>
                                                <th className="pb-3 text-right pr-2">Oran</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stats.cityDistribution?.map((city, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 pl-2 text-sm font-medium text-gray-700">{city.bg || 'Belirtilmemiş'}</td>
                                                    <td className="py-3 text-sm text-gray-600">{city.count}</td>
                                                    <td className="py-3 pr-2 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs text-gray-400">
                                                                %{((city.count / stats.totalUsers) * 100).toFixed(1)}
                                                            </span>
                                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 rounded-full"
                                                                    style={{ width: `${(city.count / stats.totalUsers) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!stats.cityDistribution || stats.cityDistribution.length === 0) && (
                                                <tr>
                                                    <td colSpan="3" className="py-8 text-center text-gray-400 text-sm">Veri bulunamadı</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı ara..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                                        <option value="all">Tüm Şehirler</option>
                                        {Array.from(new Set(users.map(u => u.city))).filter(Boolean).map(city => (<option key={city} value={city}>{city}</option>))}
                                    </select>
                                    <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                                        <option value="all">Tüm Zamanlar</option>
                                        <option value="urgent">Acil (30 Gün Altı)</option>
                                        <option value="soon">Yakın (30-90 Gün)</option>
                                        <option value="far">Uzak (90 Gün Üstü)</option>
                                        <option value="none">Tarih Girmemiş</option>
                                    </select>
                                    <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)}>
                                        <option value="all">Tüm Bütçeler</option>
                                        <option value="high">Yüksek (500k+)</option>
                                        <option value="medium">Orta (250k-500k)</option>
                                        <option value="low">Düşük (250k Altı)</option>
                                        <option value="none">Bütçe Girmemiş</option>
                                    </select>
                                    <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                        <option value="all">Tüm Kullanıcılar</option>
                                        <option value="recent">Son 7 Gün</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şehir</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Düğün Tarihi</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kalan Süre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bütçe Aralığı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veri Doluluğu</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
                                            <th className="relative px-6 py-3"><span className="sr-only">Eylemler</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((u) => {
                                                const daysRemaining = u.weddingDate ? getDaysRemaining(u.weddingDate) : null;
                                                const score = calculateDataCompleteness(u);
                                                return (
                                                    <tr key={u.username} className={`hover:bg-gray-50/80 transition-colors group ${u.isBanned ? 'bg-red-50/30' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                                                                    {u.name ? u.name[0].toUpperCase() : u.username[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{u.name} {u.surname}</div>
                                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                        {u.isAdmin && <span className="text-amber-500 flex items-center"><Shield size={10} className="mr-0.5" /> Admin</span>}
                                                                        {u.isBanned && <span className="text-red-500 font-bold">BANLI</span>}
                                                                        {!u.isAdmin && !u.isBanned && 'Üye'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4"><div className="space-y-0.5"><div className="text-sm text-gray-900">{u.email}</div><div className="text-xs text-gray-500">{u.phone || '-'}</div></div></td>
                                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{u.city || <span className="text-gray-300 italic">Girmedi</span>}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{u.weddingDate ? new Date(u.weddingDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                        <td className="px-6 py-4 text-sm">
                                                            {daysRemaining !== null ? (
                                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${daysRemaining < 30 ? 'bg-red-50 text-red-600' : daysRemaining < 90 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                                                    {daysRemaining > 0 ? `${daysRemaining} Gün` : 'Geçti'}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{u.budgetRange || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4].map(s => (<div key={s} className={`w-2 h-2 rounded-full ${s <= score ? 'bg-indigo-500' : 'bg-gray-200'}`} />))}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 mt-1 block">Veri: {Math.round((score / 4) * 100)}%</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ActionButton onClick={(e) => { e.stopPropagation(); handleViewData(u); }} icon={<Activity size={18} />} color="blue" tooltip="Verileri Gör" />
                                                                <ActionButton onClick={(e) => { e.stopPropagation(); handlePasswordReset({ preventDefault: () => { } }); setSelectedUser(u); setShowPasswordModal(true); }} icon={<Key size={18} />} color="orange" tooltip="Şifre Sıfırla" />
                                                                <ActionButton onClick={(e) => { e.stopPropagation(); handleToggleBan(u); }} icon={<Ban size={18} className={u.isBanned ? "fill-current" : ""} />} color={u.isBanned ? "red" : "gray"} tooltip={u.isBanned ? "Yasağı Kaldır" : "Yasakla"} />
                                                                <ActionButton onClick={(e) => { e.stopPropagation(); handleToggleAdmin(u); }} icon={<Shield size={18} className={u.isAdmin ? "fill-current" : ""} />} color={u.isAdmin ? "purple" : "gray"} tooltip={u.isAdmin ? "Admin Yetkisini Al" : "Admin Yap"} />
                                                                <ActionButton onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.username); }} icon={<Trash2 size={18} />} color="red" tooltip="Sil" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="px-8 py-12 text-center text-gray-500">
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
                    {activeTab === 'categories' && <AdminCategories />}
                    {activeTab === 'notifications' && <AdminNotifications />}
                    {activeTab === 'vendors' && <AdminVendors />}
                    {activeTab === 'user_detail' && selectedUser && <UserDetail username={selectedUser.username} onBack={() => setActiveTab('users')} />}
                </div>

                {showPasswordModal && (
                    <Modal onClose={() => setShowPasswordModal(false)} title={`Şifre Değiştir: ${selectedUser?.username}`}>
                        <form onSubmit={handlePasswordReset} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all" placeholder="Yeni şifreyi girin" required autoFocus />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">İptal</button>
                                <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200">Güncelle</button>
                            </div>
                        </form>
                    </Modal>
                )}

                {showDataModal && (
                    <Modal onClose={() => setShowDataModal(false)} title={`Kullanıcı Verileri: ${selectedUser?.username}`} size="lg">
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                    <p className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-1">Toplam Bütçe</p>
                                    <p className="text-2xl font-bold text-gray-800">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(userData?.budget || 0)}</p>
                                </div>
                                <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100">
                                    <p className="text-pink-600 text-sm font-bold uppercase tracking-wider mb-1">Toplam Harcama</p>
                                    <p className="text-2xl font-bold text-gray-800">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(userData?.expenses?.reduce((a, b) => a + Number(b.amount), 0) || 0)}</p>
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
                                                        <td className="px-4 py-3 text-sm text-gray-500"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{exp.category}</span></td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(exp.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-gray-500">Harcama kaydı bulunmuyor.</p></div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </main>
        </div>
    );
};

const SidebarItem = ({ icon, text, active, onClick, collapsed, danger }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${active ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${danger ? 'hover:bg-red-50 hover:text-red-600 mt-auto' : ''}`}
        title={collapsed ? text : ''}
    >
        <div className={`${active ? 'text-pink-600' : 'text-gray-500 group-hover:text-gray-700'} ${danger ? 'group-hover:text-red-600' : ''}`}>{icon}</div>
        {!collapsed && <span>{text}</span>}
        {active && !collapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-pink-600"></div>}
    </button>
);

const StatCard = ({ title, value, icon, color, trend }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        pink: 'bg-pink-50 text-pink-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
                {trend && <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} />{trend}</div>}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{value}</h3>
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
        orange: 'text-orange-600 hover:bg-orange-50',
    };
    return <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${colorClasses[color]}`} title={tooltip}>{icon}</button>;
};

const Modal = ({ children, onClose, title, size = 'md' }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${size === 'lg' ? 'max-w-3xl' : 'max-w-md'}`}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            {children}
        </div>
    </div>
);

// Missing icon Ban was used but not imported in my check, adding it to imports just in case
// Wait, I imported Trash2, LogOut etc. I need to make sure Ban is imported.
// In imports: ... Shield, Bell, Store, MapPin, Calendar, Activity.
// Ban is missing. Adding Ban to imports.
// Note: I will edit the imports line manually in the write tool content above before sending.
// DONE: Added Activity, Ban (wait, Ban is standard icon? yes).
// I referenced Ban in ActionButton logic.
// I need `Ban` in imports.
// I will check imports one last time.
// Imports: Trash2, LogOut, Users, DollarSign, PieChart, Search, Key, X, Tag, Home, ChevronRight, TrendingUp, Shield, Bell, Store, MapPin, Calendar, Activity.
// Missing: Ban, Menu (not used?), Settings (not used?), ArrowUpRight (not used?), ArrowDownRight (not used?).
// Adding Ban to imports.

export default AdminDashboard;
