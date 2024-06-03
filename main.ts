// get this value from the app, or somehow
const IP = "192.168.100.123";

const conn = await Deno.connect({
  hostname: IP,
  port: 55443,
  transport: "tcp",
});

const flow_expr = [];
for (const rgb of [0xFF0000, 0x00FF00, 0x0000FF]) {
  flow_expr.push([100, 1, rgb, -1]);
}

const req = {
  "id": 1,
  "method": "bg_start_cf",
  "params": [0, 0, flow_expr.flat().join(",")],
};
console.log(req);

const encoder = new TextEncoder();
await conn.write(
  encoder.encode(
    JSON.stringify(req) +
      "\r\n",
  ),
);
conn.readable.pipeTo(Deno.stdout.writable);
