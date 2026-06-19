import { useMemo,useState } from 'react';
import { observer } from 'mobx-react-lite';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './free-bots.scss';

interface Bot {
    id: string;
    name: string;
    description: string;
    fileName: string;
    category: string;
    icon: string;
}

const BOTS: Bot[] = [
    {
        id: '1',
        name: 'Expert Speed Bot',
        description:
            'Advanced speed trading bot with optimized entry and exit points for quick trades on volatility indices.',
        fileName: '2_2025_Updated_Expert_Speed_Bot_Version_📉📉📉📈📈📈_1_1_1765711647656.xml',
        category: 'Speed Trading',
        icon: '⚡',
    },
    {
        id: '2',
        name: 'Candle Mine Bot',
        description: 'Analyzes candlestick patterns to identify profitable trading opportunities on synthetic indices.',
        fileName: '3_2025_Updated_Version_Of_Candle_Mine🇬🇧_1765711647657.xml',
        category: 'Pattern Analysis',
        icon: '🕯️',
    },
    {
        id: '3',
        name: 'Accumulators Pro Bot',
        description: 'Professional accumulator strategy bot for consistent growth trading on volatility markets.',
        fileName: 'Accumulators_Pro_Bot_1765711647657.xml',
        category: 'Accumulators',
        icon: '📈',
    },
    {
        id: '4',
        name: 'AI Entry Point Bot',
        description: 'AI-powered bot that identifies optimal entry points for maximum profit on synthetic indices.',
        fileName: 'AI_with_Entry_Point_1765711647658.xml',
        category: 'AI Trading',
        icon: '🤖',
    },
    {
        id: '5',
        name: 'Alex Speed Bot EXPRO2',
        description:
            'Enhanced speed trading bot with advanced algorithms for rapid execution on volatility 1s indices.',
        fileName: 'ALEXSPEEDBOT__EXPRO2_(2)_(1)_1765711647659.xml',
        category: 'Speed Trading',
        icon: '🚀',
    },
    {
        id: '6',
        name: 'Alpha AI Two Predictions',
        description: 'Dual prediction AI system for higher accuracy in market forecasting on synthetic indices.',
        fileName: 'Alpha_Ai_Two_Predictions__1765711647659.xml',
        category: 'AI Trading',
        icon: '🎯',
    },
    {
        id: '7',
        name: 'Auto C4 Volt Premium',
        description: 'Premium automated trading bot with advanced market analysis and volatility index strategies.',
        fileName: 'AUTO_C4_VOLT_🇬🇧_2_🇬🇧_AI_PREMIUM_ROBOT_(2)_(1)_1765711647660.xml',
        category: 'Premium',
        icon: '⚡',
    },
    {
        id: '8',
        name: 'Binary Flipper AI Plus',
        description: 'AI-enhanced binary options trading bot with flip strategy optimization for volatility indices.',
        fileName: 'BINARY_FLIPPER_AI_ROBOT_PLUS_+_1765711647660.xml',
        category: 'AI Trading',
        icon: '🔄',
    },
    {
        id: '9',
        name: 'Binarytool Wizard AI',
        description: 'Intelligent trading wizard with multiple strategy implementations for synthetic index trading.',
        fileName: 'BINARYTOOL_WIZARD_AI_BOT_1765711647661.xml',
        category: 'AI Trading',
        icon: '🧙',
    },
    {
        id: '10',
        name: 'Binarytool Differ V2.0',
        description: 'Version 2.0 differ bot with improved accuracy and performance on volatility indices.',
        fileName: 'BINARYTOOL@_DIFFER_V2.0_(1)_(1)_1765711647662.xml',
        category: 'Differ',
        icon: '📊',
    },
    {
        id: '11',
        name: 'Even Odd Thunder AI Pro',
        description: 'Professional even/odd prediction bot with thunder-fast execution on volatility 1s indices.',
        fileName: 'BINARYTOOL@EVEN_ODD_THUNDER_AI_PRO_BOT_1765711647662.xml',
        category: 'Even/Odd',
        icon: '⚡',
    },
    {
        id: '12',
        name: 'Even & Odd AI Bot',
        description: 'Smart AI bot specialized in even and odd digit predictions on volatility indices.',
        fileName: 'BINARYTOOL@EVEN&ODD_AI_BOT_(2)_1765711647663.xml',
        category: 'Even/Odd',
        icon: '🎲',
    },
    {
        id: '13',
        name: 'Updated Expert Speed Bot 2025',
        description:
            'The latest 2025 updated version of the expert speed bot with enhanced algorithms for volatility markets.',
        fileName: '5 2025 Updated Expert Speed Bot  Version 📉📉📉📈📈📈 (1) (1).xml',
        category: 'Speed Trading',
        icon: '🏎️',
    },
    {
        id: '14',
        name: 'Auto C5 Remade',
        description:
            'Remastered auto trading bot with improved logic and better entry strategies for synthetic indices.',
        fileName: 'Auto C5 Remade.xml',
        category: 'Auto Trading',
        icon: '🤖',
    },
    {
        id: '15',
        name: 'Big Boyz Auto Original',
        description: 'Original big boyz automated trading bot designed for consistent returns on volatility markets.',
        fileName: 'Big Boyz Auto Original 💵💵 (1).xml',
        category: 'Auto Trading',
        icon: '💰',
    },
    {
        id: '16',
        name: 'Digits Trading Assistant',
        description: 'Specialized digits trading bot for precision trading on digit-based markets with smart analysis.',
        fileName: 'digits.xml',
        category: 'Digits',
        icon: '🔢',
    },
    {
        id: '17',
        name: 'DP Speed Bot',
        description: 'Direct proportional speed bot for fast and efficient trading on volatility 1s indices.',
        fileName: 'DP Speed  Bot.xml',
        category: 'Speed Trading',
        icon: '🏎️',
    },
    {
        id: '18',
        name: 'DP Speed Bot V1',
        description: 'First version of the DP speed bot with proven strategies for rapid market execution.',
        fileName: 'DP Speed Bot  V1.xml',
        category: 'Speed Trading',
        icon: '🚀',
    },
    {
        id: '19',
        name: 'DP Speed Bot V2',
        description: 'Second generation DP speed bot with enhanced performance and refined entry algorithms.',
        fileName: 'DP Speed  Bot  V2.xml',
        category: 'Speed Trading',
        icon: '⚡',
    },
    {
        id: '20',
        name: 'Gold Crown Management',
        description: 'Premium gold crown bot with zero-analysis management system for volatility index trading.',
        fileName: 'GOLDCROWN WITH MANAGEMENT ZERO ANALYSIS 💥.xml',
        category: 'Premium',
        icon: '👑',
    },
    {
        id: '21',
        name: 'Karis Recovery Bot',
        description: 'Specialized recovery bot designed to recoup losses with smart martingale and stake management.',
        fileName: 'Karis Recovery Bot(1)(1).xml',
        category: 'Recovery',
        icon: '♻️',
    },
    {
        id: '22',
        name: 'Matches BBot',
        description: 'Matches bot that trades on match/differ digit strategies for volatility 1s indices.',
        fileName: 'Matches BBot (1).xml',
        category: 'Matches',
        icon: '🏏',
    },
    {
        id: '23',
        name: 'Matches Differ Bot',
        description: 'Differ strategy bot for trading volatility indices with match-based entry signals.',
        fileName: 'Matches Differ Bot (1).xml',
        category: 'Matches',
        icon: '📊',
    },
    {
        id: '24',
        name: 'Over Under Apex Bot',
        description: 'Apex over/under trading bot with advanced prediction algorithms for digit markets.',
        fileName: 'Over under Apex bot.xml',
        category: 'Over/Under',
        icon: '🎯',
    },
    {
        id: '25',
        name: 'R_F Speed Bot',
        description: 'Rise/Fall speed bot optimized for rapid trade execution on random indices.',
        fileName: 'R_F Speed  Bot (1).xml',
        category: 'Speed Trading',
        icon: '🚀',
    },
    {
        id: '26',
        name: 'Speed RF v2.2',
        description: 'Version 2.2 of the speed rise/fall bot with fine-tuned parameters for better accuracy.',
        fileName: 'Speed RF v2_2 (1) (1)(2)-1.xml',
        category: 'Speed Trading',
        icon: '⚡',
    },
    {
        id: '27',
        name: 'SpeedBot',
        description: 'A versatile speed trading bot designed for fast execution on synthetic index markets.',
        fileName: 'SpeedBot.xml',
        category: 'Speed Trading',
        icon: '🤖',
    },
    {
        id: '28',
        name: 'SpeedBot1',
        description: 'High-performance speed bot variant with optimized entry logic for volatility indices.',
        fileName: 'SpeedBot1.xml',
        category: 'Speed Trading',
        icon: '🏎️',
    },
    {
        id: '29',
        name: 'SpeedBot1 v2',
        description: 'Alternate version of the SpeedBot1 with different parameter tuning for varied market conditions.',
        fileName: 'SpeedBot1 (1).xml',
        category: 'Speed Trading',
        icon: '🏎️',
    },
    {
        id: '30',
        name: 'Tesla Rise/Fall Bot',
        description: 'Tesla-inspired rise/fall bot optimized for R_10 random index with precision entry signals.',
        fileName: 'Tesla rise_fall bot.xml',
        category: 'Rise/Fall',
        icon: '⚡',
    },
    {
        id: '31',
        name: 'Trade Bot 1',
        description: 'General purpose trading bot with configurable parameters for synthetic index markets.',
        fileName: '1.xml',
        category: 'General',
        icon: '1️⃣',
    },
    {
        id: '32',
        name: 'Trade Bot 2',
        description: 'Versatile trading bot with flexible strategy options for volatility index trading.',
        fileName: '2.xml',
        category: 'General',
        icon: '2️⃣',
    },
    {
        id: '33',
        name: 'Trade Bot 2 v2',
        description: 'Alternate configuration of Trade Bot 2 with different market analysis parameters.',
        fileName: '2 (1).xml',
        category: 'General',
        icon: '🔢',
    },
    {
        id: '34',
        name: 'Under 7 Bot',
        description: 'Specialized under 7 digits bot for predicting digit outcomes on volatility 1s indices.',
        fileName: 'Under 7.xml',
        category: 'Under/Over',
        icon: '7️⃣',
    },
    {
        id: '35',
        name: 'Under 7a Bot',
        description: 'Alternate under 7 bot variant with a different approach to digit prediction strategies.',
        fileName: 'Under 7a.xml',
        category: 'Under/Over',
        icon: '7️⃣',
    },
];

