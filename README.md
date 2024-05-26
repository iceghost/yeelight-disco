# Yeelight Disco

_TLDR: Mình sẽ trình bày các bước mình đã làm để làm đèn nháy bảy màu trong phòng. Qua đó mình cũng sẽ nói về một số khái niệm
liên quan, như JS runtime, TCP, UTF-8, ..._

Chuyện là phòng mình có một cây đèn Yeelight. Đèn này có thể được điều khiển bằng điện thoại, có đèn nền nhiều màu sắc.
Tuy nhiên, app chỉ cung cấp một vài hiệu ứng, nhìn khá chán.

![IMG_1303](https://github.com/iceghost/yeelight-disco/assets/40488299/2673da6d-3db1-4548-bc90-95eda7d0c4ed)

Kết quả mình sẽ làm được như sau:

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

## Tạo kết nối

Bước đầu tiên là tạo kết nối TCP tới đèn.

Ở đây, API để kết nối TCP là do runtime cung cấp, nên sẽ được Deno cung cấp thông qua namespace `Deno`.

https://github.com/iceghost/yeelight-disco/blob/71cd69fb0a61b8d478fd1b003d6b89c87fb93335/main.ts#L1-L7

Tiếp theo, ta gửi dữ liệu đến đèn:

https://github.com/iceghost/yeelight-disco/blob/71cd69fb0a61b8d478fd1b003d6b89c87fb93335/main.ts#L9-L12

Ta cần `TextEncoder` để chuyển đổi dữ liệu string sang bytes. Tại sao phải cần làm vậy?

Nếu đã học qua C thì ai cũng biết string thường được
biểu diễn bằng `char[]`, một mảng các ký tự / byte, dùng bảng mã ASCII. Tuy nhiên, nếu mỗi ký tự chỉ được biểu diễn bởi 1 char -
8 bits (mà chưa kể ASCII chỉ dùng 7 bits nữa, 1 bit để kiểm tra lỗi bằng parity) thì không thể đủ cho toàn bộ các chữ
cái trên thế giới. Ví dụ, chữ "â" trong tiếng Việt không nằm trong bảng mã ASCII.

Thế nên người ta thường đặt ra một số chuẩn để biểu diễn các chữ cái trên máy tính. Sẽ có hai phần:

- Cách gắn một chữ cái bằng một số.

  Phổ biến nhất là bảng mã Unicode, chữ "â" được biểu diễn bằng số `0xE2`.
- Cách biểu diễn số này bằng các byte.

  Ví dụ, UTF-32 biểu diễn mỗi ký tự bằng 4 bytes cứng.

  UTF-8 biểu diễn mỗi ký tự tốn 1-6 byte tùy theo code point. Các ký tự thông dụng sẽ tốn ít byte hơn các ký tự ít thông dụng.

  "â" được biểu diễn bằng bằng 4 byte `0x000000E2` trong UTF-32, 2 byte `	0x00E2` trong UTF-16 và 2 byte `0xC3 0xA2` trong UTF-8

JavaScript biểu diễn chuỗi bằng UTF-16, nên ta phải sử dụng `TextEncoder` để chuyển từ UTF-16 sang UTF-8 để đèn hiểu dược.

Ta có thể chạy thử:

```console
$ deno run main.ts                                                                                                                                                
┌ ⚠️  Deno requests net access to "192.168.100.123:55443".                                                                                                                    
├ Requested by `Deno.connect()` API.                                                                                                                                          
├ Run again with --allow-net to bypass this prompt.                                                                                                                           
└ Allow? [y/n/A] (y = yes, allow; n = no, deny; A = allow all net permissions) >   
```

Đây là một tính năng bảo mật của Deno: các tính năng liên quan đến I/O đều phải dược cấp quyền trước khi chạy. Nhập y để đồng ý.

```console
$ deno run main.ts                                                                                                                                                
✅ Granted net access to "192.168.100.123:55443". 
```

Tuy nhiên, đèn không có phản hồi gì hết!.

Đọc kỹ spec thì các lệnh phải được ngắt bởi CRLF - `\r\n`. Thêm vào:

https://github.com/iceghost/yeelight-disco/blob/7e2083279ddd6edfa2dac92b19292d5042e49f84/main.ts#L11-L11

Lúc này đèn đã tắt:

![IMG_1304](https://github.com/iceghost/yeelight-disco/assets/40488299/9bfa9fcb-286b-4d2d-b4ae-4ab9c163aad9)

Copy ví dụ về các để chuyển đèn lặp đi lặp lại các trạng thái:

https://github.com/iceghost/yeelight-disco/blob/f608d0a97dc5fcaff53ff0393cf42537bb832832/main.ts#L10-L19

Kết quả:

https://github.com/iceghost/yeelight-disco/assets/40488299/add14936-9e15-417f-9f8b-f17bbf39af7f

(Chớp tắt, có lẽ giống như mong muốn)

TODO: viết về spec của request này?

Mình sẽ thử chuyển cái request này về request để đèn cháy bảy màu cầu vòng, bằng cách tạo ra một chuỗi gồm 255 màu:

https://github.com/iceghost/yeelight-disco/blob/0f3de92814d184d8e30c064bbac082368225f6a0/main.ts#L9-L12
https://github.com/iceghost/yeelight-disco/blob/0f3de92814d184d8e30c064bbac082368225f6a0/main.ts#L14-L24

Mà có vẻ đèn không thích điều này lắm :) Không thấy phản hồi gì hết.

Ngoài chiều gửi thì mình còn có chiều nhận. Log phản hồi của đèn ra ngoài output, để coi lỗi là gì:

TODO: viết về web stream?

https://github.com/iceghost/yeelight-disco/blob/c6498a6c3757e98971bf4e7b976b250e35fe9033/main.ts#L25-L25

```console
$ deno run -A main.ts                                                                                                                                             
{"id":1,"error":{"code":-5001,"message":"invalid params"}}
```

Refactor request ra ngoài để log được:

https://github.com/iceghost/yeelight-disco/blob/5a7aa946a874624db36e431a14d9e4b96063d52f/main.ts#L14-L19
https://github.com/iceghost/yeelight-disco/blob/5a7aa946a874624db36e431a14d9e4b96063d52f/main.ts#L22-L27

```console
$ deno run -A main.ts                                                                                                                                             
{                                                                                                                                                                             
  id: 1,                                                                                                                                                                      
  method: "bg_start_cf",                                                                                                                                                      
  params: [                                                                                                                                                                   
    0,                                                                                                                                                                        
    0,                                                                                                                                                                        
    "20,1,0,-1,20,1,65793,-1,20,1,131586,-1,20,1,197379,-1,20,1,263172,-1,20,1,328965,-1,20,1,394758,-1,2"... 4077 more characters                                            
  ]                                                                                                                                                                           
}                                                                                                                                                                             
{"id":1,"error":{"code":-5001,"message":"invalid params"}}                                                                                                                    
```

Mình đoán chắc là request to quá. Giảm nó thành một vài màu thôi!

https://github.com/iceghost/yeelight-disco/blob/e7469f0e4a950db60f60e9e028a1d14f9e495d82/main.ts#L9-L12

Đèn phản hồi:

https://github.com/iceghost/yeelight-disco/assets/40488299/e49feb05-6e70-4adf-a7d7-049a7eaf99e2

Cuối cùng, chuyển nó thành chỉ một vài RGB cho nổi bật và tận hưởng thành quả:

https://github.com/iceghost/yeelight-disco/blob/03ed7db48b3f3a907188dc00be618a913f73ec05/main.ts#L9-L12

https://github.com/iceghost/yeelight-disco/assets/40488299/ab587683-3fb9-45b6-add3-3ce4600273e0
