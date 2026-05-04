/**
 * Content Delivery API Test
 * Run: node test-api.js
 */

const BASE_URL = "http://localhost:4000/api/v1";
const TENANT_ID = "portal"; // 換成 "doit" 可測資訊局

const endpoints = [
  { method: "GET", path: "/open/site",        desc: "站台資訊" },
  { method: "GET", path: "/open/pages",       desc: "已發布頁面列表" },
  { method: "GET", path: "/open/pages/:slug", desc: "單一頁面（用不存在的 slug 測試）" },
  { method: "GET", path: "/open/categories",  desc: "分類樹" },
  { method: "GET", path: "/open/navigation",  desc: "導覽列" },
  { method: "GET", path: "/open/media",       desc: "媒體檔案" },
];

async function test(method, path) {
  const url = new URL(
    BASE_URL + path.replace(":slug", "test-slug-that-does-not-exist")
  );
  if (path === "/open/pages") url.searchParams.set("limit", "5");
  if (path === "/open/media") url.searchParams.set("limit", "5");

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: { "X-Tenant-ID": TENANT_ID },
    });
    const data = await res.json();

    // /open/pages/:slug with unknown slug should 404 — that's expected
    const expected404 = path.includes(":slug");
    const ok = expected404 ? res.status === 404 : res.ok;

    return { path, status: res.status, ok, data };
  } catch (err) {
    return { path, status: "ERR", ok: false, error: err.message };
  }
}

async function main() {
  console.log("\n+------------------------------------+");
  console.log("|  Content Delivery API Test         |");
  console.log("+------------------------------------+");
  console.log(`\nBase: ${BASE_URL}   Tenant: ${TENANT_ID}\n`);

  let pass = 0;
  for (const ep of endpoints) {
    const r = await test(ep.method, ep.path);
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`[${mark}]  ${ep.method} ${ep.path}`);
    console.log(`    → HTTP ${r.status}  |  ${ep.desc}`);
    if (r.ok && r.data?.data !== undefined) {
      const preview = JSON.stringify(r.data.data).slice(0, 80);
      console.log(`    → data: ${preview}${preview.length >= 80 ? "..." : ""}`);
    }
    if (!r.ok && r.data?.error) {
      console.log(`    → error: ${r.data.error.message}`);
    }
    if (r.error) console.log(`    → ${r.error}`);
    console.log();
    if (r.ok) pass++;
  }

  console.log(`結果：${pass}/${endpoints.length} 通過\n`);
}

main().catch(console.error);
