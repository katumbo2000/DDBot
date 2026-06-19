import { observer } from 'mobx-react-lite';
import { Localize } from '@deriv-com/translations';
import './signal-scanner.scss';

const SignalScanner = observer(() => {
    return (
        <div className='signal-scanner'>
            <div className='signal-scanner__header'>
                <h2 className='signal-scanner__title'>
                    <Localize i18n_default_text='Signal Scanner' />
                </h2>
                <p className='signal-scanner__description'>
                    <Localize i18n_default_text='Real-time signal monitoring and detection across all markets.' />
                </p>
            </div>
            <div className='signal-scanner__placeholder'>
                <div className='signal-scanner__placeholder-icon' />
                <h3>
                    <Localize i18n_default_text='Coming Soon' />
                </h3>
                <p>
                    <Localize i18n_default_text='Advanced signal scanning with multi-timeframe analysis, custom indicator alerts, and automated trade detection will be available here.' />
                </p>
            </div>
        </div>
    );
});

export default SignalScanner;
