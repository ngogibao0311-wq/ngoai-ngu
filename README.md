# Lingo Pro — Tiếng Anh & Tiếng Trung

Bản mã nguồn chuyển đổi từ “Học tiếng trung.zip” do bạn cung cấp.
Các chức năng của bản cũ được giữ trong script.js; language.js và workspace.js bổ sung hai ngôn ngữ, dữ liệu riêng và menu sáu mục.

## Chạy trên máy
1. Giải nén toàn bộ ZIP vào thư mục dự án “Wed học ngoại ngữ”.
2. Mở Terminal tại thư mục chứa index.html.
3. Chạy: node server.cjs
4. Mở http://127.0.0.1:5174
5. Nhấn Ctrl+C để dừng.

Hoặc dùng: npm start
Không cần npm install. Máy cần Node.js.
Có thể mở index.html để xem, nhưng nên dùng localhost cho lưu trữ và micro.

Lưu ý: bản cũ sử dụng thư viện CDN (Tailwind, Hanzi Writer, Lucide, Chart.js, XLSX, PDF.js, Quill…). Cần mạng để tải các thư viện này. Đây chưa phải bản chạy hoàn toàn ngoại tuyến.

## Sáu mục chính
- Từ vựng: kho từ, thêm/sửa/xóa, tìm kiếm, cấp độ, ôn SRS, bài tập và thống kê.
- Nghe: luyện nghe AI, thư viện âm thanh và video.
- Nói: nhận dạng giọng nói, đánh giá AI và đối thoại.
- Đọc: bài đọc, ngữ pháp, quy tắc, thành ngữ, phân biệt từ, cụm chỉ lượng, tài liệu và sơ đồ từ.
- Viết: đoạn văn, bản nháp tự lưu, kho bài viết/dịch và soạn thảo; tiếng Trung có luyện nét Hán tự, ghép chữ, thanh điệu.
- Cài đặt: tùy chọn học, giao diện, hình nền/nhạc, nhập/xuất dữ liệu, AI và tùy chọn nâng cao của bản cũ.

## Chuyển ngôn ngữ
Chọn Tiếng Anh hoặc Tiếng Trung ở thanh trên.
Chuyển ngôn ngữ tải lại trang: hãy lưu các biểu mẫu đang nhập trước.
Mỗi ngôn ngữ có localStorage và IndexedDB riêng, không trộn từ vựng, SRS hoặc media.
Tiếng Anh dùng cấp độ A1–C2; trường hskLevel trong JSON vẫn là số 1–6 để giữ cấu trúc dữ liệu cũ.
Các trường hanzi/zh chứa từ hoặc câu ngôn ngữ đang học; pinyin chứa pinyin khi học Trung, IPA khi học Anh.
Phân cấp từ mẫu dùng để minh họa, không phải danh sách từ chính thức của một kỳ thi.

## Nhập dữ liệu web cũ
Chọn Tiếng Trung trước, sau đó Cài đặt → Dữ liệu → chọn tệp JSON/Excel.
ZIP mã nguồn không chứa dữ liệu học trong trình duyệt cũ. Nếu muốn chuyển tiến độ, cần xuất bản sao lưu JSON từ web cũ.
Nhập JSON có thể thay thế các mục văn bản được cung cấp trong tệp. Nên sao lưu dữ liệu hiện tại trước khi nhập.
Bản sao lưu mới có nhãn ngôn ngữ để ngăn nhập nhầm sang ngôn ngữ khác.

## AI và micro
Các chức năng AI kế thừa tích hợp Gemini của bản cũ. Nhập khóa riêng tại Cài đặt → Tích hợp.
Khóa được lưu trên trình duyệt của thiết bị này và không có trong bản sao lưu JSON mới.
Không có khóa API được cung cấp sẵn. Các tính năng AI chưa được kiểm thử với tài khoản thật.
Model còn khả dụng và hạn mức phụ thuộc tài khoản dịch vụ của bạn.
Micro/nhận dạng giọng nói tùy trình duyệt; nên dùng Chrome hoặc Edge qua localhost/HTTPS.
Nhận dạng giọng nói của trình duyệt có thể dùng dịch vụ mạng, không phải mọi thao tác đều xử lý ngoại tuyến.

## Đồng bộ
Bản này mặc định lưu dữ liệu trên máy, như bản cũ. Dữ liệu không tự đồng bộ qua các thiết bị.
Địa chỉ Supabase cố định của mã nguồn cũ đã được bỏ để tránh gửi dữ liệu đến máy chủ không được cấu hình cho bản này.
Có ô cấu hình dự án Supabase riêng ở cuối Cài đặt. Cần schema/quyền tương thích với mã cũ; chức năng này chưa được kiểm thử.
Dùng dự án Supabase riêng cho từng ngôn ngữ nếu sử dụng cấu trúc bảng cũ. Khuyến nghị dùng sao lưu JSON cho bản chạy trên máy.

