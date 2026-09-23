# گزارش جامع تحلیل و طراحی معماری پایگاه داده محلی (IndexedDB) و ذخیره‌سازی محلی‌محور (Local-First)
## پروژه Life OS — گام R2 و بررسی تخصصی ماژول‌های کاربری

- **نگارنده / بررسی‌کننده**: `survey_local_store_10` (Explorer)
- **تاریخ بررسی**: ۲۳ سپتامبر ۲۰۲۶
- **وضعیت**: تکمیل‌شده (تحلیل و طراحی تفصیلی آماده پیاده‌سازی)
- **مسیر خروجی**: `d:/my life/.agents/survey_local_store_10/analysis.md`

---

## ۱. خلاصه اجرایی (Executive Summary)

پلتفرم Life OS در حال حاضر دارای ۱۷ ماژول متصل به دیتابیس SQLite/LibSQL در سمت سرور Next.js است. در فاز فعلی، تمام صفحات و فرم‌های رابط کاربری به صورت کامپوننت‌های سمت کلاینت (`"use client"`) پیاده‌سازی شده‌اند و از الگوی ساده React State (`useState` و `useEffect`) به همراه فراخوانی مستقیم توابع شبکه `fetch()` به اندپوینت‌های `/api/*` استفاده می‌کنند.

**یافته کلیدی**: در وضعیت فعلی سیستم:
1. هیچ‌گونه لایه ذخیره‌سازی کلاینت (Client-Side Storage) یا کش پایدار محلی در مرورگر/آیفون پیاده نشده است.
2. در زمان قطعی کامل اینترنت یا خاموش بودن سرور لوکال (پورت ۳۰۵۰)، باز کردن صفحات اصلی منجر به نمایش صفحات خالی (Empty States)، حلقه‌های لودینگ بی‌پایان یا خطاهای کدهای وضعیت شبکه می‌شود.
3. در اکشن‌های تعاملی حیاتی مانند تیک زدن تسک‌ها، ایجاد تسک جدید، تیک زدن عادات، ثبت دخل روزانه و ثبت هزینه، در صورت عدم دسترسی به سرور، به دلیل فقدان بلاک‌های `catch` در برخی توابع (نظیر `handleAddTask` در `TodayPage` و `handleCreateTask` در `TasksPage`)، خطای مدیریت‌نشده `TypeError: Failed to fetch` رخ داده و تسک یا اطلاعات مالی واردشده کاملاً مفقود می‌گردد.
4. در صورت رفرش صفحه هنگام آفلاین بودن، هر تغییری که به صورت موقت در حافظه رم کامپوننت اعمال شده بود از بین می‌رود.

**راهکار و طراحی پیشنهادی**:
پیاده‌سازی یک لایه معماری محلی‌محور (Local-First) فوق‌العاده سبک، مدرن، بدون وابستگی‌های سنگین خارجی (Zero-Dependency Native IndexedDB)، مجهز به ۱۰ مخزن داده (`tasks`, `habits`, `habit_logs`, `projects`, `daily_reviews`, `cash_registers`, `transactions`, `calendar_blocks`, `outbox_queue`, `metadata`)، با استراتژی خواندن و نوشتن آنی (Zero-Latency Optimistic Local Read/Write) و موتور صف ارسال آفلاین به آنلاین (Outbox Sync Engine) با مدیریت شناسه موقت و بدون خطا.

---

## ۲. ممیزی وضعیت فعلی مدیریت داده و واکشی در ماژول‌های کلیدی (Current State Audit)

### ۲.۱. صفحه امروز (Today Focus) — `src/app/today/page.tsx`
- **ساختار و وضعیت‌های محلی**:
  - `tasks`: آرایه‌ای از کارهای روزانه و اقدامات سه‌گانه طلایی (`isBigThree: true`).
  - `habits`: آرایه‌ای از عادات عملکردی همراه با وضعیت `todayDone` و `streak`.
  - `calendarBlocks`: آرایه‌ای از تایم‌بلاک‌های تقویمی روز جاری.
  - `waterMl`: عدد هیدراتاسیون آب.
  - `routineSteps`: ۵ آیتم روتین صبحگاهی (بیدار شدن، آب و نمک، صبحانه، تایید ۳ اقدام، کار عمیق) که فعلاً صرفاً در `useState` رم نگهداری می‌شود!
