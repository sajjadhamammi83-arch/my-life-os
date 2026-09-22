# Milestone 1 Technical Specification: 90-Day Simulation Seeding
**Agent**: `m1_explorer_2` (teamwork_preview_explorer)  
**Target Files**: `scripts/seed.mjs`, `scripts/simulate-90-days-lifecycle.mjs`  
**Dependencies**: Schema updates from `m1_explorer_1` (Prisma compound unique `@@unique([date, costCenterId])` and register fields)  
**Date**: 2026-09-03  

---

## 1. Executive Summary & Quantitative Targets

To fulfill Milestone 1 and provide an authentic, production-grade 3-month (90 days) history for the Life OS platform, the seeding pipeline must be enriched with realistic, mathematically consistent, progressive data across all 17 core modules.

### Quantitative Targets

| Entity | Current Seed Count | Required Seed Count | Key Characteristics |
|---|---|---|---|
| `Workout` | **0** | **~51 sessions** | 4 sessions/week across 90 days; rotating 4-day split |
| `WorkoutExercise` | **0** | **~255 exercises** | 5 exercises per session; progressive overload (weight +35%, volume curve) |
| `ShopCashRegister` | **90** (single combined) | **270 records** | 90 daily records for each of 3 active cost centers (Buffet, Cosmetics, Rayesh) |
| `Invoice` | **0** | **~200 invoices** | Itemized sales invoices for Buffet, Cosmetics, and Rayesh milestones |
| `InvoiceItem` | **0** | **~400 line items** | Linked to actual products; strict Gross Profit math (`totalAmount - cogs`) |
| `NutritionLog` | **90** (flat totals) | **90 records** | Sums strictly match daily `FoodEntry` items |
| `FoodEntry` | **4** (day 0 only) | **360 meals** | 4 meals daily (Breakfast, Snack/Shake, Lunch, Dinner) across all 90 days |
| `HabitLog` | **42** (last 7 days only) | **540 logs** | Complete 6 habits × 90 days; realistic compliance; recalculated streaks |
| `CalendarBlock` | **0** | **~310 blocks** | Daily Deep Work (Rayesh), Shallow Work (Ops), Health (Gym), Friday CEO Day |

---

## 2. Architectural Principles & Cross-Entity Integrity Rules

The simulation data must satisfy 5 strict invariants:

1. **Temporal Alignment**:
   - Days are numbered from `dayOffset = 89` (Day 1, 90 days ago) down to `dayOffset = 0` (Day 90, Today).
   - Normalized dates use noon `12:00:00 UTC` (`logDate.setHours(12, 0, 0, 0)`) to eliminate daylight savings drift in SQLite.
   - Specific time-block entities (`CalendarBlock`, `FoodEntry.time`, `SleepLog.bedTime`) use realistic local time intervals.
2. **Financial Register Reconciliation (`difference === 0`)**:
   - `expectedClosingCash = openingCash + salesCash - expensesCash - withdrawalsCash`
   - `actualClosingCash = expectedClosingCash`
   - `difference = actualClosingCash - expectedClosingCash = 0`
   - `reconciled = true`
   - `salesCash = posSalesCash + physicalSalesCash`
3. **Invoicing & Inventory Math Consistency**:
   - `Invoice.totalAmount = sum(InvoiceItem.total)`
   - `Invoice.cogs = sum(InvoiceItem.quantity * InvoiceItem.unitCost)`
   - `Invoice.grossProfit = Invoice.totalAmount - Invoice.cogs` (Gross margin 30%–52%)
   - For Buffet and Cosmetics, daily invoice totals correspond to that day's POS and Cash sales recorded in `ShopCashRegister`.
4. **Nutrition & Meals Mathematical Invariant**:
   - `NutritionLog.calories = sum(FoodEntry.calories)`
   - `NutritionLog.protein = sum(FoodEntry.protein)`
   - `NutritionLog.carbs = sum(FoodEntry.carbs)`
   - `NutritionLog.fat = sum(FoodEntry.fat)`
5. **Progressive Overload Trajectory**:
   - `progressRatio = (90 - dayOffset) / 90` (from ~0.01 to 1.0)
   - Gym weights increase progressively by ~35% over the 90 days.
   - Total workout volume tracks upward from ~6,000 kg to ~9,200 kg.
   - Body weight tracks downward from 84.5 kg to 78.8 kg with decreasing waist circumference.

---

## 3. Concrete Design: Entity by Entity

### 3.1. `Workout` & `WorkoutExercise`

#### Scheduling Logic
- Days: 4 workouts per week (modulo logic: `dayIndex % 7 in [1, 3, 4, 6]`).
- Total sessions: 51 workouts across 90 days.
- 4-Day Rotating Bodybuilding Split:
  1. **Split 0: سینه و جلو بازو (Chest & Biceps)**
  2. **Split 1: زیربغل و پشت بازو (Back & Triceps)**
  3. **Split 2: پا و شکم (Legs & Abs)**
  4. **Split 3: سرشانه و کول (Shoulders & Traps)**

#### Progressive Overload Formulas
```javascript
const prog = (90 - dayOffset) / 90; // 0.01 to 1.0
// Weight scaling: +35% progression across 90 days, rounded to nearest 0.5kg
const weight = Math.round((baseWeight * (1 + 0.35 * prog)) * 2) / 2;
// RPE progression: 7.5 to 9.0
const rpe = Math.min(9.5, Math.round((7.5 + 1.2 * prog + ((dayOffset % 3) * 0.2)) * 10) / 10);
```

#### Exercise Catalog per Split
- **Split 0 (سینه و جلو بازو)**:
  1. پرس سینه هالتر (Barbell Bench Press): sets: 4, reps: 10, baseWeight: 60 kg, rest: 90s
  2. بالاسینه دمبل (Incline DB Press): sets: 4, reps: 10, baseWeight: 22 kg, rest: 75s
  3. قفسه سینه دمبل (Dumbbell Flyes): sets: 3, reps: 12, baseWeight: 14 kg, rest: 60s
  4. جلو بازو هالتر EZ (EZ-Bar Curl): sets: 3, reps: 10, baseWeight: 25 kg, rest: 60s
  5. جلو بازو دمبل چکشی (Hammer Curl): sets: 3, reps: 12, baseWeight: 14 kg, rest: 60s
- **Split 1 (زیربغل و پشت بازو)**:
  1. ددلیفت رومانیایی (Romanian Deadlift): sets: 4, reps: 8, baseWeight: 80 kg, rest: 120s
  2. زیربغل سیم‌کش مچ برعکس (Reverse Lat Pulldown): sets: 4, reps: 10, baseWeight: 55 kg, rest: 75s
  3. زیربغل قایقی سیم‌کش (Seated Cable Row): sets: 3, reps: 10, baseWeight: 50 kg, rest: 75s
  4. پشت بازو سیم‌کش طناب (Tricep Pushdown): sets: 3, reps: 12, baseWeight: 22 kg, rest: 60s
  5. دیپ پارالل با وزن بدن (Parallel Bar Dips): sets: 3, reps: 10, baseWeight: 10 kg, rest: 75s
- **Split 2 (پا و شکم)**:
  1. اسکات پا هالتر (Barbell Squat): sets: 4, reps: 8, baseWeight: 75 kg, rest: 120s
  2. پرس پا دستگاه (Leg Press): sets: 4, reps: 10, baseWeight: 130 kg, rest: 90s
  3. جلو پا دستگاه (Leg Extension): sets: 3, reps: 12, baseWeight: 45 kg, rest: 60s
  4. پشت پا دستگاه خوابیده (Lying Leg Curl): sets: 3, reps: 12, baseWeight: 35 kg, rest: 60s
  5. کرانچ سیم‌کش زانو زده (Cable Crunch): sets: 3, reps: 15, baseWeight: 35 kg, rest: 45s
