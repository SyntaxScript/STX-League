/* ===== Supabase client + общая логика авторизации =====
   Использует UMD-сборку supabase-js v2, подключённую через CDN в HTML.

   Экспортирует window.STX:
     - client       — экземпляр Supabase client
     - currentUser  — текущий пользователь (или null)
     - isAdmin      — admin?
     - signInWithDiscord()
     - signOut()
     - getDiscordId(user) — helper
*/
(function() {
    'use strict';

    if (!window.supabase || !window.supabase.createClient) {
        console.error('[STX] Supabase JS не загружен! Проверь <script src="...supabase-js..."> в HTML.');
        return;
    }
    if (!window.STX_CONFIG) {
        console.error('[STX] STX_CONFIG не найден! Подключи js/config.js ПЕРЕД supabase-client.js');
        return;
    }

    var cfg = window.STX_CONFIG;
    var client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    });

    // === Helpers ===
    function getDiscordId(user) {
        if (!user) return null;
        // Discord OAuth кладёт ID в user_metadata.provider_id или user_metadata.sub
        return (user.user_metadata && (user.user_metadata.provider_id || user.user_metadata.sub)) || null;
    }

    function getDiscordUsername(user) {
        if (!user || !user.user_metadata) return 'Player';
        var m = user.user_metadata;
        return m.custom_claims && m.custom_claims.global_name
            || m.full_name
            || m.name
            || m.preferred_username
            || m.user_name
            || 'Player';
    }

    function getDiscordAvatar(user) {
        if (!user || !user.user_metadata) return null;
        return user.user_metadata.avatar_url || null;
    }

    // === Auth actions ===
    function signInWithDiscord() {
        return client.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
    }

    function signOut() {
        return client.auth.signOut().then(function() {
            window.location.reload();
        });
    }

    // === Admin check (через таблицу admins + RLS) ===
    function checkAdmin(user) {
        if (!user) return Promise.resolve(false);
        var did = getDiscordId(user);
        if (!did) return Promise.resolve(false);
        // RLS позволяет SELECT из admins только если is_admin() = true
        // → если запрос вернул хоть что-то, значит мы админ
        return client
            .from('admins')
            .select('id')
            .eq('discord_id', did)
            .limit(1)
            .then(function(res) {
                if (res.error) {
                    // RLS блокирует SELECT для не-админов → это нормально
                    return false;
                }
                return res.data && res.data.length > 0;
            })
            .catch(function() { return false; });
    }

    // === State ===
    var STX = {
        client: client,
        currentUser: null,
        isAdmin: false,
        loaded: false,

        signInWithDiscord: signInWithDiscord,
        signOut: signOut,
        getDiscordId: getDiscordId,
        getDiscordUsername: getDiscordUsername,
        getDiscordAvatar: getDiscordAvatar,

        // Колбэки которые навешивают другие модули
        _onAuthCallbacks: [],
        onAuth: function(cb) {
            this._onAuthCallbacks.push(cb);
            if (this.loaded) cb(this.currentUser, this.isAdmin);
        }
    };
    window.STX = STX;

    function fireAuth() {
        STX._onAuthCallbacks.forEach(function(cb) {
            try { cb(STX.currentUser, STX.isAdmin); } catch(e) { console.error(e); }
        });
        document.dispatchEvent(new CustomEvent('stx:auth', {
            detail: { user: STX.currentUser, isAdmin: STX.isAdmin }
        }));
    }

    // === Загрузка сессии при старте + обработка возврата с Discord ===
    client.auth.getSession().then(function(res) {
        var session = res.data && res.data.session;
        STX.currentUser = session ? session.user : null;

        if (STX.currentUser) {
            checkAdmin(STX.currentUser).then(function(isAdm) {
                STX.isAdmin = isAdm;
                STX.loaded = true;
                fireAuth();
            });
        } else {
            STX.loaded = true;
            fireAuth();
        }
    });

    // === Подписка на изменения авторизации ===
    client.auth.onAuthStateChange(function(event, session) {
        STX.currentUser = session ? session.user : null;
        if (STX.currentUser) {
            checkAdmin(STX.currentUser).then(function(isAdm) {
                STX.isAdmin = isAdm;
                fireAuth();
            });
        } else {
            STX.isAdmin = false;
            fireAuth();
        }
    });
})();
