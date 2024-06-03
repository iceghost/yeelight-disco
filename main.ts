// get this value from the app, or somehow
const IP = "192.168.100.123";

const conn = await Deno.connect({
  hostname: IP,
  port: 55443,
  transport: "tcp",
});

const encoder = new TextEncoder();
await conn.write(
  encoder.encode(
    JSON.stringify({
      "id": 1,
      "method": "start_cf",
      "params": [4, 2, "1000,2,2700,100,500,1,255,10,5000,7,0,0,500,2,5000,1"],
    }) +
      "\r\n",
  ),
);
