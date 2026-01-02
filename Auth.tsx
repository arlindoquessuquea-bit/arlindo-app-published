import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-white/10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-accent-green rounded-2xl flex items-center justify-center text-black text-3xl">
            <i className="fa-solid fa-wallet"></i>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Arlindo App</h1>
        <p className="text-text-secondary text-center mb-8">
          {isSignUp ? 'Crie a sua conta privada' : 'Inicie sessão para aceder aos seus dados'}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 ml-1 uppercase">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-accent-green transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 ml-1 uppercase">Palavra-passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-accent-green transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent-green text-black font-bold py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'A processar...' : (isSignUp ? 'Registar' : 'Entrar')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-accent-green font-bold hover:underline"
          >
            {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Registe-se agora'}
          </button>
        </div>
      </div>
    </div>
  );
};
