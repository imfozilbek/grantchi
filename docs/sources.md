# Источники возможностей

Проверка на 27.09.2026. Сайты проверены запросом, Telegram-каналы — через публичное превью `t.me/s/<канал>` (дата последнего поста и число подписчиков; эту же страницу Worker может парсить как ленту).

**Итого: 97 источников**, прошедших планку качества (живые в 2025–2026, реальные проверяемые возможности, доступны для граждан Узбекистана / Центральной Азии / всего мира). До 100 не добивали слабыми.

**Обозначения:**
- ✅ проверено: ответ получен, дата последнего поста указана.
- ⚠ сайт живой, но блокирует ботов (403/412/503) или отвечает нестабильно — читать через Telegram, агрегаторы или вручную.
- ❓ не проверено.

**Как собирать:** живых RSS ~20, JSON API — 6 (EU SEDIA и 5 соревновательных), остальное — разбор HTML или `t.me/s/`.

## Правила

- Официальный сайт программы — источник правды: дедлайн, требования и документы сверяем с ним.
- С агрегаторов берём данные, модель переводит на узбекский, перефразирует и раскладывает по нашей структуре карточки. В карточке — ссылка на официальный сайт.
- Сначала RSS или API, потом парсинг страниц.
- Раз в неделю проверяем `lastBuildDate` фидов, чтобы ловить тихо сломанные.

## 1. Официальные программы (правительства, фонды, университеты)

| Источник | URL | RSS/API | Активность | Что публикует | Почему качественный |
|---|---|---|---|---|---|
| Türkiye Bursları | turkiyeburslari.gov.tr/en/announcements | нет, HTML | ✅, раз в год (янв–фев) | бакалавриат, магистратура, PhD в Турции | госпрограмма, первоисточник |
| GKS (Корея) | studyinkorea.go.kr | нет, доска объявлений | ✅, даты окт 2026 | GKS для магистратуры и бакалавриата | первоисточник |
| CSC / Campus China | campuschina.org | нет | ⚠ 412 для ботов | стипендии правительства КНР | первоисточник |
| Stipendium Hungaricum | stipendiumhungaricum.hu/feed/ | **RSS ✅** | ✅ 07.09.2026, редко | стипендии Венгрии, новости набора | первоисточник, Узбекистан в списке стран |
| MEXT (Study in Japan) | studyinjapan.go.jp/en/ | нет | ✅; посольство uz.emb-japan.go.jp ⚠403 | стипендия MEXT | первоисточник |
| JDS (Япония) | jds-scholarship.org/country/uzbekistan/ | нет | ✅, раз в год | магистратура в Японии для госслужащих Узбекистана | программа именно для Узбекистана |
| Квота РФ | education-in-russia.com | нет | ✅ | госквота РФ | первоисточник |
| Олимпиада «Открытые двери» | od.globaluni.ru | нет | ✅ даты ноя 2026 | олимпиада для иностранцев с грантом в вузы РФ | официальная, популярна в СНГ |
| DAAD Scholarship DB | www2.daad.de/…/scholarship-database | нет, HTML с фильтром по стране | ✅ | стипендии Германии | официальная база |
| Erasmus Mundus Catalogue | eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en | нет | ✅, набор окт–янв | совместные магистратуры ЕС | EACEA |
| Erasmus+ Uzbekistan (NEO) | erasmusplus.uz | нет | ✅ | Erasmus+, мобильность, CBHE | национальный офис |
| Chevening | chevening.org/scholarships/ | нет | ⚠ 403, набор авг–окт | магистратура в Великобритании | первоисточник |
| Swedish Institute | si.se/en/feed/ | **RSS ✅** | ✅ 24.09.2026 | SI Scholarships, программы (есть шум) | первоисточник |
| Swiss Government Excellence (ESKAS) | sbfi.admin.ch (страница ESKAS) | нет | ✅ 09.2026 | PhD и постдок в Швейцарии | первоисточник |
| Campus France (Eiffel) | campusfrance.org/en | нет | ✅; ouzbekistan.campusfrance.org ⚠503 | стипендии Франции | первоисточник |
| MAECI (Италия) | studyinitaly.esteri.it | нет | ✅, раз в год | стипендии МИД Италии | первоисточник |
| ICCR A2A (Индия) | a2ascholarships.iccr.gov.in | нет | ✅ | стипендии ICCR | первоисточник |
| ITEC (Индия) | itecgoi.in | нет | ✅ | бесплатные короткие курсы | Узбекистан — страна-партнёр |
| IsDB Scholarships | isdb.org/scholarships | нет | ✅ | бакалавриат, магистратура, PhD | Узбекистан — член IsDB |
| ADB-Japan Scholarship | adb.org/work-with-us/careers/japan-scholarship-program | нет | ✅ | магистратура в Азии | первоисточник |
| World Bank JJ/WBGSP | worldbank.org/en/programs/scholarships | нет | ✅ | магистратура в сфере развития | первоисточник |
| Humboldt Foundation | humboldt-foundation.de/en/apply/sponsorship-programmes | нет | ✅ 09.2026 | исследовательские стипендии | первоисточник |
| TWAS | twas.org/rss.xml; раздел /opportunities | **RSS ✅** | ✅ 07.2026 | гранты и стипендии для Global South | первоисточник |
| Schwarzman Scholars | schwarzmanscholars.org | нет | ✅ 23.09.2026 | магистратура в Китае | открыт всем странам |
| Knight-Hennessy | knight-hennessy.stanford.edu | нет | ✅ | магистратура и PhD в Стэнфорде | открыт всем странам |
| Rhodes (Global) | rhodeshouse.ox.ac.uk | нет | ✅ 22.09.2026 | Оксфорд | есть глобальный конкурс |
| Gates Cambridge | gatescambridge.org | нет | ✅ 20.09.2026 | Кембридж | открыт всем, кроме граждан UK |
| Yenching Academy | yenchingacademy.pku.edu.cn | нет | ✅ | магистратура в Пекинском университете | открыт всем странам |
| OSCE Academy Bishkek | osce-academy.net/feed/ | **RSS ✅** | ✅ 21.09.2026 | магистратура для Центральной Азии, школы, конференции | региональный первоисточник |

