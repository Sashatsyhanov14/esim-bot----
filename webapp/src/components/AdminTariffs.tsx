import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Tariff {
    id: string;
    sort_number: number;
    country: string;
    data_gb: string;
    validity_period: string;
    price_usd: number;
    price_rub?: number;
    payment_link?: string;
    payment_qr_url?: string;
    is_active: boolean;
}

export default function AdminTariffs({ t }: { t: any }) {
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Tariff>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const scrollToForm = () => {
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        setLoading(true);
        const { data } = await supabase.from('tariffs').select('*').order('sort_number', { ascending: true });
        if (data) setTariffs(data);
        setLoading(false);
    };

    const handleSave = async () => {
        const missing = [];
        if (!formData.country) missing.push('Страна');
        if (!formData.data_gb) missing.push('Трафик');
        if (!formData.validity_period) missing.push('Срок');
        if (formData.price_rub === undefined || isNaN(formData.price_rub)) missing.push('Цена ₽');

        if (missing.length > 0) {
            showNotify(`Заполните: ${missing.join(', ')}`, 'error');
            return;
        }

        const validFields = [
            'sort_number', 'country', 'data_gb', 'validity_period', 'price_usd', 'price_rub', 
            'payment_link', 'payment_qr_url', 'is_active'
        ];

        const cleanData: any = {};
        validFields.forEach(field => {
            if (formData[field as keyof Tariff] !== undefined) {
                cleanData[field] = formData[field as keyof Tariff];
            }
        });

        // Ensure price_usd is at least a fallback calculation if not set
        if (!cleanData.price_usd && cleanData.price_rub) {
            cleanData.price_usd = cleanData.price_rub / 100;
        }

        if (editingId === 'new') {
            cleanData.created_at = new Date().toISOString();
            const { error } = await supabase.from('tariffs').insert([cleanData]);
            if (error) {
                console.error('[INSERT ERROR]', error);
                showNotify(`Ошибка добавления: ${error.message}`, 'error');
                return;
            }
            showNotify(`✅ Тариф "${formData.country}" создан!`);
        } else {
            const { error } = await supabase.from('tariffs').update(cleanData).eq('id', editingId);
            if (error) {
                console.error('[UPDATE ERROR]', error);
                showNotify(`Ошибка обновления: ${error.message}`, 'error');
                return;
            }
            showNotify(`✅ Тариф "${formData.country}" обновлён!`);
        }
        setEditingId(null);
        setFormData({});
        fetchTariffs();
    };

    const filteredTariffs = tariffs.filter(t =>
        (t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.data_gb.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!showOnlyActive || t.is_active)
    );

    const handleMoveUp = async (tariff: Tariff, index: number) => {
        if (index === 0) return;
        const prev = filteredTariffs[index - 1];
        const prevSort = prev.sort_number;
        const curSort = tariff.sort_number;
        await supabase.from('tariffs').update({ sort_number: prevSort }).eq('id', tariff.id);
        await supabase.from('tariffs').update({ sort_number: curSort }).eq('id', prev.id);
        fetchTariffs();
    };

    const handleMoveDown = async (tariff: Tariff, index: number) => {
        if (index >= filteredTariffs.length - 1) return;
        const next = filteredTariffs[index + 1];
        const nextSort = next.sort_number;
        const curSort = tariff.sort_number;
        await supabase.from('tariffs').update({ sort_number: nextSort }).eq('id', tariff.id);
        await supabase.from('tariffs').update({ sort_number: curSort }).eq('id', next.id);
        fetchTariffs();
    };


    if (loading) return <div className="text-center p-4 animate-pulse text-on-surface-variant">Загрузка тарифов...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center pl-1">
                <h3 className="text-lg font-headline font-bold text-on-surface">{t.manageTariffs}</h3>
                <button
                    onClick={() => { setEditingId('new'); setFormData({ is_active: true, sort_number: tariffs.length + 1 }); scrollToForm(); }}
                    className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-primary/30"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t.addTariff}
                </button>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Поиск по стране или трафику..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl py-3.5 pl-11 pr-4 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowOnlyActive(!showOnlyActive)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${showOnlyActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20'}`}
                >
                    {showOnlyActive ? '✅ Активные' : '📋 Все'}
                </button>
            </div>

            {editingId && (
                <div ref={formRef} className="glass-card p-4 rounded-xl space-y-3 border border-primary/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

                    {notification && (
                        <div className={`p-3 rounded-lg text-xs font-bold mb-2 animate-bounce flex items-center gap-2 ${notification.type === 'error' ? 'bg-error/20 text-error' : 'bg-green-500/20 text-green-400'}`}>
                            <span className="material-symbols-outlined text-[16px]">{notification.type === 'error' ? 'report' : 'check_circle'}</span>
                            {notification.msg}
                        </div>
                    )}

                    <h4 className="font-bold text-primary mb-3 text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined">{editingId === 'new' ? 'add_circle' : 'edit_square'}</span>
                        {editingId === 'new' ? t.newTariff : t.editTariff}
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                            <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider pl-1 mb-1 block">Сортировка (1, 2...)</label>
                            <input type="number" placeholder="1" value={formData.sort_number || ''} onChange={e => setFormData({ ...formData, sort_number: parseInt(e.target.value) })} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors" />
                        </div>

                        <div className="col-span-2 mt-2">
                            <div className="flex justify-between items-end border-b border-white/5 pb-1 mb-2">
                                <h5 className="text-secondary text-sm font-bold">Тарифные данные</h5>
                            </div>
                            <input type="text" placeholder="Страна (напр. Турция)" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none mb-2" />
                            <div className="flex gap-2">
                                <input type="text" placeholder="Трафик (напр. 1 ГБ)" value={formData.data_gb || ''} onChange={e => setFormData({ ...formData, data_gb: e.target.value })} className="w-1/2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none" />
                                <input type="text" placeholder="Срок (напр. 7 дней)" value={formData.validity_period || ''} onChange={e => setFormData({ ...formData, validity_period: e.target.value })} className="w-1/2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none" />
                            </div>
                        </div>


                        <div className="col-span-2 mt-2 pt-2 border-t border-white/5">
                            <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider pl-1 mb-1 block">Цена в рублях / ₽</label>
                            <input type="number" placeholder="₽ Цена" value={formData.price_rub || ''} onChange={e => setFormData({ ...formData, price_rub: parseFloat(e.target.value) || undefined })} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:border-blue-500/50 focus:outline-none transition-colors font-bold text-blue-400" />
                        </div>

                        <div className="col-span-2 mt-2">
                            <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider pl-1 mb-1 block">Ссылки на оплату</label>
                            <input type="text" placeholder="Ссылка на оплату (https://...)" value={formData.payment_link || ''} onChange={e => setFormData({ ...formData, payment_link: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:border-secondary/50 focus:outline-none transition-colors mb-2" />
                            <input type="text" placeholder="QR ссылка (https://...)" value={formData.payment_qr_url || ''} onChange={e => setFormData({ ...formData, payment_qr_url: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-3 text-sm text-on-surface focus:border-secondary/50 focus:outline-none transition-colors" />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 text-sm text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 cursor-pointer mt-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${formData.is_active ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant'}`}>
                            {formData.is_active && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                        </div>
                        <input type="checkbox" checked={formData.is_active || false} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="hidden" />
                        <span className="font-medium tracking-wide">{t.isActive}</span>
                    </label>

                    <div className="flex gap-3 pt-3">
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-surface-container-high text-on-surface py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:bg-surface-container-highest">
                            {t.cancelBtn}
                        </button>
                        <button onClick={handleSave} className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(208,188,255,0.3)] hover:brightness-110 active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            {t.saveBtn}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {filteredTariffs.map((tData, idx) => (
                    <div key={tData.id} className={`glass-card p-4 rounded-xl relative transition-all overflow-hidden ${!tData.is_active ? 'opacity-50 grayscale select-none' : ''}`}>
                        {tData.is_active && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[30px] -z-10 translate-x-1/2 -translate-y-1/2"></div>}

                        <div className="flex justify-between items-start mb-3 pr-20">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-bold uppercase">#{tData.sort_number}</span>
                                <span className="font-headline font-bold text-on-surface text-lg tracking-wide">{tData.country}</span>
                            </div>
                            <span className="font-headline font-extrabold text-blue-400 text-xl absolute top-3 right-3">
                                {tData.price_rub ? `₽${tData.price_rub}` : `$${tData.price_usd}`}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 bg-surface-container/50 rounded-lg p-2 border border-white/5">
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px] text-primary">wifi</span>
                                <span className="font-medium text-slate-200">{tData.data_gb}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                                <span className="font-medium text-slate-200">{tData.validity_period}</span>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2 mt-3 pt-3 border-t border-outline-variant/10">
                            <div className="flex gap-1">
                                <button onClick={() => handleMoveUp(tData, idx)} disabled={idx === 0} className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center transition-colors hover:bg-surface-container-highest active:scale-90 disabled:opacity-30 disabled:active:scale-100">
                                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                </button>
                                <button onClick={() => handleMoveDown(tData, idx)} disabled={idx === filteredTariffs.length - 1} className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center transition-colors hover:bg-surface-container-highest active:scale-90 disabled:opacity-30 disabled:active:scale-100">
                                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingId(tData.id); setFormData(tData); scrollToForm(); }} className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center transition-colors hover:bg-surface-container-highest active:scale-90 pb-[1px]">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button onClick={async () => { if (confirm('Точно удалить тариф?')) { await supabase.from('tariffs').delete().eq('id', tData.id); fetchTariffs(); } }} className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center transition-all hover:bg-error hover:text-white active:scale-90 pb-[1px]">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
