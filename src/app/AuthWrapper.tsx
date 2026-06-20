import React from 'react';
import Cookies from 'js-cookie';
import ChunkLoader from '@/components/loader/chunk-loader';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { clearAuthData } from '@/utils/auth-utils';
import { localize } from '@deriv-com/translations';
import { URLUtils, LocalStorageUtils, LocalStorageConstants } from '@deriv-com/utils';
import App from './App';

// Extend Window interface to include is_tmb_enabled property
declare global {
    interface Window {
        is_tmb_enabled?: boolean;
    }
}

// Intercept OIDC well-known config fetches to redirect from oauth.deriv.com
// to auth.deriv.com, where new developer portal apps (alphanumeric client_ids) live.
(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (url, options) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url?.url || '';
        if (urlStr.includes('/.well-known/openid-configuration')) {
            return originalFetch(urlStr.replace('oauth.deriv.com', 'auth.deriv.com'), options)
                .then(async response => {
                    const config = await response.clone().json();
                    config.issuer = config.issuer.replace('auth.deriv.com', 'oauth.deriv.com');
                    return new Response(JSON.stringify(config), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: { 'Content-Type': 'application/json' },
                    });
                });
        }
        return originalFetch(url, options);
    };
    // Strip 'openid' from scope parameters — client is registered as OAuth 2.0, not OIDC
    const origAppend = URLSearchParams.prototype.append;
    const origSet = URLSearchParams.prototype.set;
    URLSearchParams.prototype.append = function (name, value) {
        if (name === 'scope') {
            const filtered = value.split(' ').filter(s => s !== 'openid').join(' ');
            if (filtered) return origAppend.call(this, name, filtered);
            return;
        }
        return origAppend.call(this, name, value);
    };
    URLSearchParams.prototype.set = function (name, value) {
        if (name === 'scope') {
            const filtered = value.split(' ').filter(s => s !== 'openid').join(' ');
            if (filtered) return origSet.call(this, name, filtered);
            return;
        }
        return origSet.call(this, name, value);
    };
    // Redirect legacy token exchange through our API proxy to avoid CORS
    const origFetch = window.fetch.bind(window);
    window.fetch = (url, options) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url?.url || '';
        // OIDC well-known config: redirect to auth.deriv.com
        if (urlStr.includes('/.well-known/openid-configuration')) {
            return origFetch(urlStr.replace('oauth.deriv.com', 'auth.deriv.com'), options)
                .then(async response => {
                    const config = await response.clone().json();
                    config.issuer = config.issuer.replace('auth.deriv.com', 'oauth.deriv.com');
                    return new Response(JSON.stringify(config), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: { 'Content-Type': 'application/json' },
                    });
                });
        }
        // Legacy token exchange: proxy through our API to avoid CORS
        if (urlStr.includes('/oauth2/legacy/tokens')) {
            return origFetch(urlStr.replace('https://oauth.deriv.com/oauth2/legacy/tokens', '/api/legacy-tokens'), options);
        }
        return origFetch(url, options);
    };
})();