## Tệp chính
- index.html: các màn hình và biểu mẫu gốc.
- style.css: giao diện gốc.
- workspace.css: bố cục sáu mục và thích ứng điện thoại.
- script.js: chức năng của bản cũ cùng các sửa lỗi tương thích.
- language.js: hồ sơ ngôn ngữ, dữ liệu mẫu, giọng đọc, lưu trữ riêng và ngữ cảnh AI.
- workspace.js: điều hướng sáu mục, nhãn tiếng Anh, lưu nháp và cài đặt kết nối.
- server.cjs: máy chủ localhost.
- Final/tests/verify.cjs: kiểm tra logic đã bổ sung.
- core/, data/, features/, ui/, main.js, mobile.css: giữ lại từ ZIP gốc để tham khảo/cấu trúc lại về sau; hiện index.html dùng script.js, không tải đồng thời các module trùng này.

## Kiểm tra
Chạy: npm test

Đã vượt qua:
- Cú pháp JavaScript và các đường dẫn tài nguyên cục bộ.
- Khởi tạo dữ liệu và giữ dữ liệu khi tải lại.
- Cách ly dữ liệu Anh–Trung, xóa đúng hồ sơ.
- Cấu trúc cụm chỉ lượng tiếng Anh và giữ tên khóa JSON trong yêu cầu AI.
- Cập nhật SRS và ghi lịch sử đúng từ vừa ôn.
- Loại khóa API khỏi JSON sao lưu, không thay đổi khóa đang dùng.

Chưa xác minh trong trình duyệt: toàn bộ luồng giao diện, nhập media, micro, nhận dạng giọng nói, kết quả AI và đồng bộ cloud.
Lệnh mở bản chạy thử bị hệ thống xét duyệt tự động chặn do giới hạn sử dụng, nên không coi các kiểm tra logic trên là kiểm thử trình duyệt.

Website đã xuất bản trước đó vẫn là bản đầu; gói này là mã nguồn cập nhật để chạy trên máy.

## Cập nhật giao diện và AI Core (04/10/2026)
- Giao diện mới dùng redesign.css; điều hướng sáu mục, màn hình chào, biểu mẫu và bố cục điện thoại.
- Sửa lọc cấp độ từ vựng, trạng thái không có kết quả và điều hướng liên kết thư viện.
- OpenAI: lưu khóa riêng theo ngôn ngữ trên trình duyệt, tự khôi phục sau tải lại và gửi theo từng yêu cầu tới máy chủ localhost. Máy chủ không ghi khóa ra tệp. Khóa không nằm trong JSON xuất hoặc bản sao Firebase. Cơ chế KeyVault chỉ làm rối chuỗi, không phải mã hóa bảo mật.
- Vào Cài đặt → AI & kết nối → ChatGPT; dán khóa OpenAI riêng, bấm Lưu khóa & model rồi Kiểm tra kết nối. Có thể chọn mã model được tài khoản cấp quyền. Kiểm tra kết nối gửi một yêu cầu API ngắn.
- Sau cập nhật cần khởi động lại node server.cjs. Hướng dẫn cũ về khóa OpenAI chỉ giữ trong phiên đã được thay thế.
- Kiểm thử đạt: node Final/tests/verify.cjs, node Final/tests/ai.cjs, node Final/tests/ai-ui.cjs (mô phỏng DOM và API; không gọi tài khoản thật).
- Final/tests/browser.cjs là bộ kiểm tra điều hướng desktop/mobile, cần Playwright và Edge. Lần chạy chưa hoàn tất: hệ thống xét duyệt tự động hết hạn mức. Chưa xác minh toàn bộ chức năng trong trình duyệt, micro, media, API thật hoặc đồng bộ cloud. Ảnh chụp trước khi hoàn thiện CSS không đại diện cho bản cuối.

## Prompt AI nâng cấp
- ai-prompts.js: quy tắc giảng dạy dùng chung cho Gemini và OpenAI, giữ hợp đồng JSON/văn bản của từng chức năng.
- Viết lại prompt bài nghe, đọc ngắt nhịp, tạo ngữ liệu nói, đánh giá transcript, chấm viết và gợi ý từ vựng. Dữ liệu học viên của các prompt này được đóng gói JSON riêng, không bị bộ chuyển ngôn ngữ thay đổi nội dung.
- Bài nghe: 12–14 lượt, 5 câu hỏi, đáp án có căn cứ; văn bản đọc không có nhãn nhân vật.
- Chấm viết: tiêu chí thang 10, chỉ sửa lỗi có căn cứ, giữ ý học viên, phân biệt gợi ý văn phong.
- Chấm nói: chỉ đối chiếu transcript, không tuyên bố đánh giá phát âm từ âm thanh chưa được gửi.
- Hỏi đáp tài liệu/video: không tự nhận đã xem/nghe, không bịa nguồn hoặc thời gian, phân biệt kiến thức bổ sung.
- Final/tests/prompts.cjs kiểm tra bảo toàn dữ liệu, sáu cấp độ hai ngôn ngữ và hợp đồng đầu ra. Không phải đánh giá chất lượng sư phạm của câu trả lời từ API thật.
- Nhấn Ctrl+F5 để tải prompt mới. Thay đổi prompt không khắc phục số dư/hạn mức API.