- **Split 3 (سرشانه و کول)**:
  1. پرس سرشانه دمبل نشسته (DB Shoulder Press): sets: 4, reps: 8, baseWeight: 18 kg, rest: 90s
  2. نشر جانب دمبل (DB Lateral Raise): sets: 4, reps: 15, baseWeight: 9 kg, rest: 60s
  3. نشر خم دمبل (Rear Delt Fly): sets: 3, reps: 12, baseWeight: 10 kg, rest: 60s
  4. شراگز دمبل جفت سنگین (DB Shrugs): sets: 4, reps: 12, baseWeight: 26 kg, rest: 60s
  5. فیس پول سیم‌کش طناب (Face Pull): sets: 3, reps: 15, baseWeight: 25 kg, rest: 60s

#### Volume Formula
`totalVolume = sum(exercise.sets * exercise.reps * exercise.weight)`

---

### 3.2. `ShopCashRegister` (Multi-Cost-Center Seeding)

For every single day `dayOffset` (0 to 89), 3 distinct records are inserted:

#### 1. بوفه باشگاه (CostCenter Code: `BUF`)
- `openingCash`: `1200000 + ((dayIndex * 37) % 300000)` (1.2M to 1.5M تومان)
- `posSalesCash`: `1200000 + Math.floor(prog * 800000) + ((dayIndex * 53) % 250000)` (1.2M to 2.2M)
- `physicalSalesCash`: `150000 + ((dayIndex * 19) % 150000)` (150K to 300K)
- `salesCash`: `posSalesCash + physicalSalesCash`
- `expensesCash`: `120000 + ((dayIndex * 23) % 80000)` (120K to 200K)
- `withdrawalsCash`: `350000 + ((dayIndex * 41) % 150000)` (350K to 500K)
- `expectedClosingCash`: `openingCash + salesCash - expensesCash - withdrawalsCash`
- `actualClosingCash`: `expectedClosingCash`
- `difference`: `0`
- `reconciled`: `true`

#### 2. لوازم آرایشی (CostCenter Code: `COS`)
- `openingCash`: `2500000 + ((dayIndex * 43) % 500000)` (2.5M to 3.0M تومان)
- `posSalesCash`: `1800000 + Math.floor(prog * 1800000) + ((dayIndex * 71) % 400000)` (1.8M to 4.0M)
- `physicalSalesCash`: `180000 + ((dayIndex * 29) % 120000)` (180K to 300K)
- `salesCash`: `posSalesCash + physicalSalesCash`
- `expensesCash`: `150000 + ((dayIndex * 31) % 100000)` (150K to 250K)
- `withdrawalsCash`: `600000 + ((dayIndex * 59) % 300000)` (600K to 900K)
- `expectedClosingCash`: `openingCash + salesCash - expensesCash - withdrawalsCash`
- `actualClosingCash`: `expectedClosingCash`
- `difference`: `0`
- `reconciled`: `true`

#### 3. شرکت رایش (CostCenter Code: `RYSH`)
- `openingCash`: `5000000 + ((dayIndex * 67) % 500000)` (صندوق تنخواه ۵.۰ تا ۵.۵ میلیون)
- `posSalesCash`: Periodic consulting and milestone fee allocations: `(dayIndex % 5 === 0) ? (2500000 + ((dayIndex * 89) % 1500000)) : 0`
- `physicalSalesCash`: `0`
- `salesCash`: `posSalesCash + physicalSalesCash`
- `expensesCash`: `110000 + ((dayIndex * 17) % 90000)` (تنخواه هزینه‌های دفتری و اشتراک)
- `withdrawalsCash`: `(dayIndex % 10 === 0) ? 1500000 : 0`
- `expectedClosingCash`: `openingCash + salesCash - expensesCash - withdrawalsCash`
- `actualClosingCash`: `expectedClosingCash`
- `difference`: `0`
- `reconciled`: `true`

Total: 3 × 90 = **270 records**.

---

### 3.3. `Invoice` & `InvoiceItem`

#### Product Catalog Mapping
- **Buffet Products (`BUF`)**:
  - `BUF-WHEY-01`: پودر وی کاله ۱۸۰۰ گرم | buy: 1,850,000 | sell: 2,450,000 | margin: 24.5%
  - `BUF-SHK-02`: شیک پروتئینی انرژی پلاس | buy: 45,000 | sell: 95,000 | margin: 52.6%
  - `BUF-BAR-03`: پروتئین بار کارن ۴۵ گرم | buy: 38,000 | sell: 60,000 | margin: 36.7%
  - `BUF-CRE-04`: کراتین مونوهیدرات کارن | buy: 420,000 | sell: 590,000 | margin: 28.8%
  - `BUF-WTR-05`: آب‌معدنی کوچک دماوند | buy: 6,000 | sell: 12,000 | margin: 50.0%
- **Cosmetics Products (`COS`)**:
  - `COS-SUN-01`: ضدآفتاب ضدلک لافارر | buy: 320,000 | sell: 465,000 | margin: 31.2%
  - `COS-HYD-02`: واتر ژل هیدرو بوست نوتروژینا | buy: 410,000 | sell: 590,000 | margin: 30.5%
  - `COS-MIC-03`: میسلار واتر گارنیر صورتی | buy: 220,000 | sell: 330,000 | margin: 33.3%
  - `COS-VTC-04`: سرم ویتامین C بالانس | buy: 280,000 | sell: 410,000 | margin: 31.7%
  - `COS-MAS-05`: ریمل اسنس آی لاو اکستریم | buy: 165,000 | sell: 260,000 | margin: 36.5%
  - `COS-LIP-06`: رژلب مایع مات گلدن رز | buy: 140,000 | sell: 215,000 | margin: 34.9%

#### Invoicing Cadence
- **Buffet**: 1–2 invoices per day:
  - Daily Walk-in Invoice: 4–8 shakes (`BUF-SHK-02`), 3–6 protein bars (`BUF-BAR-03`), 6–12 waters (`BUF-WTR-05`).
  - Periodic Supplement Invoice (every 3–4 days): 1 whey container (`BUF-WHEY-01`) or 1 creatine (`BUF-CRE-04`).
- **Cosmetics**: 1–2 invoices per day:
  - Skincare Routine Invoice: 1 sunscreen (`COS-SUN-01`) + 1 hydrating gel (`COS-HYD-02`) + 1 micellar (`COS-MIC-03`).
  - Makeup Invoice: 1–2 mascara (`COS-MAS-05`) + 1–2 lipstick (`COS-LIP-06`).
- **Rayesh**: 3 milestone invoices across 90 days:
  - Day 30: فاز اول پیاده‌سازی و طراحی معماری (35,000,000 تومان)
  - Day 60: فاز دوم توسعه اندپوینت‌ها و ماژول مالی (45,000,000 تومان)
  - Day 88: فاز نهایی و دپلوی ابری سازمانی (40,000,000 تومان)

#### Invariant Enforcement
```javascript
let totalAmount = 0;
let totalCogs = 0;
const itemsData = items.map(item => {
  const lineTotal = item.quantity * item.unitPrice;
  const lineCogs = item.quantity * item.unitCost;
  totalAmount += lineTotal;
  totalCogs += lineCogs;
  return {
    productId: item.productId,
    title: item.title,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    unitCost: item.unitCost,
    total: lineTotal,
  };
});
const grossProfit = totalAmount - totalCogs;
```

---

### 3.4. `FoodEntry` & `NutritionLog`

#### 4 Daily Meals Rotation across 90 Days

For every single day `dayOffset`:

1. **صبحانه (Breakfast - 07:30)**:
   - *Variant A*: املت ۴ سفیده و ۱ تخم‌مرغ کامل با نان سنگک و خیار گوجه (cals: 480, prot: 32, carbs: 40, fat: 18)
   - *Variant B*: جو دو سر پرک با شیر کم‌چرب، کره بادام‌زمینی و دارچین (cals: 490, prot: 24, carbs: 58, fat: 16)
   - *Variant C*: پنیر کوتاژ کم‌چرب با گردو و نان پروتئینی سبوس‌دار (cals: 450, prot: 30, carbs: 38, fat: 18)
2. **شیک بوفه باشگاه / میان‌وعده (Snack - 11:30)**:
   - *Variant A*: شیک پروتئین وی کاله با موز و دانه چیا (بوفه باشگاه) (cals: 340, prot: 30, carbs: 35, fat: 4)
   - *Variant B*: پروتئین‌بار شکلاتی کارن با اسپرسو دبل شات (cals: 280, prot: 20, carbs: 26, fat: 8)
   - *Variant C*: شیک پروتئینی انرژی پلاس شیربادام و جو (بوفه باشگاه) (cals: 360, prot: 32, carbs: 38, fat: 6)
3. **ناهار (Lunch - 14:00)**:
   - *Variant A*: سینه مرغ گریل شده ۲۰۰ گرم + برنج کته با زعفران (cals: 650, prot: 55, carbs: 65, fat: 12)
   - *Variant B*: فیله گوساله بدون چربی + پلو عدس و ماست کم‌چرب (cals: 690, prot: 52, carbs: 70, fat: 14)
   - *Variant C*: بوقلمون تفت‌داده با کینوا و سبزیجات تازه (cals: 630, prot: 48, carbs: 60, fat: 12)
4. **شام (Dinner - 20:30)**:
   - *Variant A*: فیله ماهی قزل‌آلا با سبزیجات بخارپز و روغن زیتون (cals: 520, prot: 42, carbs: 25, fat: 16)
   - *Variant B*: خوراک عدسی پرپروتئین با فیله مرغ و لیموترش (cals: 510, prot: 44, carbs: 48, fat: 10)
   - *Variant C*: تن‌ماهی شویدی بدون روغن با سالاد کلم و لوبیا قرمز (cals: 490, prot: 42, carbs: 32, fat: 12)

#### Sum Invariant
```javascript
const dailyMeals = getMealsForDay(dayOffset);
const totalCalories = dailyMeals.reduce((s, m) => s + m.calories, 0); // ~1970 - 2270
const totalProtein = dailyMeals.reduce((s, m) => s + m.protein, 0);   // ~144 - 159g
const totalCarbs = dailyMeals.reduce((s, m) => s + m.carbs, 0);       // ~158 - 198g
const totalFat = dailyMeals.reduce((s, m) => s + m.fat, 0);           // ~48 - 56g
```
The parent `NutritionLog` is created/updated with these exact calculated totals.

---

### 3.5. `HabitLog` (540 Logs across 90 Days)

For each of the 6 habits across all 90 days:

1. **تمرین در باشگاه ورزشی** (Target: 1 جلسه):
   - Completed on workout days (~4 days/week): `completed = (dayIndex % 7 in [1, 3, 4, 6])`
   - Value: `completed ? 1 : 0`
   - Overall compliance: **73%** (51/90)
2. **مصرف آب ۳ لیتر در طول روز** (Target: 12 لیوان):
   - Completed: `dayOffset % 23 !== 0`
   - Value: `12 + (dayOffset % 5) - 2` (10 to 14 cups)
   - Overall compliance: **96%** (86/90)
3. **تطبیق دخل شبانه بوفه و فروشگاه** (Target: 1 مرتبه):
   - Completed: `true` (every single night without fail)
   - Value: `1`
   - Overall compliance: **100%** (90/90)
4. **بلوک کار عمیق (Deep Work) حداقل ۳ ساعت** (Target: 180 دقیقه):
   - Completed: `dayIndex % 7 !== 0 && dayOffset % 17 !== 0`
   - Value: `completed ? (165 + (dayIndex % 4) * 15) : 60` (165 to 210 mins)
   - Overall compliance: **86%** (77/90)
5. **مطالعه و یادگیری مستمر** (Target: 25 صفحه):
   - Completed: `dayOffset % 8 !== 3`
   - Value: `completed ? (20 + (dayIndex % 5) * 4) : 10` (20 to 36 pages)
   - Overall compliance: **88%** (79/90)
6. **تمرین صداسازی و تنفس دیافراگمی** (Target: 15 دقیقه):
   - Completed: `dayOffset % 6 !== 2`
   - Value: `completed ? 15 : 0`
   - Overall compliance: **83%** (75/90)

#### Post-Seeding Recalculation
After creating all 540 logs, calculate and update each Habit's `streak` and `completionRate`:
```javascript
for (const h of createdHabits) {
  const logs = await prisma.habitLog.findMany({
    where: { habitId: h.id },
    orderBy: { date: "desc" },
  });
  const completedCount = logs.filter(l => l.completed).length;
  const completionRate = Math.round((completedCount / logs.length) * 100);
  
  // Calculate current streak backward from day 0 (today)
  let streak = 0;
  for (const l of logs) {
    if (l.completed) streak++;
    else break;
  }
  
  await prisma.habit.update({
    where: { id: h.id },
    data: { streak, completionRate },
  });
}
```

---

### 3.6. `CalendarBlock` (Focus, Shallow, Admin & CEO Blocks)

#### Workday Schedule (Saturday to Thursday)
1. **09:00 - 12:00 (180 min)**:
   - `title`: "بلوک کار عمیق: معماری و توسعه سیستم‌های نرم‌افزاری شرکت رایش"
   - `type`: "Deep Work"
   - `dayType`: "روز طلایی"
   - `areaId`: createdAreas["شرکت رایش"].id
   - `projectId`: proj3.id
   - `plannedDuration`: 180, `actualDuration`: 175 + (dayIndex % 3) * 5
   - `energyRequirement`: "high"
   - `status`: "completed"
2. **12:15 - 13:15 (60 min)**:
   - `title`: "بافر روزانه، بررسی ایمیل‌ها، هماهنگی‌ها و امور کم‌عمق"
   - `type`: "Shallow Work"
   - `dayType`: "روز عادی"
   - `areaId`: createdAreas["عملیات شخصی"].id
   - `plannedDuration`: 60, `actualDuration`: 55
   - `energyRequirement`: "medium"
   - `status`: "completed"
3. **16:00 - 18:00 (120 min)**:
   - `title`: (dayIndex % 2 === 0) ? "مدیریت بوفه باشگاه، شارژ شیک‌ها و بررسی موجودی مکمل‌ها" : "سرکشی به فروشگاه آرایشی، چیدمان استند نوتروژینا و رسیدگی فاکتورها"
   - `type`: "Admin"
   - `dayType`: "روز عادی"
   - `areaId`: (dayIndex % 2 === 0) ? createdAreas["بوفه باشگاه"].id : createdAreas["لوازم آرایشی"].id
   - `projectId`: (dayIndex % 2 === 0) ? proj1.id : proj2.id
   - `plannedDuration`: 120, `actualDuration`: 115
   - `energyRequirement`: "medium"
   - `status`: "completed"
4. **18:30 - 20:00 (90 min - on workout days)**:
   - `title`: "جلسه تمرین قدرتی بدنسازی در باشگاه + مصرف شیک بوفه"
   - `type`: "Health"
   - `dayType`: "روز عادی"
   - `areaId`: createdAreas["سلامت و ورزش"].id
   - `plannedDuration`: 90, `actualDuration`: 85
   - `energyRequirement`: "high"
   - `status`: "completed"

