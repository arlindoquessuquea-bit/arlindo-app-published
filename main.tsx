import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

// --- Configuração Supabase ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Tipos ---
type AppView = 'Começo' | 'Contas' | 'Orçamentos' | 'Estatísticas' | 'Mais';

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

const NavIcon = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#22c55e]' : 'text-gray-500'}`}>
    <i className={`fa-solid ${icon} text-xl`}></i>
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<AppView>('Começo');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col max-w-lg mx-auto relative overflow-hidden">
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold">KwanzaControl Pro</h1>
          <p className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest">Sessão Privada Ativa</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
          <i className="fa-solid fa-right-from-bracket text-gray-400"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {view === 'Começo' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/10">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Património Total</p>
              <h2 className="text-3xl font-bold">0,00 Kz</h2>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center border border-dashed border-white/10">
              <p className="text-gray-500 text-sm">Bem-vindo ao seu novo painel privado.</p>
            </div>
          </div>
        )}

        {view === 'Contas' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Minhas Contas</h3>
            <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 text-center text-gray-500">
              <i className="fa-solid fa-wallet text-3xl mb-3 opacity-20"></i>
              <p>Nenhuma conta criada.</p>
            </div>
          </div>
        )}

        {view === 'Orçamentos' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Planeamento</h3>
            <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 text-center text-gray-500">
              <i className="fa-solid fa-chart-pie text-3xl mb-3 opacity-20"></i>
              <p>Defina os seus limites mensais aqui.</p>
            </div>
          </div>
        )}

        {view === 'Estatísticas' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Análise de Dados</h3>
            <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 text-center text-gray-500">
              <i className="fa-solid fa-chart-simple text-3xl mb-3 opacity-20"></i>
              <p>Gráficos de gastos e receitas.</p>
            </div>
          </div>
        )}

        {view === 'Mais' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Configurações</h3>
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5">
              <div className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer" onClick={() => supabase.auth.signOut()}>
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
      
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-[#22c55e] rounded-full shadow-lg flex items-center justify-center text-black text-2xl z-40">
        <i className="fa-solid fa-plus"></i>
      </button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
