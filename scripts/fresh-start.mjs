import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 شروع فرآیند صفر کردن اطلاعات و بازنشانی به نقطه شروع روز اول (Day 1)...");

  // 1. Safe deletion of all existing records in dependency order
  const modelsToDelete = [
    prisma.auditLog,
    prisma.automationRule,
    prisma.sOP,
    prisma.decisionLog,
    prisma.note,
    prisma.book,
    prisma.universityEvent,
    prisma.universityAssignment,
    prisma.universityExam,
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

  for (const m of modelsToDelete) {
    try {
      await m.deleteMany();
    } catch (e) {
      console.warn("Could not delete from model:", e.message);
    }
  }

  console.log("✅ تمامی داده‌های شبیه‌سازی‌شده و تست‌های قبلی با موفقیت پاکسازی شدند.");

  // Current start date (Today at 00:00)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      name: "مدیر سیستم‌عامل زندگی",
      email: "director@lifeos.local",
      currency: "تومان",
      weightUnit: "kg",
      calorieUnit: "kcal",
      weekStartDay: "saturday",
      theme: "white",
    },
  });

  // 3. Create Clean 9 Core Areas
  const areasData = [
    { name: "بوفه باشگاه", icon: "Coffee", color: "#f59e0b", purpose: "مدیریت دخل روزانه، فروش شیک و مکمل، و رضایت ورزشکاران", standard: "کیفیت بالای متریال، حاشیه سود ۳۵٪+، دخل بالانس روزانه", reviewFrequency: "روزانه", sortOrder: 1 },
    { name: "لوازم آرایشی", icon: "Sparkles", color: "#ec4899", purpose: "خرده‌فروشی و آنلاین محصولات پوستی و آرایشی اورجینال", standard: "اصالت کالا، عدم کسری موجودی، ثبت دقیق حسابداری", reviewFrequency: "هفتگی", sortOrder: 2 },
    { name: "شرکت رایش", icon: "Laptop", color: "#6366f1", purpose: "پروژه‌های نرم‌افزاری، طراحی UI/UX و سیستم‌های ابری", standard: "تحویل اسپرینت‌ها سروقت، رضایت کارفرما، کار عمیق", reviewFrequency: "هفتگی", sortOrder: 3 },
    { name: "سلامت و ورزش", icon: "Dumbbell", color: "#ef4444", purpose: "تمرینات قدرتی، تناسب اندام، رژیم پرپروتئین و ریکاوری خواب", standard: "۴ جلسه باشگاه در هفته، خواب ۷+ ساعت منظم", reviewFrequency: "روزانه", sortOrder: 4 },
    { name: "دانشگاه", icon: "GraduationCap", color: "#3b82f6", purpose: "معدل عالی، تسلط علمی و تحویل پروژه‌های درسی", standard: "حضور به موقع در کلاس‌ها و برنامه‌ریزی زودهنگام امتحانات", reviewFrequency: "هفتگی", sortOrder: 5 },
    { name: "توسعه فردی", icon: "Compass", color: "#8b5cf6", purpose: "مطالعه کتب استراتژی، فن بیان و مدیریت ذهن", standard: "۳۰ دقیقه کتابخوانی روزانه و تمرین تمرکز", reviewFrequency: "هفتگی", sortOrder: 6 },
    { name: "مالی و سرمایه", icon: "DollarSign", color: "#10b981", purpose: "انضباط جریان وجوه نقد، پس‌انداز و تفکیک دخل", standard: "ثبت روزانه هزینه‌ها و دخل مغازه بدون کسری", reviewFrequency: "هفتگی", sortOrder: 7 },
    { name: "روابط و خانواده", icon: "Users", color: "#f43f5e", purpose: "ارتباط باکیفیت با خانواده و دوستان حامی", standard: "حضور باکیفیت و بدون حواس‌پرتی", reviewFrequency: "هفتگی", sortOrder: 8 },
    { name: "عملیات شخصی", icon: "CheckSquare", color: "#64748b", purpose: "لجستیک فردی، نظم میز کار، اینباکس صفر و روتین‌ها", standard: "محیط کار کاملاً مرتب و سازمان‌یافته", reviewFrequency: "روزانه", sortOrder: 9 },
  ];

  const createdAreas = {};
  for (const a of areasData) {
    createdAreas[a.name] = await prisma.area.create({ data: a });
  }

  // 4. Create 6 Cost Centers
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

  // 5. Create Fresh Financial Accounts (Clean 0 Balance)
  const accountsData = [
    { name: "کارتخوان و دخل بوفه باشگاه", type: "ShopRegister", balance: 0, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { name: "صندوق نقد بوفه باشگاه", type: "Cash", balance: 0, costCenterId: createdCostCenters["بوفه باشگاه"].id },
    { name: "حساب فروشگاه لوازم آرایشی", type: "Business", balance: 0, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { name: "صندوق نقد مغازه آرایشی", type: "Cash", balance: 0, costCenterId: createdCostCenters["لوازم آرایشی"].id },
    { name: "حساب شرکتی رایش", type: "Business", balance: 0, costCenterId: createdCostCenters["شرکت رایش"].id },
    { name: "کارت روزمره و بانک سامان شخصی", type: "Bank", balance: 0, costCenterId: createdCostCenters["شخصی"].id, isDefault: true },
  ];

  for (const acc of accountsData) {
    await prisma.financialAccount.create({ data: acc });
  }

  // 6. Create Standard Financial Categories
  const categoriesData = [
    { name: "فروش بوفه و شیک", type: "income", color: "#10b981", icon: "TrendingUp" },
    { name: "فروش لوازم آرایشی", type: "income", color: "#10b981", icon: "TrendingUp" },
    { name: "درآمد قراردادهای رایش", type: "income", color: "#10b981", icon: "TrendingUp" },
    { name: "درآمد متفرقه", type: "income", color: "#10b981", icon: "TrendingUp" },
    { name: "خرید مواد اولیه و مکمل بوفه", type: "expense", color: "#ef4444", icon: "ShoppingBag" },
    { name: "خرید اجناس فروشگاه آرایشی", type: "expense", color: "#ef4444", icon: "ShoppingBag" },
    { name: "اجاره و شارژ مکان", type: "expense", color: "#ef4444", icon: "Home" },
    { name: "حقوق و دستمزد", type: "expense", color: "#ef4444", icon: "Users" },
    { name: "تجهیزات و ابزار", type: "expense", color: "#ef4444", icon: "Tool" },
    { name: "مخارج شخصی و زندگی", type: "expense", color: "#ef4444", icon: "User" },
  ];

  for (const cat of categoriesData) {
    await prisma.financialCategory.create({ data: cat });
  }

  // 7. Create Pristine 90-Day Cycle Starting TODAY
  const cycle = await prisma.cycle90Day.create({
    data: {
      title: "چرخه ۹۰ روزه جدید: استقرار، رشد درآمد و انضباط کامل فردی",
      startDate: today,
      endDate: in90Days,
      theme: "شروع قدرتمند از نقطه صفر: مدیریت یکپارچه بوفه، فروشگاه آرایشی، رایش، دانشگاه و سلامت",
      currentPhase: "ساخت",
      status: "active",
    },
  });

  // 8. Create Starter Objectives with 0% Progress
  const objBuffet = await prisma.objective.create({
    data: {
      title: "مدیریت و رشد فروش ماهانه بوفه باشگاه",
      description: "ثبت دقیق دخل روزانه، ارائه شیک‌های باکیفیت و کنترل کسری صندوق",
      cycleId: cycle.id,
      areaId: createdAreas["بوفه باشگاه"].id,
      priority: "high",
      status: "in_progress",
      confidence: 90,
      progress: 0,
      dailyAction: "بررسی دخل و فروش روزانه بوفه",
      dailyDuration: 30,
      targetMetric: "فروش ماهانه بوفه",
      targetValue: 60000000,
      currentValue: 0,
      metricUnit: "تومان",
      autoSchedule: true,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objBuffet.id, metric: "میانگین فروش روزانه شیک و مکمل", baseline: 0, target: 40, currentValue: 0, unit: "آیتم", progress: 0 },
      { objectiveId: objBuffet.id, metric: "درصد روزهای با دخل بالانس و بدون کسری", baseline: 0, target: 100, currentValue: 0, unit: "درصد", progress: 0 },
    ],
  });

  const objCosmetics = await prisma.objective.create({
    data: {
      title: "توسعه فروشگاه لوازم آرایشی و بهداشتی",
      description: "مدیریت دقیق محصولات پرفروش پوستی، جذب مشتریان حضوری و ثبت شفاف مالی",
      cycleId: cycle.id,
      areaId: createdAreas["لوازم آرایشی"].id,
      priority: "high",
      status: "in_progress",
      confidence: 85,
      progress: 0,
      dailyAction: "پایش موجودی و ثبت دخل فروشگاه آرایشی",
      dailyDuration: 30,
      targetMetric: "فروش ماهانه آرایشی",
      targetValue: 100000000,
      currentValue: 0,
      metricUnit: "تومان",
      autoSchedule: true,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objCosmetics.id, metric: "تعداد فاکتورهای فروش روزانه", baseline: 0, target: 25, currentValue: 0, unit: "فاکتور", progress: 0 },
      { objectiveId: objCosmetics.id, metric: "عدم کسری موجودی اقلام پرفروش", baseline: 0, target: 100, currentValue: 0, unit: "درصد", progress: 0 },
    ],
  });

  const objRayesh = await prisma.objective.create({
    data: {
      title: "توسعه و تحویل پروژه‌های شرکت رایش",
      description: "پیاده‌سازی ماژول‌های نرم‌افزاری و بهبود کیفیت کد پروژه‌ها",
      cycleId: cycle.id,
      areaId: createdAreas["شرکت رایش"].id,
      priority: "high",
      status: "in_progress",
      confidence: 90,
      progress: 0,
      dailyAction: "جلسه کار عمیق برنامه‌نویسی رایش",
      dailyDuration: 120,
      targetMetric: "قراردادهای وصول‌شده",
      targetValue: 80000000,
      currentValue: 0,
      metricUnit: "تومان",
      autoSchedule: true,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objRayesh.id, metric: "ساعات کار عمیق هفتگی رایش", baseline: 0, target: 25, currentValue: 0, unit: "ساعت", progress: 0 },
      { objectiveId: objRayesh.id, metric: "تعداد اسپرینت‌های تکمیل‌شده", baseline: 0, target: 6, currentValue: 0, unit: "اسپرینت", progress: 0 },
    ],
  });

  const objHealth = await prisma.objective.create({
    data: {
      title: "تناسب اندام، تمرین منظم و ریکاوری خواب",
      description: "حفظ نظم ۴ جلسه تمرین در هفته و حداقل ۷ ساعت خواب باکیفیت",
      cycleId: cycle.id,
      areaId: createdAreas["سلامت و ورزش"].id,
      priority: "high",
      status: "in_progress",
      confidence: 95,
      progress: 0,
      dailyAction: "تمرین ورزشی و پیگیری تغذیه سالم",
      dailyDuration: 75,
      targetMetric: "جلسات تمرین در هفته",
      targetValue: 4,
      currentValue: 0,
      metricUnit: "جلسه",
      autoSchedule: true,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objHealth.id, metric: "تعداد جلسات تمرین در هفته", baseline: 0, target: 4, currentValue: 0, unit: "جلسه", progress: 0 },
      { objectiveId: objHealth.id, metric: "میانگین خواب شبانه", baseline: 0, target: 7.5, currentValue: 0, unit: "ساعت", progress: 0 },
    ],
  });

  const objUni = await prisma.objective.create({
    data: {
      title: "معدل عالی و تسلط بر دروس دانشگاه",
      description: "حضور به موقع در کلاس‌ها و زمان‌بندی پیش‌دستانه تکالیف و امتحانات",
      cycleId: cycle.id,
      areaId: createdAreas["دانشگاه"].id,
      priority: "medium",
      status: "in_progress",
      confidence: 90,
      progress: 0,
      dailyAction: "مطالعه و پیگیری مباحث درسی",
      dailyDuration: 60,
      targetMetric: "معدل هدف ترم",
      targetValue: 18.5,
      currentValue: 0,
      metricUnit: "نمره",
      autoSchedule: true,
    },
  });

  await prisma.keyResult.createMany({
    data: [
      { objectiveId: objUni.id, metric: "درصد تکالیف تحویل‌شده قبل از موعد", baseline: 0, target: 100, currentValue: 0, unit: "درصد", progress: 0 },
    ],
  });

  // 9. Create Clean Baseline Projects (0% Progress)
  await prisma.project.create({
    data: {
      title: "منوی جدید شیک‌ها و بهینه‌سازی تأمین مواد بوفه",
      areaId: createdAreas["بوفه باشگاه"].id,
      objectiveId: objBuffet.id,
      status: "active",
      priority: "high",
      progress: 0,
      health: "on_track",
      expectedOutput: "تأمین پایدار مواد اولیه و افزایش رضایت مشتریان بوفه",
    },
  });

  await prisma.project.create({
    data: {
      title: "ساماندهی قفسه‌ها و فروشگاه آنلاین آرایشی",
      areaId: createdAreas["لوازم آرایشی"].id,
      objectiveId: objCosmetics.id,
      status: "active",
      priority: "high",
      progress: 0,
      health: "on_track",
      expectedOutput: "افزایش فروش روزانه و دقت دخل مغازه",
    },
  });

  await prisma.project.create({
    data: {
      title: "توسعه نسخه سازمانی نرم‌افزار رایش",
      areaId: createdAreas["شرکت رایش"].id,
      objectiveId: objRayesh.id,
      status: "active",
      priority: "high",
      progress: 0,
      health: "on_track",
      expectedOutput: "تحویل فاز جدید پروژه و وصول مطالبات",
    },
  });

  // 10. Clean Daily Habits (Streak 0, active)
  const habitsData = [
    { title: "تمرین ورزشی و بدنسازی", areaId: createdAreas["سلامت و ورزش"].id, frequency: "daily", target: 1, unit: "جلسه", preferredTime: "عصر", streak: 0, completionRate: 0 },
    { title: "۳۰ دقیقه کتابخوانی توسعه فردی", areaId: createdAreas["توسعه فردی"].id, frequency: "daily", target: 30, unit: "دقیقه", preferredTime: "شب", streak: 0, completionRate: 0 },
    { title: "ثبت دخل و بستن صندوق روزانه", areaId: createdAreas["مالی و سرمایه"].id, frequency: "daily", target: 1, unit: "مرتبه", preferredTime: "شب", streak: 0, completionRate: 0 },
    { title: "بازبینی شبانه و تعیین اقدامات طلایی فردا", areaId: createdAreas["عملیات شخصی"].id, frequency: "daily", target: 1, unit: "مرتبه", preferredTime: "شب", streak: 0, completionRate: 0 },
  ];

  for (const h of habitsData) {
    await prisma.habit.create({ data: h });
  }

  // 11. Daily Routines (Clean, 0% complete)
  const morningRoutine = await prisma.routine.create({
    data: {
      title: "روتین صبحگاهی و آمادگی زیستی",
      type: "morning",
      trigger: "07:00",
      expectedDuration: 30,
      streak: 0,
      completionPercentage: 0,
    },
  });

  const mPhase1 = await prisma.routinePhase.create({
    data: {
      routineId: morningRoutine.id,
      title: "فاز ۱: فعال‌سازی بدن و ذهن",
      sortOrder: 1,
    },
  });

  await prisma.routineStep.createMany({
    data: [
      { phaseId: mPhase1.id, title: "نوشیدن آب و الکترولیت + نور خورشید", durationMin: 5, sortOrder: 1, isCompleted: false },
      { phaseId: mPhase1.id, title: "کشش ملایم یا تحرک تنفسی", durationMin: 10, sortOrder: 2, isCompleted: false },
      { phaseId: mPhase1.id, title: "مرور اقدامات سه‌گانه طلایی امروز (Big 3)", durationMin: 10, sortOrder: 3, isCompleted: false },
    ],
  });

  const eveningRoutine = await prisma.routine.create({
    data: {
      title: "روتین شبانه و ریکاوری خواب",
      type: "night",
      trigger: "22:30",
      expectedDuration: 25,
      streak: 0,
      completionPercentage: 0,
    },
  });

  const ePhase1 = await prisma.routinePhase.create({
    data: {
      routineId: eveningRoutine.id,
      title: "فاز ۱: تسویه روز و ارزیابی",
      sortOrder: 1,
    },
  });

  await prisma.routineStep.createMany({
    data: [
      { phaseId: ePhase1.id, title: "ثبت دخل و اسناد مالی روز", durationMin: 10, sortOrder: 1, isCompleted: false },
      { phaseId: ePhase1.id, title: "ثبت بازبینی روزانه در سیستم (Review)", durationMin: 10, sortOrder: 2, isCompleted: false },
      { phaseId: ePhase1.id, title: "خاموشی صفحه‌نمایش‌ها و آماده‌سازی خواب", durationMin: 5, sortOrder: 3, isCompleted: false },
    ],
  });

  // 12. University Course Template (Clean Courses, 0 Deep Work, 0 Events)
  const coursesData = [
    { code: "CE301", title: "طراحی الگوریتم‌ها", instructor: "دکتر رضایی", credits: 3, semester: "ترم جاری", targetGrade: 19, actualGrade: null, deepWorkHours: 0, daysOfWeek: "شنبه، دوشنبه", startTime: "08:00", endTime: "10:00", location: "دانشکده فنی - کلاس ۲۰۲" },
    { code: "CE302", title: "پایگاه داده‌ها", instructor: "دکتر حسینی", credits: 3, semester: "ترم جاری", targetGrade: 18.5, actualGrade: null, deepWorkHours: 0, daysOfWeek: "یکشنبه، سه‌شنبه", startTime: "10:30", endTime: "12:30", location: "دانشکده فنی - سایت کامپیوتر" },
    { code: "CE303", title: "سیستم‌های عامل", instructor: "دکتر کاظمی", credits: 3, semester: "ترم جاری", targetGrade: 18, actualGrade: null, deepWorkHours: 0, daysOfWeek: "شنبه، چهارشنبه", startTime: "13:30", endTime: "15:30", location: "دانشکده فنی - کلاس ۱۰۴" },
  ];

  for (const c of coursesData) {
    await prisma.universityCourse.create({ data: c });
  }

  // 13. Reading Books (Fresh 0 CurrentPage)
  const booksData = [
    { title: "عادت‌های اتمی (Atomic Habits)", author: "جیمز کلیر", category: "توسعه فردی", pages: 320, currentPage: 0, status: "Learning", rating: 5 },
    { title: "کار عمیق (Deep Work)", author: "کال نیوپورت", category: "بهره‌وری", pages: 280, currentPage: 0, status: "ToLearn", rating: 5 },
    { title: "اصول مدیریت مالی و سودآوری", author: "وارن بافت و دیگران", category: "مالی", pages: 240, currentPage: 0, status: "ToLearn", rating: 5 },
  ];

  for (const b of booksData) {
    await prisma.book.create({ data: b });
  }

  // 14. Learning Skills (0 Invested Hours)
  const skillsData = [
    { title: "طراحی معماری نرم‌افزار و سیستم‌های ماژولار", area: "توسعه فردی", currentLevel: "متوسط", targetLevel: "پیشرفته", hoursInvested: 0, targetHours: 50, kpi: "تسلط بر معماری رایش" },
    { title: "فروش حضوری، اصول مذاکره و مدیریت مشتری", area: "کسب‌وکار", currentLevel: "مقدماتی", targetLevel: "پیشرفته", hoursInvested: 0, targetHours: 30, kpi: "افزایش فروش بوفه و آرایشی" },
    { title: "فن بیان و اعتماد به نفس کلامی", area: "توسعه فردی", currentLevel: "مقدماتی", targetLevel: "پیشرفته", hoursInvested: 0, targetHours: 20, kpi: "اجرای ارائه‌های دانشگاهی" },
  ];

  for (const s of skillsData) {
    await prisma.learningSkill.create({ data: s });
  }

  console.log("✨ پلتفرم با موفقیت به نقطه آغاز (Day 1) از تاریخ امروز بازنشانی شد!");
  console.log("📊 وضعیت کنونی:");
  console.log(" - وظایف و تسک‌ها: ۰ (آماده برای ثبت اقدامات طلایی امروز)");
  console.log(" - تقویم و تایم‌بلاک‌ها: ۰ (آماده برای زمان‌بندی روز اول)");
  console.log(" - تراکنش‌ها و دخل مغازه: ۰ (تراز صفر و آماده ثبت اولین فروش)");
  console.log(" - بازبینی‌ها و نمودارهای انرژی: ۰ (آماده برای ثبت اولین ارزیابی امشب)");
  console.log(" - اهداف ۹۰ روزه: چرخه جدید فعال با پیشرفت ۰٪ از امروز");
}

main()
  .catch((e) => {
    console.error("خطا در بازنشانی:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
