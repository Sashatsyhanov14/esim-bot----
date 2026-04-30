import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import WithdrawModal from './components/WithdrawModal';
import AdminStats from './components/AdminStats';
import AdminTariffs from './components/AdminTariffs';
import AdminFaq from './components/AdminFaq';
import ClientCatalog from './components/ClientCatalog';
import ClientFaq from './components/ClientFaq';

declare global {
  interface Window {
    Telegram: any;
  }
}

const translations = {
  ru: {
    adminTitle: "Панель Основателя",
    adminSubtitle: "Глобальная Статистика",
    overview: "Обзор проекта",
    overviewDesc: "Все пользователи и активные заказы.",
    totalUsers: "Всего владельцев",
    totalSales: "Выручка",
    manageManagers: "Управление Менеджерами",
    assignEmployee: "Назначить сотрудника",
    enterTgId: "Введите Telegram ID",
    activeEmployees: "Действующие сотрудники",
    managerAddError: "ОШИБКА: Этот пользователь еще ни разу не запускал бота! Пусть нажмет /start в боте.",
    managerAddSuccess: "Успех! ID {id} теперь {role}.",
    managerRemoveSuccess: "Сотрудник {id} удален.",
    managerAddFail: "Ошибка при добавлении.",
    ownerBadge: "Владелец",
    adminBadge: "Админ",
    managerBadge: "Менеджер",
    selectAdmin: "Админ",
    selectManager: "Менеджер",
    roleLabel: "Роль:",
    balance: "Баланс",
    invitedCount: "Приглашены",
    userTitle: "Бонусы",
    userSubtitle: "Твоя статистика",
    bonusBalance: "Твой бонусный баланс",
    withdraw: "Выплатить",
    invitedLabel: "Приглашено",
    boughtEsimLabel: "Активаций",
    inviteFriend: "Пригласить друга",
    tabReferral: "Бонусы",
    tabCatalog: "Каталог",
    tabStats: "Статистика",
    tabTariffs: "Тарифы",
    tabFaq: "FAQ",
    loginTitle: "Вход в панель",
    loginDesc: "Открыто вне Telegram. Введите свой Telegram ID для доступа.",
    loginPlaceholder: "Введите ID (например, 12345678)",
    loginBtn: "Войти",
    loading: "Загрузка данных...",
    linkCopied: "Ссылка скопирована!",
    promoTitle: "Поделись ссылкой или Промокодом:",
    promoLabel: "ПРОМОКОД",
    getQrChat: "Получить QR в чат",
    enterPromoPlaceholder: "Введите промокод (ID друга)",
    applyPromoBtn: "Применить",
    promoSuccess: "Промокод успешно применён!",
    promoError: "Неверный промокод или ошибка.",
    // Admin Tariffs
    manageTariffs: "Управление тарифами",
    addTariff: "Добавить",
    newTariff: "Новый тариф",
    editTariff: "Редактировать",
    sortNumber: "Сортировка (1, 2...)",
    country: "Страна (Turkiye, Europe)",
    traffic: "Трафик (1 Gb, unlimited)",
    validity: "Срок (7 days)",
    price: "Цена (₽)",
    qrLink: "QR ссылка (https://...)",
    paymentLink: "Ссылка на оплату (https://...)",
    isActive: "Активен",
    saveBtn: "Сохранить",
    cancelBtn: "Отмена",
    deleteConfirm: "Точно удалить тариф?",
    linkQr: "QR",
    linkPay: "Оплата",
    // Admin FAQ
    manageFaq: "Управление FAQ",
    addFaq: "Добавить",
    newFaq: "Новый FAQ",
    editFaq: "Редактировать",
    faqTopic: "Тема / Вопрос",
    faqContent: "Ответ (на русском)...",
    deleteFaqConfirm: "Точно удалить этот вопрос?",
    // Admin Stats
    tabOrders: "Заказы",
    tabUsers: "Юзеры",
    analyzing: "Анализ базы...",
    noOrders: "Нет заказов",
    invitedLabelStats: "ПРИГЛАСИЛ:",
    purchasesLabel: "ПОКУПОК:",
    spentLabel: "Потратил",
    hideAll: "Скрыть ⬆",
    showAll: "Показать все ({count}) ⬇",
    deletedTariff: "Удаленный тариф",
    unknownUser: "Неизвестный",
    statuses: {
      all: "ВСЕ",
      paid: "ОПЛАЧЕН",
      pending: "В ОЖИДАНИИ",
      awaiting_qr: "ЖДЕТ QR",
      cancelled: "ОТМЕНЕН"
    },
    commissionLabel: "комиссия",
    notePlaceholder: "Имя или заметка...",
    refDealsLabel: "СДЕЛОК ПО РЕФКЕ:",
    ownPurchasesLabel: "СВОИ ПОКУПКИ:",
    refVolumeLabel: "ОБЪ. РЕФЕРАЛОВ",
    commissionLabelAdmin: "КОМИССИЯ",
    viewRefDealsBtn: "Смотреть сделки рефералов",
    payoutBtn: "Выплатить",
    payoutHistoryLabel: "История выплат:",
    refDealsTitle: "Сделки рефералов",
    confirmPayout: "Выплатить {amount}₽ пользователю?\nБаланс будет обнулен.",
    readMore: "Читать далее",
    noFaq: "Инструкций пока нет",
    loadingFaq: "Загрузка инструкций...",
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loginInputId, setLoginInputId] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [purchasedRefsCount, setPurchasedRefsCount] = useState(0);
  const [payoutsHistory, setPayoutsHistory] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, totalOrders: 0, totalSales: 0, user: null as any });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [activeTab, setActiveTab] = useState<'referral' | 'catalog' | 'stats' | 'tariffs' | 'faq'>('catalog');

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    const init = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      let tgUser: any = null;

      // 1. Try Telegram Auth
      if (tg?.initData) {
        try {
          const resp = await fetch('/api/validate-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData })
          });
          const result = await resp.json();
          if (result.ok && result.user) {
            tgUser = result.user;
          }
        } catch (e) {
          console.error('[AUTH] Hash verification service error:', e);
        }
      }

      // 2. Try URL UID (for external web access with a link)
      if (!tgUser?.id) {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');
        if (uid && !isNaN(parseInt(uid))) {
          await fetchUserData(parseInt(uid));
          return;
        }
      }

      // 3. Fallback to initDataUnsafe
      if (!tgUser?.id) {
        for (let i = 0; i < 5; i++) {
          tgUser = tg?.initDataUnsafe?.user;
          if (tgUser?.id) break;
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (tgUser?.id) {
        await fetchUserData(tgUser.id, tgUser.first_name, tgUser.username);
        
        // Check for tab parameter in URL
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'catalog') setActiveTab('catalog');
        else if (tab === 'referral') setActiveTab('referral');
        else if (tab === 'stats') setActiveTab('stats');
        else if (tab === 'tariffs') setActiveTab('tariffs');
        else if (tab === 'faq') setActiveTab('faq');
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const t = translations.ru;

  const fetchUserData = async (tgId: number, firstName?: string, username?: string) => {
    try {
      setLoading(true);
      const { data: userData, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgId)
        .single();

      let currentUser = userData;

      if (!userData && (fetchErr?.code === 'PGRST116' || !fetchErr)) {
        // If user doesn't exist, we don't necessarily create one if it's just a web browse
        // But for Telegram WebApp, we do.
        if (window.Telegram?.WebApp?.initData) {
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            const newUser = {
              telegram_id: tgId,
              username: username || firstName || tgUser?.first_name || `user_${tgId}`,
              role: 'client',
              balance: 0
            };
            const { data: created } = await supabase.from('users').insert(newUser).select().single();
            if (created) {
              currentUser = created;
            }
        }
      }

      if (currentUser) {
        setUser(currentUser);
        if (currentUser.role === 'founder' || currentUser.role === 'manager' || currentUser.role === 'admin') {
          // If admin logs in, show stats by default if not coming for catalog
          const params = new URLSearchParams(window.location.search);
          if (!params.get('tab')) setActiveTab('stats');
        }

        const { data: refs } = await supabase
          .from('users')
          .select('telegram_id, username, created_at')
          .eq('referrer_id', tgId);

        setReferrals(refs || []);

        if (refs && refs.length > 0) {
          const refIds = refs.map((r: any) => r.telegram_id);
          const { data: orderedRefs } = await supabase
            .from('orders')
            .select('user_id')
            .in('user_id', refIds)
            .eq('status', 'paid');

          const uniqueBuyers = new Set((orderedRefs || []).map((o: any) => o.user_id));
          setPurchasedRefsCount(uniqueBuyers.size);
        }

        const { data: userPayouts } = await supabase.from('chat_history').select('content, created_at').eq('user_id', tgId).eq('role', 'assistant').like('content', 'PAYOUT_RECORD:%').order('created_at', { ascending: false });
        setPayoutsHistory(userPayouts || []);

        if (currentUser.role === 'founder' || currentUser.role === 'manager' || currentUser.role === 'admin') {
          let uCount = 0;
          let oCount = 0;
          let sumSales = 0;

          const isManagerOnly = currentUser.role === 'manager';

          if (isManagerOnly) {
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referrer_id', tgId);
            uCount = count || 0;

            const { data: refUsers } = await supabase.from('users').select('telegram_id').eq('referrer_id', tgId);
            if (refUsers && refUsers.length > 0) {
              const refIds = refUsers.map((u: any) => u.telegram_id);
              const { data: refOrders, count: refOrderCount } = await supabase.from('orders').select('price_rub', { count: 'exact' }).in('user_id', refIds).eq('status', 'paid');
              oCount = refOrderCount || 0;
              if (refOrders) {
                sumSales = refOrders.reduce((acc: number, order: any) => acc + (Number(order.price_rub) || 0), 0);
              }
            }
          } else {
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
            uCount = count || 0;
            const { data: paidOrdersList, count: totalOrderCount } = await supabase.from('orders').select('price_rub', { count: 'exact' }).eq('status', 'paid');
            oCount = totalOrderCount || 0;
            if (paidOrdersList) {
              sumSales = paidOrdersList.reduce((acc: number, order: any) => acc + (Number(order.price_rub) || 0), 0);
            }
          }

          setGlobalStats({
            totalUsers: uCount,
            totalOrders: oCount,
            totalSales: sumSales,
            user: currentUser
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'emedeoesimworld_bot';
  const refLink = user ? `https://t.me/${botUsername}?start=${user.telegram_id}` : '';

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (tg) tg.showAlert(t.linkCopied);
        else alert(t.linkCopied);
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      if (tg) tg.showAlert(t.linkCopied);
      else alert(t.linkCopied);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleManualLogin = async () => {
    if (!loginInputId) return;
    setLoading(true);
    await fetchUserData(parseInt(loginInputId));
    setShowLoginPrompt(false);
  };

  if (loading) return (
    <div className="bg-[#0f0f11] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="text-on-surface-variant font-body animate-pulse">{t.loading}</div>
        </div>
    </div>
  );

  const isAdmin = user?.role === 'founder' || user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isStaff = isAdmin || isManager;

  const renderAdminHeader = () => (
    <header className="px-6 pt-10 pb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] -z-10 -translate-x-1/2 translate-y-1/4 pointer-events-none"></div>

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm font-bold text-primary tracking-widest uppercase">{t.adminSubtitle}</p>
          <h1 className="text-3xl font-headline font-extrabold text-slate-100 flex items-center gap-2">{t.adminTitle}</h1>
        </div>
        {user && (
            <div className="bg-surface-container-high px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-300 uppercase">{user.role}</span>
            </div>
        )}
      </div>
    </header>
  );

  const renderUserHeader = () => (
    <header className="px-6 pt-10 pb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm font-bold text-secondary tracking-widest uppercase">{user ? t.userSubtitle : 'Emede eSIM'}</p>
          <h1 className="text-3xl font-headline font-extrabold text-slate-100 flex items-center gap-2">
            {activeTab === 'catalog' ? 'Магазин eSIM' : (activeTab === 'faq' ? 'Инструкции' : t.userTitle)}
          </h1>
        </div>
        {!user && activeTab !== 'catalog' && (
            <button 
                onClick={() => setShowLoginPrompt(true)}
                className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
            >
                Войти
            </button>
        )}
      </div>
    </header>
  );

  const renderAdminContent = () => {
    if (activeTab === 'tariffs') {
      return <AdminTariffs t={t} />;
    }
    if (activeTab === 'faq') {
      return isAdmin ? <AdminFaq t={t} /> : <ClientFaq />;
    }
    return <AdminStats t={t} globalStats={globalStats} />;
  };

  const handleSendQr = async () => {
    if (!user?.telegram_id) return;
    try {
      if (tg) tg.showAlert("Отправляем QR в чат...");
      await fetch('/api/send-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: user.telegram_id })
      });
      if (tg) tg.close();
    } catch (err) {
      if (tg) tg.showAlert("Ошибка отправки QR");
      else alert("Ошибка отправки QR");
    }
  };

  const renderUserContent = () => {
    if (activeTab === 'catalog') {
        const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || user?.telegram_id || null;
        return <ClientCatalog telegramId={uid} />;
    }
    if (activeTab === 'faq') {
        return <ClientFaq />;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">lock</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Требуется вход</h2>
                    <p className="text-on-surface-variant text-sm max-w-[250px]">Войдите через Telegram, чтобы видеть свою статистику и бонусы.</p>
                </div>
                <button 
                    onClick={() => setShowLoginPrompt(true)}
                    className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
                >
                    Войти в систему
                </button>
            </div>
        );
    }

    return (
    <div className="space-y-6">
      <div className="bg-[#201f22] p-6 rounded-[2rem] relative overflow-hidden flex flex-col items-center text-center border border-white/5 mx-2 shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[40px] -z-10"></div>
        <div className="w-16 h-16 bg-secondary-container/20 border border-secondary/20 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-secondary text-3xl">account_balance_wallet</span>
        </div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{t.bonusBalance}</p>
        <h2 className="text-5xl font-headline font-extrabold text-slate-100 mb-4">{user?.balance?.toFixed(0) || '0'}₽</h2>
        {(user?.balance || 0) > 0 && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary/20 text-primary border border-primary/30 px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-all hover:bg-primary/30"
          >
            {t.withdraw}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mx-2">
        <div className="bg-surface-container-low p-5 rounded-3xl flex flex-col justify-between min-h-[120px] border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]">group_add</span>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{t.invitedLabel}</p>
          </div>
          <span className="text-3xl font-headline font-extrabold text-slate-200">{referrals.length}</span>
        </div>

        <div className="bg-surface-container-low p-5 rounded-3xl flex flex-col justify-between min-h-[120px] border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-secondary/10 p-2 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[20px]">shopping_bag</span>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{t.boughtEsimLabel}</p>
          </div>
          <span className="text-3xl font-headline font-extrabold text-slate-200">{purchasedRefsCount}</span>
        </div>
      </div>

      {payoutsHistory.length > 0 && (
        <div className="glass-card p-6 rounded-[2rem] mx-2 border border-white/5">
            <h3 className="text-sm font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">history</span>
              История выплат
            </h3>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto clean-scrollbar pr-2">
              {payoutsHistory.map((p, idx) => (
                   <div key={idx} className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10">
                       <div className="flex flex-col gap-0.5">
                           <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">{new Date(p.created_at).toLocaleDateString()}</span>
                           <span className="text-xs text-on-surface-variant/60">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       <span className="font-bold text-green-400 text-lg">+{Number(p.content.split(':')[1]).toFixed(0)}₽</span>
                   </div>
              ))}
            </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-[2rem] mx-2 border border-primary/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <h3 className="text-xl font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
          {t.inviteFriend}
        </h3>
        <p className="text-sm font-medium text-on-surface-variant mb-6">{t.promoTitle}</p>

        <div className="space-y-4">
          <div 
            onClick={() => copyToClipboard(refLink)}
            className="flex items-center gap-2 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-all min-h-[56px] group"
          >
            <input
              type="text"
              readOnly
              value={refLink}
              className="flex-1 bg-transparent text-sm text-on-surface outline-none px-2 font-mono cursor-pointer"
            />
            <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">content_copy</span>
          </div>
          <div 
            onClick={() => copyToClipboard(String(user?.telegram_id))}
            className="flex items-center gap-2 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-all min-h-[56px] group"
          >
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-3 border-r border-outline-variant/10 mr-1">{t.promoLabel}</span>
            <input
              type="text"
              readOnly
              value={user?.telegram_id || ''}
              className="flex-1 bg-transparent font-bold text-primary outline-none px-2 font-mono text-lg cursor-pointer"
            />
            <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">content_copy</span>
          </div>
        </div>

        <div className="mt-8 border-t border-outline-variant/10 pt-8 flex flex-col items-center pb-2">
          <div className="bg-white p-4 rounded-3xl w-fit mx-auto relative group shadow-[0_10px_40px_rgba(0,0,0,0.3)] mb-6">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(refLink)}`}
              alt="QR Code"
              width={180}
              height={180}
              className="rounded-2xl block"
            />
            <div className="absolute inset-0 bg-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <button
            onClick={handleSendQr}
            className="w-full bg-primary/20 text-primary border border-primary/30 py-4 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-primary/30"
          >
            <span className="material-symbols-outlined text-[22px]">send_to_mobile</span>
            {t.getQrChat}
          </button>
        </div>
      </div>
    </div>
    );
  };

  const isManagerTab = ['stats', 'tariffs', 'faq'].includes(activeTab);

  return (
    <div className="bg-[#0f0f11] min-h-screen text-slate-100 selection:bg-primary/30">
      {isStaff && isManagerTab ? renderAdminHeader() : renderUserHeader()}
      
      <main className="px-4 pt-2 space-y-8 max-w-2xl mx-auto pb-32">
        {isStaff && isManagerTab ? renderAdminContent() : renderUserContent()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50 flex justify-around items-center px-4 py-3 bg-[#1a1a1e]/90 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center p-2 rounded-2xl transition-all w-full max-w-[80px] ${activeTab === 'catalog' ? 'text-primary' : 'text-on-surface-variant hover:text-slate-100'}`}
        >
          <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'catalog' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'catalog' ? "\'FILL\' 1" : "\'FILL\' 0" }}>storefront</span>
          </div>
          <span className="font-['Inter'] text-[8px] font-extrabold uppercase tracking-widest">{t.tabCatalog}</span>
        </button>

        <button
          onClick={() => setActiveTab('referral')}
          className={`flex flex-col items-center p-2 rounded-2xl transition-all w-full max-w-[80px] ${activeTab === 'referral' ? 'text-secondary' : 'text-on-surface-variant hover:text-slate-100'}`}
        >
          <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'referral' ? 'bg-secondary/10' : ''}`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'referral' ? "\'FILL\' 1" : "\'FILL\' 0" }}>group</span>
          </div>
          <span className="font-['Inter'] text-[8px] font-extrabold uppercase tracking-widest">{t.tabReferral}</span>
        </button>

        {isStaff && (
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all w-full max-w-[80px] ${activeTab === 'stats' ? 'text-primary' : 'text-on-surface-variant hover:text-slate-100'}`}
          >
            <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'stats' ? 'bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'stats' ? "\'FILL\' 1" : "\'FILL\' 0" }}>bar_chart</span>
            </div>
            <span className="font-['Inter'] text-[8px] font-extrabold uppercase tracking-widest">{t.tabStats}</span>
          </button>
        )}

        {isAdmin && (
            <button
              onClick={() => setActiveTab('tariffs')}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all w-full max-w-[80px] ${activeTab === 'tariffs' ? 'text-primary' : 'text-on-surface-variant hover:text-slate-100'}`}
            >
              <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'tariffs' ? 'bg-primary/10' : ''}`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'tariffs' ? "\'FILL\' 1" : "\'FILL\' 0" }}>sell</span>
              </div>
              <span className="font-['Inter'] text-[8px] font-extrabold uppercase tracking-widest">{t.tabTariffs}</span>
            </button>
        )}

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex flex-col items-center p-2 rounded-2xl transition-all w-full max-w-[80px] ${activeTab === 'faq' ? (isStaff && isManagerTab ? 'text-primary' : 'text-secondary') : 'text-on-surface-variant hover:text-slate-100'}`}
        >
          <div className={`p-1.5 rounded-xl mb-1 transition-all ${activeTab === 'faq' ? (isStaff && isManagerTab ? 'bg-primary/10' : 'bg-secondary/10') : ''}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'faq' ? "\'FILL\' 1" : "\'FILL\' 0" }}>help</span>
          </div>
          <span className="font-['Inter'] text-[8px] font-extrabold uppercase tracking-widest">{t.tabFaq}</span>
        </button>
      </nav>

      {/* Login Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-card p-8 rounded-[2.5rem] w-full max-w-sm space-y-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -z-10"></div>
                <button 
                    onClick={() => setShowLoginPrompt(false)}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-slate-100 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-primary-container/20 border border-primary/20 rounded-full mx-auto flex items-center justify-center mb-6 neon-glow">
                        <span className="material-symbols-outlined text-primary text-4xl">login</span>
                    </div>
                    <h1 className="text-3xl font-headline font-bold text-slate-100">{t.loginTitle}</h1>
                    <p className="text-sm font-body text-on-surface-variant px-4">{t.loginDesc}</p>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <input
                        type="number"
                        value={loginInputId}
                        onChange={(e) => setLoginInputId(e.target.value)}
                        placeholder={t.loginPlaceholder}
                        className="w-full bg-[#131315] border border-outline-variant/20 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary/50 text-center font-mono text-lg shadow-inner"
                        />
                    </div>
                    <button
                        onClick={handleManualLogin}
                        className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold shadow-[0_10px_20px_rgba(208,188,255,0.2)] hover:bg-primary/90 transition-all active:scale-95"
                    >
                        {t.loginBtn}
                    </button>
                </div>
                <p className="text-[10px] text-center text-on-surface-variant/40 uppercase tracking-widest">
                    Введите ID из вашего профиля в боте
                </p>
            </div>
        </div>
      )}

      <WithdrawModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        balance={user?.balance || 0}
        telegramId={user?.telegram_id}
      />
    </div>
  );
};

export default App;
