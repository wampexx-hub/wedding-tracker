import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Check, X, AlertTriangle, UserX } from 'lucide-react';

const PartnerManagement = () => {
    const { user, updateUser } = useAuth();
    const [partnerEmail, setPartnerEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [showAcceptWarning, setShowAcceptWarning] = useState(null);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    useEffect(() => {
        if (user && !user.partner_username) {
            fetchPendingInvitations();
        }
    }, [user]);

    const fetchPendingInvitations = async () => {
        try {
            const response = await fetch(`/api/partnership/pending?username=${user.username}`);
            const data = await response.json();
            if (data.invitations) {
                setPendingInvitations(data.invitations);
            }
        } catch (err) {
            console.error('Error fetching invitations:', err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/partnership/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, partnerEmail })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setPartnerEmail('');
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Sunucu hatası' });
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (partnershipId) => {
        setLoading(true);
        setShowAcceptWarning(null);

        try {
            const response = await fetch('/api/partnership/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, partnershipId })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setPendingInvitations([]);
                // Update user context with partner info
                updateUser({ ...user, partner_username: data.partnerUsername });
                // Reload page to refresh all data
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Sunucu hatası' });
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async (partnershipId) => {
        setLoading(true);

        try {
            const response = await fetch('/api/partnership/decline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, partnershipId })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setPendingInvitations(pendingInvitations.filter(inv => inv.id !== partnershipId));
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Sunucu hatası' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        setShowDisconnectConfirm(false);

        try {
            const response = await fetch('/api/partnership/disconnect', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                updateUser({ ...user, partner_username: null });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Sunucu hatası' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-champagne/10 rounded-lg">
                    <Users size={24} className="text-champagne" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Ortak Yönetim</h2>
                    <p className="text-sm text-gray-500">Partnerinle bütçeni birlikte yönet</p>
                </div>
            </div>

            {/* Message Display */}
            {message.text && (
                <div className={`mb-4 p-4 rounded-xl border ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900 mb-2">Bekleyen Davet</h3>
                            {pendingInvitations.map(inv => (
                                <div key={inv.id} className="bg-white rounded-lg p-3 mb-2">
                                    <p className="text-sm text-gray-700 mb-3">
                                        <span className="font-semibold">{inv.inviterName}</span> seni ortak bütçe yönetimine davet etti.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAcceptWarning(inv.id)}
                                            className="flex-1 bg-champagne hover:bg-champagne-hover text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Check size={16} />
                                            Kabul Et
                                        </button>
                                        <button
                                            onClick={() => handleDecline(inv.id)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <X size={16} />
                                            Reddet
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Partnership */}
            {user?.partner_username ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 mb-1">Aktif Ortaklık</p>
                            <p className="font-semibold text-green-900">
                                {user.partner_username} ile ortak bütçe yönetiyorsunuz
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDisconnectConfirm(true)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            <UserX size={16} />
                            Sonlandır
                        </button>
                    </div>
                </div>
            ) : (
                /* Invite Form */
                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Partner Email Adresi
                        </label>
                        <div className="relative">
                            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={partnerEmail}
                                onChange={(e) => setPartnerEmail(e.target.value)}
                                placeholder="partner@example.com"
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/20 focus:border-champagne outline-none transition-all"
                                required
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Partnerinizin kayıtlı email adresini girin. Davet gönderdikten sonra kabul etmesini bekleyin.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-champagne to-amber-500 hover:from-champagne-hover hover:to-amber-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Gönderiliyor...' : 'Davet Gönder'}
                    </button>
                </form>
            )}

            {/* Accept Warning Modal */}
            {showAcceptWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertTriangle size={24} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">Önemli Bilgilendirme</h3>
                                <p className="text-sm text-gray-600">
                                    Daveti kabul ettiğinizde <span className="font-semibold">tüm geçmiş harcamalarınız, varlıklarınız ve bütçeniz</span> partnerinizle birleşecek ve <span className="font-semibold">karşılıklı olarak görünür</span> hale gelecektir.
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Bu işlem geri alınamaz. Emin misiniz?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAcceptWarning(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleAccept(showAcceptWarning)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-champagne hover:bg-champagne-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Kabul Ediliyor...' : 'Evet, Kabul Et'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disconnect Confirmation Modal */}
            {showDisconnectConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <UserX size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">Ortaklığı Sonlandır</h3>
                                <p className="text-sm text-gray-600">
                                    Ortaklığı sonlandırdığınızda verileriniz ayrılacak ve artık partnerinizin harcamalarını göremeyeceksiniz.
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Emin misiniz?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDisconnectConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDisconnect}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sonlandırılıyor...' : 'Evet, Sonlandır'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerManagement;
