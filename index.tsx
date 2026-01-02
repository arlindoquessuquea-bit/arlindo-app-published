
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- Tipos & Interfaces (conforme especificação) ---
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
  accountId: string; // Conta de origem (débito) para EXPENSE/TRANSFER, conta de destino (crédito) para INCOME
  toAccountId?: string; // Conta de destino (crédito) apenas para TRANSFER
  amount: number;
  type: TransactionType;
  categoryId?: string; // Alterado para categoryId para integridade de dados
  date: string;
  note: string;
  recurrenceRule?: string;
  receiptFile?: string;
}

interface Budget extends BaseItem {
  categoryId: string; // Alterado para categoryId
  limit: number;
}

// --- Novas Interfaces de Configuração e Categoria ---
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
const STORAGE_VERSION = 'v12'; // Version bump for data model change
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentação', icon: 'fa-utensils', color: 'bg-orange-500', type: 'EXPENSE' }, { id: 'cat-2', name: 'Transporte', icon: 'fa-car', color: 'bg-blue-500', type: 'EXPENSE' }, { id: 'cat-3', name: 'Lazer', icon: 'fa-gamepad', color: 'bg-purple-500', type: 'EXPENSE' }, { id: 'cat-4', name: 'Saúde', icon: 'fa-heart-pulse', color: 'bg-rose-500', type: 'EXPENSE' }, { id: 'cat-5', name: 'Educação', icon: 'fa-graduation-cap', color: 'bg-indigo-500', type: 'EXPENSE' }, { id: 'cat-6', name: 'Moradia', icon: 'fa-house', color: 'bg-emerald-500', type: 'EXPENSE' }, { id: 'cat-7', name: 'Compras', icon: 'fa-bag-shopping', color: 'bg-pink-500', type: 'EXPENSE' }, { id: 'cat-8', name: 'Serviços', icon: 'fa-wrench', color: 'bg-amber-500', type: 'EXPENSE' }, { id: 'cat-9', name: 'Assinaturas', icon: 'fa-tv', color: 'bg-red-500', type: 'EXPENSE' }, { id: 'cat-10', name: 'Internet', icon: 'fa-wifi', color: 'bg-cyan-500', type: 'EXPENSE' }, { id: 'cat-11', name: 'Presentes', icon: 'fa-gift', color: 'bg-violet-500', type: 'EXPENSE' }, { id: 'cat-12', name: 'Viagens', icon: 'fa-plane', color: 'bg-sky-500', type: 'EXPENSE' }, { id: 'cat-13', name: 'Renda', icon: 'fa-money-bill-trend-up', color: 'bg-green-500', type: 'INCOME' }, { id: 'cat-14', name: 'Investimento', icon: 'fa-chart-line', color: 'bg-teal-500', type: 'INCOME' }, { id: 'cat-15', name: 'Outros', icon: 'fa-ellipsis', color: 'bg-slate-500', type: 'EXPENSE' },
];
const CURRENCIES: Currency[] = [ { code: 'AOA', name: 'Kwanza Angolano', symbol: 'Kz', flag: '🇦🇴', decimalPlaces: 2 }, { code: 'USD', name: 'Dólar Americano', symbol: '$', flag: '🇺🇸', decimalPlaces: 2 }, { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimalPlaces: 2 }, { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', flag: '🇧🇷', decimalPlaces: 2 }, { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧', decimalPlaces: 2 }, { code: 'JPY', name: 'Iene Japonês', symbol: '¥', flag: '🇯🇵', decimalPlaces: 0 }, ];
const DEFAULT_SETTINGS: AppSettings = { defaultCurrencyCode: 'AOA', fab: { visible: true, defaultType: 'EXPENSE', }, hideValues: false, };

// --- Dados de Simulação ---
const MOCK_ACCOUNTS: Account[] = [ { id: 'acc1', name: 'Carteira', initialBalance: 75000, icon: 'fa-wallet', color: 'bg-yellow-500' }, { id: 'acc2', name: 'Banco BIC', initialBalance: 800000, icon: 'fa-building-columns', color: 'bg-red-500' }, { id: 'acc3', name: 'Conta de Entrada', initialBalance: 0, icon: 'fa-arrow-down', color: 'bg-emerald-500' }, ];
const MOCK_TRANSACTIONS: Transaction[] = [ { id: 't1', accountId: 'acc3', toAccountId: 'acc2', amount: 450000, type: 'TRANSFER', date: '2023-10-01', note: 'Salário Mensal' }, { id: 't2', accountId: 'acc2', amount: 120000, type: 'EXPENSE', categoryId: 'cat-6', date: '2023-10-02', note: 'Aluguer' }, { id: 't3', accountId: 'acc1', amount: 25000, type: 'EXPENSE', categoryId: 'cat-1', date: '2023-10-03', note: 'Supermercado' }, { id: 't4', accountId: 'acc2', amount: 50000, type: 'INCOME', categoryId: 'cat-13', date: '2023-10-05', note: 'Freelance' }, ];
const MOCK_BUDGETS: Budget[] = [ { id: 'b1', categoryId: 'cat-1', limit: 100000 }, { id: 'b2', categoryId: 'cat-2', limit: 50000 } ];

// --- Sub-componentes (definidos fora do App para performance) ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: {isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string}) => {
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

const AlertModal = ({ isOpen, onClose, title, message }: {isOpen: boolean, onClose: () => void, title: string, message: string}) => {
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

const SubscriptionModal = ({ isOpen, onClose }: {isOpen: boolean, onClose: () => void}) => {
    if (!isOpen) return null;
    return (
         <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end animate-fade-in">
            <div className="w-full max-w-lg mx-auto bg-bg-card rounded-t-3xl p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"><i className="fa-solid fa-crown mr-2"></i>KwanzaControl Pro</h3>
                    <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full">&times;</button>
                </div>
                <div className="space-y-4 text-center py-4">
                    <p className="text-lg">Desbloqueie todo o potencial da sua gestão financeira.</p>
                    <ul className="space-y-3 text-left text-sm p-4 bg-black rounded-2xl">
                        <li className="flex items-center gap-3"><i className="fa-solid fa-check-circle text-accent-green"></i>Contas e Orçamentos Ilimitados</li>
                        <li className="flex items-center gap-3"><i className="fa-solid fa-check-circle text-accent-green"></i>Sincronização na Nuvem (iCloud)</li>
                        <li className="flex items-center gap-3"><i className="fa-solid fa-check-circle text-accent-green"></i>Relatórios Avançados e Previsões</li>
                        <li className="flex items-center gap-3"><i className="fa-solid fa-check-circle text-accent-green"></i>Mais Ícones e Cores de Personalização</li>
                    </ul>
                </div>
                <button style={{ backgroundColor: 'var(--accent-green)'}} className="w-full py-4 text-black rounded-xl font-bold">Tornar-se Pro</button>
            </div>
        </div>
    );
};


const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-green"></div>
    </label>
);

