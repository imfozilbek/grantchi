# Worker grantchi.uz

Один Worker со статическими файлами на бесплатном тарифе Cloudflare:

- `/` и `/admin` — статические файлы из `public/`. Они отдаются без вызова Worker и не тратят лимит в 5000 запросов в сутки.
- `/api/internal/*` — приём черновиков и расхода квот AI от сборщика. Доступ по секрету `INGEST_SECRET`.
- `/api/admin/*` — API модерации. Доступ через Cloudflare Access: Worker сам проверяет токен Access и отказывает, если Access не настроен.
- Один cron раз в 10 минут. Сейчас он раз в сутки, после 00:00 UTC, переводит одобренные возможности с прошедшим дедлайном в статус «expired».

Это Worker, а не Pages Functions: у Pages нет cron.

## База D1

`migrations/0001_init.sql`:
- `opportunities`: черновики и одобренные карточки. Поля для фильтров (`status`, `type`, `deadline`, `collected_at`) вынесены в отдельные колонки, и на каждый WHERE и ORDER BY есть индекс.
- `ai_quota`: одна строка на (провайдер, день).

Списки отдаются постранично, курсором, без `OFFSET` и `COUNT(*)`.

## Первый запуск (делает владелец аккаунта)

1. Создать базу: `npx wrangler d1 create grantchi`. Вписать её `database_id` в `wrangler.jsonc`.
2. Секрет для сборщика: придумать длинную случайную строку.
   - В Worker: `npx wrangler secret put INGEST_SECRET`.
   - В GitHub, в секретах Actions: `GRANTCHI_INGEST_SECRET` с тем же значением и переменная `GRANTCHI_API_URL` = `https://grantchi.uz`.
3. Cloudflare Access (Zero Trust, бесплатно до 50 человек): приложение на `grantchi.uz/admin` и `grantchi.uz/api/admin`, доступ по почте модераторов. Его AUD-тег и имя команды вписать в `wrangler.jsonc`: `ACCESS_AUD` и `ACCESS_TEAM_DOMAIN`.
4. WAF: одно правило ограничения частоты на `/api/*` (на бесплатном тарифе доступно одно правило).
5. Деплой из CI: в GitHub, в секретах Actions, `CLOUDFLARE_API_TOKEN` (права Workers Scripts, D1, Workers Routes на зону grantchi.uz) и `CLOUDFLARE_ACCOUNT_ID`. После этого каждый пуш в `main` с изменениями в `worker/` проверяет код, применяет миграции и деплоит.

## Локально

```sh
npm ci
npm test          # тесты в рантайме Workers с локальной D1
npm run typecheck
npm run dev       # локальный сервер с локальной D1
```