## 2. Обмены, посольства, международные организации

| Источник | URL | RSS/API | Активность | Что публикует | Почему качественный |
|---|---|---|---|---|---|
| Посольство США в Ташкенте | uz.usembassy.gov/feed/ | **RSS** ⚠ нестабилен | еженедельно | Fulbright, UGRAD, Humphrey, малые гранты | первоисточник для Узбекистана |
| EducationUSA | educationusa.state.gov | нет | ✅ | поступление в США, ивенты | Госдеп |
| American Councils | americancouncils.org | RSS мёртв (2022) | ✅ сайт 09.2026 | программы обменов | оператор программ Госдепа |
| British Council Uzbekistan | britishcouncil.uz | нет | ⚠ 403/503 | программы, конкурсы, IELTS | первоисточник |
| Goethe-Institut Ташкент | goethe.de/ins/uz | нет | ⚠ 403 | курсы, стипендии, конкурсы | первоисточник |
| Делегация ЕС в Узбекистане | eeas.europa.eu/delegations/uzbekistan_en | нет | ✅ 26.09.2026 | гранты ЕС, конкурсы | первоисточник |
| UN Volunteers | app.unv.org | нет (SPA) | ✅ | онлайн- и офлайн-волонтёрство | ООН |
| UN Careers (стажировки) | careers.un.org | нет | ✅ | стажировки ООН | ООН |
| UNDP Uzbekistan | t.me/undpuzbekistan (сайт ⚠403) | TG | ✅ 24.09.2026 (4,2K) | конкурсы, вакансии, хакатоны | ООН в Узбекистане |
| UNICEF Uzbekistan | unicef.org/uzbekistan | нет | ✅ | молодёжные программы, конкурсы | ООН |
| UNITAR | unitar.org | нет | ✅ | бесплатные тренинги и курсы | ООН |
| OSCE Jobs | jobs.osce.org | нет | ✅ | стажировки, JPO, Scholarship for Peace | ОБСЕ |
| EU Funding & Tenders | api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA | **API ✅** (POST) | ✅ | гранты Horizon, Erasmus+, MSCA | официальный API ЕС |
| EURAXESS | euraxess.ec.europa.eu/jobs/search, /funding/search | нет | ✅ | PhD, постдок, финансирование исследований | Еврокомиссия |
| WikiCFP | wikicfp.com/cfp/rss?cat=computer%20science | **RSS ✅** | ✅ ежедневно | Call for Papers конференций | стандартный источник для учёных |