#### Friday / CEO Day Schedule
1. **10:00 - 12:30 (150 min)**:
   - `title`: "بازبینی هفتگی استراتژیک، ارزیابی دخل بوفه و آرایشی، حسابداری و تارگت‌های ۹۰ روزه (CEO Day)"
   - `type`: "Deep Work"
   - `dayType`: "جمعه / CEO Day"
   - `areaId`: createdAreas["مالی و سرمایه"].id
   - `plannedDuration`: 150, `actualDuration`: 150
   - `energyRequirement`: "high"
   - `status`: "completed"
2. **15:00 - 18:00 (180 min)**:
   - `title`: "وقت باکیفیت بدون صفحه نمایش با خانواده و استراحت ترمیمی"
   - `type`: "Rest"
   - `dayType`: "جمعه / CEO Day"
   - `areaId`: createdAreas["روابط و خانواده"].id
   - `plannedDuration`: 180, `actualDuration`: 180
   - `energyRequirement`: "low"
   - `status`: "completed"

Total: ~**310 blocks** across the 90 days.

---

## 4. Complete, Copy-Paste Ready Code for `scripts/seed.mjs`

Below is the complete drop-in replacement for Section 8 ("GENERATING 90-DAY HISTORICAL SIMULATION") and its post-processing in `scripts/seed.mjs`.

