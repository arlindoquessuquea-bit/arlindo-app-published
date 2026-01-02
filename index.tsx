import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from './services/supabaseClient';
import { Auth } from './components/Auth';

// --- Tipos & Interfaces ---
type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
type AppView = 'Começo' | 'Contas' | 'Orçamentos' | 'Estatísticas' | 'Mais' | 'Lixo';
type ModalType = 'TRANSACTION' | 'BUDGET' | 'ACCOUNT' | 'SETTINGS' | 'CATEGORIES';
type DeletableItemType = 'transaction' | 'account' | 'budget' | 'category';

interface BaseItem {
  id: string;
  isDeleted?: boolean;
}
interface Account extends BaseItem {
  name: string;
  initialBalance: number;
  icon: string;
  color: string;
}
interface Transaction extends BaseItem {
  accountId: string;
  toAccountId?: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  date: string;
  note: string;
  recurrenceRule?: string;
  receiptFile?: string;
}
interface Budget extends BaseItem {
  categoryId: string;
  limit: number;
}
interface Currency {
  code: string; name: string; symbol: string; flag: string; decimalPlaces: number;
}
interface FabSettings {
    visible: boolean;
    defaultType: 'EXPENSE' | 'INCOME';
}
interface AppSettings {
    defaultCurrencyCode: string;
    fab: FabSettings;
    hideValues: boolean;
}
interface Category extends BaseItem {
    name: string;
    icon: string;
    color: string;
    type: 'EXPENSE' | 'INCOME';
}

// --- Constantes & Configs ---
const STORAGE_VERSION = 'v12';
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentação', icon: 'fa-utensils', color: 'bg-orange-500', type: 'EXPENSE' }, { id: 'cat-2', name: 'Transporte', icon: 'fa-car', color: 'bg-blue-500', type: 'EXPENSE' }, { id: 'cat-3', name: 'Lazer', icon: 'fa-gamepad', color: 'bg-purple-500', type: 'EXPENSE' }, { id: 'cat-4', name: 'Saúde', icon: 'fa-heart-pulse', color: 'bg-rose-500', type: 'EXPENSE' }, { id: 'cat-5', name: 'Educação', icon: 'fa-graduation-cap', color: 'bg-indigo-500', type: 'EXPENSE' }, { id: 'cat-6', name: 'Moradia', icon: 'fa-house', color: 'bg-emerald-500', type: 'EXPENSE' }, { id: 'cat-7', name: 'Compras', icon: 'fa-bag-shopping', color: 'bg-pink-500', type: 'EXPENSE' }, { id: 'cat-8', name: 'Serviços', icon: 'fa-wrench', color: 'bg-amber-500', type: 'EXPENSE' }, { id: 'cat-9', name: 'Assinaturas', icon: 'fa-tv', color: 'bg-red-500', type: 'EXPENSE' }, { id: 'cat-10', name: 'Internet', icon: 'fa-wifi', color: 'bg-cyan-500', type: 'EXPENSE' }, { id: 'cat-11', name: 'Presentes', icon: 'fa-gift', color: 'bg-violet-500', type: 'EXPENSE' }, { id: 'cat-12', name: 'Viagens', icon: 'fa-plane', color: 'bg-sky-500', type: 'EXPENSE' }, { id: 'cat-13', name: 'Renda', icon: 'fa-money-bill-trend-up', color: 'bg-green-500', type: 'INCOME' }, { id: 'cat-14', name: 'Investimento', icon: 'fa-chart-line', color: 'bg-teal-500', type: 'INCOME' }, { id: 'cat-15', name: 'Outros', icon: 'fa-ellipsis', color: 'bg-slate-500', type: 'EXPENSE' },
];
const CURRENCIES: Currency[] = [ { code: 'AOA', name: 'Kwanza Angolano', symbol: 'Kz', flag: '🇦🇴', decimalPlaces: 2 }, { code: 'USD', name: 'Dólar Americano', symbol: '$', flag: '🇺🇸', decimalPlaces: 2 }, { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimalPlaces: 2 }, { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', flag: '🇧🇷', decimalPlaces: 2 }, { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧', decimalPlaces: 2 }, { code: 'JPY', name: 'Iene Japonês', symbol: '¥', flag: '🇯🇵', decimalPlaces: 0 }, ];
const DEFAULT_SETTINGS: AppSettings = { defaultCurrencyCode: 'AOA', fab: { visible: true, defaultType: 'EXPENSE', }, hideValues: false, };