## 3. Узбекские источники

| Источник | URL | RSS/API | Активность | Что публикует | Почему качественный |
|---|---|---|---|---|---|
| El-yurt umidi (EYUF) | eyuf.uz; admission.eyuf.uz | нет | ⚠ сайт отдаёт заглушку; конкурсы 2026 были (апрель, 500 квот) | госстипендии за рубеж | главная госпрограмма; следить через новости и grantlar |
| Минвуз | edu.uz/uz/news; t.me/eduuz | HTML, TG | ✅ 27.09.2026 (TG 145K) | гранты, конкурсы, обмены | министерство |
| Минпросвещения | uzedu.uz; t.me/uzedu | HTML, TG | ✅ 27.09.2026 (105K) | олимпиады, конкурсы для школьников | министерство |
| Агентство по делам молодёжи | yoshlar.gov.uz; t.me/yoshlaragentligi | TG | ✅ 27.09.2026 (265K) | молодёжные гранты, конкурсы | госагентство |
| Союз молодёжи | t.me/yoshlarittifoqi_uz | TG | ✅ 26.09.2026 (35K) | конкурсы, форумы | официальный |
| Yoshlarni qo‘llab-quvvatlash | t.me/YQQUZB_KANAL | TG | ✅ 19.09.2026 (34,8K) | программы поддержки молодёжи | официальный |
| IT Park Uzbekistan | it-park.uz; t.me/itpark_uz | TG | ✅ 27.09.2026 (17,6K) | хакатоны, стартап-программы, IT-курсы | госоператор IT |
| Агентство инновационного развития | innovation.gov.uz/contest | нет | ⚠ не ответил | гранты «Eng innovatsion g‘oya», научные конкурсы | официальный |
| Минцифры | digital.uz | нет | ✅ 27.09.2026 | IT-конкурсы, программы | министерство |
| UzVC | uzvc.uz; t.me/uzvc_uz | TG | ✅ 21.09.2026 | венчур, акселерация | госвенчурный фонд |
| Yoshlar Akademiyasi | yoshlarakademiyasi.uz | нет | ✅ 27.09.2026 | гранты и стажировки молодым учёным | госструктура |
| Агентство президентских и специализированных школ | piima.uz | нет | ✅ 27.09.2026 | олимпиады, приём | госструктура |
| Grantlar.uz | grantlar.uz/feed/; t.me/grantlar | **RSS ✅** + TG | ✅ 23.09.2026, TG ежедневно (79K) | стипендии, гранты, стажировки (узб.) | крупнейший узбекский агрегатор |
| GrantGO | grantgo.uz/sitemap.xml; t.me/grantgouz | sitemap с lastmod ✅ + TG | ✅ 25.09.2026 (47,8K), ~1800 URL | все типы возможностей | структурированная база на узбекском |
| GRANTS.UZ | t.me/grantsuzb | TG | ✅ 26.09.2026 (1,6K) | учёба за рубежом | ⚠ маленький, вторичный |

## 4. Международные агрегаторы (EN)