const categoryColors: Record<string, string> = {
    'Speed Trading': '#ff6b6b',
    'Pattern Analysis': '#845ef7',
    Accumulators: '#20c997',
    'AI Trading': '#339af0',
    Premium: '#fcc419',
    Differ: '#748ffc',
    'Even/Odd': '#f06595',
    'Auto Trading': '#22b8cf',
    Digits: '#a9e34b',
    Recovery: '#ff922b',
    Matches: '#7950f2',
    'Over/Under': '#20c997',
    'Rise/Fall': '#ff6b6b',
    General: '#868e96',
    'Under/Over': '#f06595',
};

const FreeBots = observer(() => {
    const { dashboard } = useStore();
    const [loadingBotId, setLoadingBotId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const categories = ['All', ...Array.from(new Set(BOTS.map(bot => bot.category)))];

    const filteredBots = useMemo(() => {
        let result = selectedCategory === 'All' ? BOTS : BOTS.filter(bot => bot.category === selectedCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                bot =>
                    bot.name.toLowerCase().includes(q) ||
                    bot.description.toLowerCase().includes(q) ||
                    bot.category.toLowerCase().includes(q)
            );
        }
        return result;
    }, [selectedCategory, searchQuery]);

    const loadBot = async (bot: Bot) => {
        try {
            setLoadingBotId(bot.id);

            const response = await fetch(`/bots/${encodeURI(bot.fileName)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bot file');
            }

            const xmlContent = await response.text();

            await load({
                block_string: xmlContent,
                file_name: bot.name,
                workspace: window.Blockly?.derivWorkspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });

            dashboard.setActiveTab(1);
            window.location.hash = 'bot_builder';
        } catch (error) {
            console.error('Error loading bot:', error);
        } finally {
            setLoadingBotId(null);
        }
    };

    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <h1 className='free-bots__title'>Free Trading Bots</h1>
                <p className='free-bots__subtitle'>
                    Explore our collection of {BOTS.length} pre-built trading bots. Click on any bot to load it into the
                    Bot Builder.
                </p>
            </div>

            <div className='free-bots__controls'>
                <div className='free-bots__search'>
                    <svg
                        className='free-bots__search-icon'
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <circle cx='11' cy='11' r='8' />
                        <path d='M21 21l-4.35-4.35' />
                    </svg>
                    <input
                        type='text'
                        className='free-bots__search-input'
                        placeholder='Search bots by name, description, or category...'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className='free-bots__search-clear' onClick={() => setSearchQuery('')}>
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <path d='M18 6L6 18M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className='free-bots__categories'>
                {categories.map(category => (
                    <button
                        key={category}
                        className={`free-bots__category-btn ${selectedCategory === category ? 'free-bots__category-btn--active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category !== 'All' && (
                            <span
                                className='free-bots__category-dot'
                                style={{ backgroundColor: categoryColors[category] || '#868e96' }}
                            />
                        )}
                        {category} {category !== 'All' && `(${BOTS.filter(b => b.category === category).length})`}
                    </button>
                ))}
            </div>

            <div className='free-bots__stats'>
                <span>
                    Showing {filteredBots.length} of {BOTS.length} bots
                </span>
            </div>

            <div className='free-bots__grid'>
                {filteredBots.map(bot => (
                    <div
                        key={bot.id}
                        className='free-bots__card'
                        style={{ '--card-accent': categoryColors[bot.category] || '#ff444f' } as React.CSSProperties}
                    >
                        <div
                            className='free-bots__card-topbar'
                            style={{ background: categoryColors[bot.category] || '#ff444f' }}
                        />
                        <div className='free-bots__card-body'>
                            <div className='free-bots__card-header'>
                                <span className='free-bots__card-icon'>{bot.icon}</span>
                                <span
                                    className='free-bots__card-category'
                                    style={{
                                        color: categoryColors[bot.category] || '#ff444f',
                                        borderColor: categoryColors[bot.category] || '#ff444f',
                                    }}
                                >
                                    {bot.category}
                                </span>
                            </div>
                            <h3 className='free-bots__card-title'>{bot.name}</h3>
                            <p className='free-bots__card-description'>{bot.description}</p>
                        </div>
                        <div className='free-bots__card-footer'>
                            <button
                                className='free-bots__card-btn'
                                onClick={() => loadBot(bot)}
                                disabled={loadingBotId === bot.id}
                            >
                                {loadingBotId === bot.id ? (
                                    <span className='free-bots__card-btn-loading'>Loading...</span>
                                ) : (
                                    <>
                                        <span>Load in Bot Builder</span>
                                        <svg
                                            width='16'
                                            height='16'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        >
                                            <path d='M5 12h14M12 5l7 7-7 7' />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBots.length === 0 && (
                <div className='free-bots__empty'>
                    <span className='free-bots__empty-icon'>🔍</span>
                    <p>No bots found matching your search.</p>
                    <button
                        className='free-bots__empty-btn'
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            <div className='free-bots__footer'>
                <p>All bots are provided for educational purposes. Always test with demo accounts first.</p>
            </div>
        </div>
    );
});

export default FreeBots;
