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
      termsMeta: "Cập nhật lần cuối: Tháng 9, 2026",
      privacyBody: "<h2>1. Giới thiệu</h2>\n    <p>\n      Expense Tracker luôn tôn trọng và bảo vệ thông tin cá nhân của bạn. Dưới đây là cách chúng tôi lưu trữ và bảo vệ dữ liệu khi bạn dùng ứng dụng, được viết bằng ngôn ngữ đơn giản nhất để bạn dễ nắm bắt.\n    </p>\n\n    <h2>2. Những thông tin chúng tôi cần từ bạn</h2>\n    <p>Chúng tôi chỉ xin những thông tin cơ bản nhất để ứng dụng có thể hoạt động hiệu quả:</p>\n    <ul>\n      <li><strong>Tài khoản đăng nhập:</strong> Khi bạn đăng nhập bằng Google, chúng tôi chỉ xin email, tên và ảnh đại diện để tạo một không gian riêng tư cho bạn.</li>\n      <li><strong>Dữ liệu thu chi:</strong> Bao gồm số tiền, danh mục, thời gian và các ghi chú mà bạn tự tay nhập vào ứng dụng.</li>\n      <li><strong>Cài đặt của bạn:</strong> Các giới hạn chi tiêu bạn đặt ra, giao diện sáng/tối, và tùy chọn ẩn số dư.</li>\n      <li><strong>Nhắc nhở hoàn tiền:</strong> Nếu bạn hẹn ngày nhắc trả tiền, ứng dụng sẽ gửi thông báo trực tiếp qua trình duyệt của bạn. Tính năng này chỉ chạy trên máy của bạn.</li>\n    </ul>\n\n    <h2>3. Dữ liệu của bạn được dùng để làm gì?</h2>\n    <p>Thông tin của bạn chỉ được dùng cho các mục đích sau:</p>\n    <ul>\n      <li>Tính toán số tiền còn lại và tự động vẽ biểu đồ chi tiêu cho bạn xem.</li>\n      <li>Lưu trữ an toàn trên hệ thống đám mây của Google (Firebase) để bạn không bị mất dữ liệu khi đổi điện thoại hay máy tính.</li>\n      <li>Gửi thông báo nhắc nhở khi bạn cần đòi tiền bạn bè.</li>\n    </ul>\n\n    <div class=\"p-5 my-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm\">\n      <strong class=\"text-blue-800 dark:text-blue-300\">Cam kết bảo vệ từ Google:</strong><br/>\n      Việc ứng dụng kết nối với hệ thống đăng nhập của Google tuân thủ nghiêm ngặt các quy định bảo mật của họ. Dữ liệu của bạn luôn bị giới hạn quyền truy cập một cách chặt chẽ theo <a href=\"https://developers.google.com/terms/api-services-user-data-policy\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-medium hover:underline text-blue-600 dark:text-blue-400\">Chính sách Dữ liệu Người dùng của Google</a>.\n    </div>\n\n    <h2>4. Chúng tôi không bao giờ bán dữ liệu</h2>\n    <ul>\n      <li><strong>Không bán thông tin:</strong> Chúng tôi tuyệt đối không bán, không cho thuê và không chia sẻ thông tin cá nhân hay lịch sử chi tiêu của bạn cho bất kỳ ai.</li>\n      <li><strong>Không quảng cáo:</strong> Dữ liệu của bạn không bao giờ bị dùng để theo dõi hay chạy quảng cáo.</li>\n      <li><strong>Máy chủ an toàn:</strong> Ứng dụng được chạy trên hệ thống đám mây của Google, nơi có các chứng chỉ bảo mật an toàn nhất thế giới.</li>\n    </ul>\n\n    <h2>5. Mọi thứ đều được mã hóa an toàn</h2>\n    <p>\n      Dữ liệu của bạn luôn được mã hóa an toàn trên đường truyền và tại máy chủ. Ngay cả bản thân người làm ra ứng dụng (nhà phát triển) cũng hoàn toàn không có khả năng đọc được chi tiết các khoản chi tiêu của bạn.\n    </p>\n\n    <h2>6. Quyền xóa dữ liệu của bạn</h2>\n    <p>Bạn luôn có toàn quyền kiểm soát dữ liệu của mình:</p>\n    <ul>\n      <li><strong>Tự xóa giao dịch:</strong> Bạn có thể tự mình sửa hoặc xóa bất kỳ giao dịch nào trực tiếp trong ứng dụng.</li>\n      <li><strong>Xóa toàn bộ tài khoản vĩnh viễn:</strong> Nếu bạn không muốn dùng app nữa và muốn xóa sạch sẽ dữ liệu của mình trên máy chủ, chỉ cần gửi một email cho nhà phát triển (tại <strong>k63.2412550051@ftu.edu.vn</strong>). Yêu cầu sẽ được xử lý rất nhanh chóng.</li>\n    </ul>\n\n    <h2>7. Cần hỗ trợ?</h2>\n    <p>Nếu bạn có bất kỳ câu hỏi nào về quyền riêng tư, đừng ngại liên hệ:</p>\n    <ul>\n      <li><strong>Email hỗ trợ:</strong> <a href=\"mailto:k63.2412550051@ftu.edu.vn\">k63.2412550051@ftu.edu.vn</a></li>\n      <li><strong>Nhà phát triển:</strong> Expense Tracker</li>\n      <li><strong>Trang chủ dự án:</strong> <a href=\"/\">Trang chủ Expense Tracker</a></li>\n    </ul>",
      termsBody: "<h2>1. Đồng ý với các quy định</h2>\n    <p>\n      Khi bạn sử dụng ứng dụng <strong>Expense Tracker</strong>, điều đó đồng nghĩa là bạn đã đọc và đồng ý với những quy định dưới đây. Nếu cảm thấy không phù hợp, bạn hoàn toàn có quyền ngừng sử dụng ứng dụng bất cứ lúc nào.\n    </p>\n\n    <h2>2. Ứng dụng này dùng để làm gì?</h2>\n    <p>\n      Expense Tracker là ứng dụng giúp bạn quản lý tiền bạc dễ dàng hơn: ghi chép thu chi, đặt số tiền tối đa được tiêu, theo dõi tỷ giá ngoại tệ và tạo thông báo nhắc nhở khi cần. Dữ liệu của bạn được sao lưu an toàn tự động qua tài khoản Google.\n    </p>\n\n    <h2>3. Trách nhiệm của bạn</h2>\n    <ul>\n      <li>Bạn hãy tự bảo vệ tài khoản Google của mình để không bị người khác lấy thông tin.</li>\n      <li>Không dùng ứng dụng cho mục đích xấu hay vi phạm pháp luật.</li>\n      <li>Đây chỉ là công cụ giúp bạn ghi chép tiền bạc cá nhân, không phải là một chuyên gia tư vấn đầu tư tài chính. Bạn tự chịu trách nhiệm với cách tiêu tiền của mình.</li>\n    </ul>\n\n    <h2>4. Dữ liệu của ai, người nấy giữ</h2>\n    <p>\n      Toàn bộ thiết kế, giao diện và mã code của ứng dụng thuộc về người tạo ra nó (nhà phát triển). Tuy nhiên, toàn bộ dữ liệu chi tiêu mà bạn nhập vào thì <strong>100% thuộc về bạn</strong>, không ai được phép đụng vào.\n    </p>\n\n    <h2>5. Giới hạn rủi ro</h2>\n    <p>\n      Chúng tôi luôn cố gắng giữ cho ứng dụng chạy ổn định và mượt mà nhất. Tuy nhiên, nếu có sự cố rớt mạng làm bạn không lưu được dữ liệu, hoặc bạn tự đưa ra quyết định mua bán sai lầm dựa trên số liệu tự nhập, chúng tôi sẽ không thể chịu trách nhiệm thay bạn.\n    </p>\n\n    <h2>6. Thay đổi quy định</h2>\n    <p>\n      Đôi khi chúng tôi sẽ phải chỉnh sửa lại các quy định này cho hợp lý hơn khi có thêm tính năng mới, và mọi sự thay đổi sẽ luôn được viết rõ ràng ở ngay trên trang web này.\n    </p>\n\n    <h2>7. Liên hệ</h2>\n    <p>Nếu có thắc mắc gì về các quy định này, bạn cứ thoải mái gửi email về: <strong>k63.2412550051@ftu.edu.vn</strong>.</p>"
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
      termsMeta: "Last updated: March 2026",
      privacyBody: "\n    <h2>1. Introduction</h2>\n    <p>Expense Tracker respects and protects your personal information. Below is how we store and protect your data when you use the app, written in the simplest language for you to grasp.</p>\n    <h2>2. Information We Need From You</h2>\n    <p>We only ask for the most basic information for the app to function effectively:</p>\n    <ul>\n      <li><strong>Login Account:</strong> When you log in with Google, we only ask for your email, name, and avatar to create a private space for you.</li>\n      <li><strong>Transaction Data:</strong> Includes amount, category, time, and notes you manually enter into the app.</li>\n      <li><strong>Your Settings:</strong> The spending limits you set, light/dark mode, and option to hide balance.</li>\n      <li><strong>Reimbursement Reminders:</strong> If you schedule a reminder, the app will send a direct notification via your browser. This feature runs entirely on your local machine.</li>\n    </ul>\n    <h2>3. What Is Your Data Used For?</h2>\n    <p>Your information is only used for the following purposes:</p>\n    <ul>\n      <li>Calculating your remaining balance and auto-drawing spending charts for you.</li>\n      <li>Safely storing on Google Cloud (Firebase) so you don't lose data when switching devices.</li>\n      <li>Sending reminders when you need to collect money from friends.</li>\n    </ul>\n    <div class=\"p-5 my-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm\">\n      <strong class=\"text-blue-800 dark:text-blue-300\">Google Protection Commitment:</strong><br/>\n      Our app's connection to Google Login strictly adheres to their security regulations. Your data access is tightly restricted per the <a href=\"https://developers.google.com/terms/api-services-user-data-policy\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-medium hover:underline text-blue-600 dark:text-blue-400\">Google API Services User Data Policy</a>.\n    </div>\n    <h2>4. We Never Sell Your Data</h2>\n    <ul>\n      <li><strong>No Selling:</strong> We absolutely do not sell, rent, or share your personal info or spending history to anyone.</li>\n      <li><strong>No Ads:</strong> Your data is never used for tracking or running advertisements.</li>\n      <li><strong>Secure Servers:</strong> The app runs on Google Cloud, boasting the world's safest security certificates.</li>\n    </ul>\n    <h2>5. Everything Is Safely Encrypted</h2>\n    <p>Your data is always securely encrypted in transit and at rest on the server. Even the app creator (developer) cannot read the details of your spending.</p>\n    <h2>6. Your Right To Delete Data</h2>\n    <p>You always have full control over your data:</p>\n    <ul>\n      <li><strong>Self-delete transactions:</strong> You can edit or delete any transaction directly in the app.</li>\n      <li><strong>Permanent Account Deletion:</strong> If you stop using the app and want to completely wipe your data from the server, simply email the developer at <strong>k63.2412550051@ftu.edu.vn</strong>. The request will be processed very swiftly.</li>\n    </ul>\n    <h2>7. Need Help?</h2>\n    <p>If you have any questions regarding privacy, don't hesitate to reach out:</p>\n    <ul>\n      <li><strong>Support Email:</strong> <a href=\"mailto:k63.2412550051@ftu.edu.vn\">k63.2412550051@ftu.edu.vn</a></li>\n      <li><strong>Developer:</strong> Expense Tracker</li>\n      <li><strong>Project Homepage:</strong> <a href=\"/\">Expense Tracker Home</a></li>\n    </ul>\n",
      termsBody: "\n    <h2>1. Agreement to Terms</h2>\n    <p>By using the <strong>Expense Tracker</strong> app, you signify that you have read and agreed to the terms below. If you feel they are not suitable, you have the full right to stop using the app at any time.</p>\n    <h2>2. What Is This App For?</h2>\n    <p>Expense Tracker helps you manage money easier: log transactions, set maximum spending limits, track currency exchange rates, and create reminders. Your data is automatically and safely backed up via your Google account.</p>\n    <h2>3. Your Responsibilities</h2>\n    <ul>\n      <li>Please protect your own Google account so others cannot access your info.</li>\n      <li>Do not use the app for malicious or illegal purposes.</li>\n      <li>This is merely a tool to help you log personal finances, not a financial investment advisor. You are solely responsible for how you spend your money.</li>\n    </ul>\n    <h2>4. Your Data Belongs To You</h2>\n    <p>All app design, interface, and code belong to its creator (developer). However, <strong>100% of the spending data you enter belongs to you</strong>; no one is allowed to touch it.</p>\n    <h2>5. Limitation of Liability</h2>\n    <p>We always strive to keep the app running as stable and smooth as possible. However, if a network outage prevents your data from saving, or if you make a bad financial decision based on manually entered figures, we cannot be held responsible on your behalf.</p>\n    <h2>6. Changes to Terms</h2>\n    <p>Occasionally, we may revise these terms to be more reasonable when adding new features. Any changes will always be clearly stated right on this website.</p>\n    <h2>7. Contact</h2>\n    <p>If you have any questions regarding these terms, feel free to email: <strong>k63.2412550051@ftu.edu.vn</strong>.</p>\n"
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
      termsMeta: "最終更新日: 2026年3月",
      privacyBody: "\n    <h2>1. はじめに</h2>\n    <p>Expense Trackerはお客様の個人情報を尊重し保護します。ここでは、当アプリを安心してご利用いただくために、データをどのように保存・保護しているかについてわかりやすく説明します。</p>\n    <h2>2. 収集する情報</h2>\n    <p>アプリが効果的に機能するために、最低限の基本情報のみを収集します：</p>\n    <ul>\n      <li><strong>ログインアカウント：</strong> Googleでログインする際、プライベートな空間を作成するためにメールアドレス、名前、プロフィール画像のみを取得します。</li>\n      <li><strong>収支データ：</strong> アプリに手入力された金額、カテゴリー、時間、メモなどが含まれます。</li>\n      <li><strong>設定情報：</strong> お客様が設定した予算上限、ダークモード設定、残高非表示オプションなど。</li>\n      <li><strong>立替金リマインダー：</strong> リマインダーを設定すると、ブラウザ経由で直接通知が送信されます。この機能はお客様の端末上でのみ動作します。</li>\n    </ul>\n    <h2>3. データの利用目的</h2>\n    <p>お客様の情報は以下の目的にのみ利用されます：</p>\n    <ul>\n      <li>残高の計算および支出グラフの自動作成。</li>\n      <li>端末変更時にデータを失わないためのGoogle Cloud (Firebase) での安全な保存。</li>\n      <li>立替金の回収が必要な際のリマインダー通知。</li>\n    </ul>\n    <div class=\"p-5 my-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm\">\n      <strong class=\"text-blue-800 dark:text-blue-300\">Googleによる保護の確約：</strong><br/>\n      Googleログインによるアプリの連携は、彼らのセキュリティ規定を厳格に遵守しています。お客様のデータへのアクセスは<a href=\"https://developers.google.com/terms/api-services-user-data-policy\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-medium hover:underline text-blue-600 dark:text-blue-400\">Google API サービスのユーザーデータポリシー</a>に則り、厳密に制限されています。\n    </div>\n    <h2>4. データの販売は一切行いません</h2>\n    <ul>\n      <li><strong>販売の禁止：</strong> 個人情報や支出履歴を第三者に販売、貸与、共有することは絶対にありません。</li>\n      <li><strong>広告なし：</strong> データが追跡や広告配信の目的で使用されることは一切ありません。</li>\n      <li><strong>安全なサーバー：</strong> アプリは世界最高水準のセキュリティ証明書を備えたGoogle Cloud上で稼働しています。</li>\n    </ul>\n    <h2>5. すべてが安全に暗号化されます</h2>\n    <p>データは常に通信中およびサーバー上で安全に暗号化されます。アプリの開発者でさえ、お客様の支出の詳細を読み取ることはできません。</p>\n    <h2>6. データの削除権</h2>\n    <p>お客様は常に自分のデータを完全に管理する権利を持ちます：</p>\n    <ul>\n      <li><strong>取引の自己削除：</strong> アプリ内で直接、任意の取引を編集または削除できます。</li>\n      <li><strong>アカウントの完全削除：</strong> アプリの使用を中止し、サーバー上のデータを完全に消去したい場合は、開発者（<strong>k63.2412550051@ftu.edu.vn</strong>）にメールを送信してください。リクエストは迅速に処理されます。</li>\n    </ul>\n    <h2>7. お問い合わせ</h2>\n    <p>プライバシーに関するご質問がございましたら、お気軽にお問い合わせください：</p>\n    <ul>\n      <li><strong>サポートメール：</strong> <a href=\"mailto:k63.2412550051@ftu.edu.vn\">k63.2412550051@ftu.edu.vn</a></li>\n      <li><strong>開発者：</strong> Expense Tracker</li>\n      <li><strong>プロジェクトホームページ：</strong> <a href=\"/\">Expense Tracker ホーム</a></li>\n    </ul>\n",
      termsBody: "\n    <h2>1. 規約への同意</h2>\n    <p><strong>Expense Tracker</strong> アプリを利用することにより、以下の規約を読み、同意したものとみなされます。不適切だと感じた場合は、いつでもアプリの利用を中止する権利があります。</p>\n    <h2>2. アプリの目的</h2>\n    <p>Expense Trackerは、収支の記録、支出上限の設定、為替レートの追跡、リマインダーの作成など、お金の管理を簡単にするアプリです。データはGoogleアカウントを通じて自動的かつ安全にバックアップされます。</p>\n    <h2>3. ユーザーの責任</h2>\n    <ul>\n      <li>他人に情報を盗まれないよう、ご自身のGoogleアカウントを保護してください。</li>\n      <li>悪意のある目的や違法行為のためにアプリを使用しないでください。</li>\n      <li>本アプリは個人の家計記録を支援するツールであり、金融投資の専門アドバイザーではありません。資金の使途についてはご自身で責任を負うものとします。</li>\n    </ul>\n    <h2>4. データの所有権</h2>\n    <p>アプリのデザイン、インターフェース、およびコードのすべての権利は制作者（開発者）に帰属します。ただし、入力された<strong>支出データは100%お客様のもの</strong>であり、誰もそれに触れることは許されません。</p>\n    <h2>5. 免責事項</h2>\n    <p>私たちはアプリが常に安定してスムーズに動作するよう努めています。しかし、ネットワーク障害によりデータが保存されなかった場合や、手入力した数値に基づいて誤った財務決定を下した場合でも、私たちは責任を負いかねます。</p>\n    <h2>6. 規約の変更</h2>\n    <p>新機能の追加時などに、これらの規約をより合理的な内容に修正する場合があります。変更があった場合は、必ず本ウェブサイト上に明記されます。</p>\n    <h2>7. お問い合わせ</h2>\n    <p>これらの規約に関するご質問がございましたら、お気軽にメールでお問い合わせください：<strong>k63.2412550051@ftu.edu.vn</strong></p>\n"
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
      termsMeta: "최종 수정일: 2026년 3월",
      privacyBody: "\n    <h2>1. 소개</h2>\n    <p>Expense Tracker는 사용자의 개인 정보를 존중하고 보호합니다. 아래는 사용자가 쉽게 이해할 수 있도록 가장 평이한 언어로 작성된, 앱 사용 시 데이터를 저장하고 보호하는 방법에 대한 설명입니다.</p>\n    <h2>2. 수집하는 정보</h2>\n    <p>앱이 효과적으로 작동하기 위해 필요한 가장 기본적인 정보만 요청합니다:</p>\n    <ul>\n      <li><strong>로그인 계정:</strong> Google로 로그인할 때, 사용자만의 프라이빗 공간을 만들기 위해 이메일, 이름, 프로필 사진만 요청합니다.</li>\n      <li><strong>거래 데이터:</strong> 사용자가 앱에 직접 입력한 금액, 카테고리, 시간 및 메모가 포함됩니다.</li>\n      <li><strong>사용자 설정:</strong> 설정한 지출 한도, 라이트/다크 모드, 잔액 숨기기 옵션 등.</li>\n      <li><strong>정산 리마인더:</strong> 알림을 설정하면 앱이 브라우저를 통해 직접 알림을 보냅니다. 이 기능은 전적으로 사용자의 기기에서만 실행됩니다.</li>\n    </ul>\n    <h2>3. 데이터 사용 목적</h2>\n    <p>사용자의 정보는 다음 목적으로만 사용됩니다:</p>\n    <ul>\n      <li>남은 잔액을 계산하고 지출 차트를 자동으로 생성.</li>\n      <li>기기를 변경할 때 데이터가 손실되지 않도록 Google Cloud (Firebase)에 안전하게 저장.</li>\n      <li>친구에게서 돈을 받아야 할 때 리마인더 알림 전송.</li>\n    </ul>\n    <div class=\"p-5 my-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm\">\n      <strong class=\"text-blue-800 dark:text-blue-300\">Google 보호 약속:</strong><br/>\n      Google 로그인을 통한 앱 연결은 Google의 보안 규정을 엄격하게 준수합니다. 데이터 접근은 <a href=\"https://developers.google.com/terms/api-services-user-data-policy\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-medium hover:underline text-blue-600 dark:text-blue-400\">Google API 서비스 사용자 데이터 정책</a>에 따라 엄격히 제한됩니다.\n    </div>\n    <h2>4. 데이터 판매 절대 금지</h2>\n    <ul>\n      <li><strong>판매 금지:</strong> 당사는 사용자의 개인 정보나 지출 내역을 절대 누구에게도 판매, 대여 또는 공유하지 않습니다.</li>\n      <li><strong>광고 없음:</strong> 사용자의 데이터는 추적이나 광고 게재 목적으로 절대 사용되지 않습니다.</li>\n      <li><strong>안전한 서버:</strong> 이 앱은 세계에서 가장 안전한 보안 인증을 갖춘 Google Cloud에서 실행됩니다.</li>\n    </ul>\n    <h2>5. 모든 데이터의 안전한 암호화</h2>\n    <p>사용자의 데이터는 전송 중이거나 서버에 보관될 때 항상 안전하게 암호화됩니다. 앱 개발자조차도 사용자의 지출 세부 내역을 읽을 수 없습니다.</p>\n    <h2>6. 데이터 삭제 권리</h2>\n    <p>사용자는 항상 자신의 데이터에 대한 모든 통제권을 가집니다:</p>\n    <ul>\n      <li><strong>거래 직접 삭제:</strong> 앱에서 직접 거래 내역을 수정하거나 삭제할 수 있습니다.</li>\n      <li><strong>계정 영구 삭제:</strong> 앱 사용을 중지하고 서버에서 데이터를 완전히 삭제하고 싶다면 개발자(<strong>k63.2412550051@ftu.edu.vn</strong>)에게 이메일을 보내주세요. 요청은 매우 신속하게 처리됩니다.</li>\n    </ul>\n    <h2>7. 도움이 필요하신가요?</h2>\n    <p>개인정보 보호와 관련된 질문이 있다면 언제든지 문의해 주세요:</p>\n    <ul>\n      <li><strong>지원 이메일:</strong> <a href=\"mailto:k63.2412550051@ftu.edu.vn\">k63.2412550051@ftu.edu.vn</a></li>\n      <li><strong>개발자:</strong> Expense Tracker</li>\n      <li><strong>프로젝트 홈페이지:</strong> <a href=\"/\">Expense Tracker 홈</a></li>\n    </ul>\n",
      termsBody: "\n    <h2>1. 약관 동의</h2>\n    <p><strong>Expense Tracker</strong> 앱을 사용함으로써 귀하는 아래 약관을 읽고 동의했음을 의미합니다. 부적절하다고 판단되는 경우 언제든지 앱 사용을 중단할 수 있는 모든 권리가 있습니다.</p>\n    <h2>2. 앱의 목적</h2>\n    <p>Expense Tracker는 거래 기록, 최대 지출 한도 설정, 환율 추적 및 리마인더 생성을 통해 돈 관리를 더 쉽게 해주는 앱입니다. 데이터는 Google 계정을 통해 자동으로 안전하게 백업됩니다.</p>\n    <h2>3. 사용자의 책임</h2>\n    <ul>\n      <li>타인이 정보에 접근하지 못하도록 본인의 Google 계정을 보호해 주세요.</li>\n      <li>악의적이거나 불법적인 목적으로 앱을 사용하지 마십시오.</li>\n      <li>이 앱은 개인 재정 기록을 돕는 도구일 뿐, 금융 투자 자문가가 아닙니다. 자금 지출에 대한 책임은 전적으로 귀하에게 있습니다.</li>\n    </ul>\n    <h2>4. 데이터 소유권</h2>\n    <p>앱 디자인, 인터페이스 및 코드의 모든 권리는 제작자(개발자)에게 있습니다. 하지만 귀하가 입력한 <strong>지출 데이터는 100% 귀하의 소유</strong>이며, 누구도 건드릴 수 없습니다.</p>\n    <h2>5. 책임의 한계</h2>\n    <p>저희는 항상 앱이 안정적이고 원활하게 작동하도록 최선을 다하고 있습니다. 그러나 네트워크 장애로 인해 데이터가 저장되지 않거나, 수동으로 입력한 수치를 바탕으로 잘못된 재무 결정을 내린 경우 당사가 책임지지 않습니다.</p>\n    <h2>6. 약관 변경</h2>\n    <p>새로운 기능이 추가될 때 이러한 약관을 더 합리적으로 수정할 수 있습니다. 변경 사항은 항상 이 웹사이트에 명확하게 명시됩니다.</p>\n    <h2>7. 문의</h2>\n    <p>본 약관과 관련하여 질문이 있는 경우 언제든지 이메일로 문의해 주세요: <strong>k63.2412550051@ftu.edu.vn</strong></p>\n"
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
      termsMeta: "最近更新：2026年3月",
      privacyBody: "\n    <h2>1. 简介</h2>\n    <p>Expense Tracker 尊重并保护您的个人信息。以下是我们如何存储和保护您在使用本应用时的 数据，为了让您轻松理解，我们使用了最通俗易懂的语言。</p>\n    <h2>2. 我们需要您提供的信息</h2>\n    <p>为了让应用正常运作，我们仅要求提供最基本的信息：</p>\n    <ul>\n      <li><strong>登录账号：</strong> 当您使用 Google 登录时，我们仅请求您的电子邮件、姓名和头像，以为您创建一个私人空间。</li>\n      <li><strong>交易数据：</strong> 包括您手动录入的金额、类别、时间以及备注等。</li>\n      <li><strong>您的设置：</strong> 您设定的支出限额、深色/浅色模式以及隐藏余额选项等。</li>\n      <li><strong>报销提醒：</strong> 如果您设定了还款提醒，应用会直接通过浏览器发送通知。此功能完全在您的本地设备上运行。</li>\n    </ul>\n    <h2>3. 您的数据用于何处？</h2>\n    <p>您的信息仅用于以下目的：</p>\n    <ul>\n      <li>计算您的剩余余额并自动为您绘制支出图表。</li>\n      <li>安全地存储在 Google 云端 (Firebase) 上，确保您更换设备时不会丢失数据。</li>\n      <li>在您需要向朋友收款时发送提醒通知。</li>\n    </ul>\n    <div class=\"p-5 my-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm\">\n      <strong class=\"text-blue-800 dark:text-blue-300\">Google 保护承诺：</strong><br/>\n      本应用与 Google 登录的连接严格遵守其安全规定。根据 <a href=\"https://developers.google.com/terms/api-services-user-data-policy\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"font-medium hover:underline text-blue-600 dark:text-blue-400\">Google API 服务用户数据政策</a>，您的数据访问权限受到严格限制。\n    </div>\n    <h2>4. 我们绝不出售您的数据</h2>\n    <ul>\n      <li><strong>不出售：</strong> 我们绝对不会向任何人出售、出租或共享您的个人信息或支出记录。</li>\n      <li><strong>无广告：</strong> 您的数据绝不会用于追踪或投放广告。</li>\n      <li><strong>安全服务器：</strong> 本应用运行在 Google Cloud 上，拥有全球最顶级的安全认证。</li>\n    </ul>\n    <h2>5. 一切均经过安全加密</h2>\n    <p>您的数据在传输过程中及服务器端均始终保持安全加密。即便是应用的创建者（开发者）也无法读取您的详细支出信息。</p>\n    <h2>6. 您删除数据的权利</h2>\n    <p>您始终拥有对自身数据的完全控制权：</p>\n    <ul>\n      <li><strong>自行删除交易：</strong> 您可以直接在应用中编辑或删除任何交易记录。</li>\n      <li><strong>永久注销账号：</strong> 如果您不再使用本应用，并希望彻底清除服务器上的数据，只需给开发者发送邮件 (<strong>k63.2412550051@ftu.edu.vn</strong>)。您的请求将会被迅速处理。</li>\n    </ul>\n    <h2>7. 需要帮助？</h2>\n    <p>如果您对隐私政策有任何疑问，请随时联系我们：</p>\n    <ul>\n      <li><strong>支持邮箱：</strong> <a href=\"mailto:k63.2412550051@ftu.edu.vn\">k63.2412550051@ftu.edu.vn</a></li>\n      <li><strong>开发者：</strong> Expense Tracker</li>\n      <li><strong>项目主页：</strong> <a href=\"/\">Expense Tracker 首页</a></li>\n    </ul>\n",
      termsBody: "\n    <h2>1. 接受条款</h2>\n    <p>通过使用 <strong>Expense Tracker</strong> 应用，即表示您已阅读并同意以下条款。如果您认为这些条款不合适，您有权随时停止使用本应用。</p>\n    <h2>2. 本应用的用途</h2>\n    <p>Expense Tracker 帮助您更轻松地管理财务：记录收支、设置最高消费额度、追踪汇率并创建提醒。您的数据会通过您的 Google 账号安全自动地进行备份。</p>\n    <h2>3. 您的责任</h2>\n    <ul>\n      <li>请妥善保护您自己的 Google 账号，以免他人获取您的信息。</li>\n      <li>请勿将本应用用于恶意或非法目的。</li>\n      <li>这仅仅是一个帮助您记录个人财务的工具，而非金融投资顾问。您需对自己花钱的方式全权负责。</li>\n    </ul>\n    <h2>4. 您的数据属于您</h2>\n    <p>本应用的所有设计、界面及代码版权均归创建者（开发者）所有。然而，<strong>您输入的支出数据 100% 属于您自己</strong>；任何人均无权干涉。</p>\n    <h2>5. 责任限制</h2>\n    <p>我们始终努力保持应用稳定、流畅地运行。但是，如果因网络故障导致您的数据未能保存，或者您根据手动录入的数据做出了错误的财务决定，我们无法为您承担责任。</p>\n    <h2>6. 条款变更</h2>\n    <p>在添加新功能时，我们可能会偶尔修改这些条款，使其更为合理。任何更改都会始终在本网站上明确标示。</p>\n    <h2>7. 联系方式</h2>\n    <p>如果您对这些条款有任何疑问，欢迎发送电子邮件至：<strong>k63.2412550051@ftu.edu.vn</strong></p>\n"
    }
  };

  function applyLanguage(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.vi;
    document.documentElement.lang = lang;

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        if(el.hasAttribute('data-i18n-html')){el.innerHTML=dict[key];}else{el.textContent=dict[key];}
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
