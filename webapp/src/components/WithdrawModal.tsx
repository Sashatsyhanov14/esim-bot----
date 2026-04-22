import React, { useState } from 'react';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
    telegramId?: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, balance, telegramId }) => {
    const [method, setMethod] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!telegramId || balance <= 0) return;

        setLoading(true);
        try {
            await fetch('/api/withdraw-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: telegramId, amount: balance, method })
            });
            alert(`Заявка на вывод ${balance} ₽ (${method}) отправлена менеджеру!`);
            onClose();
        } catch (err) {
            alert("Ошибка отправки запроса");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-[#1a191d] border border-white/5 rounded-t-2xl sm:rounded-2xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 text-on-surface">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold font-headline">Вывод бонусов</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 font-body">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4 animate-in fade-in zoom-in duration-300">
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1 opacity-60">Выводимая сумма</p>
                        <p className="text-2xl font-headline font-extrabold text-primary">{balance.toFixed(0)}₽</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-on-surface-variant font-bold uppercase tracking-wide">Способ выплаты (Карта / СБП / Номер)</label>
                        <input
                            type="text"
                            required
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full p-3 flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary/50"
                            placeholder="Реквизиты..."
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 text-sm uppercase tracking-widest font-bold bg-primary/20 text-primary border border-primary/30 rounded-xl shadow-[0_0_15px_rgba(208,188,255,0.1)] hover:bg-primary/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? '...' : 'Отправить запрос'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WithdrawModal;
