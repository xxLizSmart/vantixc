import { useEffect, useState, memo } from 'react';
import { TrendingUp, Target, DollarSign, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function TradingStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalProfit: 0,
    bestTrade: 0,
  });

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', profile.id)
        .neq('outcome', 'pending');

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      if (data) {
        const totalTrades = data.length;
        const wins = data.filter((t) => t.outcome === 'win').length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const totalProfit = data.reduce((sum, t) => sum + t.profit_loss, 0);
        const bestTrade = Math.max(...data.map((t) => t.profit_loss), 0);

        setStats({ totalTrades, winRate, totalProfit, bestTrade });
      }
    } catch (err) {
      console.error('Error loading trading stats:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Target className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalTrades}</div>
        <div className="text-sm text-gray-400">Total Trades</div>
      </div>

      <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Percent className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
        <div className="text-sm text-gray-400">Win Rate</div>
      </div>

      <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/10 border border-teal-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <DollarSign className="w-5 h-5 text-teal-400" />
        </div>
        <div className={`text-xl sm:text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ${Math.abs(stats.totalProfit).toFixed(2)}
        </div>
        <div className="text-sm text-gray-400">Total P&L</div>
      </div>

      <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border border-yellow-600/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white">${stats.bestTrade.toFixed(2)}</div>
        <div className="text-sm text-gray-400">Best Trade</div>
      </div>
    </div>
  );
}

export default memo(TradingStats);
