const IP = "192.168.100.123";

const conn = await Deno.connect({
  hostname: IP,
  port: 55443,
  transport: "tcp",
});

const flow_expr = [];
for (let rgb = 0; rgb <= 0xFFFFFF; rgb += Math.floor(0xFFFFFF / 10)) {
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
