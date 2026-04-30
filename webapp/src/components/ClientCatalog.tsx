import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Tariff {
    id: string;
    sort_number: number;
    country: string;
    data_gb: string;
    validity_period: string;
    price_rub: number;
    is_active: boolean;
    payment_link?: string;
    payment_qr_url?: string;
}

export default function ClientCatalog({ telegramId }: { telegramId?: string | null }) {
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [buyLoading, setBuyLoading] = useState<string | null>(null);

    const [checkoutModal, setCheckoutModal] = useState<Tariff | null>(null);
    const [contactInfo, setContactInfo] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const tg = window.Telegram?.WebApp;

    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        setLoading(true);
        const { data } = await supabase.from('tariffs').select('*').eq('is_active', true).order('sort_number', { ascending: true });
        if (data) {
            // Clean up names during fetch
            const clean = data.map(t => ({ ...t, country: t.country?.trim() || 'Unknown' }));
            setTariffs(clean);
        }
        setLoading(false);
    };

    const [paymentQrModal, setPaymentQrModal] = useState<Tariff | null>(null);

    const processPurchase = async (tData: Tariff, contact?: string) => {
        try {
            if (telegramId) {
                // User is in Telegram
                try {
                    await fetch('/api/catalog-buy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ telegramId, tariffId: tData.id })
                    });
                } catch (apiErr) {
                    console.error('API Buy Error:', apiErr);
                }
            } else if (contact) {
                // Web user with contact info
                try {
                    await fetch('/api/web-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contact, tariffId: tData.id })
                    });
                } catch (apiErr) {
                    console.error('API Web Order Error:', apiErr);
                }
            }

            if (tData.payment_qr_url) {
                setPaymentQrModal(tData);
                return;
            }

            const successMsg = `✅ Заказ на ${tData.country} (${tData.data_gb}) принят!\n\nСейчас вы будете перенаправлены на оплату.`;

            if (tg) {
                tg.showAlert(successMsg + ' После оплаты мы вышлем вам данные eSIM в Telegram.');
                if (tData.payment_link) {
                    tg.openLink(tData.payment_link);
                } else {
                    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'emedeoesimworld_bot';
                    tg.openTelegramLink(`https://t.me/${botUsername}`);
                    tg.close();
                }
            } else {
                if (tData.payment_link) {
                    window.location.href = tData.payment_link;
                } else {
                    alert(successMsg + ' Перейдите в нашего бота для получения eSIM.');
                    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'emedeoesimworld_bot';
                    window.open(`https://t.me/${botUsername}`, '_blank');
                }
            }
        } catch (e) {
            console.error(e);
            alert('Произошла ошибка при оформлении заказа. Мы перенаправим вас в бот для ручного оформления.');
            const botUsername = import.meta.env.VITE_BOT_USERNAME || 'emedeoesimworld_bot';
            if (tg) tg.openTelegramLink(`https://t.me/${botUsername}`);
            else window.open(`https://t.me/${botUsername}`, '_blank');
        }
    };

    const renderCheckoutModal = () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left">
            <div className="bg-[#1a1a1e] w-full max-w-sm rounded-[2rem] p-6 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                
                <h3 className="text-xl font-headline font-bold text-slate-100 mb-2">Оформление заказа</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                    Введите ваш Telegram (например, <b>@username</b>) или номер телефона. Туда мы отправим данные для активации eSIM после оплаты.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
                            Контакт для связи
                        </label>
                        <input
                            type="text"
                            placeholder="@username или +7 999 000 0000"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setCheckoutModal(null)}
                            className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95 text-sm"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleSubmitCheckout}
                            disabled={submitLoading || !contactInfo.trim()}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg text-sm flex items-center justify-center"
                        >
                            {submitLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "К оплате"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPaymentQrModal = () => {
        if (!paymentQrModal) return null;
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-center">
                <div className="bg-[#1a1a1e] w-full max-w-sm rounded-[2rem] p-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                    
                    <h3 className="text-xl font-headline font-bold text-slate-100 mb-2">Оплата по QR</h3>
                    <p className="text-sm text-on-surface-variant mb-6">
                        Отсканируйте код или сохраните его для оплаты. К оплате: <b>₽{paymentQrModal.price_rub}</b>
                    </p>

                    <div className="bg-white p-4 rounded-3xl w-fit mx-auto shadow-[0_10px_40px_rgba(0,0,0,0.3)] mb-6">
                        <img
                            src={paymentQrModal.payment_qr_url}
                            alt="Payment QR"
                            className="w-48 h-48 object-contain rounded-2xl block"
                        />
                    </div>

                    <div className="space-y-3 w-full">
                        <button 
                            onClick={() => {
                                setPaymentQrModal(null);
                                alert("Ожидаем подтверждения платежа! Менеджер скоро свяжется с вами.");
                            }}
                            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(208,188,255,0.2)] hover:bg-primary/90 active:scale-95 transition-all outline-none"
                        >
                            Я ОПЛАТИЛ
                        </button>
                        <button 
                            onClick={() => setPaymentQrModal(null)}
                            className="w-full py-3.5 rounded-xl font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95 text-sm"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleBuy = async (tData: Tariff) => {
        if (!telegramId) {
            // Not in Telegram, show checkout modal
            setCheckoutModal(tData);
            return;
        }

        setBuyLoading(tData.id);
        await processPurchase(tData);
        setBuyLoading(null);
    };

    const handleSubmitCheckout = async () => {
        if (!contactInfo.trim()) return;
        if (!checkoutModal) return;

        setSubmitLoading(true);
        await processPurchase(checkoutModal, contactInfo);
        setSubmitLoading(false);
        setCheckoutModal(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-on-surface-variant font-medium">Загрузка тарифов...</p>
            </div>
        );
    }

    // Group by country (hard-coded Russian-first)
    const grouped = tariffs.reduce((acc: Record<string, Tariff[]>, tariff) => {
        const c = tariff.country?.trim() || 'Unknown';
        if (!acc[c]) acc[c] = [];
        acc[c].push(tariff);
        return acc;
    }, {});

    const countries = Object.keys(grouped).filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const getFlagData = (countryName: string) => {
        if (!countryName) return { emoji: '🏳️', code: '' };
        const c = countryName.toLowerCase();
        
        if (c.includes('euro') || c.includes('евро')) return { emoji: '🇪🇺', code: 'eu' };
        if (c.includes('uk') || c.includes('united kingdom') || c.includes('brit') || c.includes('британ') || c.includes('англия')) return { emoji: '🇬🇧', code: 'gb' };
        if (c.includes('france') || c.includes('франц')) return { emoji: '🇫🇷', code: 'fr' };
        if (c.includes('ital') || c.includes('итал')) return { emoji: '🇮🇹', code: 'it' };
        if (c.includes('spain') || c.includes('испан')) return { emoji: '🇪🇸', code: 'es' };
        if (c.includes('germany') || c.includes('герман')) return { emoji: '🇩🇪', code: 'de' };
        if (c.includes('global') || c.includes('глобал') || c.includes('world') || c.includes('мир')) return { emoji: '🌎', code: 'un' };
        if (c.includes('asia') || c.includes('азия')) return { emoji: '🌏', code: 'un' };
        if (c.includes('africa') || c.includes('африка')) return { emoji: '🌍', code: 'un' };
        if (c.includes('turk') || c.includes('турц') || c.includes('türkiye') || c.includes('alanya') || c.includes('antalya') || c.includes('istanbul')) return { emoji: '🇹🇷', code: 'tr' };
        if (c.includes('usa') || c.includes('сша')) return { emoji: '🇺🇸', code: 'us' };
        if (c.includes('thai') || c.includes('таил')) return { emoji: '🇹🇭', code: 'th' };
        if (c.includes('viet') || c.includes('вьет')) return { emoji: '🇻🇳', code: 'vn' };
        if (c.includes('isra') || c.includes('изра')) return { emoji: '🇮🇱', code: 'il' };
        if (c.includes('emir') || c.includes('оаэ') || c.includes('dubai') || c.includes('uae')) return { emoji: '🇦🇪', code: 'ae' };
        if (c.includes('egypt') || c.includes('егип')) return { emoji: '🇪🇬', code: 'eg' };
        if (c.includes('georg') || c.includes('груз')) return { emoji: '🇬🇪', code: 'ge' };
        if (c.includes('armen') || c.includes('армен')) return { emoji: '🇦🇲', code: 'am' };
        if (c.includes('kazak') || c.includes('казак')) return { emoji: '🇰🇿', code: 'kz' };
        if (c.includes('azer') || c.includes('азер')) return { emoji: '🇦🇿', code: 'az' };
        if (c.includes('uzbek') || c.includes('узбек')) return { emoji: '🇺🇿', code: 'uz' };
        if (c.includes('chin') || c.includes('кит')) return { emoji: '🇨🇳', code: 'cn' };
        if (c.includes('kore') || c.includes('коре')) return { emoji: '🇰🇷', code: 'kr' };
        if (c.includes('jap') || c.includes('яп')) return { emoji: '🇯🇵', code: 'jp' };
        if (c.includes('monten') || c.includes('черног')) return { emoji: '🇲🇪', code: 'me' };
        if (c.includes('serb') || c.includes('серб')) return { emoji: '🇷🇸', code: 'rs' };
        if (c.includes('greece') || c.includes('греци')) return { emoji: '🇬🇷', code: 'gr' };
        if (c.includes('poland') || c.includes('польш')) return { emoji: '🇵🇱', code: 'pl' };
        if (c.includes('baltic') || c.includes('балти')) return { emoji: '🇪🇪', code: 'ee' };
        if (c.includes('swiss') || c.includes('швейц')) return { emoji: '🇨🇭', code: 'ch' };
        if (c.includes('indones') || c.includes('индонез')) return { emoji: '🇮🇩', code: 'id' };
        if (c.includes('malays') || c.includes('малайз')) return { emoji: '🇲🇾', code: 'my' };
        if (c.includes('saudi') || c.includes('сауд')) return { emoji: '🇸🇦', code: 'sa' };
        if (c.includes('russia') || c.includes('россия') || c.includes('рф')) return { emoji: '🇷🇺', code: 'ru' };
        if (c.includes('ukraine') || c.includes('украин')) return { emoji: '🇺🇦', code: 'ua' };
        return { emoji: '🏳️', code: '' };
    };

    const FlagIcon = ({ country, size = "md" }: { country: string | null, size?: "sm" | "md" | "lg" }) => {
        if (!country) return null;
        const data = getFlagData(country);
        const sizePx = size === "lg" ? "80" : (size === "md" ? "40" : "20");
        const flagCode = data.code || 'un';
        
        return (
            <img 
                src={`https://flagcdn.com/w${sizePx}/${flagCode}.png`} 
                alt={country}
                className={`${size === "lg" ? "w-8 h-5" : "w-6 h-4"} object-cover rounded-[2px] shadow-sm border border-white/5`}
                onError={(e) => {
                    (e.target as any).style.display = 'none';
                    const span = document.createElement('span');
                    span.innerText = data.emoji;
                    span.className = size === "lg" ? "text-3xl" : "text-xl";
                    (e.target as any).parentNode.appendChild(span);
                }}
            />
        );
    };

    if (selectedCountry) {
        const countryTariffs = grouped[selectedCountry] || [];
        return (
            <>
            <div className="space-y-4 animate-fade-in pb-8">
                <button 
                    onClick={() => setSelectedCountry(null)}
                    className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold bg-surface-container p-2 rounded-xl border border-white/5 w-fit"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Назад
                </button>
                
                <h2 className="text-2xl font-headline font-extrabold text-slate-100 flex items-center gap-3 mb-4">
                    <FlagIcon country={selectedCountry} size="lg" />
                    {selectedCountry}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {countryTariffs.map(tData => (
                        <div key={tData.id} className="glass-card p-5 rounded-2xl relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -z-10 translate-x-1/3 -translate-y-1/3 transition-all group-hover:bg-primary/20 pointer-events-none"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-headline font-bold text-slate-100 text-lg">{tData.country}</h3>
                                <span className="text-2xl font-extrabold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]">
                                    ₽{tData.price_rub}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-surface-container-lowest/50 p-3 rounded-xl border border-outline-variant/10 flex items-center gap-3">
                                    <div className="bg-primary/10 p-1.5 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-[18px]">wifi</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-on-surface-variant font-extrabold tracking-wider uppercase">Трафик</span>
                                        <span className="text-slate-100 font-bold">{tData.data_gb}</span>
                                    </div>
                                </div>
                                <div className="bg-surface-container-lowest/50 p-3 rounded-xl border border-outline-variant/10 flex items-center gap-3">
                                    <div className="bg-secondary/10 p-1.5 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-secondary text-[18px]">schedule</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-on-surface-variant font-extrabold tracking-wider uppercase">Срок</span>
                                        <span className="text-slate-100 font-bold">{tData.validity_period}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleBuy(tData)}
                                disabled={buyLoading === tData.id}
                                className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(208,188,255,0.2)] hover:bg-primary/90 active:scale-95 transition-all outline-none disabled:opacity-70 disabled:active:scale-100"
                            >
                                {buyLoading === tData.id ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                                        КУПИТЬ
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {checkoutModal && renderCheckoutModal()}
            {paymentQrModal && renderPaymentQrModal()}
            </>
        );
    }

    return (
        <>
        <div className="space-y-5 animate-fade-in pb-8">
            <h2 className="text-3xl font-headline font-extrabold text-slate-100 flex items-center gap-3 ml-2">
                <span className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(208,188,255,0.2)]">
                    <span className="material-symbols-outlined text-primary text-[24px]">storefront</span>
                </span>
                Каталог eSIM
            </h2>

            <div className="relative mx-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                    type="text"
                    placeholder="Поиск страны..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-all shadow-lg"
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mx-1">
                {countries.map(c => (
                    <button
                        key={c}
                        onClick={() => setSelectedCountry(c)}
                        className="glass-card flex flex-col items-center justify-center p-5 rounded-2xl relative overflow-hidden group border border-outline-variant/10 hover:border-primary/30 active:scale-95 transition-all text-center h-28"
                    >
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors"></div>
                        <div className="mb-2 group-hover:scale-110 transition-all filter drop-shadow-sm">
                            <FlagIcon country={c} size="md" />
                        </div>
                        <span className="font-headline font-bold text-slate-200 text-sm leading-tight text-balance group-hover:text-primary transition-colors">{c}</span>
                    </button>
                ))}
                
                {countries.length === 0 && (
                    <div className="col-span-2 text-center p-8 text-on-surface-variant border border-dashed border-outline-variant/20 rounded-2xl">
                        Ничего не найдено
                    </div>
                )}
            </div>
        </div>
        {checkoutModal && renderCheckoutModal()}
        {paymentQrModal && renderPaymentQrModal()}
        </>
    );
}
