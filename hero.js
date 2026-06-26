/* ===== STX League MD — конфигурация =====
   ВНИМАНИЕ: значения в этом файле ПУБЛИЧНЫЕ. Они отправляются в браузер каждому
   посетителю и видны через F12. Это нормально для:
     - Supabase URL
     - Supabase publishable key (бывш. anon key)
   Эти ключи дают только то, что разрешено через Row Level Security (RLS).
   Настоящая защита — на стороне БД Postgres, не в JS.

   НИКОГДА не клади сюда:
     - service_role key
     - database password
     - Discord Client Secret
*/
(function() {
    'use strict';

    window.STX_CONFIG = {
        SUPABASE_URL: 'https://vhqsnkktdkcamhvkndpt.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_6GvBFi1VnYkWUGykgqz9MQ_P4JRoSPb',

        // Дата старта турнира (для countdown)
        TOURNAMENT_DATE: '2026-08-15T10:00:00+03:00',

        // Максимум команд
        MAX_TEAMS: 16,

        // Канонический домен (для редиректов и SEO)
        SITE_URL: 'https://stxleague.xyz',

        // ====================================================================
        // РЕГИСТРАЦИЯ — теперь управляется из админ-панели (таблица settings в Supabase)!
        // Значение ниже используется только как fallback если БД недоступна.
        // ====================================================================
        REGISTRATION_OPEN: false
    };
})();
