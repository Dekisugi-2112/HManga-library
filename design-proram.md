# PROMPT CHO ANTIGRAVITY — Website đọc truyện tranh cá nhân

## 1. Mô tả Website
- Xây dựng một website cá nhân để lưu trữ và đọc các bộ truyện tranh (manga/manhwa/manhua) mà tôi tự chọn lọc từ nhiều nguồn khác nhau trên mạng.
- Đây **không phải** đồ án tốt nghiệp, chỉ là dự án cá nhân dùng cho một người duy nhất (tôi), không cần hệ thống tài khoản/đăng nhập.
- Yêu cầu kiến trúc bắt buộc: **Modular Monolith**.
-



## 2. Thêm truyện tranh.
- Trong website của tôi phần Thêm truyên tôi muốn có 1 giao diện như :`check_url.html` vừa có chức năng kiểm tra link vừa tạo ra danh sách url ảnh cho chapter.
- Khi tôi dùng chức năng thêm truyện, tôi sẽ nhập: URL, và hệ thống sẽ kiểm tra truyện đã tồn tại hay chưa.
- Nếu truyện không tồn tại, URL đó sẽ trở thành bộ truyện mới, tôi sẽ nhập tên truyện, tên tác giả và chọn thể loại.
    - 1 bộ truyện có 2 loại chính: nhiểu chapter và oneshot.
    - Tôi có thể chọn chapter cho mỗi url tôi giửi.
- Nếu truyện tồn tại, thì hiện bộ lên và tôi sẽ thêm các tính năng khác và thêm vào.
- khi thêm truyện tranh hãy lấy ảnh đầu tiên của chương đầu tiên làm cover image.
- cover sẽ tự động tải về máy, đổi tên tên ảnh thành mã số tương ứng.
- cover image sẽ được lưu vào: HManga-library/cover-images/
- tôi cần 1 file cache .json để lưu trữ thông tin truyện.
- Các URL mẫu của website tôi lấy được từ 1 website và chắc chắn là lấy được ảnh, ví dụ:
    - `https://i3.hentaifox.com/004/4029076/1t.jpg` - lấy 4029076 là tên cover image
    - `https://i3.hentaifox.com/004/3930534/2t.jpg` - lấy 3930534 là tên cover image
    - `https://i2.hentaifox.com/003/1530574/2.jpg`
    - có nhiểu loại ảnh như jpg, png, webp

## 3. Updata truyện tranh
- Chức năng này cho phép tôi chỉnh sửa truyện, tôi có thể chỉnh sửa các chương: đổi tên chapter, chuyển chapter 1 thành chapter 2


## 4. Xóa truyện tranh
- Tôi có thể xóa bỏ hoàn toàn truyện tranh ra khỏi  backend và database.


## 5. Chức năng tìm kiếm truyện
- Chức năng này dùng để tìm kiếm truyện, lọc truyện theo tên, thể loại, tác giả.


## 2. Tech stack
- **Frontend**: Next.js (App Router) + TailwindCSS
- **Backend**: FastAPI (Python), tổ chức theo modular monolith — chia rõ theo domain module (vd: `comics`, `chapters`, `crawler`, `search`), mỗi module có router/service/schema riêng, nhưng deploy như một service duy nhất.
- **Database**: Supabase (Postgres). Dùng Supabase Storage để lưu ảnh bìa và ảnh chương nếu crawl về, hoặc lưu URL ảnh gốc — cần làm rõ ở mục 6.
- **Không có auth/user accounts** — chỉ 1 người dùng duy nhất, không cần login, không cần phân quyền.

## 3. Chức năng chính
1. **Đọc truyện trực tiếp trên site**: hệ thống crawl/import nội dung truyện (danh sách chương, ảnh từng trang) từ các trang nguồn do tôi chỉ định, lưu vào database/storage, hiển thị lại bằng UI đọc truyện riêng (không redirect sang trang gốc).
2. **Trang danh sách truyện**: hiển thị dạng lưới ảnh bìa, có tên truyện, thể loại/tag, trạng thái (đang tiến hành/hoàn thành).
3. **Trang chi tiết truyện**: mô tả, danh sách chương, tag/thể loại, đánh giá cá nhân (ghi chú riêng của tôi).
4. **Trang đọc chương**: hiển thị lần lượt ảnh các trang, điều hướng chương trước/sau, cuộn dọc hoặc theo trang (chọn 1 kiểu chính, tối giản).
5. **Tìm kiếm & lọc**: tìm theo tên truyện, lọc theo tag/thể loại, lọc theo trạng thái.
6. **Quản lý nội dung (chỉ dành cho tôi, không cần auth)**: thêm truyện mới bằng cách nhập URL nguồn để crawl, hoặc nhập tay metadata; xoá/sửa truyện, chương.

## 4. Kiến trúc modular monolith (backend)

Mỗi module expose router riêng, main.py chỉ include các router. Business logic nằm trong service layer của từng module, không gọi chéo trực tiếp giữa các module mà qua interface rõ ràng.


## Q1: 
- thứ 1: tôi không muốntaiair toàn bộ ảnh của các chương về máy laptop của tôi.
- supabase sẽ chỉ lưu url của ảnh đầu tiên của mỗi chapter, vì url có chứa id của truyện.
- và khi cần thì sẽ lấy url đó sau đó render ra số (1.jpg, 2.jpg, ..) mà tôi đã cho sẵn để hiển thị
- không upload ảnh lên supabase
## Q2:
- các bức ảnh đều là 1 trang ảnh, không phải là toàn bộ bộ truyện
- Ảnh không có t (như 2.jpg) không phải là ảnh full
- tạm thời tôi chỉ dùng mỗi hentaifox thôi, nếu dùng thêm web khác thì tôi sẽ nói.
## Q3:
- Kết hợp: tự phát hiện nhưng vẫn cho chỉnh sửa thủ công danh sách cuối
## Q4:
- với phần oneshot hãy làm như là chương 1 nhưng chỉ thay tên = oneshot thôi
## Q5:
- Chế độ đọc truyện Cả 2 + nút chuyển đổi tự do
## Q6:
- file cache lưu thông tin về truyên tranh như tên truyện tên tác giả, thể loại, đường dẫn (không lưu toàn bộ đường dẫn, cỉ lưu đường dẫn cho trang đầu diên thôi, áp dùng cho database)
- khi mà đọc chương nào thì sẽ lấy link của chương đó ra và render số để lấy hình ảnh.
## Q7:
- Tự do: Bạn tự nhập tag bất kỳ