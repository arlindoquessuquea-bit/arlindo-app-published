import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from './supabaseClient';

// ==================== Types ====================
type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
type AppView = 'Começo' | 'Contas' | 'Orçamentos' | 'Estatísticas' | 'Mais' | 'Lixo';
type ModalState =
  | { kind: 'TRANSACTION'; id?: string; defaultType?: TransactionType }
  | { kind: 'ACCOUNT'; id?: string }
  | { kind: 'BUDGET'; id?: string }
  | { kind: 'CATEGORY'; id?: string }
  | { kind: 'SETTINGS' }
  | { kind: 'CATEGORIES_LIST' }
  | null;
type DeletableKind = 'transaction' | 'account' | 'budget' | 'category';

interface BaseItem { id: string; isDeleted?: boolean; }
interface Account extends BaseItem { name: string; initialBalance: number; icon: string; color: string; }
interface Transaction extends BaseItem { accountId: string; toAccountId?: string; amount: number; type: TransactionType; categoryId?: string; date: string; note: string; }
interface Budget extends BaseItem { categoryId: string; limit: number; }
interface Category extends BaseItem { name: string; icon: string; color: string; type: 'EXPENSE' | 'INCOME'; }
interface AppSettings { defaultCurrencyCode: string; fab: { visible: boolean; defaultType: 'EXPENSE' | 'INCOME'; }; hideValues: boolean; }

// ==================== Constants ====================
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentação', icon: 'fa-utensils', color: 'bg-orange-500', type: 'EXPENSE' },
  { id: 'cat-2', name: 'Transporte', icon: 'fa-car', color: 'bg-blue-500', type: 'EXPENSE' },
  { id: 'cat-3', name: 'Casa', icon: 'fa-house', color: 'bg-amber-500', type: 'EXPENSE' },
  { id: 'cat-4', name: 'Compras', icon: 'fa-cart-shopping', color: 'bg-pink-500', type: 'EXPENSE' },
  { id: 'cat-5', name: 'Saúde', icon: 'fa-heart-pulse', color: 'bg-red-500', type: 'EXPENSE' },
  { id: 'cat-6', name: 'Lazer', icon: 'fa-film', color: 'bg-purple-500', type: 'EXPENSE' },
  { id: 'cat-7', name: 'Educação', icon: 'fa-graduation-cap', color: 'bg-cyan-500', type: 'EXPENSE' },
  { id: 'cat-8', name: 'Salário', icon: 'fa-money-bill-trend-up', color: 'bg-green-500', type: 'INCOME' },
  { id: 'cat-9', name: 'Renda Extra', icon: 'fa-coins', color: 'bg-emerald-500', type: 'INCOME' },
  { id: 'cat-10', name: 'Outros', icon: 'fa-ellipsis', color: 'bg-slate-500', type: 'EXPENSE' },
];

const DEFAULT_SETTINGS: AppSettings = { defaultCurrencyCode: 'AOA', fab: { visible: true, defaultType: 'EXPENSE' }, hideValues: false };

const ACCOUNT_ICONS = ['fa-wallet', 'fa-credit-card', 'fa-piggy-bank', 'fa-building-columns', 'fa-money-bill-wave', 'fa-coins', 'fa-vault', 'fa-mobile-screen'];
const CATEGORY_ICONS = ['fa-utensils', 'fa-car', 'fa-house', 'fa-cart-shopping', 'fa-shirt', 'fa-bolt', 'fa-heart-pulse', 'fa-graduation-cap', 'fa-film', 'fa-plane', 'fa-money-bill-trend-up', 'fa-gift', 'fa-coins', 'fa-mobile-screen', 'fa-ellipsis'];
const COLORS = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-slate-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-rose-500'];

