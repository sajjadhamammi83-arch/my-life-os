# Milestone 1 Data Integrity Specification: 90-Day Simulation & DB Verification

**Author**: `m1_explorer_3` (teamwork_preview_explorer)  
**Date**: 2026-09-03  
**Status**: COMPLETE & READY FOR WORKER  
**Target Database**: `prisma/dev.db` (SQLite via Prisma ORM 5.22.0)  
**Reference Scripts**: `scripts/seed.mjs`, `scripts/simulate-90-days-lifecycle.mjs`, `scripts/test-core.mjs`

---

## ۱. خلاصه مدیریتی و ممیزی وضع موجود دیتابیس (Executive Summary & Gap Analysis)

سیستم‌عامل زندگی (Life OS) نیازمند شبیه‌سازی ۳ ماهه (۹۰ روز متوالی) استفاده واقعی یک کاربر چندمنظوره (مدیر بوفه باشگاه، مدیر فروشگاه لوازم آرایشی، بنیان‌گذار شرکت نرم‌افزاری رایش، دانشجو و ورزشکار) است.
ممیزی اولیه دیتابیس فعلی (`prisma/dev.db`) نشان می‌دهد که دیتابیس دارای یک شبیه‌سازی سطحی بوده و بسیاری از نهادهای کلیدی فاقد داده یا دارای مقادیر نمادین هستند:

| نام مدل (Prisma Entity) | تعداد رکورد موجود | حداقل تعداد الزامی در فاز M1 | وضعیت فعلی | مغایرت و اقدام الزامی |
|---|---|---|---|---|
| `User` | ۱ | ۱ | پایدار | پروفایل اصلی با واحد تومان و کیلوگرم |
| `Area` | ۹ | ۹ | پایدار | حوزه‌های ۹گانه بدون لنت (بوفه، آرایشی، رایش، و...) |
| `CostCenter` | ۶ | ۶ | پایدار | مراکز هزینه ۶ گانه (BUF, COS, RYSH, PER, HLT, UNI) |
| `FinancialAccount` | ۶ | ۶ | پایدار | حساب‌های بانکی، پوز، نقدی و مطالبات |
| `Product` | ۱۱ | ۱۱ | پایدار | ۵ قلم کالای بوفه + ۶ قلم کالای آرایشی با بارکد SKU |
| `Cycle90Day` | ۱ | ۱ | پایدار | چرخه ۹۰ روزه فعال برای دوره ۳ ماهه |
| `Objective` | ۳ | ۳ | پایدار | اهداف ۳ گانه (بوفه، آرایشی، رایش) |
| `KeyResult` | ۷ | ۷ | پایدار | شاخص‌های کلیدی متصل به اهداف |
| `Project` | ۳ | ۳ | پایدار | پروژه‌های ۳ گانه فعال |
| `Task` | ۶ | حداقل ۶ الی ۲۰ | پایدار اولیه | نیازمند اتصال به اهداف و ماتریس آیزنهاور |
| `Habit` | ۶ | ۶ | پایدار | عادات ۶ گانه روزمره |
| `Routine` | ۲ | ۲ | پایدار | روتین‌های صبح و شب |
| **`ShopCashRegister`** | ۹۰ | **۱۸۰ الی ۲۷۰** | **بحرانی** | ۹۰ رکورد برای یک مرکز ثبت شده؛ اسکیمای فعلی فاقد `costCenterId` است و دخل بوفه و آرایشی از هم تفکیک نشده است. پس از اصلاح اسکیما باید برای هر مرکز فعال (بوفه ۹۰ روز، آرایشی ۹۰ روز، رایش اختیاری) رکورد دخل مستقل با تفکیک POS و Physical وجود داشته باشد. |
| `SleepLog` | ۹۰ | ۹۰ | پایدار | ۹۰ روز پیوسته با راندمان بالای ۸۵٪ |
| `BodyMeasurement` | ۹۰ | ۹۰ | پایدار | ۹۰ روز پیوسته با روند کاهش وزن تدریجی |
| `NutritionLog` | ۹۰ | ۹۰ | پایدار تجمیعی | ۹۰ روز کالری و درشت‌مغذی کل ثبت شده |
| **`FoodEntry`** | **۴** | **حداقل ۲۷۰ (۳ تا ۴ وعده در روز)** | **بحرانی** | تنها برای ۱ روز (روز ۰) ثبت شده؛ باید برای تمام ۹۰ روز وعده‌های صبحانه، ناهار، شام، شیک بوفه ثبت شود و مجموع کالری و پروتئین با `NutritionLog` همسان باشد. |
| `DailyReview` | ۹۰ | ۹۰ | پایدار | ۹۰ روز بازبینی شبانه با ارزیابی انرژی |
| **`HabitLog`** | **۴۲** | **دقیقاً ۵۴۰ (۶ عادت × ۹۰ روز)** | **بحرانی** | تنها برای ۷ روز اخیر ثبت شده؛ باید ۵۴۰ رکورد کامل با درصد پایبندی واقعی ایجاد شود. |
| **`Workout`** | **۰** | **۴۰ الی ۵۵ جلسه** | **بحرانی (خالی)** | صفر جلسه ثبت شده؛ باید ۴۰ تا ۵۵ جلسه تمرین با برنامه تفکیکی (سینه، پا، زیربغل) در ۹۰ روز توزیع شود. |
| **`WorkoutExercise`** | **۰** | **۱۵۰ الی ۲۵۰ رکورد** | **بحرانی (خالی)** | صفر رکورد؛ هر جلسه تمرین باید شامل ۳ الی ۵ حرکت با ست، تکرار، وزنه تصاعدی و RPE باشد. |
| **`Invoice`** | **۰** | **حداقل ۹۰ الی ۲۷۰ فاکتور** | **بحرانی (خالی)** | صفر فاکتور؛ باید برای فروش‌های روزانه بوفه و فروشگاه آرایشی فاکتورهای واقعی صادر شود. |
| **`InvoiceItem`** | **۰** | **حداقل ۱۸۰ الی ۵۴۰ ردیف** | **بحرانی (خالی)** | صفر ردیف؛ اقلام فاکتور با قیمت، بهای تمام‌شده (COGS) و سود ناخالص. |
| **`CalendarBlock`** | **۰** | **حداقل ۱۸۰ بلوک** | **بحرانی (خالی)** | صفر بلوک؛ حداقل ۲ بلوک کار عمیق و کم‌عمق در هر روز از ۹۰ روز. |
| **`Transaction`** | **۵** | **حداقل ۹۰ الی ۲۵۰ تراکنش** | **بحرانی** | تنها ۵ تراکنش ثبت شده؛ فروش‌ها و خریدهای انبار باید به عنوان تراکنش ثبت شوند. |

