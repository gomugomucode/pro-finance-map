import http from "http";

/**
 * Controlled Rate Limit Load & Decision Latency Benchmark for Ledgerly
 */

const TARGET_HOST = process.env.TARGET_HOST || "localhost";
const TARGET_PORT = parseInt(process.env.TARGET_PORT || "5173", 10);
const TOTAL_BURST_REQUESTS = 50;

function makeRequest() {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request(
      {
        host: TARGET_HOST,
        port: TARGET_PORT,
        path: "/api/health",
        method: "GET",
        headers: {
          "x-request-id": `rate_bench_${Math.random().toString(36).substring(2, 10)}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 500,
            durationMs: Date.now() - start,
            retryAfter: res.headers["retry-after"] || null,
          });
        });
      },
    );

    req.on("error", () => {
      resolve({ statusCode: 500, durationMs: Date.now() - start, retryAfter: null });
    });

    req.end();
  });
}

async function runRateLimitLoad() {
  console.log("=====================================================");
  console.log("Starting Ledgerly Rate Limit Controlled Load Test");
  console.log(`Target: http://${TARGET_HOST}:${TARGET_PORT}/api/health`);
  console.log(`Burst Size: ${TOTAL_BURST_REQUESTS} rapid requests`);
  console.log("=====================================================\n");

  const start = Date.now();
  const promises = [];

  for (let i = 0; i < TOTAL_BURST_REQUESTS; i++) {
    promises.push(makeRequest());
  }

  const results = await Promise.all(promises);
  const totalDurationMs = Date.now() - start;

  let success200 = 0;
  let rateLimited429 = 0;
  let otherStatus = 0;
  const latencies = [];

  for (const r of results) {
    latencies.push(r.durationMs);
    if (r.statusCode === 200) success200++;
    else if (r.statusCode === 429) rateLimited429++;
    else otherStatus++;
  }

  latencies.sort((a, b) => a - b);
  const avgLatencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log("Benchmark Load Summary:");
  console.log(`  Total Requests Executed: ${TOTAL_BURST_REQUESTS}`);
  console.log(`  Successful (200 OK):      ${success200}`);
  console.log(`  Rate-Limited (429):       ${rateLimited429}`);
  console.log(`  Other Status Codes:       ${otherStatus}`);
  console.log(`  Average Decision Latency: ${avgLatencyMs} ms`);
  console.log(`  P95 Decision Latency:     ${p95LatencyMs} ms`);
  console.log(`  Total Execution Window:   ${totalDurationMs} ms\n`);
}

runRateLimitLoad().catch(console.error);
