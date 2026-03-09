import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase, TradeSetting, Trade } from '../lib/supabase';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import Confetti from '../components/Confetti';
import Notification from '../components/Notification';

interface TradingPageProps {
  onNavigate: (page: string) => void;
}

export default function TradingPage({ onNavigate: _onNavigate }: TradingPageProps) {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [tradeSettings, setTradeSettings] = useState<TradeSetting[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const mainChartRef = useRef<HTMLDivElement>(null);
  const modalChartRef = useRef<HTMLDivElement>(null);
  const [chartsLoaded, setChartsLoaded] = useState(false);

  useEffect(() => {
    loadTradeSettings();
    loadTradingViewScript();

    // Cleanup any orphaned TradingView widgets
    return () => {
      const orphanedWidgets = document.querySelectorAll('.tradingview-widget-copyright');
      orphanedWidgets.forEach(widget => widget.remove());
    };
  }, []);

  useEffect(() => {
    if (chartsLoaded && mainChartRef.current && !mainChartRef.current.querySelector('iframe')) {
      initializeMainChart();
    }
  }, [chartsLoaded]);

  useEffect(() => {
    if (chartsLoaded && showTradeModal && modalChartRef.current && !modalChartRef.current.querySelector('iframe')) {
      initializeModalChart();
    }
  }, [chartsLoaded, showTradeModal]);

  useEffect(() => {
    if (currentTrade && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currentTrade && timeRemaining === 0) {
      completeTrade();
    }
  }, [timeRemaining, currentTrade]);

  const loadTradingViewScript = () => {
    // Remove any existing TradingView scripts from body
    const existingScripts = document.querySelectorAll('body > script[src*="tradingview.com"]');
    existingScripts.forEach(script => script.remove());

    setTimeout(() => setChartsLoaded(true), 100);
  };

  const initializeMainChart = () => {
    if (!mainChartRef.current) return;

    const widgetContainer = mainChartRef.current;
    widgetContainer.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetDiv.style.position = 'absolute';
    widgetDiv.style.top = '0';
    widgetDiv.style.left = '0';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BITSTAMP:BTCUSD',
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '0',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      save_image: true,
      backgroundColor: '#0F0F0F',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: ['STD;Bollinger_Bands'],
      width: '100%',
      height: '100%'
    });

    widgetContainer.appendChild(widgetDiv);
    widgetContainer.appendChild(script);
  };

  const initializeModalChart = () => {
    if (!modalChartRef.current) return;

    const widgetContainer = modalChartRef.current;
    widgetContainer.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetDiv.style.position = 'absolute';
    widgetDiv.style.top = '0';
    widgetDiv.style.left = '0';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BITSTAMP:BTCUSD',
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '0',
      locale: 'en',
      allow_symbol_change: false,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      save_image: false,
      backgroundColor: '#0F0F0F',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: ['STD;Bollinger_Bands'],
      width: '100%',
      height: '100%'
    });

    widgetContainer.appendChild(widgetDiv);
    widgetContainer.appendChild(script);
  };

  const loadTradeSettings = async () => {
    const { data, error } = await supabase
      .from('trade_settings')
      .select('*')
      .order('duration');

    if (!error && data) {
      setTradeSettings(data);
    }
  };

  const startTrade = async () => {
    if (!profile || !amount) return;

    const numAmount = parseFloat(amount);
    const setting = tradeSettings.find((s) => s.duration === selectedDuration);

    if (!setting) {
      setError('Invalid trade duration');
      return;
    }

    if (numAmount < setting.min_capital) {
      setError(`Minimum capital is ${formatAmount(setting.min_capital)}`);
      return;
    }

    if (numAmount > profile.usdt_balance) {
      setError('Insufficient USDT balance');
      return;
    }

    setError('');

    const newBalance = profile.usdt_balance - numAmount;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ usdt_balance: newBalance })
      .eq('id', profile.id);

    if (updateError) {
      setError('Failed to start trade');
      return;
    }

    const { data: tradeData, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: profile.id,
        trade_type: tradeType,
        amount: numAmount,
        duration: selectedDuration,
        outcome: 'pending',
        profit_loss: 0,
      })
      .select()
      .single();

    if (tradeError || !tradeData) {
      setError('Failed to create trade');
      return;
    }

    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'trade',
      amount: numAmount,
      currency: 'USDT',
      status: 'pending',
      details: { trade_id: tradeData.id, type: tradeType },
    });

    setCurrentTrade(tradeData);
    setTimeRemaining(selectedDuration);
    setShowTradeModal(true);
    setAmount('');
  };

  const completeTrade = async () => {
    if (!currentTrade || !profile) return;

    const setting = tradeSettings.find((s) => s.duration === currentTrade.duration);
    if (!setting) return;

    const randomOutcome = Math.random();
    const isWin = randomOutcome > 0.5;

    let profitLoss = 0;
    let newBalance = profile.usdt_balance;

    if (isWin) {
      profitLoss = (currentTrade.amount * setting.win_percentage) / 100;
      newBalance += currentTrade.amount + profitLoss;
    } else {
      profitLoss = -(currentTrade.amount * setting.loss_percentage) / 100;
      newBalance += currentTrade.amount + profitLoss;
    }

    await supabase
      .from('trades')
      .update({
        outcome: isWin ? 'win' : 'loss',
        profit_loss: profitLoss,
        completed_at: new Date().toISOString(),
      })
      .eq('id', currentTrade.id);

    await supabase
      .from('profiles')
      .update({ usdt_balance: newBalance })
      .eq('id', profile.id);

    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'trade',
      amount: Math.abs(profitLoss),
      currency: 'USDT',
      status: isWin ? 'win' : 'loss',
      details: { trade_id: currentTrade.id, outcome: isWin ? 'win' : 'loss' },
    });

    await refreshProfile();

    if (isWin) {
      setShowConfetti(true);
      setNotification({
        message: `Congratulations! You won $${profitLoss.toFixed(2)}!`,
        type: 'success',
      });
    } else {
      setNotification({
        message: `Trade closed. Loss: $${Math.abs(profitLoss).toFixed(2)}`,
        type: 'error',
      });
    }

    setShowTradeModal(false);
    setCurrentTrade(null);
  };

  const selectedSetting = tradeSettings.find((s) => s.duration === selectedDuration);

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-4 sm:py-6 md:py-8 px-3 sm:px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 md:mb-8">{t('trading')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 bg-[#0f0f0f] rounded-lg p-4 sm:p-6 border border-teal-900/30">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Live Chart</h2>
            <div className="h-64 sm:h-80 md:h-96 lg:h-[500px] w-full relative rounded-lg overflow-hidden bg-[#0F0F0F]">
              {!chartsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] rounded-lg z-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-400">Loading chart...</div>
                  </div>
                </div>
              )}
              <div
                ref={mainChartRef}
                className="tradingview-widget-container absolute inset-0 overflow-hidden"
              />
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-4 sm:p-6 border border-teal-900/30">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Place Trade</h2>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trade Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTradeType('BUY')}
                  className={`py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base ${
                    tradeType === 'BUY'
                      ? 'bg-green-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 border border-teal-900/30'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>BUY / UP</span>
                </button>
                <button
                  onClick={() => setTradeType('SELL')}
                  className={`py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base ${
                    tradeType === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 border border-teal-900/30'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>SELL / DOWN</span>
                </button>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm sm:text-base"
              >
                {tradeSettings.map((setting) => (
                  <option key={setting.duration} value={setting.duration}>
                    {setting.duration}s - Min: {formatAmount(setting.min_capital)}
                  </option>
                ))}
              </select>
            </div>

            {selectedSetting && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#1a1a1a] rounded-lg border border-teal-900/30">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-gray-400">Win Profit:</span>
                  <span className="text-green-500 font-semibold">+{selectedSetting.win_percentage}%</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Loss Deduction:</span>
                  <span className="text-red-500 font-semibold">-{selectedSetting.loss_percentage}%</span>
                </div>
              </div>
            )}

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (USDT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={selectedSetting?.min_capital || 0}
                step="0.01"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm sm:text-base"
                placeholder={`Min: ${selectedSetting?.min_capital || 0}`}
              />
            </div>

            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#1a1a1a] rounded-lg">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Available Balance:</div>
              <div className="text-lg sm:text-xl font-bold text-white">{formatAmount(profile?.usdt_balance || 0)}</div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md text-xs sm:text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startTrade}
              disabled={!amount || parseFloat(amount) < (selectedSetting?.min_capital || 0)}
              className={`w-full py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                tradeType === 'BUY'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Start Trade
            </button>
          </div>
        </div>
      </div>

      {showTradeModal && currentTrade && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] rounded-lg p-6 sm:p-8 max-w-2xl w-full border border-teal-900/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Trade in Progress</h3>
              <button
                onClick={() => {}}
                disabled
                className="text-gray-500 cursor-not-allowed"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 sm:mb-8 text-center">
              <div className="text-5xl sm:text-6xl font-bold text-teal-400 mb-2">
                {timeRemaining}s
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Time Remaining</div>
            </div>

            <div className="mb-6 h-64 sm:h-80 w-full relative rounded-lg overflow-hidden bg-[#0F0F0F]">
              {!chartsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] rounded-lg z-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-400">Loading chart...</div>
                  </div>
                </div>
              )}
              <div
                ref={modalChartRef}
                className="tradingview-widget-container absolute inset-0 overflow-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-[#1a1a1a] rounded-lg">
                <div className="text-gray-400 mb-1 text-xs sm:text-sm">Trade Type</div>
                <div className={`font-semibold text-sm sm:text-base ${currentTrade.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                  {currentTrade.trade_type}
                </div>
              </div>
              <div className="p-4 bg-[#1a1a1a] rounded-lg">
                <div className="text-gray-400 mb-1 text-xs sm:text-sm">Amount</div>
                <div className="font-semibold text-white text-sm sm:text-base">{formatAmount(currentTrade.amount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