const AccountDetailView = ({ accountId, accounts, transactions, categories, formatCurrency, onBack, onDeleteTransaction, onEditTransaction, onDeleteAccountHistory }: any) => {
    const account = accounts.find((acc: any) => acc.id === accountId);
    if (!account) return null;
    const accountTransactions = transactions.filter((t: any) => !t.isDeleted && (t.accountId === accountId || t.toAccountId === accountId)).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (<div className="animate-fade-in"><div className="flex items-center gap-4 mb-6 px-2"><button onClick={onBack} className="w-10 h-10 rounded-full bg-bg-card hover:bg-white/10 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-chevron-left"></i></button><div><h2 className="text-xl font-bold">{account.name}</h2><p className="text-sm text-text-secondary">Saldo Atual</p></div></div><div className="glass-card p-4 rounded-2xl text-center mb-6"><p className="text-3xl font-bold">{formatCurrency(account.balance)}</p></div><div className="space-y-3"><div className="flex justify-between items-center px-2"><h3 className="font-bold text-lg">Histórico de Transações</h3>{accountTransactions.length > 0 && (<button onClick={() => onDeleteAccountHistory(accountId)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button>)}</div>{accountTransactions.length > 0 ? (accountTransactions.map((t: any) => ( <TransactionItem key={t.id} transaction={t} accounts={accounts} categories={categories} formatCurrency={formatCurrency} onDelete={onDeleteTransaction} onEdit={() => onEditTransaction(t)} contextAccountId={accountId} /> ))) : (<div className="text-center py-10 text-text-secondary"><i className="fa-solid fa-receipt text-3xl mb-4"></i><p>Nenhuma transação nesta conta.</p></div>)}</div></div>);
};
const DateSelector = ({ currentDate, changeMonth, currency }: any) => ( <div className="flex items-center justify-center gap-4 text-center glass-card p-3 rounded-xl"><button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full hover:bg-white/10"><i className="fa-solid fa-chevron-left"></i></button><div className="w-40"><p className="font-bold text-lg">{currentDate.toLocaleString('pt-AO', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</p><p className="text-xs text-text-secondary">{currency.flag} {currency.code}</p></div><button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full hover:bg-white/10"><i className="fa-solid fa-chevron-right"></i></button></div> );
const TransactionItem = ({ transaction, accounts, categories, formatCurrency, onDelete, onEdit, contextAccountId }: any) => {
    const account = accounts.find((a: any) => a.id === transaction.accountId);
    const toAccount = accounts.find((a: any) => a.id === transaction.toAccountId);
    const categoryInfo = categories.find((c: any) => c.id === transaction.categoryId);
    let icon = categoryInfo?.icon || 'fa-exchange-alt', color = categoryInfo?.color || 'bg-blue-500', sign = transaction.type === 'EXPENSE' ? '-' : '+', textColor = transaction.type === 'EXPENSE' ? 'text-text-primary' : 'text-accent-green';
    if (contextAccountId) { if (transaction.type === 'TRANSFER') { if (transaction.accountId === contextAccountId) { sign = '-'; textColor = 'text-text-primary'; } else { sign = '+'; textColor = 'text-accent-green'; } } } else { if (transaction.type === 'TRANSFER') { sign = ''; textColor = 'text-accent-blue'; } }
    
    const hasTime = transaction.date.includes('T');
    const safeDate = new Date(hasTime ? transaction.date : transaction.date + 'T00:00:00');

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        ...(hasTime && { hour: '2-digit', minute: '2-digit', hour12: false })
    };

    const formattedDate = safeDate.toLocaleString('pt-AO', options)
        .replace(',', ' às')
        .replace('.', '');


    return (
        <div className="glass-card p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <i className={`fa-solid ${icon}`}></i>
                </div>
                <div className="truncate">
                    <p className="font-bold text-sm truncate">{transaction.note || categoryInfo?.name || 'Transferência'}</p>
                    <p className="text-xs text-text-secondary truncate">
                        {transaction.type === 'TRANSFER' ? `${account?.name} → ${toAccount?.name}` : account?.name}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
                <div className="text-right">
                    <p className={`font-bold text-sm ${textColor}`}>{sign}{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-text-secondary whitespace-nowrap">{formattedDate}</p>
                </div>
                {onDelete && (
                    <>
                        <button onClick={onEdit} className="w-8 h-8 rounded-full text-text-secondary hover:bg-blue-500/10 hover:text-blue-400 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-pencil text-sm"></i></button>
                        <button onClick={() => onDelete(transaction.id)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-trash-can text-sm"></i></button>
                    </>
                )}
            </div>
        </div>
    );
};
const NavIcon = ({ active, icon, label, onClick }: any) => (<button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all w-16 ${active ? 'text-accent-green' : 'text-text-secondary'}`}><i className={`fa-solid ${icon} text-xl`}></i><span className="text-[10px] font-bold">{label}</span></button>);
const SettingsItem = ({ icon, label, value, onClick }: any) => (<div onClick={onClick} className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer"><div className="flex items-center gap-4"><i className={`fa-solid ${icon} text-text-secondary w-5`}></i><span className="text-sm font-bold">{label}</span></div><div className="flex items-center gap-2"><span className="text-sm text-text-secondary">{value}</span><i className="fa-solid fa-chevron-right text-xs text-slate-600"></i></div></div>);
const DonutChart = ({ data, total, title, formatCurrency }: any) => {
    if (total === 0) return <div className="text-center text-text-secondary py-10">Sem dados para exibir.</div>;
    const radius = 60, circumference = 2 * Math.PI * radius; let offset = 0; const colors = ['#4A90E2', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#a855f7', '#ec4899'];
    return (<div className="flex flex-col items-center"><div className="relative w-40 h-40"><svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">{data.map(({ amount }:any, index:number) => { const dasharray = (amount / total) * circumference; const segment = <circle key={index} r={radius} cx="75" cy="75" fill="transparent" strokeWidth="20" stroke={colors[index % colors.length]} strokeDasharray={`${dasharray} ${circumference}`} strokeDashoffset={-offset} />; offset += dasharray; return segment; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-text-secondary">{title}</span><span className="text-xl font-bold">{formatCurrency(total)}</span></div></div></div>);
};
const StatCard = ({ title, value, icon, colorClass, comparison }: { title: string, value: string, icon: string, colorClass?: string, comparison?: { value: string, color: string } }) => (
    <div className="glass-card p-4 rounded-2xl flex-1">
        <p className="text-xs text-text-secondary uppercase">{title}</p>
        <div className={`flex items-center gap-2 mt-1 ${colorClass || ''}`}>
            <i className={`fa-solid ${icon}`}></i>
            <p className="text-xl font-bold">{value}</p>
        </div>
        {comparison && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${comparison.color}`}>
                <i className={`fa-solid ${comparison.value.startsWith('+') ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                <span>{comparison.value} vs. mês anterior</span>
            </div>
        )}
    </div>
);

const BarChart = ({ income, expense, formatCurrency }: { income: number, expense: number, formatCurrency: (value: number) => string }) => {
    const max = Math.max(income, expense, 1);
    const incomeHeight = (income / max) * 100;
    const expenseHeight = (expense / max) * 100;
  
    return (
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="font-bold mb-4">Fluxo de Caixa Mensal</h3>
        <div className="flex justify-around items-end h-40 gap-4">
          <div className="flex flex-col items-center w-1/3 text-center">
            <p className="text-xs font-bold text-accent-green">{formatCurrency(income)}</p>
            <div className="w-10 bg-accent-green/30 rounded-t-lg mt-2 flex-grow self-end" style={{ height: `${incomeHeight}%` }}></div>
            <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold">Renda</p>
          </div>
          <div className="flex flex-col items-center w-1/3 text-center">
            <p className="text-xs font-bold text-accent-red">{formatCurrency(expense)}</p>
            <div className="w-10 bg-accent-red/30 rounded-t-lg mt-2 flex-grow self-end" style={{ height: `${expenseHeight}%` }}></div>
            <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold">Despesa</p>
          </div>
        </div>
      </div>
    );
};

const TopCategoriesList = ({ categories, allCategories, totalExpense, formatCurrency }: { categories: { name: string, amount: number }[], allCategories: Category[], totalExpense: number, formatCurrency: (value: number) => string }) => {
    const categoryDetails = categories.map(c => {
      const detail = allCategories.find(ac => ac.name === c.name);
      return { ...c, ...detail };
    });
    if (categories.length === 0) return null;
    return (
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="font-bold mb-4">Principais Categorias de Despesa</h3>
        <div className="space-y-4">
          {categoryDetails.slice(0, 5).map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                <i className={`fa-solid ${cat.icon}`}></i>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold truncate">{cat.name}</span>
                  <span className="font-bold">{formatCurrency(cat.amount)}</span>
                </div>
                <ProgressBar current={cat.amount} total={totalExpense} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
};

const TrendChart = ({ data, formatCurrency }: { data: { month: string, income: number, expense: number }[], formatCurrency: (value: number) => string }) => {
    if (!data || data.length === 0) {
      return (
        <div className="glass-card p-5 rounded-2xl text-center text-text-secondary">
          Dados insuficientes para mostrar a tendência.
        </div>
      );
    }
  
    const maxAmount = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
    const width = 300;
    const height = 150;
    const padding = 20;
  
    const pointsToPath = (points: [number, number][]) => {
      if (points.length === 0) return "";
      let path = `M ${points[0][0]} ${points[0][1]}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i][0]} ${points[i][1]}`;
      }
      return path;
    };
  
    const incomePoints: [number, number][] = data.map((d, i) => [
      (i / (data.length - 1)) * (width - 2 * padding) + padding,
      height - padding - (d.income / maxAmount) * (height - 2 * padding)
    ]);
  
    const expensePoints: [number, number][] = data.map((d, i) => [
      (i / (data.length - 1)) * (width - 2 * padding) + padding,
      height - padding - (d.expense / maxAmount) * (height - 2 * padding)
    ]);
  
    return (
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="font-bold mb-4">Tendência dos Últimos 6 Meses</h3>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Y-Axis labels */}
          <text x="0" y={padding} fontSize="10" fill="var(--text-secondary)">{formatCurrency(maxAmount).replace(/\s.*$/, '')}</text>
          <text x="0" y={height - padding + 3} fontSize="10" fill="var(--text-secondary)">0</text>
  
          {/* X-Axis labels */}
          {data.map((d, i) => (
            <text key={d.month} x={(i / (data.length - 1)) * (width - 2 * padding) + padding} y={height} fontSize="10" fill="var(--text-secondary)" textAnchor="middle">
              {d.month}
            </text>
          ))}
  
          {/* Lines */}
          <path d={pointsToPath(incomePoints)} fill="none" stroke="var(--accent-green)" strokeWidth="2" />
          <path d={pointsToPath(expensePoints)} fill="none" stroke="var(--accent-red)" strokeWidth="2" />
        </svg>
      </div>
    );
};

const TransactionModal = ({ onClose, onSave, accounts, categories, initialState }: any) => {
  const isEditMode = !!initialState?.id;
  const [type, setType] = useState<TransactionType>(initialState?.type || 'EXPENSE');
  const [accountId, setAccountId] = useState<string>(initialState?.accountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(initialState?.toAccountId || accounts[1]?.id || '');
  const [amount, setAmount] = useState<string>(initialState?.amount ? String(initialState.amount) : '');
  const [categoryId, setCategoryId] = useState<string>(initialState?.categoryId || categories.find((c: any) => c.type === (initialState?.type || 'EXPENSE'))?.id || '');
  const [note, setNote] = useState(initialState?.note || '');
  const [date, setDate] = useState(() => {
    if (initialState?.date) {
        return initialState.date.includes('T') ? initialState.date.slice(0, 16) : `${initialState.date}T09:00`;
    }
    const d = new Date();
    const tzoffset = d.getTimezoneOffset() * 60000; // In milliseconds
    return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
  });
  
  useEffect(() => {
    if (!isEditMode) {
      setCategoryId(categories.find((c: any) => c.type === type)?.id || '');
    }
  }, [type, categories, isEditMode]);

  const resetForm = () => { 
      setType('EXPENSE'); 
      setAccountId(accounts[0]?.id || ''); 
      setToAccountId(accounts[1]?.id || ''); 
      setAmount(''); 
      setCategoryId(categories.find((c: any) => c.type === 'EXPENSE')?.id || ''); 
      setNote(''); 
      const d = new Date();
      const tzoffset = d.getTimezoneOffset() * 60000;
      setDate(new Date(d.getTime() - tzoffset).toISOString().slice(0, 16));
  };
  const handleSave = (closeAfterSave: boolean) => {
    if (!amount || !accountId || (type === 'TRANSFER' && !toAccountId)) return;
    const txData = { id: initialState?.id, amount: parseFloat(amount), type, categoryId: type !== 'TRANSFER' ? categoryId : undefined, note, date, accountId, toAccountId: type === 'TRANSFER' ? toAccountId : undefined };
    onSave(txData);
    if(closeAfterSave) { onClose(); } else { resetForm(); }
  };
  return ( <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end animate-fade-in"><div className="w-full max-w-lg mx-auto bg-bg-card rounded-t-3xl p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar"><div className="flex justify-between items-center"><h3 className="text-xl font-bold">{isEditMode ? 'Editar Transação' : 'Adicionar Transação'}</h3><button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full">&times;</button></div><div className="grid grid-cols-3 bg-black p-1 rounded-full"><button onClick={() => setType('EXPENSE')} className={`py-2 rounded-full font-bold text-sm ${type === 'EXPENSE' ? 'bg-accent-red' : ''}`}>Despesa</button><button onClick={() => setType('INCOME')} className={`py-2 rounded-full font-bold text-sm ${type === 'INCOME' ? 'bg-accent-green text-black' : ''}`}>Renda</button><button onClick={() => setType('TRANSFER')} className={`py-2 rounded-full font-bold text-sm ${type === 'TRANSFER' ? 'bg-accent-blue' : ''}`}>Transferir</button></div><input autoFocus type="number" placeholder="0,00 AOA" className="w-full bg-black p-4 rounded-xl text-4xl font-bold text-center border-2 border-transparent focus:border-accent-green outline-none" value={amount} onChange={e => setAmount(e.target.value)} /><div className="space-y-3"><select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-black p-3 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none"><option value="">{type === 'INCOME' ? 'Para a Conta' : 'Da Conta'}</option>{accounts.map((acc: any) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>{type === 'TRANSFER' && <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full bg-black p-3 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none"><option value="">Para a Conta</option>{accounts.filter((a: any) => a.id !== accountId).map((acc: any) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select>}</div>{type !== 'TRANSFER' && <div className="grid grid-cols-4 gap-2">{categories.filter((c: any) => c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE')).map((cat: any) => (<button key={cat.id} onClick={() => setCategoryId(cat.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 ${categoryId === cat.id ? 'border-accent-green bg-green-500/10' : 'border-transparent'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color}`}><i className={`fa-solid ${cat.icon}`}></i></div><span className="text-[9px] font-bold uppercase">{cat.name}</span></button>))}</div>}
      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black p-3 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" style={{ colorScheme: 'dark' }} />
      <input type="text" placeholder="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-black p-3 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" /><div className="flex gap-3">{!isEditMode && <button onClick={() => handleSave(false)} className="w-full py-4 bg-white/10 rounded-xl font-bold">Guardar e Adicionar Outro</button>}<button onClick={() => handleSave(true)} style={{ backgroundColor: 'var(--accent-green)' }} className="w-full py-4 text-black rounded-xl font-bold disabled:opacity-50">{isEditMode ? 'Guardar Alterações' : 'Guardar'}</button></div></div></div> );
};
const BudgetModal = ({ onClose, onSave, categories, initialState, existingBudgets }: any) => {
    const isEditMode = !!initialState; const [categoryId, setCategoryId] = useState<string>(isEditMode ? initialState.categoryId : ''); const [limit, setLimit] = useState<string>(isEditMode ? String(initialState.limit) : '');
    const availableCategories = categories.filter((c: any) => c.type === 'EXPENSE' && (!existingBudgets.some((b: any) => b.categoryId === c.id) || (isEditMode && initialState.categoryId === c.id)));
    const handleSave = () => { if (!categoryId || !limit || parseFloat(limit) <= 0) return; onSave({ id: initialState?.id, categoryId, limit: parseFloat(limit) }); };
    return (<div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end animate-fade-in"><div className="w-full max-w-lg mx-auto bg-bg-card rounded-t-3xl p-6 space-y-5 animate-slide-up max-h-[90vh]"><div className="flex justify-between items-center"><h3 className="text-xl font-bold">{isEditMode ? 'Editar Orçamento' : 'Novo Orçamento'}</h3><button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full">&times;</button></div><div className="space-y-4"><div><label className="text-sm font-bold text-text-secondary">Categoria</label><select value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={isEditMode} className="w-full bg-black p-3 mt-1 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none disabled:opacity-50">{isEditMode ? <option value={categoryId}>{categories.find((c:any) => c.id === categoryId)?.name}</option> : <option value="">Selecione...</option>}{availableCategories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div><div><label className="text-sm font-bold text-text-secondary">Limite Mensal</label><input type="number" placeholder="0,00 AOA" value={limit} onChange={e => setLimit(e.target.value)} className="w-full bg-black p-3 mt-1 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" /></div></div><button onClick={handleSave} style={{ backgroundColor: 'var(--accent-green)' }} className="w-full py-4 text-black rounded-xl font-bold mt-4">{isEditMode ? 'Guardar Alterações' : 'Criar Orçamento'}</button></div></div>);
};
const AccountModal = ({ onClose, onSave, initialState }: any) => {
    const isEditMode = !!initialState; const [name, setName] = useState(isEditMode ? initialState.name : ''); const [initialBalance, setInitialBalance] = useState(isEditMode ? String(initialState.initialBalance) : ''); const [icon, setIcon] = useState(isEditMode ? initialState.icon : 'fa-wallet'); const [color, setColor] = useState(isEditMode ? initialState.color : 'bg-yellow-500');
    const ICONS = ['fa-wallet', 'fa-building-columns', 'fa-credit-card', 'fa-piggy-bank', 'fa-sack-dollar', 'fa-car', 'fa-house', 'fa-plane']; const COLORS = ['bg-yellow-500', 'bg-red-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const handleSave = () => { if (!name.trim()) return; onSave({ id: initialState?.id, name, initialBalance: parseFloat(initialBalance) || 0, icon, color }); };
    return (<div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end animate-fade-in"><div className="w-full max-w-lg mx-auto bg-bg-card rounded-t-3xl p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar"><div className="flex justify-between items-center"><h3 className="text-xl font-bold">{isEditMode ? 'Editar Conta' : 'Nova Conta'}</h3><button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full">&times;</button></div><div className="space-y-4"><div><label className="text-sm font-bold text-text-secondary">Nome da Conta</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black p-3 mt-1 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" /></div><div><label className="text-sm font-bold text-text-secondary">Saldo Inicial</label><input type="number" placeholder="0,00 AOA" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full bg-black p-3 mt-1 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" /></div><div><label className="text-sm font-bold text-text-secondary mb-2 block">Ícone</label><div className="grid grid-cols-8 gap-2">{ICONS.map(i => <button key={i} onClick={() => setIcon(i)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${icon === i ? 'bg-accent-green text-black' : 'bg-black'}`}><i className={`fa-solid ${i}`}></i></button>)}</div></div><div><label className="text-sm font-bold text-text-secondary mb-2 block">Cor</label><div className="grid grid-cols-8 gap-2">{COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-10 h-10 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-white' : ''}`}></button>)}</div></div></div><button onClick={handleSave} style={{ backgroundColor: 'var(--accent-green)' }} className="w-full py-4 text-black rounded-xl font-bold mt-4">{isEditMode ? 'Guardar Alterações' : 'Criar Conta'}</button></div></div>);
};
const SettingsModal = ({ onClose, settings, onSettingsChange }: any) => {
    const [view, setView] = useState('main'); // 'main', 'currency'
    const [searchTerm, setSearchTerm] = useState('');
    const updateSettings = (key: keyof AppSettings, value: any) => { onSettingsChange((prev: AppSettings) => ({ ...prev, [key]: value })); };
    const updateFabSettings = (key: keyof FabSettings, value: any) => { updateSettings('fab', { ...settings.fab, [key]: value }); };
    const selectedCurrency = CURRENCIES.find(c => c.code === settings.defaultCurrencyCode) || CURRENCIES[0];
    if (view === 'currency') {
        const filteredCurrencies = CURRENCIES.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()));
        return (<div className="fixed inset-0 z-[101] bg-black flex flex-col max-w-lg mx-auto animate-fade-in"><header className="p-4 flex items-center gap-4 border-b border-white/10"><button onClick={() => setView('main')} className="w-10 h-10 rounded-full bg-bg-card hover:bg-white/10 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button><h3 className="text-xl font-bold">Moeda Predefinida</h3></header><div className="p-4"><input type="text" placeholder="Pesquisar por nome ou código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-bg-card p-3 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" /></div><div className="flex-1 overflow-y-auto no-scrollbar"><div className="divide-y divide-white/10">{filteredCurrencies.map(c => (<div key={c.code} onClick={() => { updateSettings('defaultCurrencyCode', c.code); setView('main'); }} className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer"><div className="flex items-center gap-4"><span className="text-2xl">{c.flag}</span><div><p className="font-bold">{c.name}</p><p className="text-xs text-text-secondary">{c.code}</p></div></div>{settings.defaultCurrencyCode === c.code && <i className="fa-solid fa-check text-accent-green"></i>}</div>))}</div></div></div>);
    }
    return (<div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-lg mx-auto animate-fade-in"><header className="p-4 flex items-center justify-between border-b border-white/10"><h3 className="text-xl font-bold">Configurações</h3><button onClick={onClose} className="w-10 h-10 rounded-full bg-bg-card hover:bg-white/10 flex items-center justify-center"><i className="fa-solid fa-times"></i></button></header><div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6"><div className="space-y-2"><p className="font-bold text-text-secondary text-sm px-2">MOEDA</p><div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10"><SettingsItem icon="fa-coins" label="Moeda Predefinida" value={`${selectedCurrency.flag} ${selectedCurrency.code}`} onClick={() => setView('currency')} /></div></div><div className="space-y-2"><p className="font-bold text-text-secondary text-sm px-2">BOTÃO FLUTUANTE</p><div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10"><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><i className="fa-solid fa-plus-circle text-text-secondary w-5"></i><span className="text-sm font-bold">Mostrar Botão</span></div><ToggleSwitch checked={settings.fab.visible} onChange={e => updateFabSettings('visible', e.target.checked)} /></div><div className="p-4 flex flex-col gap-2"><label className="text-sm font-bold">Tipo Padrão</label><div className="grid grid-cols-2 bg-black p-1 rounded-full"><button onClick={() => updateFabSettings('defaultType', 'EXPENSE')} className={`py-2 rounded-full font-bold text-sm ${settings.fab.defaultType === 'EXPENSE' ? 'bg-accent-red' : ''}`}>Despesa</button><button onClick={() => updateFabSettings('defaultType', 'INCOME')} className={`py-2 rounded-full font-bold text-sm ${settings.fab.defaultType === 'INCOME' ? 'bg-accent-green text-black' : ''}`}>Renda</button></div></div></div></div><div className="space-y-2"><p className="font-bold text-text-secondary text-sm px-2">PRIVACIDADE</p><div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10"><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><i className="fa-solid fa-eye-slash text-text-secondary w-5"></i><span className="text-sm font-bold">Ocultar Valores</span></div><ToggleSwitch checked={settings.hideValues} onChange={e => updateSettings('hideValues', e.target.checked)} /></div></div></div></div></div>);
};
const CategoryManagementModal = ({ onClose, categories, onSave, onDelete }: any) => {
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const handleSave = (catData: Omit<Category, 'id'> & { id?: string }) => { onSave(catData); setEditingCategory(null); };
    if (editingCategory) { return <CategoryEditModal category={editingCategory} onSave={handleSave} onClose={() => setEditingCategory(null)} />; }
    const expenseCategories = categories.filter((c: Category) => c.type === 'EXPENSE');
    const incomeCategories = categories.filter((c: Category) => c.type === 'INCOME');
    return (<div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-lg mx-auto animate-fade-in"><header className="p-4 flex items-center justify-between border-b border-white/10"><h3 className="text-xl font-bold">Gerir Categorias</h3><button onClick={onClose} className="w-10 h-10 rounded-full bg-bg-card hover:bg-white/10 flex items-center justify-center"><i className="fa-solid fa-times"></i></button></header><div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6"><div><h4 className="font-bold text-text-secondary text-sm px-2 mb-2">DESPESA</h4><div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10">{expenseCategories.map((cat: Category) => (<div key={cat.id} className="p-3 flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color}`}><i className={`fa-solid ${cat.icon}`}></i></div><span className="font-bold text-sm">{cat.name}</span></div><div className="flex items-center gap-1"><button onClick={() => setEditingCategory(cat)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-blue-500/10 hover:text-blue-400 flex items-center justify-center"><i className="fa-solid fa-pencil text-sm"></i></button><button onClick={() => onDelete(cat.id)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button></div></div>))}</div></div><div><h4 className="font-bold text-text-secondary text-sm px-2 mb-2">RENDA</h4><div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10">{incomeCategories.map((cat: Category) => (<div key={cat.id} className="p-3 flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color}`}><i className={`fa-solid ${cat.icon}`}></i></div><span className="font-bold text-sm">{cat.name}</span></div><div className="flex items-center gap-1"><button onClick={() => setEditingCategory(cat)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-blue-500/10 hover:text-blue-400 flex items-center justify-center"><i className="fa-solid fa-pencil text-sm"></i></button><button onClick={() => onDelete(cat.id)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button></div></div>))}</div></div><button onClick={() => setEditingCategory({} as Category)} style={{ backgroundColor: 'var(--accent-green)' }} className="w-full py-3 text-black rounded-xl font-bold"><i className="fa-solid fa-plus mr-2"></i>Adicionar Categoria</button></div></div>);
};
const CategoryEditModal = ({ category, onSave, onClose }: any) => {
    const isEditMode = !!category.id;
    const [name, setName] = useState(isEditMode ? category.name : '');
    const [icon, setIcon] = useState(isEditMode ? category.icon : 'fa-tag');
    const [color, setColor] = useState(isEditMode ? category.color : 'bg-slate-500');
    const [type, setType] = useState<'EXPENSE' | 'INCOME'>(isEditMode ? category.type : 'EXPENSE');
    const ICONS = ['fa-tag', 'fa-utensils', 'fa-car', 'fa-gamepad', 'fa-heart-pulse', 'fa-graduation-cap', 'fa-house', 'fa-bag-shopping', 'fa-wrench', 'fa-tv', 'fa-wifi', 'fa-gift', 'fa-plane', 'fa-money-bill-trend-up', 'fa-chart-line', 'fa-ellipsis'];
    const COLORS = ['bg-slate-500', 'bg-yellow-500', 'bg-red-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const handleSave = () => { if (!name.trim()) return; onSave({ id: category.id, name, icon, color, type }); };
    return (<div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in"><div className="w-full max-w-sm mx-auto bg-bg-card rounded-3xl p-6 space-y-5 animate-slide-up"><div className="flex justify-between items-center"><h3 className="text-xl font-bold">{isEditMode ? 'Editar Categoria' : 'Nova Categoria'}</h3><button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full">&times;</button></div><div className="space-y-4"><div className="grid grid-cols-2 bg-black p-1 rounded-full"><button onClick={() => setType('EXPENSE')} className={`py-2 rounded-full font-bold text-sm ${type === 'EXPENSE' ? 'bg-accent-red' : ''}`}>Despesa</button><button onClick={() => setType('INCOME')} className={`py-2 rounded-full font-bold text-sm ${type === 'INCOME' ? 'bg-accent-green text-black' : ''}`}>Renda</button></div><div><label className="text-sm font-bold text-text-secondary">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black p-3 mt-1 rounded-xl text-sm border-2 border-transparent focus:border-accent-green outline-none" /></div><div><label className="text-sm font-bold text-text-secondary mb-2 block">Ícone</label><div className="grid grid-cols-8 gap-2">{ICONS.map(i => <button key={i} onClick={() => setIcon(i)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${icon === i ? 'bg-accent-green text-black' : 'bg-black'}`}><i className={`fa-solid ${i}`}></i></button>)}</div></div><div><label className="text-sm font-bold text-text-secondary mb-2 block">Cor</label><div className="grid grid-cols-8 gap-2">{COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-10 h-10 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-white' : ''}`}></button>)}</div></div></div><button onClick={handleSave} style={{ backgroundColor: 'var(--accent-green)' }} className="w-full py-4 text-black rounded-xl font-bold mt-4">{isEditMode ? 'Guardar' : 'Criar'}</button></div></div>);
};
const ProgressBar = ({ current, total }: any) => { const perc = total > 0 ? Math.min((current / total) * 100, 100) : 0; return (<div className="w-full h-2 bg-black rounded-full"><div className={`h-full rounded-full ${perc >= 100 ? 'bg-accent-red' : 'bg-accent-green'}`} style={{ width: `${perc}%` }}></div></div>); };

const TrashView = ({ items, onRestore, onPermanentlyDelete, onEmptyTrash, onBack }: any) => {
    const { transactions, accounts, budgets } = items;
    const isEmpty = transactions.length === 0 && accounts.length === 0 && budgets.length === 0;

    const TrashItem = ({ item, type, name, onRestore, onPermanentlyDelete }: any) => (
        <div className="glass-card p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{name}</p>
                <p className="text-xs text-text-secondary capitalize">{type}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
                <button onClick={() => onRestore(item.id, type)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-green-500/10 hover:text-green-400 flex items-center justify-center"><i className="fa-solid fa-undo text-sm"></i></button>
                <button onClick={() => onPermanentlyDelete(item.id, type)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-alt text-sm"></i></button>
            </div>
        </div>
    );
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6 px-2">
                 <button onClick={onBack} className="w-10 h-10 rounded-full bg-bg-card hover:bg-white/10 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-chevron-left"></i></button>
                 <button onClick={onEmptyTrash} disabled={isEmpty} className="px-4 py-2 bg-accent-red rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">Esvaziar Lixo</button>
            </div>
            {isEmpty ? (
                 <div className="text-center py-20 text-text-secondary"><i className="fa-solid fa-trash-can text-4xl mb-4"></i><p className="font-bold">O lixo está vazio.</p></div>
            ) : (
                <div className="space-y-6">
                    {transactions.length > 0 && <div className="space-y-3"><h3 className="font-bold text-lg px-2">Transações Eliminadas</h3>{transactions.map((t: Transaction) => <TrashItem key={t.id} item={t} type="transaction" name={t.note || `Transação de ${t.amount}`} onRestore={onRestore} onPermanentlyDelete={onPermanentlyDelete} />)}</div>}
                    {accounts.length > 0 && <div className="space-y-3"><h3 className="font-bold text-lg px-2">Contas Eliminadas</h3>{accounts.map((a: Account) => <TrashItem key={a.id} item={a} type="account" name={a.name} onRestore={onRestore} onPermanentlyDelete={onPermanentlyDelete} />)}</div>}
                    {budgets.length > 0 && <div className="space-y-3"><h3 className="font-bold text-lg px-2">Orçamentos Eliminados</h3>{budgets.map((b: Budget) => <TrashItem key={b.id} item={b} type="budget" name={`Orçamento para ${b.categoryId}`} onRestore={onRestore} onPermanentlyDelete={onPermanentlyDelete} />)}</div>}
                </div>
            )}
        </div>
    );
};


const App = () => {
  const [view, setView] = useState<AppView>('Começo');
  const [modalConfig, setModalConfig] = useState<{ type: ModalType, data?: any } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, onConfirm: () => {}, title: '', message: '' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(localStorage.getItem(`kc_settings_${STORAGE_VERSION}`) || 'null') || DEFAULT_SETTINGS);
  const [accounts, setAccounts] = useState<Account[]>(() => JSON.parse(localStorage.getItem(`kc_accounts_${STORAGE_VERSION}`) || 'null') || MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem(`kc_transactions_${STORAGE_VERSION}`) || 'null') || MOCK_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(() => JSON.parse(localStorage.getItem(`kc_budgets_${STORAGE_VERSION}`) || 'null') || MOCK_BUDGETS);
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem(`kc_categories_${STORAGE_VERSION}`) || 'null') || DEFAULT_CATEGORIES);
  
  useEffect(() => localStorage.setItem(`kc_settings_${STORAGE_VERSION}`, JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem(`kc_accounts_${STORAGE_VERSION}`, JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem(`kc_transactions_${STORAGE_VERSION}`, JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem(`kc_budgets_${STORAGE_VERSION}`, JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem(`kc_categories_${STORAGE_VERSION}`, JSON.stringify(categories)), [categories]);
  
  useEffect(() => { if (view !== 'Lixo') setSelectedAccountId(null); }, [view]);

  const selectedCurrency = useMemo(() => CURRENCIES.find(c => c.code === settings.defaultCurrencyCode) || CURRENCIES[0], [settings.defaultCurrencyCode]);

  const formatCurrency = useMemo(() => {
    if (settings.hideValues) { return () => '•••••'; }
    const options: Intl.NumberFormatOptions = { style: 'currency', currency: selectedCurrency.code, minimumFractionDigits: selectedCurrency.decimalPlaces, maximumFractionDigits: selectedCurrency.decimalPlaces };
    return (value: number) => new Intl.NumberFormat('pt-AO', options).format(value);
  }, [settings.hideValues, selectedCurrency]);
  
  const activeItems = useMemo(() => ({
    accounts: accounts.filter(a => !a.isDeleted),
    transactions: transactions.filter(t => !t.isDeleted),
    budgets: budgets.filter(b => !b.isDeleted),
    categories: categories.filter(c => !c.isDeleted),
  }), [accounts, transactions, budgets, categories]);

  const deletedItems = useMemo(() => ({
    accounts: accounts.filter(a => a.isDeleted),
    transactions: transactions.filter(t => t.isDeleted),
    budgets: budgets.filter(b => b.isDeleted),
  }), [accounts, transactions, budgets]);

  const stats = useMemo(() => {
    const calculateMonthlyStats = (date: Date) => {
        const filtered = activeItems.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
        });
        const income = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
        const expense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
        return { income, expense };
    };

    const trendData = [...Array(6)].map((_, i) => {
        const d = new Date(currentDate);
        d.setMonth(currentDate.getMonth() - (5 - i));
        const monthStats = calculateMonthlyStats(d);
        return {
            month: d.toLocaleString('pt-AO', { month: 'short' }).replace('.', ''),
            income: monthStats.income,
            expense: monthStats.expense
        };
    });

    const currentMonthStats = calculateMonthlyStats(currentDate);
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setMonth(currentDate.getMonth() - 1);
    const prevMonthStats = calculateMonthlyStats(prevMonthDate);

    const filteredTransactions = activeItems.transactions.filter(t => new Date(t.date).getMonth() === currentDate.getMonth() && new Date(t.date).getFullYear() === currentDate.getFullYear());
    
    const accountBalances = activeItems.accounts.map(acc => {
        const netFlow = activeItems.transactions.reduce((sum, t) => { if (t.type === 'INCOME' && t.accountId === acc.id) return sum + t.amount; if (t.type === 'EXPENSE' && t.accountId === acc.id) return sum - t.amount; if (t.type === 'TRANSFER') { if (t.accountId === acc.id) return sum - t.amount; if (t.toAccountId === acc.id) return sum + t.amount; } return sum; }, 0);
        return { ...acc, balance: acc.initialBalance + netFlow };
    });

    const netWorth = accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
    const expenseByCategory = activeItems.categories.filter(c => c.type === 'EXPENSE').map(cat => ({ name: cat.name, amount: filteredTransactions.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0) })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
    
    const monthlyBalance = currentMonthStats.income - currentMonthStats.expense;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const dailyAverageExpense = currentMonthStats.expense > 0 ? currentMonthStats.expense / daysInMonth : 0;
    
    const prevMonthlyBalance = prevMonthStats.income - prevMonthStats.expense;
    const prevDaysInMonth = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate();
    const prevDailyAverageExpense = prevMonthStats.expense > 0 ? prevMonthStats.expense / prevDaysInMonth : 0;

    return { 
        netWorth, 
        totalIncome: currentMonthStats.income,
        totalExpense: currentMonthStats.expense,
        expenseByCategory, 
        accountBalances, 
        monthlyBalance, 
        dailyAverageExpense,
        prevMonthlyBalance,
        prevDailyAverageExpense,
        trendData
    };
}, [activeItems, currentDate]);

  const openModal = (type: ModalType, data?: any) => setModalConfig({ type, data });
  const closeModal = () => setModalConfig(null);
  const closeConfirmationModal = () => setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  const closeAlertModal = () => setAlertModal({ isOpen: false, title: '', message: '' });

  const setItemDeletedState = (id: string, type: DeletableItemType, isDeleted: boolean) => {
    const stateSetterMap = {
        transaction: setTransactions,
        account: setAccounts,
        budget: setBudgets,
        category: setCategories,
    };
    const setter = stateSetterMap[type];
    setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, isDeleted } : item));
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'> & { id?: string }) => { setTransactions(prev => txData.id ? prev.map(t => t.id === txData.id ? { ...t, ...txData } : t) : [ { ...txData, id: Date.now().toString() }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) ); };
  const softDeleteTransaction = (transactionId: string) => { setItemDeletedState(transactionId, 'transaction', true); };
  const softDeleteAccountHistory = (accountId: string) => { setConfirmationModal({ isOpen: true, title: 'Eliminar Histórico', message: 'Tem a certeza que deseja eliminar TODO o histórico de transações desta conta?', onConfirm: () => { setTransactions(prev => prev.map(t => (t.accountId === accountId || t.toAccountId === accountId) ? { ...t, isDeleted: true } : t)); closeConfirmationModal(); }}); };
  const handleSaveBudget = (budgetData: Omit<Budget, 'id'> & { id?: string }) => { setBudgets(prev => budgetData.id ? prev.map(b => b.id === budgetData.id ? { ...b, ...budgetData } : b) : [...prev, { ...budgetData, id: Date.now().toString() }] ); closeModal(); };
  const softDeleteBudget = (budgetId: string) => { setItemDeletedState(budgetId, 'budget', true); };
  const handleSaveAccount = (accountData: Omit<Account, 'id'> & { id?: string }) => { setAccounts(prev => accountData.id ? prev.map(a => a.id === accountData.id ? { ...a, ...accountData } : a) : [...prev, { ...accountData, id: Date.now().toString() }] ); closeModal(); };
  const softDeleteAccount = (accountId: string) => {
    if (activeItems.transactions.some(t => t.accountId === accountId || t.toAccountId === accountId)) {
      setConfirmationModal({ isOpen: true, title: 'Eliminar Conta', message: 'Esta conta tem transações associadas. Deseja mover a conta E TODAS as suas transações para o lixo?', onConfirm: () => { setItemDeletedState(accountId, 'account', true); setTransactions(prev => prev.map(t => t.accountId === accountId || t.toAccountId === accountId ? { ...t, isDeleted: true } : t)); closeConfirmationModal(); } });
    } else {
      setItemDeletedState(accountId, 'account', true);
    }
  };
  const handleSaveCategory = (catData: Omit<Category, 'id'> & { id?: string }) => { setCategories(prev => catData.id ? prev.map(c => c.id === catData.id ? { ...c, ...catData } : c) : [...prev, { ...catData, id: Date.now().toString() }] ); };
  const softDeleteCategory = (categoryId: string) => {
    if (activeItems.transactions.some(t => t.categoryId === categoryId)) {
        setAlertModal({isOpen: true, title: "Ação Bloqueada", message: "Não pode eliminar uma categoria com transações associadas. Por favor, reatribua ou elimine essas transações primeiro."});
        return;
    }
    setItemDeletedState(categoryId, 'category', true);
  };
  
  const restoreItem = (id: string, type: DeletableItemType) => { setItemDeletedState(id, type, false); };
  const permanentlyDeleteItem = (id: string, type: DeletableItemType) => {
    const stateSetterMap = { transaction: setTransactions, account: setAccounts, budget: setBudgets, category: setCategories };
    const onConfirm = () => { stateSetterMap[type]((prev: any[]) => prev.filter(item => item.id !== id)); closeConfirmationModal(); };
    setConfirmationModal({ isOpen: true, title: `Eliminar ${type}`, message: 'Esta ação é irreversível. Deseja eliminar permanentemente este item?', onConfirm });
  };
  const emptyTrash = () => {
    const onConfirm = () => {
        setTransactions(prev => prev.filter(t => !t.isDeleted));
        setAccounts(prev => prev.filter(a => !a.isDeleted));
        setBudgets(prev => prev.filter(b => !b.isDeleted));
        closeConfirmationModal();
    };
    setConfirmationModal({ isOpen: true, title: 'Esvaziar Lixo', message: 'Tem a certeza que deseja eliminar permanentemente TODOS os itens no lixo?', onConfirm });
  };


  const handleFabClick = () => { if (view === 'Contas') { openModal('ACCOUNT'); } else { openModal('TRANSACTION', { type: settings.fab.defaultType }); } };
  const handleExportCSV = () => {
    if (activeItems.transactions.length === 0) {
        setAlertModal({isOpen: true, title: "Exportar Dados", message: "Não existem transações para exportar."});
        return;
    }
    const accountMap = new Map(activeItems.accounts.map(a => [a.id, a.name]));
    const categoryMap = new Map(activeItems.categories.map(c => [c.id, c.name]));
    const headers = "ID,Data,Conta,Tipo,Categoria,Nota,Valor,Conta de Destino\n";
    const csvContent = activeItems.transactions.map(t => {
        const row = [ t.id, t.date, accountMap.get(t.accountId) || t.accountId, t.type, t.categoryId ? categoryMap.get(t.categoryId) || 'N/A' : 'N/A', `"${t.note.replace(/"/g, '""')}"`, t.amount, t.toAccountId ? accountMap.get(t.toAccountId) || t.toAccountId : '' ];
        return row.join(',');
    }).join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "kwanza_control_extrato.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const changeMonth = (delta: number) => setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return d; });

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const getComparison = (current: number, previous: number, lowerIsBetter = false) => {
    if (previous === 0 && current > 0) return { value: '+100%', color: lowerIsBetter ? 'text-accent-red' : 'text-accent-green' };
    if (previous === 0 && current === 0) return null;
    if (current === 0 && previous > 0 && !lowerIsBetter) return { value: '-100%', color: 'text-accent-red' };

    const diff = ((current - previous) / Math.abs(previous)) * 100;
    if (isNaN(diff) || !isFinite(diff)) return null;

    const sign = diff > 0 ? '+' : '';
    const color = (diff > 0 && !lowerIsBetter) || (diff < 0 && lowerIsBetter) ? 'text-accent-green' : 'text-accent-red';

    return { value: `${sign}${diff.toFixed(0)}%`, color };
  };

  return (
    <div className="h-screen bg-black flex flex-col max-w-lg mx-auto relative overflow-hidden">
      <header className="px-6 pt-12 pb-4 z-20"><h1 className="text-3xl font-bold">{view === 'Contas' && selectedAccountId ? 'Detalhe da Conta' : view}</h1></header>
      <main className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar space-y-6">
        {view === 'Começo' && ( <div className="space-y-6 animate-fade-in"><DateSelector currentDate={currentDate} changeMonth={changeMonth} currency={selectedCurrency} /><div className="glass-card p-6 rounded-2xl"><h3 className="font-bold mb-4">Fluxo do Mês</h3><DonutChart data={[{name: 'Renda', amount: stats.totalIncome}, {name: 'Despesas', amount: stats.totalExpense}]} total={stats.totalIncome + stats.totalExpense} title="Movimento" formatCurrency={formatCurrency} /></div><div className="space-y-3"><h3 className="font-bold text-lg px-2">Movimentos Recentes</h3>{activeItems.transactions.slice(0, 5).map(t => <TransactionItem key={t.id} transaction={t} accounts={activeItems.accounts} categories={activeItems.categories} formatCurrency={formatCurrency} onDelete={softDeleteTransaction} onEdit={() => openModal('TRANSACTION', t)} />)}</div></div> )}
        {view === 'Contas' && ( !selectedAccountId ? ( <div className="space-y-4 animate-fade-in"><div className="glass-card p-4 rounded-2xl text-center"><p className="text-xs text-text-secondary uppercase">Património Líquido</p><p className="text-2xl font-bold">{formatCurrency(stats.netWorth)}</p></div>{stats.accountBalances.map(acc => ( <div key={acc.id} className="glass-card p-4 rounded-2xl flex items-center justify-between"><div onClick={() => setSelectedAccountId(acc.id)} className="flex items-center gap-4 cursor-pointer flex-grow min-w-0"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${acc.color}`}><i className={`fa-solid ${acc.icon}`}></i></div><span className="font-bold truncate">{acc.name}</span></div><div className="flex items-center gap-1"><span className="font-bold mr-2">{formatCurrency(acc.balance)}</span><button onClick={() => openModal('ACCOUNT', acc)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-blue-500/10 hover:text-blue-400 flex items-center justify-center"><i className="fa-solid fa-pencil text-sm"></i></button><button onClick={() => softDeleteAccount(acc.id)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button></div></div> ))}</div> ) : ( <AccountDetailView accountId={selectedAccountId} accounts={stats.accountBalances} transactions={activeItems.transactions} categories={activeItems.categories} formatCurrency={formatCurrency} onBack={() => setSelectedAccountId(null)} onDeleteTransaction={softDeleteTransaction} onEditTransaction={(t) => openModal('TRANSACTION', t)} onDeleteAccountHistory={softDeleteAccountHistory} /> ) )}
        {view === 'Orçamentos' && ( <div className="space-y-4 animate-fade-in">{activeItems.budgets.length === 0 ? ( <div className="text-center py-20 text-text-secondary"><i className="fa-solid fa-bullseye text-4xl mb-4"></i><p className="font-bold">Planeje e alcance suas metas.</p><p className="text-sm">Crie o seu primeiro orçamento.</p><button onClick={() => openModal('BUDGET')} style={{ backgroundColor: 'var(--accent-green)'}} className="mt-6 px-6 py-3 text-black rounded-xl font-bold">Criar Orçamento</button></div> ) : ( <>{activeItems.budgets.map(b => { const spent = activeItems.transactions.filter(t => new Date(t.date).getMonth() === currentDate.getMonth() && t.categoryId === b.categoryId && t.type === 'EXPENSE').reduce((s,t) => s + t.amount, 0); const categoryName = categoryMap.get(b.categoryId)?.name || '...'; return ( <div key={b.id} className="glass-card p-5 rounded-2xl space-y-3"><div className="flex justify-between items-center"><div className="text-sm"><span className="font-bold">{categoryName}</span><p className="text-xs font-bold text-text-secondary">{formatCurrency(spent)} / {formatCurrency(b.limit)}</p></div><div className="flex items-center gap-1"><button onClick={() => openModal('BUDGET', b)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-blue-500/10 hover:text-blue-400 flex items-center justify-center"><i className="fa-solid fa-pencil text-sm"></i></button><button onClick={() => softDeleteBudget(b.id)} className="w-8 h-8 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button></div></div><ProgressBar current={spent} total={b.limit} /></div> ); })}<button onClick={() => openModal('BUDGET')} className="w-full py-3 bg-bg-card rounded-xl font-bold text-accent-green border border-dashed border-accent-green/50 hover:bg-accent-green/10 transition-colors"><i className="fa-solid fa-plus mr-2"></i>Adicionar Orçamento</button></> )}</div> )}
        {view === 'Estatísticas' && ( 
          <div className="space-y-6 animate-fade-in">
            <DateSelector currentDate={currentDate} changeMonth={changeMonth} currency={selectedCurrency} />
            <div className="flex gap-4">
                <StatCard 
                    title="Saldo do Mês" 
                    value={formatCurrency(stats.monthlyBalance)} 
                    icon={stats.monthlyBalance >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}
                    colorClass={stats.monthlyBalance >= 0 ? 'text-accent-green' : 'text-accent-red'}
                    comparison={getComparison(stats.monthlyBalance, stats.prevMonthlyBalance)}
                />
                <StatCard 
                    title="Média Diária (Gastos)" 
                    value={formatCurrency(stats.dailyAverageExpense)}
                    icon="fa-calendar-day"
                    comparison={getComparison(stats.dailyAverageExpense, stats.prevDailyAverageExpense, true)}
                />
            </div>
            <TrendChart data={stats.trendData} formatCurrency={formatCurrency} />
            <BarChart 
                income={stats.totalIncome} 
                expense={stats.totalExpense} 
                formatCurrency={formatCurrency} 
            />
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="font-bold mb-4">Distribuição de Despesas</h3>
              <DonutChart 
                data={stats.expenseByCategory} 
                total={stats.totalExpense} 
                title="Total" 
                formatCurrency={formatCurrency}
              />
            </div>
            <TopCategoriesList
                categories={stats.expenseByCategory}
                allCategories={activeItems.categories}
                totalExpense={stats.totalExpense}
                formatCurrency={formatCurrency}
            />
          </div> 
        )}
        {view === 'Mais' && ( <div className="space-y-4 animate-fade-in px-2"><div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/10"><SettingsItem icon="fa-sliders" label="Configurações" onClick={() => openModal('SETTINGS')} /><SettingsItem icon="fa-crown" label="Assinatura Pro" onClick={() => setSubscriptionModalOpen(true)} /><SettingsItem icon="fa-tags" label="Categorias" onClick={() => openModal('CATEGORIES')} /><SettingsItem icon="fa-trash" label="Lixo" onClick={() => setView('Lixo')} /><SettingsItem icon="fa-file-csv" label="Exportar Dados (CSV)" onClick={handleExportCSV} /></div></div> )}
        {view === 'Lixo' && ( <TrashView items={deletedItems} onRestore={restoreItem} onPermanentlyDelete={permanentlyDeleteItem} onEmptyTrash={emptyTrash} onBack={() => setView('Mais')} /> )}
      </main>
      {view !== 'Lixo' && !selectedAccountId && settings.fab.visible && <button onClick={handleFabClick} style={{ backgroundColor: 'var(--accent-green)'}} className="fixed bottom-[6.5rem] right-1/2 translate-x-1/2 w-[64px] h-[64px] rounded-[32px] shadow-lg flex items-center justify-center text-black text-3xl z-40 active:scale-90 transition-transform"><i className="fa-solid fa-plus"></i></button>}
      {view !== 'Lixo' && <nav className="fixed bottom-0 inset-x-0 h-24 bg-bg-card/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-30 safe-area-bottom">
        <NavIcon active={view === 'Começo'} icon="fa-house" label="Começo" onClick={() => setView('Começo')} />
        <NavIcon active={view === 'Contas'} icon="fa-wallet" label="Contas" onClick={() => setView('Contas')} />
        <NavIcon active={view === 'Orçamentos'} icon="fa-chart-pie" label="Orçamentos" onClick={() => setView('Orçamentos')} />
        <NavIcon active={view === 'Estatísticas'} icon="fa-chart-simple" label="Estatísticas" onClick={() => setView('Estatísticas')} />
        <NavIcon active={view === 'Mais'} icon="fa-ellipsis" label="Mais" onClick={() => setView('Mais')} />
      </nav>}
      {modalConfig?.type === 'TRANSACTION' && <TransactionModal onClose={closeModal} onSave={handleSaveTransaction} accounts={activeItems.accounts} categories={activeItems.categories} initialState={modalConfig.data} />}
      {modalConfig?.type === 'BUDGET' && <BudgetModal onClose={closeModal} onSave={handleSaveBudget} categories={activeItems.categories} initialState={modalConfig.data} existingBudgets={activeItems.budgets} />}
      {modalConfig?.type === 'ACCOUNT' && <AccountModal onClose={closeModal} onSave={handleSaveAccount} initialState={modalConfig.data} />}
      {modalConfig?.type === 'SETTINGS' && <SettingsModal onClose={closeModal} settings={settings} onSettingsChange={setSettings} />}
      {modalConfig?.type === 'CATEGORIES' && <CategoryManagementModal onClose={closeModal} categories={activeItems.categories} onSave={handleSaveCategory} onDelete={softDeleteCategory} />}
      <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={closeConfirmationModal} onConfirm={confirmationModal.onConfirm} title={confirmationModal.title} message={confirmationModal.message} />
      <AlertModal isOpen={alertModal.isOpen} onClose={closeAlertModal} title={alertModal.title} message={alertModal.message} />
      <SubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setSubscriptionModalOpen(false)} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