const setLocalStorageToken = async (
    loginInfo: URLUtils.LoginInfo[],
    paramsToDelete: string[],
    setIsAuthComplete: React.Dispatch<React.SetStateAction<boolean>>,
    isOnline: boolean
) => {
    if (loginInfo.length) {
        try {
            const defaultActiveAccount = URLUtils.getDefaultActiveAccount(loginInfo);
            if (!defaultActiveAccount) return;

            const accountsList: Record<string, string> = {};
            const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

            loginInfo.forEach((account: { loginid: string; token: string; currency: string }) => {
                accountsList[account.loginid] = account.token;
                clientAccounts[account.loginid] = account;
            });

            localStorage.setItem('accountsList', JSON.stringify(accountsList));
            localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

            URLUtils.filterSearchParams(paramsToDelete);

            // Skip API connection when offline
            if (!isOnline) {
                console.log('[Auth] Offline mode - skipping API connection');
                localStorage.setItem('authToken', loginInfo[0].token);
                localStorage.setItem('active_loginid', loginInfo[0].loginid);
                return;
            }

            try {
                const api = await generateDerivApiInstance();

                if (api) {
                    const { authorize, error } = await api.authorize(loginInfo[0].token);
                    api.disconnect();
                    if (error) {
                        // Check if the error is due to an invalid token
                        if (error.code === 'InvalidToken') {
                            // Set isAuthComplete to true to prevent the app from getting stuck in loading state
                            setIsAuthComplete(true);

                            const is_tmb_enabled = window.is_tmb_enabled === true;
                            // Only emit the InvalidToken event if logged_state is true
                            if (Cookies.get('logged_state') === 'true' && !is_tmb_enabled) {
                                // Emit an event that can be caught by the application to retrigger OIDC authentication
                                globalObserver.emit('InvalidToken', { error });
                            }

                            if (Cookies.get('logged_state') === 'false') {
                                // If the user is not logged out, we need to clear the local storage
                                clearAuthData();
                            }
                        }
                    } else {
                        localStorage.setItem('client.country', authorize.country);
                        const firstId = authorize?.account_list[0]?.loginid;
                        const filteredTokens = loginInfo.filter(token => token.loginid === firstId);
                        if (filteredTokens.length) {
                            localStorage.setItem('authToken', filteredTokens[0].token);
                            localStorage.setItem('active_loginid', filteredTokens[0].loginid);
                            return;
                        }
                    }
                }
            } catch (apiError) {
                console.error('[Auth] API connection error:', apiError);
                // Still set token in offline mode
                localStorage.setItem('authToken', loginInfo[0].token);
                localStorage.setItem('active_loginid', loginInfo[0].loginid);
            }

            localStorage.setItem('authToken', loginInfo[0].token);
            localStorage.setItem('active_loginid', loginInfo[0].loginid);
        } catch (error) {
            console.error('Error setting up login info:', error);
        }
    }
};

export const AuthWrapper = () => {
    const [isAuthComplete, setIsAuthComplete] = React.useState(false);
    const { loginInfo, paramsToDelete } = URLUtils.getLoginInfoFromURL();
    const { isOnline } = useOfflineDetection();

    // Set config.app_id from DERIV_APP_ID env var for unknown domains (e.g. Vercel).
    // This value is used by @deriv-com/auth-client as the OIDC client_id (may be alphanumeric).
    // Our custom getAppId() in config.ts does NOT read this key — it uses its own logic
    // to return a numeric app_id for the Deriv WebSocket API.
    React.useEffect(() => {
        const app_id = process.env.DERIV_APP_ID;
        if (app_id && !LocalStorageUtils.getValue(LocalStorageConstants.configAppId)) {
            LocalStorageUtils.setValue(LocalStorageConstants.configAppId, app_id);
        }
    }, []);

    React.useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Pass isOnline to setLocalStorageToken to handle offline mode properly
                await setLocalStorageToken(loginInfo, paramsToDelete, setIsAuthComplete, isOnline);
                URLUtils.filterSearchParams(['lang']);
                setIsAuthComplete(true);
            } catch (error) {
                console.error('[Auth] Authentication initialization failed:', error);
                // Don't block the app if auth fails, especially when offline
                setIsAuthComplete(true);
            }
        };

        // If offline, set auth complete immediately but still run initializeAuth
        // to save login info to localStorage for offline use
        if (!isOnline) {
            console.log('[Auth] Offline detected, proceeding with minimal auth');
            setIsAuthComplete(true);
        }

        initializeAuth();
    }, [loginInfo, paramsToDelete, isOnline]);

    // Add timeout for offline scenarios to prevent infinite loading
    React.useEffect(() => {
        if (!isOnline && !isAuthComplete) {
            console.log('[Auth] Offline detected, setting auth timeout');
            const timeout = setTimeout(() => {
                console.log('[Auth] Offline timeout reached, proceeding without full auth');
                setIsAuthComplete(true);
            }, 2000); // 2 second timeout for offline

            return () => clearTimeout(timeout);
        }
    }, [isOnline, isAuthComplete]);

    const getLoadingMessage = () => {
        if (!isOnline) return localize('Loading offline mode...');
        return localize('Initializing...');
    };

    if (!isAuthComplete) {
        return <ChunkLoader message={getLoadingMessage()} />;
    }

    return <App />;
};
