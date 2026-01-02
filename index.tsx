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
  { id: 'cat-13', name: 'Renda', icon: 'fa-money-bill-trend-up', color: 'bg-green-500', type: 'INCOME' },
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

// --- Componentes Auxiliares (Simplificados para Reintegração) ---
const NavIcon = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#22c55e]' : 'text-gray-500'}`}>
    <i className={`fa-solid ${icon} text-xl`}></i>
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

// --- Componente Principal App ---
const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<AppView>('Começo');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<AppSettings>({ defaultCurrencyCode: 'AOA', fab: { visible: true, defaultType: 'EXPENSE' }, hideValues: false });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados do localStorage (por agora, para manter funcionalidade enquanto migramos)
  useEffect(() => {
    if (session) {
      const savedAccounts = localStorage.getItem(`accounts_${session.user.id}`);
      const savedTransactions = localStorage.getItem(`transactions_${session.user.id}`);
      if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    }
  }, [session]);

  // Guardar dados no localStorage (isolado por utilizador)
  useEffect(() => {
    if (session) {
      localStorage.setItem(`accounts_${session.user.id}`, JSON.stringify(accounts));
      localStorage.setItem(`transactions_${session.user.id}`, JSON.stringify(transactions));
    }
  }, [accounts, transactions, session]);

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

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {view === 'Começo' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/10">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Património Total</p>
              <h2 className="text-3xl font-bold">Kz 0,00</h2>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Atividade Recente</h3>
              <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
                <p className="text-gray-500 text-sm">Nenhuma transação registada nesta conta privada.</p>
              </div>
            </div>
          </div>
        )}
        
        {view !== 'Começo' && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-screwdriver-wrench text-gray-500 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold">Em Reintegração</h2>
            <p className="text-gray-400 text-sm">Estamos a ligar a vista "{view}" à sua nova base de dados. Disponível em minutos!</p>
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