- **چرخه واکشی داده (Fetch Lifecycle)**:
  - در `useEffect` (سطر ۱۷۳)، سه تابع `fetchTasks()`، `fetchHabits()` و `fetchCalendarBlocks()` فراخوانی می‌شوند.
  - هر تابع با `fetch('/api/...')` داده را واکشی می‌کند. اگر شبکه قطع باشد، خطا در `console.error` چاپ شده و وضعیت‌ها خالی باقی می‌مانند. کاربر با صفحه‌ای خالی از کارها و عادات مواجه می‌شود.
- **اکشن‌های تعاملی و آسیب‌پذیری‌های آفلاین**:
  - **تغییر وضعیت تسک (`toggleTask` در سطر ۱۸۹)**:
    یک به‌روزرسانی خوش‌بینانه روی `tasks` در رم اعمال می‌کند و سپس `fetch('/api/tasks', { method: 'PATCH', ... })` را می‌زند. اگر شبکه قطع باشد، فقط خطا لاگ می‌شود، اما اگر کاربر صفحه را رفرش کند یا بین صفحات بچرخد، تیک تسک برمی‌گردد چون در IndexedDB ذخیره نشده است!
  - **ستاره‌دار کردن Big 3 (`toggleBigThree` در سطر ۲۰۷)**:
    در صورت خطای شبکه، تابع `fetchTasks()` را صدا می‌زند که آن هم در حالت آفلاین شکست می‌خورد.
  - **افزودن تسک سریع (`handleAddTask` در سطر ۲۳۹)**:
    در سطر ۲۵۴ دستور `await fetch("/api/tasks", { method: "POST", ... })` اجرا می‌شود، اما **هیچ بلاک `catch` برای آن تعریف نشده است!** در نتیجه در حالت آفلاین، استثنای `Failed to fetch` ایجاد شده، فیلد ورودی پاک نمی‌شود، وضعیت `isAddingTask` در `finally` ریست می‌شود ولی تسک کاملاً هدر رفته و ذخیره نمی‌گردد.
  - **تیک زدن عادات (`toggleHabit` در سطر ۲۹۱)**:
    فقط در رم تغییر می‌کند و در دیتابیس لوکال پایدار نمی‌شود.
  - **چک‌لیست روتین صبحگاهی (`routineSteps`)**:
    اصلاً به هیچ API یا دیتابیسی متصل نیست و با هر رفرش به وضعیت اولیه بازمی‌گردد.

### ۲.۲. صفحه وظایف و ماتریس آیزنهاور (Tasks Matrix) — `src/app/tasks/page.tsx`
- **ساختار و تفکیک**:
  - داده‌ها در آرایه `tasks` لود شده و به ۴ ربع آیزنهاور (`q1`, `q2`, `q3`, `q4`) فیلتر می‌شوند.
- **آسیب‌پذیری آفلاین**:
  - `handleCreateTask` (سطر ۵۵): همانند صفحه امروز، فاقد بلاک `catch` روی `await fetch('/api/tasks')` است. اگر کاربر در قطعی شبکه تسک ثبت کند، مرورگر خطای uncaught rejection می‌دهد.
  - `deleteTask` (سطر ۱۱۹): تسک را از رم حذف می‌کند و سپس درخواست DELETE می‌زند. در صورت آفلاین بودن، پس از رفرش تسک حذف‌شده دوباره از سرور فراخوانی شده و ظاهر می‌شود.

