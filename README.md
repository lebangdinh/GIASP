# C933 KIỂM TRA GIÁ SẢN PHẨM

Ứng dụng web tiếng Việt cho TopZone. File Excel được đọc bằng trình duyệt. Mỗi phiên cùng các xác nhận giá được lưu trong IndexedDB của thiết bị đang dùng.

[Mở ứng dụng trên GitHub Pages](https://lebangdinh.github.io/GIASP/) · [Tải bản HTML offline](https://raw.githubusercontent.com/lebangdinh/GIASP/main/C933.html)

## Bản offline

Chạy `node build-giasp.mjs --public` để tạo `C933.html`. Mở file bằng Chrome hoặc Edge rồi nhập bảng Excel. Bản công khai khởi đầu với dữ liệu trống trên trình duyệt mới.

## Chạy trên máy

Từ thư mục dự án, chạy bằng Node.js 20 trở lên:

```powershell
node server.mjs
```

Mở http://127.0.0.1:4173 bằng Chrome hoặc Edge. Giữ cửa sổ chạy lệnh mở khi sử dụng ứng dụng. Để giữ cùng kho dữ liệu, mở lại bằng cùng trình duyệt, hồ sơ, địa chỉ và cổng. Chạy kiểm thử nghiệp vụ bằng `node --test tests/core.test.mjs`. Ứng dụng đã kèm thư viện giải nén Excel nên không cần cài npm.

## Nhập bảng giá ngày mới

1. Vào **⚙ Cài đặt shop và sao lưu** để đặt tên cụm, tạo các shop bằng mã và tên thật, rồi chọn shop mặc định.
2. Chọn **Nhập bảng giá → Chọn file Excel**. Kiểm tra sheet, ánh xạ cột, dữ liệu dòng đầu và thống kê. Nếu mẫu thay đổi, sửa ký hiệu cột trong phần ánh xạ. Ứng dụng hỗ trợ bảng .xlsx theo dòng, bắt đầu ở dòng dữ liệu đầu tiên.
3. Xác nhận ngày áp dụng, tên phiên và phạm vi. Dùng **Toàn cụm** cho bảng chung. Chọn shop cụ thể cho bảng riêng. Cột F được giữ ở dòng Excel gốc.
4. Bấm **Xác nhận và lưu phiên**. Các dòng xung đột có thể mở để đối chiếu từng biến thể và số dòng nguồn. Sửa file nguồn rồi nhập lại thành phiên mới khi cần.
5. Ở đầu trang, chọn shop và phiên. Với shop có bảng riêng, ứng dụng ưu tiên phiên riêng mới nhất khi đổi sang shop đó. Danh sách phiên cũng có các bảng toàn cụm để chuyển nguồn ngay tại quầy.

## Tra và xác nhận giá

Tìm theo mã, tên hoặc mã tham chiếu. Mở sản phẩm để xem ưu đãi, thông số, phương án trả chậm và dòng nguồn. Bấm vào nhãn ưu đãi để xem nguyên câu trong file.

Trong **Quản lý xác nhận giá**, chọn điều kiện để xem phép tính thử. Nhập giá cuối, điều kiện thực sự cần gửi khách và lý do, sau đó bấm **Lưu xác nhận**. Khi sửa giá, nhập lại số đúng và ghi lý do sửa. Lịch sử giữ cả hai lần. Xác nhận cho toàn cụm khi đang chọn Toàn cụm. Để chốt giá riêng cho shop, nhập hoặc mở bảng riêng của shop đó.

Khi cột H có mức giảm trên giá sau khuyến mãi theo quy tắc được duyệt, giá cuối được tính từ giá khuyến mãi U. Xác nhận thuộc đúng phiên và phạm vi. Phiên mẫu khi nhập qua máy chủ cục bộ có thể nhận xác nhận đi kèm từ thư mục riêng của quản lý. Khớp file bằng SHA-256, sheet, ánh xạ, mã, giá nguồn và ngày áp dụng.

**Copy báo khách** lấy nhãn và giá đang hiển thị. **Copy cho nhân viên** bổ sung mã, nguồn và ghi chú. So sánh hai phiên tại **Lịch sử phiên**. Trong **Bản tin cho shop**, chọn mã bằng ô tìm hoặc nút chọn nhanh, đọc bản xem trước, rồi copy gửi Zalo hoặc xuất Excel.

## Chuyển sang máy nhân viên

Chọn shop và phiên cần bàn giao. Vào **⚙ Cài đặt shop và sao lưu → Xuất gói phiên đang xem**. Chuyển file JSON cho máy nhân viên, mở ứng dụng trên máy đó rồi chọn **Nhập gói / khôi phục**. Kiểm tra shop, ngày, phiên và một mã đã xác nhận. Gói chứa dữ liệu nguồn và lịch sử quản lý, cần chuyển qua kênh nội bộ.

**Sao lưu toàn bộ** lưu mọi phiên. Khôi phục bản sao lưu sẽ yêu cầu xác nhận trước khi thay dữ liệu hiện tại. Chọn shop trên một máy chỉ thay lựa chọn cục bộ. Mỗi lần cập nhật bảng hoặc điều chỉnh giá, xuất gói mới cho máy nhân viên.

## GitHub Pages

GitHub Pages mở trực tiếp tệp **index.html** ở thư mục gốc. Thư mục **app/** chứa các tài nguyên giao diện và xử lý giá. File Excel và các phiên riêng được nhập trên thiết bị.

Ứng dụng dùng chung giao diện trên máy nhân viên và quản lý. Bản cục bộ chưa có tài khoản, phân quyền hay đồng bộ qua máy chủ.


## Phân tích và so sánh

Vào **Phân tích giá** để xếp hạng theo tiền giảm thêm sau khuyến mãi, tỷ lệ giảm hoặc giá báo khách. Bấm một phân khúc rồi lọc thêm theo nhóm phụ kiện, ưu đãi hoặc ngưỡng giảm. Có thể lưu bộ lọc theo tên trên máy. **Xuất bảng Excel** giữ thứ tự và các mã đang xem. **Đưa vào bản tin** chọn các mã đang có giá để quản lý duyệt trước khi gửi.

Trong chi tiết sản phẩm, mở **Diễn biến giá** để xem các phiên cùng phạm vi shop. Tại **Lịch sử phiên**, chọn hai phiên, đảo chiều khi cần và xuất các thay đổi đang lọc.

## Quy tắc báo giá

Áp dụng mức phần trăm ghi trên giá sau khuyến mãi cho tất cả mã phù hợp, lấy giá khuyến mãi U làm cơ sở. Nếu có một dòng “giảm thêm” cùng dòng giảm 3% thông thường, dùng riêng mức “giảm thêm”. Các dòng có điều kiện ngoài mẫu đã duyệt hoặc nhiều mức chưa xác định cần quản lý kiểm tra. Giá quản lý đã xác nhận riêng có ưu tiên cao nhất. Chi tiết sản phẩm giữ nguyên câu nguồn và điều kiện áp dụng.

## Nghiệp vụ nâng cao

Mở **Nghiệp vụ nâng cao** để xếp hạng khuyến mãi, phân tích phiếu mua hàng, đối chiếu tồn kho liên shop, quản lý danh sách sản phẩm và xuất báo cáo Excel bốn sheet. Các màn hình sử dụng phiên bảng giá đang chọn. Tải bảng tồn riêng khi cần tra số lượng có thể bán.