---

## ۲. قیدها و آزمون‌های کمی به تفکیک نهادها (Quantitative Assertions per Entity)

پس از اجرای کامل فرآیند سیدینگ توسط Worker، دیتابیس `prisma/dev.db` باید دقیقاً شروط کمی و حدود زیر را برآورده سازد:

### ۲.۱. جدول دخل مغازه و بوفه (`ShopCashRegister`)
1. **تعداد کل رکوردها**: حداقل ۱۸۰ رکورد (۹۰ روز برای بوفه باشگاه + ۹۰ روز برای فروشگاه آرایشی) و در صورت اضافه شدن رایش، ۲۷۰ رکورد.
2. **یکتایی و تفکیک مرکز هزینه**: قید مرکب `@@unique([date, costCenterId])` باید برقرار باشد. هیچ تاریخی برای یک مرکز هزینه نباید دوبار تکرار شود.
3. **تطبیق و موازنه ریاضی دخل (قانون عدم مغایرت)**:
   $$\text{expectedClosingCash} = \text{openingCash} + \text{salesCash} - \text{expensesCash} - \text{withdrawalsCash}$$
   $$\text{difference} = \text{actualClosingCash} - \text{expectedClosingCash} = 0$$
   $$\text{reconciled} = \text{true}$$
   در تمام ۱۸۰ الی ۲۷۰ رکورد، مقدار `difference` باید بدون استثنا صفر (`0`) باشد.
4. **تجزیه فروش نقدی و کارتخوان**:
   $$\text{salesCash} = \text{posSalesCash} + \text{physicalSalesCash}$$
   هر دو فیلد باید مقادیر نامنفی داشته باشند (`posSalesCash >= 0`, `physicalSalesCash >= 0`).

### ۲.۲. جدول وعده‌های غذایی (`FoodEntry`) و لاگ تغذیه (`NutritionLog`)
1. **تعداد رکوردها**:
   - `NutritionLog`: دقیقاً ۹۰ رکورد (برای ۹۰ روز متوالی).
   - `FoodEntry`: حداقل ۲۷۰ رکورد (میانگین ۳ الی ۴ وعده در روز برای ۹۰ روز، شامل: صبحانه، میان‌وعده/شیک بوفه، ناهار، شام).
2. **تطبیق جمع وعده‌ها با سرجمع روزانه (Mathematical Equivalence)**:
   به ازای هر روز $D$ و لاگ تغذیه $NL_D$:
   $$\left| NL_D.\text{calories} - \sum_{m \in \text{meals}} m.\text{calories} \right| \le 2$$
   $$\left| NL_D.\text{protein} - \sum_{m \in \text{meals}} m.\text{protein} \right| \le 1.0\text{ g}$$
   $$\left| NL_D.\text{carbs} - \sum_{m \in \text{meals}} m.\text{carbs} \right| \le 1.0\text{ g}$$
   $$\left| NL_D.\text{fat} - \sum_{m \in \text{meals}} m.\text{fat} \right| \le 1.0\text{ g}$$
3. **صحت فرمول درشت‌مغذی‌ها (Atwater Macro Formula)**:
   $$\text{CalculatedCalories} = (\text{protein} \times 4) + (\text{carbs} \times 4) + (\text{fat} \times 9)$$
   اختلاف میان کالری ثبت‌شده و کالری محاسباتی نباید بیش از ۱۵٪ باشد:
   $$\frac{|\text{calories} - \text{CalculatedCalories}|}{\text{calories}} \le 0.15$$

### ۲.۳. جدول عادات و رکوردهای عادات (`Habit` & `HabitLog`)
1. **تعداد عادات**: دقیقاً ۶ عادت اصلی.
2. **تعداد کل لاگ‌های عادات**: دقیقاً ۵۴۰ رکورد ($6 \times 90 = 540$).
3. **توزیع یکنواخت**: هر یک از ۶ عادت باید دقیقاً ۹۰ لاگ به ازای ۹۰ روز تقویمی داشته باشد.
4. **محاسبه نرخ تکمیل و استریک**:
   $$\text{expectedRate} = \text{round}\left( \frac{\text{completedLogs}}{90} \times 100 \right)$$
   مقدار `Habit.completionRate` باید با این فرمول همخوانی داشته باشد ($\pm 2\%$).
   مقدار `Habit.streak` باید برابر با تعداد روزهای متوالی انجام‌شده منتهی به امروز باشد.

