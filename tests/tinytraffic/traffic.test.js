import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const source = readFileSync(new URL("../../dashboards/tinytraffic/tinytraffic.bar", import.meta.url), "utf8");
const script = source.match(/<script[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/script>/)[1];
const metric = { visitors: 12, visits: 15, pageviews: 42, views_per_visit: 2.8, bounce_rate: 25, visit_duration: 90 };
const zero = Object.fromEntries(Object.keys(metric).map(key => [key, 0]));
function response(url, value = metric) {
  if (url.pathname === "/api/v1/sites") return [{ id: 1, domain: "one.example", timezone: "Asia/Shanghai" }, { id: 2, domain: "two.example", timezone: "America/New_York" }];
  const query = { period: url.searchParams.get("period"), from: url.searchParams.get("from") || "2026-11-05", to: url.searchParams.get("to") || "2026-11-11", interval: "day", timezone: "Asia/Shanghai", filters: url.searchParams.getAll("f").map(f => ({ dim: f.slice(0, f.indexOf(":")), value: f.slice(f.indexOf(":") + 1) })) };
  if (url.pathname.endsWith("/aggregate")) return { query, current: value, previous: zero };
  if (url.pathname.endsWith("/timeseries")) return { query, points: [{ date: query.from + "T00:00:00", ...value }] };
  if (url.pathname.endsWith("/breakdown/event")) return { total_visitors: value.visitors, rows: [] };
  if (url.pathname.includes("/breakdown/")) return { total_visitors: value.visitors, rows: [{ value: "", visitors: value.visitors, count: value.pageviews }] };
  if (url.pathname.endsWith("/realtime")) return { visitors: 3 };
  throw new Error("Unexpected request " + url);
}
function worker(route = url => response(url), store = new Map(), runtime = {}) {
  const requests = [], secrets = { api_key: "tt_test_only" }, opened = [];
  const scheduler = { now: 0, due: null };
  const env = { inputs: { base_url: "http://127.0.0.1:8080", row_limit: "5" } };
  const context = createContext({ URL, URLSearchParams, AbortController, performance, setTimeout, clearTimeout,
    fetch: async (input, options) => {
      const url = new URL(input); requests.push({ url, options });
      const result = await route(url, options);
      return result instanceof Response ? result : Response.json(result);
    },
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    $metrix: { secret: key => secrets[key], invalidate() {}, openURL: url => opened.push(url), schedule: delay => { scheduler.due = scheduler.now + delay; } },
    ...runtime,
  });
  runInContext(script.replace("export default {", "globalThis.dashboard = {"), context);
  const w = { env, requests, store, secrets, opened, scheduler, render: () => context.dashboard.render(env), refresh: () => context.dashboard.scheduled(env), event: context.dashboard.event };
  w.invoke = (key, value, handler = value === undefined ? "onClick" : "onChange") => {
    const node = nodes(w.render()).find(n => n.props?.key === key);
    if (!node?.props?.[handler]) throw new Error("Missing handler " + key);
    return node.props[handler](value);
  };
  w.render(); return w;
}
function nodes(view) {
  const out = [];
  const walk = n => { if (n && typeof n === "object") { out.push(n); for (const c of n.children || []) walk(c); } };
  walk(view.panel); return out;
}
const find = (w, key) => nodes(w.render()).find(n => n.props?.key === key);
const text = (w, key) => find(w, key)?.props.text;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function motionClock() {
  let now = 0, nextTimer = 0;
  const timers = new Map(), listeners = new Set();
  const media = { matches: false, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  return { timers, listeners, media,
    advance(ms) {
      const end = now + ms;
      while (timers.size) {
        const [id, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (timer.at > end) break;
        now = timer.at; timers.delete(id); timer.fn();
      }
      now = end;
    },
    runtime: {
      performance: { now: () => now }, matchMedia: () => media,
      setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, at: now + delay }); return id; },
      clearTimeout: id => timers.delete(id),
    },
  };
}

