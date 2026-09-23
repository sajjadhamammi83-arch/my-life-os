# R3 Technical Design & Analysis: Offline-to-Online Sync Engine, Outbox Queue & Header Status Indicator

**Author**: `survey_sync_engine_10` (Explorer)  
**Target Milestone**: PWA & Local-First Architecture — R3  
**Date**: 2026-09-23  
**Integrity Mode**: Read-Only Architecture & Specification  

---

## ۱. خلاصه اجرایی (Executive Summary)

این سند، معماری و طراحی فنی جامع **موتور همگام‌سازی آفلاین به آنلاین (Offline-to-Online Sync Engine)**، **صف ارسال تغییرات (Outbox Queue)**، و **نشانگر وضعیت ارتباط و همگام‌سازی در هدر سیستم (`Header.tsx`)** را در چارچوب تبدیل پلتفرم Life OS به یک وباپلیکیشن پیشرونده محلی‌محور (Local-First PWA) ارائه می‌دهد.

### اهداف اصلی معماری:
۱. **پایداری صددرصدی تغییرات آفلاین (Durability)**: هرگونه تیک زدن تسک، ثبت هزینه، ویرایش برنامه روزانه یا یادداشت‌برداری در زمان قطعی کامل اینترنت، در صف Outbox واقع در دیتابیس `IndexedDB` کلاینت ذخیره شده و پس از رفرش مرورگر، خروج از تب سافاری آیفون یا ری‌استارت دستگاه، به هیچ عنوان از بین نخواهد رفت.
۲. **تشخیص هوشمند و دو لایه اتصال (Dual-Layer Connectivity Detection)**: ترکیب رویدادهای مرورگر (`online`/`offline`) با پایش فعالانه دسترسی‌پذیری سرور از طریق هارت‌بیت سبک (`/api/ping`)، جهت جلوگیری از خطای اتصال کاذب (False Positives) ناشی از وای‌فای‌های بدون اینترنت یا خاموشی سرور لوکال.
۳. **پخش ترتیبی و امن صف (Chronological FIFO Replay & Idempotency)**: پردازش گام‌به‌گام و ترتیبی صف ارسال با کلیدهای یکتای عدم تکرار (`X-Idempotency-Key`)، مدیریت کدهای وضعیت HTTP، بازتلاش با تأخیر تصاعدی (Exponential Backoff)، و نگاشت شناسه‌های موقت کلاینت (`tempEntityId`) به شناسه‌های پایدار دیتابیس.
۴. **حل تعارضات و همگام‌سازی ورودی (Conflict Resolution & Inbound Sync)**: استراتژی آخرین تغییر برنده (LWW) با اولویت تغییرات لوکال کاربر (Optimistic Overrule)، و تازه‌سازی کش لوکال بلافاصله پس از تخلیه صف Outbox.
۵. **نشانگر بصری تعاملی در هدر (`Header.tsx`)**: نمایش شفاف سه وضعیت (آنلاین و همگام، آفلاین با ذخیره محلی، و در حال ارسال با شمارنده اقلام در صف) بر اساس زبان بصری مینیمال تم سفید (`#ffffff`)، کنتراست بالا و ارقام فارسی وزیرمتن.

---

## ۲. ممیزی اندپوینت‌های API و الگوهای جهش داده (API & Mutation Audit)

در حال حاضر در سامانه Life OS تعداد ۳۲ مسیر در مسیر `src/app/api/` پیاده‌سازی شده‌اند. تحلیل جزئی اندپوینت‌های جهش داده (Mutation Endpoints) به شرح زیر است:

### جدول اندپوینت‌های جهش داده و ساختار آنها

