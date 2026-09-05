import { PersonaType, CurrencyCode } from '../types';

export interface PersonaDetails {
  id: PersonaType;
  title: string;
  tagline: string;
  recommendedMonthlyBudgetVND: number;
  recommendedMonthlyBudgetUSD: number;
  description: string;
  focusAreas: string[];
  defaultCategories: string[];
  categoryColors: Record<string, string>;
  categoryBudgetsVND: Record<string, number>;
  defaultIncomeCategories: string[];
  quickNoteSuggestions: string[];
  financialAdvice: string;
}

export const PERSONA_CONFIGS: Record<PersonaType, PersonaDetails> = {
  student: {
    id: 'student',
    title: 'Học sinh / Sinh viên',
    tagline: 'Tối ưu sinh hoạt phí, tiết kiệm & kiểm soát ăn uống',
    recommendedMonthlyBudgetVND: 5000000,
    recommendedMonthlyBudgetUSD: 500,
    description: 'Thiết kế riêng cho sinh viên & du học sinh: kiểm soát chi phí thuê trọ, tiền ăn hàng ngày, tài liệu học tập và các buổi tụ tập bạn bè.',
    focusAreas: ['Tiền phòng & Ký túc xá', 'Ăn uống & Căng tin', 'Học tập & Giáo trình', 'Săn ưu đãi sinh viên'],
    defaultCategories: [
      'Ăn uống & Căng tin',
      'Tiền trọ & Ký túc xá',
      'Học tập & Sách vở',
      'Đi lại & Xe buýt',
      'Cà phê & Giao lưu bạn bè',
      'Chi tiêu phát sinh'
    ],
    categoryColors: {
      'Ăn uống & Căng tin': '#F59E0B',
      'Tiền trọ & Ký túc xá': '#EF4444',
      'Học tập & Sách vở': '#3B82F6',
      'Đi lại & Xe buýt': '#F97316',
      'Cà phê & Giao lưu bạn bè': '#8B5CF6',
      'Chi tiêu phát sinh': '#6B7280'
    },
    categoryBudgetsVND: {
      'Ăn uống & Căng tin': 2000000,
      'Tiền trọ & Ký túc xá': 1800000,
      'Học tập & Sách vở': 400000,
      'Đi lại & Xe buýt': 300000,
      'Cà phê & Giao lưu bạn bè': 300000,
      'Chi tiêu phát sinh': 200000
    },
    defaultIncomeCategories: [
      'Trợ cấp từ gia đình',
      'Làm thêm (Part-time)',
      'Học bổng',
      'Nhận tiền trả hộ',
      'Khác'
    ],
    quickNoteSuggestions: [
      'Cơm trưa căng tin',
      'Tiền phòng trọ',
      'Giáo trình photo',
      'Trà sữa bạn bè',
      'Vé tháng xe buýt',
      'Đi siêu thị'
    ],
    financialAdvice: 'Mẹo cho sinh viên: Nấu ăn tại nhà và dùng thẻ sinh viên để giảm giá vé xe, dịch vụ công nghệ.'
  },
  worker: {
    id: 'worker',
    title: 'Người đi làm / Văn phòng',
    tagline: 'Cân bằng chi phí công việc, quản lý hoàn ứng & tích lũy',
    recommendedMonthlyBudgetVND: 12000000,
    recommendedMonthlyBudgetUSD: 1200,
    description: 'Thiết kế cho người đi làm: theo dõi cơm trưa văn phòng, chi phí đi lại, hóa đơn gia đình và tự động quản lý các khoản chi ứng trước cần công ty hoàn trả.',
    focusAreas: ['Cơm trưa văn phòng', 'Xăng xe & Đi lại', 'Hóa đơn sinh hoạt', 'Chi ứng trước công việc'],
    defaultCategories: [
      'Ăn trưa văn phòng',
      'Hóa đơn & Tiền nhà',
      'Xăng xe & Grab',
      'Gặp gỡ & Tiếp khách',
      'Chi ứng trước công việc',
      'Mua sắm & Giải trí'
    ],
    categoryColors: {
      'Ăn trưa văn phòng': '#F59E0B',
      'Hóa đơn & Tiền nhà': '#EF4444',
      'Xăng xe & Grab': '#F97316',
      'Gặp gỡ & Tiếp khách': '#3B82F6',
      'Chi ứng trước công việc': '#8B5CF6',
      'Mua sắm & Giải trí': '#EC4899'
    },
    categoryBudgetsVND: {
      'Ăn trưa văn phòng': 2500000,
      'Hóa đơn & Tiền nhà': 4500000,
      'Xăng xe & Grab': 1500000,
      'Gặp gỡ & Tiếp khách': 1500000,
      'Chi ứng trước công việc': 1000000,
      'Mua sắm & Giải trí': 1000000
    },
    defaultIncomeCategories: [
      'Lương chính',
      'Thưởng & Hoa hồng',
      'Hoàn ứng công tác phí',
      'Thu nhập ngoài giờ',
      'Khác'
    ],
    quickNoteSuggestions: [
      'Cơm trưa văn phòng',
      'Cà phê gặp đối tác',
      'Xăng xe tuần này',
      'Grab đi gặp khách',
      'Hóa đơn điện nước',
      'Ăn tối liên hoan'
    ],
    financialAdvice: 'Áp dụng quy tắc 50/30/20: 50% nhu cầu thiết yếu, 30% sở thích, 20% tiết kiệm & đầu tư.'
  },
  nomad: {
    id: 'nomad',
    title: 'Du lịch / Digital Nomad',
    tagline: 'Linh hoạt đa tiền tệ, quản lý chuyến đi & làm việc từ xa',
    recommendedMonthlyBudgetVND: 25000000,
    recommendedMonthlyBudgetUSD: 2000,
    description: 'Thiết kế cho người hay di chuyển, du lịch và làm việc từ xa: hỗ trợ đổi nhiều loại tiền tệ theo thời gian thực, quản lý khách sạn/Airbnb và vé máy bay.',
    focusAreas: ['Chỗ ở & Airbnb', 'Vé máy bay & Di chuyển', 'Ăn uống & Trải nghiệm', 'Coworking & Internet'],
    defaultCategories: [
      'Khách sạn & Chỗ ở',
      'Vé máy bay & Di chuyển',
      'Ăn uống & Ẩm thực địa phương',
      'Coworking & Internet 4G',
      'Trải nghiệm & Tour',
      'Chi tiêu phát sinh ngoại tệ'
    ],
    categoryColors: {
      'Khách sạn & Chỗ ở': '#3B82F6',
      'Vé máy bay & Di chuyển': '#F97316',
      'Ăn uống & Ẩm thực địa phương': '#F59E0B',
      'Coworking & Internet 4G': '#06B6D4',
      'Trải nghiệm & Tour': '#10B981',
      'Chi tiêu phát sinh ngoại tệ': '#8B5CF6'
    },
    categoryBudgetsVND: {
      'Khách sạn & Chỗ ở': 9000000,
      'Vé máy bay & Di chuyển': 5000000,
      'Ăn uống & Ẩm thực địa phương': 5000000,
      'Coworking & Internet 4G': 2000000,
      'Trải nghiệm & Tour': 2500000,
      'Chi tiêu phát sinh ngoại tệ': 1500000
    },
    defaultIncomeCategories: [
      'Thu nhập Freelance / Remote',
      'Hợp đồng quốc tế',
      'Hoàn tiền vé & Booking',
      'Khác'
    ],
    quickNoteSuggestions: [
      'Vé máy bay',
      'Tiền phòng Airbnb',
      'Gói eSIM / SIM du lịch',
      'Coworking Space 1 tuần',
      'Bữa tối địa phương',
      'Grab/Taxi sân bay'
    ],
    financialAdvice: 'Luôn theo dõi bảng tỷ giá cập nhật và thanh toán bằng thẻ không tính phí chuyển đổi ngoại tệ.'
  },
  family: {
    id: 'family',
    title: 'Cá nhân & Gia đình',
    tagline: 'Quản lý tài chính tổ ấm, chi phí con cái & quỹ an toàn',
    recommendedMonthlyBudgetVND: 25000000,
    recommendedMonthlyBudgetUSD: 2500,
    description: 'Thiết kế cho quản lý gia đình: theo dõi tiền chợ, học phí con cái, hóa đơn điện nước và quỹ dự phòng khẩn cấp.',
    focusAreas: ['Thực phẩm & Đi chợ', 'Học hành con cái', 'Hóa đơn sinh hoạt', 'Y tế & Quỹ dự phòng'],
    defaultCategories: [
      'Thực phẩm & Đi chợ',
      'Học hành con cái',
      'Hóa đơn gia đình (Điện/Nước/Net)',
      'Y tế & Sức khỏe',
      'Đồ dùng sinh hoạt',
      'Quỹ dự phòng gia đình'
    ],
    categoryColors: {
      'Thực phẩm & Đi chợ': '#F59E0B',
      'Học hành con cái': '#3B82F6',
      'Hóa đơn gia đình (Điện/Nước/Net)': '#EF4444',
      'Y tế & Sức khỏe': '#10B981',
      'Đồ dùng sinh hoạt': '#F97316',
      'Quỹ dự phòng gia đình': '#8B5CF6'
    },
    categoryBudgetsVND: {
      'Thực phẩm & Đi chợ': 8000000,
      'Học hành con cái': 7000000,
      'Hóa đơn gia đình (Điện/Nước/Net)': 3500000,
      'Y tế & Sức khỏe': 2000000,
      'Đồ dùng sinh hoạt': 2500000,
      'Quỹ dự phòng gia đình': 2000000
    },
    defaultIncomeCategories: [
      'Thu nhập gia đình',
      'Kinh doanh / Buôn bán',
      'Lãi tiết kiệm & Đầu tư',
      'Khác'
    ],
    quickNoteSuggestions: [
      'Đi siêu thị tuần',
      'Học phí cho con',
      'Hóa đơn tiền điện',
      'Tiền nước & Internet',
      'Thuốc men & Khám bệnh',
      'Mua sắm đồ gia dụng'
    ],
    financialAdvice: 'Duy trì quỹ khẩn cấp tương đương 3-6 tháng chi tiêu cơ bản để cả gia đình luôn an tâm.'
  }
};