```javascript
  // =========================================================================
  // 8. GENERATING 90-DAY HISTORICAL SIMULATION (Continuous 3 Months of Data!)
  // =========================================================================
  console.log("⏳ Generating continuous 90-day historical data simulation...");

  // Seed sample customers if not already present
  const customersData = [
    { name: "علی کاظمی (ورزشکار بوفه)", phone: "09121112233", costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { name: "محمد رضایی (ورزشکار بوفه)", phone: "09122223344", costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { name: "مهدی صادقی (ورزشکار بوفه)", phone: "09123334455", costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { name: "سارا احمدی (مشتری حضوری آرایشی)", phone: "09124445566", costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { name: "مریم جلالی (مشتری آنلاین آرایشی)", phone: "09125556677", costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { name: "شرکت مهندسی پارس نوین (کارفرما رایش)", phone: "02188889999", costCenterId: createdCostCenters["شرکت رایش"].id },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    createdCustomers.push(await prisma.customer.create({ data: c }));
  }

  // Workout Split Definitions (Rotating 4-Day Hypertrophy Program)
  const workoutSplits = [
    {
      title: "سینه و جلو بازو",
      exercises: [
        { name: "پرس سینه هالتر", sets: 4, reps: 10, baseWeight: 60, rpe: 8, restSeconds: 90 },
        { name: "بالاسینه دمبل", sets: 4, reps: 10, baseWeight: 22, rpe: 8, restSeconds: 75 },
        { name: "قفسه سینه دمبل فلای", sets: 3, reps: 12, baseWeight: 14, rpe: 8.5, restSeconds: 60 },
        { name: "جلو بازو هالتر EZ", sets: 3, reps: 10, baseWeight: 25, rpe: 8, restSeconds: 60 },
        { name: "جلو بازو دمبل چکشی", sets: 3, reps: 12, baseWeight: 14, rpe: 8.5, restSeconds: 60 },
      ],
    },
    {
      title: "زیربغل و پشت بازو",
      exercises: [
        { name: "ددلیفت رومانیایی", sets: 4, reps: 8, baseWeight: 80, rpe: 8.5, restSeconds: 120 },
        { name: "زیربغل سیم‌کش مچ برعکس", sets: 4, reps: 10, baseWeight: 55, rpe: 8, restSeconds: 75 },
        { name: "زیربغل قایقی سیم‌کش", sets: 3, reps: 10, baseWeight: 50, rpe: 8, restSeconds: 75 },
        { name: "پشت بازو طناب سیم‌کش", sets: 3, reps: 12, baseWeight: 22, rpe: 8.5, restSeconds: 60 },
        { name: "دیپ پارالل با وزنه", sets: 3, reps: 10, baseWeight: 10, rpe: 8, restSeconds: 75 },
      ],
    },
    {
      title: "پا و شکم",
      exercises: [
        { name: "اسکات پا هالتر", sets: 4, reps: 8, baseWeight: 75, rpe: 8.5, restSeconds: 120 },
        { name: "پرس پا دستگاه", sets: 4, reps: 10, baseWeight: 130, rpe: 8, restSeconds: 90 },
        { name: "جلو پا دستگاه", sets: 3, reps: 12, baseWeight: 45, rpe: 8.5, restSeconds: 60 },
        { name: "پشت پا دستگاه خوابیده", sets: 3, reps: 12, baseWeight: 35, rpe: 8.5, restSeconds: 60 },
        { name: "کرانچ سیم‌کش زانو زده", sets: 3, reps: 15, baseWeight: 35, rpe: 8, restSeconds: 45 },
      ],
    },
    {
      title: "سرشانه و کول",
      exercises: [
        { name: "پرس سرشانه دمبل نشسته", sets: 4, reps: 8, baseWeight: 18, rpe: 8, restSeconds: 90 },
        { name: "نشر جانب دمبل کنترل‌شده", sets: 4, reps: 15, baseWeight: 9, rpe: 9, restSeconds: 60 },
        { name: "نشر خم دمبل بالاسینه", sets: 3, reps: 12, baseWeight: 10, rpe: 8.5, restSeconds: 60 },
        { name: "شراگز دمبل سنگین", sets: 4, reps: 12, baseWeight: 26, rpe: 8, restSeconds: 60 },
        { name: "فیس پول سیم‌کش با طناب", sets: 3, reps: 15, baseWeight: 25, rpe: 8, restSeconds: 60 },
      ],
    },
  ];

  // Meal Templates
  const breakfastTemplates = [
    { title: "املت ۴ سفیده و ۱ تخم‌مرغ کامل با نان سنگک و خیار گوجه", calories: 480, protein: 32, carbs: 40, fat: 18, time: "07:30" },
    { title: "جو دو سر پرک با شیر کم‌چرب، کره بادام‌زمینی و دارچین", calories: 490, protein: 24, carbs: 58, fat: 16, time: "07:30" },
    { title: "پنیر کوتاژ کم‌چرب با گردو و نان پروتئینی سبوس‌دار", calories: 450, protein: 30, carbs: 38, fat: 18, time: "07:30" },
  ];

  const snackTemplates = [
    { mealType: "شیک بوفه", title: "شیک پروتئین وی کاله با موز و دانه چیا (بوفه باشگاه)", calories: 340, protein: 30, carbs: 35, fat: 4, time: "11:30" },
    { mealType: "میان‌وعده", title: "پروتئین‌بار شکلاتی کارن با اسپرسو دبل شات", calories: 280, protein: 20, carbs: 26, fat: 8, time: "11:30" },
    { mealType: "شیک بوفه", title: "شیک پروتئینی انرژی پلاس شیربادام و جو (بوفه باشگاه)", calories: 360, protein: 32, carbs: 38, fat: 6, time: "11:30" },
  ];

  const lunchTemplates = [
    { title: "سینه مرغ گریل شده ۲۰۰ گرم + برنج کته با زعفران", calories: 650, protein: 55, carbs: 65, fat: 12, time: "14:00" },
    { title: "فیله گوساله بدون چربی + پلو عدس و ماست کم‌چرب", calories: 690, protein: 52, carbs: 70, fat: 14, time: "14:00" },
    { title: "بوقلمون تفت‌داده با کینوا و سبزیجات تازه", calories: 630, protein: 48, carbs: 60, fat: 12, time: "14:00" },
  ];

  const dinnerTemplates = [
    { title: "فیله ماهی قزل‌آلا با سبزیجات بخارپز و روغن زیتون", calories: 520, protein: 42, carbs: 25, fat: 16, time: "20:30" },
    { title: "خوراک عدسی پرپروتئین با فیله مرغ و لیموترش", calories: 510, protein: 44, carbs: 48, fat: 10, time: "20:30" },
    { title: "تن‌ماهی شویدی بدون روغن با سالاد کلم و لوبیا قرمز", calories: 490, protein: 42, carbs: 32, fat: 12, time: "20:30" },
  ];

  let workoutCount = 0;
  let invoiceCounter = 1;

  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const dayIndex = 90 - dayOffset; // 1 to 90
    const logDate = new Date();
    logDate.setDate(today.getDate() - dayOffset);
    logDate.setHours(12, 0, 0, 0);
    const dayProgressRatio = dayIndex / 90; // 0.011 to 1.0

    // -------------------------------------------------------------
    // A. 90-Day Cash Registers (Buffet, Cosmetics, Rayesh)
    // -------------------------------------------------------------
    // 1. Buffet Cash Register
    const bufOpening = 1200000 + ((dayIndex * 37) % 300000);
    const bufPos = 1200000 + Math.floor(dayProgressRatio * 800000) + ((dayIndex * 53) % 250000);
    const bufCash = 150000 + ((dayIndex * 19) % 150000);
    const bufSales = bufPos + bufCash;
    const bufExp = 120000 + ((dayIndex * 23) % 80000);
    const bufWithdraw = 350000 + ((dayIndex * 41) % 150000);
    const bufExpected = bufOpening + bufSales - bufExp - bufWithdraw;

    await prisma.shopCashRegister.create({
      data: {
        date: logDate,
        costCenterId: createdCostCenters["بوفه باشگاه"].id,
        openingCash: bufOpening,
        posSalesCash: bufPos,
        physicalSalesCash: bufCash,
        salesCash: bufSales,
        expensesCash: bufExp,
        withdrawalsCash: bufWithdraw,
        expectedClosingCash: bufExpected,
        actualClosingCash: bufExpected,
        difference: 0,
        reconciled: true,
        notes: `دخل روز ${dayIndex} بوفه باشگاه — فروش پوز: ${bufPos.toLocaleString()}، نقدی: ${bufCash.toLocaleString()} تومان`,
      },
    });

    // 2. Cosmetics Cash Register
    const cosOpening = 2500000 + ((dayIndex * 43) % 500000);
    const cosPos = 1800000 + Math.floor(dayProgressRatio * 1800000) + ((dayIndex * 71) % 400000);
    const cosCash = 180000 + ((dayIndex * 29) % 120000);
    const cosSales = cosPos + cosCash;
    const cosExp = 150000 + ((dayIndex * 31) % 100000);
    const cosWithdraw = 600000 + ((dayIndex * 59) % 300000);
    const cosExpected = cosOpening + cosSales - cosExp - cosWithdraw;

    await prisma.shopCashRegister.create({
      data: {
        date: logDate,
        costCenterId: createdCostCenters["لوازم آرایشی"].id,
        openingCash: cosOpening,
        posSalesCash: cosPos,
        physicalSalesCash: cosCash,
        salesCash: cosSales,
        expensesCash: cosExp,
        withdrawalsCash: cosWithdraw,
        expectedClosingCash: cosExpected,
        actualClosingCash: cosExpected,
        difference: 0,
        reconciled: true,
        notes: `دخل روز ${dayIndex} فروشگاه آرایشی — فروش پوز: ${cosPos.toLocaleString()}، نقدی: ${cosCash.toLocaleString()} تومان`,
      },
    });

    // 3. Rayesh Operations / Petty Cash Register
    const ryshOpening = 5000000 + ((dayIndex * 67) % 500000);
    const ryshPos = (dayIndex % 5 === 0) ? (2500000 + ((dayIndex * 89) % 1500000)) : 0;
    const ryshCash = 0;
    const ryshSales = ryshPos + ryshCash;
    const ryshExp = 110000 + ((dayIndex * 17) % 90000);
    const ryshWithdraw = (dayIndex % 10 === 0) ? 1500000 : 0;
    const ryshExpected = ryshOpening + ryshSales - ryshExp - ryshWithdraw;

    await prisma.shopCashRegister.create({
      data: {
        date: logDate,
        costCenterId: createdCostCenters["شرکت رایش"].id,
        openingCash: ryshOpening,
        posSalesCash: ryshPos,
        physicalSalesCash: ryshCash,
        salesCash: ryshSales,
        expensesCash: ryshExp,
        withdrawalsCash: ryshWithdraw,
        expectedClosingCash: ryshExpected,
        actualClosingCash: ryshExpected,
        difference: 0,
        reconciled: true,
        notes: `صندوق تنخواه روز ${dayIndex} شرکت رایش — هزینه‌های جاری دفتری و اشتراک ابری`,
      },
    });

    // -------------------------------------------------------------
    // B. Invoices & Invoice Items (Buffet & Cosmetics Daily Sales)
    // -------------------------------------------------------------
    // Daily Buffet Invoices
    const pShk = createdProducts.find((p) => p.sku === "BUF-SHK-02")!;
    const pBar = createdProducts.find((p) => p.sku === "BUF-BAR-03")!;
    const pWtr = createdProducts.find((p) => p.sku === "BUF-WTR-05")!;
    const pWhey = createdProducts.find((p) => p.sku === "BUF-WHEY-01")!;

    const shkQty = 6 + (dayIndex % 6);
    const barQty = 4 + (dayIndex % 4);
    const wtrQty = 8 + (dayIndex % 8);

    const bufInvItems = [
      { product: pShk, qty: shkQty },
      { product: pBar, qty: barQty },
      { product: pWtr, qty: wtrQty },
    ];

    let bufInvTotal = 0;
    let bufInvCogs = 0;
    const bufItemsData = bufInvItems.map((item) => {
      const lineTotal = item.qty * item.product.sellPrice;
      const lineCogs = item.qty * item.product.buyPrice;
      bufInvTotal += lineTotal;
      bufInvCogs += lineCogs;
      return {
        productId: item.product.id,
        title: item.product.name,
        quantity: item.qty,
        unitPrice: item.product.sellPrice,
        unitCost: item.product.buyPrice,
        total: lineTotal,
      };
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-BUF-${String(invoiceCounter++).padStart(5, "0")}`,
        customerId: createdCustomers[dayIndex % 3].id,
        customerName: createdCustomers[dayIndex % 3].name,
        costCenterId: createdCostCenters["بوفه باشگاه"].id,
        date: logDate,
        totalAmount: bufInvTotal,
        discount: 0,
        cogs: bufInvCogs,
        grossProfit: bufInvTotal - bufInvCogs,
        amountPaid: bufInvTotal,
        amountRemaining: 0,
        status: "Paid",
        notes: `فروش روزانه شیک و بارهای پروتئینی ورزشکاران باشگاه`,
        items: { create: bufItemsData },
      },
    });

    // Alternate Day Supplement Invoice (Whey / Creatine)
    if (dayIndex % 3 === 0) {
      const wheyTotal = pWhey.sellPrice;
      const wheyCogs = pWhey.buyPrice;
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-BUF-${String(invoiceCounter++).padStart(5, "0")}`,
          customerId: createdCustomers[(dayIndex + 1) % 3].id,
          customerName: createdCustomers[(dayIndex + 1) % 3].name,
          costCenterId: createdCostCenters["بوفه باشگاه"].id,
          date: logDate,
          totalAmount: wheyTotal,
          discount: 0,
          cogs: wheyCogs,
          grossProfit: wheyTotal - wheyCogs,
          amountPaid: wheyTotal,
          amountRemaining: 0,
          status: "Paid",
          notes: `فروش مکمل قوطی وی کاله ۱۸۰۰ گرم`,
          items: {
            create: [
              {
                productId: pWhey.id,
                title: pWhey.name,
                quantity: 1,
                unitPrice: pWhey.sellPrice,
                unitCost: pWhey.buyPrice,
                total: wheyTotal,
              },
            ],
          },
        },
      });
    }

    // Daily Cosmetics Invoice
    const pSun = createdProducts.find((p) => p.sku === "COS-SUN-01")!;
    const pHyd = createdProducts.find((p) => p.sku === "COS-HYD-02")!;
    const pMic = createdProducts.find((p) => p.sku === "COS-MIC-03")!;
    const pMas = createdProducts.find((p) => p.sku === "COS-MAS-05")!;
    const pLip = createdProducts.find((p) => p.sku === "COS-LIP-06")!;

    const cosInvItems = [
      { product: pSun, qty: 2 + (dayIndex % 3) },
      { product: pHyd, qty: 1 + (dayIndex % 2) },
      { product: pMic, qty: 1 + (dayIndex % 2) },
      { product: pMas, qty: 2 + (dayIndex % 4) },
      { product: pLip, qty: 2 + (dayIndex % 3) },
    ];

    let cosInvTotal = 0;
    let cosInvCogs = 0;
    const cosItemsData = cosInvItems.map((item) => {
      const lineTotal = item.qty * item.product.sellPrice;
      const lineCogs = item.qty * item.product.buyPrice;
      cosInvTotal += lineTotal;
      cosInvCogs += lineCogs;
      return {
        productId: item.product.id,
        title: item.product.name,
        quantity: item.qty,
        unitPrice: item.product.sellPrice,
        unitCost: item.product.buyPrice,
        total: lineTotal,
      };
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-COS-${String(invoiceCounter++).padStart(5, "0")}`,
        customerId: createdCustomers[3 + (dayIndex % 2)].id,
        customerName: createdCustomers[3 + (dayIndex % 2)].name,
        costCenterId: createdCostCenters["لوازم آرایشی"].id,
        date: logDate,
        totalAmount: cosInvTotal,
        discount: 0,
        cogs: cosInvCogs,
        grossProfit: cosInvTotal - cosInvCogs,
        amountPaid: cosInvTotal,
        amountRemaining: 0,
        status: "Paid",
        notes: `فروش پکیج روتین پوست و آرایش صورت`,
        items: { create: cosItemsData },
      },
    });

    // Rayesh Milestone Software Invoices (at Day 30, Day 60, Day 88)
    if (dayIndex === 30 || dayIndex === 60 || dayIndex === 88) {
      const milestoneAmount = dayIndex === 30 ? 35000000 : dayIndex === 60 ? 45000000 : 40000000;
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-RYSH-${dayIndex === 30 ? "PHASE1" : dayIndex === 60 ? "PHASE2" : "FINAL"}`,
          customerId: createdCustomers[5].id,
          customerName: createdCustomers[5].name,
          costCenterId: createdCostCenters["شرکت رایش"].id,
          date: logDate,
          totalAmount: milestoneAmount,
          discount: 0,
          cogs: 0,
          grossProfit: milestoneAmount,
          amountPaid: milestoneAmount,
          amountRemaining: 0,
          status: "Paid",
          notes: `صورت‌حساب تحویل فاز اسپرینت پلتفرم سازمانی رایش`,
          items: {
            create: [
              {
                title: `تحویل فاز نرم‌افزاری پلتفرم سازمانی رایش - روز ${dayIndex}`,
                quantity: 1,
                unitPrice: milestoneAmount,
                unitCost: 0,
                total: milestoneAmount,
              },
            ],
          },
        },
      });
    }

    // -------------------------------------------------------------
    // C. 90-Day Workouts & Exercises (~51 sessions, Progressive Overload)
    // -------------------------------------------------------------
    const isWorkoutDay = [1, 3, 4, 6].includes(dayIndex % 7); // 4 days per week
    if (isWorkoutDay) {
      workoutCount++;
      const split = workoutSplits[workoutCount % workoutSplits.length];
      let workoutVolume = 0;

      const exerciseCreates = split.exercises.map((ex) => {
        const weight = Math.round(ex.baseWeight * (1 + 0.35 * dayProgressRatio) * 2) / 2;
        const rpe = Math.min(9.5, Math.round((ex.rpe + 0.8 * dayProgressRatio + ((dayIndex % 3) * 0.2)) * 10) / 10);
        workoutVolume += ex.sets * ex.reps * weight;

        return {
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight,
          rpe,
          restSeconds: ex.restSeconds,
          notes: `ست‌های پرفشار با فرم صحیح و استراحت ${ex.restSeconds} ثانیه`,
        };
      });

      await prisma.workout.create({
        data: {
          date: logDate,
          title: `جلسه ${workoutCount}: تمرین قدرتی ${split.title}`,
          durationMinutes: 60 + (dayIndex % 4) * 5,
          totalVolume: workoutVolume,
          notes: `انرژی بدنی عالی، پمپ عضلانی بالا، بلافاصله پس از تمرین مصرف شیک پروتئین بوفه باشگاه`,
          exercises: { create: exerciseCreates },
        },
      });
    }

    // -------------------------------------------------------------
    // D. 90-Day Sleep Logs (TST, TIB, Sleep Efficiency)
    // -------------------------------------------------------------
    const timeInBed = 440 + Math.floor(Math.random() * 30); // ~440 to 470 min
    const sleepEfficiency = Math.round((88 + Math.random() * 8) * 10) / 10; // 88% to 96%
    const totalSleep = Math.round((timeInBed * sleepEfficiency) / 100);
    const morningEnergy = Math.min(10, Math.floor(7 + Math.random() * 3));

    await prisma.sleepLog.create({
      data: {
        date: logDate,
        bedTime: "۲۳:۲۰",
        finalWakeTime: "۰۶:۴۵",
        outOfBedTime: "۰۷:۰۰",
        timeInBedMinutes: timeInBed,
        totalSleepTimeMinutes: totalSleep,
        sleepEfficiency,
        morningEnergy,
        perceivedQuality: Math.min(10, Math.floor(8 + Math.random() * 2)),
        caffeineMg: 150,
        screenUsageMinutes: dayOffset % 5 === 0 ? 45 : 15,
        exerciseDone: isWorkoutDay,
        notes: sleepEfficiency > 92 ? "خواب عمیق، ریکاوری کامل سیستم عصبی" : "خواب نرمال با بیداری کوتاه شبانه",
      },
    });

    // -------------------------------------------------------------
    // E. 90-Day Body Measurements (Fat loss from 84.5kg down to 78.8kg)
    // -------------------------------------------------------------
    const weightVal = Math.round((84.5 - dayProgressRatio * 5.7 + (Math.random() * 0.3 - 0.15)) * 10) / 10;
    const waistVal = Math.round((90 - dayProgressRatio * 6.5 + (Math.random() * 0.3 - 0.15)) * 10) / 10;
    const bodyFatVal = Math.round((20.0 - dayProgressRatio * 4.3) * 10) / 10;

    await prisma.bodyMeasurement.create({
      data: {
        date: logDate,
        weight: weightVal,
        waist: waistVal,
        chest: 105,
        arm: 38,
        bodyFat: bodyFatVal,
        bmi: Math.round((weightVal / 3.24) * 10) / 10,
        notes: `روز ${dayIndex}: پیشرفت عالی در چربی‌سوزی و حفظ تراکم عضلانی`,
      },
    });

    // -------------------------------------------------------------
    // F. 90-Day Nutrition Logs & 3-4 Daily Meals (360 FoodEntries!)
    // -------------------------------------------------------------
    const bTemplate = breakfastTemplates[dayIndex % breakfastTemplates.length];
    const sTemplate = snackTemplates[dayIndex % snackTemplates.length];
    const lTemplate = lunchTemplates[dayIndex % lunchTemplates.length];
    const dTemplate = dinnerTemplates[dayIndex % dinnerTemplates.length];

    const dayMeals = [
      { mealType: "صبحانه", title: bTemplate.title, calories: bTemplate.calories, protein: bTemplate.protein, carbs: bTemplate.carbs, fat: bTemplate.fat, time: bTemplate.time },
      { mealType: sTemplate.mealType, title: sTemplate.title, calories: sTemplate.calories, protein: sTemplate.protein, carbs: sTemplate.carbs, fat: sTemplate.fat, time: sTemplate.time },
      { mealType: "ناهار", title: lTemplate.title, calories: lTemplate.calories, protein: lTemplate.protein, carbs: lTemplate.carbs, fat: lTemplate.fat, time: lTemplate.time },
      { mealType: "شام", title: dTemplate.title, calories: dTemplate.calories, protein: dTemplate.protein, carbs: dTemplate.carbs, fat: dTemplate.fat, time: dTemplate.time },
    ];

    const dailyCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
    const dailyProtein = dayMeals.reduce((s, m) => s + m.protein, 0);
    const dailyCarbs = dayMeals.reduce((s, m) => s + m.carbs, 0);
    const dailyFat = dayMeals.reduce((s, m) => s + m.fat, 0);
    const dailyWater = 2700 + Math.floor(Math.random() * 500);

    const nutLog = await prisma.nutritionLog.create({
      data: {
        date: logDate,
        calories: dailyCalories,
        protein: dailyProtein,
        carbs: dailyCarbs,
        fat: dailyFat,
        fiber: 32,
        waterMl: dailyWater,
        targetCals: 2400,
        targetProt: 150,
        notes: `تغذیه بالانس روز ${dayIndex} منطبق با کالری و ماکروهای ورزشی`,
      },
    });

    await prisma.foodEntry.createMany({
      data: dayMeals.map((m) => ({
        nutritionLogId: nutLog.id,
        mealType: m.mealType,
        title: m.title,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        time: m.time,
      })),
    });

    // -------------------------------------------------------------
    // G. 90-Day Daily Reviews & Energy Audits
    // -------------------------------------------------------------
    await prisma.dailyReview.create({
      data: {
        date: logDate,
        big3Completed: 3,
        whatWentWell: `فروش عالی بوفه و پیشبرد پروژه رایش در روز ${dayIndex}`,
        whatFailed: `کمی خستگی که با بافر استراحت مدیریت شد`,
        bottleneck: `مدیریت زمان در ساعات عصر بین بوفه و فروشگاه`,
        lessonsLearned: `ثبات در عادات روزانه کلید پیشرفت است`,
        tomorrowChanges: `شروع کار عمیق بلافاصله پس از اتمام روتین صبحگاه`,
        energyPhysical: Math.floor(7 + Math.random() * 3),
        energyEmotional: Math.floor(8 + Math.random() * 2),
        energyMental: Math.floor(8 + Math.random() * 2),
        energySpiritual: Math.floor(8 + Math.random() * 2),
      },
    });

    // -------------------------------------------------------------
    // H. Complete 540 Habit Logs (6 Habits * 90 Days)
    // -------------------------------------------------------------
    for (let hIdx = 0; hIdx < createdHabits.length; hIdx++) {
      const h = createdHabits[hIdx];
      let completed = true;
      let value = 1;

      if (hIdx === 0) {
        // Workout Habit (Matches actual workout days)
        completed = isWorkoutDay;
        value = completed ? 1 : 0;
      } else if (hIdx === 1) {
        // Water Habit (3L)
        completed = dayOffset % 23 !== 0;
        value = 12 + (dayIndex % 4);
      } else if (hIdx === 2) {
        // Cash Register Balance (100% compliance)
        completed = true;
        value = 1;
      } else if (hIdx === 3) {
        // Deep Work Habit (Workdays, 180 min)
        completed = dayIndex % 7 !== 0 && dayOffset % 17 !== 0;
        value = completed ? 180 : 60;
      } else if (hIdx === 4) {
        // Reading Habit (25 pages)
        completed = dayOffset % 8 !== 3;
        value = completed ? 25 + (dayIndex % 6) : 10;
      } else if (hIdx === 5) {
        // Voice practice Habit (15 min)
        completed = dayOffset % 6 !== 2;
        value = completed ? 15 : 0;
      }

      await prisma.habitLog.create({
        data: {
          habitId: h.id,
          date: logDate,
          completed,
          value,
          notes: completed ? "انجام کامل طبق استاندارد" : "فرصت تکمیل فراهم نشد",
        },
      });
    }

    // -------------------------------------------------------------
    // I. Daily Calendar Blocks (Deep Work, Shallow Work, Ops & Gym)
    // -------------------------------------------------------------
    const isFriday = dayIndex % 7 === 0;

    if (!isFriday) {
      // 1. Morning Deep Work (Rayesh)
      const dwStart = new Date(logDate);
      dwStart.setHours(9, 0, 0, 0);
      const dwEnd = new Date(logDate);
      dwEnd.setHours(12, 0, 0, 0);

      await prisma.calendarBlock.create({
        data: {
          title: "بلوک کار عمیق: معماری و توسعه سیستم‌های نرم‌افزاری شرکت رایش",
          type: "Deep Work",
          dayType: "روز طلایی",
          areaId: createdAreas["شرکت رایش"].id,
          projectId: proj3.id,
          start: dwStart,
          end: dwEnd,
          plannedDuration: 180,
          actualDuration: 175 + (dayIndex % 3) * 5,
          energyRequirement: "high",
          status: "completed",
        },
      });

      // 2. Midday Buffer / Shallow Work
      const swStart = new Date(logDate);
      swStart.setHours(12, 15, 0, 0);
      const swEnd = new Date(logDate);
      swEnd.setHours(13, 15, 0, 0);

      await prisma.calendarBlock.create({
        data: {
          title: "بافر روزانه، بررسی ایمیل‌ها، هماهنگی‌ها و امور کم‌عمق",
          type: "Shallow Work",
          dayType: "روز عادی",
          areaId: createdAreas["عملیات شخصی"].id,
          start: swStart,
          end: swEnd,
          plannedDuration: 60,
          actualDuration: 55,
          energyRequirement: "medium",
          status: "completed",
        },
      });

      // 3. Afternoon Operations (Buffet / Cosmetics)
      const opStart = new Date(logDate);
      opStart.setHours(16, 0, 0, 0);
      const opEnd = new Date(logDate);
      opEnd.setHours(18, 0, 0, 0);

      const isBuffetOp = dayIndex % 2 === 0;
      await prisma.calendarBlock.create({
        data: {
          title: isBuffetOp ? "مدیریت بوفه باشگاه، شارژ شیک‌ها و بررسی موجودی مکمل‌ها" : "سرکشی به فروشگاه آرایشی، چیدمان استند و رسیدگی فاکتورها",
          type: "Admin",
          dayType: "روز عادی",
          areaId: isBuffetOp ? createdAreas["بوفه باشگاه"].id : createdAreas["لوازم آرایشی"].id,
          projectId: isBuffetOp ? proj1.id : proj2.id,
          start: opStart,
          end: opEnd,
          plannedDuration: 120,
          actualDuration: 115,
          energyRequirement: "medium",
          status: "completed",
        },
      });

      // 4. Evening Workout (on workout days)
      if (isWorkoutDay) {
        const gymStart = new Date(logDate);
        gymStart.setHours(18, 30, 0, 0);
        const gymEnd = new Date(logDate);
        gymEnd.setHours(20, 0, 0, 0);

        await prisma.calendarBlock.create({
          data: {
            title: "جلسه تمرین قدرتی بدنسازی در باشگاه + مصرف شیک بوفه",
            type: "Health",
            dayType: "روز عادی",
            areaId: createdAreas["سلامت و ورزش"].id,
            start: gymStart,
            end: gymEnd,
            plannedDuration: 90,
            actualDuration: 85,
            energyRequirement: "high",
            status: "completed",
          },
        });
      }
    } else {
      // Friday CEO Day Blocks
      const ceoStart = new Date(logDate);
      ceoStart.setHours(10, 0, 0, 0);
      const ceoEnd = new Date(logDate);
      ceoEnd.setHours(12, 30, 0, 0);

      await prisma.calendarBlock.create({
        data: {
          title: "بازبینی هفتگی استراتژیک، ارزیابی دخل بوفه و آرایشی، حسابداری و تارگت‌های ۹۰ روزه (CEO Day)",
          type: "Deep Work",
          dayType: "جمعه / CEO Day",
          areaId: createdAreas["مالی و سرمایه"].id,
          start: ceoStart,
          end: ceoEnd,
          plannedDuration: 150,
          actualDuration: 150,
          energyRequirement: "high",
          status: "completed",
        },
      });

      const restStart = new Date(logDate);
      restStart.setHours(15, 0, 0, 0);
      const restEnd = new Date(logDate);
      restEnd.setHours(18, 0, 0, 0);

      await prisma.calendarBlock.create({
        data: {
          title: "وقت باکیفیت بدون صفحه نمایش با خانواده و استراحت ترمیمی",
          type: "Rest",
          dayType: "جمعه / CEO Day",
          areaId: createdAreas["روابط و خانواده"].id,
          start: restStart,
          end: restEnd,
          plannedDuration: 180,
          actualDuration: 180,
          energyRequirement: "low",
          status: "completed",
        },
      });
    }
  }

  // -------------------------------------------------------------
  // Post-Seeding: Recalculate Habit Streaks and Completion Rates
  // -------------------------------------------------------------
  console.log("🔄 Recalculating habit streaks and compliance rates from 90-day logs...");
  for (const h of createdHabits) {
    const logs = await prisma.habitLog.findMany({
      where: { habitId: h.id },
      orderBy: { date: "desc" },
    });
    const completedCount = logs.filter((l) => l.completed).length;
    const completionRate = Math.round((completedCount / logs.length) * 100);

    let streak = 0;
    for (const l of logs) {
      if (l.completed) streak++;
      else break;
    }

    await prisma.habit.update({
      where: { id: h.id },
      data: { streak, completionRate },
    });
  }
```

---

## 5. Updates Required for `scripts/simulate-90-days-lifecycle.mjs`

In `scripts/simulate-90-days-lifecycle.mjs`, the cash register section must be updated to support the compound unique constraint `@@unique([date, costCenterId])` and iterate across all 3 active cost centers (`buffetCC`, `cosmeticsCC`, `rayeshCC`):

```javascript
    // -------------------------------------------------------------
    // E. بستن و تطبیق دخل روزانه به تفکیک ۳ مرکز هزینه (قانون: اختلاف = ۰)
    // -------------------------------------------------------------
    const costCenterRegisters = [
      {
        cc: buffetCC,
        opening: 1200000 + ((day * 37) % 300000),
        pos: 1200000 + Math.floor(progressRatio * 800000) + ((day * 53) % 250000),
        cash: 150000 + ((day * 19) % 150000),
        exp: 120000 + ((day * 23) % 80000),
        withdraw: 350000 + ((day * 41) % 150000),
        notes: `تطبیق دخل روز ${day} بوفه باشگاه`,
      },
      {
        cc: cosmeticsCC,
        opening: 2500000 + ((day * 43) % 500000),
        pos: 1800000 + Math.floor(progressRatio * 1800000) + ((day * 71) % 400000),
        cash: 180000 + ((day * 29) % 120000),
        exp: 150000 + ((day * 31) % 100000),
        withdraw: 600000 + ((day * 59) % 300000),
        notes: `تطبیق دخل روز ${day} فروشگاه لوازم آرایشی`,
      },
      {
        cc: rayeshCC,
        opening: 5000000 + ((day * 67) % 500000),
        pos: (day % 5 === 0) ? (2500000 + ((day * 89) % 1500000)) : 0,
        cash: 0,
        exp: 110000 + ((day * 17) % 90000),
        withdraw: (day % 10 === 0) ? 1500000 : 0,
        notes: `تطبیق تنخواه روز ${day} شرکت رایش`,
      },
    ];

    for (const reg of costCenterRegisters) {
      if (!reg.cc) continue;
      const sales = reg.pos + reg.cash;
      const expected = reg.opening + sales - reg.exp - reg.withdraw;
      const actual = expected; // 100% balanced
      const diff = actual - expected;

      if (diff !== 0) {
        throw new Error(`باگ محاسباتی دخل ${reg.cc.name} در روز ${day}: مغایرت غیرصفر است (${diff})`);
      }

      totalSimulatedSales += sales;
      totalSimulatedExpenses += reg.exp;

      await prisma.shopCashRegister.upsert({
        where: {
          date_costCenterId: {
            date: currentDate,
            costCenterId: reg.cc.id,
          },
        },
        update: {
          openingCash: reg.opening,
          posSalesCash: reg.pos,
          physicalSalesCash: reg.cash,
          salesCash: sales,
          expensesCash: reg.exp,
          withdrawalsCash: reg.withdraw,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: 0,
          reconciled: true,
          notes: reg.notes,
        },
        create: {
          date: currentDate,
          costCenterId: reg.cc.id,
          openingCash: reg.opening,
          posSalesCash: reg.pos,
          physicalSalesCash: reg.cash,
          salesCash: sales,
          expensesCash: reg.exp,
          withdrawalsCash: reg.withdraw,
          expectedClosingCash: expected,
          actualClosingCash: actual,
          difference: 0,
          reconciled: true,
          notes: reg.notes,
        },
      });
    }
```

---

## 6. Verification and Acceptance Criteria for the Worker

After the Worker applies these modifications and runs `npm run prisma:seed`:

1. **Record Counts Verification**:
   - `Workout`: `COUNT(*) >= 45` (~51 records)
   - `WorkoutExercise`: `COUNT(*) >= 225` (~255 records)
   - `ShopCashRegister`: `COUNT(*) == 270` (exactly 90 days × 3 cost centers)
   - `Invoice`: `COUNT(*) >= 180` (~200+ records)
   - `InvoiceItem`: `COUNT(*) >= 360` (~400+ records)
   - `FoodEntry`: `COUNT(*) == 360` (exactly 4 meals × 90 days)
   - `NutritionLog`: `COUNT(*) == 90` (all 90 days populated)
   - `HabitLog`: `COUNT(*) == 540` (exactly 6 habits × 90 days)
   - `CalendarBlock`: `COUNT(*) >= 270` (~310 records)
2. **Mathematical Invariants Verification**:
   - `SELECT SUM(difference) FROM ShopCashRegister` must return `0`.
   - `SELECT COUNT(*) FROM Invoice WHERE grossProfit != totalAmount - cogs` must return `0`.
   - For every `NutritionLog`, `calories == sum(FoodEntry.calories)` and `protein == sum(FoodEntry.protein)`.
3. **TypeScript & CLI Verification**:
   - `node node_modules/typescript/bin/tsc --noEmit` exits with status `0`.
   - `npm run test` (`node scripts/test-core.mjs`) passes 100%.
   - `node scripts/simulate-90-days-lifecycle.mjs` exits with success status `0`.
