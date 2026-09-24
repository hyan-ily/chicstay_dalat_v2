import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  MessageSquareText, 
  CalendarCheck, 
  BarChart3,
  Sun, 
  Moon, 
  Clock, 
  Download, 
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'receptionist' | 'customer' | 'dashboard' | 'crm' | 'chat';
  setActiveTab: (tab: 'receptionist' | 'customer' | 'dashboard' | 'crm' | 'chat') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onResetData: () => void;
  onExportHtml: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onResetData,
  onExportHtml,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      setTimeStr(`${time} · ${date}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[#2D5A43]/15 backdrop-blur-md bg-[#F8F6F0]/90 dark:bg-[#0F172A]/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Zone: Clean, single visual identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#2D5A43] text-white flex items-center justify-center shadow-sm">
              <span className="font-bold text-lg tracking-wider text-[#D4A373]">CS</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-[#2D5A43] dark:text-[#E2E8F0]">
                  ChicStay
                </span>
                <span className="text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-[#D4A373]/20 text-[#2D5A43] dark:text-[#D4A373]">
                  Đà Lạt
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <Clock className="w-3 h-3 text-[#2D5A43] dark:text-[#D4A373]" />
                <span className="font-mono tabular-nums">{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links: Segmented tabs for Role / Module */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-neutral-200/50 dark:bg-neutral-800/60 rounded-xl">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'customer'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Cổng Khách Hàng</span>
            </button>

            <button
              onClick={() => setActiveTab('receptionist')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'receptionist'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Bảng Sơ Đồ Phòng (Rack)</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Thống Kê Doanh Thu</span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'crm'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sổ Khách Hàng (CRM)</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Trợ Lý Hỏi Đáp & Tra Cứu</span>
            </button>
          </nav>

          {/* Action Zone: Theme, Reset, Export Single-File */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Export Single-File HTML */}
            <button
              onClick={onExportHtml}
              title="Xuất file index.html tự chứa chạy trực tiếp trên Chrome không cần backend"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#2D5A43]/30 text-[#2D5A43] dark:text-[#D4A373] hover:bg-[#2D5A43]/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất HTML độc lập</span>
            </button>

            {/* Reset Data */}
            <button
              onClick={() => {
                if (window.confirm('Khôi phục dữ liệu ban đầu gồm 12 phòng, 9 dịch vụ và 4 đơn mẫu?')) {
                  onResetData();
                }
              }}
              title="Khôi phục Master Data mặc định"
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'Chuyển sang Giao diện Sáng (Warm Rice Paper)' : 'Chuyển sang Giao diện Tối (Slate Dark)'}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#D4A373]" /> : <Moon className="w-4 h-4 text-[#2D5A43]" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 no-scrollbar border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded-md ${
              activeTab === 'customer'
                ? 'bg-[#2D5A43] text-white font-medium'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Cổng Khách Hàng
          </button>
          <button
            onClick={() => setActiveTab('receptionist')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded-md ${
              activeTab === 'receptionist'
                ? 'bg-[#2D5A43] text-white font-medium'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Sơ Đồ Phòng
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded-md ${
              activeTab === 'dashboard'
                ? 'bg-[#2D5A43] text-white font-medium'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Doanh Thu & Công Suất
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded-md ${
              activeTab === 'crm'
                ? 'bg-[#2D5A43] text-white font-medium'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Sổ Khách Hàng
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded-md ${
              activeTab === 'chat'
                ? 'bg-[#2D5A43] text-white font-medium'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Trợ Lý AI
          </button>
        </div>
      </div>
    </header>
  );
};
