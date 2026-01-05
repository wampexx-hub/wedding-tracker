import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, List, Heart, LogOut, Edit3, Calendar, Wallet, CheckCircle, Coins, TrendingUp, HelpCircle, PlayCircle, Users, Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import FloatingAddExpense from './FloatingAddExpense';
import WeddingService from '../services/WeddingService';
import { useNavigate } from 'react-router-dom';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import NotificationPanel from './NotificationPanel';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { getSummary, updateBudget, assets, rates, refreshTrigger, budget, portfolioValue, expenses } = useExpenses();
  const [summary, setSummary] = useState(getSummary());
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempDate] = useState(summary.budget);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (user?.username) {
      try {
        const response = await fetch(`/api/notifications?user=${user.username}`);
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Mark notification as read
  const markNotificationAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      // Update local state
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Update summary when budget, portfolio, expenses, or refreshTrigger changes
  useEffect(() => {
    const newSummary = getSummary();
    setSummary(newSummary);
    setTempDate(newSummary.budget);
  }, [refreshTrigger, budget, portfolioValue, expenses]);

  // Fetch Pending Invites
  useEffect(() => {
    const fetchInvites = async () => {
      if (user?.username) {
        const invites = await WeddingService.getPendingPartnerships(user.username);
        setPendingInvites(invites || []);
      }
    };
    fetchInvites();
  }, [user]);

  // Socket Listeners for Partnership
  const { socket } = useExpenses();
  useEffect(() => {
    if (!socket) return;

    const handleRequest = (data) => {
      // Refresh pending invites
      const fetchInvites = async () => {
        if (user?.username) {
          const invites = await WeddingService.getPendingPartnerships(user.username);
          setPendingInvites(invites || []);
        }
      };
      fetchInvites();

      // Show toast if possible, otherwise rely on the NotificationCard appearing
      // For now, we rely on the bell icon/notification area update
    };

    const handleEnded = (data) => {
      alert(data.message || 'Ortaklık sonlandırıldı.');
      window.location.reload(); // Reload to refresh all data effectively and reset state
    };

    // Removed admin_notification Socket.io listener - now using database polling

    socket.on('partnership:invited', handleRequest);
    socket.on('partnership:ended', handleEnded);

    return () => {
      socket.off('partnership:invited', handleRequest);
      socket.off('partnership:ended', handleEnded);
    };
  }, [socket, user]);

  // Tour Logic
  const startDashboardTour = (force = false) => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');

    if (!hasSeenTour || force) {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: "Tamamla",
        nextBtnText: "İleri",
        prevBtnText: "Geri",
        progressText: "{{current}} / {{total}}",
        steps: [
          {
            element: '#root',
            popover: {
              title: 'Hoş Geldin! 👋',
              description: "Düğün Bütçem'e hoş geldin! Büyük gün yaklaşıyor, hesap kitap işlerini bize bırak. Seni 1 dakikada sisteme alıştıralım mı?",
              side: "center",
              align: 'center'
            }
          },
          {
            element: window.innerWidth < 768 ? '#mobile-nav-dashboard' : '#tour-nav-dashboard',
            popover: {
              title: 'Durum Kontrolü 📊',
              description: 'Büyük resmi buradan görebilirsin. Toplam bütçen ne durumda, ne kadar harcadın, hepsi bu ekranda özetlenir.',
              side: window.innerWidth < 768 ? "top" : "right",
              align: 'center'
            }
          },
          {
            element: window.innerWidth < 768 ? '#mobile-nav-currency' : '#tour-nav-currency',
            popover: {
              title: 'Varlıklarını Yönet 💰',
              description: 'Yastık altındaki altınları veya döviz hesabını buraya ekle. Biz senin için güncel kurlarla toplam varlığını anlık hesaplayalım.',
              side: window.innerWidth < 768 ? "top" : "right",
              align: 'center'
            }
          },
          {
            element: window.innerWidth < 768 ? '#mobile-nav-expenses' : '#tour-nav-expenses',
            popover: {
              title: 'Planlama Zamanı 🚀',
              description: 'Hadi şimdi asıl sihrin olduğu yere, harcamalarını planlayacağın sayfaya gidelim. Orada seni bir sürpriz bekliyor!',
              side: window.innerWidth < 768 ? "top" : "right",
              align: 'center',
              nextBtnText: 'Gidelim'
            },
            onNextClick: () => {
              // The Bridge Logic
              localStorage.setItem('tour_step', 'phase2');
              setActiveTab('expenses');
              driverObj.destroy();
            }
          }
        ],
        onDestroyed: () => {
          // Only mark as seen if we are NOT transitioning to phase 2
          if (localStorage.getItem('tour_step') !== 'phase2') {
            localStorage.setItem('hasSeenTour', 'true');
          }
        },
        popoverClass: 'driverjs-theme',
        opacity: 0.7 // Darker overlay
      });

      setTimeout(() => {
        driverObj.drive();
      }, force ? 100 : 1500);
    }
  };

  const startExpensesTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      doneBtnText: "Tur'u Bitir 🏁",
      nextBtnText: "İleri",
      prevBtnText: "Geri",
      progressText: "{{current}} / {{total}}",
      steps: [
        {
          element: '#tour-magic-list',
          popover: {
            title: 'Sihirli Liste ✨',
            description: 'Nereden başlayacağını bilmiyor musun? Tek tıkla gelinlikten beyaz eşyaya, en popüler ihtiyaç listesini senin için oluşturalım.',
            side: "bottom",
            align: 'start'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('hasSeenTour', 'true');
        localStorage.removeItem('tour_step');
      },
      popoverClass: 'driverjs-theme',
      opacity: 0.7
    });

    setTimeout(() => {
      driverObj.drive();
    }, 500);
  };

  // Auto-start tour logic - ONLY for first-time users
  useEffect(() => {
    // Check if user has already seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenTour');

    // Only run tour for NEW users
    if (!hasSeenTour) {
      // Check for Phase 2 (Expenses Page Resume)
      const activePhase = localStorage.getItem('tour_step');
      if (activePhase === 'phase2' && activeTab === 'expenses') {
        startExpensesTour();
      }
      // Check for Phase 1 (Initial Start)
      else if (activeTab === 'dashboard') {
        startDashboardTour(false);
      }
    }
    // ELSE: Returning user - no delay, UI is instantly clickable!
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'expenses', label: 'Harcamalar', icon: List },
    { id: 'currency', label: 'Birikimler', icon: Wallet },
    { id: 'calendar', label: 'Taksit Takvimi', icon: Calendar },
    { id: 'partner', label: 'Çift Ayarları', icon: Users },
  ];

  const handleBudgetSave = () => {
    updateBudget(tempBudget);
    setIsEditingBudget(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Calculate Asset Totals by Name for Sidebar
  const getAssetDetails = () => {
    if (!assets || !Array.isArray(assets)) return [];

    const details = {};

    assets.forEach(asset => {
      let value = 0;
      if (asset.category === 'Nakit') {
        value = asset.amount;
      } else if (rates) {
        const rate = rates[asset.type] || 0;
        value = asset.amount * rate;
      }

      if (!details[asset.name]) {
        details[asset.name] = {
          name: asset.name,
          totalValue: 0,
          category: asset.category
        };
      }
      details[asset.name].totalValue += value;
    });

    return Object.values(details).sort((a, b) => b.totalValue - a.totalValue);
  };

  const assetDetails = getAssetDetails();

  // Notification Component (UntitledUI Style)
  const NotificationCard = ({ invite }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setPendingInvites(prev => prev.filter(i => i.id !== invite.id))} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-3">
        <div className="mt-1">
          <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 ring-4 ring-yellow-50/50">
            <Bell size={14} />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1">Yeni Davet</h4>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            <span className="font-medium text-gray-900">{invite.inviterName}</span> seni partneri olarak eklemek istiyor.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('partner');
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-medium rounded-lg transition-colors shadow-sm"
            >
              Görüntüle
            </button>
            <button
              onClick={() => setPendingInvites(prev => prev.filter(i => i.id !== invite.id))}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-800 text-[10px] font-medium rounded-lg transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]" >
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 z-[100]
        w-[280px] bg-white border-r border-gray-100
        transform transition-transform duration-300 ease-in-out
        h-dvh max-h-dvh
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 pb-0">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Heart className="text-white fill-white" size={20} />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight">Düğün Bütçem</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{user?.name || user?.username || 'Premium Planner'}</p>
              </div>
            </div>

            {/* NEW CTA BUTTON */}
            <button
              id="tour-add-expense"
              onClick={() => {
                setActiveTab('add');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-8 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <PlusCircle size={20} className="text-white" />
              <span className="font-bold">Harcama Ekle</span>
            </button>

            {/* Budget Display */}
            <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Toplam Bütçe</p>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                    {summary.budget.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                  </h3>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${summary.remaining < 0 ? 'bg-red-500' : 'bg-champagne'
                    }`}
                  style={{ width: `${Math.min((summary.totalSpent / summary.budget) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Harcanan</span>
                <span className="font-medium text-gray-700">
                  {summary.totalSpent.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 mb-8">
              {navItems.map(item => (
                <div key={item.id} className="relative">
                  <button
                    id={`tour-nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                      setIsFabOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                      ${activeTab === item.id
                        ? 'bg-champagne/10 text-champagne font-medium shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? 'text-champagne' : 'text-gray-400 group-hover:text-gray-600'} />
                    {item.label}
                    {item.id === 'partner' && pendingInvites.length > 0 && (
                      <span className="absolute right-3 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                        {pendingInvites.length}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </nav>
          </div>

          {/* Sticky Bottom: Notification & Tour & Logout */}
          <div className="p-4 border-t border-gray-100 pb-safe space-y-2">
            {/* Desktop Notification (Sidebar) */}
            {pendingInvites.length > 0 && (
              <div className="mb-4 animate-in slide-in-from-bottom-5 duration-500">
                <NotificationCard invite={pendingInvites[0]} />
              </div>
            )}

            {/* Notification Bell Button */}
            <button
              onClick={() => {
                setShowNotificationPanel(true);
                fetchNotifications(); // Refresh on open
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group relative"
            >
              <Bell size={20} className="group-hover:text-gray-600" />
              Bildirimler
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute right-3 min-w-[20px] h-5 flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full px-1.5 animate-pulse shadow-sm">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => startDashboardTour(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
            >
              <HelpCircle size={20} className="group-hover:text-gray-600" />
              Turu Tekrarla
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut size={20} className="group-hover:text-red-600" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 flex flex-col h-screen overflow-hidden">
        <div id="main-content" className="flex-1 w-full overflow-y-auto">
          <div className="p-4 md:p-8 pb-32 md:pb-8 max-w-[1600px] mx-auto w-full">
            {/* Mobile Notification */}
            {pendingInvites.length > 0 && (
              <div className="lg:hidden mb-6 animate-in slide-in-from-top-5 duration-500">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 items-start">
                  <div className="p-2 bg-yellow-50 rounded-full text-yellow-600 shrink-0">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Davetin Var! ✨</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-medium text-gray-900">{pendingInvites[0].inviterName}</span> seni düğün planına eklemek istiyor.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('partner')}
                        className="px-4 py-2 bg-yellow-500 text-white text-xs font-medium rounded-lg shadow-sm w-full"
                      >
                        İncele
                      </button>
                      <button
                        onClick={() => setPendingInvites(prev => prev.filter(i => i.id !== pendingInvites[0].id))}
                        className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg w-full"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Header */}
            <div className="lg:hidden flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-champagne to-champagne-dark rounded-lg flex items-center justify-center shadow-md">
                  <Heart className="text-white fill-white" size={16} />
                </div>
                <span className="font-serif text-lg font-bold text-gray-900">Düğün Bütçem</span>
              </div>

              {/* Quick Actions (Mobile Only) */}
              <div className="flex items-center gap-3">
                {/* Restart Tour */}
                <button
                  onClick={() => startDashboardTour(true)}
                  className="p-2 text-gray-400 hover:text-yellow-600 transition-colors rounded-lg hover:bg-yellow-50"
                  title="Turu Yeniden Başlat"
                >
                  <PlayCircle size={20} />
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  title="Çıkış Yap"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* Notification Panel Overlay */}
      {showNotificationPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[140]"
            onClick={() => setShowNotificationPanel(false)}
          />
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotificationPanel(false)}
            onMarkAsRead={markNotificationAsRead}
            onRefresh={fetchNotifications}
          />
        </>
      )}

      {/* Floating Add Expense Button - Controlled */}
      <FloatingAddExpense
        isOpen={isFabOpen}
        onClose={() => setIsFabOpen(false)}
        onOpen={() => setIsFabOpen(true)}
        showButton={true}
      />

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-end p-2 pb-safe z-[90] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* First 2 items */}
        {navItems.slice(0, 2).map(item => (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => {
              setActiveTab(item.id);
              setIsFabOpen(false);
              document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setActiveTab(item.id);
              setIsFabOpen(false);
              document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`pointer-events-auto flex flex-col items-center gap-1 p-2 rounded-lg transition-colors flex-1
              ${activeTab === item.id ? 'text-champagne' : 'text-gray-400'}`}
            style={{ touchAction: 'manipulation' }}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.id === 'partner' && pendingInvites.length > 0 && (
              <span className="absolute top-2 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        ))}

        {/* Center FAB */}
        <button
          id="mobile-fab-add"
          onClick={(e) => {
            // Only trigger if not already handled by touch
            if (e.detail !== 0) {
              setIsFabOpen(prev => !prev);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsFabOpen(prev => !prev);
          }}
          className="pointer-events-auto relative -top-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 active:scale-95 flex flex-col items-center justify-center gap-1 border-4 border-[#FDFBF7]"
          style={{ touchAction: 'manipulation' }}
        >
          <PlusCircle size={28} className="text-white" />
        </button>

        {/* Last 2 items */}
        {navItems.slice(2).map(item => (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => {
              setActiveTab(item.id);
              setIsFabOpen(false);
              document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setActiveTab(item.id);
              setIsFabOpen(false);
              document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`pointer-events-auto flex flex-col items-center gap-1 p-2 rounded-lg transition-colors flex-1
              ${activeTab === item.id ? 'text-champagne' : 'text-gray-400'}`}
            style={{ touchAction: 'manipulation' }}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.id === 'partner' && pendingInvites.length > 0 && (
              <span className="absolute top-2 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
        ))}
      </div>
    </div >
  );
};

export default Layout;
