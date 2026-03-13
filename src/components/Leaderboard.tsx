import { useEffect, useState, memo } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';

interface LeaderboardEntry {
  username: string;
  total_usd: number;
  rank: number;
}

function Leaderboard() {
  const { getPrice, loading: pricesLoading } = useCryptoPrices();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pricesLoading) loadLeaderboard();
  }, [pricesLoading]);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, btc_balance, eth_balance, usdc_balance, usdt_balance, xrp_balance, sol_balance')
        .limit(20);

      if (error) { console.error('Leaderboard error:', error); return; }

      if (data) {
        const entries = data
          .map(p => ({
            username: p.username || 'Anonymous',
            total_usd:
              (Number(p.btc_balance)  || 0) * getPrice('BTC')  +
              (Number(p.eth_balance)  || 0) * getPrice('ETH')  +
              (Number(p.usdc_balance) || 0) * getPrice('USDC') +
              (Number(p.usdt_balance) || 0) * getPrice('USDT') +
              (Number(p.xrp_balance)  || 0) * getPrice('XRP')  +
              (Number(p.sol_balance)  || 0) * getPrice('SOL'),
            rank: 0,
          }))
          .sort((a, b) => b.total_usd - a.total_usd)
          .slice(0, 10)
          .map((e, i) => ({ ...e, rank: i + 1 }));

        setLeaders(entries);
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />;
    if (rank === 2) return <Medal  className="w-5 h-5" style={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <Award  className="w-5 h-5" style={{ color: '#CD7F32' }} />;
    return <span className="text-sm font-bold w-5 text-center" style={{ color: '#7A7070' }}>#{rank}</span>;
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5" style={{ color: '#00EBFF' }} />
        <h2 className="text-base font-semibold" style={{ color: '#F5F5F0' }}>Top Traders</h2>
      </div>

      {loading || pricesLoading ? (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#00EBFF', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: '#C0B8B8' }}>Loading…</span>
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: '#7A7070' }}>No traders yet</div>
      ) : (
        <div className="space-y-2">
          {leaders.map(leader => (
            <div
              key={leader.rank}
              className="flex items-center justify-between p-3 rounded-xl transition-all"
              style={{
                background: leader.rank === 1
                  ? 'linear-gradient(90deg, rgba(0,235,255,0.08), transparent)'
                  : 'rgba(255,255,255,0.02)',
                border: leader.rank === 1
                  ? '1px solid rgba(0,235,255,0.2)'
                  : '1px solid rgba(85,78,78,0.25)',
              }}
            >
              <div className="flex items-center gap-3">
                <RankIcon rank={leader.rank} />
                <span className="font-semibold text-sm" style={{ color: '#F5F5F0' }}>{leader.username}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: leader.rank === 1 ? '#00EBFF' : '#C0B8B8' }}>
                  ${leader.total_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {leader.rank <= 3 && (
                  <div className="text-xs font-semibold animate-pulse"
                    style={{ color: leader.rank === 1 ? '#FFD700' : leader.rank === 2 ? '#C0C0C0' : '#CD7F32' }}>
                    Top {leader.rank}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(Leaderboard);
