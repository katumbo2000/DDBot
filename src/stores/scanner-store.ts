import { makeAutoObservable } from 'mobx';
import { api_base } from '@/external/bot-skeleton';
import RootStore from './root-store';

export const SCANNER_SYMBOLS = [
    { symbol: '1HZ10V', display: 'Volatility 10 (1s)' },
    { symbol: '1HZ15V', display: 'Volatility 15 (1s)' },
    { symbol: '1HZ25V', display: 'Volatility 25 (1s)' },
    { symbol: '1HZ30V', display: 'Volatility 30 (1s)' },
    { symbol: '1HZ50V', display: 'Volatility 50 (1s)' },
    { symbol: '1HZ75V', display: 'Volatility 75 (1s)' },
    { symbol: '1HZ100V', display: 'Volatility 100 (1s)' },
];

export const SCANNER_TRADE_TYPES = ['Rise/Fall', 'Even/Odd', 'Over/Under', 'Matches/Differ'] as const;

type SignalResult = {
    signal: string;
    confidence: number;
    detail: string;
};

type SymbolResult = {
    rise_fall: SignalResult;
    even_odd: SignalResult;
    over_under: SignalResult;
    matches_differ: SignalResult;
};

const WINDOW_SIZE = 20;

const createEmptyResult = (): SymbolResult => ({
    rise_fall: { signal: '—', confidence: 0, detail: '' },
    even_odd: { signal: '—', confidence: 0, detail: '' },
    over_under: { signal: '—', confidence: 0, detail: '' },
    matches_differ: { signal: '—', confidence: 0, detail: '' },
});

export default class ScannerStore {
    root_store: RootStore;

    selected_symbols: string[] = SCANNER_SYMBOLS.map(s => s.symbol);
    selected_trade_types: string[] = [...SCANNER_TRADE_TYPES];
    is_scanning = false;

    ticks: Record<string, number[]> = {};
    results: Record<string, SymbolResult> = {};
    symbol_status: Record<string, string> = {};

    private subscriptions: Map<string, { id: string; unsubscribe: () => void }> = new Map();
    private messageSubscription: { unsubscribe: () => void } | null = null;
    private scanningInterval: ReturnType<typeof setInterval> | null = null;

    constructor(root_store: RootStore) {
        makeAutoObservable(this);
        this.root_store = root_store;
    }

    toggleSymbol = (symbol: string) => {
        if (this.is_scanning) return;
        const idx = this.selected_symbols.indexOf(symbol);
        if (idx >= 0) {
            this.selected_symbols = this.selected_symbols.filter(s => s !== symbol);
        } else {
            this.selected_symbols = [...this.selected_symbols, symbol];
        }
    };

    toggleTradeType = (tradeType: string) => {
        if (this.is_scanning) return;
        const idx = this.selected_trade_types.indexOf(tradeType);
        if (idx >= 0) {
            this.selected_trade_types = this.selected_trade_types.filter(t => t !== tradeType);
        } else {
            this.selected_trade_types = [...this.selected_trade_types, tradeType];
        }
    };