### ۲.۳. صفحه حسابداری، خزانه‌داری و دخل (Finance & Cash Register) — `src/app/finance/page.tsx`
- **حجم و پیچیدگی داده**:
  - این ماژول دارای ۱۹۸۳ خط کد و مدیریت‌کننده ۶ ساختار داده اصلی است:
    1. `accounts`: حساب‌های بانکی و صندوق‌ها (کارتخوان، نقد، بانک).
    2. `expenses`: هزینه‌های جاری.
    3. `fixedExpenses`: هزینه‌های ثابت با سررسید شمسی ماهانه.
    4. `cheques`: چک‌های صیادی پرداختی و دریافتی (۱۶ رقمی).
    5. `cashRegisters`: دخل روزانه مغازه و بوفه (کف صندوق، فروش پوز، فروش نقد، هزینه‌های از دخل، برداشت‌ها، موجودی واقعی، مغایرت).
    6. `transactions`: دفتر روزنامه مالی.
- **چرخه واکشی**:
  - `fetchData()` (سطر ۱۶۶) اندپوینت `/api/finance/accounting` را فرامی‌خواند و وضعیت `loading` را کنترل می‌کند. در صورت قطعی شبکه، تمام جدول‌ها و شاخص‌های مالی صفر یا ناموجود می‌شوند.
- **اکشن‌های تعاملی و ریسک‌های بحرانی آفلاین**:
  - **بستن دخل روزانه (`handleSaveCashRegister` در سطر ۴۶۷)**:
    این عملیات دقیقاً زمانی رخ می‌دهد که مغازه‌دار یا متصدی بوفه باشگاه در پایان شب دخل را شمارش کرده و می‌خواهد دخل را ببندد. اگر در آن لحظه اینترنت قطع باشد، کل اطلاعات واردشده (شمارش نقد، پوز، هزینه‌ها) بدون ثبت از دست می‌رود.
  - **ثبت هزینه جاری (`handleSaveExpense` در سطر ۲۱۹)**:
    در صورت عدم ارتباط با سرور، امکان ثبت فاکتور خرید یا هزینه تنخواه وجود ندارد.
  - **انتقال وجه و وصول چک**:
    در حالت آفلاین هیچ اثری روی موجودی حساب‌های نمایش‌داده‌شده نمی‌گذارد.

### ۲.۴. صفحه اهداف و استراتژی (Goals & OKRs) — `src/app/goals/page.tsx`
- اهداف (`objectives`) و شاخص‌های کلیدی (`keyResults`) را مدیریت می‌کند.
- دارای حلقه بازخورد با تسک‌های Big 3 است (تکمیل تسک، پیشرفت هدف را در سرور زیاد می‌کند).
- در حالت آفلاین، کاربر نمی‌تواند هدف جدید تعریف کند یا مقادیر نتایج کلیدی (KR) را به‌روز کند.

### ۲.۵. صفحه برنامه‌ریز و تقویم (Planner & Time-Blocking) — `src/app/planner/page.tsx`
- مدیریت `timeBlocks` تقویم با فیلتر تاریخ شمسی/میلادی.
- دارای دستیار زمان‌بندی هوشمند (Smart Scheduler AI) و انتقال کارهای ناتمام به فردا (`handleRolloverUnfinished`).
- در صورت آفلاین بودن، لیست بلوک‌های روزهای آینده لود نشده و امکان ایجاد بلوک‌های کار عمیق جدید وجود ندارد.

### ۲.۶. صفحه مرکز ارزیابی و خودآگاهی (Daily Reviews) — `src/app/review/page.tsx`
- ثبت ارزیابی پایان شب (`DailyReview`)، ممیزی ۴ سطح انرژی (جسمانی، هیجانی، ذهنی، معنوی)، دستاوردها، درس‌ها، گلوگاه‌ها و پرسش‌های سفارشی (`ReviewQuestion`).
- کاربر معمولاً ارزیابی شبانه را روی تخت یا در شرایط کم‌آنتن انجام می‌دهد. در صورت نبود اینترنت، فرم بازبینی با شکست مواجه می‌شود.

