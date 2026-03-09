import { useEffect, useState, memo } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  username: string;
  total_assets: number;
  rank: number;
}

function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, btc_balance, eth_balance, usdc_balance, usdt_balance, xrp_balance, sol_balance')
        .limit(10);

      if (error) {
        console.error('Error loading leaderboard:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const leaderboardData = data
          .map((profile) => ({
            username: profile.username || 'Anonymous',
            total_assets:
              profile.btc_balance +
              profile.eth_balance +
              profile.usdc_balance +
              profile.usdt_balance +
              profile.xrp_balance +
              profile.sol_balance,
            rank: 0,
          }))
          .sort((a, b) => b.total_assets - a.total_assets)
          .map((entry, index) => ({ ...entry, rank: index + 1 }))
          .slice(0, 10);

        setLeaders(leaderboardData);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-teal-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return <span className="text-gray-400 font-bold">#{rank}</span>;
  };

  return (
    <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="w-6 h-6 text-teal-400" />
        <h2 className="text-xl font-bold text-white">Top Traders</h2>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No traders yet
          </div>
        ) : (
          leaders.map((leader) => (
          <div
            key={leader.rank}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              leader.rank === 1
                ? 'bg-gradient-to-r from-teal-900/30 to-transparent border border-teal-600/30'
                : 'bg-[#1a1a1a] hover:bg-teal-900/20'
            }`}
          >
            <div className="flex items-center space-x-3">
              {getRankIcon(leader.rank)}
              <div>
                <div className="text-white font-semibold">{leader.username}</div>
                <div className="text-gray-400 text-sm">${leader.total_assets.toLocaleString()}</div>
              </div>
            </div>
            {leader.rank <= 3 && (
              <div className="text-teal-400 text-sm font-semibold animate-pulse">
                Top {leader.rank}
              </div>
            )}
          </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(Leaderboard);
