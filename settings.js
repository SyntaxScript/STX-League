/* ===== STX League MD — глобальные настройки (из таблицы settings)
   Загружаются при старте каждой страницы.
   Используется в register.js и common.js вместо STX_CONFIG.REGISTRATION_OPEN.
*/
(function() {
    'use strict';

    // Дефолтные значения (используются если БД недоступна)
    var defaults = {
        registration_open: false
    };

    var state = Object.assign({}, defaults);
    var loaded = false;
    var loadingPromise = null;

    function load() {
        if (loadingPromise) return loadingPromise;
        loadingPromise = new Promise(function(resolve) {
            // ждём пока supabase client будет готов
            function tryLoad() {
                if (!window.STX || !window.STX.client) {
                    setTimeout(tryLoad, 100);
                    return;
                }
                window.STX.client
                    .from('settings')
                    .select('key, value')
                    .then(function(res) {
                        if (res.error) {
                            console.warn('[settings] Не удалось загрузить:', res.error.message);
                        } else if (res.data) {
                            res.data.forEach(function(row) {
                                state[row.key] = row.value;
                            });
                        }
                        loaded = true;
                        resolve(state);
                        document.dispatchEvent(new CustomEvent('stx:settings', { detail: state }));
                    });
            }
            tryLoad();
        });
        return loadingPromise;
    }

    function get(key) {
        return state[key];
    }

    function set(key, value) {
        // Только админ может — RLS проверит на стороне БД
        return window.STX.client
            .from('settings')
            .update({ value: value })
            .eq('key', key)
            .then(function(res) {
                if (!res.error) {
                    state[key] = value;
                    document.dispatchEvent(new CustomEvent('stx:settings', { detail: state }));
                }
                return res;
            });
    }

    window.STX_SETTINGS = {
        load: load,
        get: get,
        set: set,
        isLoaded: function() { return loaded; },
        onReady: function(cb) {
            if (loaded) cb(state);
            else load().then(cb);
        }
    };

    // Автозагрузка при старте страницы
    load();
})();
