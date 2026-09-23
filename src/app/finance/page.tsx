"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wallet,
  Receipt,
  Calendar,
  DollarSign,
  Check,
  FileText,
  RefreshCw,
  Copy,
  Search,
  ArrowLeftRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Filter,
} from "lucide-react";
import { formatCurrency, toPersianDigits, formatPersianDate } from "@/lib/utils";
import {
  getLocalFinanceData,
  saveLocalFinanceData,
  saveLocalCashRegister,
  saveLocalExpense,
  saveLocalTransaction,
  queueOfflineMutation,
} from "@/lib/pwa/local-store";

const CHEQUE_STATUS_MAP: Record<string, { label: string; badge: string; color: string }> = {
  PENDING: { label: "⏳ معوق (در انتظار)", badge: "bg-amber-50 text-amber-800 border-amber-200", color: "text-amber-600" },
  CLEARED: { label: "✅ وصول‌شده", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", color: "text-emerald-600" },
  BOUNCED: { label: "❌ برگشتی", badge: "bg-rose-50 text-rose-800 border-rose-200", color: "text-rose-600" },
  CANCELLED: { label: "🚫 باطل‌شده", badge: "bg-zinc-100 text-zinc-600 border-zinc-200", color: "text-zinc-500" },
};

const EXPENSE_CATEGORIES = [
  "اجاره محل",
  "حقوق و دستمزد",
  "قبوض آب، برق و گاز",
  "تأمین مواد اولیه و کالا",
  "بازاریابی و تبلیغات",
  "تعمیرات و نگهداری",
  "ملزومات و بسته‌بندی",
  "اینترنت، هاست و سرور",
  "تنخواه و متفرقه",
];

const SHAMSI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<
    "SUMMARY" | "EXPENSES" | "FIXED_EXPENSES" | "CHEQUES" | "BANKS" | "CASH_REGISTER" | "JOURNAL"
  >("SUMMARY");

  const [loading, setLoading] = useState(true);
  const [costCenterFilter, setCostCenterFilter] = useState("all");

  // Data states
  const [summary, setSummary] = useState<any>({});
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [cheques, setCheques] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [chequeTypeFilter, setChequeTypeFilter] = useState("all");
  const [chequeStatusFilter, setChequeStatusFilter] = useState("all");

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    paymentMethod: "کارت / انتقال",
    bankAccountId: "",
    costCenterId: "",
    description: "",
  });

  const [fixedForm, setFixedForm] = useState({
    title: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    dueDayShamsi: "10",
    reminderDaysBefore: "3",
    costCenterId: "",
    note: "",
  });

  const [chequeForm, setChequeForm] = useState({
    chequeNumber: "",
    bankName: "بانک ملت",
    amount: "",
    dueYear: "1405",
    dueMonth: "07",
    dueDay: "10",
    payeeOrPayer: "",
    chequeType: "PAYABLE",
    bankAccountId: "",
    costCenterId: "",
    note: "",
  });

  const [bankForm, setBankForm] = useState({
    name: "",
    bankName: "بانک ملت",
    accountNumber: "",
    cardNumber: "",
    balance: "",
    accountType: "Bank",
    costCenterId: "",
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
  });

  const [crForm, setCrForm] = useState({
    costCenterId: "",
    openingCash: "4500000",
    salesCash: "3800000",
    posSalesCash: "3400000",
    physicalSalesCash: "400000",
    expensesCash: "450000",
    withdrawalsCash: "800000",
    actualClosingCash: "7050000",
    notes: "دخل بالانس و کارتخوان تسویه شد",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Fetch all accounting data
  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `/api/finance/accounting${
        costCenterFilter !== "all" ? `?costCenterId=${costCenterFilter}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary || {});
        setCostCenters(data.costCenters || []);
        setAccounts(data.accounts || []);
        setExpenses(data.expenses || []);
        setFixedExpenses(data.fixedExpenses || []);
        setCheques(data.cheques || []);
        setTransactions(data.transactions || []);
        setCashRegisters(data.cashRegisters || []);

        // Persist fresh finance snapshot to IndexedDB
        await saveLocalFinanceData(data);

        if (data.accounts.length > 0 && !expenseForm.bankAccountId) {
          setExpenseForm((prev) => ({
            ...prev,
            bankAccountId: data.accounts[0].id,
            costCenterId: data.accounts[0].costCenterId || "",
          }));
          setChequeForm((prev) => ({
            ...prev,
            bankAccountId: data.accounts[0].id,
            costCenterId: data.accounts[0].costCenterId || "",
          }));
          setTransferForm((prev) => ({
            ...prev,
            fromAccountId: data.accounts[0].id,
            toAccountId: data.accounts[1]?.id || data.accounts[0].id,
          }));
        }

        if (data.costCenters.length > 0 && !fixedForm.costCenterId) {
          setFixedForm((prev) => ({ ...prev, costCenterId: data.costCenters[0].id }));
          setCrForm((prev) => ({ ...prev, costCenterId: data.costCenters[0].id }));
        }
      }
    } catch (e) {
      console.error("fetchData failed, relying on local store:", e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial hydration from IndexedDB before network fetch
  useEffect(() => {
    let mounted = true;
    getLocalFinanceData()
      .then((local) => {
        if (!mounted) return;
        if (local) {
          if (local.summary && Object.keys(local.summary).length > 0) setSummary(local.summary);
          if (local.costCenters && local.costCenters.length > 0) setCostCenters(local.costCenters);
          if (local.accounts && local.accounts.length > 0) setAccounts(local.accounts);
          if (local.expenses && local.expenses.length > 0) setExpenses(local.expenses);
          if (local.fixedExpenses && local.fixedExpenses.length > 0) setFixedExpenses(local.fixedExpenses);
          if (local.cheques && local.cheques.length > 0) setCheques(local.cheques);
          if (local.transactions && local.transactions.length > 0) setTransactions(local.transactions);
          if (local.cashRegisters && local.cashRegisters.length > 0) setCashRegisters(local.cashRegisters);
        }
      })
      .catch((err) => console.error("Error hydrating finance from IndexedDB:", err));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [costCenterFilter]);

  // Handle Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount) return;
    setIsSubmitting(true);

    const expensePayload = {
      type: "expense",
      title: expenseForm.title.trim(),
      categoryName: expenseForm.category,
      amount: Number(expenseForm.amount),
      bankAccountId: expenseForm.bankAccountId || null,
      costCenterId: expenseForm.costCenterId || null,
      paymentMethod: expenseForm.paymentMethod,
      description: expenseForm.description,
    };

    try {
      const res = await fetch("/api/finance/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: "",
        category: EXPENSE_CATEGORIES[0],
        amount: "",
        paymentMethod: "کارت / انتقال",
        bankAccountId: accounts[0]?.id || "",
        costCenterId: costCenters[0]?.id || "",
        description: "",
      });
      fetchData();
    } catch (err) {
      console.warn("Network error saving expense, saving locally to IndexedDB & queueing in outbox:", err);
      const localRecord = await saveLocalExpense(expensePayload, true);
      setExpenses((prev) => [localRecord, ...prev]);
      setTransactions((prev) => [localRecord, ...prev]);
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: "",
        category: EXPENSE_CATEGORIES[0],
        amount: "",
        paymentMethod: "کارت / انتقال",
        bankAccountId: accounts[0]?.id || "",
        costCenterId: costCenters[0]?.id || "",
        description: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Fixed Expense
  const handleSaveFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedForm.title.trim() || !fixedForm.amount) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/finance/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "fixed_expense",
          title: fixedForm.title.trim(),
          category: fixedForm.category,
          amount: Number(fixedForm.amount),
          dueDayShamsi: Number(fixedForm.dueDayShamsi) || 1,
          reminderDaysBefore: Number(fixedForm.reminderDaysBefore) || 3,
          costCenterId: fixedForm.costCenterId || null,
          note: fixedForm.note,
        }),
      });

      setIsFixedModalOpen(false);
      setFixedForm({
        title: "",
        category: EXPENSE_CATEGORIES[0],
        amount: "",
        dueDayShamsi: "10",
        reminderDaysBefore: "3",
        costCenterId: costCenters[0]?.id || "",
        note: "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pay Fixed Expense
  const handlePayFixedExpense = async (fixed: any) => {
    if (!confirm(`آیا از پرداخت و تسویه هزینه ثابت «${fixed.title}» به مبلغ ${formatCurrency(fixed.amount)} اطمینان دارید؟`)) {
      return;
    }

    const defaultBank = accounts[0]?.id;
    try {
      await fetch("/api/finance/accounting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay_fixed_expense",
          fixedExpenseId: fixed.id,
          bankAccountId: defaultBank,
        }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Cheque
  const handleSaveCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chequeForm.chequeNumber.trim() || !chequeForm.amount || !chequeForm.payeeOrPayer) return;
    setIsSubmitting(true);

    const shamsiStr = `${chequeForm.dueYear}/${chequeForm.dueMonth}/${chequeForm.dueDay}`;
    // Simple Gregorian approximate or date
    const d = new Date();
    d.setDate(d.getDate() + 15);

    try {
      await fetch("/api/finance/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cheque",
          chequeNumber: chequeForm.chequeNumber.trim(),
          bankName: chequeForm.bankName,
          amount: Number(chequeForm.amount),
          dueDate: d,
          dueDateShamsi: shamsiStr,
          payeeOrPayer: chequeForm.payeeOrPayer.trim(),
          chequeType: chequeForm.chequeType,
          bankAccountId: chequeForm.bankAccountId || null,
          costCenterId: chequeForm.costCenterId || null,
          note: chequeForm.note,
        }),
      });

      setIsChequeModalOpen(false);
      setChequeForm({
        chequeNumber: "",
        bankName: "بانک ملت",
        amount: "",
        dueYear: "1405",
        dueMonth: "07",
        dueDay: "10",
        payeeOrPayer: "",
        chequeType: "PAYABLE",
        bankAccountId: accounts[0]?.id || "",
        costCenterId: costCenters[0]?.id || "",
        note: "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Cheque Status
  const handleUpdateChequeStatus = async (chequeId: string, newStatus: string) => {
    try {
      await fetch("/api/finance/accounting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_cheque_status",
          chequeId,
          newStatus,
          bankAccountId: accounts[0]?.id,
        }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Bank Account
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.name.trim()) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/finance/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bank_account",
          name: bankForm.name.trim(),
          bankName: bankForm.bankName,
          accountNumber: bankForm.accountNumber || null,
          cardNumber: bankForm.cardNumber || null,
          balance: Number(bankForm.balance) || 0,
          accountType: bankForm.accountType,
          costCenterId: bankForm.costCenterId || null,
        }),
      });

      setIsBankModalOpen(false);
      setBankForm({
        name: "",
        bankName: "بانک ملت",
        accountNumber: "",
        cardNumber: "",
        balance: "",
        accountType: "Bank",
        costCenterId: costCenters[0]?.id || "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) return;
    setIsSubmitting(true);

    const transferPayload = {
      type: "transfer",
      fromAccountId: transferForm.fromAccountId,
      toAccountId: transferForm.toAccountId,
      amount: Number(transferForm.amount),
      description: transferForm.description,
    };

    try {
      const res = await fetch("/api/finance/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferPayload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setIsTransferModalOpen(false);
      setTransferForm({
        fromAccountId: accounts[0]?.id || "",
        toAccountId: accounts[1]?.id || accounts[0]?.id || "",
        amount: "",
        description: "",
      });
      fetchData();
    } catch (err) {
      console.warn("Network error during transfer, saving locally to IndexedDB & queueing in outbox:", err);
      const localRecord = await saveLocalTransaction(transferPayload, true);
      setTransactions((prev) => [localRecord, ...prev]);
      setIsTransferModalOpen(false);
      setTransferForm({
        fromAccountId: accounts[0]?.id || "",
        toAccountId: accounts[1]?.id || accounts[0]?.id || "",
        amount: "",
        description: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cash Register Close
  const handleSaveCashRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const crPayload = {
      type: "cash_register",
      costCenterId: crForm.costCenterId || null,
      openingCash: Number(crForm.openingCash) || 0,
      salesCash: Number(crForm.salesCash) || 0,
      posSalesCash: Number(crForm.posSalesCash) || 0,
      physicalSalesCash: Number(crForm.physicalSalesCash) || 0,
      expensesCash: Number(crForm.expensesCash) || 0,
      withdrawalsCash: Number(crForm.withdrawalsCash) || 0,
      actualClosingCash: Number(crForm.actualClosingCash) || 0,
      notes: crForm.notes,
    };

    try {
      const res = await fetch("/api/finance/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crPayload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setIsCashRegisterModalOpen(false);
      fetchData();
    } catch (err) {
      console.warn("Network error saving cash register, saving locally to IndexedDB & queueing in outbox:", err);
      const localRecord = await saveLocalCashRegister(crPayload, true);
      setCashRegisters((prev) => [localRecord, ...prev]);
      setIsCashRegisterModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete entity
  const handleDelete = async (entity: string, id: string) => {
    if (!confirm("آیا از حذف این آیتم مالی اطمینان دارید؟")) return;
    try {
      await fetch(`/api/finance/accounting?entity=${entity}&id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Filtered Cheques
  const filteredCheques = cheques.filter((c) => {
    if (chequeTypeFilter !== "all" && c.chequeType !== chequeTypeFilter) return false;
    if (chequeStatusFilter !== "all" && c.status !== chequeStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = c.chequeNumber?.toLowerCase().includes(q);
      const matchP = c.payeeOrPayer?.toLowerCase().includes(q);
      const matchB = c.bankName?.toLowerCase().includes(q);
      if (!matchNo && !matchP && !matchB) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-black text-white shadow-sm">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-950">سیستم حسابداری، خزانه‌داری و کنترل مالی</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold">
                الگوی کافه ERP
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              مدیریت چک‌های صیادی، هزینه‌های ثابت و جاری، تراز نقدینگی، بستن دخل و دفاتر مالی تفکیکی کسب‌وکارها
            </p>
          </div>
        </div>

        {/* Global Cost Center Selector & Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <select
            value={costCenterFilter}
            onChange={(e) => setCostCenterFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 font-bold"
          >
            <option value="all">همه کسب‌وکارها و مراکز هزینه</option>
            {costCenters.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.name} ({cc.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>ثبت هزینه جاری</span>
          </button>

          <button
            onClick={() => setIsChequeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold border border-zinc-200 transition-all"
          >
            <FileText className="w-4 h-4 text-zinc-700" />
            <span>ثبت چک صیادی</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS (Financial Health & Balances) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>موجودی نقد و بانک‌ها</span>
            <Wallet className="w-4 h-4 text-zinc-700" />
          </div>
          <p className="text-sm md:text-base font-black text-zinc-950 font-mono">
            {formatCurrency(summary.totalLiquidBalance || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 block font-sans">
            در {toPersianDigits(summary.totalAccountsCount || 0)} حساب و صندوق
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>درآمد و فروش کل</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm md:text-base font-black text-emerald-600 font-mono">
            {formatCurrency(summary.totalIncomes || 0)}
          </p>
          <span className="text-[10px] text-emerald-600 block font-sans">تراز مثبت واریزی</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>مجموع هزینه‌ها</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-sm md:text-base font-black text-rose-600 font-mono">
            {formatCurrency(summary.totalExpenses || 0)}
          </p>
          <span className="text-[10px] text-rose-500 block font-sans">مخارج عملیاتی و جاری</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>سود خالص عملیاتی</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm md:text-base font-black text-zinc-950 font-mono">
            {formatCurrency(summary.netProfit || 0)}
          </p>
          <span className="text-[10px] text-blue-600 block font-sans">تفاضل درآمد و هزینه</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>چک‌های معوقه پرداختی</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm md:text-base font-black text-amber-700 font-mono">
            {formatCurrency(summary.pendingChequesPayable || 0)}
          </p>
          <span className="text-[10px] text-amber-600 block font-sans">تعهدات در نوبت وصول</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] font-medium">
            <span>هزینه‌های ثابت ماهانه</span>
            <Calendar className="w-4 h-4 text-zinc-700" />
          </div>
          <p className="text-sm md:text-base font-black text-zinc-950 font-mono">
            {formatCurrency(summary.pendingFixedExpenses || 0)}
          </p>
          <span className="text-[10px] text-zinc-500 block font-sans">اجاره، حقوق و سرور</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "SUMMARY", label: "📊 داشبورد و هشدارهای سررسید" },
          { id: "EXPENSES", label: `💸 هزینه‌های جاری (${toPersianDigits(expenses.length)})` },
          { id: "FIXED_EXPENSES", label: `🏢 هزینه‌های ثابت ماهانه (${toPersianDigits(fixedExpenses.length)})` },
          { id: "CHEQUES", label: `📜 مدیریت چک‌های صیادی (${toPersianDigits(cheques.length)})` },
          { id: "BANKS", label: `🏦 حساب‌های بانکی و صندوق‌ها (${toPersianDigits(accounts.length)})` },
          { id: "CASH_REGISTER", label: "🧾 بستن و مغایرت دخل روزانه" },
          { id: "JOURNAL", label: `📖 دفتر روزنامه و اسناد (${toPersianDigits(transactions.length)})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-black text-white shadow-sm"
                : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SUMMARY & UPCOMING D-3 ALERTS */}
      {activeTab === "SUMMARY" && (
        <div className="space-y-6">
          {/* Upcoming Due Cheques Alert (D-3 Warning) */}
          <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>چک‌های صیادی و تعهدات با سررسید نزدیک (نیاز به تأمین موجودی):</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cheques
                .filter((c) => c.status === "PENDING")
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-950">{c.bankName} - {c.payeeOrPayer}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        c.chequeType === "PAYABLE" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {c.chequeType === "PAYABLE" ? "پرداختی" : "دریافتی"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 font-mono font-bold">
                      <span>مبلغ: {formatCurrency(c.amount)}</span>
                      <span className="text-[11px] text-zinc-500 font-sans">سررسید: {c.dueDateShamsi || formatPersianDate(c.dueDate)}</span>
                    </div>
                    <div className="pt-1 flex justify-end gap-1.5 border-t border-amber-200/60">
                      <button
                        onClick={() => handleUpdateChequeStatus(c.id, "CLEARED")}
                        className="px-2.5 py-1 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-zinc-800"
                      >
                        وصول شد
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Accounts Balance Quick View */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-700" />
                مانده لحظه‌ای حساب‌ها، صندوق‌ها و کارتخوان‌ها
              </h3>
              <button
                onClick={() => setIsBankModalOpen(true)}
                className="text-xs text-black font-bold hover:underline"
              >
                + حساب جدید
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-900">{acc.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-zinc-600 border border-zinc-200 font-medium">
                      {acc.costCenter?.name || "عمومی"}
                    </span>
                  </div>
                  <p className="text-base font-black font-mono text-zinc-950">{formatCurrency(acc.balance)}</p>
                  {acc.cardNumber && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>{acc.cardNumber}</span>
                      <button
                        onClick={() => handleCopy(acc.cardNumber, acc.id)}
                        className="text-zinc-400 hover:text-black"
                        title="کپی شماره کارت"
                      >
                        {copiedAccount === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRENT EXPENSES */}
      {activeTab === "EXPENSES" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-zinc-700" />
              هزینه‌ها و مخارج جاری ثبت‌شده
            </h3>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start sm:self-center"
            >
              + ثبت هزینه جدید
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">عنوان هزینه</th>
                  <th className="p-3">دسته‌بندی</th>
                  <th className="p-3">مرکز هزینه</th>
                  <th className="p-3">روش پرداخت</th>
                  <th className="p-3">مبلغ (تومان)</th>
                  <th className="p-3">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 font-mono text-zinc-500">{formatPersianDate(exp.date)}</td>
                    <td className="p-3 font-bold text-zinc-900">{exp.description || exp.category?.name || "هزینه جاری"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
                        {exp.category?.name || "سایر"}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600">{exp.costCenter?.name || "—"}</td>
                    <td className="p-3 text-zinc-500">{exp.paymentMethod || "کارتخوان / بانک"}</td>
                    <td className="p-3 font-mono font-bold text-rose-600">{formatCurrency(exp.amount)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete("expense", exp.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                        title="حذف هزینه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      هیچ هزینه جاری ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FIXED EXPENSES */}
      {activeTab === "FIXED_EXPENSES" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-700" />
                هزینه‌های ثابت و دوره‌ای ماهانه (سررسید شمسی)
              </h3>
              <p className="text-[11px] text-zinc-500">
                اجاره، حقوق ثابت، قبوض، بیمه، هاست و سرور با قابلیت تسویه یک‌کلیکه و کسر مستقیم از حساب بانکی
              </p>
            </div>
            <button
              onClick={() => setIsFixedModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start sm:self-center"
            >
              + تعریف هزینه ثابت جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {fixedExpenses.map((fixed) => (
              <div
                key={fixed.id}
                className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold">
                      {fixed.costCenter?.name || "عمومی"}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        fixed.status === "PAID"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {fixed.status === "PAID" ? "✅ پرداخت‌شده" : "⏳ معوقه این ماه"}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-zinc-950 mb-1">{fixed.title}</h4>
                  <div className="text-[11px] text-zinc-500 space-y-0.5">
                    <p>دسته‌بندی: {fixed.category}</p>
                    <p className="font-mono">سررسید: {toPersianDigits(fixed.dueDayShamsi)}ام هر ماه شمسی</p>
                    <p>یادآوری: {toPersianDigits(fixed.reminderDaysBefore)} روز قبل از سررسید</p>
                    {fixed.note && <p className="italic text-zinc-400">{fixed.note}</p>}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-zinc-950">{formatCurrency(fixed.amount)}</span>
                  <div className="flex items-center gap-1.5">
                    {fixed.status !== "PAID" && (
                      <button
                        onClick={() => handlePayFixedExpense(fixed)}
                        className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-zinc-800"
                      >
                        تسویه و پرداخت
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete("fixed_expense", fixed.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHEQUES MANAGEMENT */}
      {activeTab === "CHEQUES" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-700" />
                مدیریت جامع چک‌های صیادی (دریافتی و پرداختی)
              </h3>
              <p className="text-[11px] text-zinc-500">
                پایش سررسیدهای صیادی، وصول چک با به‌روزرسانی خودکار موجودی بانک، برگشت زدن و ابطال
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={chequeTypeFilter}
                onChange={(e) => setChequeTypeFilter(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs text-zinc-800 font-medium"
              >
                <option value="all">همه انواع چک</option>
                <option value="PAYABLE">چک‌های پرداختی من (صادره)</option>
                <option value="RECEIVABLE">چک‌های دریافتی (مشتریان)</option>
              </select>

              <select
                value={chequeStatusFilter}
                onChange={(e) => setChequeStatusFilter(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs text-zinc-800 font-medium"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="PENDING">معوق (در انتظار)</option>
                <option value="CLEARED">وصول‌شده</option>
                <option value="BOUNCED">برگشتی</option>
                <option value="CANCELLED">باطل‌شده</option>
              </select>

              <button
                onClick={() => setIsChequeModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800"
              >
                + ثبت چک جدید
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">شماره صیادی</th>
                  <th className="p-3">بانک</th>
                  <th className="p-3">طرف حساب (ذینفع/صادرکننده)</th>
                  <th className="p-3">نوع چک</th>
                  <th className="p-3">سررسید شمسی</th>
                  <th className="p-3">مبلغ (تومان)</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">عملیات وصول / تغییر وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCheques.map((c) => {
                  const statusInfo = CHEQUE_STATUS_MAP[c.status] || CHEQUE_STATUS_MAP.PENDING;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-zinc-950">{c.chequeNumber}</td>
                      <td className="p-3 text-zinc-700">{c.bankName}</td>
                      <td className="p-3 font-medium text-zinc-900">{c.payeeOrPayer}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            c.chequeType === "PAYABLE"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.chequeType === "PAYABLE" ? "پرداختی" : "دریافتی"}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-zinc-600">
                        {c.dueDateShamsi || formatPersianDate(c.dueDate)}
                      </td>
                      <td className="p-3 font-mono font-black text-zinc-950">{formatCurrency(c.amount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {c.status !== "CLEARED" && (
                            <button
                              onClick={() => handleUpdateChequeStatus(c.id, "CLEARED")}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                              title="وصول چک و انتقال وجه به حساب"
                            >
                              وصول
                            </button>
                          )}
                          {c.status !== "BOUNCED" && c.status !== "CLEARED" && (
                            <button
                              onClick={() => handleUpdateChequeStatus(c.id, "BOUNCED")}
                              className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px]"
                              title="برگشت زدن چک"
                            >
                              برگشت
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete("cheque", c.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                            title="حذف چک"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCheques.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400">
                      هیچ چکی مطابق فیلترهای انتخابی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BANKS & WALLETS */}
      {activeTab === "BANKS" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-700" />
                حساب‌های بانکی، کارت‌ها، صندوق‌ها و کارتخوان‌ها
              </h3>
              <p className="text-[11px] text-zinc-500">
                مدیریت تفکیکی حساب‌های بوفه، فروشگاه، رایش و حساب‌های شخصی با قابلیت انتقال وجه بین‌بانکی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold border border-zinc-200 flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-700" />
                <span>انتقال وجه بین حساب‌ها</span>
              </button>

              <button
                onClick={() => setIsBankModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800"
              >
                + حساب جدید
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-zinc-950">{acc.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-zinc-600 border border-zinc-200 font-bold">
                      {acc.costCenter?.name || "عمومی"}
                    </span>
                  </div>

                  <p className="text-lg font-black font-mono text-zinc-950 mb-2">{formatCurrency(acc.balance)}</p>

                  <div className="space-y-1 text-xs text-zinc-600">
                    {acc.bankName && <p className="text-zinc-500">بانک: {acc.bankName}</p>}
                    {acc.cardNumber && (
                      <div className="flex items-center justify-between font-mono bg-white p-2 rounded-lg border border-zinc-200 text-zinc-900">
                        <span>{acc.cardNumber}</span>
                        <button
                          onClick={() => handleCopy(acc.cardNumber, acc.id)}
                          className="text-zinc-400 hover:text-black"
                          title="کپی شماره کارت"
                        >
                          {copiedAccount === acc.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>نوع: {acc.type === "ShopRegister" ? "کارتخوان / دخل" : acc.type === "Cash" ? "صندوق نقد" : "حساب بانکی"}</span>
                  <button
                    onClick={() => handleDelete("bank_account", acc.id)}
                    className="text-zinc-400 hover:text-rose-600 p-1"
                    title="حذف حساب"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CASH REGISTER RECONCILIATION */}
      {activeTab === "CASH_REGISTER" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-700" />
                بستن دخل روزانه، تراز کارتخوان و مغایرت‌گیری صندوق
              </h3>
              <p className="text-[11px] text-zinc-500">
                تطبیق موجودی آغاز روز، فروش پوز، اسکناس نقد، هزینه‌های پرداختی دخل و محاسبه کسری/مازاد
              </p>
            </div>
            <button
              onClick={() => setIsCashRegisterModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 self-start sm:self-center"
            >
              + ثبت بستن دخل امروز
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">تاریخ دخل</th>
                  <th className="p-3">مرکز هزینه / صنف</th>
                  <th className="p-3">کف صندوق صبح</th>
                  <th className="p-3">فروش کارتخوان</th>
                  <th className="p-3">فروش نقد</th>
                  <th className="p-3">هزینه‌های از دخل</th>
                  <th className="p-3">موجودی انتظاری</th>
                  <th className="p-3">شمارش واقعی</th>
                  <th className="p-3">مغایرت (کسری/مازاد)</th>
                  <th className="p-3">وضعیت تراز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {cashRegisters.map((cr) => (
                  <tr key={cr.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 font-mono">{formatPersianDate(cr.date)}</td>
                    <td className="p-3 font-bold text-zinc-900">{cr.costCenter?.name || "بوفه باشگاه"}</td>
                    <td className="p-3 font-mono">{formatCurrency(cr.openingCash)}</td>
                    <td className="p-3 font-mono text-emerald-700">{formatCurrency(cr.posSalesCash)}</td>
                    <td className="p-3 font-mono">{formatCurrency(cr.physicalSalesCash)}</td>
                    <td className="p-3 font-mono text-rose-600">{formatCurrency(cr.expensesCash)}</td>
                    <td className="p-3 font-mono font-bold text-zinc-800">{formatCurrency(cr.expectedClosingCash)}</td>
                    <td className="p-3 font-mono font-bold text-zinc-950">{formatCurrency(cr.actualClosingCash)}</td>
                    <td className="p-3 font-mono font-bold">
                      {cr.difference === 0 ? (
                        <span className="text-emerald-600">۰ (تراز دقیق)</span>
                      ) : cr.difference > 0 ? (
                        <span className="text-blue-600">+{formatCurrency(cr.difference)} (مازاد)</span>
                      ) : (
                        <span className="text-rose-600">{formatCurrency(cr.difference)} (کسری)</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cr.difference === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {cr.difference === 0 ? "تطبیق کامل" : "نیاز به بررسی"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: JOURNAL / TRANSACTIONS */}
      {activeTab === "JOURNAL" && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Coins className="w-4 h-4 text-zinc-700" />
              دفتر روزنامه و ریز گردش تراکنش‌ها
            </h3>
            <span className="text-xs text-zinc-500 font-medium">
              {toPersianDigits(transactions.length)} تراکنش ثبت‌شده
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">نوع تراکنش</th>
                  <th className="p-3">شرح سند</th>
                  <th className="p-3">مرکز هزینه</th>
                  <th className="p-3">حساب مبدأ / مقصد</th>
                  <th className="p-3">مبلغ (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 font-mono text-zinc-500">{formatPersianDate(tx.date)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          tx.type === "Income" || tx.type === "Sale"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.type === "Expense"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {tx.type === "Income" || tx.type === "Sale"
                          ? "واریز / فروش"
                          : tx.type === "Expense"
                          ? "برداشت / هزینه"
                          : "انتقال وجه"}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-zinc-900">{tx.description || "تراکنش مالی"}</td>
                    <td className="p-3 text-zinc-600">{tx.costCenter?.name || "—"}</td>
                    <td className="p-3 text-zinc-500">
                      {tx.accountFrom?.name ? `از ${tx.accountFrom.name}` : ""}
                      {tx.accountTo?.name ? ` به ${tx.accountTo.name}` : ""}
                    </td>
                    <td
                      className={`p-3 font-mono font-black ${
                        tx.type === "Income" || tx.type === "Sale"
                          ? "text-emerald-600"
                          : tx.type === "Expense"
                          ? "text-rose-600"
                          : "text-blue-600"
                      }`}
                    >
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت هزینه جاری جدید</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان هزینه:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً: خرید قهوه و لیوان برای بوفه باشگاه"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">مبلغ (تومان):</label>
                  <input
                    type="number"
                    required
                    placeholder="۸۵۰۰۰۰"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">دسته‌بندی:</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">حساب بانکی مبدأ:</label>
                  <select
                    value={expenseForm.bankAccountId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, bankAccountId: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="">-- بدون کسر مستقیم از حساب --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">مرکز هزینه / صنف:</label>
                  <select
                    value={expenseForm.costCenterId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, costCenterId: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="">-- عمومی / نامشخص --</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">توضیحات و یادداشت:</label>
                <input
                  type="text"
                  placeholder="شماره فاکتور، نام فروشنده یا اقلام..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت هزینه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE FIXED EXPENSE */}
      {isFixedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">تعریف هزینه ثابت ماهانه</h3>
              <button onClick={() => setIsFixedModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFixedExpense} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">عنوان هزینه ثابت:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً: اجاره ماهانه بوفه باشگاه"
                  value={fixedForm.title}
                  onChange={(e) => setFixedForm({ ...fixedForm, title: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">مبلغ ماهانه (تومان):</label>
                  <input
                    type="number"
                    required
                    placeholder="۴۰۰۰۰۰۰"
                    value={fixedForm.amount}
                    onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">دسته‌بندی:</label>
                  <select
                    value={fixedForm.category}
                    onChange={(e) => setFixedForm({ ...fixedForm, category: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">روز سررسید شمسی ماه:</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="۱۰ (دهم ماه)"
                    value={fixedForm.dueDayShamsi}
                    onChange={(e) => setFixedForm({ ...fixedForm, dueDayShamsi: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">روزهای یادآوری قبل از موعد:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={fixedForm.reminderDaysBefore}
                    onChange={(e) => setFixedForm({ ...fixedForm, reminderDaysBefore: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">مرکز هزینه:</label>
                <select
                  value={fixedForm.costCenterId}
                  onChange={(e) => setFixedForm({ ...fixedForm, costCenterId: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                >
                  <option value="">-- عمومی --</option>
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsFixedModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : "ثبت هزینه ثابت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE CHEQUE */}
      {isChequeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">ثبت چک صیادی جدید</h3>
              <button onClick={() => setIsChequeModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheque} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">شماره صیادی چک (۱۶ رقمی):</label>
                  <input
                    type="text"
                    required
                    placeholder="۷۴۸۲۹۱۰۳۸۴"
                    value={chequeForm.chequeNumber}
                    onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نوع چک:</label>
                  <select
                    value={chequeForm.chequeType}
                    onChange={(e) => setChequeForm({ ...chequeForm, chequeType: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-bold"
                  >
                    <option value="PAYABLE">🔴 چک پرداختی من (صادره)</option>
                    <option value="RECEIVABLE">🟢 چک دریافتی (مشتریان)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">مبلغ چک (تومان):</label>
                  <input
                    type="number"
                    required
                    placeholder="۵۲۰۰۰۰۰"
                    value={chequeForm.amount}
                    onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نام بانک:</label>
                  <input
                    type="text"
                    required
                    placeholder="بانک ملت، سامان..."
                    value={chequeForm.bankName}
                    onChange={(e) => setChequeForm({ ...chequeForm, bankName: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>
              </div>

              {/* Shamsi Date Fields */}
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">تاریخ سررسید شمسی:</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="سال (۱۴۰۵)"
                    value={chequeForm.dueYear}
                    onChange={(e) => setChequeForm({ ...chequeForm, dueYear: e.target.value })}
                    className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-center"
                  />
                  <select
                    value={chequeForm.dueMonth}
                    onChange={(e) => setChequeForm({ ...chequeForm, dueMonth: e.target.value })}
                    className="bg-white border border-zinc-200 rounded-xl px-2 py-2 text-zinc-950 font-medium text-center"
                  >
                    {SHAMSI_MONTHS.map((m, idx) => (
                      <option key={m} value={String(idx + 1).padStart(2, "0")}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="روز (۱۰)"
                    value={chequeForm.dueDay}
                    onChange={(e) => setChequeForm({ ...chequeForm, dueDay: e.target.value })}
                    className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">طرف حساب (ذینفع یا صادرکننده):</label>
                  <input
                    type="text"
                    required
                    placeholder="شرکت کاله، شرکت کارفرما..."
                    value={chequeForm.payeeOrPayer}
                    onChange={(e) => setChequeForm({ ...chequeForm, payeeOrPayer: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">مرکز هزینه:</label>
                  <select
                    value={chequeForm.costCenterId}
                    onChange={(e) => setChequeForm({ ...chequeForm, costCenterId: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="">-- عمومی --</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsChequeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت چک"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE BANK ACCOUNT */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">افتتاح حساب بانکی یا صندوق جدید</h3>
              <button onClick={() => setIsBankModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">نام حساب:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثلاً: کارتخوان بوفه باشگاه یا حساب پاسارگاد"
                  value={bankForm.name}
                  onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نام بانک:</label>
                  <input
                    type="text"
                    placeholder="بانک ملت، سامان..."
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">نوع حساب:</label>
                  <select
                    value={bankForm.accountType}
                    onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                  >
                    <option value="Bank">حساب جاری بانکی</option>
                    <option value="ShopRegister">کارتخوان / دستگاه پوز</option>
                    <option value="Cash">صندوق نقدی فیزیکی</option>
                    <option value="Business">حساب تجاری شرکتی</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">شماره کارت (۱۶ رقمی):</label>
                  <input
                    type="text"
                    placeholder="۶۱۰۴۳۳۷۸..."
                    value={bankForm.cardNumber}
                    onChange={(e) => setBankForm({ ...bankForm, cardNumber: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">موجودی اولیه (تومان):</label>
                  <input
                    type="number"
                    placeholder="۰"
                    value={bankForm.balance}
                    onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">مرکز هزینه:</label>
                <select
                  value={bankForm.costCenterId}
                  onChange={(e) => setBankForm({ ...bankForm, costCenterId: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                >
                  <option value="">-- عمومی --</option>
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "افتتاح حساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: TRANSFER FUNDS */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">انتقال وجه بین حساب‌ها</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">از حساب مبدأ:</label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">به حساب مقصد:</label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">مبلغ انتقال (تومان):</label>
                <input
                  type="number"
                  required
                  placeholder="۱۰۰۰۰۰۰"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">شرح انتقال:</label>
                <input
                  type="text"
                  placeholder="انتقال دخل بوفه به حساب شخصی..."
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال انتقال..." : "تأیید و انتقال وجه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CASH REGISTER RECONCILIATION */}
      {isCashRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-950">بستن و تطبیق دخل روزانه</h3>
              <button onClick={() => setIsCashRegisterModalOpen(false)} className="text-zinc-400 hover:text-zinc-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashRegister} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">صنف / مرکز هزینه:</label>
                <select
                  value={crForm.costCenterId}
                  onChange={(e) => setCrForm({ ...crForm, costCenterId: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-medium"
                >
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">کف صندوق صبح (تومان):</label>
                  <input
                    type="number"
                    value={crForm.openingCash}
                    onChange={(e) => setCrForm({ ...crForm, openingCash: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">کل فروش روزانه (تومان):</label>
                  <input
                    type="number"
                    value={crForm.salesCash}
                    onChange={(e) => setCrForm({ ...crForm, salesCash: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">فروش کارتخوان پوز (تومان):</label>
                  <input
                    type="number"
                    value={crForm.posSalesCash}
                    onChange={(e) => setCrForm({ ...crForm, posSalesCash: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">فروش اسکناس نقد فیزیکی (تومان):</label>
                  <input
                    type="number"
                    value={crForm.physicalSalesCash}
                    onChange={(e) => setCrForm({ ...crForm, physicalSalesCash: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">هزینه‌های نقدی پرداختی از دخل:</label>
                  <input
                    type="number"
                    value={crForm.expensesCash}
                    onChange={(e) => setCrForm({ ...crForm, expensesCash: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-rose-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-700 font-bold">برداشت‌های شخصی صاحب کار:</label>
                  <input
                    type="number"
                    value={crForm.withdrawalsCash}
                    onChange={(e) => setCrForm({ ...crForm, withdrawalsCash: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono text-amber-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-700 font-bold">موجودی شمارش‌شده واقعی پایان شب:</label>
                <input
                  type="number"
                  value={crForm.actualClosingCash}
                  onChange={(e) => setCrForm({ ...crForm, actualClosingCash: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-950 font-mono font-black"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsCashRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت و بستن نهایی دخل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