| ماژول | مسیر اندپوینت (Endpoint) | متد HTTP | کاربرد و بدنه درخواست (Payload) | پاسخ سرور | وضعیت کنونی در کلاینت |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **تسک‌ها** | `/api/tasks` | `POST` | ایجاد تسک: `{ title, areaId, projectId, priority, workType, estimatedMinutes, eisenhowerQuadrant, isBigThree, status, kanbanColumn, dueDate, notes }` | `{ success: true, task }` | بدون ذخیره در صورت خطا؛ استثنا در کانسول چاپ می‌شود. |
| **تسک‌ها** | `/api/tasks` | `PATCH` | ویرایش وضعیت/تیک زدن: `{ id, status, isCompleted, kanbanColumn, isBigThree, dueDate, eisenhowerQuadrant, priority }` | `{ success: true, task }` | تغییر خوش‌بینانه در `useState`، اما با رفرش در حالت آفلاین داده از بین می‌رود. |
| **تسک‌ها** | `/api/tasks` | `DELETE` | حذف تسک: `?id=<task_id>` | `{ success: true }` | حذف از `useState` کلاینت، اما با رفرش داده‌های قدیمی برمی‌گردند. |
| **برنامه روزانه** | `/api/today` | `POST` | افزودن تسک روزانه با تمرکز Big 3: `{ title, areaId, projectId, objectiveId, isBigThree, status: "today", ... }` | `{ success: true, task }` | وابستگی مستقیم به سرور فعال. |
| **انتقال به فردا** | `/api/tasks/rollover` | `POST` | انتقال هوشمند تسک‌های انجام‌نشده به فردا و تقویم: `{}` | `{ success: true, forwardedCount }` | نیازمند اتصال سرور (عملیات سمت سرور). |
| **عادات زیستی** | `/api/habits` | `POST` | تعریف عادت جدید: `{ title, areaId, frequency, target, unit, preferredTime }` | `{ success: true, habit }` | بدون پایدارسازی آفلاین. |
| **عادات زیستی** | `/api/habits` | `PATCH` | ثبت تیک روزانه عادت: `{ habitId, completed }` | `{ success: true, habit }` | آپدیت استریک در حافظه React، اما قطع اتصال باعث عدم ارسال به سرور می‌شود. |
| **مالی / حسابداری** | `/api/finance/accounting` | `POST` | ثبت هزینه، هزینه ثابت، چک، حساب بانکی یا انتقال: `{ type: "expense" \| "fixed_expense" \| "cheque" \| "transfer", ... }` | `{ success: true, entry }` | فرم پس از خطا بازنشانی نشده و تراکنش ثبت نمی‌شود. |
| **مالی / حسابداری** | `/api/finance/accounting` | `PATCH` | تسویه هزینه ثابت یا تغییر وضعیت چک: `{ action: "pay_fixed_expense" \| "update_cheque_status", ... }` | `{ success: true, ... }` | بدون صف‌بندی در قطعی شبکه. |
| **دخل مغازه** | `/api/finance/cash-register` | `POST` | ثبت و تطبیق دخل روزانه: `{ openingCash, salesCash, posSalesCash, expensesCash, withdrawalsCash, actualClosingCash, costCenterId, notes }` | `{ success: true, entry, difference }` | عدم امکان ثبت صندوق در زمان قطعی اینترنت فروشگاه. |
| **تراکنش‌ها** | `/api/finance/transactions` | `POST` | ثبت تراکنش ساده دخل و خرج: `{ amount, type, description, costCenterName, accountId, counterparty }` | `{ success: true, transaction }` | نیازمند اتصال بلادرنگ به سرور. |
| **ارزیابی روزانه** | `/api/reviews/daily` | `POST` | ثبت/ویرایش کارنامه شبانه، ساعات کار عمیق و ممیزی انرژی: `{ id?, date, big3Completed, productivityScore, mood, deepWorkHours, energyPhysical, ... }` | `{ success: true, review }` | کاربر در صورت قطعی اینترنت در پایان شب نمی‌تواند مرور روزانه را ذخیره کند. |
| **ثبت سریع** | `/api/quick-capture` | `POST` | ثبت سریع تسک، هزینه، فروش، یادداشت، آب، وزن: `{ type, title, amount, category, extra }` | `{ success: true, ... }` | در هدر تعبیه شده اما آفلاین کار نمی‌کند. |
| **سلامت و هیدراتاسیون** | `/api/health` | `POST` | ثبت آب، وزن، وعده غذایی، تمرین بدنسازی: `{ action: "water" \| "weight" \| "meal" \| "workout", ... }` | `{ success: true, ... }` | ثبت لیوان آب با شکست مواجه می‌شود. |
| **تقویم و زمان‌بندی** | `/api/calendar` | `POST` / `PATCH` / `DELETE` | مدیریت بلوک‌های زمانی: `{ title, start, end, type, dayType, notes, ... }` | `{ success: true, block }` | ایجاد بلوک تقویمی نیازمند سرور است. |

