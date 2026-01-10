import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

// --- Configuração Supabase ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Tipos & Interfaces ---
type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
type AppView = 'Começo' | 'Contas' | 'Orçamentos' | 'Estatísticas' | 'Mais' | 'Lixo';
type ModalType = 'TRANSACTION' | 'BUDGET' | 'ACCOUNT' | 'SETTINGS' | 'CATEGORIES';
type DeletableItemType = 'transaction' | 'account' | 'budget' | 'category';

interface BaseItem { id: string; isDeleted?: boolean; }
interface Account extends BaseItem { name: string; initialBalance: number; icon: string; color: string; }
interface Transaction extends BaseItem { accountId: string; toAccountId?: string; amount: number; type: TransactionType; categoryId?: string; date: string; note: string; }
interface Budget extends BaseItem { categoryId: string; limit: number; }
interface Category extends BaseItem { name: string; icon: string; color: string; type: 'EXPENSE' | 'INCOME'; }
interface AppSettings { defaultCurrencyCode: string; fab: { visible: boolean; defaultType: 'EXPENSE' | 'INCOME'; }; hideValues: boolean; }

// --- Constantes ---
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentação', icon: 'fa-utensils', color: 'bg-orange-500', type: 'EXPENSE' },
  { id: 'cat-2', name: 'Transporte', icon: 'fa-car', color: 'bg-blue-500', type: 'EXPENSE' },
  { id: 'cat-3', name: 'Lazer', icon: 'fa-gamepad', color: 'bg-purple-500', type: 'EXPENSE' },
  { id: 'cat-4', name: 'Saúde', icon: 'fa-heart-pulse', color: 'bg-rose-500', type: 'EXPENSE' },
  { id: 'cat-5', name: 'Educação', icon: 'fa-graduation-cap', color: 'bg-indigo-500', type: 'EXPENSE' },
  { id: 'cat-6', name: 'Moradia', icon: 'fa-house', color: 'bg-emerald-500', type: 'EXPENSE' },
  { id: 'cat-7', name: 'Compras', icon: 'fa-bag-shopping', color: 'bg-pink-500', type: 'EXPENSE' },
  { id: 'cat-8', name: 'Serviços', icon: 'fa-wrench', color: 'bg-amber-500', type: 'EXPENSE' },
  { id: 'cat-9', name: 'Assinaturas', icon: 'fa-tv', color: 'bg-red-500', type: 'EXPENSE' },
  { id: 'cat-10', name: 'Internet', icon: 'fa-wifi', color: 'bg-cyan-500', type: 'EXPENSE' },
  { id: 'cat-11', name: 'Presentes', icon: 'fa-gift', color: 'bg-violet-500', type: 'EXPENSE' },
  { id: 'cat-12', name: 'Viagens', icon: 'fa-plane', color: 'bg-sky-500', type: 'EXPENSE' },
  { id: 'cat-13', name: 'Renda', icon: 'fa-money-bill-trend-up', color: 'bg-green-500', type: 'INCOME' },
  { id: 'cat-14', name: 'Investimento', icon: 'fa-chart-line', color: 'bg-teal-500', type: 'INCOME' },
  { id: 'cat-15', name: 'Outros', icon: 'fa-ellipsis', color: 'bg-slate-500', type: 'EXPENSE' },
];

// --- Componente de Autenticação ---
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

// --- Componentes Auxiliares ---
const NavIcon = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#22c55e]' : 'text-gray-500'}`}>
    <i className={`fa-solid ${icon} text-xl`}></i>
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

