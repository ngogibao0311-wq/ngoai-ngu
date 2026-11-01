# Mục Từ vựng — cơ chế mới

Các thay đổi không tự xóa, gộp hay đặt lại dữ liệu đang có. Từ trùng đã có trong kho vẫn được giữ; phiên học chỉ lấy mỗi từ một lần. Tiến độ cũ vẫn dùng được.

## Kho từ
- Tìm theo từ, phiên âm, nghĩa, từ loại hoặc thẻ; hỗ trợ tìm không dấu.
- Lọc cấp độ, chưa phân cấp và trạng thái học; sắp xếp theo từ hoặc ngày ôn.
- Mỗi nhóm hiện 24 thẻ, bấm Xem thêm để tải tiếp.
- Thêm từ trùng sẽ được báo thay vì ghi đè. Đổi tên từ giữ tiến độ và thông tin nguồn. Pinyin có thể bổ sung sau.
- Xóa cần xác nhận. Bản ghi trùng cũ dùng chung tiến độ; tiến độ chỉ bị xóa khi không còn bản ghi cùng từ.

## Nhập và xuất
Dùng nút **Nhập thêm JSON / Excel** ngay trong Kho từ.

Có xem trước số dòng thêm mới, bổ sung, trùng, khác nội dung và lỗi. Chỉ bổ sung ô còn trống; giữ nội dung hiện có khi khác nhau. Không thay tiến độ bằng tiến độ trong tệp. Hủy xem trước không sửa dữ liệu. Hỗ trợ JSON của web, danh sách JSON, JSON Xiao Cidian và Excel có cột hanzi, pinyin, vietnamese, hskLevel, example.

**Xuất kho từ JSON** gồm từ vựng và tiến độ của ngôn ngữ hiện tại. Muốn khôi phục cả tiến độ từ bản sao lưu, dùng Cài đặt → Nhập & xuất dữ liệu; chức năng khôi phục ở đó vẫn có cảnh báo thay thế dữ liệu.

## Học và ôn
- Chưa học: chưa có lượt ôn, chưa lên bậc và chưa đánh dấu thuộc. Từ học rồi nhưng quên không bị tính lại là từ mới.
- Học mới: tối đa 10 từ theo bộ lọc hiện tại.
- Ôn SRS: ưu tiên từ đến hạn lâu nhất, tối đa 30 từ mỗi phiên; không tự chạy lại khi kết thúc.
- Chưa nhớ: về bậc 1, hẹn ngày mai và nhắc lại một lần cuối phiên. Lần nhắc lại không tăng bậc lần nữa.
- Nhớ: tăng 1 bậc. Dễ: tăng 2 bậc, tối đa bậc 5. Khoảng ôn các bậc 1–5: 1, 1, 3, 7, 14 ngày.
- Đã thuộc: bậc 5 và ít nhất 7 lượt ôn. Từ đã thuộc vẫn có lịch ôn duy trì.
- Luyện tự do: tối đa 30 từ theo bộ lọc, không thay tiến độ, lịch ôn hay chuỗi ngày học.
- Ngày học tính theo ngày trên thiết bị. Phím 1/2/3 chấm sau khi hiện đáp án; không can thiệp lúc đang gõ biểu mẫu.

## Bài tập và thống kê
- Trộn ngẫu nhiên từ theo cấp độ, không lặp từ trước khi dùng hết nguồn của dạng bài.
- Bài nghe giữ nút loa, không hiện từ đáp án. Đáp án trắc nghiệm không trùng nhau.
- Câu thiếu nghĩa hoặc phiên âm cần thiết không được đưa vào nguồn tương ứng. Cần ít nhất 4 nghĩa khác nhau cho trắc nghiệm nghĩa và nghe.
- Không chấm hai lần một câu. Có thể làm lại câu sai mà không gọi AI.
- Luyện gõ bỏ khác biệt chữ hoa và khoảng trắng; vẫn kiểm tra dấu thanh. Nghĩa tách bằng dấu chấm phẩy có thể trả lời một nghĩa.
- Thống kê dùng các từ còn trong kho, hiển thị nhật ký gần đây; lưu tối đa 5.000 hoạt động từ lúc cập nhật. Nhật ký đã mất từ phiên bản cũ không thể khôi phục.

## Kiểm tra
Bộ kiểm tra logic, nhập dữ liệu và kiểm tra trình duyệt nằm trong Final/tests. Trình duyệt kiểm tra dùng hồ sơ riêng, không dùng kho từ thật của bạn. Các dịch vụ AI, micro và Firebase thực tế phụ thuộc tài khoản, quyền và kết nối; chúng không được xác nhận bằng kiểm tra dữ liệu giả.

## Nhập lại tệp chỉ thêm ví dụ trong Kho Dữ Liệu
Kho Dữ Liệu mặc định chọn “Ghép từ vựng — bổ sung / cập nhật ví dụ”. Nhận diện trùng theo từ đã chuẩn hóa khoảng trắng và ký tự ẩn, không theo ví dụ. Khi từ đã có, ví dụ mới thay ví dụ cũ; ví dụ trống không xóa ví dụ hiện có. Các trường khác chỉ được bổ sung khi trống. Giữ tiến độ học. Xem trước hiển thị số từ thêm mới, dòng cập nhật và dòng bỏ qua. Nhập lại cùng tệp không tăng số từ.
Chỉ chọn “Khôi phục bản sao lưu” khi muốn dùng luồng thay thế dữ liệu cũ. Các bản ghi trùng đã tồn tại trước thay đổi này không bị tự xóa.