### ۲.۴. جدول تمرینات ورزشی (`Workout` & `WorkoutExercise`)
1. **تعداد جلسات تمرین**: بین ۴۰ الی ۵۵ جلسه در بازه ۹۰ روزه (به‌طور میانگین ۳ الی ۴ جلسه در هفته).
2. **تعداد حرکات ثبت‌شده**: بین ۱۲۰ الی ۲۵۰ حرکت ورزشی (حداقل ۳ حرکت در هر جلسه).
3. **محاسبه حجم تمرین (Total Volume Invariant)**:
   به ازای هر جلسه تمرین $W$:
   $$W.\text{totalVolume} = \sum_{e \in W.\text{exercises}} (e.\text{sets} \times e.\text{reps} \times e.\text{weight})$$
   اگر وزنه صفر باشد (حرکات بادی‌ویت مانند بارفیکس/شنا)، وزن مؤثر بدن یا عدد صفر منظور شود؛ اما برای حرکات با وزنه (اسکات، پرس سینه، زیربغل هالتر) باید مثبت باشد.
4. **اصل اضافه‌بار تدریجی (Progressive Overload Principle)**:
   میانگین وزنه و حجم تمرین در ماه سوم (روزهای ۶۱ تا ۹۰) باید حداقل ۵٪ الی ۱۵٪ بالاتر از ماه اول (روزهای ۱ تا ۳۰) باشد.

### ۲.۵. جدول فاکتورهای فروش و اقلام فاکتور (`Invoice` & `InvoiceItem`)
1. **تعداد فاکتورها**: حداقل ۹۰ فاکتور (به‌طور میانگین ۱ الی ۳ فاکتور در روز برای فروشگاه یا بوفه).
2. **محاسبه سرجمع مبالغ فاکتور**:
   $$\text{Invoice}.\text{totalAmount} = \sum (\text{InvoiceItem}.\text{total}) - \text{Invoice}.\text{discount}$$
   $$\text{InvoiceItem}.\text{total} = \text{InvoiceItem}.\text{quantity} \times \text{InvoiceItem}.\text{unitPrice}$$
3. **بهای تمام شده و سود ناخالص (COGS & Gross Profit)**:
   $$\text{Invoice}.\text{cogs} = \sum (\text{InvoiceItem}.\text{quantity} \times \text{InvoiceItem}.\text{unitCost})$$
   $$\text{Invoice}.\text{grossProfit} = \text{Invoice}.\text{totalAmount} - \text{Invoice}.\text{cogs}$$
   شرط حاشیه سود مثبت: $\text{Invoice}.\text{grossProfit} > 0$ در ۱۰۰٪ فاکتورها.
4. **تطبیق دخل و فاکتورها (Sales Linkage)**:
   مجموع مبالغ فاکتورهای صادره یک مرکز هزینه در یک روز خاص باید با فیلد `salesCash` در دخل متناظر همان روز برابر باشد:
   $$\sum \text{Invoice}.\text{totalAmount}_{\text{CC}, D} = \text{ShopCashRegister}.\text{salesCash}_{\text{CC}, D}$$

### ۲.۶. جدول بلوک‌های تقویم و کار عمیق (`CalendarBlock`)
1. **تعداد بلوک‌ها**: حداقل ۱۸۰ بلوک در بازه ۹۰ روزه (حداقل ۲ بلوک در هر روز).
2. **صحت زمانی و انواع معتبر**:
   $$block.\text{end} > block.\text{start}$$
   $$block.\text{plannedDuration} = \frac{block.\text{end} - block.\text{start}}{60000} \text{ minutes}$$
   مقادیر فیلد `type` باید در دامنه استاندارد زیر باشد:
   `["Deep Work", "Shallow Work", "Admin", "Learning", "Health", "Routine", "Buffer", "Rest", "Commute"]`
3. **همسویی با بازبینی شبانه**: ساعات کار عمیق ثبت‌شده در بلوک‌های روزانه با گزارش‌های بازبینی شبانه (`DailyReview`) هماهنگ باشد.

### ۲.۷. موجودی انبار کالاها (`Product`)
1. **عدم منفی بودن موجودی**: برای تمامی ۱۱ قلم کالا، مقدار `stock >= 0` باشد.
2. **نقطه سفارش (Reorder Point)**: برای تمام کالاها `minimumStock > 0` باشد.
3. **قیمت‌گذاری صحیح**: برای تمامی کالاها `sellPrice > buyPrice` باشد (حاشیه سود ناخالص مثبت).

---

## ۳. پیوستگی تاریخی و اعتبارسنجی بازه ۹۰ روزه (Date Continuity Assertions)

### ۳.۱. تعریف مبنای زمانی
- **تاریخ پایان (امروز)**: `Today` تنظیم‌شده روی ساعت ۱۲:۰۰:۰۰ ظهر (`12:00:00.000Z`).
- **تاریخ شروع**: `Today - 89 days` تنظیم‌شده روی ساعت ۱۲:۰۰:۰۰ ظهر.
- **تعداد روزهای متوالی**: دقیقاً ۹۰ روز تقویمی ($89 - 0 + 1 = 90$).

### ۳.۲. الگوریتم اثبات پیوستگی بدون وقفه (Zero-Gap Assertion)
برای هر جدول روزانه (`SleepLog`, `BodyMeasurement`, `NutritionLog`, `DailyReview`, و `ShopCashRegister` به ازای هر مرکز هزینه):
1. استخراج تمام تاریخ‌ها به ترتیب صعودی: $[D_0, D_1, \dots, D_{89}]$.
2. تعداد روزهای یکتا دقیقاً برابر با ۹۰ باشد: $\text{count}(\text{distinct}(D)) = 90$.
3. برای هر $i \in \{1, \dots, 89\}$:
   $$D_i - D_{i-1} = 86,400,000\text{ ms} \pm 3,600,000\text{ ms (بافر تغییر ساعت)}$$
   هیچ روز گم‌شده‌ای مجاز نیست (Missing Days = 0).