describe("tinytraffic behavior", () => {
  test("category transitions reverse continuously and settle on reduced motion, config changes and stop", async () => {
    const { timers, listeners, media, advance, runtime } = motionClock();
    const w = worker(undefined, new Map(), runtime);
    await w.refresh();
    w.event("lifecycle", { type: "start" });
    const requests = w.requests.length;
    w.invoke("dimension"); advance(32);
    const fadingOut = find(w, "page-transition").props;
    expect(fadingOut.opacity).toBeGreaterThan(0);
    expect(fadingOut.opacity).toBeLessThan(1);
    expect(fadingOut.ignoreInput).toBe(true);
    w.render().panel.props.shortcuts.Escape();
    expect(find(w, "page-transition").props.opacity).toBe(fadingOut.opacity);
    advance(240);
    expect(find(w, "dimension-picker")).toBeUndefined();
    expect(find(w, "page-transition").props.opacity).toBe(1);
    w.invoke("dimension"); advance(160);
    expect(find(w, "dimension-picker")).toBeDefined();
    const fadingIn = find(w, "page-transition").props.opacity;
    expect(fadingIn).toBeGreaterThan(0);
    expect(fadingIn).toBeLessThan(1);
    w.invoke("dimension-back");
    expect(find(w, "page-transition").props.opacity).toBe(fadingIn);
    advance(360);
    expect(find(w, "dimension-picker")).toBeUndefined();
    expect(find(w, "page-transition").props.opacity).toBe(1);
    expect(w.requests.length).toBe(requests);
    w.invoke("dimension"); advance(32);
    media.matches = true; for (const fn of listeners) fn();
    expect(find(w, "dimension-picker")).toBeDefined();
    expect(find(w, "page-transition").props.opacity).toBe(1);
    expect(timers.size).toBe(0);
    w.invoke("dimension-back");
    expect(find(w, "dimension-picker")).toBeUndefined();
    media.matches = false; for (const fn of listeners) fn();
    w.invoke("dimension"); advance(32);
    w.env.inputs.base_url = "http://localhost:8080"; w.render();
    expect(find(w, "dimension-picker")).toBeUndefined();
    expect(timers.size).toBe(0);
    await w.refresh(); w.invoke("dimension"); advance(32);
    w.event("lifecycle", { type: "stop" });
    expect(timers.size).toBe(0);
    expect(listeners.size).toBe(0);
    expect(find(w, "page-transition").props.opacity).toBe(1);
    w.event("lifecycle", { type: "start" });
    expect(listeners.size).toBe(1);
    w.invoke("dimension-back"); advance(360);
    expect(find(w, "dimension-picker")).toBeUndefined();
    w.event("lifecycle", { type: "stop" });
  });

  test("metric, filter and data fades share one clock without changing requests or refresh scheduling", async () => {
    const { timers, listeners, media, advance, runtime } = motionClock();
    let gate = null;
    const w = worker(async url => { if (gate) await gate.promise; return response(url); }, new Map(), runtime);
    await w.refresh(); w.event("lifecycle", { type: "start" });
    const due = w.scheduler.due, requests = w.requests.length;
    w.invoke("metric-visits"); advance(64);
    const opacity = find(w, "trend-region").props.opacity;
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    w.invoke("metric-pageviews");
    expect(find(w, "trend-region").props.opacity).toBe(opacity);
    expect(find(w, "traffic-chart").props.series[0].points[0].y).toBe(metric.pageviews);
    expect(w.requests.length).toBe(requests);
    expect(timers.size).toBe(1);
    w.invoke("dimension"); advance(360);
    expect(find(w, "dimension-picker")).toBeDefined();
    w.invoke("dimension-back"); advance(360);
    expect(find(w, "trend-region").props.opacity).toBe(1);
    expect(timers.size).toBe(0);
    await w.invoke("rank-0");
    expect(find(w, "content-region").props.opacity).toBeLessThan(1);
    expect(find(w, "metric-grid").props.opacity).toBeLessThan(1);
    expect(find(w, "ranking-region").props.opacity).toBeLessThan(1);
    expect(find(w, "filter-0")).toBeDefined();
    expect(timers.size).toBe(1);
    advance(200);
    expect(find(w, "content-region").props.opacity).toBe(1);
    await w.invoke("clear-filters");
    expect(find(w, "filters")).toBeUndefined();
    advance(200);
    await w.invoke("period", "custom");
    expect(find(w, "date-from")).toBeDefined();
    expect(find(w, "content-region").props.opacity).toBeLessThan(1);
    advance(200);
    await w.invoke("period", "7d"); advance(200);
    expect(w.scheduler.due).toBe(due);
    gate = deferred();
    const pending = w.refresh();
    expect(find(w, "refresh-loading").props.paused).toBe(false);
    media.matches = true; for (const fn of listeners) fn();
    expect(find(w, "refresh-loading").props.paused).toBe(true);
    gate.resolve(); await pending; gate = null;
    expect(find(w, "refresh-loading")).toBeUndefined();
    expect(find(w, "metric-grid").props.opacity).toBe(1);
    expect(timers.size).toBe(0);
    media.matches = false; for (const fn of listeners) fn();
    await w.refresh();
    expect(find(w, "metric-grid").props.opacity).toBeLessThan(1);
    w.event("lifecycle", { type: "stop" });
    expect(timers.size).toBe(0);
    expect(listeners.size).toBe(0);
    expect(find(w, "metric-grid").props.opacity).toBe(1);
    w.event("lifecycle", { type: "start" });
    gate = deferred(); const stopped = w.refresh();
    w.event("lifecycle", { type: "stop" }); gate.resolve(); await stopped;
    expect(timers.size).toBe(0);
    expect(find(w, "refresh-loading")).toBeUndefined();
  });

  test("category return finishes while data is pending and late data cannot dismiss a reopened picker", async () => {
    const { advance, runtime } = motionClock();
    let gate = null, fail = false;
    const w = worker(async url => {
      if (url.pathname.endsWith("/breakdown/page") && gate) await gate.promise;
      if (fail && url.pathname.includes("/breakdown/")) return new Response("unavailable", { status: 503 });
      const data = response(url);
      if (data.rows?.length) data.rows[0].value = url.pathname.endsWith("/page") ? "/ready-path" : "other";
      return data;
    }, new Map(), runtime);
    await w.refresh(); w.event("lifecycle", { type: "start" });
    w.invoke("dimension"); advance(360);
    expect(find(w, "content-scroll").props.hidden).toBe(true);
    gate = deferred();
    w.invoke("dimension-option-page");
    const pending = w.refresh();
    advance(32);
    expect(find(w, "page-transition").props.opacity).toBeLessThan(1);
    advance(328);
    expect(find(w, "dimension-picker")).toBeUndefined();
    expect(find(w, "page-transition").props.opacity).toBe(1);
    expect(find(w, "content-scroll").props.hidden).toBe(false);
    expect(text(w, "ranking-empty")).toBe("正在读取排行…");
    advance(1000);
    expect(find(w, "dimension-picker")).toBeUndefined();
    w.invoke("dimension"); advance(360);
    gate.resolve(); await pending; gate = null;
    expect(find(w, "dimension-picker")).toBeDefined();
    const requests = w.requests.length;
    await w.invoke("dimension-option-page");
    expect(w.requests.length).toBe(requests);
    advance(160);
    expect(find(w, "content-scroll").props.hidden).toBe(false);
    expect(text(w, "rank-label-0")).toBe("/ready-path");
    expect(find(w, "page-transition").props.opacity).toBeGreaterThan(0);
    expect(find(w, "page-transition").props.opacity).toBeLessThan(1);
    advance(200);
    w.invoke("dimension"); advance(360); fail = true;
    w.invoke("dimension-option-utm_term"); advance(360);
    expect(find(w, "dimension-picker")).toBeUndefined();
    await w.refresh();
    expect(find(w, "dimension-picker")).toBeUndefined();
    expect(find(w, "content-scroll").props.hidden).toBe(false);
    expect(text(w, "error-ranking")).toContain("503");
    w.event("lifecycle", { type: "stop" });
  });

  test("metrics switch locally; empty source becomes an encoded direct-traffic filter", async () => {
    const w = worker(); await w.refresh();
    expect(text(w, "value-visitors")).toBe("12");
    const before = w.requests.length;
    w.invoke("metric-bounce_rate");
    expect(w.requests.length).toBe(before);
    expect(find(w, "traffic-chart").props.series[0].points[0].y).toBe(25);
    await w.invoke("rank-0");
    const statRequests = w.requests.slice(before).filter(r => r.url.searchParams.has("period"));
    for (const request of statRequests) expect(request.url.searchParams.getAll("f")).toEqual(["source:"]);
    expect(find(w, "filter-0").props.label).toContain("直接访问");
    await w.invoke("clear-filters");
    expect(find(w, "filters")).toBeUndefined();
    expect(w.requests.at(-2).url.searchParams.has("f")).toBe(false);
  });

  test("goals hide when empty, preserve data on failure, and disappear after successful removal", async () => {
    let mode = "empty";
    const w = worker(url => {
      if (!url.pathname.endsWith("/breakdown/event")) return response(url);
      if (mode === "error") return new Response("private upstream body", { status: 503 });
      return { total_visitors: 12, rows: mode === "empty" ? [] : [{ value: "Signup", visitors: 4, count: mode === "invalid" ? -1 : 9 }] };
    });
    await w.refresh();
    expect(find(w, "goals-section")).toBeUndefined();
    expect(text(w, "error-goals")).toBeUndefined();
    mode = "populated"; await w.refresh();
    expect(text(w, "goal-name-0")).toBe("Signup");
    expect(text(w, "goal-visitors-0")).toBe("4 位访客");
    expect(text(w, "goal-count-0")).toBe("完成 9 次");
    for (const failure of ["error", "invalid"]) {
      mode = failure; await w.refresh();
      expect(text(w, "goal-count-0")).toBe("完成 9 次");
      expect(text(w, "error-goals")).toBeDefined();
      expect(w.render().tray.error).not.toContain("private upstream body");
      expect(text(w, "value-visitors")).toBe("12");
    }
    mode = "empty"; await w.refresh();
    expect(find(w, "goals-section")).toBeUndefined();
    expect(text(w, "error-goals")).toBeUndefined();
  });

  test("goal clicks filter by event independently of ranking and share event breakdown requests", async () => {
    const name = "Signup: 中文 & plan=pro";
    const w = worker(url => url.pathname.endsWith("/breakdown/event")
      ? { total_visitors: 12, rows: [{ value: name, visitors: 4, count: 9 }] } : response(url));
    await w.refresh();
    await w.invoke("rank-0");
    const before = w.requests.length;
    await w.invoke("goal-0");
    for (const { url } of w.requests.slice(before).filter(r => r.url.searchParams.has("period"))) {
      expect(url.searchParams.getAll("f")).toEqual(["source:", "event:" + name]);
    }
    expect(find(w, "filter-1").props.label).toContain(name);
    const duplicate = w.requests.length;
    await w.invoke("goal-0");
    expect(w.requests.length).toBe(duplicate);
    w.invoke("dimension");
    const switchAt = w.requests.length;
    w.invoke("dimension-option-event"); await w.refresh();
    expect(w.requests.slice(switchAt).filter(r => r.url.pathname.endsWith("/breakdown/event"))).toHaveLength(1);
    expect(text(w, "rank-label-0")).toBe(name);
    expect(text(w, "goal-name-0")).toBe(name);
  });

  test("late goals cannot restore a section after changing site, range, or credentials", async () => {
    const gate = deferred(), entered = deferred();
    let slow = false;
    const w = worker(async url => {
      if (!url.pathname.endsWith("/breakdown/event")) return response(url);
      if (url.pathname.includes("/sites/2/") || url.searchParams.get("period") === "30d") return { total_visitors: 12, rows: [] };
      if (slow) { entered.resolve(); await gate.promise; }
      return { total_visitors: 12, rows: [{ value: "Signup", visitors: 4, count: 9 }] };
    });
    await w.refresh(); slow = true;
    const old = w.refresh(); await entered.promise;
    await w.invoke("site", "2");
    expect(find(w, "goals-section")).toBeUndefined();
    gate.resolve(); await old;
    expect(find(w, "goals-section")).toBeUndefined();
    slow = false; await w.invoke("site", "1");
    expect(text(w, "goal-name-0")).toBe("Signup");
    const changed = w.invoke("period", "30d");
    expect(find(w, "goals-section")).toBeUndefined(); await changed;
    await w.invoke("period", "7d");
    expect(text(w, "goal-name-0")).toBe("Signup");
    w.secrets.api_key = "";
    expect(find(w, "goals-section")).toBeUndefined();
  });

  test("zero is valid and a failed section preserves its last successful value", async () => {
    let fail = false;
    const w = worker(url => fail && url.pathname.includes("/breakdown/") ? new Response("unavailable", { status: 503 }) : response(url, zero));
    await w.refresh();
    expect(text(w, "value-visitors")).toBe("0");
    expect(text(w, "delta-visitors")).toBe("0%");
    expect(find(w, "traffic-chart").props.series[0].points[0].y).toBe(0);
    fail = true; await w.refresh();
    expect(text(w, "rank-label-0")).toBe("直接访问");
    expect(text(w, "error-ranking")).toContain("503");
    expect(text(w, "error-stats")).toBeUndefined();
  });

  test("late responses cannot overwrite a different selected site", async () => {
    const gate = deferred(), entered = deferred(); let slow = false;
    const w = worker(async url => {
      if (slow && url.pathname.includes("/sites/1/")) { entered.resolve(); await gate.promise; }
      return response(url, { ...metric, visitors: url.pathname.includes("/sites/2/") ? 22 : slow ? 999 : 12 });
    });
    await w.refresh(); slow = true;
    const old = w.refresh(); await entered.promise;
    await w.invoke("site", "2");
    expect(text(w, "value-visitors")).toBe("22");
    gate.resolve(); await old;
    expect(text(w, "value-visitors")).toBe("22");
    expect(w.render().tray.tooltip).toContain("two.example");
  });

  test("credential changes clear data and isolate in-flight responses", async () => {
    const gate = deferred(), entered = deferred(); let slow = false;
    const w = worker(async url => { if (slow) { entered.resolve(); await gate.promise; } return response(url); });
    await w.refresh(); slow = true;
    const old = w.refresh(); await entered.promise;
    w.secrets.api_key = "";
    expect(find(w, "setup")).toBeDefined();
    expect(w.render().tray.title).toBe("");
    gate.resolve(); await old;
    expect(w.render().tray.title).toBe("");
    expect(find(w, "setup")).toBeDefined();
    expect(JSON.stringify([...w.store])).not.toContain("tt_test_only");
  });

  test("long custom dates accept upstream month-start alignment", async () => {
    const w = worker(url => {
      const result = response(url);
      if (url.searchParams.get("period") === "custom" && result.query) { result.query.from = "2026-01-01"; result.query.interval = "month"; }
      return result;
    });
    await w.refresh(); await w.invoke("period", "custom");
    const before = w.requests.length;
    w.invoke("date-from", "2026-02-30"); w.invoke("date-to", "2026-11-11");
    await w.invoke("apply-dates");
    expect(w.requests.length).toBe(before);
    expect(text(w, "error-dates")).toBeDefined();
    w.invoke("date-from", "2026-01-15"); await w.invoke("apply-dates");
    expect(text(w, "range-caption")).toBe("2026-01-01 — 2026-11-11  Asia/Shanghai");
    expect(text(w, "error-stats")).toBeUndefined();
    expect(w.requests.find(r => r.url.searchParams.get("period") === "custom").url.searchParams.get("from")).toBe("2026-01-15");
  });

  test("DST repeated local hours remain separate chart buckets", async () => {
    const w = worker(url => {
      const result = response(url);
      if (result.query) { result.query.timezone = "America/New_York"; result.query.interval = "hour"; }
      if (result.points) result.points = [
        { date: "2026-11-01T01:00:00", ...metric },
        { date: "2026-11-01T01:00:00", ...metric },
        { date: "2026-11-01T02:00:00", ...metric },
      ];
      return result;
    });
    await w.refresh();
    expect(find(w, "traffic-chart").props.series[0].points.map(p => p.x)).toEqual([0, 1, 2]);
  });

  test("mismatched summary and trend ranges do not replace the successful pair", async () => {
    let mismatch = false;
    const w = worker(url => { const result = response(url, mismatch ? { ...metric, visitors: 999 } : metric); if (mismatch && result.points) result.query.to = "2026-11-12"; return result; });
    await w.refresh(); mismatch = true; await w.refresh();
    expect(text(w, "value-visitors")).toBe("12");
    expect(find(w, "traffic-chart").props.series[0].points[0].y).toBe(12);
    expect(text(w, "error-stats")).toContain("不一致");
  });

  test("invalid credentials report a safe error without rendering the server body", async () => {
    const w = worker(() => new Response("secret echoed by server", { status: 401 }));
    await w.refresh();
    expect(text(w, "error-sites")).toContain("API Key");
    expect(JSON.stringify(w.render())).not.toContain("secret echoed");
    expect(w.render().tray.title).toBe("");
  });

  test("unsafe origins cannot send the API key", async () => {
    const w = worker();
    for (const base of ["http://remote.example", "https://:hidden@stats.example", "https://stats.example/api/v1"]) {
      w.env.inputs.base_url = base; await w.refresh();
      expect(find(w, "setup")).toBeDefined();
    }
    expect(w.requests).toEqual([]);
  });

  test("empty sites remove previously visible account data", async () => {
    let empty = false;
    const w = worker(url => empty && url.pathname.endsWith("/sites") ? [] : response(url));
    await w.refresh(); empty = true; await w.refresh();
    expect(find(w, "no-sites")).toBeDefined();
    expect(find(w, "value-visitors")).toBeUndefined();
    expect(w.render().tray.title).toBe("");
    expect(find(w, "live-count")).toBeUndefined();
  });

  test("renders cannot postpone the refresh deadline and stopped workers defer scheduling", () => {
    const w = worker();
    w.env.inputs.refresh_minutes = 45;
    w.render();
    expect(w.scheduler.due).toBeNull();
    w.event("lifecycle", { type: "start" });
    expect(w.scheduler.due).toBe(45 * 60000);
    w.scheduler.now = 3 * 60000;
    w.render(); w.render(); w.event("lifecycle", { type: "start" });
    expect(w.scheduler.due).toBe(45 * 60000);
    w.env.inputs.refresh_minutes = 90;
    w.render();
    expect(w.scheduler.due).toBe(93 * 60000);
    w.event("lifecycle", { type: "stop" });
    w.env.inputs.refresh_minutes = 30;
    w.render();
    expect(w.scheduler.due).toBe(93 * 60000);
    w.event("lifecycle", { type: "start" });
    expect(w.scheduler.due).toBe(33 * 60000);
  });

  test("refresh bounds use the same three-hour fallback as an unset interval", () => {
    const w = worker();
    w.event("lifecycle", { type: "start" });
    expect(w.scheduler.due).toBe(180 * 60000);
    for (const minutes of [1, 1440, 0, 1441, 1.5, null]) {
      w.env.inputs.refresh_minutes = 60; w.render();
      w.env.inputs.refresh_minutes = minutes; w.render();
      expect(w.scheduler.due).toBe((minutes === 1 || minutes === 1440 ? minutes : 180) * 60000);
    }
  });

  test("changing cadence preserves selected filters and still allows manual refresh", async () => {
    const w = worker(); await w.refresh(); await w.invoke("rank-0");
    w.event("lifecycle", { type: "start" });
    const before = w.requests.length;
    w.env.inputs.refresh_minutes = 37;
    w.render();
    expect(w.scheduler.due).toBe(37 * 60000);
    expect(w.requests.length).toBe(before);
    expect(find(w, "filter-0")).toBeDefined();
    expect(text(w, "value-visitors")).toBe("12");
    await w.invoke("refresh");
    const aggregate = w.requests.slice(before).find(r => r.url.pathname.endsWith("/aggregate"));
    expect(aggregate.url.searchParams.getAll("f")).toEqual(["source:"]);
  });
});
