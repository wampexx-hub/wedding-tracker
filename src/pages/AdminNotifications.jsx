
import React, { useState } from 'react';
import { Send, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AdminNotifications = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, targetUser: target }),
            });

            if (response.ok) {
                setStatus('success');
                setTitle('');
                setMessage('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500">

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex items-center gap-3 bg-pink-50/50">
                        <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Bildirim Merkezi</h2>
                            <p className="text-sm text-gray-500">Kullanıcılara anlık bildirim gönderin</p>
                        </div>
                    </div>

                    <form onSubmit={handleSend} className="p-8 space-y-6">
                        {status === 'success' && (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 animate-in fade-in">
                                <CheckCircle size={20} />
                                Bildirim başarıyla gönderildi!
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 animate-in fade-in">
                                <AlertTriangle size={20} />
                                Bir hata oluştu. Lütfen tekrar deneyin.
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-bold"
                                placeholder="Örn: Bahar İndirimleri Başladı!"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj İçeriği</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                placeholder="Bildirim detaylarını buraya yazın..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kitle</label>
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                            >
                                <option value="all">Tüm Kullanıcılar</option>
                                {/* Future: specific segments */}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-pink-200 flex items-center justify-center gap-2 transition-all
                            ${sending ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 hover:scale-[1.02]'}`}
                        >
                            {sending ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Bildirimi Gönder
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