// ==================== Helpers ====================
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const formatKz = (amount: number, hide?: boolean) => {
  if (hide) return 'Kz ••••';
  const sign = amount < 0 ? '-' : '';
  return `${sign}Kz ${Math.abs(amount).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });

const todayISO = () => new Date().toISOString().slice(0, 10);

// ==================== Auth ====================
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Verifique o seu e-mail para confirmar o registo!', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-shield-halved text-[#22c55e] text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold">KwanzaControl Pro</h1>
          <p className="text-gray-400 text-sm mt-2">Sessões Privadas & Segurança</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e]" placeholder="seu@email.com" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e]" placeholder="••••••••" required />
          {message.text && <div className={`p-3 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{message.text}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">{loading ? 'A processar...' : isSignUp ? 'Criar Conta' : 'Entrar'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-gray-400 hover:text-white">{isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Registe-se'}</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Generic UI ====================
const NavIcon = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#22c55e]' : 'text-gray-500'}`}>
    <i className={`fa-solid ${icon} text-xl`}></i>
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

const Modal = ({ open, onClose, title, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <i className="fa-solid fa-xmark text-gray-400"></i>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: any) => (
  <label className="block">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

const TextInput = (props: any) => (
  <input {...props} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]" />
);

const Select = ({ children, ...props }: any) => (
  <select {...props} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]">{children}</select>
);

const IconPicker = ({ value, onChange, icons }: { value: string; onChange: (v: string) => void; icons: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {icons.map((ic) => (
      <button key={ic} type="button" onClick={() => onChange(ic)} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${value === ic ? 'border-[#22c55e] bg-[#22c55e]/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}>
        <i className={`fa-solid ${ic} text-sm`}></i>
      </button>
    ))}
  </div>
);

const ColorPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {COLORS.map((c) => (
      <button key={c} type="button" onClick={() => onChange(c)} className={`w-9 h-9 rounded-full ${c} ${value === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : ''}`} />
    ))}
  </div>
);

const PrimaryButton = ({ children, ...props }: any) => (
  <button {...props} className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">{children}</button>
);

const SecondaryButton = ({ children, ...props }: any) => (
  <button {...props} className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors">{children}</button>
);

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
    <i className={`fa-solid ${icon} text-3xl text-gray-600 mb-3`}></i>
    <p className="text-gray-500 text-sm">{text}</p>
  </div>
);

// ==================== App ====================
const App = () => {
  const [session, setSession] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<AppView>('Começo');
  const [modal, setModal] = useState<ModalState>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setHydrated(false); return; }
    const u = session.user.id;
    const load = <T,>(key: string, fallback: T): T => {
      try { const v = localStorage.getItem(`${key}_${u}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    };
    setAccounts(load('accounts', []));
    setTransactions(load('transactions', []));
    setBudgets(load('budgets', []));
    setCategories(load('categories', DEFAULT_CATEGORIES));
    setSettings({ ...DEFAULT_SETTINGS, ...load('settings', DEFAULT_SETTINGS) });
    setHydrated(true);
  }, [session]);

  useEffect(() => { if (session && hydrated) localStorage.setItem(`accounts_${session.user.id}`, JSON.stringify(accounts)); }, [accounts, session, hydrated]);
  useEffect(() => { if (session && hydrated) localStorage.setItem(`transactions_${session.user.id}`, JSON.stringify(transactions)); }, [transactions, session, hydrated]);
  useEffect(() => { if (session && hydrated) localStorage.setItem(`budgets_${session.user.id}`, JSON.stringify(budgets)); }, [budgets, session, hydrated]);
  useEffect(() => { if (session && hydrated) localStorage.setItem(`categories_${session.user.id}`, JSON.stringify(categories)); }, [categories, session, hydrated]);
  useEffect(() => { if (session && hydrated) localStorage.setItem(`settings_${session.user.id}`, JSON.stringify(settings)); }, [settings, session, hydrated]);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isDeleted), [accounts]);
  const activeTransactions = useMemo(() => transactions.filter((t) => !t.isDeleted), [transactions]);
  const activeBudgets = useMemo(() => budgets.filter((b) => !b.isDeleted), [budgets]);
  const activeCategories = useMemo(() => categories.filter((c) => !c.isDeleted), [categories]);

  const accountBalance = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return 0;
    let balance = acc.initialBalance;
    for (const t of activeTransactions) {
      if (t.accountId === accountId) {
        if (t.type === 'EXPENSE') balance -= t.amount;
        else if (t.type === 'INCOME') balance += t.amount;
        else if (t.type === 'TRANSFER') balance -= t.amount;
      } else if (t.type === 'TRANSFER' && t.toAccountId === accountId) {
        balance += t.amount;
      }
    }
    return balance;
  };

  const patrimonio = useMemo(() => activeAccounts.reduce((sum, a) => sum + accountBalance(a.id), 0), [activeAccounts, activeTransactions]);

  if (!session) return <Auth />;

  const upsertAccount = (data: Partial<Account> & { id?: string; name: string; initialBalance: number; icon: string; color: string }) => {
    setAccounts((prev) => data.id ? prev.map((a) => a.id === data.id ? { ...a, ...data } as Account : a) : [...prev, { ...data, id: uid() } as Account]);
  };
  const upsertTransaction = (data: any) => {
    setTransactions((prev) => data.id ? prev.map((t) => t.id === data.id ? { ...t, ...data } as Transaction : t) : [...prev, { ...data, id: uid() } as Transaction]);
  };
  const upsertBudget = (data: any) => {
    setBudgets((prev) => data.id ? prev.map((b) => b.id === data.id ? { ...b, ...data } as Budget : b) : [...prev, { ...data, id: uid() } as Budget]);
  };
  const upsertCategory = (data: any) => {
    setCategories((prev) => data.id ? prev.map((c) => c.id === data.id ? { ...c, ...data } as Category : c) : [...prev, { ...data, id: uid() } as Category]);
  };

  const softDelete = (kind: DeletableKind, id: string) => {
    if (kind === 'account') setAccounts((p) => p.map((a) => a.id === id ? { ...a, isDeleted: true } : a));
    if (kind === 'transaction') setTransactions((p) => p.map((t) => t.id === id ? { ...t, isDeleted: true } : t));
    if (kind === 'budget') setBudgets((p) => p.map((b) => b.id === id ? { ...b, isDeleted: true } : b));
    if (kind === 'category') setCategories((p) => p.map((c) => c.id === id ? { ...c, isDeleted: true } : c));
  };

  const restore = (kind: DeletableKind, id: string) => {
    if (kind === 'account') setAccounts((p) => p.map((a) => a.id === id ? { ...a, isDeleted: false } : a));
    if (kind === 'transaction') setTransactions((p) => p.map((t) => t.id === id ? { ...t, isDeleted: false } : t));
    if (kind === 'budget') setBudgets((p) => p.map((b) => b.id === id ? { ...b, isDeleted: false } : b));
    if (kind === 'category') setCategories((p) => p.map((c) => c.id === id ? { ...c, isDeleted: false } : c));
  };

  const handleLogout = () => supabase.auth.signOut();

  // ========== Subcomponents ==========
  const TransactionRow = ({ t }: any) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    const acc = accounts.find((a) => a.id === t.accountId);
    const toAcc = accounts.find((a) => a.id === t.toAccountId);
    const sign = t.type === 'EXPENSE' ? '-' : t.type === 'INCOME' ? '+' : '';
    const color = t.type === 'EXPENSE' ? 'text-red-400' : t.type === 'INCOME' ? 'text-[#22c55e]' : 'text-blue-400';
    const iconBg = t.type === 'TRANSFER' ? 'bg-blue-500' : (cat?.color || 'bg-slate-500');
    const icon = t.type === 'TRANSFER' ? 'fa-right-left' : (cat?.icon || 'fa-circle');
    return (
      <button onClick={() => setModal({ kind: 'TRANSACTION', id: t.id })} className="w-full p-4 flex items-center gap-3 hover:bg-white/5 text-left">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-white`}>
          <i className={`fa-solid ${icon} text-sm`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{t.type === 'TRANSFER' ? 'Transferência' : (cat?.name || 'Sem categoria')}</p>
          <p className="text-xs text-gray-500 truncate">{t.type === 'TRANSFER' ? `${acc?.name || '?'} → ${toAcc?.name || '?'}` : (t.note || acc?.name || '')}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${color}`}>{sign}{formatKz(t.amount, settings.hideValues)}</p>
          <p className="text-[10px] text-gray-500">{formatDate(t.date)}</p>
        </div>
      </button>
    );
  };

  // ========== Views ==========
  const renderInicio = () => {
    const recent = [...activeTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    const month = todayISO().slice(0, 7);
    const monthExp = activeTransactions.filter((t) => t.type === 'EXPENSE' && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
    const monthInc = activeTransactions.filter((t) => t.type === 'INCOME' && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase font-bold">Património Total</p>
            <button onClick={() => setSettings({ ...settings, hideValues: !settings.hideValues })} className="text-gray-500 hover:text-gray-300" title="Mostrar/Ocultar">
              <i className={`fa-solid ${settings.hideValues ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
            </button>
          </div>
          <h2 className="text-3xl font-bold">{formatKz(patrimonio, settings.hideValues)}</h2>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-black/40 rounded-2xl p-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Receitas (Mês)</p>
              <p className="text-sm font-bold text-[#22c55e]">{formatKz(monthInc, settings.hideValues)}</p>
            </div>
            <div className="bg-black/40 rounded-2xl p-3">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Despesas (Mês)</p>
              <p className="text-sm font-bold text-red-400">{formatKz(monthExp, settings.hideValues)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Atividade Recente</h3>
          {recent.length === 0 ? <EmptyState icon="fa-receipt" text="Nenhuma transação registada. Use o botão + para começar." /> : (
            <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 divide-y divide-white/5">
              {recent.map((t) => <TransactionRow key={t.id} t={t} />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContas = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Minhas Contas</h3>
        <button onClick={() => setModal({ kind: 'ACCOUNT' })} className="text-sm text-[#22c55e] font-bold flex items-center gap-1"><i className="fa-solid fa-plus"></i>Nova</button>
      </div>
      {activeAccounts.length === 0 ? <EmptyState icon="fa-wallet" text="Crie a sua primeira conta." /> : (
        <div className="space-y-3">
          {activeAccounts.map((a) => {
            const bal = accountBalance(a.id);
            return (
              <button key={a.id} onClick={() => setModal({ kind: 'ACCOUNT', id: a.id })} className="w-full bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 flex items-center gap-4 hover:bg-white/5">
                <div className={`w-12 h-12 rounded-2xl ${a.color} flex items-center justify-center text-white`}>
                  <i className={`fa-solid ${a.icon} text-lg`}></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs text-gray-500">Saldo atual</p>
                </div>
                <p className={`font-bold ${bal < 0 ? 'text-red-400' : ''}`}>{formatKz(bal, settings.hideValues)}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderOrcamentos = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Orçamentos</h3>
        <button onClick={() => setModal({ kind: 'BUDGET' })} className="text-sm text-[#22c55e] font-bold flex items-center gap-1"><i className="fa-solid fa-plus"></i>Novo</button>
      </div>
      {activeBudgets.length === 0 ? <EmptyState icon="fa-chart-pie" text="Defina limites mensais por categoria." /> : (
        <div className="space-y-3">
          {activeBudgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const month = todayISO().slice(0, 7);
            const spent = activeTransactions.filter((t) => t.type === 'EXPENSE' && t.categoryId === b.categoryId && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
            const pct = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
            const over = spent > b.limit;
            return (
              <button key={b.id} onClick={() => setModal({ kind: 'BUDGET', id: b.id })} className="w-full bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 hover:bg-white/5 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cat?.color || 'bg-slate-500'} flex items-center justify-center text-white`}>
                    <i className={`fa-solid ${cat?.icon || 'fa-circle'} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{cat?.name || 'Categoria removida'}</p>
                    <p className="text-xs text-gray-500">{formatKz(spent, settings.hideValues)} de {formatKz(b.limit, settings.hideValues)}</p>
                  </div>
                  <p className={`text-xs font-bold ${over ? 'text-red-400' : 'text-gray-400'}`}>{pct.toFixed(0)}%</p>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className={`h-full ${over ? 'bg-red-500' : 'bg-[#22c55e]'}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderEstatisticas = () => {
    const month = todayISO().slice(0, 7);
    const monthTx = activeTransactions.filter((t) => t.date.startsWith(month));
    const byCat: Record<string, number> = {};
    let totalExp = 0;
    let totalInc = 0;
    for (const t of monthTx) {
      if (t.type === 'EXPENSE') {
        byCat[t.categoryId || 'none'] = (byCat[t.categoryId || 'none'] || 0) + t.amount;
        totalExp += t.amount;
      } else if (t.type === 'INCOME') {
        totalInc += t.amount;
      }
    }
    const ranked = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const monthName = new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Estatísticas — <span className="capitalize text-gray-400 font-normal">{monthName}</span></h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Receitas</p>
            <p className="text-lg font-bold text-[#22c55e]">{formatKz(totalInc, settings.hideValues)}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Despesas</p>
            <p className="text-lg font-bold text-red-400">{formatKz(totalExp, settings.hideValues)}</p>
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Saldo do Mês</p>
          <p className={`text-xl font-bold ${totalInc - totalExp < 0 ? 'text-red-400' : 'text-[#22c55e]'}`}>{formatKz(totalInc - totalExp, settings.hideValues)}</p>
        </div>
        <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wide pt-2">Despesas por categoria</h4>
        {ranked.length === 0 ? <EmptyState icon="fa-chart-simple" text="Sem despesas neste mês." /> : (
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 divide-y divide-white/5">
            {ranked.map(([catId, amount]) => {
              const cat = categories.find((c) => c.id === catId);
              const pct = totalExp > 0 ? (amount / totalExp) * 100 : 0;
              return (
                <div key={catId} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-xl ${cat?.color || 'bg-slate-500'} flex items-center justify-center text-white text-sm`}>
                      <i className={`fa-solid ${cat?.icon || 'fa-circle'}`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{cat?.name || 'Sem categoria'}</p>
                      <p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
                    </div>
                    <p className="text-sm font-bold">{formatKz(amount, settings.hideValues)}</p>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className={`h-full ${cat?.color || 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const MaisRow = ({ icon, label, onClick, danger }: any) => (
    <button onClick={onClick} className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
      <i className={`fa-solid ${icon} text-base ${danger ? 'text-red-400' : 'text-gray-400'} w-6`}></i>
      <span className={`font-bold text-sm ${danger ? 'text-red-400' : ''}`}>{label}</span>
      <i className="fa-solid fa-chevron-right text-gray-600 text-xs ml-auto"></i>
    </button>
  );

  const renderMais = () => (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Mais</h3>
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden">
        <MaisRow icon="fa-tags" label="Gerir Categorias" onClick={() => setModal({ kind: 'CATEGORIES_LIST' })} />
        <MaisRow icon="fa-sliders" label="Preferências" onClick={() => setModal({ kind: 'SETTINGS' })} />
        <MaisRow icon="fa-trash-can" label="Lixo" onClick={() => setView('Lixo')} />
        <MaisRow icon="fa-power-off" label="Sair da Conta" onClick={handleLogout} danger />
      </div>
      <p className="text-center text-xs text-gray-600 pt-4">Sessão: {session.user.email}</p>
    </div>
  );

  const TrashRow = ({ icon, color, title, subtitle, onRestore }: any) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-white/5 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white opacity-60`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold opacity-80 truncate">{title}</p>
        {subtitle && <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>}
      </div>
      <button onClick={onRestore} className="text-xs font-bold text-[#22c55e] hover:underline whitespace-nowrap"><i className="fa-solid fa-rotate-left mr-1"></i>Restaurar</button>
    </div>
  );

  const renderLixo = () => {
    const trashAcc = accounts.filter((a) => a.isDeleted);
    const trashTx = transactions.filter((t) => t.isDeleted);
    const trashBud = budgets.filter((b) => b.isDeleted);
    const trashCat = categories.filter((c) => c.isDeleted);
    const empty = !trashAcc.length && !trashTx.length && !trashBud.length && !trashCat.length;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('Mais')} className="text-gray-400 w-8 h-8 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button>
          <h3 className="font-bold text-lg">Lixo</h3>
        </div>
        {empty && <EmptyState icon="fa-trash-can" text="Sem itens eliminados." />}
        {trashAcc.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-bold">Contas</p>
            {trashAcc.map((a) => <TrashRow key={a.id} icon={a.icon} color={a.color} title={a.name} onRestore={() => restore('account', a.id)} />)}
          </div>
        )}
        {trashTx.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-bold">Transações</p>
            {trashTx.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return <TrashRow key={t.id} icon={t.type === 'TRANSFER' ? 'fa-right-left' : (cat?.icon || 'fa-receipt')} color={cat?.color || 'bg-slate-500'} title={`${formatKz(t.amount)} — ${cat?.name || (t.type === 'TRANSFER' ? 'Transferência' : 'Transação')}`} subtitle={formatDate(t.date)} onRestore={() => restore('transaction', t.id)} />;
            })}
          </div>
        )}
        {trashBud.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-bold">Orçamentos</p>
            {trashBud.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              return <TrashRow key={b.id} icon="fa-chart-pie" color={cat?.color || 'bg-slate-500'} title={`${cat?.name || 'Orçamento'} — ${formatKz(b.limit)}`} onRestore={() => restore('budget', b.id)} />;
            })}
          </div>
        )}
        {trashCat.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-bold">Categorias</p>
            {trashCat.map((c) => <TrashRow key={c.id} icon={c.icon} color={c.color} title={c.name} subtitle={c.type === 'INCOME' ? 'Receita' : 'Despesa'} onRestore={() => restore('category', c.id)} />)}
          </div>
        )}
      </div>
    );
  };

  // ========== Forms ==========
  const AccountForm = ({ id, onClose }: { id?: string; onClose: () => void }) => {
    const existing = id ? accounts.find((a) => a.id === id) : undefined;
    const [name, setName] = useState(existing?.name || '');
    const [initialBalance, setInitialBalance] = useState(existing ? String(existing.initialBalance) : '0');
    const [icon, setIcon] = useState(existing?.icon || ACCOUNT_ICONS[0]);
    const [color, setColor] = useState(existing?.color || COLORS[0]);

    return (
      <form onSubmit={(e) => { e.preventDefault(); upsertAccount({ id, name: name.trim(), initialBalance: parseFloat(initialBalance) || 0, icon, color }); onClose(); }} className="space-y-5">
        <Field label="Nome"><TextInput value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Carteira, BAI, BFA, ..." required /></Field>
        <Field label="Saldo Inicial (Kz)"><TextInput type="number" step="0.01" value={initialBalance} onChange={(e: any) => setInitialBalance(e.target.value)} required /></Field>
        <Field label="Ícone"><IconPicker value={icon} onChange={setIcon} icons={ACCOUNT_ICONS} /></Field>
        <Field label="Cor"><ColorPicker value={color} onChange={setColor} /></Field>
        <PrimaryButton type="submit">{id ? 'Guardar Alterações' : 'Criar Conta'}</PrimaryButton>
        {id && <SecondaryButton type="button" onClick={() => { softDelete('account', id); onClose(); }}><i className="fa-solid fa-trash-can mr-2 text-red-400"></i>Mover para Lixo</SecondaryButton>}
      </form>
    );
  };

  const TransactionForm = ({ id, onClose, defaultType }: { id?: string; onClose: () => void; defaultType?: TransactionType }) => {
    const existing = id ? transactions.find((t) => t.id === id) : undefined;
    const [type, setType] = useState<TransactionType>(existing?.type || defaultType || settings.fab.defaultType);
    const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
    const [accountId, setAccountId] = useState(existing?.accountId || activeAccounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState(existing?.toAccountId || activeAccounts.find((a) => a.id !== (existing?.accountId || activeAccounts[0]?.id))?.id || '');
    const [categoryId, setCategoryId] = useState(existing?.categoryId || '');
    const [date, setDate] = useState(existing?.date || todayISO());
    const [note, setNote] = useState(existing?.note || '');

    const catsForType = activeCategories.filter((c) => (type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'));

    if (activeAccounts.length === 0) {
      return (
        <div className="space-y-4 text-center">
          <i className="fa-solid fa-wallet text-3xl text-gray-600"></i>
          <p className="text-gray-400 text-sm">Crie uma conta antes de registar transações.</p>
          <PrimaryButton type="button" onClick={() => { onClose(); setTimeout(() => setModal({ kind: 'ACCOUNT' }), 50); }}>Criar Conta</PrimaryButton>
        </div>
      );
    }

    if (type === 'TRANSFER' && activeAccounts.length < 2) {
      return (
        <div className="space-y-4 text-center">
          <i className="fa-solid fa-right-left text-3xl text-gray-600"></i>
          <p className="text-gray-400 text-sm">Precisa de pelo menos 2 contas para transferir.</p>
          <SecondaryButton type="button" onClick={() => setType('EXPENSE')}>Voltar</SecondaryButton>
        </div>
      );
    }

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        upsertTransaction({ id, type, amount: amt, accountId, toAccountId: type === 'TRANSFER' ? toAccountId : undefined, categoryId: type === 'TRANSFER' ? undefined : (categoryId || undefined), date, note: note.trim() });
        onClose();
      }} className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as TransactionType[]).map((tt) => (
            <button type="button" key={tt} onClick={() => setType(tt)} className={`py-3 rounded-xl font-bold text-xs uppercase ${type === tt ? 'bg-[#22c55e] text-black' : 'bg-white/5 text-gray-400'}`}>
              {tt === 'EXPENSE' ? 'Despesa' : tt === 'INCOME' ? 'Receita' : 'Transf.'}
            </button>
          ))}
        </div>
        <Field label="Montante (Kz)"><TextInput type="number" step="0.01" value={amount} onChange={(e: any) => setAmount(e.target.value)} placeholder="0,00" required autoFocus /></Field>
        <Field label={type === 'TRANSFER' ? 'De Conta' : 'Conta'}>
          <Select value={accountId} onChange={(e: any) => setAccountId(e.target.value)} required>
            {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        {type === 'TRANSFER' ? (
          <Field label="Para Conta">
            <Select value={toAccountId} onChange={(e: any) => setToAccountId(e.target.value)} required>
              <option value="">Selecione...</option>
              {activeAccounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        ) : (
          <Field label="Categoria">
            <Select value={categoryId} onChange={(e: any) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {catsForType.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Data"><TextInput type="date" value={date} onChange={(e: any) => setDate(e.target.value)} required /></Field>
        <Field label="Nota"><TextInput value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="(opcional)" /></Field>
        <PrimaryButton type="submit">{id ? 'Guardar' : 'Registar Transação'}</PrimaryButton>
        {id && <SecondaryButton type="button" onClick={() => { softDelete('transaction', id); onClose(); }}><i className="fa-solid fa-trash-can mr-2 text-red-400"></i>Mover para Lixo</SecondaryButton>}
      </form>
    );
  };

  const BudgetForm = ({ id, onClose }: { id?: string; onClose: () => void }) => {
    const existing = id ? budgets.find((b) => b.id === id) : undefined;
    const expCats = activeCategories.filter((c) => c.type === 'EXPENSE');
    const [categoryId, setCategoryId] = useState(existing?.categoryId || expCats[0]?.id || '');
    const [limit, setLimit] = useState(existing ? String(existing.limit) : '');

    if (expCats.length === 0) {
      return <div className="text-center text-gray-400 text-sm py-6">Crie pelo menos uma categoria de despesa primeiro.</div>;
    }

    return (
      <form onSubmit={(e) => { e.preventDefault(); const l = parseFloat(limit); if (!l || l <= 0) return; upsertBudget({ id, categoryId, limit: l }); onClose(); }} className="space-y-5">
        <Field label="Categoria">
          <Select value={categoryId} onChange={(e: any) => setCategoryId(e.target.value)} required>
            {expCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Limite Mensal (Kz)"><TextInput type="number" step="0.01" value={limit} onChange={(e: any) => setLimit(e.target.value)} required autoFocus placeholder="0,00" /></Field>
        <PrimaryButton type="submit">{id ? 'Guardar' : 'Criar Orçamento'}</PrimaryButton>
        {id && <SecondaryButton type="button" onClick={() => { softDelete('budget', id); onClose(); }}><i className="fa-solid fa-trash-can mr-2 text-red-400"></i>Mover para Lixo</SecondaryButton>}
      </form>
    );
  };

  const CategoryForm = ({ id, onClose }: { id?: string; onClose: () => void }) => {
    const existing = id ? categories.find((c) => c.id === id) : undefined;
    const [name, setName] = useState(existing?.name || '');
    const [icon, setIcon] = useState(existing?.icon || CATEGORY_ICONS[0]);
    const [color, setColor] = useState(existing?.color || COLORS[0]);
    const [type, setType] = useState<'EXPENSE' | 'INCOME'>(existing?.type || 'EXPENSE');

    return (
      <form onSubmit={(e) => { e.preventDefault(); upsertCategory({ id, name: name.trim(), icon, color, type }); onClose(); }} className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {(['EXPENSE', 'INCOME'] as const).map((tt) => (
            <button type="button" key={tt} onClick={() => setType(tt)} className={`py-3 rounded-xl font-bold text-xs uppercase ${type === tt ? 'bg-[#22c55e] text-black' : 'bg-white/5 text-gray-400'}`}>
              {tt === 'EXPENSE' ? 'Despesa' : 'Receita'}
            </button>
          ))}
        </div>
        <Field label="Nome"><TextInput value={name} onChange={(e: any) => setName(e.target.value)} required /></Field>
        <Field label="Ícone"><IconPicker value={icon} onChange={setIcon} icons={CATEGORY_ICONS} /></Field>
        <Field label="Cor"><ColorPicker value={color} onChange={setColor} /></Field>
        <PrimaryButton type="submit">{id ? 'Guardar' : 'Criar Categoria'}</PrimaryButton>
        {id && <SecondaryButton type="button" onClick={() => { softDelete('category', id); onClose(); }}><i className="fa-solid fa-trash-can mr-2 text-red-400"></i>Mover para Lixo</SecondaryButton>}
      </form>
    );
  };

  const Toggle = ({ on, onChange }: any) => (
    <button type="button" onClick={onChange} className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${on ? 'bg-[#22c55e]' : 'bg-white/10'}`}>
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </button>
  );

  const SettingsForm = ({ onClose }: { onClose: () => void }) => {
    const [local, setLocal] = useState<AppSettings>(settings);
    return (
      <div className="space-y-4">
        <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Ocultar valores</p>
            <p className="text-xs text-gray-500">Esconde os montantes na app</p>
          </div>
          <Toggle on={local.hideValues} onChange={() => setLocal({ ...local, hideValues: !local.hideValues })} />
        </div>
        <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Botão flutuante (+)</p>
            <p className="text-xs text-gray-500">Mostrar atalho de transação</p>
          </div>
          <Toggle on={local.fab.visible} onChange={() => setLocal({ ...local, fab: { ...local.fab, visible: !local.fab.visible } })} />
        </div>
        <Field label="Tipo padrão do botão (+)">
          <div className="grid grid-cols-2 gap-2">
            {(['EXPENSE', 'INCOME'] as const).map((tt) => (
              <button key={tt} type="button" onClick={() => setLocal({ ...local, fab: { ...local.fab, defaultType: tt } })} className={`py-3 rounded-xl font-bold text-xs uppercase ${local.fab.defaultType === tt ? 'bg-[#22c55e] text-black' : 'bg-white/5 text-gray-400'}`}>
                {tt === 'EXPENSE' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>
        </Field>
        <PrimaryButton onClick={() => { setSettings(local); onClose(); }}>Guardar</PrimaryButton>
      </div>
    );
  };

  const CategoriesList = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        {activeCategories.map((c) => (
          <button key={c.id} onClick={() => setModal({ kind: 'CATEGORY', id: c.id })} className="w-full bg-black/40 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white`}>
              <i className={`fa-solid ${c.icon} text-sm`}></i>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">{c.name}</p>
              <p className="text-[10px] text-gray-500 uppercase">{c.type === 'INCOME' ? 'Receita' : 'Despesa'}</p>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
          </button>
        ))}
      </div>
      <PrimaryButton onClick={() => setModal({ kind: 'CATEGORY' })}><i className="fa-solid fa-plus mr-2"></i>Nova Categoria</PrimaryButton>
    </div>
  );

  // ========== Layout ==========
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col max-w-lg mx-auto relative">
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold">KwanzaControl Pro</h1>
          <p className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest">Olá, {session.user.email?.split('@')[0]}</p>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10" title="Sair">
          <i className="fa-solid fa-right-from-bracket text-gray-400"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {view === 'Começo' && renderInicio()}
        {view === 'Contas' && renderContas()}
        {view === 'Orçamentos' && renderOrcamentos()}
        {view === 'Estatísticas' && renderEstatisticas()}
        {view === 'Mais' && renderMais()}
        {view === 'Lixo' && renderLixo()}
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-20 bg-[#1a1a1a]/90 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-30 max-w-lg mx-auto">
        <NavIcon active={view === 'Começo'} icon="fa-house" label="Início" onClick={() => setView('Começo')} />
        <NavIcon active={view === 'Contas'} icon="fa-wallet" label="Contas" onClick={() => setView('Contas')} />
        <NavIcon active={view === 'Orçamentos'} icon="fa-chart-pie" label="Planos" onClick={() => setView('Orçamentos')} />
        <NavIcon active={view === 'Estatísticas'} icon="fa-chart-simple" label="Dados" onClick={() => setView('Estatísticas')} />
        <NavIcon active={view === 'Mais' || view === 'Lixo'} icon="fa-ellipsis" label="Mais" onClick={() => setView('Mais')} />
      </nav>

      {settings.fab.visible && (
        <button onClick={() => setModal({ kind: 'TRANSACTION' })} className="fixed bottom-24 right-6 w-14 h-14 bg-[#22c55e] rounded-full shadow-lg flex items-center justify-center text-black text-2xl z-40 active:scale-95 transition-transform">
          <i className="fa-solid fa-plus"></i>
        </button>
      )}

      <Modal open={modal?.kind === 'TRANSACTION'} onClose={() => setModal(null)} title={modal?.kind === 'TRANSACTION' && modal.id ? 'Editar Transação' : 'Nova Transação'}>
        {modal?.kind === 'TRANSACTION' && <TransactionForm id={modal.id} onClose={() => setModal(null)} defaultType={modal.defaultType} />}
      </Modal>
      <Modal open={modal?.kind === 'ACCOUNT'} onClose={() => setModal(null)} title={modal?.kind === 'ACCOUNT' && modal.id ? 'Editar Conta' : 'Nova Conta'}>
        {modal?.kind === 'ACCOUNT' && <AccountForm id={modal.id} onClose={() => setModal(null)} />}
      </Modal>
      <Modal open={modal?.kind === 'BUDGET'} onClose={() => setModal(null)} title={modal?.kind === 'BUDGET' && modal.id ? 'Editar Orçamento' : 'Novo Orçamento'}>
        {modal?.kind === 'BUDGET' && <BudgetForm id={modal.id} onClose={() => setModal(null)} />}
      </Modal>
      <Modal open={modal?.kind === 'CATEGORY'} onClose={() => setModal(null)} title={modal?.kind === 'CATEGORY' && modal.id ? 'Editar Categoria' : 'Nova Categoria'}>
        {modal?.kind === 'CATEGORY' && <CategoryForm id={modal.id} onClose={() => setModal(null)} />}
      </Modal>
      <Modal open={modal?.kind === 'SETTINGS'} onClose={() => setModal(null)} title="Preferências">
        {modal?.kind === 'SETTINGS' && <SettingsForm onClose={() => setModal(null)} />}
      </Modal>
      <Modal open={modal?.kind === 'CATEGORIES_LIST'} onClose={() => setModal(null)} title="Categorias">
        {modal?.kind === 'CATEGORIES_LIST' && <CategoriesList />}
      </Modal>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
