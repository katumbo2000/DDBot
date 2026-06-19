import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { SCANNER_SYMBOLS, SCANNER_TRADE_TYPES } from '@/stores/scanner-store';
import { Localize } from '@deriv-com/translations';
import './scanner.scss';

const Scanner = observer(() => {
    const { scanner, client } = useStore();

    const getSignalClass = (signal: string) => {
        if (signal === 'RISE' || signal === 'OVER' || signal === 'EVEN' || signal === 'MATCHES')
            return 'signal--bullish';
        if (signal === 'FALL' || signal === 'UNDER' || signal === 'ODD' || signal === 'DIFFERS')
            return 'signal--bearish';
        if (signal === '—' || signal === 'Neutral') return 'signal--neutral';
        return 'signal--neutral';
    };

    const renderSignalCell = (result: { signal: string; confidence: number; detail: string }) => (
        <div className={`scanner__signal ${getSignalClass(result.signal)}`}>
            <span className='scanner__signal-label'>{result.signal}</span>
            <span className='scanner__signal-confidence'>{result.confidence > 0 ? `${result.confidence}%` : ''}</span>
            <span className='scanner__signal-detail'>{result.detail}</span>
        </div>
    );

    if (!client.is_logged_in) {
        return (
            <div className='scanner'>
                <div className='scanner__login-prompt'>
                    <Localize i18n_default_text='Please log in to use the AI Market Scanner.' />
                </div>
            </div>
        );
    }

    return (
        <div className='scanner'>
            <div className='scanner__header'>
                <h2 className='scanner__title'>
                    <Localize i18n_default_text='AI Market Scanner' />
                </h2>
                <p className='scanner__description'>
                    <Localize i18n_default_text='Real-time analysis of volatility indices with AI-powered signal detection.' />
                </p>
            </div>

            <div className='scanner__controls'>
                <div className='scanner__panel'>
                    <h3 className='scanner__panel-title'>
                        <Localize i18n_default_text='Markets' />
                    </h3>
                    <div className='scanner__checkbox-group'>
                        {SCANNER_SYMBOLS.map(({ symbol, display }) => (
                            <label key={symbol} className='scanner__checkbox'>
                                <input
                                    type='checkbox'
                                    checked={scanner.selected_symbols.includes(symbol)}
                                    onChange={() => scanner.toggleSymbol(symbol)}
                                    disabled={scanner.is_scanning}
                                />
                                <span>{display}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className='scanner__panel'>
                    <h3 className='scanner__panel-title'>
                        <Localize i18n_default_text='Trade Types' />
                    </h3>
                    <div className='scanner__checkbox-group'>
                        {SCANNER_TRADE_TYPES.map(tradeType => (
                            <label key={tradeType} className='scanner__checkbox'>
                                <input
                                    type='checkbox'
                                    checked={scanner.selected_trade_types.includes(tradeType)}
                                    onChange={() => scanner.toggleTradeType(tradeType)}
                                    disabled={scanner.is_scanning}
                                />
                                <span>{tradeType}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className='scanner__actions'>
                    <button
                        className={`scanner__btn ${scanner.is_scanning ? 'scanner__btn--stop' : 'scanner__btn--start'}`}
                        onClick={scanner.is_scanning ? scanner.stopScanning : scanner.startScanning}
                    >
                        {scanner.is_scanning ? (
                            <Localize i18n_default_text='Stop Scanning' />
                        ) : (
                            <Localize i18n_default_text='Start Scanning' />
                        )}
                    </button>
                </div>
            </div>

            <div className='scanner__results'>
                <table className='scanner__table'>
                    <thead>
                        <tr>
                            <th>
                                <Localize i18n_default_text='Market' />
                            </th>
                            <th>
                                <Localize i18n_default_text='Status' />
                            </th>
                            {scanner.selected_trade_types.includes('Rise/Fall') && (
                                <th>
                                    <Localize i18n_default_text='Rise/Fall' />
                                </th>
                            )}
                            {scanner.selected_trade_types.includes('Even/Odd') && (
                                <th>
                                    <Localize i18n_default_text='Even/Odd' />
                                </th>
                            )}
                            {scanner.selected_trade_types.includes('Over/Under') && (
                                <th>
                                    <Localize i18n_default_text='Over/Under' />
                                </th>
                            )}
                            {scanner.selected_trade_types.includes('Matches/Differ') && (
                                <th>
                                    <Localize i18n_default_text='Matches/Differ' />
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {scanner.selected_symbols.map(symbol => {
                            const meta = SCANNER_SYMBOLS.find(s => s.symbol === symbol);
                            const result = scanner.results[symbol];
                            const status = scanner.symbol_status[symbol] || 'Idle';
                            return (
                                <tr key={symbol}>
                                    <td className='scanner__market-name'>{meta?.display || symbol}</td>
                                    <td>
                                        <span className={`scanner__status scanner__status--${status.toLowerCase()}`}>
                                            {status}
                                        </span>
                                    </td>
                                    {scanner.selected_trade_types.includes('Rise/Fall') && (
                                        <td>{result ? renderSignalCell(result.rise_fall) : '—'}</td>
                                    )}
                                    {scanner.selected_trade_types.includes('Even/Odd') && (
                                        <td>{result ? renderSignalCell(result.even_odd) : '—'}</td>
                                    )}
                                    {scanner.selected_trade_types.includes('Over/Under') && (
                                        <td>{result ? renderSignalCell(result.over_under) : '—'}</td>
                                    )}
                                    {scanner.selected_trade_types.includes('Matches/Differ') && (
                                        <td>{result ? renderSignalCell(result.matches_differ) : '—'}</td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default Scanner;