### ۲.۷. هدر و سیستم اعلان‌ها (Header & Notification System) — `src/components/layout/Header.tsx`
- پایش اعلان‌های روز قبل (D-1 Reminders).
- دارای ساختار Event Bus با رخداد سفارشی `window.dispatchEvent(new Event("reminders-updated"))`.
- **نقطه عطف**: هدر سیستم بهترین مکان برای نمایش نشانگر وضعیت اتصال و همگام‌سازی محلی (Sync & Network Status Pill) است.

---

## ۳. طراحی معماری ذخیره‌سازی محلی کلاینت (IndexedDB Architecture)

### ۳.۱. چرا Native IndexedDB بدون وابستگی سنگین؟
1. **سازگاری کامل با آیفون و سافاری**: API بومی `window.indexedDB` از سال‌ها پیش در تمامی نسخه‌های iOS Safari و WebKit تعبیه شده و بدون هیچ باگ سازگاری نسخه‌ای کار می‌کند.
2. **عدم وابستگی خارجی**: پکیج‌هایی مانند `dexie` یا `idb` ممکن است در به‌روزرسانی‌های تایپ‌اسکریپت، باندلر Next.js 14 یا محیط‌های SSR ایجاد تداخل کنند. پیاده‌سازی یک Wrapper بومی تایپ‌شده با پرامیس‌های استاندارد جاوااسکریپت کمتر از ۳۰۰ خط کد فوق‌العاده تمیز و خوانا است و کنترل ۱۰۰٪ رفتار ترنزکشن‌ها را به ما می‌دهد.
3. **پشتیبانی از حجم ذخیره‌سازی گیگابایتی**: برخلاف `localStorage` که به ۵ مگابایت محدود بوده و سینکرونوس (بلاک‌کننده UI) است، IndexedDB آسنکرون، سریع و با سهمیه صدها مگابایت در آیفون در دسترس است.

### ۳.۲. مشخصات پایگاه داده محلی
- **نام دیتابیس**: `LifeOS_LocalDB`
- **نسخه دیتابیس**: `1`
- **فهرست ۱۰ شیء ذخیره‌ساز (Object Stores)**:

| نام Object Store | کلید اصلی (KeyPath) | ایندکس‌ها (Indexes) | شرح و دامنه داده |
| :--- | :--- | :--- | :--- |
| `tasks` | `id` (string) | `status`, `eisenhowerQuadrant`, `isBigThree`, `dueDate`, `createdAt`, `updatedAt`, `_synced` | وظایف، تسک‌های امروز، ماتریس آیزنهاور و اقدامات طلایی |
| `habits` | `id` (string) | `active`, `streak`, `preferredTime`, `_synced` | عادات اتمی و روتین‌ها |
| `habit_logs` | `id` (string) | `habitId`, `date`, `[habitId+date]`, `_synced` | لاگ‌های ثبت روزانه عادات |
| `projects` | `id` (string) | `status`, `priority`, `areaId`, `_synced` | پروژه‌ها و مایلتسون‌ها |
| `daily_reviews` | `id` (string) | `date`, `_synced` | ارزیابی‌های روزانه و سطوح ۴ گانه انرژی |
| `cash_registers` | `id` (string) | `date`, `costCenterId`, `reconciled`, `_synced` | دفاتر بستن دخل مغازه، بوفه و آرایشی |
| `transactions` | `id` (string) | `date`, `type`, `costCenterId`, `accountFromId`, `accountToId`, `_synced` | ریز تراکنش‌های مالی، هزینه‌ها و درآمدها |
| `calendar_blocks` | `id` (string) | `start`, `end`, `type`, `date`, `_synced` | بلوک‌های زمانی تقویم و کار عمیق |
| `outbox_queue` | `id` (string) | `status`, `clientTimestamp`, `entity` | صف اکشن‌های آفلاین در انتظار همگام‌سازی با سرور |
| `metadata` | `key` (string) | — | کش تنظیمات، مراکز هزینه، حساب‌های بانکی، تاریخ آخرین همگام‌سازی |

---

## ۴. طراحی رپر سبک بومی IndexedDB (Lightweight Native Wrapper)