### آسیب‌پذیری‌های کشف‌شده در وضعیت فعلی کلاینت:
1. **استثناهای مدیریت‌نشده شبکه (`TypeError: Failed to fetch`)**: در بیشتر کامپوننت‌ها (`today/page.tsx`, `finance/page.tsx`, `tasks/page.tsx`)، در صورت قطعی شبکه خطای شبکه فقط در کانسول لاگ شده و فرم در حالت بلاتکلیف یا لودینگ گیر می‌کند.
2. **از بین رفتن وضعیت خوش‌بینانه (Optimistic State Lost on Reload)**: اگر کاربری در آیفون در حالت آفلاین تیک ۵ تسک را بزند، تغییرات فقط در آرایه `useState` رندر می‌شوند. به محض بستن سافاری یا رفرش تب، داده‌ها از بین رفته و به نسخه قبلی سرور برمی‌گردند.
3. **نبود اندپوینت پایش سلامت سرور (`/api/ping`)**: هیچ اندپوینتی برای تست سریع و بدون بار سرور وجود ندارد. اندپوینت `/api/health` مربوط به داده‌های پزشکی و بیومتریک است و نباید برای هارت‌بیت شبکه استفاده شود.

---

## ۳. طراحی الگوی صف ارسال (Outbox Queue Pattern)

صف Outbox یک ساختار داده پایدار در دیتابیس لوکال `IndexedDB` کلاینت است که هرگونه جهش داده کاربر را به صورت یک تراکنش اتمیک ثبت می‌کند تا از پایداری داده‌ها پیش از ارسال به سرور اطمینان حاصل شود.

### ۳.۱ ساختار داده صف ارسال (`OutboxMutation`)

```typescript
// src/lib/sync/types.ts

export type OutboxMutationStatus = "pending" | "syncing" | "failed";

export type EntityType = 
  | "task" 
  | "habit" 
  | "transaction" 
  | "cash_register" 
  | "fixed_expense" 
  | "cheque" 
  | "daily_review" 
  | "calendar_block" 
  | "nutrition" 
  | "quick_capture";

export interface OutboxMutation {
  id: string;                       // شناسه یکتای جهش در صف (UUID v4)
  endpoint: string;                 // مسیر اندپوینت بک‌اند (e.g. "/api/tasks")
  method: "POST" | "PATCH" | "PUT" | "DELETE"; // متد ارسالی
  payload?: any;                    // بدنه جیسون درخواست
  headers?: Record<string, string>; // هدرهای سفارشی
  createdAt: number;                // زمان میلادی ثبت در کلاینت (timestamp ms)
  status: OutboxMutationStatus;     // وضعیت کنونی
  retryCount: number;               // تعداد دفعات بازتلاش ناموفق
  lastError?: string;               // متن آخرین خطای دریافتی
  entityType: EntityType;           // نوع مدل پایگاه داده محلی
  entityId?: string;                // شناسه رکورد مرتبط
  tempEntityId?: string;            // شناسه موقت تولیدشده در کلاینت
  idempotencyKey: string;           // کلید یکتا برای ممانعت از ثبت تکراری در سرور
}
```

### ۳.۲ ساختار دیتابیس `IndexedDB` و آبجکت استور `outbox_queue`

برای حفظ هماهنگی کامل با ماژول `survey_local_store_10`، مخزن محلی با نام یکپارچه `life_os_local_db` تعریف می‌شود:

- **Database Name**: `life_os_local_db`
- **Database Version**: `1`
- **Object Store**: `outbox_queue`
- **Key Path**: `id` (رشته‌ای، UUID v4)
- **Indexes**:
  - `by_status`: ایندکس روی فیلد `status` (جهت استخراج سریع اقلام با وضعیت `pending`)
  - `by_createdAt`: ایندکس روی فیلد `createdAt` (جهت سورت ترتیبی FIFO)
  - `by_entity`: ایندکس ترکیبی روی `[entityType, entityId]` (جهت بررسی وضعیت رکوردهای تحت تغییر)

### ۳.۳ چرخه حیات جهش در صف (Outbox Mutation Lifecycle)