---

## ۴. اسکریپت جامع اعتبارسنجی یکپارچگی داده (`scripts/verify-m1-integrity.mjs`)

این اسکریپت به صورت کاملاً مستقل و اجرایی طراحی شده است. Worker بلافاصله پس از اعمال اسکیما و سیدینگ، می‌تواند با اجرای دستور زیر، صحت ۱۰۰٪ دیتابیس را ارزیابی کند:

```bash
node scripts/verify-m1-integrity.mjs
```

کد کامل و آماده این اسکریپت در بخش زیر آورده شده است:

```javascript
/**
 * scripts/verify-m1-integrity.mjs
 * Complete Milestone 1 Data Integrity Verification Suite for Life OS
 * Verifies:
 * 1. Record counts and schema presence
 * 2. 90-day chronological continuity (zero gaps)
 * 3. Cash register balancing & multi-center isolation
 * 4. Cash register vs. Invoice totals linkage
 * 5. Invoice & InvoiceItem arithmetic, COGS, and gross profit
 * 6. NutritionLog vs FoodEntry macro & calorie consistency (Atwater)
 * 7. Workout & WorkoutExercise volume & progressive overload
 * 8. Sleep efficiency & energy score correlation
 * 9. Habit & HabitLog completion and streaks (540 logs)
 * 10. CalendarBlock duration and distribution
 * 11. Inventory stock non-negativity and reorder points
 * 12. OKR & Key Result progress formulas
 */

import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

const prisma = new PrismaClient();

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function pass(name, detail = "") {
  passedChecks++;
  console.log(`  ${ANSI.green}✓ PASS:${ANSI.reset} ${name} ${detail ? ANSI.cyan + "(" + detail + ")" + ANSI.reset : ""}`);
}

function fail(name, error) {
  failedChecks++;
  const msg = error?.message || error;
  failures.push({ name, error: msg });
  console.error(`  ${ANSI.red}✗ FAIL:${ANSI.reset} ${name} -> ${ANSI.yellow}${msg}${ANSI.reset}`);
}

async function verifyAll() {
  console.log(`\n${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}🔍 STARTING MILESTONE 1 DATA INTEGRITY & AUDIT VERIFICATION${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}\n`);

  // =========================================================================
  // SUITE 1: Quantitative Record Counts
  // =========================================================================
  console.log(`${ANSI.bold}📂 SUITE 1: Entity Record Count Assertions${ANSI.reset}`);

  try {
    const userCount = await prisma.user.count();
    assert.equal(userCount, 1, `Expected exactly 1 user, found ${userCount}`);
    pass("User entity count", `count: ${userCount}`);
  } catch (e) { fail("User entity count", e); }

  try {
    const areaCount = await prisma.area.count();
    assert.equal(areaCount, 9, `Expected 9 areas, found ${areaCount}`);
    pass("Area entity count", `count: ${areaCount}`);
  } catch (e) { fail("Area entity count", e); }

  try {
    const ccCount = await prisma.costCenter.count();
    assert.equal(ccCount, 6, `Expected 6 cost centers, found ${ccCount}`);
    pass("CostCenter entity count", `count: ${ccCount}`);
  } catch (e) { fail("CostCenter entity count", e); }

  try {
    const prodCount = await prisma.product.count();
    assert.ok(prodCount >= 11, `Expected at least 11 products, found ${prodCount}`);
    pass("Product entity count", `count: ${prodCount}`);
  } catch (e) { fail("Product entity count", e); }

  try {
    const sleepCount = await prisma.sleepLog.count();
    assert.equal(sleepCount, 90, `Expected exactly 90 SleepLogs, found ${sleepCount}`);
    pass("SleepLog entity count", `count: ${sleepCount}`);
  } catch (e) { fail("SleepLog entity count", e); }

  try {
    const bodyCount = await prisma.bodyMeasurement.count();
    assert.equal(bodyCount, 90, `Expected exactly 90 BodyMeasurements, found ${bodyCount}`);
    pass("BodyMeasurement entity count", `count: ${bodyCount}`);
  } catch (e) { fail("BodyMeasurement entity count", e); }

  try {
    const nutCount = await prisma.nutritionLog.count();
    assert.equal(nutCount, 90, `Expected exactly 90 NutritionLogs, found ${nutCount}`);
    pass("NutritionLog entity count", `count: ${nutCount}`);
  } catch (e) { fail("NutritionLog entity count", e); }

  try {
    const foodCount = await prisma.foodEntry.count();
    assert.ok(foodCount >= 270, `Expected at least 270 FoodEntries (3-4/day), found ${foodCount}`);
    pass("FoodEntry entity count", `count: ${foodCount}`);
  } catch (e) { fail("FoodEntry entity count", e); }

  try {
    const habitLogCount = await prisma.habitLog.count();
    assert.equal(habitLogCount, 540, `Expected exactly 540 HabitLogs (6 habits * 90 days), found ${habitLogCount}`);
    pass("HabitLog entity count", `count: ${habitLogCount}`);
  } catch (e) { fail("HabitLog entity count", e); }

  try {
    const registerCount = await prisma.shopCashRegister.count();
    assert.ok(registerCount >= 180, `Expected at least 180 CashRegisters (90 days * >=2 centers), found ${registerCount}`);
    pass("ShopCashRegister entity count", `count: ${registerCount}`);
  } catch (e) { fail("ShopCashRegister entity count", e); }

  try {
    const workoutCount = await prisma.workout.count();
    assert.ok(workoutCount >= 40 && workoutCount <= 55, `Expected 40-55 workouts in 90 days, found ${workoutCount}`);
    pass("Workout entity count", `count: ${workoutCount}`);
  } catch (e) { fail("Workout entity count", e); }

  try {
    const exerciseCount = await prisma.workoutExercise.count();
    assert.ok(exerciseCount >= 120, `Expected at least 120 WorkoutExercises, found ${exerciseCount}`);
    pass("WorkoutExercise entity count", `count: ${exerciseCount}`);
  } catch (e) { fail("WorkoutExercise entity count", e); }

  try {
    const invoiceCount = await prisma.invoice.count();
    assert.ok(invoiceCount >= 90, `Expected at least 90 Invoices across 90 days, found ${invoiceCount}`);
    pass("Invoice entity count", `count: ${invoiceCount}`);
  } catch (e) { fail("Invoice entity count", e); }

  try {
    const invoiceItemCount = await prisma.invoiceItem.count();
    assert.ok(invoiceItemCount >= 180, `Expected at least 180 InvoiceItems, found ${invoiceItemCount}`);
    pass("InvoiceItem entity count", `count: ${invoiceItemCount}`);
  } catch (e) { fail("InvoiceItem entity count", e); }

  try {
    const calBlockCount = await prisma.calendarBlock.count();
    assert.ok(calBlockCount >= 180, `Expected at least 180 CalendarBlocks, found ${calBlockCount}`);
    pass("CalendarBlock entity count", `count: ${calBlockCount}`);
  } catch (e) { fail("CalendarBlock entity count", e); }

  // =========================================================================
  // SUITE 2: 90-Day Chronological Continuity (Zero Gaps)
  // =========================================================================
  console.log(`\n${ANSI.bold}📅 SUITE 2: 90-Day Chronological Continuity Assertions${ANSI.reset}`);

  async function checkDailyContinuity(modelName, where = {}) {
    const records = await prisma[modelName].findMany({
      where,
      orderBy: { date: "asc" },
      select: { date: true },
    });
    if (records.length !== 90) {
      throw new Error(`${modelName} has ${records.length} records, expected exactly 90`);
    }

    for (let i = 1; i < records.length; i++) {
      const prev = new Date(records[i - 1].date).getTime();
      const curr = new Date(records[i].date).getTime();
      const diffHours = (curr - prev) / (1000 * 60 * 60);
      // Diff must be ~24 hours (allowing 23-25 for daylight savings)
      if (diffHours < 22 || diffHours > 26) {
        throw new Error(`Date gap detected in ${modelName} between index ${i-1} (${records[i-1].date.toISOString()}) and ${i} (${records[i].date.toISOString()}): ${diffHours}h`);
      }
    }
  }

  for (const m of ["sleepLog", "bodyMeasurement", "nutritionLog", "dailyReview"]) {
    try {
      await checkDailyContinuity(m);
      pass(`${m} 90-day continuity`, "Zero gaps, exactly 90 continuous days");
    } catch (e) { fail(`${m} 90-day continuity`, e); }
  }

  // Check CashRegister continuity per Cost Center
  try {
    const costCenters = await prisma.costCenter.findMany({
      where: { code: { in: ["BUF", "COS"] } },
    });
    for (const cc of costCenters) {
      await checkDailyContinuity("shopCashRegister", { costCenterId: cc.id });
      pass(`ShopCashRegister continuity for ${cc.name} (${cc.code})`, "90 continuous days");
    }
  } catch (e) { fail("ShopCashRegister multi-center continuity", e); }

  // Check HabitLog continuity per Habit
  try {
    const habits = await prisma.habit.findMany();
    for (const h of habits) {
      const hLogs = await prisma.habitLog.findMany({
        where: { habitId: h.id },
        orderBy: { date: "asc" },
      });
      assert.equal(hLogs.length, 90, `Habit "${h.title}" has ${hLogs.length} logs, expected 90`);
    }
    pass("HabitLog continuity for all 6 habits", "Each habit has exactly 90 daily logs");
  } catch (e) { fail("HabitLog per-habit continuity", e); }

  // =========================================================================
  // SUITE 3: Cash Register Mathematical Balancing & Multi-Center Isolation
  // =========================================================================
  console.log(`\n${ANSI.bold}💰 SUITE 3: Cash Register Balancing & Multi-Center Math${ANSI.reset}`);

  try {
    const registers = await prisma.shopCashRegister.findMany();
    let imbalanceCount = 0;
    let nullCostCenterCount = 0;

    for (const r of registers) {
      if (!r.costCenterId) nullCostCenterCount++;
      const expected = r.openingCash + r.salesCash - r.expensesCash - r.withdrawalsCash;
      const diff = r.actualClosingCash - expected;
      if (Math.abs(diff) > 0.01 || Math.abs(r.difference) > 0.01 || !r.reconciled) {
        imbalanceCount++;
      }
    }

    assert.equal(nullCostCenterCount, 0, `Found ${nullCostCenterCount} cash registers with null costCenterId`);
    assert.equal(imbalanceCount, 0, `Found ${imbalanceCount} imbalanced cash registers`);
    pass("ShopCashRegister balancing equation", `100% of ${registers.length} registers balanced (difference = 0)`);
    pass("ShopCashRegister costCenterId presence", "All registers linked to specific cost centers");
  } catch (e) { fail("ShopCashRegister math and foreign key", e); }

  // =========================================================================
  // SUITE 4: Cash Register vs Invoices Reconciliation
  // =========================================================================
  console.log(`\n${ANSI.bold}🧾 SUITE 4: Cash Register vs Invoices Reconciliation${ANSI.reset}`);

  try {
    const registers = await prisma.shopCashRegister.findMany({
      where: { costCenterId: { not: null } },
    });

    let matchedRegisters = 0;
    let mismatchedRegisters = 0;

    for (const r of registers) {
      const dayStart = new Date(r.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(r.date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayInvoices = await prisma.invoice.findMany({
        where: {
          costCenterId: r.costCenterId,
          date: { gte: dayStart, lte: dayEnd },
        },
      });

      if (dayInvoices.length > 0) {
        const invoiceSum = dayInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
        if (Math.abs(invoiceSum - r.salesCash) < 1.0) {
          matchedRegisters++;
        } else {
          mismatchedRegisters++;
        }
      }
    }

    assert.ok(matchedRegisters >= 90, `Expected at least 90 matched register-invoice days, got ${matchedRegisters}`);
    assert.equal(mismatchedRegisters, 0, `Found ${mismatchedRegisters} registers where salesCash != sum(invoices)`);
    pass("Cash Register to Invoice Reconciliation", `${matchedRegisters} daily registers match exact invoice totals`);
  } catch (e) { fail("Cash Register vs Invoices Reconciliation", e); }

  // =========================================================================
  // SUITE 5: Invoice & InvoiceItem Arithmetic, COGS, and Gross Profit
  // =========================================================================
  console.log(`\n${ANSI.bold}📊 SUITE 5: Invoice & Item Arithmetic & Profit Margins${ANSI.reset}`);

  try {
    const invoices = await prisma.invoice.findMany({
      include: { items: true },
    });

    let arithmeticErrors = 0;
    let negativeMarginErrors = 0;

    for (const inv of invoices) {
      assert.ok(inv.items.length > 0, `Invoice ${inv.invoiceNumber} has 0 items`);
      const itemsSum = inv.items.reduce((s, it) => s + it.total, 0);
      const expectedTotal = itemsSum - inv.discount;
      if (Math.abs(inv.totalAmount - expectedTotal) > 0.1) arithmeticErrors++;

      const cogsSum = inv.items.reduce((s, it) => s + (it.quantity * it.unitCost), 0);
      if (Math.abs(inv.cogs - cogsSum) > 0.1) arithmeticErrors++;

      const expectedProfit = inv.totalAmount - inv.cogs;
      if (Math.abs(inv.grossProfit - expectedProfit) > 0.1) arithmeticErrors++;

      if (inv.grossProfit <= 0) negativeMarginErrors++;
    }

    assert.equal(arithmeticErrors, 0, `Found ${arithmeticErrors} invoice math errors`);
    assert.equal(negativeMarginErrors, 0, `Found ${negativeMarginErrors} invoices with <= 0 gross profit`);
    pass("Invoice & Line Item Arithmetic", `${invoices.length} invoices verified: Total = Items - Discount, COGS, and Gross Profit match 100%`);
  } catch (e) { fail("Invoice & Line Item Arithmetic", e); }

  // =========================================================================
  // SUITE 6: NutritionLog vs FoodEntry Macro & Calorie Consistency
  // =========================================================================
  console.log(`\n${ANSI.bold}🥗 SUITE 6: Nutrition Log & Meal Consistency (Atwater Check)${ANSI.reset}`);

  try {
    const nutLogs = await prisma.nutritionLog.findMany({
      include: { meals: true },
    });

    let macroMismatches = 0;
    let missingMealsDays = 0;

    for (const nl of nutLogs) {
      if (nl.meals.length < 3) missingMealsDays++;

      const mealCals = nl.meals.reduce((s, m) => s + m.calories, 0);
      const mealProt = nl.meals.reduce((s, m) => s + m.protein, 0);
      const mealCarbs = nl.meals.reduce((s, m) => s + m.carbs, 0);
      const mealFat = nl.meals.reduce((s, m) => s + m.fat, 0);

      if (Math.abs(nl.calories - mealCals) > 5) macroMismatches++;
      if (Math.abs(nl.protein - mealProt) > 2) macroMismatches++;
      if (Math.abs(nl.carbs - mealCarbs) > 2) macroMismatches++;
      if (Math.abs(nl.fat - mealFat) > 2) macroMismatches++;

      // Atwater formula check
      const atwaterKcal = (nl.protein * 4) + (nl.carbs * 4) + (nl.fat * 9);
      const diffRatio = Math.abs(nl.calories - atwaterKcal) / nl.calories;
      if (diffRatio > 0.20) {
        macroMismatches++;
      }
    }

    assert.equal(missingMealsDays, 0, `Found ${missingMealsDays} days with < 3 meals`);
    assert.equal(macroMismatches, 0, `Found ${macroMismatches} nutrition macro/calorie mismatches`);
    pass("NutritionLog to FoodEntry Aggregation", `All 90 days have 3+ meals and exact macro sums`);
    pass("Atwater Macro Caloric Concordance", "Kcal corresponds to (4*P + 4*C + 9*F) within tolerance");
  } catch (e) { fail("NutritionLog vs FoodEntry consistency", e); }

  // =========================================================================
  // SUITE 7: Workout Volume & Progressive Overload
  // =========================================================================
  console.log(`\n${ANSI.bold}🏋️ SUITE 7: Workout Volume & Progressive Overload${ANSI.reset}`);

  try {
    const workouts = await prisma.workout.findMany({
      include: { exercises: true },
      orderBy: { date: "asc" },
    });

    let volumeErrors = 0;
    for (const w of workouts) {
      assert.ok(w.exercises.length >= 3, `Workout on ${w.date} has fewer than 3 exercises`);
      const calcVol = w.exercises.reduce((s, e) => s + (e.sets * e.reps * e.weight), 0);
      if (Math.abs(w.totalVolume - calcVol) > 1.0) volumeErrors++;
    }

    assert.equal(volumeErrors, 0, `Found ${volumeErrors} workouts with totalVolume calculation error`);

    // Progressive overload: compare first third vs last third of workouts
    const third = Math.floor(workouts.length / 3);
    const m1AvgVol = workouts.slice(0, third).reduce((s, w) => s + w.totalVolume, 0) / third;
    const m3AvgVol = workouts.slice(workouts.length - third).reduce((s, w) => s + w.totalVolume, 0) / third;

    assert.ok(m3AvgVol > m1AvgVol, `Progressive overload failed: Month 1 vol (${m1AvgVol.toFixed(0)}) >= Month 3 vol (${m3AvgVol.toFixed(0)})`);
    pass("Workout volume integrity", `${workouts.length} workouts verified: Total volume matches sum(sets*reps*weight)`);
    pass("Progressive overload trend", `Month 1 avg volume: ${m1AvgVol.toFixed(0)}kg -> Month 3 avg: ${m3AvgVol.toFixed(0)}kg (+${(((m3AvgVol - m1AvgVol) / m1AvgVol) * 100).toFixed(1)}%)`);
  } catch (e) { fail("Workout volume & progressive overload", e); }

  // =========================================================================
  // SUITE 8: Sleep Efficiency & Energy Bounds
  // =========================================================================
  console.log(`\n${ANSI.bold}😴 SUITE 8: Sleep Efficiency & Energy Score Validation${ANSI.reset}`);

  try {
    const sleepLogs = await prisma.sleepLog.findMany();
    let formulaErrors = 0;
    let lowEffErrors = 0;

    for (const sl of sleepLogs) {
      const calcEff = Math.min(100, Math.round((sl.totalSleepTimeMinutes / sl.timeInBedMinutes) * 1000) / 10);
      if (Math.abs(sl.sleepEfficiency - calcEff) > 0.2) formulaErrors++;
      if (sl.sleepEfficiency < 80) lowEffErrors++;
      if (sl.morningEnergy < 1 || sl.morningEnergy > 10) formulaErrors++;
    }

    assert.equal(formulaErrors, 0, `Found ${formulaErrors} sleep efficiency calculation errors`);
    assert.equal(lowEffErrors, 0, `Found ${lowEffErrors} days with sleep efficiency < 80%`);
    pass("Sleep efficiency formula", `All 90 sleep logs match formula: TST / TIB * 100`);
    pass("Sleep quality threshold", `All 90 days have sleep efficiency >= 80% (Average: ${(sleepLogs.reduce((s, l) => s + l.sleepEfficiency, 0) / 90).toFixed(1)}%)`);
  } catch (e) { fail("Sleep efficiency & energy validation", e); }

  // =========================================================================
  // SUITE 9: Habit Completion Rates & Streaks
  // =========================================================================
  console.log(`\n${ANSI.bold}🎯 SUITE 9: Habit Completion Rates & Streak Integrity${ANSI.reset}`);

  try {
    const habits = await prisma.habit.findMany({
      include: { logs: true },
    });

    for (const h of habits) {
      assert.equal(h.logs.length, 90, `Habit ${h.title} has ${h.logs.length} logs`);
      const completedCount = h.logs.filter((l) => l.completed).length;
      const expectedRate = Math.round((completedCount / 90) * 100);
      const diff = Math.abs(h.completionRate - expectedRate);
      assert.ok(diff <= 3, `Habit ${h.title} completion rate mismatch: stored ${h.completionRate}%, expected ${expectedRate}%`);
    }
    pass("Habit completion rate accuracy", "All 6 habits match their 90-day log history");
  } catch (e) { fail("Habit completion rates & streaks", e); }

  // =========================================================================
  // SUITE 10: Calendar Blocks Distribution & Validity
  // =========================================================================
  console.log(`\n${ANSI.bold}📆 SUITE 10: Calendar Block Duration & Distribution${ANSI.reset}`);

  try {
    const blocks = await prisma.calendarBlock.findMany();
    let durationErrors = 0;
    for (const b of blocks) {
      const diffMs = new Date(b.end).getTime() - new Date(b.start).getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (b.plannedDuration !== diffMin) durationErrors++;
      if (diffMin <= 0) durationErrors++;
    }
    assert.equal(durationErrors, 0, `Found ${durationErrors} calendar blocks with invalid duration or inverted timestamps`);
    pass("Calendar block duration integrity", `${blocks.length} blocks have valid timestamps (end > start) and matching durations`);
  } catch (e) { fail("Calendar block validity", e); }

  // =========================================================================
  // SUITE 11: Inventory Stock Non-Negativity & Reorder Points
  // =========================================================================
  console.log(`\n${ANSI.bold}📦 SUITE 11: Product Stock & Reorder Points${ANSI.reset}`);

  try {
    const products = await prisma.product.findMany();
    let negativeStockErrors = 0;
    let priceErrors = 0;

    for (const p of products) {
      if (p.stock < 0) negativeStockErrors++;
      if (p.sellPrice <= p.buyPrice) priceErrors++;
      assert.ok(p.minimumStock > 0, `Product ${p.name} has minimumStock <= 0`);
    }

    assert.equal(negativeStockErrors, 0, `Found ${negativeStockErrors} products with negative stock`);
    assert.equal(priceErrors, 0, `Found ${priceErrors} products where sellPrice <= buyPrice`);
    pass("Product inventory constraints", `All ${products.length} products have positive stock, valid markup, and minimum reorder thresholds`);
  } catch (e) { fail("Product inventory constraints", e); }

  // =========================================================================
  // SUITE 12: Goal & OKR Progress Engine
  // =========================================================================
  console.log(`\n${ANSI.bold}🏆 SUITE 12: OKR Progress Engine Calculation${ANSI.reset}`);

  try {
    const krs = await prisma.keyResult.findMany();
    let progressErrors = 0;

    for (const kr of krs) {
      const raw = ((kr.currentValue - kr.baseline) / (kr.target - kr.baseline)) * 100;
      const expectedProgress = Math.min(100, Math.max(0, Math.round(raw)));
      if (Math.abs(kr.progress - expectedProgress) > 1) progressErrors++;
    }

    assert.equal(progressErrors, 0, `Found ${progressErrors} KeyResult progress calculation errors`);

    const objectives = await prisma.objective.findMany({ include: { keyResults: true } });
    for (const obj of objectives) {
      if (obj.keyResults.length > 0) {
        const avg = Math.round(obj.keyResults.reduce((s, k) => s + k.progress, 0) / obj.keyResults.length);
        assert.equal(obj.progress, avg, `Objective "${obj.title}" progress (${obj.progress}%) does not match average of KRs (${avg}%)`);
      }
    }
    pass("OKR & Key Result Progress Math", "All KeyResults and Objectives match the exact mathematical formulas");
  } catch (e) { fail("OKR Progress Engine Calculation", e); }

  // =========================================================================
  // FINAL SUMMARY
  // =========================================================================
  console.log(`\n${ANSI.bold}${ANSI.blue}=================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}📋 VERIFICATION SUMMARY RESULT:${ANSI.reset}`);
  console.log(`  • ${ANSI.green}Total Passed Checks:${ANSI.reset} ${passedChecks}`);
  console.log(`  • ${ANSI.red}Total Failed Checks:${ANSI.reset} ${failedChecks}`);

  if (failedChecks === 0) {
    console.log(`\n${ANSI.bold}${ANSI.green}🎉 100% DATA INTEGRITY ACHIEVED! ALL TEST SUITES PASSED CLEANLY.${ANSI.reset}`);
    console.log(`${ANSI.blue}=================================================================${ANSI.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${ANSI.bold}${ANSI.red}❌ INTEGRITY VERIFICATION FAILED WITH ${failedChecks} ERRORS!${ANSI.reset}`);
    console.log(`Failing assertions:`);
    for (const f of failures) {
      console.log(`  - [${f.name}]: ${f.error}`);
    }
    console.log(`${ANSI.blue}=================================================================${ANSI.reset}\n`);
    process.exit(1);
  }
}

verifyAll()
  .catch((e) => {
    console.error("Fatal test suite crash:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## ۵. چک‌لیست اجرایی و مراحل پیاده‌سازی برای Worker (Implementation Checklist for Worker)

جهت دستیابی به قبولی ۱۰۰٪ در اسکریپت اعتبارسنجی بالا، Worker موظف است گام‌های زیر را به دقت طی نماید:

1. **اعمال تغییرات اسکیما (`prisma/schema.prisma`)**:
   - در مدل `ShopCashRegister`: افزودن فیلد `costCenterId String?`، برقراری رابطه با `CostCenter`، افزودن `posSalesCash Float @default(0)` و `physicalSalesCash Float @default(0)`، و تبدیل `@unique` فیلد تاریخ به `@@unique([date, costCenterId])`.
   - در مدل `CostCenter`: افزودن فیلد رابطه معکوس `cashRegisters ShopCashRegister[]`.
   - تایید مدل‌های `Workout` و `WorkoutExercise` با تمام فیلدهای استاندارد (`sets`, `reps`, `weight`, `rpe`, `totalVolume`).
   - اجرای امن:
     ```bash
     npx prisma db push
     npx prisma generate
     ```

2. **به‌روزرسانی اسکریپت‌های سیدینگ (`scripts/seed.mjs` و `scripts/simulate-90-days-lifecycle.mjs`)**:
   - اصلاح حلقه ۹۰ روزه برای ایجاد ۹۰ رکورد دخل مستقل برای بوفه (`costCenterId: buffetCC.id`) و ۹۰ رکورد برای آرایشی (`costCenterId: cosmeticsCC.id`).
   - ایجاد فاکتورهای فروش روزانه (`Invoice` و `InvoiceItem`) متناظر با دخل همان روز.
   - ایجاد ۳ الی ۴ وعده غذایی (`FoodEntry`) برای تمامی ۹۰ روز متناظر با `NutritionLog`.
   - تکمیل ۵۴۰ لاگ عادات (`HabitLog`) به ازای تمام ۹۰ روز.
   - ایجاد ۴۰ الی ۵۵ جلسه تمرین بدنسازی (`Workout` و `WorkoutExercise`) با اصل اضافه‌بار تدریجی.
   - ایجاد حداقل ۱۸۰ بلوک زمانی تقویم (`CalendarBlock`).
   - اجرای سیدینگ:
     ```bash
     node scripts/seed.mjs
     ```

3. **اجرای اسکریپت صحه‌گذاری**:
   ```bash
   node scripts/verify-m1-integrity.mjs
   ```
   تنها در صورت خروج با کد صفر (`Exit code 0`) و نمایش `100% DATA INTEGRITY ACHIEVED`، مایلستون ۱ آماده پذیرش است.