const TransactionItem = ({ transaction, accounts, categories, formatCurrency, onDelete, onEdit }: any) => {
  const account = accounts.find((a: any) => a.id === transaction.accountId);
  const category = categories.find((c: any) => c.id === transaction.categoryId);
  const isExpense = transaction.type === 'EXPENSE';
  const isTransfer = transaction.type === 'TRANSFER';

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-2xl flex items-center justify-between border border-white/5">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category?.color || 'bg-gray-700'}`}>
          <i className={`fa-solid ${category?.icon || 'fa-tag'}`}></i>
        </div>
        <div>
          <p className="font-bold text-sm">{transaction.note || category?.name || 'Sem nota'}</p>
          <p className="text-[10px] text-gray-500 uppercase">{account?.name} • {new Date(transaction.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isExpense ? 'text-red-500' : isTransfer ? 'text-blue-400' : 'text-green-500'}`}>
          {isExpense ? '-' : isTransfer ? '' : '+'}{formatCurrency(transaction.amount)}
        </p>
        <div className="flex gap-2 mt-1 justify-end">
          <button onClick={onEdit} className="text-gray-600 hover:text-white"><i className="fa-solid fa-pencil text-xs"></i></button>
          <button onClick={() => onDelete(transaction.id)} className="text-gray-600 hover:text-red-500"><i className="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal App ---
const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<AppView>('Começo');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<AppSettings>({ defaultCurrencyCode: 'AOA', fab: { visible: true, defaultType: 'EXPENSE' }, hideValues: false });
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const savedAccounts = localStorage.getItem(`accounts_${session.user.id}`);
      const savedTransactions = localStorage.getItem(`transactions_${session.user.id}`);
      const savedBudgets = localStorage.getItem(`budgets_${session.user.id}`);
      if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(`accounts_${session.user.id}`, JSON.stringify(accounts));
      localStorage.setItem(`transactions_${session.user.id}`, JSON.stringify(transactions));
      localStorage.setItem(`budgets_${session.user.id}`, JSON.stringify(budgets));
    }
  }, [accounts, transactions, budgets, session]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  const stats = useMemo(() => {
    const activeTransactions = transactions.filter(t => !t.isDeleted);
    const activeAccounts = accounts.filter(a => !a.isDeleted);
    
    const netWorth = activeAccounts.reduce((sum, acc) => {
      const netFlow = activeTransactions.reduce((s, t) => {
        if (t.accountId === acc.id) return t.type === 'EXPENSE' || t.type === 'TRANSFER' ? s - t.amount : s + t.amount;
        if (t.toAccountId === acc.id) return s + t.amount;
        return s;
      }, 0);
      return sum + acc.initialBalance + netFlow;
    }, 0);

    const totalIncome = activeTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = activeTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    return { netWorth, totalIncome, totalExpense };
  }, [accounts, transactions]);

  if (!session) return <Auth />;

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col max-w-lg mx-auto relative overflow-hidden">
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold">KwanzaControl Pro</h1>
          <p className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest">Sessão de {session.user.email?.split('@')[0]}</p>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10">
          <i className="fa-solid fa-right-from-bracket text-gray-400"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        {view === 'Começo' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/10">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Património Total</p>
              <h2 className="text-3xl font-bold">{formatCurrency(stats.netWorth)}</h2>
              <div className="flex gap-4 mt-4">
                <div className="flex-1 bg-green-500/10 p-3 rounded-2xl border border-green-500/20">
                  <p className="text-[10px] text-green-500 uppercase font-bold">Renda</p>
                  <p className="font-bold text-sm">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="flex-1 bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
                  <p className="text-[10px] text-red-500 uppercase font-bold">Despesa</p>
                  <p className="font-bold text-sm">{formatCurrency(stats.totalExpense)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Movimentos Recentes</h3>
              {transactions.filter(t => !t.isDeleted).length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
                  <p className="text-gray-500 text-sm">Nenhuma transação registada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.filter(t => !t.isDeleted).slice(0, 5).map(t => (
                    <TransactionItem key={t.id} transaction={t} accounts={accounts} categories={categories} formatCurrency={formatCurrency} onDelete={() => {}} onEdit={() => {}} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'Contas' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-lg">Minhas Contas</h3>
            {accounts.filter(a => !a.isDeleted).length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
                <p className="text-gray-500 text-sm">Nenhuma conta criada.</p>
                <button onClick={() => setAccounts([{id: 'acc-1', name: 'Carteira', initialBalance: 0, icon: 'fa-wallet', color: 'bg-yellow-500'}])} className="mt-4 text-[#22c55e] text-xs font-bold uppercase">+ Criar Primeira Conta</button>
              </div>
            ) : (
              accounts.filter(a => !a.isDeleted).map(acc => (
                <div key={acc.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acc.color}`}>
                      <i className={`fa-solid ${acc.icon}`}></i>
                    </div>
                    <span className="font-bold">{acc.name}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(acc.initialBalance)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'Orçamentos' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-lg">Planeamento</h3>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
              <i className="fa-solid fa-chart-pie text-gray-600 text-3xl mb-3"></i>
              <p className="text-gray-500 text-sm">Defina limites de gastos por categoria para controlar melhor o seu dinheiro.</p>
              <button className="mt-4 bg-white/5 px-4 py-2 rounded-xl text-xs font-bold uppercase">Criar Orçamento</button>
            </div>
          </div>
        )}

        {view === 'Estatísticas' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-lg">Análise de Dados</h3>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
              <i className="fa-solid fa-chart-simple text-gray-600 text-3xl mb-3"></i>
              <p className="text-gray-500 text-sm">Gráficos detalhados de receitas e despesas aparecerão aqui conforme registar transações.</p>
            </div>
          </div>
        )}

        {view === 'Mais' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-lg">Configurações</h3>
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5">
              <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-coins text-yellow-500"></i>
                  <span>Moeda Principal</span>
                </div>
                <span className="text-gray-500 text-sm">AOA (Kz)</span>
              </div>
              <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-trash text-red-500"></i>
                  <span>Lixo</span>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer" onClick={handleLogout}>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-power-off text-gray-400"></i>
                  <span>Sair da Conta</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-24 bg-[#1a1a1a]/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-30 max-w-lg mx-auto">
        <NavIcon active={view === 'Começo'} icon="fa-house" label="Início" onClick={() => setView('Começo')} />
        <NavIcon active={view === 'Contas'} icon="fa-wallet" label="Contas" onClick={() => setView('Contas')} />
        <NavIcon active={view === 'Orçamentos'} icon="fa-chart-pie" label="Planos" onClick={() => setView('Orçamentos')} />
        <NavIcon active={view === 'Estatísticas'} icon="fa-chart-simple" label="Dados" onClick={() => setView('Estatísticas')} />
        <NavIcon active={view === 'Mais'} icon="fa-ellipsis" label="Mais" onClick={() => setView('Mais')} />
      </nav>
      
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-[#22c55e] rounded-full shadow-lg flex items-center justify-center text-black text-2xl z-40 active:scale-95 transition-transform">
        <i className="fa-solid fa-plus"></i>
      </button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