```
[اقدام کاربر در رابط کاربری]
         │
         ▼
[۱. اعمال آنی در دیتابیس محلی IndexedDB + آپدیت React State با تاخیر صفر]
         │
         ▼
[۲. ذخیره تراکنشی در outbox_queue با وضعیت 'pending' و تولید idempotencyKey]
         │
         ▼
[۳. بررسی وضعیت دسترسی به سرور (isOnline)]
    ├── آفلاین: در صف باقی می‌ماند (پایدار در حافظه گوشی)
    └── آنلاین: اجرای فوری تخلیه صف (Sync Flush)
         │
         ▼
[۴. ارسال به سرور با هدر X-Idempotency-Key]
    ├── پاسخ 2xx: حذف از صف outbox_queue + نگاشت ID موقت در دیتابیس لوکال
    ├── خطای موقت شبکه / 5xx: افزایش retryCount، تاخیر تصاعدی، نگهداری در صف
    └── خطای منطقی 4xx: علامت‌گذاری به عنوان 'failed' برای جلوگیری از انسداد صف
```

### ۳.۴ الگو و استراتژی شناسه‌های موقت کلاینت (Client-Side Temp IDs & Remapping)

هنگامی که کاربر در حالت آفلاین تسک جدید، هزینه جدید یا بلوک زمانی جدید می‌سازد، سرور در دسترس نیست تا شناسه `cuid` رسمی تولید کند.
1. **تولید شناسه موقت**: کلاینت یک شناسه با پیشوند استاندارد می‌سازد:  
   `const tempId = "temp_task_" + crypto.randomUUID();`
2. **ذخیره در استور محلی**: رکورد با شناسه `tempId` و پرچم `_isLocalOnly: true` در آبجکت استور `tasks` ذخیره می‌شود.
3. **قرارگیری در صف ارسال**: جهش با `tempEntityId: tempId` در `outbox_queue` درج می‌شود.
4. **پاسخ سرور و نگاشت مجدد (ID Remapping)**:
   - پس از ارسال درخواست، پاسخ سرور حاوی رکورد رسمی است: `{ success: true, task: { id: "cm123abc...", ... } }`.
   - موتور همگام‌سازی بلافاصله استور محلی `tasks` را باز کرده، رکورد با شناسه `tempId` را به شناسه رسمی `cm123abc...` تبدیل می‌کند.
   - همچنین صف Outbox بررسی می‌شود؛ اگر جهش‌های بعدی به این شناسه موقت اشاره داشته باشند (مثلاً یک ویرایش بعدی روی همین تسک)، شناسه آنها فوراً به شناسه رسمی به‌روزرسانی می‌شود تا زنجیره ارجاعات قطع نشود.

---

## ۴. طراحی موتور همگام‌سازی (Sync Engine Architecture)

موتور همگام‌سازی قلب تپنده معماری Local-First است و ارتباط کلاینت با سرور را مدیریت می‌کند.

### ۴.۱ لایه اول: تشخیص اتصال هیبریدی (Passive Events + Active Heartbeat)

صرفاً اتکا به `navigator.onLine` گمراه‌کننده است، زیرا کاربر ممکن است به وای‌فای متصل باشد اما اینترنت قطع باشد یا پورت ۳۰۵۰ سرور متوقف شده باشد. بنابراین تشخیص اتصال به صورت دو لایه انجام می‌شود:

۱. **شنونده‌های پسیو مرورگر**:
   - `window.addEventListener('online', onConnectivityChange)`
   - `window.addEventListener('offline', onConnectivityChange)`

