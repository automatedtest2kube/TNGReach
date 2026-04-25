"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "bm" | "zh";

interface AccessibilityContextType {
  elderlyMode: boolean;
  isElderlyMode: boolean; // alias for backwards compatibility
  setElderlyMode: (value: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (value: boolean) => void;
  chatBubbleEnabled: boolean;
  setChatBubbleEnabled: (value: boolean) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Welcome back",
    walletBalance: "Wallet Balance",
    sendMoney: "Send Money",
    scanPay: "Scan & Pay",
    topUp: "Top Up",
    payBills: "Pay Bills",
    viewSpending: "View Spending",
    recentTransactions: "Recent Transactions",
    seeAll: "See All",
    home: "Home",
    history: "History",
    scan: "Scan",
    cards: "Cards",
    profile: "Profile",
    settings: "Settings",
    notifications: "Notifications",
    language: "Language",
    elderlyMode: "Elderly Mode",
    accessibilitySettings: "Accessibility",
    needHelp: "Need Help?",
    voiceAssistant: "Voice Assistant",
    aiBubble: "Floating AI Bubble",
    parking: "Parking",
    electricity: "Electricity",
    water: "Water",
    internet: "Internet",
    mobile: "Mobile",
    creditCard: "Credit Card",
    insurance: "Insurance",
    education: "Education",
    selectRecipient: "Select Recipient",
    enterAmount: "Enter Amount",
    confirm: "Confirm",
    send: "Send",
    cancel: "Cancel",
    back: "Back",
    next: "Next",
    done: "Done",
    success: "Success",
    failed: "Failed",
    pending: "Pending",
    transfer: "Transfer",
    payment: "Payment",
    received: "Received",
    aiSuggestion: "AI Suggestion",
    spendingInsights: "Spending Insights",
    trustScore: "Trust Score",
    crowdfunding: "Community Support",
    familyModule: "Family",
    // Elderly-friendly simple labels
    myMoney: "My Money",
    sendToFamily: "Send to Family",
    payShop: "Pay at Shop",
    addMoney: "Add Money",
    payBill: "Pay a Bill",
    getHelp: "Get Help",
    tapToSpeak: "Tap & Speak",
    callFamily: "Call Family",
    emergencyHelp: "Emergency",
    whatPaid: "What I Paid",
    moneyIn: "Money Received",
    moneyOut: "Money Sent",
    simpleMode: "Simple Mode On",
    iAmSafe: "You are safe",
    verifiedSecure: "Verified & Secure",
    largeButtons: "Large Buttons & Text",
    helperOnCall: "24/7 Phone Support",
  },
  bm: {
    welcome: "Selamat kembali",
    walletBalance: "Baki Dompet",
    sendMoney: "Hantar Wang",
    scanPay: "Imbas & Bayar",
    topUp: "Tambah Nilai",
    payBills: "Bayar Bil",
    viewSpending: "Lihat Perbelanjaan",
    recentTransactions: "Transaksi Terkini",
    seeAll: "Lihat Semua",
    home: "Utama",
    history: "Sejarah",
    scan: "Imbas",
    cards: "Kad",
    profile: "Profil",
    settings: "Tetapan",
    notifications: "Pemberitahuan",
    language: "Bahasa",
    elderlyMode: "Mod Warga Emas",
    accessibilitySettings: "Aksesibiliti",
    needHelp: "Perlu Bantuan?",
    voiceAssistant: "Pembantu Suara",
    aiBubble: "Gelembung AI Terapung",
    parking: "Parkir",
    electricity: "Elektrik",
    water: "Air",
    internet: "Internet",
    mobile: "Telefon",
    creditCard: "Kad Kredit",
    insurance: "Insurans",
    education: "Pendidikan",
    selectRecipient: "Pilih Penerima",
    enterAmount: "Masukkan Jumlah",
    confirm: "Sahkan",
    send: "Hantar",
    cancel: "Batal",
    back: "Kembali",
    next: "Seterusnya",
    done: "Selesai",
    success: "Berjaya",
    failed: "Gagal",
    pending: "Dalam Proses",
    transfer: "Pindahan",
    payment: "Pembayaran",
    received: "Diterima",
    aiSuggestion: "Cadangan AI",
    spendingInsights: "Analisis Perbelanjaan",
    trustScore: "Skor Kepercayaan",
    crowdfunding: "Sokongan Komuniti",
    familyModule: "Keluarga",
    myMoney: "Duit Saya",
    sendToFamily: "Hantar ke Keluarga",
    payShop: "Bayar di Kedai",
    addMoney: "Tambah Duit",
    payBill: "Bayar Bil",
    getHelp: "Dapatkan Bantuan",
    tapToSpeak: "Tekan & Cakap",
    callFamily: "Panggil Keluarga",
    emergencyHelp: "Kecemasan",
    whatPaid: "Saya Telah Bayar",
    moneyIn: "Duit Diterima",
    moneyOut: "Duit Dihantar",
    simpleMode: "Mod Mudah Aktif",
    iAmSafe: "Anda selamat",
    verifiedSecure: "Disahkan & Selamat",
    largeButtons: "Butang & Teks Besar",
    helperOnCall: "Sokongan Telefon 24/7",
  },
  zh: {
    welcome: "欢迎回来",
    walletBalance: "钱包余额",
    sendMoney: "转账",
    scanPay: "扫码支付",
    topUp: "充值",
    payBills: "缴费",
    viewSpending: "查看消费",
    recentTransactions: "最近交易",
    seeAll: "查看全部",
    home: "首页",
    history: "记录",
    scan: "扫码",
    cards: "卡片",
    profile: "我的",
    settings: "设置",
    notifications: "通知",
    language: "语言",
    elderlyMode: "长辈模式",
    accessibilitySettings: "无障碍设置",
    needHelp: "需要帮助？",
    voiceAssistant: "语音助手",
    aiBubble: "悬浮AI气泡",
    parking: "停车费",
    electricity: "电费",
    water: "水费",
    internet: "网费",
    mobile: "话费",
    creditCard: "信用卡",
    insurance: "保险",
    education: "教育",
    selectRecipient: "选择收款人",
    enterAmount: "输入金额",
    confirm: "确认",
    send: "发送",
    cancel: "取消",
    back: "返回",
    next: "下一步",
    done: "完成",
    success: "成功",
    failed: "失败",
    pending: "处理中",
    transfer: "转账",
    payment: "付款",
    received: "收款",
    aiSuggestion: "智能建议",
    spendingInsights: "消费分析",
    trustScore: "信用评分",
    crowdfunding: "社区互助",
    familyModule: "家庭",
    myMoney: "我的钱",
    sendToFamily: "转给家人",
    payShop: "店里付款",
    addMoney: "充值",
    payBill: "缴费",
    getHelp: "寻求帮助",
    tapToSpeak: "点按说话",
    callFamily: "联系家人",
    emergencyHelp: "紧急求助",
    whatPaid: "我付了什么",
    moneyIn: "收到的钱",
    moneyOut: "付出的钱",
    simpleMode: "简易模式已开启",
    iAmSafe: "您很安全",
    verifiedSecure: "已验证 · 安全",
    largeButtons: "大字体与按钮",
    helperOnCall: "24小时电话支持",
  },
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [elderlyMode, setElderlyMode] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [highContrast, setHighContrast] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [chatBubbleEnabled, setChatBubbleEnabled] = useState(true);

  useEffect(() => {
    if (elderlyMode) {
      document.documentElement.classList.add("elderly-mode");
    } else {
      document.documentElement.classList.remove("elderly-mode");
    }
  }, [elderlyMode]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <AccessibilityContext.Provider
      value={{
        elderlyMode,
        isElderlyMode: elderlyMode, // alias
        setElderlyMode,
        language,
        setLanguage,
        highContrast,
        setHighContrast,
        voiceEnabled,
        setVoiceEnabled,
        chatBubbleEnabled,
        setChatBubbleEnabled,
        t,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