| Источник | URL | RSS/API | Активность | Что публикует | Почему качественный |
|---|---|---|---|---|---|
| Opportunity Desk | opportunitydesk.org/feed/ | **RSS ✅** | ✅ 26.09.2026, ежедневно | стипендии, фелоушипы, конкурсы | ссылается на первоисточник |
| Opportunities for Youth | opportunitiesforyouth.org/feed/ | **RSS ✅** | ✅ 27.09.2026, ежедневно | всё | ссылки на официальные страницы |
| Opportunities Circle | opportunitiescircle.com/feed/; t.me/opportunitiescircleofficial | **RSS ✅** + TG 101K | ✅ 27.09.2026 | всё | указывает eligibility |
| OYA Opportunities | oyaop.com/feed/ | **RSS ✅** | ✅ 27.09.2026 | всё | структурные карточки |
| Global South Opportunities | globalsouthopportunities.com/feed/ | **RSS ✅** | ✅ 27.09.2026 | стипендии, фелоушипы | фокус на развивающиеся страны |
| fundsforNGOs | fundsforngos.org/feed/ | **RSS ✅** | ✅ 25.09.2026 | гранты для НКО и молодёжи, в т.ч. Центральная Азия | профильный |
| ProFellow | profellow.com/feed/ | **RSS ✅** | ✅ 24.09.2026 | фелоушипы | курируемая база |
| Mladiinfo | mladiinfo.eu/feed/ | **RSS ✅** | ✅ 10.08.2026, реже | обмены, летние школы | давний молодёжный портал |
| Opportunities Corners | opportunitiescorners.com/feed/ | **RSS ✅** | ✅ 27.09.2026 | стипендии, стажировки | ⚠ дедлайны сверять |
| Scholarships Corner | scholarshipscorner.website/feed/; t.me/scholarshipscorner | **RSS ✅** + TG 173K | ✅ 27.09.2026 | стипендии | ⚠ дедлайны сверять |
| Scholars4dev | scholars4dev.com | ⚠ RSS пустой → HTML | ✅ 24.09.2026 | стипендии для развивающихся стран | очень аккуратный, курируемый |
| Youth Opportunities | youthop.com | ❓ timeout | активен в 2026 по поиску | конкурсы, конференции | крупный портал; проверить из Worker |
| WeMakeScholars | wemakescholars.com | нет | ✅ | стипендии, фильтр по стране | большая база |
| Impactpool | impactpool.org | нет | ✅ | стажировки ООН и НКО | агрегатор международных организаций |

## 5. Telegram-каналы (RU/EN, СНГ и Центральная Азия)

| Источник | URL | RSS/API | Активность | Что публикует | Почему качественный |
|---|---|---|---|---|---|
| Стадика (StudyQA) | t.me/studyqa | t.me/s | ✅ 27.09.2026 (157K), ежедневно | стипендии, стажировки (RU) | крупнейший русскоязычный канал |
| Creative Asia (WE Project) | t.me/we_project | t.me/s | ✅ 27.09.2026 (72,5K) | карьера, гранты по Центральной Азии | региональный фокус |
| grants.kz | t.me/grants_scholarships | t.me/s | ✅ 24.09.2026 (53,6K) | гранты, стипендии (RU) | Центральная Азия |
| EDUgrant | t.me/edugrant_kg | t.me/s | ✅ 09.09.2026 (23,8K) | стипендии, форумы, стажировки | часто для Центральной Азии |
| Grants and Opportunities | t.me/joinyouthuz | t.me/s | ✅ 31.08.2026 (23K) | возможности для Узбекистана (EN) | узбекская аудитория |
| The Global Scholarship | t.me/theglobalscholarship | t.me/s | ✅ 17.09.2026 (20,4K) | стипендии, стажировки (EN) | ⚠ вторичный |

## 6. Соревнования, хакатоны, стартап-программы