۲. **هارت‌بیت فعال با اندپوینت سبک `/api/ping`**:
   - ایجاد اندپوینت جدید و فوق‌سریع: `src/app/api/ping/route.ts`
   ```typescript
   // src/app/api/ping/route.ts
   import { NextResponse } from "next/server";
   
   export const dynamic = "force-dynamic";
   
   export async function GET() {
     return NextResponse.json(
       { success: true, timestamp: Date.now() },
       {
         status: 200,
         headers: {
           "Cache-Control": "no-store, no-cache, must-revalidate",
         },
       }
     );
   }
   
   export async function HEAD() {
     return new Response(null, {
       status: 200,
       headers: { "Cache-Control": "no-store" },
     });
   }
   ```
   - تابع `checkServerReachability()`:
     ارسال درخواست `GET` به `/api/ping` همراه با `AbortController` با تایم‌اوت ۳ ثانیه.
   - **زمان‌بندی پایش (Polling Schedule)**:
     - در زمان آنلاین بودن: هر **۴۵ ثانیه** یکبار برای اطمینان از سلامت اتصال.
     - در زمان قطعی یا حالت آفلاین: هر **۱۵ ثانیه** یکبار پایش جهت تشخیص اتصال مجدد سرور در کمترین زمان ممکن.
     - در صورت رفتن تب به پس‌زمینه (`document.visibilityState === 'hidden'`)، پایش متوقف یا با فواصل ۲ دقیقه‌ای انجام می‌شود تا باتری گوشی مصرف نشود.
     - به محض بازگشت به صفحه (`visibilitychange` به `visible`) یا شنیدن رویداد `online`، پینگ فوری ارسال می‌شود.

### ۴.۲ لایه دوم: اجرای ترتیبی و گام‌به‌گام صف (Chronological Sequential Replay)

ترتیب اجرای درخواست‌ها از اهمیت حیاتی برخوردار است؛ برای مثال اگر کاربری یک تسک بسازد و سپس وضعیت آن را تغییر دهد، درخواست ساخت باید پیش از درخواست ویرایش پردازش شود.

```typescript
// شبه‌کد الگوریتم بازپخش ترتیبی در src/lib/sync/sync-engine.ts

async function flushOutboxQueue(): Promise<void> {
  // ۱. ممانعت از اجرای همزمان دو حلقه همگام‌سازی (Mutex Lock)
  if (isSyncing) return;
  
  // ۲. بررسی دسترسی‌پذیری واقعی سرور
  const isReachable = await checkServerReachability();
  if (!isReachable) {
    setConnectionState("offline");
    return;
  }

  isSyncing = true;
  notifyStatusChanged();

  try {
    // ۳. خواندن اقلام در صف به ترتیب زمانی صعودی (FIFO)
    const pendingItems = await getPendingMutationsSorted();
    
    for (const item of pendingItems) {
      // در صورت قطع شدن اتصال در حین بازپخش، حلقه متوقف می‌شود
      if (!navigator.onLine) break;

      await markItemStatus(item.id, "syncing");
      notifyStatusChanged();

      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": item.idempotencyKey,
            ...(item.headers || {}),
          },
          body: item.payload ? JSON.stringify(item.payload) : undefined,
        });

        if (response.ok) {
          const responseData = await response.json();
          // مدیریت نگاشت ID موقت به دائم در دیتابیس لوکال
          if (item.tempEntityId) {
            await handleEntityIdRemapping(item.entityType, item.tempEntityId, responseData);
          }
          // حذف موفقیت‌آمیز از صف
          await removeMutationFromQueue(item.id);
        } else if (response.status >= 500) {
          // خطای سرور: بازتلاش با تاخیر
          await handleServerError(item);
          break; // جلوگیری از ارسال آیتم‌های بعدی تا رفع خطای سرور
        } else {
          // خطای اعتبارسنجی سمت کلاینت (4xx): نشان‌دار کردن به عنوان failed
          await markItemStatus(item.id, "failed", `HTTP ${response.status}`);
        }
      } catch (networkError: any) {
        // قطع اتصال حین درخواست
        await markItemStatus(item.id, "pending");
        setConnectionState("offline");
        break;
      }
      notifyStatusChanged();
    }
  } finally {
    isSyncing = false;
    notifyStatusChanged();
  }

  // ۴. اگر تمام اقلام با موفقیت ارسال شدند، همگام‌سازی ورودی اجرا شود
  const remainingCount = await getPendingCount();
  if (remainingCount === 0) {
    await performInboundSynchronization();
  }
}
```

### ۴.۳ حل تعارضات و عدم تکرار (Conflict Resolution & Idempotency)

۱. **عدم تکرار با `X-Idempotency-Key`**:  
   هر درخواست در زمان ایجاد در کلاینت یک UUID اختصاصی دریافت می‌کند. اگر درخواستی به دلیل تایم‌اوت شبکه پاسخ را دریافت نکند اما سرور آن را ثبت کرده باشد، در بازتلاش بعدی سرور متوجه تکراری بودن درخواست شده و از ایجاد رکورد مضاعف جلوگیری می‌نماید.
