import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const source = readFileSync(new URL("../../dashboards/bilibili/bilibili-account.bar", import.meta.url), "utf8");
const script = source.match(/<script[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/script>/)[1];
const fixture = JSON.parse(readFileSync(new URL("./fixtures/account.json", import.meta.url), "utf8"));
const loginFixture = JSON.parse(readFileSync(new URL("./fixtures/login.json", import.meta.url), "utf8"));
const qrGeneration = () => JSON.parse(loginFixture.http[0].body);
const NAV = "/x/web-interface/nav";
const FANS = "/x/relation/stat";
const LIST = "/x/web/archives";
const VIEW = "/x/web-interface/view";
const ok = data => ({ code: 0, data });

// Exercise the actual .bar module with an isolated clock, session and storage.
function worker({ store = new Map(), intercept = () => undefined, secret = "fixture-session", saveSecret, inputs = {} } = {}) {
  const routes = structuredClone(fixture.http).map(route => ({ ...route, used: 0 }));
  const requests = [];
  const clock = { now: Date.parse(fixture.now) };
  const timers = new Map();
  let timerID = 0;
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const setTimer = (callback, delay) => {
    const id = ++timerID;
    timers.set(id, { callback, at: clock.now + delay });
    return id;
  };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const state = { secret, saved: [] };
  const context = createContext({
    Date: ClockDate, AbortSignal, AbortController, URL, URLSearchParams,
    setTimeout: setTimer, clearTimeout: id => timers.delete(id),
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) },
    $metrix: { secret: () => state.secret, invalidate() {}, openURL() {},
      async setSecret(name, value) {
        if (saveSecret) await saveSecret(name, value);
        state.saved.push({ name, value });
        state.secret = value;
      } },
    fetch: async (address, options) => {
      const url = new URL(address);
      requests.push({ url, options });
      let payload = await intercept(url, options);
      if (payload === undefined) {
        const route = routes.find(route => route.url === address && (!route.times || route.used < route.times));
        if (!route) throw new Error("Unmatched fixture request");
        route.used++;
        payload = JSON.parse(route.body);
      }
      if (payload instanceof Response) return payload;
      return { ok: true, status: 200, headers: new Headers(), json: async () => payload };
    },
  });
  runInContext(script.replace("export default", "globalThis.dashboard ="), context);
  const env = { inputs: { video_count: "3", ...inputs }, reason: "manual" };
  return {
    store, state, env, clock, requests,
    render: () => context.dashboard.render(env),
    refresh: () => context.dashboard.scheduled(env),
    click: key => find(context.dashboard.render(env), key).props.onClick(),
    event: (name, payload) => context.dashboard.event(name, payload),
    flush,
    async tick(ms = 2000) {
      clock.now += ms;
      const due = [...timers].filter(([, timer]) => timer.at <= clock.now);
      for (const [id, timer] of due) {
        if (!timers.delete(id)) continue;
        timer.callback();
      }
      await flush();
    },
    select(value) { find(context.dashboard.render(env), "navigation").props.onChange(value); },
  };
}
function nodes(view) {
  const result = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    result.push(node);
    for (const child of node.children || []) visit(child);
  }
  visit(view.panel);
  return result;
}
function find(view, key) { return nodes(view).find(node => node.props?.key === key || node.key === key); }
function value(w, key) { return find(w.render(), key)?.props.text; }
function body(w) { return nodes(w.render()).map(node => node.props?.text || "").join("\n"); }
function nav(uid = 12345, extra = {}) {
  return ok({ isLogin: true, mid: uid, uname: "账户 " + uid, money: 172.4,
    level_info: { current_level: 5, current_exp: 20000, current_min: 10800, next_exp: 28800 }, ...extra });
}
function detail(id, published, uid = 12345) {
  return ok({ bvid: id, title: id, pubdate: published, owner: { mid: uid },
    stat: { view: 0, like: 0, favorite: 0, coin: 0, reply: 0 } });
}