    startScanning = async () => {
        if (this.is_scanning) return;
        if (!api_base?.api) return;

        this.ticks = {};
        this.results = {};
        this.symbol_status = {};
        this.is_scanning = true;

        for (const symbol of this.selected_symbols) {
            this.ticks[symbol] = [];
            this.results[symbol] = createEmptyResult();
            this.symbol_status[symbol] = 'Connecting...';
        }

        this.messageSubscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
            if (data.msg_type === 'tick') {
                const { symbol, quote } = data.tick;
                if (this.selected_symbols.includes(symbol)) {
                    this.processTick(symbol, quote);
                }
            }
            if (data.msg_type === 'ohlc') {
                const { symbol } = data.ohlc;
                if (this.selected_symbols.includes(symbol)) {
                    this.symbol_status[symbol] = 'Active';
                }
            }
        });

        for (const symbol of this.selected_symbols) {
            try {
                const sub = await api_base.api.send({
                    ticks_history: symbol,
                    subscribe: 1,
                    end: 'latest',
                    count: 100,
                    style: 'ticks',
                });
                if (sub?.subscription) {
                    this.subscriptions.set(symbol, sub.subscription);
                    this.symbol_status[symbol] = 'Active';
                }
            } catch {
                this.symbol_status[symbol] = 'Unavailable';
            }
        }

        this.scanningInterval = setInterval(() => {
            this.refreshSignals();
        }, 1000);
    };

    stopScanning = () => {
        this.is_scanning = false;

        if (this.scanningInterval) {
            clearInterval(this.scanningInterval);
            this.scanningInterval = null;
        }

        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            this.messageSubscription = null;
        }

        for (const [, sub] of this.subscriptions) {
            api_base.api?.forget(sub.id).catch(() => {});
        }
        this.subscriptions.clear();

        for (const symbol of this.selected_symbols) {
            this.symbol_status[symbol] = 'Stopped';
        }
    };

    clearResults = () => {
        this.ticks = {};
        this.results = {};
        this.symbol_status = {};
    };

    private processTick = (symbol: string, quote: number) => {
        if (!this.ticks[symbol]) {
            this.ticks[symbol] = [];
        }
        this.ticks[symbol] = [...this.ticks[symbol].slice(-WINDOW_SIZE), quote];
    };

    private refreshSignals = () => {
        for (const symbol of this.selected_symbols) {
            const ticks = this.ticks[symbol];
            if (!ticks || ticks.length < 3) continue;

            const result = createEmptyResult();
            result.rise_fall = this.analyzeRiseFall(ticks);
            result.even_odd = this.analyzeEvenOdd(ticks);
            result.over_under = this.analyzeOverUnder(ticks);
            result.matches_differ = this.analyzeMatchesDiffer(ticks);
            this.results[symbol] = result;
        }
    };

    private analyzeRiseFall = (ticks: number[]): SignalResult => {
        const last5 = ticks.slice(-5);
        let rises = 0;
        let falls = 0;
        for (let i = 1; i < last5.length; i++) {
            if (last5[i] > last5[i - 1]) rises++;
            else if (last5[i] < last5[i - 1]) falls++;
        }
        const total = rises + falls;
        if (total === 0) return { signal: '—', confidence: 0, detail: 'No movement' };
        const risePct = Math.round((rises / total) * 100);
        const fallPct = Math.round((falls / total) * 100);
        if (risePct > fallPct && risePct >= 60) {
            return { signal: 'RISE', confidence: risePct, detail: `${risePct}% rise / ${fallPct}% fall` };
        }
        if (fallPct > risePct && fallPct >= 60) {
            return { signal: 'FALL', confidence: fallPct, detail: `${fallPct}% fall / ${risePct}% rise` };
        }
        if (risePct >= fallPct) {
            return { signal: 'Slight Rise', confidence: risePct, detail: `${risePct}% rise / ${fallPct}% fall` };
        }
        return { signal: 'Slight Fall', confidence: fallPct, detail: `${fallPct}% fall / ${risePct}% rise` };
    };

    private analyzeEvenOdd = (ticks: number[]): SignalResult => {
        const last10 = ticks.slice(-10);
        const lastTick = last10[last10.length - 1];
        const lastDigit = Math.floor(lastTick) % 10;
        const isEven = lastDigit % 2 === 0;

        let evens = 0;
        for (const t of last10) {
            if (Math.floor(t) % 2 === 0) evens++;
        }
        const confidence = Math.round(((isEven ? evens : last10.length - evens) / last10.length) * 100);

        return {
            signal: isEven ? 'EVEN' : 'ODD',
            confidence,
            detail: `Last: ${lastDigit} (${evens}/10 even)`,
        };
    };

    private analyzeOverUnder = (ticks: number[]): SignalResult => {
        if (ticks.length < 5) return { signal: '—', confidence: 0, detail: 'Need more data' };
        const last5 = ticks.slice(-5);
        const current = last5[last5.length - 1];
        const sma = ticks.slice(-20).reduce((a, b) => a + b, 0) / Math.min(ticks.length, 20);
        const diff = ((current - sma) / sma) * 100;
        const absDiff = Math.abs(diff);

        if (diff > 0.1) {
            return {
                signal: 'OVER',
                confidence: Math.min(100, Math.round(50 + absDiff * 5)),
                detail: `${absDiff.toFixed(2)}% above MA`,
            };
        }
        if (diff < -0.1) {
            return {
                signal: 'UNDER',
                confidence: Math.min(100, Math.round(50 + absDiff * 5)),
                detail: `${absDiff.toFixed(2)}% below MA`,
            };
        }
        return { signal: 'Neutral', confidence: 50, detail: `Near MA (${diff.toFixed(2)}%)` };
    };

    private analyzeMatchesDiffer = (ticks: number[]): SignalResult => {
        if (ticks.length < 5) return { signal: '—', confidence: 0, detail: 'Need more data' };
        const last5 = ticks.slice(-5);
        let matches = 0;
        let differs = 0;
        for (let i = 1; i < last5.length; i++) {
            const a = Math.floor(last5[i]) % 10;
            const b = Math.floor(last5[i - 1]) % 10;
            if (a === b) matches++;
            else differs++;
        }
        const total = matches + differs;
        const matchPct = Math.round((matches / total) * 100);

        if (matchPct >= 60) {
            return {
                signal: 'MATCHES',
                confidence: matchPct,
                detail: `${matches}/${total} consecutive same digit`,
            };
        }
        if (matchPct <= 40) {
            return {
                signal: 'DIFFERS',
                confidence: 100 - matchPct,
                detail: `${differs}/${total} consecutive different digit`,
            };
        }
        return { signal: 'Neutral', confidence: 50, detail: `${matches} match / ${differs} differ` };
    };

    get symbolOptions() {
        return SCANNER_SYMBOLS;
    }

    get tradeTypeOptions() {
        return SCANNER_TRADE_TYPES;
    }
}