۲. **مدل حل تعارض بر اساس زمان آخرین ویرایش (Last-Write-Wins / LWW)**:
   - تمام رکوردهای سرور دارای فیلد `updatedAt` هستند. رکوردهای محلی نیز فیلد `localUpdatedAt` را نگه می‌دارند.
   - **قانون اولویت جهش محلی (Optimistic Overrule)**: اگر رکوردی در استور محلی دارای یک جهش در انتظار در `outbox_queue` باشد، داده‌های دریافتی از سرور هرگز آن را بازنویسی نمی‌کنند؛ چرا که تغییرات لوکال کاربر معتبرترین و جدیدترین اراده کاربر محسوب می‌شود.
   - پس از ارسال موفقیت‌آمیز و دریافت پاسخ سرور، فیلد `updatedAt` لوکال با ساعت سرور هم‌تراز می‌شود.

### ۴.۴ همگام‌سازی ورودی پس از ارسال (Inbound Synchronization)

به محض اینکه صف Outbox با موفقیت کاملاً خالی شد، موتور همگام‌سازی به صورت خودکار داده‌های تازه‌شده را از بک‌اند فرامی‌خواند:
- فراخوانی موازی روت‌های کلیدی:
  - `/api/today` -> به‌روزرسانی وضعیت تسک‌ها، بلوک‌ها، عادات روزانه و هیدراتاسیون در IndexedDB.
  - `/api/tasks` -> همگام‌سازی بورد کانبان و ماتریس آیزنهاور.
  - `/api/finance/accounting` -> به‌روزرسانی مانده حساب‌ها، هزینه‌های جاری و وضعیت چک‌ها.
  - `/api/reviews/daily` -> به‌روزرسانی کارنامه شبانه.
- ارسال رویدادهای سراسری:
  - `window.dispatchEvent(new CustomEvent('life-os:sync-completed'))`
  - `window.dispatchEvent(new CustomEvent('reminders-updated'))`
- این رویدادها باعث رندر مجدد هوشمند کامپوننت‌های باز بدون نیاز به لود مجدد صفحه (F5) می‌شوند.

---

## ۵. طراحی نشانگر وضعیت ارتباط و همگام‌سازی در هدر (`Header.tsx`)

نشانگر وضعیت در کامپوننت `src/components/layout/Header.tsx` واقع در نوار بالای سیستم جای‌گذاری می‌شود تا وضعیت سیستم را پیوسته و با ظرافت به کاربر نشان دهد.

### ۵.۱ موقعیت قرارگیری در هدر
در نوار ابزار سمت راست هدر، بین دکمه «ثبت سریع» و زنگوله اعلان‌ها:
`[ثبت سریع] -> [نشانگر صندوق و انبار] -> [نشانگر وضعیت همگام‌سازی] -> [زنگوله اعلانات فردا D-1]`

### ۵.۲ حالات سه‌گانه بصری نشانگر (Visual States)

```
┌─────────────────────────────────────────────────────────────┐
│ حالت ۱: آنلاین و همگام (Online & Synced)                     │
│ [🟢 آنلاین و همگام]                                          │
│ تم: bg-zinc-100 border border-zinc-200 text-zinc-800        │
│ دایره سبز زمردی bg-emerald-500 با رینگ ملایم                │
├─────────────────────────────────────────────────────────────┤
│ حالت ۲: آفلاین و ذخیره محلی (Offline / Local Storage)        │
│ [⚪ آفلاین (حافظه گوشی)]                                      │
│ تم: bg-zinc-100 border border-zinc-300 text-zinc-600        │
│ آیکون WifiOff و دایره طوسی bg-zinc-400                      │
├─────────────────────────────────────────────────────────────┤
│ حالت ۳: در حال همگام‌سازی / ذخیره (Syncing / Saving)          │
│ [🔄 در حال همگام‌سازی (۳)]                                   │
│ تم: bg-blue-50 border border-blue-200 text-blue-900 font-bold│
│ آیکون اسپینر RefreshCw با انیمیشن چرخش + دایره آبی پالس‌دار   │
└─────────────────────────────────────────────────────────────┘
```

