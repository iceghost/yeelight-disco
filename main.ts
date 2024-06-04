const IP = "192.168.100.123";

const conn = await Deno.connect({
  hostname: IP,
  port: 55443,
  transport: "tcp",
});

const encoder = new TextEncoder();
await conn.write(
  encoder.encode('{"id":1,"method":"set_power","params":["off"]}'),
);
