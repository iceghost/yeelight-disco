# Yeelight Disco

Chuyện là phòng mình có một cây đèn Yeelight. Đèn này có thể được điều khiển bằng điện thoại, có đèn nền nhiều màu sắc.
Tuy nhiên, app chỉ cung cấp một vài hiệu ứng, nhìn khá chán.

![IMG_1303](https://github.com/iceghost/yeelight-disco/assets/40488299/2673da6d-3db1-4548-bc90-95eda7d0c4ed)

Kết quả làm được như sau:

https://github.com/iceghost/yeelight-disco/assets/40488299/ab587683-3fb9-45b6-add3-3ce4600273e0

## Bắt đầu

Một hôm mình tình cờ tìm ra là Yeelight có cung cấp một cái protocol để một người có thể điều khiển đèn qua LAN.
Protocol được đăng tải tại [trang chủ Yeelight].

[trang chủ Yeelight]: https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf

Protocol được tóm tắt như sau:

- Protocol dựa trên TCP.

  TCP có thể hiểu là một giao thức chuyển dữ liệu ở dạng byte stream (nhiều byte đến liên tục), hai chiều, song song nhau.

- Dữ liệu được cấu trúc bằng định dạng JSON.

Để có thể khám phá một port sử dụng protocol TCP, ta có thể sử dụng `telnet`. `telnet` có thể hiểu là một công cụ để pipe input, output vào một
protocol sử dụng byte stream.

```
$ telnet 192.168.100.123 55443
```

(IP được lấy từ app)

Đầu tiên, khi thay đổi các tùy chọn trên app, đèn sẽ gửi thông tin thông báo trạng thái về cho chúng ta:

```
{"method":"props","params":{"flowing":1}}                                                                                                                         
{"method":"props","params":{"bg_power":"off"}}
```

Nhập vào lệnh tắt nguồn:

```
{"id":1,"method":"set_power","params":["off"]}
```

Output:

```
{"method":"props","params":{"main_power":"off","power":"off"}}
{"id":1,"result":["ok"]}
```

Như vậy, tóm tắt lại:

- Mở một kết nối TCP tới đèn.
- Gửi lệnh đến đèn, encode bằng JSON.

## JavaScript, TypeScript và Deno

Bài viết sẽ sử dụng ngôn ngữ TypeScript (JavaScript + type system) và runtime là Deno.

JavaScript là một ngôn ngữ phổ biến, thường được dùng để lập trình web. Tuy nhiên, JavaScript chỉ định nghĩa cú pháp,
ngữ nghĩa tính toán, và một số API thông dụng như các cấu trúc dữ liệu `Map`, `Set`, ...

Tuy nhiên, JavaScript không định nghĩa cách để thao tác I/O, nói cách khác là các dữ liệu ngoại:

- Đọc input.
- Gửi dữ liệu qua mạng.
- Đọc file.
- ...

Cách làm những điều này dựa vào **JavaScript runtime**. Các runtime thông dụng mà bạn có thể đã nghe:

- NodeJS: Tương tác với hệ điều hành với các module: `fs`, `socket`, ...
- Chromium: Tương tác với trình duyệt, gián tiếp với hệ điều hành, với các Web API: `fetch`, `navigator`, ...

TypeScript chỉ đơn thuần là JavaScript, nhưng thêm cú pháp về khai báo kiểu dữ liệu. TypeScript sẽ cần một compiler để kiểm tra các khai báo kiểu dữ liệu này,
rồi trả về mã JavaScript thông thường.

Deno là một runtime mới hơn, tương tự với NodeJS, có thể tương tác với hệ điều hành như đọc file, gửi dữ liệu, ... Deno có thể chạy TypeScript.
