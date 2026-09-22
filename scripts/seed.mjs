import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Life OS 90-Day Simulation & Business Pivot Seeding...");

  // 1. Clean existing records safely
  const models = [
    prisma.auditLog,
    prisma.automationRule,
    prisma.sOP,
    prisma.decisionLog,
    prisma.note,
    prisma.book,
    prisma.universityExam,
    prisma.universityAssignment,
    prisma.universityCourse,
    prisma.learningSkill,
    prisma.shopCashRegister,
    prisma.liability,
    prisma.asset,
    prisma.sinkingFund,
    prisma.budgetLine,
    prisma.debtPayment,
    prisma.debt,
    prisma.payable,
    prisma.receivable,
    prisma.purchaseItem,
    prisma.purchase,
    prisma.invoiceItem,
    prisma.invoice,
    prisma.customer,
    prisma.supplier,
    prisma.inventoryMovement,
    prisma.product,
    prisma.transaction,
    prisma.financialCategory,
    prisma.financialAccount,
    prisma.costCenter,
    prisma.voicePractice,
    prisma.sleepLog,
    prisma.workoutExercise,
    prisma.workout,
    prisma.foodEntry,
    prisma.nutritionLog,
    prisma.bodyMeasurement,
    prisma.bottleneck,
    prisma.rootCauseAnalysis,
    prisma.weeklyReview,
    prisma.dailyReview,
    prisma.habitLog,
    prisma.habit,
    prisma.routineStep,
    prisma.routinePhase,
    prisma.routine,
    prisma.calendarBlock,
    prisma.task,
    prisma.milestone,
    prisma.project,
    prisma.keyResult,
    prisma.objective,
    prisma.cycle90Day,
    prisma.goalVision,
    prisma.area,
    prisma.user,
  ];

  for (const m of models) {
    try {
      await m.deleteMany();
    } catch (e) {}
  }

  // 2. User
  const user = await prisma.user.create({
    data: {
      name: "مدیر سیستم‌عامل زندگی",
      email: "director@lifeos.local",
      currency: "تومان",
      weightUnit: "kg",
      calorieUnit: "kcal",
      weekStartDay: "saturday",
      theme: "dark",
    },
  });

  // 3. Life Domains (Areas) - "لنت" completely removed and replaced!
  const areasData = [
    { name: "بوفه باشگاه", icon: "Coffee", color: "#f59e0b", purpose: "تغذیه ورزشی، فروش شیک و مکمل، مدیریت دخل و رضایت ورزشکاران", standard: "کیفیت بالای متریال، حاشیه سود ۳۵٪+، دخل بالانس روزانه", reviewFrequency: "روزانه", sortOrder: 1 },
    { name: "لوازم آرایشی", icon: "Sparkles", color: "#ec4899", purpose: "خرده‌فروشی و آنلاین محصولات پوستی و آرایشی اورجینال", standard: "اصالت کالا، عدم کسری موجودی پرفروش‌ها، مارجین سود ۴۰٪", reviewFrequency: "هفتگی", sortOrder: 2 },
    { name: "شرکت رایش", icon: "Laptop", color: "#6366f1", purpose: "پروژه‌های نرم‌افزاری، طراحی UI/UX و توسعه سیستم‌های ابری", standard: "تحویل اسپرینت‌ها سروقت، رضایت کارفرما، وصول مطالبات زیر ۳۰ روز", reviewFrequency: "هفتگی", sortOrder: 3 },
    { name: "سلامت و ورزش", icon: "Dumbbell", color: "#ef4444", purpose: "تمرینات قدرتی، تناسب اندام، رژیم پرپروتئین و خواب ترمیمی", standard: "۴ جلسه باشگاه در هفته، خواب ۷+ ساعت، راندمان خواب بالای ۹۰٪", reviewFrequency: "روزانه", sortOrder: 4 },
    { name: "دانشگاه", icon: "GraduationCap", color: "#3b82f6", purpose: "معدل بالای ۱۸، تسلط بر تخصص و تحویل پروژه‌های درسی", standard: "حضور مؤثر در کلاس‌ها، انجام تمرینات در بافر اختصاصی", reviewFrequency: "هفتگی", sortOrder: 5 },
    { name: "توسعه فردی", icon: "Compass", color: "#8b5cf6", purpose: "مطالعه کتب استراتژی، فن بیان و مهار ذهن و تمرکز", standard: "۳۰ دقیقه کتابخوانی روزانه، ۱۰ دقیقه صداسازی", reviewFrequency: "هفتگی", sortOrder: 6 },
    { name: "مالی و سرمایه", icon: "DollarSign", color: "#10b981", purpose: "انضباط جریان وجوه نقد، سرمایه‌گذاری و تسویه بدهی‌ها", standard: "تفکیک شخصی از بیزینس‌ها، پس‌انداز ۳۰٪ سود خالص", reviewFrequency: "هفتگی", sortOrder: 7 },
    { name: "روابط و خانواده", icon: "Users", color: "#f43f5e", purpose: "کیفیت ارتباط با خانواده و دوستان ارزشمند و حامی", standard: "وقت باکیفیت بدون صفحه نمایش، قدردانی منظم", reviewFrequency: "هفتگی", sortOrder: 8 },
    { name: "عملیات شخصی", icon: "CheckSquare", color: "#64748b", purpose: "لجستیک فردی، نظم اتاق و میز کار، اینباکس صفر", standard: "محیط کار کاملاً مرتب در پایان هر شب", reviewFrequency: "روزانه", sortOrder: 9 },
  ];

  const createdAreas = {};
  for (const a of areasData) {
    createdAreas[a.name] = await prisma.area.create({ data: a });
  }

  // 4. Cost Centers
  const costCentersData = [
    { name: "بوفه باشگاه", code: "BUF", description: "درآمد و هزینه‌های بوفه و مکمل‌های ورزشی باشگاه", color: "#f59e0b" },
    { name: "لوازم آرایشی", code: "COS", description: "فروشگاه محصولات پوستی، بهداشتی و آرایشی", color: "#ec4899" },
    { name: "شرکت رایش", code: "RYSH", description: "پروژه‌های فناوری، طراحی نرم‌افزار و قراردادهای سازمانی", color: "#6366f1" },
    { name: "شخصی", code: "PER", description: "مخارج زندگی، تفریح، پوشاک و خانواده", color: "#64748b" },
    { name: "سلامت", code: "HLT", description: "شهریه باشگاه، مکمل شخصی و رژیم غذایی", color: "#ef4444" },
    { name: "دانشگاه", code: "UNI", description: "شهریه و کتب درسی آکادمیک", color: "#3b82f6" },
  ];

  const createdCostCenters = {};
  for (const cc of costCentersData) {
    createdCostCenters[cc.name] = await prisma.costCenter.create({ data: cc });
  }

  // 5. Financial Accounts
  const accountsData = [
    { name: "کارتخوان و دخل بوفه باشگاه", type: "ShopRegister", balance: 14200000, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { name: "حساب فروشگاه لوازم آرایشی (پاسارگاد)", type: "Business", balance: 38500000, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { name: "صندوق نقد مغازه آرایشی", type: "Cash", balance: 5600000, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { name: "حساب شرکتی رایش (بانک ملت)", type: "Business", balance: 64000000, costCenterId: createdCostCenters["شرکت رایش"].id },
    { name: "مطالبات پروژه‌ای رایش (دریافتنی)", type: "Receivable", balance: 28000000, costCenterId: createdCostCenters["شرکت رایش"].id },
    { name: "کارت روزمره و بانک سامان شخصی", type: "Bank", balance: 19400000, costCenterId: createdCostCenters["شخصی"].id, isDefault: true },
  ];

  const createdAccounts = {};
  for (const acc of accountsData) {
    createdAccounts[acc.name] = await prisma.financialAccount.create({ data: acc });
  }

  // 6. Products (Buffet + Cosmetics)
  const productsData = [
    // بوفه باشگاه
    { sku: "BUF-WHEY-01", name: "پودر وی پروتئین ۱۰۰٪ کاله (قوطی ۱۸۰۰ گرم)", category: "مکمل بوفه", supplier: "پخش مکمل ایران", buyPrice: 1850000, sellPrice: 2450000, stock: 14, minimumStock: 5, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { sku: "BUF-SHK-02", name: "شیک پروتئینی انرژی پلاس (سرو بوفه با موز و جو)", category: "شیک بوفه", supplier: "تولید بوفه", buyPrice: 45000, sellPrice: 95000, stock: 85, minimumStock: 20, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { sku: "BUF-BAR-03", name: "پروتئین بار مغزدار شکلاتی کارن ۴۵ گرم", category: "بار پروتئینی", supplier: "داروپخش", buyPrice: 38000, sellPrice: 60000, stock: 48, minimumStock: 15, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { sku: "BUF-CRE-04", name: "کراتین مونوهیدرات ۳۰۰ گرم کارن", category: "مکمل بوفه", supplier: "داروپخش", buyPrice: 420000, sellPrice: 590000, stock: 9, minimumStock: 4, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { sku: "BUF-WTR-05", name: "آب‌معدنی کوچک دماوند ۰.۵ لیتری", category: "نوشیدنی", supplier: "پخش دماوند", buyPrice: 6000, sellPrice: 12000, stock: 120, minimumStock: 30, costCenterId: createdCostCenters["بوفه باشگاه"].id },

    // لوازم آرایشی و مراقبت پوست
    { sku: "COS-SUN-01", name: "کرم ضدآفتاب ضدلک لافارر SPF50 بژ طبیعی", category: "مراقبت پوست", supplier: "شرکت بازرگانی روژان", buyPrice: 320000, sellPrice: 465000, stock: 22, minimumStock: 8, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { sku: "COS-HYD-02", name: "واتر ژل آبرسان هیدرو بوست نوتروژینا ۵۰ میل", category: "آبرسان", supplier: "پخش پارس کیش", buyPrice: 410000, sellPrice: 590000, stock: 16, minimumStock: 6, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { sku: "COS-MIC-03", name: "میسلار واتر گارنیر صورتی ۴۰۰ میل", category: "پاک‌کننده", supplier: "پخش پارس کیش", buyPrice: 220000, sellPrice: 330000, stock: 19, minimumStock: 6, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { sku: "COS-VTC-04", name: "سرم ویتامین C روشن‌کننده بالانس ۳۰ میل", category: "سرم صورت", supplier: "شرکت بازرگانی روژان", buyPrice: 280000, sellPrice: 410000, stock: 11, minimumStock: 5, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { sku: "COS-MAS-05", name: "ریمل حجم‌دهنده اسنس آی لاو اکستریم مشکی", category: "آرایش چشم", supplier: "آرایشی ارم", buyPrice: 165000, sellPrice: 260000, stock: 35, minimumStock: 12, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { sku: "COS-LIP-06", name: "رژلب مایع مات ماندگار گلدن رز کد ۱۶", category: "آرایش لب", supplier: "آرایشی ارم", buyPrice: 140000, sellPrice: 215000, stock: 28, minimumStock: 10, costCenterId: createdCostCenters["لوازم آرایشی"].id },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    createdProducts.push(await prisma.product.create({ data: p }));
  }

  // 7. 90-Day Cycle (فاز ساخت و مقیاس)
  const today = new Date();
  const ninetyDaysAgo = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);

  const cycle = await prisma.cycle90Day.create({
    data: {
      title: "چرخه ۹۰ روزه: رشد درآمد بوفه و آرایشی، تسلط فنی رایش و تثبیت فرم بدنی",
      startDate: ninetyDaysAgo,
      endDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      theme: "ایجاد نقدینگی پایدار از بوفه باشگاه و فروشگاه آرایشی + تحویل قراردادهای رایش و نظم سلامتی",
      currentPhase: "رشد",
      status: "active",
    },
  });

  // Objectives and Key Results
  const objBuffet = await prisma.objective.create({
    data: {
      title: "رسیدن به فروش خالص ماهیانه ۶۰ میلیون تومان در بوفه باشگاه",
      description: "ارائه شیک‌های پروتئینی اختصاصی، افزایش فروش مکمل‌های بسته‌ای و اشتراک ماهانه ورزشکاران",
      cycleId: cycle.id,
      areaId: createdAreas["بوفه باشگاه"].id,
      priority: "high",
      status: "in_progress",
      confidence: 90,
      progress: 78,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objBuffet.id, metric: "تعداد شیک‌های فروخته شده در روز", baseline: 15, target: 45, currentValue: 38, unit: "شیک", progress: 77 },
      { objectiveId: objBuffet.id, metric: "درصد حاشیه سود بوفه", baseline: 25, target: 40, currentValue: 38.5, unit: "درصد", progress: 90 },
      { objectiveId: objBuffet.id, metric: "تعداد ورزشکاران با اشتراک تغذیه ماهانه", baseline: 0, target: 25, currentValue: 19, unit: "نفر", progress: 76 },
    ],
  });

  const objCosmetics = await prisma.objective.create({
    data: {
      title: "رسیدن به درآمد ماهانه ۱۰۰ میلیون تومان در فروشگاه لوازم آرایشی",
      description: "تمرکز بر روتین‌های پوستی پرفروش، جذب مشتریان حضوری و توسعه پیج فروش آنلاین",
      cycleId: cycle.id,
      areaId: createdAreas["لوازم آرایشی"].id,
      priority: "high",
      status: "in_progress",
      confidence: 85,
      progress: 72,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objCosmetics.id, metric: "تعداد فاکتورهای فروش روزانه", baseline: 8, target: 25, currentValue: 18, unit: "فاکتور", progress: 60 },
      { objectiveId: objCosmetics.id, metric: "میانگین مبلغ سبد خرید هر مشتری", baseline: 250000, target: 600000, currentValue: 520000, unit: "تومان", progress: 77 },
    ],
  });

  const objRayesh = await prisma.objective.create({
    data: {
      title: "تکمیل و تحویل ۳ پروژه کلیدی نرم‌افزاری در شرکت رایش",
      description: "تحویل فاز نهایی پلتفرم سازمانی، سیستم حسابداری اختصاصی و ریدیزاین سایت مشتری",
      cycleId: cycle.id,
      areaId: createdAreas["شرکت رایش"].id,
      priority: "high",
      status: "in_progress",
      confidence: 92,
      progress: 85,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objRayesh.id, metric: "مجموع مبالغ وصول‌شده قراردادها", baseline: 30000000, target: 120000000, currentValue: 95000000, unit: "تومان", progress: 72 },
      { objectiveId: objRayesh.id, metric: "ساعات کار عمیق (Deep Work) تیمی در هفته", baseline: 15, target: 30, currentValue: 28, unit: "ساعت", progress: 87 },
    ],
  });

  // Projects
  const proj1 = await prisma.project.create({
    data: {
      title: "طراحی منوی جدید شیک‌های پروتئینی و پکیج ماهانه بوفه باشگاه",
      areaId: createdAreas["بوفه باشگاه"].id,
      objectiveId: objBuffet.id,
      status: "active",
      priority: "high",
      progress: 80,
      budget: 8000000,
      actualCost: 5200000,
      health: "on_track",
      expectedOutput: "افزایش ۲۰ درصدی سفارشات شیک روزانه بوفه",
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      title: "کمپین فروش ویژه محصولات ضدلک و آبرسان فروشگاه آرایشی",
      areaId: createdAreas["لوازم آرایشی"].id,
      objectiveId: objCosmetics.id,
      status: "active",
      priority: "high",
      progress: 65,
      budget: 12000000,
      actualCost: 7800000,
      health: "on_track",
      expectedOutput: "فروش ۱۰۰ عدد ضدآفتاب لافارر و آبرسان نوتروژینا",
    },
  });

  const proj3 = await prisma.project.create({
    data: {
      title: "توسعه فاز پرداخت و اتوماسیون پلتفرم مشتری رایش",
      areaId: createdAreas["شرکت رایش"].id,
      objectiveId: objRayesh.id,
      status: "active",
      priority: "urgent",
      progress: 90,
      budget: 35000000,
      actualCost: 12000000,
      health: "on_track",
      expectedOutput: "تسویه صورت‌حساب ۲۸ میلیون تومانی نهایی کارفرما",
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "بررسی موجودی پودر وی و پروتئین‌بارهای بوفه و سفارش از شرکت کاله",
        areaId: createdAreas["بوفه باشگاه"].id,
        projectId: proj1.id,
        priority: "urgent",
        urgency: "high",
        eisenhowerQuadrant: "Q1",
        workType: "Admin",
        estimatedMinutes: 25,
        actualMinutes: 20,
        energyRequirement: "medium",
        status: "today",
        kanbanColumn: "Doing",
        isBigThree: true,
        dueDate: today,
      },
      {
        title: "بستن دخل روزانه بوفه باشگاه و شمارش مانده واقعی کارتخوان",
        areaId: createdAreas["بوفه باشگاه"].id,
        priority: "high",
        urgency: "high",
        eisenhowerQuadrant: "Q1",
        workType: "Admin",
        estimatedMinutes: 20,
        energyRequirement: "medium",
        status: "today",
        kanbanColumn: "Ready",
        isBigThree: true,
        dueDate: today,
      },
      {
        title: "کدنویسی و تست ماژول وب‌سرویس پرداخت پلتفرم رایش (Deep Work)",
        areaId: createdAreas["شرکت رایش"].id,
        projectId: proj3.id,
        priority: "urgent",
        urgency: "high",
        eisenhowerQuadrant: "Q1",
        workType: "Deep Work",
        estimatedMinutes: 120,
        energyRequirement: "high",
        status: "today",
        kanbanColumn: "Ready",
        isBigThree: true,
        dueDate: today,
      },
      {
        title: "چیدمان استند محصولات مراقبت پوست نوتروژینا و لافارر در فروشگاه آرایشی",
        areaId: createdAreas["لوازم آرایشی"].id,
        projectId: proj2.id,
        priority: "medium",
        urgency: "normal",
        eisenhowerQuadrant: "Q2",
        workType: "Shallow Work",
        estimatedMinutes: 40,
        energyRequirement: "low",
        status: "next",
        kanbanColumn: "Backlog",
      },
      {
        title: "تمرین قدرتی زیربغل و سرشانه در باشگاه + نوشیدن شیک پروتئینی بوفه",
        areaId: createdAreas["سلامت و ورزش"].id,
        priority: "high",
        urgency: "normal",
        eisenhowerQuadrant: "Q2",
        workType: "Health",
        estimatedMinutes: 70,
        energyRequirement: "high",
        status: "today",
        kanbanColumn: "Ready",
      },
      {
        title: "مطالعه فصل ۵ کتاب حسابداری مدیریت برای مدیران کسب‌وکار",
        areaId: createdAreas["توسعه فردی"].id,
        priority: "medium",
        urgency: "low",
        eisenhowerQuadrant: "Q2",
        workType: "Learning",
        estimatedMinutes: 35,
        energyRequirement: "medium",
        status: "upcoming",
        kanbanColumn: "Backlog",
      },
    ],
  });

  // Habits
  const habitItems = [
    { title: "تمرین در باشگاه ورزشی", areaId: createdAreas["سلامت و ورزش"].id, frequency: "daily", target: 1, unit: "جلسه", preferredTime: "عصر", streak: 28, completionRate: 92 },
    { title: "مصرف آب ۳ لیتر در طول روز", areaId: createdAreas["سلامت و ورزش"].id, frequency: "daily", target: 12, unit: "لیوان", preferredTime: "طول روز", streak: 35, completionRate: 98 },
    { title: "تطبیق دخل شبانه بوفه و فروشگاه", areaId: createdAreas["مالی و سرمایه"].id, frequency: "daily", target: 1, unit: "مرتبه", preferredTime: "شب", streak: 42, completionRate: 100 },
    { title: "بلوک کار عمیق (Deep Work) حداقل ۳ ساعت", areaId: createdAreas["شرکت رایش"].id, frequency: "daily", target: 180, unit: "دقیقه", preferredTime: "صبح", streak: 19, completionRate: 88 },
    { title: "مطالعه و یادگیری مستمر", areaId: createdAreas["توسعه فردی"].id, frequency: "daily", target: 25, unit: "صفحه", preferredTime: "شب", streak: 22, completionRate: 85 },
    { title: "تمرین صداسازی و تنفس دیافراگمی", areaId: createdAreas["توسعه فردی"].id, frequency: "daily", target: 15, unit: "دقیقه", preferredTime: "صبح", streak: 14, completionRate: 80 },
  ];

  const createdHabits = [];
  for (const h of habitItems) {
    createdHabits.push(await prisma.habit.create({ data: h }));
  }

  // Morning & Night Routine
  const morningRoutine = await prisma.routine.create({
    data: {
      title: "روتین صبحگاهی طلایی قهرمان",
      type: "morning",
      trigger: "ساعت ۰۶:۰۰ صبح",
      startCondition: "بیدار شدن بدون اسنوز",
      expectedDuration: 45,
      streak: 34,
      completionPercentage: 100,
    },
  });

  const p1 = await prisma.routinePhase.create({ data: { routineId: morningRoutine.id, title: "فاز ۱: فعال‌سازی زیستی", sortOrder: 1 } });
  await prisma.routineStep.createMany({
    data: [
      { phaseId: p1.id, title: "بیدار شدن بدون اسنوز + مرتب کردن تخت", durationMin: 3, sortOrder: 1, isCompleted: true },
      { phaseId: p1.id, title: "نوشیدن ۵۰۰ میلی‌لیتر آب خنک با نمک دریا و لیمو", durationMin: 2, sortOrder: 2, isCompleted: true },
      { phaseId: p1.id, title: "۱۰ دقیقه کشش و تابش نور خورشید به چشم", durationMin: 10, sortOrder: 3, isCompleted: true },
    ],
  });

  const p2 = await prisma.routinePhase.create({ data: { routineId: morningRoutine.id, title: "فاز ۲: تغذیه و صدای رسا", sortOrder: 2 } });
  await prisma.routineStep.createMany({
    data: [
      { phaseId: p2.id, title: "صبحانه پرپروتئین (۴ عدد تخم‌مرغ + جو دوسر)", durationMin: 15, sortOrder: 1, isCompleted: true },
      { phaseId: p2.id, title: "تمرین صداسازی و تنفس دیافراگمی", durationMin: 10, sortOrder: 2, isCompleted: true },
    ],
  });

  const p3 = await prisma.routinePhase.create({ data: { routineId: morningRoutine.id, title: "فاز ۳: راه‌اندازی ذهنی و Big 3", sortOrder: 3 } });
  await prisma.routineStep.createMany({
    data: [
      { phaseId: p3.id, title: "تأیید ۳ اقدام اصلی روز (Today's Big 3)", durationMin: 5, sortOrder: 1, isCompleted: true },
      { phaseId: p3.id, title: "ورود به اولین بلوک کار عمیق (Deep Work رایش)", durationMin: 5, sortOrder: 2, isCompleted: true },
    ],
  });

  const nightRoutine = await prisma.routine.create({
    data: {
      title: "روتین شبانه و تخلیه ذهنی",
      type: "night",
      trigger: "ساعت ۲۲:۰۰ شب",
      startCondition: "خاموشی مانیتور و گوشی",
      expectedDuration: 40,
      streak: 30,
      completionPercentage: 85,
    },
  });

  const np1 = await prisma.routinePhase.create({ data: { routineId: nightRoutine.id, title: "فاز ۱: دخل و تدارکات", sortOrder: 1 } });
  await prisma.routineStep.createMany({
    data: [
      { phaseId: np1.id, title: "بستن حساب‌های روزانه بوفه و فروشگاه در Life OS", durationMin: 10, sortOrder: 1, isCompleted: true },
      { phaseId: np1.id, title: "آماده‌سازی وسایل تمرین و لباس‌های فردا", durationMin: 10, sortOrder: 2, isCompleted: true },
    ],
  });

  const np2 = await prisma.routinePhase.create({ data: { routineId: nightRoutine.id, title: "فاز ۲: ژورنال ۳ سؤاله و خاموشی", sortOrder: 2 } });
  await prisma.routineStep.createMany({
    data: [
      { phaseId: np2.id, title: "پاسخ به ۳ پرسش ژورنال (چه چیزی عالی بود؟ چه آموختم؟ فردا چه بهتر شود؟)", durationMin: 10, sortOrder: 1 },
      { phaseId: np2.id, title: "تاریکی مطلق، اتاق خنک (۱۹ درجه) و خواب عمیق", durationMin: 10, sortOrder: 2 },
    ],
  });

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

  // Meal Templates (Atwater exact calories)
  const breakfastTemplates = [
    { title: "املت ۴ سفیده و ۱ تخم‌مرغ کامل با نان سنگک و خیار گوجه", calories: 450, protein: 32, carbs: 40, fat: 18, time: "07:30" },
    { title: "جو دو سر پرک با شیر کم‌چرب، کره بادام‌زمینی و دارچین", calories: 472, protein: 24, carbs: 58, fat: 16, time: "07:30" },
    { title: "پنیر کوتاژ کم‌چرب با گردو و نان پروتئینی سبوس‌دار", calories: 434, protein: 30, carbs: 38, fat: 18, time: "07:30" },
  ];

  const snackTemplates = [
    { mealType: "شیک بوفه", title: "شیک پروتئین وی کاله با موز و دانه چیا (بوفه باشگاه)", calories: 296, protein: 30, carbs: 35, fat: 4, time: "11:30" },
    { mealType: "میان‌وعده", title: "پروتئین‌بار شکلاتی کارن با اسپرسو دبل شات", calories: 256, protein: 20, carbs: 26, fat: 8, time: "11:30" },
    { mealType: "شیک بوفه", title: "شیک پروتئینی انرژی پلاس شیربادام و جو (بوفه باشگاه)", calories: 334, protein: 32, carbs: 38, fat: 6, time: "11:30" },
  ];

  const lunchTemplates = [
    { title: "سینه مرغ گریل شده ۲۰۰ گرم + برنج کته با زعفران", calories: 588, protein: 55, carbs: 65, fat: 12, time: "14:00" },
    { title: "فیله گوساله بدون چربی + پلو عدس و ماست کم‌چرب", calories: 614, protein: 52, carbs: 70, fat: 14, time: "14:00" },
    { title: "بوقلمون تفت‌داده با کینوا و سبزیجات تازه", calories: 540, protein: 48, carbs: 60, fat: 12, time: "14:00" },
  ];

  const dinnerTemplates = [
    { title: "فیله ماهی قزل‌آلا با سبزیجات بخارپز و روغن زیتون", calories: 412, protein: 42, carbs: 25, fat: 16, time: "20:30" },
    { title: "خوراک عدسی پرپروتئین با فیله مرغ و لیموترش", calories: 458, protein: 44, carbs: 48, fat: 10, time: "20:30" },
    { title: "تن‌ماهی شویدی بدون روغن با سالاد کلم و لوبیا قرمز", calories: 404, protein: 42, carbs: 32, fat: 12, time: "20:30" },
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
    // A. Invoices & Line Items (Buffet, Cosmetics, Rayesh)
    // -------------------------------------------------------------
    // 1. Daily Buffet Invoices
    const pShk = createdProducts.find((p) => p.sku === "BUF-SHK-02");
    const pBar = createdProducts.find((p) => p.sku === "BUF-BAR-03");
    const pWtr = createdProducts.find((p) => p.sku === "BUF-WTR-05");
    const pWhey = createdProducts.find((p) => p.sku === "BUF-WHEY-01");

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
        notes: "فروش روزانه شیک و بارهای پروتئینی ورزشکاران باشگاه",
        items: { create: bufItemsData },
      },
    });

    let totalBuffetDaySales = bufInvTotal;

    // Alternate Day Supplement Invoice (Whey / Creatine)
    if (dayIndex % 3 === 0) {
      const wheyTotal = pWhey.sellPrice;
      const wheyCogs = pWhey.buyPrice;
      totalBuffetDaySales += wheyTotal;

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
          notes: "فروش مکمل قوطی وی کاله ۱۸۰۰ گرم",
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

    // 2. Daily Cosmetics Invoice
    const pSun = createdProducts.find((p) => p.sku === "COS-SUN-01");
    const pHyd = createdProducts.find((p) => p.sku === "COS-HYD-02");
    const pMic = createdProducts.find((p) => p.sku === "COS-MIC-03");
    const pMas = createdProducts.find((p) => p.sku === "COS-MAS-05");
    const pLip = createdProducts.find((p) => p.sku === "COS-LIP-06");

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
        notes: "فروش پکیج روتین پوست و آرایش صورت",
        items: { create: cosItemsData },
      },
    });

    let totalCosmeticsDaySales = cosInvTotal;

    // 3. Rayesh Milestone Invoices (Day 30, Day 60, Day 88)
    let totalRayeshDaySales = 0;
    if (dayIndex === 30 || dayIndex === 60 || dayIndex === 88) {
      const milestoneAmount = dayIndex === 30 ? 35000000 : dayIndex === 60 ? 45000000 : 40000000;
      totalRayeshDaySales = milestoneAmount;

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
          notes: "صورت‌حساب تحویل فاز اسپرینت پلتفرم سازمانی رایش",
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
    // B. 90-Day Cash Registers (Buffet, Cosmetics, Rayesh)
    // -------------------------------------------------------------
    // 1. Buffet Cash Register (reconciled exactly with totalBuffetDaySales)
    const bufOpening = 1200000 + ((dayIndex * 37) % 300000);
    const bufPos = Math.round(totalBuffetDaySales * 0.85);
    const bufCash = totalBuffetDaySales - bufPos;
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

    // 2. Cosmetics Cash Register (reconciled exactly with totalCosmeticsDaySales)
    const cosOpening = 2500000 + ((dayIndex * 43) % 500000);
    const cosPos = Math.round(totalCosmeticsDaySales * 0.90);
    const cosCash = totalCosmeticsDaySales - cosPos;
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
    const ryshPos = totalRayeshDaySales;
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
    // C. 90-Day Workouts & Exercises (~51-52 sessions, Progressive Overload)
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
          userId: user.id,
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
    const timeInBed = 450 + (dayIndex % 6) * 5; // 450 to 475 min
    const totalSleep = Math.round(timeInBed * (0.89 + (dayIndex % 7) * 0.01)); // 89% to 95%
    const sleepEfficiency = Math.round((totalSleep / timeInBed) * 1000) / 10;
    const morningEnergy = Math.min(10, Math.floor(7 + (dayIndex % 4)));

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
        perceivedQuality: Math.min(10, Math.floor(8 + (dayIndex % 3))),
        caffeineMg: 150,
        screenUsageMinutes: dayOffset % 5 === 0 ? 45 : 15,
        exerciseDone: isWorkoutDay,
        notes: sleepEfficiency > 92 ? "خواب عمیق، ریکاوری کامل سیستم عصبی" : "خواب نرمال با بیداری کوتاه شبانه",
      },
    });

    // -------------------------------------------------------------
    // E. 90-Day Body Measurements (Fat loss from 84.5kg down to 78.8kg)
    // -------------------------------------------------------------
    const weightVal = Math.round((84.5 - dayProgressRatio * 5.7) * 10) / 10;
    const waistVal = Math.round((90.0 - dayProgressRatio * 6.5) * 10) / 10;
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
    // F. 90-Day Nutrition Logs & 4 Daily Meals (360 FoodEntries!)
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
    const dailyWater = 2700 + ((dayIndex * 71) % 450);

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
        whatFailed: "کمی خستگی که با بافر استراحت مدیریت شد",
        bottleneck: "مدیریت زمان در ساعات عصر بین بوفه و فروشگاه",
        lessonsLearned: "ثبات در عادات روزانه کلید پیشرفت است",
        tomorrowChanges: "شروع کار عمیق بلافاصله پس از اتمام روتین صبحگاه",
        energyPhysical: Math.min(10, Math.floor(7 + (dayIndex % 4))),
        energyEmotional: Math.min(10, Math.floor(8 + (dayIndex % 3))),
        energyMental: Math.min(10, Math.floor(8 + (dayIndex % 3))),
        energySpiritual: Math.min(10, Math.floor(8 + (dayIndex % 3))),
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

  // -------------------------------------------------------------
  // Post-Seeding: Recalculate OKR Key Results and Objectives Progress
  // -------------------------------------------------------------
  console.log("🔄 Recalculating OKR Key Results and Objectives progress...");
  const allObjectives = await prisma.objective.findMany({ include: { keyResults: true } });
  for (const obj of allObjectives) {
    if (obj.keyResults.length > 0) {
      for (const kr of obj.keyResults) {
        const raw = ((kr.currentValue - kr.baseline) / (kr.target - kr.baseline)) * 100;
        const progress = Math.min(100, Math.max(0, Math.round(raw)));
        await prisma.keyResult.update({
          where: { id: kr.id },
          data: { progress },
        });
      }
      const updatedKrs = await prisma.keyResult.findMany({ where: { objectiveId: obj.id } });
      const avg = Math.round(updatedKrs.reduce((s, k) => s + k.progress, 0) / updatedKrs.length);
      await prisma.objective.update({
        where: { id: obj.id },
        data: { progress: avg },
      });
    }
  }

  // 9. Sample Core Financial Transactions
  await prisma.transaction.createMany({
    data: [
      {
        date: today,
        amount: 3200000,
        type: "Sale",
        accountToId: createdAccounts["کارتخوان و دخل بوفه باشگاه"].id,
        costCenterId: createdCostCenters["بوفه باشگاه"].id,
        counterparty: "ورزشکاران باشگاه",
        description: "فروش روزانه شیک‌های پروتئینی، پروتئین‌بار و آب‌معدنی",
        reconciled: true,
      },
      {
        date: today,
        amount: 4650000,
        type: "Sale",
        accountToId: createdAccounts["حساب فروشگاه لوازم آرایشی (پاسارگاد)"].id,
        costCenterId: createdCostCenters["لوازم آرایشی"].id,
        counterparty: "مشتریان حضوری فروشگاه",
        description: "فروش پکیج مراقبت پوست: ۳ عدد ضدآفتاب لافارر و ۲ آبرسان نوتروژینا",
        reconciled: true,
      },
      {
        date: new Date(today.getTime() - 2 * 86400000),
        amount: 25000000,
        type: "Income",
        accountToId: createdAccounts["حساب شرکتی رایش (بانک ملت)"].id,
        costCenterId: createdCostCenters["شرکت رایش"].id,
        counterparty: "شرکت صنایع پارس نوین",
        description: "قسط دوم قرارداد توسعه نرم‌افزار سازمانی رایش",
        reconciled: true,
      },
      {
        date: new Date(today.getTime() - 3 * 86400000),
        amount: 14000000,
        type: "Purchase",
        accountFromId: createdAccounts["کارتخوان و دخل بوفه باشگاه"].id,
        costCenterId: createdCostCenters["بوفه باشگاه"].id,
        counterparty: "پخش مکمل ایران",
        description: "شارژ انبار: خرید کارتن پروتئین بار کارن و ۱۰ قوطی وی کاله",
        reconciled: true,
      },
      {
        date: new Date(today.getTime() - 4 * 86400000),
        amount: 18000000,
        type: "Purchase",
        accountFromId: createdAccounts["حساب فروشگاه لوازم آرایشی (پاسارگاد)"].id,
        costCenterId: createdCostCenters["لوازم آرایشی"].id,
        counterparty: "شرکت بازرگانی روژان",
        description: "شارژ انبار: خرید ۵۰ عدد ضدآفتاب لافارر و سرم‌های ویتامین سی",
        reconciled: true,
      },
    ],
  });

  // 10. University Courses
  const c1 = await prisma.universityCourse.create({
    data: {
      code: "SE-302",
      title: "مهندسی نرم‌افزار پیشرفته و معماری سیستم",
      instructor: "دکتر فرهمند",
      credits: 3,
      semester: "نیم‌سال جاری",
      targetGrade: 19,
      deepWorkHours: 36,
    },
  });

  await prisma.universityAssignment.create({
    data: {
      courseId: c1.id,
      title: "طراحی میکروسرویس و مدل تراکنش‌های مالی دوبل",
      dueDate: new Date(Date.now() + 6 * 86400000),
      weight: 20,
      status: "pending",
    },
  });

  await prisma.universityExam.create({
    data: {
      courseId: c1.id,
      title: "امتحان جامع پایان‌ترم مهندسی نرم‌افزار",
      examDate: new Date(Date.now() + 25 * 86400000),
      room: "دانشکده مهندسی، کلاس ۲۰۴",
      weight: 40,
    },
  });

  // 11. SOPs (بوفه باشگاه، فروشگاه آرایشی، رایش)
  await prisma.sOP.createMany({
    data: [
      {
        title: "روش اجرایی استاندارد آماده‌سازی شیک‌های پروتئینی بوفه باشگاه",
        domain: "بوفه باشگاه",
        trigger: "سفارش ورزشکار قبل یا بعد از تمرین",
        steps: "۱. بررسی نوع شیک (حجمی با موز و کره بادام یا رژیمی با آب)\n۲. پیمانه دقیق ۳۰ گرم پودر وی کاله\n۳. افزودن مایعات و ۳ تکه یخ\n۴. مخلوط‌کن به مدت ۴۵ ثانیه\n۵. تحویل با نی کاغذی و ثبت فوری در Life OS",
        owner: "مسئول بوفه",
      },
      {
        title: "دستورالعمل بستن دخل شبانه و تطبیق دستگاه پوز فروشگاه آرایشی",
        domain: "لوازم آرایشی",
        trigger: "پایان وقت کاری ساعت ۲۱:۳۰",
        steps: "۱. چاپ فاکتور تسویه پوز بانکی\n۲. شمارش فیزیکی اسکناس‌های صندوق\n۳. تطبیق با مانده فرمول در صفحه /finance/shop/cash-register\n۴. ثبت کسر موجودی فاکتورهای دستی\n۵. خاموشی روشنایی‌ها و فعال‌سازی دزدگیر",
        owner: "مدیر فروشگاه",
      },
      {
        title: "فرآیند انتشار و دپلوی امن پروژه‌های نرم‌افزاری شرکت رایش",
        domain: "شرکت رایش",
        trigger: "پایان هر اسپرینت ۲ هفته‌ای",
        steps: "۱. اجرای تست‌های یکپارچگی اتوماتیک\n۲. تهیه بک‌آپ از دیتابیس پروداکشن\n۳. مرج به برنچ main\n۴. اجرای دپلوی CI/CD بدون داون‌تایم\n۵. تست سلامت اندپوینت‌ها و ثبت صورت‌حساب",
        owner: "تیم فنی رایش",
      },
    ],
  });

  // 12. Automation Rules
  await prisma.automationRule.createMany({
    data: [
      {
        title: "کسر خودکار موجودی انبار در زمان ثبت فروش مکمل بوفه یا لوازم آرایشی",
        ifEvent: "sale_created",
        ifCondition: "invoice.type == 'sale'",
        thenAction: "reduce_inventory_stock_and_recalc_cogs",
        isActive: true,
      },
      {
        title: "اعلان روتین شبانه در ساعت ۲۲:۰۰ برای حفظ کیفیت خواب",
        ifEvent: "time_reached",
        ifCondition: "time == 22:00",
        thenAction: "trigger_night_decompression_protocol",
        isActive: true,
      },
      {
        title: "توصیه به تمرکز سبک در صورت افت راندمان خواب زیر ۸۵٪",
        ifEvent: "sleep_logged",
        ifCondition: "sleepEfficiency < 85",
        thenAction: "recommend_lighter_deepwork_load",
        isActive: true,
      },
    ],
  });

  console.log("✅ 90-Day Simulation & Business Pivot successfully populated in database!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