| Источник | URL | RSS/API | Активность | Что публикует | Почему качественный |
|---|---|---|---|---|---|
| Devpost | devpost.com/api/hackathons?status[]=open | **JSON API ✅** без ключа | ✅ (190 открытых) | хакатоны, много онлайн | призы, фильтр online |
| MLH | mlh.io/seasons/2027/events | HTML | ✅ | студенческие хакатоны | стандарт индустрии |
| Kaggle | kaggle.com/api/v1/competitions/list | API (бесплатный ключ) | ✅ | ML-соревнования | открыт всем |
| Codeforces | codeforces.com/api/contest.list | **API ✅** | ✅ | контесты по программированию | популярен в Узбекистане |
| Zindi | api.zindi.africa/v1/competitions | **API ✅** | ✅ | ML-соревнования | открыт глобально |
| clist.by | clist.by/api/v4/contest/ | API (ключ) | ✅ | агрегатор контест-платформ | сотни площадок |
| DrivenData | drivendata.org/competitions/ | HTML | ✅ | Data for Good | некоммерческий |
| AIcrowd | aicrowd.com/challenges | HTML | ✅ | AI-челленджи | научные партнёры |
| lablab.ai | lablab.ai/event | HTML | ✅ | онлайн AI-хакатоны | доступен из Узбекистана |
| ETHGlobal | ethglobal.com/events | HTML | ✅ | web3-хакатоны | призы, онлайн |
| Devfolio | devfolio.co/hackathons | HTML | ✅ ноя 2026 | хакатоны | ⚠ перекос в Индию |
| MIT Solve | solve.mit.edu/challenges | HTML | ✅ | челленджи для соцпредпринимателей | MIT, открыт всем |
| Imagine Cup | imaginecup.microsoft.com | HTML | ✅ | студенческий стартап-конкурс | Microsoft |
| Hult Prize | hultprize.org | HTML | ✅ 16.09.2026 | студенческий соцстартап-конкурс | $1M, кампусы по миру |
| Google for Startups | startup.google.com/programs/index.rss | RSS (пуст) + HTML | ✅ 09.2026 | акселераторы | Google |
| Techstars | techstars.com/accelerators | HTML | ✅ 08.2026 | акселераторы | топ-акселератор |
| Seedstars | seedstars.com | нет | ✅ | стартап-программы для развивающихся рынков | профильный |
| Astana Hub | astanahub.com/en/ | нет | ✅ 25.09.2026 | программы для стартапов Центральной Азии | региональный хаб |

## Отсеяно

- **Блокируют ботов, без ленты:** scholarshipportal, mastersportal, phdportal, scholarshipdb, f6s, findaphd (403).
- **Мёртвые или почти неактивные:** afterschoolafrica, grantist.com, grantscholar.ru, @mininnovation, RSS American Councils.
- **Нерелевантны:** vsekonkursy.ru, te-st.org (часто только для граждан РФ), opportunitiesforafricans, opportunitytracker.ug, scholarshiproar (SEO), NAWA (право участия для Узбекистана не подтверждено), MAX Education (коммерческое агентство).

## Топ-10 для старта

1. **Opportunity Desk RSS** — ежедневно, широкий охват, ссылки на официальные страницы.
2. **Opportunities for Youth RSS** — ежедневно, есть eligibility и дедлайн.
3. **Grantlar.uz RSS** — уже на узбекском и под Узбекистан; эталон для сверки перевода.
4. **GrantGO sitemap + TG** — самая большая структурированная база на узбекском.
5. **Devpost JSON API** — готовые поля: дедлайн, призы, online/offline.
6. **Global South Opportunities RSS** — фокус на развивающиеся страны.
7. **ProFellow RSS** — качественные фелоушипы, мало шума.
8. **Посольство США в Ташкенте RSS** — первоисточник Fulbright и обменов; нужен retry.
9. **@yoshlaragentligi + @eduuz через t.me/s** — госконкурсы и гранты Узбекистана.
10. **Stipendium Hungaricum + OSCE Academy + Swedish Institute RSS** — официальные фиды, важные для Центральной Азии.

## Замечания по реализации

- `t.me/s/<канал>` отдаёт HTML с `datetime` и текстом постов — парсится в Worker без API.
- Сайты с защитой от ботов (Chevening, CSC, British Council) — ручной или сезонный мониторинг, либо через агрегаторы.