یک ماژول TypeScript در مسیر `src/lib/db/idb.ts` طراحی می‌شود که بدون هیچ ایمپورت خارجی، دیتابیس را باز کرده و پرامیس‌های استاندارد ارائه می‌دهد:

### ۴.۱. اینترفیس‌های داده و صف ارسال
```typescript
// ساختار هر رکورد در صف ارسال آفلاین
export interface OutboxRecord {
  id: string; // شناسه منحصر‌به‌فرد رخداد outbox_${Date.now()}_${random}
  entity: "tasks" | "habits" | "habit_logs" | "expenses" | "cash_registers" | "reviews" | "calendar_blocks";
  action: "create" | "update" | "delete";
  endpoint: string; // e.g. "/api/tasks"
  method: "POST" | "PATCH" | "DELETE";
  payload: any;
  clientTimestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  lastError?: string;
}

// ساختار متادیتا برای کش کاتالوگ‌های ثابت
export interface MetadataRecord {
  key: string;
  value: any;
  updatedAt: number;
}
```

### ۴.۲. کلاس NativeIdbEngine
ویژگی‌های کلیدی کلاس:
1. **بررسی امن SSR**: در هنگام رندر سمت سرور (`typeof window === "undefined"` یا `!window.indexedDB`) خطایی ایجاد نکرده و به صورت ایمن عمل می‌کند.
2. **یکپارچگی تراکنش‌ها (Transaction Lifecycle)**:
   - پشتیبانی از تراکنش‌های `readonly` برای خواندن سریع.
   - پشتیبانی از تراکنش‌های `readwrite` با هندلرهای `onsuccess`, `onerror`, `onabort`.
3. **توابع عمومی ساده و تایپ‌شده**:
   - `get<T>(storeName, key): Promise<T | undefined>`
   - `getAll<T>(storeName, indexName?, query?): Promise<T[]>`
   - `put<T>(storeName, item): Promise<T>`
   - `putMany<T>(storeName, items): Promise<void>`
   - `delete(storeName, key): Promise<void>`
   - `clear(storeName): Promise<void>`
   - `count(storeName): Promise<number>`

---

## ۵. الگوی خواندن و نوشتن محلی‌محور (Local-First Read/Write Pattern)

برای دستیابی به پاسخ‌دهی صفر میلی‌ثانیه (Zero-Latency) و عدم وابستگی به شبکه، جریان تعامل کامپوننت‌ها به این صورت معماری می‌شود:

```
                  ┌───────────────────────────────┐
                  │          کاربر (UI)           │
                  └───────────────┬───────────────┘
                                  │
                   کلیک / تغییر وضعیت / ثبت فرم
                                  ▼
             ┌─────────────────────────────────────────┐
             │       ۱. به‌روزرسانی آنی React State     │ ◄── تأخیر ۰ میلی‌ثانیه (حس کاملاً بومی)
             └────────────────────┬────────────────────┘
                                  │
             ┌────────────────────┴────────────────────┐
             ▼                                         ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│ ۲. ذخیره قطعی در       │               │ ۳. ثبت در صف            │
│    IndexedDB محلی       │               │    outbox_queue         │
└─────────────────────────┘               └────────────┬────────────┘
                                                       │
                                          آیا اینترنت متصل است؟
                                          ┌────────────┴────────────┐
                                       خیر│                       بله│
                                          ▼                         ▼
                                ┌───────────────────┐     ┌───────────────────┐
                                │ ذخیره امن در گوشی │     │ ارسال به سرور     │
                                │ انتظار برای آنلاین│     │ و دریافت شناسه CUID│
                                └───────────────────┘     └─────────┬─────────┘
                                                                    │
                                                          موفقیت‌آمیز
                                                                    ▼
                                                          ┌───────────────────┐
                                                          │ پاکسازی صف و تایید│
                                                          │ نهایی در IndexedDB│
                                                          └───────────────────┘
```