describe("Bilibili dashboard behavior", () => {
  test("missing login shows setup instructions without fetching or leaking credentials", async () => {
    const w = worker({ secret: "" });
    await w.refresh();
    expect(w.requests).toEqual([]);
    expect(find(w.render(), "login-start").props.disabled).toBe(false);
    w.state.secret = "SESSDATA=sensitive-session; other=secret";
    await w.refresh();
    expect(w.requests).toEqual([]);
    expect(JSON.stringify(w.render())).not.toContain("sensitive-session");
  });

  test("disabled videos and messages remove their pages, actions and network requests", async () => {
    const w = worker({ inputs: { show_videos: false, show_messages: false } });
    await w.refresh();
    expect(find(w.render(), "page-videos")).toBeUndefined();
    expect(find(w.render(), "page-messages")).toBeUndefined();
    expect(find(w.render(), "navigation")).toBeUndefined();
    expect(value(w, "coins")).toBe("172.4");
    expect(w.requests.some(({ url }) => url.pathname === LIST || url.pathname === VIEW || url.hostname === "api.vc.bilibili.com")).toBe(false);
    expect(w.render().tray.menu.some(item => item.label === "打开私信")).toBe(false);
  });

  test("account feature switches hide only their own metrics and can be re-enabled", async () => {
    const w = worker();
    await w.refresh();
    w.env.inputs.show_identity = false;
    expect(find(w.render(), "uid")).toBeUndefined();
    expect(find(w.render(), "coins")).toBeUndefined();
    expect(value(w, "followers")).toBe("1,200");
    expect(value(w, "level")).toBe("Lv.6");
    w.env.inputs.show_level = false;
    expect(find(w.render(), "experience")).toBeUndefined();
    expect(find(w.render(), "senior-member")).toBeUndefined();
    expect(value(w, "followers")).toBe("1,200");
    w.env.inputs.show_identity = true;
    expect(value(w, "coins")).toBe("172.4");
    expect(find(w.render(), "level")).toBeUndefined();
  });

  test("all features off retain login and a settings hint without optional requests", async () => {
    const w = worker({ inputs: { show_identity: false, show_followers: false, show_level: false, show_videos: false, show_messages: false } });
    await w.refresh();
    expect(w.requests.map(({ url }) => url.pathname)).toEqual([NAV]);
    expect(value(w, "account-name")).toBe("示例 UP 主");
    expect(find(w.render(), "navigation")).toBeUndefined();
    for (const key of ["uid", "coins", "followers", "level", "page-videos", "page-messages"]) expect(find(w.render(), key)).toBeUndefined();
    expect(w.render().tray.tooltip).not.toContain("UID");
    expect(w.render().tray.error).toBe("");
  });

  test("disabling followers clears old errors and resumes from the last successful sample", async () => {
    let followers = 1200, fail = false;
    const w = worker({ intercept: url => url.pathname === FANS
      ? fail ? { code: -352 } : ok({ mid: 12345, follower: followers, following: 88 }) : undefined });
    await w.refresh();
    const saved = w.store.get("followers:v1:12345");
    fail = true;
    await w.refresh();
    expect(w.render().tray.error).toContain("风控");
    w.env.inputs.show_followers = false;
    const before = w.requests.length;
    await w.refresh();
    expect(w.requests.slice(before).some(({ url }) => url.pathname === FANS)).toBe(false);
    expect(find(w.render(), "followers")).toBeUndefined();
    expect(w.render().tray.title).not.toContain("粉丝");
    expect(w.render().tray.error).toBe("");
    expect(w.store.get("followers:v1:12345")).toBe(saved);
    followers = 1400;
    fail = false;
    w.env.inputs.show_followers = true;
    await w.refresh();
    expect(value(w, "follower-delta")).toBe("+200");
  });

  test("visible tab indices stay correct when account modules or the active page are disabled", async () => {
    const w = worker({ inputs: { show_identity: false, show_followers: false, show_level: false } });
    await w.refresh();
    expect(find(w.render(), "tab-account")).toBeUndefined();
    expect(find(w.render(), "page-videos").props.ignoreInput).toBe(false);
    w.select(1);
    expect(find(w.render(), "page-messages").props.ignoreInput).toBe(false);
    w.env.inputs.show_messages = false;
    await w.refresh();
    expect(find(w.render(), "navigation")).toBeUndefined();
    expect(find(w.render(), "page-messages")).toBeUndefined();
    expect(find(w.render(), "page-videos").props.ignoreInput).toBe(false);
    expect(value(w, "BV1FixtureNew-播放")).toBe("12.3万");
    w.env.inputs.show_messages = true;
    await w.refresh();
    w.select(1);
    expect(find(w.render(), "page-messages").props.ignoreInput).toBe(false);
  });

  test("disabling an in-flight module cancels its request and ignores a late failure", async () => {
    let release, entered, signal;
    const started = new Promise(resolve => { entered = resolve; });
    const pending = new Promise(resolve => { release = resolve; });
    const w = worker({ intercept: async (url, options) => {
      if (url.pathname === LIST) { signal = options.signal; entered(); return pending; }
    } });
    const first = w.refresh();
    await started;
    w.env.inputs.show_videos = false;
    const second = w.refresh();
    expect(signal.aborted).toBe(true);
    release({ code: -352 });
    await Promise.all([first, second]);
    expect(find(w.render(), "page-videos")).toBeUndefined();
    expect(w.render().tray.error).toBe("");
    expect(w.requests.filter(({ url }) => url.pathname === LIST)).toHaveLength(1);
  });

  test("video fields can be reduced without validating hidden counters", async () => {
    const w = worker({ inputs: { show_video_cover: false, show_video_date: false, show_video_likes: false, show_video_favorites: false, show_video_coins: false },
      intercept: url => {
        if (url.pathname === VIEW) {
          const data = detail(url.searchParams.get("bvid"), 100).data;
          data.stat = { view: 12345, reply: 7 };
          return ok(data);
        }
      } });
    await w.refresh();
    w.select("videos");
    expect(value(w, "BV1FixtureNew-播放")).toBe("1.2万");
    expect(value(w, "BV1FixtureNew-评论")).toBe("7");
    expect(find(w.render(), "BV1FixtureNew-stats").props.columns).toBe(2);
    for (const suffix of ["cover", "date", "点赞", "收藏", "投币"]) expect(find(w.render(), "BV1FixtureNew-" + suffix)).toBeUndefined();
    expect(find(w.render(), "error-videos")).toBeUndefined();
  });

  test("video titles remain usable with every optional field off and no stat payload", async () => {
    const w = worker({ inputs: { show_video_cover: false, show_video_date: false, show_video_views: false, show_video_likes: false, show_video_favorites: false, show_video_coins: false, show_video_comments: false },
      intercept: url => {
        if (url.pathname === VIEW) {
          const data = detail(url.searchParams.get("bvid"), 100).data;
          delete data.stat;
          return ok(data);
        }
      } });
    await w.refresh();
    w.select("videos");
    expect(find(w.render(), "BV1FixtureNew")).toBeDefined();
    expect(find(w.render(), "BV1FixtureNew-stats")).toBeUndefined();
    expect(find(w.render(), "BV1FixtureNew" + "-cover")).toBeUndefined();
    expect(find(w.render(), "BV1FixtureNew-date")).toBeUndefined();
    expect(find(w.render(), "error-videos")).toBeUndefined();
  });

  test("private-only messages skip notification requests and use the full card width", async () => {
    const w = worker({ inputs: { show_message_likes: false, show_message_replies: false, show_message_mentions: false, show_message_system: false, show_message_assistant: false } });
    await w.refresh();
    w.select("messages");
    expect(value(w, "private-total")).toBe("5");
    expect(find(w.render(), "message-cards").props.columns).toBe(1);
    for (const key of ["notice-likes", "notice-reply", "notice-at", "notice-system", "notice-assistant"]) expect(find(w.render(), key)).toBeUndefined();
    expect(w.requests.some(({ url }) => url.pathname === "/x/im/web/msgfeed/unread")).toBe(false);
  });

  test("one notification can be enabled without fetching or advertising private messages", async () => {
    const w = worker({ inputs: { show_message_private: false, show_message_replies: false, show_message_mentions: false, show_message_system: false, show_message_assistant: false } });
    await w.refresh();
    w.select("messages");
    expect(value(w, "notice-likes")).toBe("8");
    expect(find(w.render(), "message-cards").props.columns).toBe(1);
    expect(find(w.render(), "private-total")).toBeUndefined();
    expect(w.requests.some(({ url }) => url.pathname.includes("single_unread"))).toBe(false);
    expect(w.render().tray.menu.some(item => item.label === "打开私信")).toBe(false);
  });

  test("disabling all message items hides the active page and preserves selections across the master switch", async () => {
    const w = worker();
    await w.refresh();
    w.select("messages");
    Object.assign(w.env.inputs, { show_message_private: false, show_message_likes: false, show_message_replies: false, show_message_mentions: false, show_message_system: false, show_message_assistant: false });
    const before = w.requests.length;
    await w.refresh();
    expect(find(w.render(), "page-messages")).toBeUndefined();
    expect(find(w.render(), "page-account").props.ignoreInput).toBe(false);
    expect(w.requests.slice(before).some(({ url }) => url.hostname === "api.vc.bilibili.com")).toBe(false);
    w.env.inputs.show_message_system = true;
    await w.refresh();
    w.select("messages");
    expect(value(w, "notice-system")).toBe("2");
    expect(find(w.render(), "private-total")).toBeUndefined();
    w.env.inputs.show_messages = false;
    await w.refresh();
    w.env.inputs.show_messages = true;
    await w.refresh();
    w.select("messages");
    expect(value(w, "notice-system")).toBe("2");
    expect(find(w.render(), "notice-likes")).toBeUndefined();
  });

  test("disabling notifications clears their previous error without losing private counts", async () => {
    const w = worker({ intercept: url => url.pathname === "/x/im/web/msgfeed/unread" ? { code: -352 } : undefined });
    await w.refresh();
    w.select("messages");
    expect(find(w.render(), "error-notifications")).toBeDefined();
    Object.assign(w.env.inputs, { show_message_likes: false, show_message_replies: false, show_message_mentions: false, show_message_system: false, show_message_assistant: false });
    await w.refresh();
    expect(value(w, "private-total")).toBe("5");
    expect(find(w.render(), "error-notifications")).toBeUndefined();
    expect(w.render().tray.error).toBe("");
  });

  test("combined replies and mentions do not appear when either item is disabled", async () => {
    const w = worker({ inputs: { show_message_mentions: false }, intercept: url => url.pathname === "/x/im/web/msgfeed/unread"
      ? ok({ recv_reply: 4 }) : undefined });
    await w.refresh();
    w.select("messages");
    expect(value(w, "notice-reply")).toBe("—");
    expect(find(w.render(), "notice-at")).toBeUndefined();
    expect(find(w.render(), "notice-combined")).toBeUndefined();
    w.env.inputs.show_message_mentions = true;
    await w.refresh();
    expect(find(w.render(), "notice-combined")).toBeDefined();
  });

  test("followers preserve the last successful baseline through failure and restart, including losses", async () => {
    let followers = 1200, fail = false;
    const intercept = url => url.pathname === FANS
      ? fail ? { code: -352, message: "secret must not be displayed" } : ok({ mid: 12345, follower: followers, following: 88 })
      : undefined;
    const w = worker({ intercept });
    await w.refresh();
    expect(value(w, "follower-delta")).toBe("首次建立基线");
    w.clock.now += 21600000;
    followers = 1212;
    await w.refresh();
    expect(value(w, "follower-delta")).toBe("+12");
    const saved = w.store.get("followers:v1:12345");
    fail = true;
    await w.refresh();
    expect(w.store.get("followers:v1:12345")).toBe(saved);
    expect(value(w, "followers")).toBe("1,212");
    expect(w.render().tray.error).toContain("风控");
    expect(w.render().tray.error).not.toContain("secret must not be displayed");
    followers = 1201;
    fail = false;
    const restarted = worker({ store: w.store, intercept });
    restarted.clock.now = w.clock.now + 21600000;
    await restarted.refresh();
    expect(value(restarted, "follower-delta")).toBe("-11");
    expect(restarted.render().tray.title).toContain("(-11)");
  });

  test("max level preserves XP and distinguishes hardcore membership from VIP", async () => {
    for (const senior of [0, 1, undefined]) {
      const w = worker({ intercept: url => url.pathname === NAV ? nav(12345, {
        is_senior_member: senior, vipStatus: 1,
        level_info: { current_level: 6, current_exp: 50000, current_min: 28800, next_exp: "--" },
      }) : undefined });
      await w.refresh();
      expect(value(w, "coins")).toBe("172.4");
      expect(value(w, "level")).toBe("Lv.6");
      expect(value(w, "experience")).toBe("累计经验 50,000 · 已满级");
      expect(find(w.render(), "senior-member") !== undefined).toBe(senior === 1);
    }
  });

  test("message counts separate private messages, intercepted messages, mentions and duplicate new fields", async () => {
    const w = worker();
    await w.refresh();
    w.select("messages");
    expect(value(w, "private-total")).toBe("5");
    expect(value(w, "notice-reply")).toBe("4");
    expect(value(w, "notice-at")).toBe("3");
    expect(value(w, "notice-likes")).toBe("8");
  });

  test("latest videos exclude collaborations, sort by publish time, and preserve real zero counters", async () => {
    const w = worker({ intercept: url => {
      if (url.pathname === LIST) return ok({ arc_audits: [
        { Archive: { bvid: "BV1Old", ptime: 100, state: 0 } },
        { Archive: { bvid: "BV1Collab", ptime: 400, state: 0 } },
        { Archive: { bvid: "BV1New", ptime: 300, state: 0 } },
        { Archive: { bvid: "BV1WrongOwner", ptime: 250, state: 0 } },
        { Archive: { bvid: "BV1Middle", ptime: 200, state: 0 } },
      ], page: { pn: 1, ps: 30, count: 5 } });
      if (url.pathname === VIEW) {
        const id = url.searchParams.get("bvid");
        return detail(id, { BV1Old: 100, BV1New: 300, BV1WrongOwner: 250, BV1Middle: 200, BV1Collab: 400 }[id], ["BV1WrongOwner", "BV1Collab"].includes(id) ? 999 : 12345);
      }
    } });
    await w.refresh();
    w.select("videos");
    const cards = nodes(w.render()).filter(node => ["BV1New", "BV1Middle", "BV1Old"].includes(node.props?.key)).map(node => node.props.key);
    expect(cards).toEqual(["BV1New", "BV1Middle", "BV1Old"]);
    expect(value(w, "BV1New-播放")).toBe("0");
    expect(body(w)).not.toContain("BV1Collab");
    expect(body(w)).not.toContain("BV1WrongOwner");
  });

  test("creator discovery survives public HTTP 412 and excludes private uploads across server-sized pages", async () => {
    const w = worker({ intercept: url => {
      if (url.pathname === "/x/series/recArchivesByKeywords") return new Response("blocked", { status: 412 });
      if (url.pathname === LIST) {
        const pn = Number(url.searchParams.get("pn"));
        return ok({ arc_audits: pn === 1 ? [
          { Archive: { bvid: "BV1Private", ptime: 500, state: -40 } },
          { Archive: { bvid: "BV1Collab", ptime: 400, state: 0 } },
        ] : [
          { Archive: { bvid: "BV1Own", ptime: 300, state: 0 } },
        ], page: { pn, ps: 2, count: 3 } });
      }
      if (url.pathname === VIEW) {
        const id = url.searchParams.get("bvid");
        return detail(id, id === "BV1Own" ? 300 : 400, id === "BV1Own" ? 12345 : 999);
      }
    } });
    await w.refresh();
    w.select("videos");
    expect(value(w, "BV1Own-播放")).toBe("0");
    expect(find(w.render(), "BV1Private")).toBeUndefined();
    expect(find(w.render(), "BV1Collab")).toBeUndefined();
    expect(find(w.render(), "error-videos")).toBeUndefined();
  });

  test("a real empty upload list differs from a risk payload, and failed stats retain previous videos", async () => {
    let mode = "normal";
    const w = worker({ intercept: url => {
      if (url.pathname === LIST && mode === "empty") return ok({ arc_audits: [], page: { pn: 1, ps: 30, count: 0 } });
      if (url.pathname === LIST && mode === "risk") return ok({ v_voucher: "challenge" });
      if (url.pathname === VIEW && mode === "bad-stat") return ok({ bvid: "BV1FixtureNew", title: "broken", pubdate: 100, owner: { mid: 12345 }, stat: { view: 0 } });
    } });
    await w.refresh();
    w.select("videos");
    const previousViews = value(w, "BV1FixtureNew-播放");
    mode = "bad-stat";
    await w.refresh();
    expect(value(w, "BV1FixtureNew-播放")).toBe(previousViews);
    expect(body(w)).toContain("数据结构已变化");
    mode = "empty";
    await w.refresh();
    expect(value(w, "no-videos")).toBe("还没有公开发布的视频");
    mode = "risk";
    await w.refresh();
    expect(body(w)).toContain("风控");
  });

  test("expired login preserves current data and rejects service text containing secrets", async () => {
    let expired = false;
    const w = worker({ intercept: url => expired && url.pathname === NAV
      ? { code: -101, message: "fixture-session should stay private" } : undefined });
    await w.refresh();
    expired = true;
    await w.refresh();
    expect(value(w, "uid")).toBe("UID 12345");
    expect(w.render().tray.error).toContain("登录会话已失效");
    expect(JSON.stringify(w.render())).not.toContain("fixture-session");
  });

  test("switching credentials while a request is pending cannot expose the previous account", async () => {
    let release, entered;
    const started = new Promise(resolve => { entered = resolve; });
    const pending = new Promise(resolve => { release = resolve; });
    const w = worker({ intercept: async (url, options) => {
      const second = options.headers.Cookie === "SESSDATA=second-session";
      if (url.pathname === NAV) {
        if (!second) { entered(); await pending; }
        return nav(second ? 67890 : 12345);
      }
      if (url.pathname === FANS && second) return ok({ mid: 67890, follower: 7, following: 1 });
      if (url.pathname === LIST && second) return ok({ arc_audits: [], page: { pn: 1, ps: 30, count: 0 } });
    } });
    const firstRefresh = w.refresh();
    await started;
    w.state.secret = "second-session";
    expect(body(w)).not.toContain("UID 12345");
    const secondRefresh = w.refresh();
    release();
    await Promise.all([firstRefresh, secondRefresh]);
    expect(value(w, "uid")).toBe("UID 67890");
    expect(value(w, "followers")).toBe("7");
    expect(value(w, "follower-delta")).toBe("首次建立基线");
    expect(w.store.has("followers:v1:12345")).toBe(false);
  });

  test("QR login waits for mobile confirmation, verifies the account and securely connects it", async () => {
    let status = 86101;
    const session = "fixture-qr-session%2Cvalue";
    const w = worker({ secret: "", intercept: url => {
      if (url.pathname.endsWith("/qrcode/generate")) return qrGeneration();
      if (url.pathname.endsWith("/qrcode/poll")) return ok({ code: status,
        url: "https://passport.biligame.com/crossDomain?SESSDATA=" + encodeURIComponent(session) });
    } });
    await w.click("login-start");
    expect(find(w.render(), "login-qr").props.svg).toContain("<svg");
    await w.tick();
    expect(w.state.saved).toEqual([]);
    status = 86090;
    await w.tick();
    expect(find(w.render(), "login-qr")).toBeDefined();
    expect(w.state.saved).toEqual([]);
    status = 0;
    await w.tick();
    expect(value(w, "uid")).toBe("UID 12345");
    expect(value(w, "coins")).toBe("172.4");
    expect(find(w.render(), "login-qr")).toBeUndefined();
    expect(w.state.saved).toEqual([{ name: "sessdata", value: session }]);
    expect(JSON.stringify(w.render())).not.toContain(session);
    expect([...w.store.values()].join("")).not.toContain(session);
  });

  test("canonical Set-Cookie takes precedence and callback query sessions are encoded once", async () => {
    for (const canonical of [true, false]) {
      const w = worker({ secret: "", intercept: url => {
        if (url.pathname.endsWith("/qrcode/generate")) return qrGeneration();
        if (url.pathname.endsWith("/qrcode/poll")) return new Response(JSON.stringify(ok({ code: 0,
          url: "https://passport.biligame.com/crossDomain?SESSDATA=from-query%2Craw" })),
          { headers: canonical ? { "set-cookie": "SESSDATA=canonical%2Cvalue; Path=/; HttpOnly, bili_jct=unused; Path=/" } : {} });
      } });
      await w.click("login-start");
      await w.tick();
      expect(w.state.secret).toBe(canonical ? "canonical%2Cvalue" : "from-query%2Craw");
      expect(value(w, "uid")).toBe("UID 12345");
    }
  });

  test("cancelled and replaced QR requests cannot save a late authentication result", async () => {
    let release, entered;
    const arrived = new Promise(resolve => { entered = resolve; });
    const pending = new Promise(resolve => { release = resolve; });
    let replacement = false;
    const w = worker({ secret: "", intercept: async url => {
      if (url.pathname.endsWith("/qrcode/generate")) return qrGeneration();
      if (url.pathname.endsWith("/qrcode/poll")) {
        if (!replacement) { entered(); await pending; return ok({ code: 0, url: "https://passport.biligame.com/crossDomain?SESSDATA=late-session" }); }
        return ok({ code: 86101 });
      }
    } });
    await w.click("login-start");
    const ticking = w.tick();
    await arrived;
    await w.click("login-cancel");
    replacement = true;
    await w.click("login-start");
    release();
    await ticking;
    expect(w.state.saved).toEqual([]);
    expect(w.state.secret).toBe("");
    expect(find(w.render(), "login-qr")).toBeDefined();
    await w.tick();
    expect(w.state.saved).toEqual([]);
  });

  test("expired QR codes stop polling and can be regenerated without changing the account", async () => {
    let pollCount = 0;
    const w = worker({ secret: "", intercept: url => {
      if (url.pathname.endsWith("/qrcode/generate")) return qrGeneration();
      if (url.pathname.endsWith("/qrcode/poll")) { pollCount++; return ok({ code: 86038 }); }
    } });
    await w.click("login-start");
    await w.tick();
    expect(find(w.render(), "login-qr")).toBeUndefined();
    await w.tick();
    expect(pollCount).toBe(1);
    await w.click("login-start");
    expect(find(w.render(), "login-qr")).toBeDefined();
    await w.tick(180000);
    expect(pollCount).toBe(1);
    expect(find(w.render(), "login-qr")).toBeUndefined();
    expect(w.state.saved).toEqual([]);
  });

  test("account verification and keychain failure keep the existing session and hide sensitive errors", async () => {
    for (const mode of ["verify", "save"]) {
      const w = worker({ saveSecret: async () => { throw new Error("private-token echo"); }, intercept: (url, options) => {
        if (url.pathname.endsWith("/qrcode/generate")) return qrGeneration();
        if (url.pathname.endsWith("/qrcode/poll")) return ok({ code: 0,
          url: "https://passport.biligame.com/crossDomain?SESSDATA=replacement-session" });
        if (mode === "verify" && url.pathname === NAV && options.headers.Cookie === "SESSDATA=replacement-session") return { code: -101 };
      } });
      await w.refresh();
      await w.click("login-start");
      await w.tick();
      expect(w.state.secret).toBe("fixture-session");
      expect(w.state.saved).toEqual([]);
      expect(find(w.render(), "login-qr")).toBeUndefined();
      expect(JSON.stringify(w.render())).not.toContain("private-token echo");
      await w.click("login-cancel");
      expect(value(w, "uid")).toBe("UID 12345");
    }
  });

  test("closing the Worker cancels pending login work", async () => {
    const w = worker({ secret: "", intercept: url => url.pathname.endsWith("/qrcode/generate") ? qrGeneration() : undefined });
    await w.click("login-start");
    const requests = w.requests.length;
    await w.event("lifecycle", { type: "stop" });
    await w.tick();
    expect(w.requests.length).toBe(requests);
    expect(w.state.saved).toEqual([]);
  });

  test("non-Bilibili QR URLs and missing login credentials fail without replacing the saved account", async () => {
    for (const mode of ["foreign-url", "missing-session"]) {
      const w = worker({ secret: "", intercept: url => {
        if (url.pathname.endsWith("/qrcode/generate")) return mode === "foreign-url"
          ? ok({ qrcode_key: qrGeneration().data.qrcode_key, url: "https://example.com/login" }) : qrGeneration();
        if (url.pathname.endsWith("/qrcode/poll")) return ok({ code: 0, url: "https://passport.biligame.com/crossDomain" });
      } });
      await w.click("login-start");
      await w.tick();
      expect(w.state.saved).toEqual([]);
      expect(find(w.render(), "login-qr")).toBeUndefined();
      expect(find(w.render(), "login-start").props.disabled).toBe(false);
    }
  });
});