### ۵.۳ پاپ‌اور جزئیات وضعیت (Status Details Dropdown)
با کلیک کاربر روی نشانگر هدر، یک منوی کشویی تمیز با تم مینیمال سفید باز می‌شود که اطلاعات زیر را نمایش می‌دهد:
۱. **وضعیت شبکه**: نمایش متصل بودن به شبکه لوکال و سرور پورت ۳۰۵۰.
۲. **زمان آخرین همگام‌سازی**: نمایش ساعت شمسی با فونت وزیر (مثال: «آخرین همگام‌سازی: ساعت ۱۰:۲۴»).
۳. **تعداد اقلام در صف ارسال**: در صورت وجود جهش‌های معلق، لیست نوع اقلام (مثلاً: «۲ تسک، ۱ تراکنش مالی»).
۴. **دکمه همگام‌سازی دستی («همگام‌سازی فوری»)**: به کاربر اجازه می‌دهد در هر لحظه هارت‌بیت را تحریک کرده و ارسال صف را آغاز کند.

---

## ۶. پیاده‌سازی گام‌به‌گام و معماری فایل‌ها

برای پیاده‌سازی این سیستم در مراحل بعدی، فایل‌های زیر ایجاد و اصلاح خواهند شد:

### ۶.۱ ساختار فایل‌های جدید
```
src/
├── app/
│   └── api/
│       └── ping/
│           └── route.ts            <-- اندپوینت پایش سبک سلامت سرور
├── lib/
│   └── sync/
│       ├── types.ts                <-- تایپ‌های OutboxMutation و وضعیت‌های سینک
│       ├── outbox.ts               <-- متدهای افزودن، خواندن، حذف و بروزرسانی صف در IndexedDB
│       ├── sync-engine.ts          <-- موتور اصلی پایش پینگ، بازپخش ترتیبی، نگاشت ID و اینباند سینک
│       └── useSyncEngine.ts        <-- کاستوم هوک React برای اشتراک وضعیت در Header و کامپوننت‌ها
└── components/
    └── layout/
        └── Header.tsx              <-- افزودن نشانگر وضعیت بصری تعاملی با تم سفید مینیمال
```

### ۶.۲ هوک اختصاصی `useSyncStatus`
هوک سفارشی برای استفاده در کامپوننت هدر و صفحات:
```typescript
export interface SyncEngineState {
  isOnline: boolean;
  isServerReachable: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
}
```

---

## ۷. ماتریس سنجش و معیارهای پذیرش (Acceptance Criteria Alignment)

| معیار پذیرش درخواست اصلی | رویکرد فنی این ماژول | نتیجه اعتبارسنجی |
| :--- | :--- | :--- |
| **۱. ثبت پایدار در قطعی شبکه** | ذخیره آنی در `IndexedDB.outbox_queue` با متد تراکنشی `readwrite` پیش از رهاسازی رویداد | تضمین بقا پس از رفرش یا ری‌استارت مرورگر گوشی |
| **۲. عدم پرتاب خطای شبکه در UI** | پوشش فراخوانی‌ها در کلاینت با لایه Outbox Fallback؛ عملیات کاربر هرگز قفل نمی‌شود | تضمین عدم کرش و خطای قرمز در فرانت‌اند |
| **۳. بازپخش ترتیبی پس از اتصال** | صف‌بندی زمانی FIFO (`createdAt` صعودی) با کنترل شناسه موقت و `X-Idempotency-Key` | تضمین حفظ ترتیب منطقی و عدم تکرار داده‌ها |
| **۴. نشانگر هدر با تم سفید مینیمال** | نشانگر سه‌حالته با پالت مینیمال، فونت وزیرمتن و ارقام فارسی (`toPersianDigits`) | انطباق کامل با استاندارد طراحی تم سفید `#ffffff` |
| **۵. سلامت کامپایل تایپاسکریپت** | مدل‌سازی دقیق تایپ‌ها و اینترفیس‌ها بدون نیاز به کتابخانه‌های خارجی حجیم | تضمین Exit Code 0 در کامپایل `tsc --noEmit` |

---
این سند طراحی فنی کامل، آماده تحویل به اورکستریتور و پیاده‌سازی در فاز اجرای تسک‌ها می‌باشد.