### ۵.۱. الگوی خواندن کلاینت (Stale-While-Revalidate Local Read)
هنگام لود هر کامپوننت:
1. **فاز اول (آنی - زیر ۵ میلی‌ثانیه)**: کامپوننت داده‌های موجود در IndexedDB را با `localStore.getTasks()` می‌خواند و بلافاصله `setTasks(localData)` را صدا می‌زند. کاربر حتی در حالت آفلاین محتوای کامل کارها، عادات و دخل خود را می‌بیند.
2. **فاز دوم (پس‌زمینه - مشروط به اتصال)**: اگر `navigator.onLine === true` باشد، یک درخواست آرام به سرور فرستاده می‌شود. به محض بازگشت پاسخ سرور، داده‌های تازه در IndexedDB ذخیره شده و در صورت مغایرت، استیت کامپوننت به‌روز می‌شود.

### ۵.۲. الگوی نوشتن کلاینت (Optimistic + Durable Local Write)
هنگامی که کاربر تیک یک تسک را می‌زند یا دخل ثبت می‌کند:
1. **شناسه‌گذاری هوشمند**: اگر آیتم جدیدی ایجاد شود و هنوز شناسه‌ای از سرور ندارد، یک شناسه کلاینتی موقت مانند `loc_task_1727045000_a8f3` به آن اختصاص می‌یابد.
2. **پایداری آنی محلی**: آیتم فوراً با وضعیت `_synced: false` در آبجکت استور مربوطه ذخیره می‌شود.
3. **تولید بسته صف ارسال (Outbox Payload)**: یک رکورد جدید در `outbox_queue` با آدرس اندپوینت و بدنه درخواست درج می‌شود.
4. **شلیک رویداد همگام‌سازی**: رویداد سراسری `window.dispatchEvent(new Event("local-data-changed"))` فرستاده می‌شود تا سایر ویجت‌ها (مثل زنگوله هدر یا ویجت پیشخوان) بلافاصله خود را به‌روز کنند.
5. **پایش ارسال**: موتور هماهنگ‌کننده (`syncEngine.triggerSync()`) فراخوانی می‌شود.

---

## ۶. تضمین پایداری و عدم کرش در حالت قطعی شبکه (Offline Action Resilience)

یکی از الزامات صریح R2، جلوگیری از هرگونه خطای `Failed to fetch` یا کرش UI هنگام تیک زدن چک‌باکس‌ها، ساخت تسک یا ثبت هزینه در نبود شبکه است.

### ۶.۱. راهکار تکنیکال: لایه واسط ایمن ذخیره‌سازی محلی (`localStore`)
به جای فراخوانی مستقیم `fetch()` در بدنه دکمه‌ها و فرم‌ها، تمام صفحات متد اختصاصی `localStore` را فراخوانی می‌کنند. برای نمونه:

```typescript
// نمونه پیاده‌سازی متد ایمن ثبت تسک
export async function createLocalTask(taskData: Partial<Task>): Promise<Task> {
  const localId = `loc_task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newTask: Task = {
    id: localId,
    title: taskData.title || "",
    status: taskData.status || "today",
    isBigThree: Boolean(taskData.isBigThree),
    eisenhowerQuadrant: taskData.eisenhowerQuadrant || "Q2",
    priority: taskData.priority || "medium",
    workType: taskData.workType || "Deep Work",
    estimatedMinutes: taskData.estimatedMinutes || 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    _synced: false,
    ...taskData,
  };

  // ۱. ذخیره بی‌درنگ در IndexedDB
  await idb.put("tasks", newTask);

  // ۲. افزودن به صف Outbox
  await idb.put("outbox_queue", {
    id: `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    entity: "tasks",
    action: "create",
    endpoint: "/api/tasks",
    method: "POST",
    payload: taskData,
    clientTimestamp: Date.now(),
    retryCount: 0,
    status: "pending",
  });

  // ۳. تلاش برای همگام‌سازی بدون پرتاب استثنا (Safe Background Sync)
  triggerBackgroundSync();

  return newTask;
}
```

### ۶.۲. ویژگی‌های ایمنی کلیدی:
1. **No-Throw Guarantee**: متدهای `createLocalTask`, `toggleLocalTask`, `saveLocalExpense`, `saveLocalCashRegister` به هیچ وجه در صورت خطای شبکه Reject نمی‌شوند و Promise آنها با موفقیت Resolve شده و رکورد لوکال را بازمی‌گرداند.
2. **جایگزینی شناسه در بازگشت از سرور**: هنگامی که موتور سینک پاسخ موفقیت‌آمیز سرور را گرفت، شناسه دائمی دیتابیس سرور (`cuid`) جایگزین شناسه موقت `loc_...` در دیتابیس لوکال می‌شود و به این ترتیب روابط بین‌جدولی حفظ می‌گردد.
3. **پایشگرهای وضعیت شبکه**:
   - گوش دادن به `window.addEventListener("online", ...)`
   - گوش دادن به `window.addEventListener("offline", ...)`
   - پینگ دوره‌ای سلامت سرور هر ۳۰ ثانیه برای تشخیص مواردی که وای‌فای متصل است اما سرور لوکال در دسترس نیست (Offline Intranet).

---

## ۷. نقشه تطبیق فیلدهای دیتابیس محلی با Prisma Schema

برای اطمینان از یکپارچگی ۱۰۰٪ داده‌ها در رفت‌وبرگشت، فیلدهای ذخیره‌سازی محلی با اسکیمای `prisma/schema.prisma` منطبق شده‌اند:

### ۱. آبجکت استور `tasks`:
- `id`, `title`, `description`, `areaId`, `projectId`, `objectiveId`, `priority`, `urgency`, `eisenhowerQuadrant`, `workType`, `estimatedMinutes`, `actualMinutes`, `dueDate`, `scheduledStart`, `scheduledEnd`, `status`, `kanbanColumn`, `isBigThree`, `completedAt`, `createdAt`, `updatedAt`, `_synced`.

### ۲. آبجکت استور `habits` و `habit_logs`:
- `id`, `title`, `areaId`, `frequency`, `target`, `unit`, `preferredTime`, `streak`, `completionRate`, `active`, `todayDone`, `_synced`.
- لاگ‌ها: `id`, `habitId`, `date`, `completed`, `value`, `_synced`.

### ۳. آبجکت استور `cash_registers`:
- `id`, `date`, `costCenterId`, `openingCash`, `salesCash`, `posSalesCash`, `physicalSalesCash`, `expensesCash`, `withdrawalsCash`, `expectedClosingCash`, `actualClosingCash`, `difference`, `reconciled`, `notes`, `createdAt`, `_synced`.

### ۴. آبجکت استور `transactions`:
- `id`, `date`, `amount`, `type`, `accountFromId`, `accountToId`, `categoryId`, `costCenterId`, `paymentMethod`, `description`, `reconciled`, `_synced`.

### ۵. آبجکت استور `daily_reviews`:
- `id`, `date`, `big3Completed`, `whatWentWell`, `whatFailed`, `bottleneck`, `lessonsLearned`, `tomorrowChanges`, `gratitude`, `keyInsight`, `mood`, `productivityScore`, `deepWorkHours`, `customAnswers`, `energyPhysical`, `energyEmotional`, `energyMental`, `energySpiritual`, `_synced`.

---

## ۸. نتیجه‌گیری و گام‌های بعدی پیاده‌سازی

بررسی حاضر نشان داد که سیستم کنونی Life OS از پتانسیل کلاینت‌ساید بسیار بالایی برخوردار است، اما نیازمند جایگزینی فراخوانی‌های شکننده `fetch` با یک لایه انتزاعی پایدار `localStore` مبتنی بر IndexedDB بومی است. معماری طراحی‌شده در این سند تمامی پیش‌نیازهای R2 را به صورت کامل و دقیق برآورده نموده و پیاده‌سازی آن تضمین می‌کند که کاربر روی آیفون در شرایط قطع کامل اینترنت نیز بتواند تمامی کارهای روزانه، دخل و هزینه‌ها را بدون کوچکترین خطا ثبت و مدیریت نماید.
