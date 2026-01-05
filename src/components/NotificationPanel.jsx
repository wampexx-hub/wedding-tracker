import React from 'react';
import { X, Bell } from 'lucide-react';

const NotificationPanel = ({ notifications, onClose, onMarkAsRead, onRefresh }) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    const getRelativeTime = (timestamp) => {
        const date = new Date(timestamp);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'Az önce';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} dakika önce`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} saat önce`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[150] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Bildirimler</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{unreadCount} okunmamış</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Henüz bildirim yok</p>
                        <p className="text-xs text-gray-400 mt-1">Yeni bildirimler burada görünecek</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-pink-50/30' : ''
                                    }`}
                                onClick={() => onMarkAsRead(notif.id)}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        <div className={`w-2 h-2 rounded-full ${!notif.read ? 'bg-pink-500' : 'bg-transparent'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{notif.title}</h4>
                                        <p className="text-xs text-gray-600 mb-2 break-words whitespace-pre-wrap">{notif.message}</p>
                                        <p className="text-[10px] text-gray-400">{getRelativeTime(notif.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
