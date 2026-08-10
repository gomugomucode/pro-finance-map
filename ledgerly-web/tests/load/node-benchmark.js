import http from "http";

/**
 * High-concurrency Node.js Benchmark Runner for Ledgerly API & Concurrency Load Measurement
 */

const TARGET_HOST = process.env.TARGET_HOST || "localhost";
const TARGET_PORT = parseInt(process.env.TARGET_PORT || "5173", 10);
const CONCURRENCY_LEVELS = [10, 50, 100, 200];
const REQUESTS_PER_BATCH = 100;

function makeRequest(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request(
      {
        host: TARGET_HOST,
        port: TARGET_PORT,
        path,
        method: "GET",
        headers: {
          "x-request-id": `bench_${Math.random().toString(36).substring(2, 10)}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 500, durationMs: Date.now() - start });
        });
      },
    );

    req.on("error", () => {
      resolve({ statusCode: 500, durationMs: Date.now() - start });
    });

    req.end();
  });
}

async function runConcurrencyBatch(concurrency) {
  const latencies = [];
  let successCount = 0;
  let failCount = 0;

  const startTime = Date.now();
  const tasks = [];

  for (let i = 0; i < concurrency; i++) {
    tasks.push(
      (async () => {
        for (let j = 0; j < REQUESTS_PER_BATCH / concurrency; j++) {
          const res = await makeRequest("/api/health");
          latencies.push(res.durationMs);
          if (res.statusCode === 200) successCount++;
          else failCount++;
        }
      })(),
    );
  }

  await Promise.all(tasks);
  const totalDurationMs = Date.now() - startTime;

  latencies.sort((a, b) => a - b);
  const minLatencyMs = latencies[0] || 0;
  const maxLatencyMs = latencies[latencies.length - 1] || 0;
  const sumMs = latencies.reduce((acc, curr) => acc + curr, 0);
  const avgLatencyMs = Math.round(sumMs / latencies.length);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Index] || maxLatencyMs;
  const requestsPerSec = Math.round((successCount / (totalDurationMs / 1000)) * 100) / 100;

  return {
    concurrency,
    totalRequests: latencies.length,
    successfulRequests: successCount,
    failedRequests: failCount,
    totalDurationMs,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    p95LatencyMs,
    requestsPerSec,
  };
}

async function main() {
  console.log("=====================================================");
  console.log("Starting Ledgerly Concurrency & Load Benchmark");
  console.log(`Target: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log("=====================================================\n");

  const results = [];

  for (const concurrency of CONCURRENCY_LEVELS) {
    console.log(`Testing Concurrency: ${concurrency} parallel connections...`);
    const metrics = await runConcurrencyBatch(concurrency);
    results.push(metrics);
    console.log(`  Requests/sec: ${metrics.requestsPerSec}`);
    console.log(`  Avg Latency:  ${metrics.avgLatencyMs}ms`);
    console.log(`  P95 Latency:  ${metrics.p95LatencyMs}ms`);
    console.log(`  Errors:       ${metrics.failedRequests}\n`);
  }

  console.log("Benchmark Complete. Summary JSON Output:");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