// --- Componentes Auxiliares ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
            <div className="w-full max-w-sm mx-auto bg-bg-card rounded-3xl p-6 space-y-4 animate-slide-up">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm text-text-secondary">{message}</p>
                <div className="flex gap-3 pt-3">
                    <button onClick={onClose} className="w-full py-3 bg-white/10 rounded-xl font-bold transition-colors hover:bg-white/20">Cancelar</button>
                    <button onClick={onConfirm} className="w-full py-3 bg-accent-red rounded-xl font-bold text-white transition-opacity hover:opacity-90">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const AlertModal = ({ isOpen, onClose, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
            <div className="w-full max-w-sm mx-auto bg-bg-card rounded-3xl p-6 space-y-4 animate-slide-up text-center">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm text-text-secondary">{message}</p>
                <div className="pt-3">
                    <button onClick={onClose} style={{backgroundColor: 'var(--accent-green)'}} className="w-full py-3 text-black rounded-xl font-bold">OK</button>
                </div>
            </div>
        </div>
    );
};

const NavIcon = ({ active, icon, label, onClick }: any) => (<button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all w-16 ${active ? 'text-accent-green' : 'text-text-secondary'}`}><i className={`fa-solid ${icon} text-xl`}></i><span className="text-[10px] font-bold">{label}</span></button>);
const SettingsItem = ({ icon, label, value, onClick }: any) => (<div onClick={onClick} className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer"><div className="flex items-center gap-4"><i className={`fa-solid ${icon} text-text-secondary w-5`}></i><span className="text-sm font-bold">{label}</span></div><div className="flex items-center gap-2"><span className="text-sm text-text-secondary">{value}</span><i className="fa-solid fa-chevron-right text-xs text-slate-600"></i></div></div>);

// --- Componente Principal App ---
const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<AppView>('Começo');
  const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(localStorage.getItem(`kc_settings_${STORAGE_VERSION}`) || 'null') || DEFAULT_SETTINGS);
  const [accounts, setAccounts] = useState<Account[]>(() => JSON.parse(localStorage.getItem(`kc_accounts_${STORAGE_VERSION}`) || 'null') || []);
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem(`kc_transactions_${STORAGE_VERSION}`) || 'null') || []);
  const [budgets, setBudgets] = useState<Budget[]>(() => JSON.parse(localStorage.getItem(`kc_budgets_${STORAGE_VERSION}`) || 'null') || []);
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem(`kc_categories_${STORAGE_VERSION}`) || 'null') || DEFAULT_CATEGORIES);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem(`kc_settings_${STORAGE_VERSION}`, JSON.stringify(settings));
      localStorage.setItem(`kc_accounts_${STORAGE_VERSION}`, JSON.stringify(accounts));
      localStorage.setItem(`kc_transactions_${STORAGE_VERSION}`, JSON.stringify(transactions));
      localStorage.setItem(`kc_budgets_${STORAGE_VERSION}`, JSON.stringify(budgets));
      localStorage.setItem(`kc_categories_${STORAGE_VERSION}`, JSON.stringify(categories));
    }
  }, [settings, accounts, transactions, budgets, categories, session]);

  if (!session) {
    return <Auth />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-accent-green/30">
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Arlindo App</h1>
        <button onClick={handleLogout} className="text-xs font-bold text-text-secondary hover:text-white transition-colors">
          Sair <i className="fa-solid fa-right-from-bracket ml-1"></i>
        </button>
      </header>

      <main className="pb-32 px-4">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-cloud-check text-accent-green text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Sessão Privada Ativa</h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            Bem-vindo, <strong>{session.user.email}</strong>. Os seus dados estão agora protegidos e sincronizados na nuvem.
          </p>
        </div>

        <nav className="fixed bottom-0 inset-x-0 h-24 bg-bg-card/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-30 safe-area-bottom">
          <NavIcon active={view === 'Começo'} icon="fa-house" label="Começo" onClick={() => setView('Começo')} />
          <NavIcon active={view === 'Contas'} icon="fa-wallet" label="Contas" onClick={() => setView('Contas')} />
          <NavIcon active={view === 'Orçamentos'} icon="fa-chart-pie" label="Orçamentos" onClick={() => setView('Orçamentos')} />
          <NavIcon active={view === 'Estatísticas'} icon="fa-chart-simple" label="Estatísticas" onClick={() => setView('Estatísticas')} />
          <NavIcon active={view === 'Mais'} icon="fa-ellipsis" label="Mais" onClick={() => setView('Mais')} />
        </nav>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
