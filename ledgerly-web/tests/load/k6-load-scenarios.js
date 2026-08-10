import http from "k6/http";
import { check, sleep } from "k6";

/**
 * k6 Load Test Script for Ledgerly Production Launch Certification
 * Supports 100, 500, 1000, and 5000 VU load profiles.
 */

export const options = {
  stages: [
    { duration: "30s", target: 100 }, // Ramp up to 100 VUs
    { duration: "1m", target: 500 }, // Ramp up to 500 VUs
    { duration: "1m", target: 1000 }, // Peak load 1,000 VUs
    { duration: "30s", target: 5000 }, // Stress spike 5,000 VUs
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"], // P95 under 500ms, P99 under 1.5s
    http_req_failed: ["rate<0.01"], // Error rate < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:5173";

export default function () {
  // Test Health probe endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
    "health body returns healthy": (r) => r.body && r.body.includes("healthy"),
  });

  // Test Liveness probe endpoint
  const livenessRes = http.get(`${BASE_URL}/api/liveness`);
  check(livenessRes, {
    "liveness status is 200": (r) => r.status === 200,
  });

  // Test Readiness probe endpoint
  const readinessRes = http.get(`${BASE_URL}/api/readiness`);
  check(readinessRes, {
    "readiness status is 200 or 503": (r) => r.status === 200 || r.status === 503,
  });

  // Test Landing Page html load
  const landingRes = http.get(`${BASE_URL}/`);
  check(landingRes, {
    "landing page status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
