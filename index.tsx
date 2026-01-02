import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

// --- Configuração Supabase ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e] transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#22c55e] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22c55e] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? 'A processar...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Registe-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal App ---
const App = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold">KwanzaControl Pro</h1>
          <p className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest">Sessão Privada</p>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <i className="fa-solid fa-right-from-bracket text-gray-400"></i>
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-cloud-check text-[#22c55e] text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-2">Olá, {session.user.email?.split('@')[0]}!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            A sua conta privada está ativa. Todos os seus dados financeiros serão guardados de forma segura na nuvem e só você poderá aceder-lhes.
          </p>
          
          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-2xl">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Estado</p>
              <p className="text-[#22c55e] font-bold">Protegido</p>
            </div>
            <div className="bg-black/30 p-4 rounded-2xl">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Sincronização</p>
              <p className="text-blue-400 font-bold">Ativa</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4 items-start">
          <i className="fa-solid fa-circle-info text-blue-400 mt-1"></i>
          <p className="text-xs text-blue-200 leading-relaxed">
            Estamos a migrar as ferramentas de gestão (Contas, Orçamentos, etc.) para a sua nova base de dados privada. Em breve poderá gerir tudo aqui!
          </p>
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
