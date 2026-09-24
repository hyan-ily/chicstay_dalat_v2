import React, { useState, useRef, useEffect } from 'react';
import { Room, Booking, Service, ChatMessage } from '../types';
import { formatVND } from '../utils/calculations';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  Bed, 
  Coffee 
} from 'lucide-react';

interface ChicStayBotProps {
  rooms: Room[];
  bookings: Booking[];
  services: Service[];
}

export const ChicStayBot: React.FC<ChicStayBotProps> = ({ rooms, bookings, services }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Xin chào! Em là Trợ lý Ảo ChicStay Đà Lạt. Em có thể hỗ trợ quý khách và lễ tân giải đáp các quy định chính sách (giờ nhận/trả phòng, cọc 30%, hủy 48h) và tra cứu trực tiếp tình trạng phòng trống hôm nay. Anh/chị cần hỗ trợ gì ạ?',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateBotReply = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Inquire available rooms / phòng trống
    if (q.includes('trống') || q.includes('còn phòng') || q.includes('phòng nào')) {
      const avail = rooms.filter((r) => r.status === 'available');
      if (avail.length === 0) {
        return `Dạ hiện tại toàn bộ 12 phòng tại ChicStay đều đã kín (đã được đặt hoặc đang có khách lưu trú). Quý khách vui lòng chọn ngày khác hoặc liên hệ hotline để nhận thông tin khi có phòng hủy cọc nhé!`;
      }

      const listStr = avail
        .map((r) => `• [${r.id}] ${r.name} (${r.categoryName}): ${formatVND(r.pricePerNight)}/đêm (Tối đa ${r.capacity} khách)`)
        .join('\n');

      return `Dạ hiện tại ChicStay đang có ${avail.length}/${rooms.length} phòng TRỐNG sẵn sàng đón khách ngay hôm nay:\n\n${listStr}\n\nQuý khách có thể chuyển sang tab "Cổng Khách Hàng" để đặt phòng và cọc 30% giữ phòng ngay ạ!`;
    }

    // 2. Deposit rule (Cọc 30%)
    if (q.includes('cọc') || q.includes('đặt cọc') || q.includes('30%') || q.includes('tiền cọc')) {
      return `📋 QUY ĐỊNH ĐẶT CỌC TẠI CHICSTAY ĐÀ LẠT:
1. Mức cọc bắt buộc: Đúng 30% tổng Tiền phòng (Đơn giá x Số đêm).
2. Quy tắc tuyệt đối: KHÔNG tính tiền dịch vụ phát sinh vào tiền cọc (dịch vụ thanh toán riêng khi dùng hoặc quyết toán lúc trả phòng).
3. Làm tròn: Tiền cọc được làm tròn chuẩn đến 1.000 VNĐ.
4. Hình thức: Chuyển khoản trực tiếp quét mã VietQR tự động ghi nhận tức thì trên hệ thống.`;
    }

    // 3. Check-in / Check-out hours
    if (q.includes('giờ') || q.includes('nhận phòng') || q.includes('check in') || q.includes('check out') || q.includes('trả phòng')) {
      return `⏰ THỜI GIAN NHẬN & TRẢ PHÒNG TIÊU CHUẨN:
• Giờ nhận phòng (Check-in): Từ 14:00 chiều. (Nhận phòng sớm trước 14:00 tính phụ thu 80.000đ/giờ nếu phòng đã dọn xong).
• Giờ trả phòng (Check-out): Trước 12:00 trưa.
• Quy định trả phòng muộn: Trả phòng sau 12:00 trưa phụ thu 100.000đ/giờ (làm tròn lên theo giờ, ví dụ trễ 15 phút tính 1 giờ).`;
    }

    // 4. Cancellation policy (Hủy phòng)
    if (q.includes('hủy') || q.includes('hoàn') || q.includes('đổi ngày') || q.includes('48h')) {
      return `🛡️ CHÍNH SÁCH HỦY PHÒNG & HOÀN CỌC:
• Hủy trước giờ nhận >= 48 giờ: Đủ điều kiện hoàn cọc 100%. Lễ tân sẽ liên hệ số tài khoản để chuyển khoản "Hoàn cọc thủ công".
• Hủy trước giờ nhận < 48 giờ: Báo trạng thái "Mất cọc" theo quy định của ChicStay Đà Lạt để bù đắp chi phí giữ phòng.`;
    }

    // 5. Late checkout fee (Phụ thu trễ)
    if (q.includes('muộn') || q.includes('trễ') || q.includes('phụ thu') || q.includes('100.000')) {
      return `⏱️ QUY TẮC PHỤ THU TRẢ PHÒNG MUỘN:
Khách trả phòng sau 12:00 trưa sẽ áp dụng phụ thu: 100.000 VNĐ/giờ.
Hệ thống tự động làm tròn lên theo giờ (ví dụ trễ từ 1 - 60 phút tính tròn 1 giờ = 100.000đ; trễ 1 giờ 15 phút tính 2 giờ = 200.000đ). Phụ phí này sẽ được cộng tự động vào Hóa đơn Quyết toán.`;
    }

    // 6. Services list (9 Dịch vụ)
    if (q.includes('dịch vụ') || q.includes('ăn sáng') || q.includes('bbq') || q.includes('xe') || q.includes('sân bay')) {
      const srvStr = services
        .map((s) => `• [${s.id}] ${s.name}: ${formatVND(s.price)}/${s.unit} (${s.description})`)
        .join('\n');
      return `🧺 BẢNG GIÁ 9 DỊCH VỤ ĐÍNH KÈM TẠI CHICSTAY (D001 - D009):\n\n${srvStr}\n\n* Lưu ý: Giá dịch vụ được cố định tại thời điểm thêm vào đơn (Snapshot price) không bị ảnh hưởng bởi biến động giá sau này.`;
    }

    // 7. Bungalow inquiry
    if (q.includes('bungalow') || q.includes('bg01') || q.includes('bg02')) {
      const bgRooms = rooms.filter((r) => r.category === 'bungalow');
      return `🏡 THÔNG TIN HẠNG BUNGALOW GỖ SÂN VƯỜN (1.400.000đ/đêm):
• BG01: ${bgRooms[0]?.name} - Hiện trạng: ${bgRooms[0]?.status}
• BG02: ${bgRooms[1]?.name} - Hiện trạng: ${bgRooms[1]?.status}
Bungalow được xây dựng bằng gỗ thông mộc mạc giữa vườn hoa Đà Lạt, trang bị giường Super King + Sofa bed, phù hợp cho 2-3 khách thích sự riêng tư và có sân BBQ tiệc tối.`;
    }

    // Default friendly response
    return `Dạ ChicStay Đà Lạt có thể hỗ trợ quý khách về:
1. Tra cứu phòng trống hôm nay (gõ "còn phòng không?")
2. Quy định đặt cọc 30% (gõ "tiền cọc?")
3. Chính sách hủy phòng trước 48h (gõ "hủy phòng?")
4. Quy định phụ thu trả phòng muộn sau 12:00 (gõ "trả muộn?")
5. Bảng giá 9 dịch vụ đính kèm D001 - D009 (gõ "bảng giá dịch vụ")

Quý khách cần tìm hiểu thêm thông tin nào ạ?`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const botReplyText = generateBotReply(text);
    const botMsg: ChatMessage = {
      id: `msg-${Date.now()}-b`,
      sender: 'bot',
      text: botReplyText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputText('');
  };

  const quickChips = [
    'Hôm nay còn phòng nào trống không?',
    'Chính sách đặt cọc 30% thế nào?',
    'Chính sách hủy phòng và hoàn cọc?',
    'Phụ thu trả phòng muộn sau 12:00 tính ra sao?',
    'Bảng giá 9 dịch vụ kèm theo?',
    'Thông tin hạng Bungalow sân vườn?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Bot Header Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D5A43] text-white flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#D4A373]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <span>Trợ Lý Tra Cứu & FAQ ChicStay</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p className="text-xs text-neutral-500">
              Tra cứu phòng trống thời gian thực & giải đáp nghiệp vụ homestay
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-neutral-500 hidden sm:block">
          <div>Trạng thái: <strong className="text-emerald-700 dark:text-emerald-400">Sẵn sàng</strong></div>
          <div>Đồng bộ trực tiếp với Sơ đồ Rack</div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs min-h-[440px] max-h-[520px] overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2.5 ${
              m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                m.sender === 'user'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-[#2D5A43] text-[#D4A373]'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-3.5 text-xs whitespace-pre-line leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#2D5A43] text-white rounded-tr-xs'
                  : 'bg-[#F8F6F0] dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 rounded-tl-xs'
              }`}
            >
              {m.text}
              <div
                className={`text-[10px] mt-1.5 font-mono ${
                  m.sender === 'user' ? 'text-white/60 text-right' : 'text-neutral-400'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Gợi ý câu hỏi nhanh:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 text-xs rounded-lg border border-[#2D5A43]/20 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-[#2D5A43] hover:text-[#2D5A43] dark:hover:text-[#D4A373] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center space-x-2">
        <input
          type="text"
          placeholder="Hỏi về phòng trống hôm nay, chính sách cọc 30%, hủy phòng, dịch vụ..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-3 py-2 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-none focus:outline-hidden"
        />
        <button
          onClick={() => handleSend()}
          className="px-4 py-2 rounded-lg bg-[#2D5A43] hover:bg-[#234634] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Gửi</span>
        </button>
      </div>

    </div>
  );
};
