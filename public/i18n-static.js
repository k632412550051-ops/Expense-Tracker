/**
 * i18n-static.js - Multilingual engine for static pages (about, privacy, terms)
 * Supported languages: vi (Vietnamese, default), en (English), ja (Japanese), ko (Korean), zh (Chinese)
 */

(function() {
  const STORAGE_KEY = 'expense_tracker_language';
  const SUPPORTED_LANGS = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '简体中文', flag: '🇨🇳' }
  ];

  function detectLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.some(l => l.code === saved)) {
        return saved;
      }
    } catch (e) {}

    const browserLangs = navigator.languages && navigator.languages.length 
      ? navigator.languages 
      : [navigator.language || ''];

    for (const lang of browserLangs) {
      const lower = lang.toLowerCase();
      if (lower.startsWith('vi')) return 'vi';
      if (lower.startsWith('en')) return 'en';
      if (lower.startsWith('ja')) return 'ja';
      if (lower.startsWith('ko')) return 'ko';
      if (lower.startsWith('zh')) return 'zh';
    }
    return 'vi';
  }

  const TRANSLATIONS = {
    vi: {
      navHome: "Mở Ứng Dụng Expense Tracker →",
      appName: "Expense Tracker",
      appTagline: "Quản lý chi tiêu thông minh",
      footerRights: "© 2026 Expense Tracker. Tất cả quyền được bảo lưu.",
      aboutTitle: "Giới thiệu Ứng dụng - Expense Tracker",
      aboutBadge: "Tổng quan ứng dụng",
      aboutHeroDesc: "Ứng dụng giúp bạn quản lý tiền bạc thông minh: ghi chép thu chi dễ dàng, kiểm soát hạn mức chi tiêu, tự động đổi tỷ giá tiền tệ và nhắc nhở khi có khoản tiền cho mượn.",
      aboutSecurityTitle: "Bảo mật thông tin của bạn:",
      aboutSecurityDesc: "Dữ liệu của bạn được bảo vệ tuyệt đối, không chia sẻ cho bất kỳ ai và tuân thủ đúng",
      aboutPrivacyLink: "Quy định quyền riêng tư",
      feat1Title: "Ghi chép nhanh chóng",
      feat1Desc: "Nhập các khoản thu chi hàng ngày chỉ với vài thao tác. Ứng dụng tự động vẽ biểu đồ giúp bạn dễ dàng nhìn thấy tiền của mình đi đâu về đâu.",
      feat2Title: "Tránh tiêu lố tay",
      feat2Desc: "Tự đặt ra số tiền tối đa cho mỗi khoản chi (Ăn uống, Đi lại...). Ứng dụng sẽ có thanh màu báo hiệu để bạn biết mình đã tiêu đến đâu.",
      feat3Title: "Đừng quên tiền cho mượn",
      feat3Desc: "Ghi lại những khoản bạn trả tiền hộ bạn bè và hẹn ngày để ứng dụng tự động báo trên trình duyệt, giúp bạn nhớ để đòi lại tiền.",
      feat4Title: "Tính tiền ngoại tệ tự động",
      feat4Desc: "Hỗ trợ nhiều loại tiền tệ (VND, USD, EUR...). Ứng dụng tự động lấy tỷ giá mới nhất để tính toán giúp bạn.",
      feat5Title: "Thoải mái mở app chỗ đông người",
      feat5Desc: "Nút làm mờ số tiền giúp bạn yên tâm sử dụng ở nơi đông người mà không sợ bị nhìn ngó. Dữ liệu của bạn được bảo vệ an toàn.",
      feat6Title: "Lưu trữ không bao giờ mất",
      feat6Desc: "Đăng nhập bằng tài khoản Google để lưu trữ dữ liệu. Dù dùng điện thoại hay máy tính, thông tin của bạn luôn được đồng bộ.",
      privacyTitle: "Chính sách Quyền riêng tư - Expense Tracker",
      privacyBadge: "Chính sách chính thức",
      privacyHeader: "Chính sách Quyền riêng tư",
      privacyMeta: "Hiệu lực: Tháng 9, 2026",
      termsTitle: "Điều khoản Dịch vụ - Expense Tracker",
      termsBadge: "Điều khoản chính thức",
      termsHeader: "Điều khoản Dịch vụ",
      termsMeta: "Cập nhật lần cuối: Tháng 9, 2026"
    },
    en: {
      navHome: "Open Expense Tracker App →",
      appName: "Expense Tracker",
      appTagline: "Smart Expense & Budget Management",
      footerRights: "© 2026 Expense Tracker. All rights reserved.",
      aboutTitle: "About - Expense Tracker",
      aboutBadge: "Official Application Overview",
      aboutHeroDesc: "Smart personal finance management: easily log income & expenses, monitor spending limits, convert live multi-currency rates, and never forget reimbursable loans.",
      aboutSecurityTitle: "Your Privacy Matters:",
      aboutSecurityDesc: "Your financial records are strictly protected, never sold, and comply with our",
      aboutPrivacyLink: "Privacy Policy",
      feat1Title: "Quick Transaction Logging",
      feat1Desc: "Record your daily expenses with a couple of taps. Interactive charts visualize exactly where your money flows.",
      feat2Title: "Prevent Overspending",
      feat2Desc: "Set monthly budgets for categories (Food, Commute, Bills...). Color-coded progress bars keep you on track.",
      feat3Title: "Reimbursement Reminders",
      feat3Desc: "Track work advances and money loaned to friends. Receive browser notifications on the due date so you never lose funds.",
      feat4Title: "Live Multi-Currency Rates",
      feat4Desc: "Supports VND, USD, EUR, JPY and more. Real-time exchange rates auto-convert foreign transactions effortlessly.",
      feat5Title: "Public Privacy Mode",
      feat5Desc: "One-click balance blur lets you safely open the app in public without worrying about prying eyes.",
      feat6Title: "Cloud Synchronization",
      feat6Desc: "Sign in with Google to back up your records seamlessly across all your phones and desktop computers.",
      privacyTitle: "Privacy Policy - Expense Tracker",
      privacyBadge: "Official Policy",
      privacyHeader: "Privacy Policy",
      privacyMeta: "Last updated: March 2026",
      termsTitle: "Terms of Service - Expense Tracker",
      termsBadge: "Official Terms",
      termsHeader: "Terms of Service",
      termsMeta: "Last updated: March 2026"
    },
    ja: {
      navHome: "Expense Trackerアプリを開く →",
      appName: "Expense Tracker",
      appTagline: "スマート家計簿・支出管理",
      footerRights: "© 2026 Expense Tracker. 無断転載を禁じます。",
      aboutTitle: "アプリ概要 - Expense Tracker",
      aboutBadge: "公式アプリ概要",
      aboutHeroDesc: "スマートな支出管理アプリ：手軽な収支記録、カテゴリー別予算管理、リアルタイム多通貨換算、立替金リマインダーで賢く節約。",
      aboutSecurityTitle: "プライバシー保護方針：",
      aboutSecurityDesc: "ユーザーデータは安全に保護され、第三者に共有されることはありません。",
      aboutPrivacyLink: "プライバシーポリシー",
      feat1Title: "素早い支出記録",
      feat1Desc: "数タップで日々の収支を記録。美しいグラフでお金の流れが一目で分かります。",
      feat2Title: "使いすぎを防止",
      feat2Desc: "食費や交通費ごとに月間上限額を設定。カラーインジケーターで予算進捗を直感的に把握できます。",
      feat3Title: "立替金の精算忘れ防止",
      feat3Desc: "友人への貸出金や業務立替を期日付きで記録。ブラウザ通知で回収忘れを防ぎます。",
      feat4Title: "リアルタイム多通貨換算",
      feat4Desc: "VND、USD、EUR、JPYなどに対応。最新レートで外貨での支出も自動換算します。",
      feat5Title: "外出先でも安心のプライバシーモード",
      feat5Desc: "ワンクリックで金額をぼかし、人前や電車内でも安心してアプリを開けます。",
      feat6Title: "Googleアカウント同期",
      feat6Desc: "Googleログインでデータを安全にバックアップ。スマホやPC間で常に最新データが同期されます。",
      privacyTitle: "プライバシーポリシー - Expense Tracker",
      privacyBadge: "公式ポリシー",
      privacyHeader: "プライバシーポリシー",
      privacyMeta: "最終更新日: 2026年3月",
      termsTitle: "利用規約 - Expense Tracker",
      termsBadge: "公式利用規約",
      termsHeader: "利用規約",
      termsMeta: "最終更新日: 2026年3月"
    },
    ko: {
      navHome: "Expense Tracker 앱 열기 →",
      appName: "Expense Tracker",
      appTagline: "스마트 가계부 & 지출 관리",
      footerRights: "© 2026 Expense Tracker. All rights reserved.",
      aboutTitle: "앱 소개 - Expense Tracker",
      aboutBadge: "공식 앱 개요",
      aboutHeroDesc: "스마트한 개인 재정 관리: 손쉬운 수입/지출 기록, 예산 한도 관리, 실시간 다중 통화 환율 변환 및 선결제 정산 리마인더 기능 제공.",
      aboutSecurityTitle: "개인정보 보호 약속:",
      aboutSecurityDesc: "사용자의 금융 정보는 철저히 보호되며 외부에 공유되지 않습니다.",
      aboutPrivacyLink: "개인정보 처리방침",
      feat1Title: "빠른 수입/지출 기록",
      feat1Desc: "간단한 터치 몇 번으로 일상 거래를 기록하세요. 시각적인 차트로 지출 흐름을 한눈에 파악합니다.",
      feat2Title: "과소비 방지 예산 관리",
      feat2Desc: "식비, 교통비 등 카테고리별 월간 한도를 설정하고 직관적인 컬러 바로 예산 소진 현황을 확인하세요.",
      feat3Title: "선결제 및 정산 리마인더",
      feat3Desc: "업무상 선결제나 친구에게 빌려준 돈을 정산일과 함께 등록하여 브라우저 알림으로 잊지 않고 챙기세요.",
      feat4Title: "실시간 다중 통화 환율",
      feat4Desc: "VND, USD, EUR, KRW, JPY 등 지원. 최신 환율 정보로 외화 결제 금액을 자동 계산합니다.",
      feat5Title: "공공장소 안심 개인정보 모드",
      feat5Desc: "한 번의 클릭으로 금액을 블러 처리하여 주변 사람들의 시선 걱정 없이 자유롭게 기록하세요.",
      feat6Title: "Google 클라우드 동기화",
      feat6Desc: "Google 계정으로 로그인하여 스마트폰과 PC 어디서나 안전하게 데이터를 실시간 동기화하세요.",
      privacyTitle: "개인정보 처리방침 - Expense Tracker",
      privacyBadge: "공식 방침",
      privacyHeader: "개인정보 처리방침",
      privacyMeta: "최종 수정일: 2026년 3월",
      termsTitle: "이용약관 - Expense Tracker",
      termsBadge: "공식 약관",
      termsHeader: "이용약관",
      termsMeta: "최종 수정일: 2026년 3월"
    },
    zh: {
      navHome: "打开 Expense Tracker 应用 →",
      appName: "Expense Tracker",
      appTagline: "智能个人记账与支出管理",
      footerRights: "© 2026 Expense Tracker. 版权所有。",
      aboutTitle: "关于我们 - Expense Tracker",
      aboutBadge: "应用官方介绍",
      aboutHeroDesc: "智能个人财务管理：轻松记录日常收支，精准控制预算限额，自动计算实时多币种汇率，垫付还款贴心提醒。",
      aboutSecurityTitle: "您的隐私受严格保护：",
      aboutSecurityDesc: "数据绝不对外共享，严格遵守我们的",
      aboutPrivacyLink: "隐私政策",
      feat1Title: "极速记账体验",
      feat1Desc: "几步即可轻松记录每日收支。直观的可视化图表让您的每一笔开销去向清晰明了。",
      feat2Title: "有效防止超支",
      feat2Desc: "为各项支出（餐饮、交通、房租）设定每月限额，彩色进度条直观提醒预算剩余额度。",
      feat3Title: "垫付款到期提醒",
      feat3Desc: "记录代付款和待报销事项并设置截止日，通过浏览器通知及时提醒，资金回笼不遗漏。",
      feat4Title: "实时多币种折算",
      feat4Desc: "支持 VND、USD、EUR、CNY、JPY 等多种主流货币，自动获取最新汇率折算统计。",
      feat5Title: "公共场合隐私模式",
      feat5Desc: "一键模糊隐藏敏感金额，在人多场合或通勤路上也能安心记账与查阅。",
      feat6Title: "Google 云端跨端同步",
      feat6Desc: "通过 Google 账号安全登录，手机与电脑跨设备数据即时同步，永不丢失记录。",
      privacyTitle: "隐私政策 - Expense Tracker",
      privacyBadge: "官方政策",
      privacyHeader: "隐私政策",
      privacyMeta: "最近更新：2026年3月",
      termsTitle: "服务条款 - Expense Tracker",
      termsBadge: "官方条款",
      termsHeader: "服务条款",
      termsMeta: "最近更新：2026年3月"
    }
  };

  function applyLanguage(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.vi;
    document.documentElement.lang = lang;

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update document title if present
    const pageKey = document.body.getAttribute('data-page-key');
    if (pageKey && dict[pageKey]) {
      document.title = dict[pageKey];
    }

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}

    // Update selector UI active state
    const select = document.getElementById('static-lang-selector');
    if (select && select.value !== lang) {
      select.value = lang;
    }
  }

  function injectLanguageSwitcher() {
    const headerNav = document.querySelector('header .max-w-4xl');
    if (!headerNav || document.getElementById('static-lang-container')) return;

    const container = document.createElement('div');
    container.id = 'static-lang-container';
    container.className = 'flex items-center gap-2';

    const currentLang = detectLanguage();

    const select = document.createElement('select');
    select.id = 'static-lang-selector';
    select.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500';

    SUPPORTED_LANGUAGES_OPTIONS = SUPPORTED_LANGS;
    SUPPORTED_LANGS.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = `${l.flag} ${l.name}`;
      if (l.code === currentLang) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      applyLanguage(e.target.value);
    });

    container.appendChild(select);
    headerNav.appendChild(container);
  }

  window.addEventListener('DOMContentLoaded', () => {
    injectLanguageSwitcher();
    const lang = detectLanguage();
    applyLanguage(lang);
  });
})();
