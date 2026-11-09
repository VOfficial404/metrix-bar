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
const PRIVATE = "/session_svr/v1/session_svr/single_unread";
const SESSIONS = "/session_svr/v1/session_svr/get_sessions";
const USER_CARDS = "/account/v1/user/cards";
const VIDEO_STATS = [
  ["views", "view", "播放", "show_video_views"],
  ["likes", "like", "点赞", "show_video_likes"],
  ["favorites", "favorite", "收藏", "show_video_favorites"],
  ["coins", "coin", "投币", "show_video_coins"],
  ["replies", "reply", "评论", "show_video_comments"],
];
const deltaKey = (id, field) => ["delta", id, field].join("-");
const counterKey = (id, label) => [id, label].join("-");
const privatePayload = total => ok({ follow_unread: total, unfollow_unread: 0, dustbin_unread: 0 });

function videoFeed() {
  const state = { uid: 12345, failure: null, videos: [
    { id: "BVDeltaA", published: 200, stat: { view: 20000, like: 20000, favorite: 20000, coin: 20000, reply: 20000 } },
    { id: "BVDeltaB", published: 100, stat: { view: 40, like: 40, favorite: 40, coin: 40, reply: 40 } },
  ] };
  const intercept = url => {
    if (url.pathname === NAV) return nav(state.uid);
    if (url.pathname === FANS) return ok({ mid: state.uid, follower: 1200, following: 88 });
    if (url.pathname === LIST) return state.failure === "list" ? { code: -352 } : ok({ arc_audits: state.videos.map(video =>
      ({ Archive: { bvid: video.id, ptime: video.published, state: 0 } })), page: { pn: 1, ps: 30, count: state.videos.length } });
    if (url.pathname === VIEW) {
      if (state.failure === "detail") return { code: -352 };
      const video = state.videos.find(video => video.id === url.searchParams.get("bvid"));
      return ok({ ...detail(video.id, video.published, state.uid).data, stat: { ...video.stat } });
    }
  };
  return { state, intercept };
}

// Exercise the actual .bar module with an isolated clock, session and storage.
function worker({ store = new Map(), intercept = () => undefined, secret = "fixture-session", saveSecret, inputs = {} } = {}) {
  const routes = structuredClone(fixture.http).map(route => ({ ...route, used: 0 }));
  const requests = [];
  const openedURLs = [];
  const storageWrites = [];
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
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => {
      storageWrites.push({ key, value: String(value) });
      store.set(key, String(value));
    } },
    $metrix: { secret: () => state.secret, invalidate() {}, openURL: url => openedURLs.push(url),
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
    store, state, env, clock, requests, openedURLs, storageWrites,
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

function conversation(uid, ts = 1800000000000000, extra = {}) {
  return { talker_id: uid, session_type: 1, session_ts: ts, unread_count: 2,
    system_msg_type: 0, is_intercept: 0,
    last_msg: { sender_uid: uid, receiver_type: 1, receiver_id: 12345, msg_type: 1,
      content: JSON.stringify({ content: "合成消息 " + uid }), timestamp: 1800000000, msg_status: 0 }, ...extra };
}
function conversationFeed(sessions = [conversation(70001)]) {
  const state = { uid: 12345, sessions, unread: 5, failure: null, cards: null, getSessions: null };
  const intercept = url => {
    if (url.pathname === NAV) return nav(state.uid);
    if (url.pathname === FANS) return ok({ mid: state.uid, follower: 1200, following: 88 });
    if (url.pathname === LIST && state.uid !== 12345) return ok({ arc_audits: [], page: { pn: 1, ps: 30, count: 0 } });
    if (url.pathname === PRIVATE) return state.failure === "private" ? { code: -352 } : privatePayload(state.unread);
    if (url.pathname === SESSIONS) return state.getSessions ? state.getSessions(url)
      : state.failure === "sessions" ? { code: -352, message: "synthetic-remote-private-error" }
      : ok({ session_list: state.sessions, has_more: 0 });
    if (url.pathname === USER_CARDS) return state.failure === "cards" ? { code: -352 }
      : ok(state.cards ?? url.searchParams.get("uids").split(",").reverse().map(uid =>
        ({ mid: Number(uid), name: "合成用户 " + uid, face: "http://i1.hdslb.com/bfs/face/synthetic-" + uid + ".jpg" })));
  };
  return { state, intercept };
}
const conversationIDs = w => nodes(w.render()).map(node => node.props?.key || node.key)
  .filter(key => typeof key === "string" && key.startsWith("private-session-"));
function errorSectionText(w, key) {
  const section = nodes(w.render()).find(node => node.children?.some(child => child?.props?.key === "error-" + key));
  return section?.children.map(child => child?.props?.text || "").join("\n");
}
function privateSample(w) {
  return nodes(w.render()).flatMap(node => typeof node.props?.tooltip === "string" ? node.props.tooltip.split(" · ") : [])
    .find(part => part.startsWith("私信 "));
}
function conversationSample(w) {
  return nodes({ panel: find(w.render(), "private-conversations") })
    .find(node => node.props?.tooltip?.startsWith("会话更新："))?.props.tooltip;
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
    expect(find(w.render(), "page-messages").props.ignoreInput).toBe(false);
    w.select(1);
    expect(find(w.render(), "page-videos").props.ignoreInput).toBe(false);
    w.select(0);
    expect(find(w.render(), "page-messages").props.ignoreInput).toBe(false);
    w.env.inputs.show_messages = false;
    await w.refresh();
    expect(find(w.render(), "navigation")).toBeUndefined();
    expect(find(w.render(), "page-messages")).toBeUndefined();
    expect(find(w.render(), "page-videos").props.ignoreInput).toBe(false);
    expect(value(w, "BV1FixtureNew-播放")).toBe("12.3万");
    w.env.inputs.show_messages = true;
    await w.refresh();
    w.select(0);
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
    expect(find(w.render(), "page-videos").props.ignoreInput).toBe(false);
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

describe("persistent per-video statistic changes", () => {
  test("first samples have no delta and all five counters show signed compact gains, losses and zero", async () => {
    const { state, intercept } = videoFeed();
    const w = worker({ intercept });
    await w.refresh();
    w.select("videos");
    for (const [field, , label] of VIDEO_STATS) {
      expect(value(w, counterKey("BVDeltaA", label))).toBe("2万");
      expect(value(w, deltaKey("BVDeltaA", field))).toBe("—");
      expect(value(w, deltaKey("BVDeltaB", field))).toBe("—");
    }
    w.clock.now += 21600000;
    for (const [, api] of VIDEO_STATS) state.videos[0].stat[api] = 32345;
    await w.refresh();
    for (const [field, , label] of VIDEO_STATS) {
      expect(value(w, counterKey("BVDeltaA", label))).toBe("3.2万");
      expect(value(w, deltaKey("BVDeltaA", field))).toBe("+1.2万");
      expect(value(w, deltaKey("BVDeltaB", field))).toBe("0");
    }
    w.clock.now += 21600000;
    for (const [, api] of VIDEO_STATS) state.videos[0].stat[api] = 20000;
    await w.refresh();
    for (const [field] of VIDEO_STATS) expect(value(w, deltaKey("BVDeltaA", field))).toBe("-1.2万");
  });

  test("reordering videos compares BVIDs and persists only selected numeric samples and timestamps", async () => {
    const { state, intercept } = videoFeed();
    const w = worker({ intercept });
    await w.refresh();
    const firstTimestamp = w.clock.now;
    w.clock.now += 21600000;
    state.videos[0].published = 50;
    state.videos[0].stat.view += 7;
    state.videos[1].published = 300;
    state.videos[1].stat.view -= 3;
    state.videos.reverse();
    await w.refresh();
    w.select("videos");
    const cards = nodes(w.render()).filter(node => ["BVDeltaA", "BVDeltaB"].includes(node.props?.key)).map(node => node.props.key);
    expect(cards).toEqual(["BVDeltaB", "BVDeltaA"]);
    expect(value(w, deltaKey("BVDeltaA", "views"))).toBe("+7");
    expect(value(w, deltaKey("BVDeltaB", "views"))).toBe("-3");
    state.videos.push(
      { id: "BVDeltaC", published: 200, stat: { ...state.videos[0].stat } },
      { id: "BVDeltaD", published: 100, stat: { ...state.videos[0].stat } });
    w.env.inputs.video_count = "3";
    w.clock.now += 21600000;
    await w.refresh();
    const saved = w.store.get(["videos", "v1", state.uid].join(":"));
    expect(saved).toBeDefined();
    expect(saved).toContain("BVDeltaB");
    expect(saved).not.toContain("BVDeltaA");
    const leaves = value => value !== null && typeof value === "object" ? Object.values(value).flatMap(leaves) : [value];
    const numbers = leaves(JSON.parse(saved));
    expect(numbers.every(value => typeof value === "number" && Number.isFinite(value))).toBe(true);
    expect(numbers).toContain(w.clock.now);
    expect(numbers).not.toContain(firstTimestamp);
  });

  test("discovery and detail failures retain the successful video baseline until recovery", async () => {
    const { state, intercept } = videoFeed();
    const w = worker({ intercept });
    await w.refresh();
    const key = ["videos", "v1", state.uid].join(":");
    const saved = w.store.get(key);
    for (const failure of ["list", "detail"]) {
      state.failure = failure;
      state.videos[0].stat.view += 10;
      w.clock.now += 21600000;
      await w.refresh();
      expect(w.store.get(key)).toBe(saved);
      expect(value(w, counterKey("BVDeltaA", "播放"))).toBe("2万");
      expect(value(w, deltaKey("BVDeltaA", "views"))).toBe("—");
      expect(find(w.render(), "error-videos")).toBeDefined();
    }
    state.failure = null;
    state.videos[0].stat.view += 5;
    await w.refresh();
    expect(value(w, deltaKey("BVDeltaA", "views"))).toBe("+25");
    expect(find(w.render(), "error-videos")).toBeUndefined();
  });

  test("restart restores video baselines and another UID never inherits their changes", async () => {
    const { state, intercept } = videoFeed();
    const first = worker({ intercept });
    await first.refresh();
    state.videos[0].stat.view += 12;
    const restarted = worker({ store: first.store, intercept });
    restarted.clock.now += 21600000;
    await restarted.refresh();
    expect(value(restarted, deltaKey("BVDeltaA", "views"))).toBe("+12");
    const firstUID = state.uid;
    const saved = restarted.store.get(["videos", "v1", firstUID].join(":"));
    state.uid = 67890;
    state.videos[0].stat.view = 8;
    const other = worker({ store: first.store, intercept, secret: "other-fixture-session" });
    other.clock.now += 43200000;
    await other.refresh();
    expect(value(other, deltaKey("BVDeltaA", "views"))).toBe("—");
    expect(other.store.get(["videos", "v1", firstUID].join(":"))).toBe(saved);
    expect(other.store.has(["videos", "v1", state.uid].join(":"))).toBe(true);
    state.uid = firstUID;
    state.videos[0].stat.view = 20010;
    const returned = worker({ store: first.store, intercept });
    returned.clock.now += 64800000;
    await returned.refresh();
    expect(value(returned, deltaKey("BVDeltaA", "views"))).toBe("-2");
  });

  test("disabled fields have no delta or stored zero and first enabled samples start at an em dash", async () => {
    const { state, intercept } = videoFeed();
    for (const video of state.videos) video.stat = { view: video.stat.view };
    const inputs = Object.fromEntries(VIDEO_STATS.slice(1).map(([, , , toggle]) => [toggle, false]));
    const w = worker({ intercept, inputs });
    await w.refresh();
    const saved = w.store.get(["videos", "v1", state.uid].join(":"));
    expect(saved).toBeDefined();
    expect(value(w, deltaKey("BVDeltaA", "views"))).toBe("—");
    for (const [field, , label] of VIDEO_STATS.slice(1)) {
      expect(find(w.render(), deltaKey("BVDeltaA", field))).toBeUndefined();
      expect(find(w.render(), counterKey("BVDeltaA", label))).toBeUndefined();
      expect(saved).not.toContain('"' + field + '":0');
    }
    for (const video of state.videos) for (const [, api] of VIDEO_STATS.slice(1)) video.stat[api] = 7;
    for (const [, , , toggle] of VIDEO_STATS.slice(1)) w.env.inputs[toggle] = true;
    await w.refresh();
    for (const [field, , label] of VIDEO_STATS.slice(1)) {
      expect(value(w, counterKey("BVDeltaA", label))).toBe("7");
      expect(value(w, deltaKey("BVDeltaA", field))).toBe("—");
    }
    state.videos[0].stat.like = 9;
    await w.refresh();
    expect(value(w, deltaKey("BVDeltaA", "likes"))).toBe("+2");
  });

  test("a missing enabled field fails without inventing zero or advancing any video baseline", async () => {
    const { state, intercept } = videoFeed();
    const w = worker({ intercept });
    delete state.videos[0].stat.like;
    await w.refresh();
    expect(w.store.has(["videos", "v1", state.uid].join(":"))).toBe(false);
    expect(find(w.render(), counterKey("BVDeltaA", "点赞"))).toBeUndefined();
    expect(find(w.render(), deltaKey("BVDeltaA", "likes"))).toBeUndefined();
    state.videos[0].stat.like = 10;
    await w.refresh();
    expect(value(w, deltaKey("BVDeltaA", "likes"))).toBe("—");
    const key = ["videos", "v1", state.uid].join(":");
    const saved = w.store.get(key);
    delete state.videos[0].stat.like;
    state.videos[0].stat.view += 100;
    await w.refresh();
    expect(w.store.get(key)).toBe(saved);
    expect(value(w, counterKey("BVDeltaA", "点赞"))).toBe("10");
    state.videos[0].stat.like = 12;
    await w.refresh();
    expect(value(w, deltaKey("BVDeltaA", "likes"))).toBe("+2");
    expect(value(w, deltaKey("BVDeltaA", "views"))).toBe("+100");
  });
});

describe("independent private-message refresh", () => {
  test("manual refresh fetches private messages before lifecycle start and the default timer fires at ten minutes", async () => {
    let unread = 5;
    const w = worker({ intercept: url => url.pathname === PRIVATE ? privatePayload(unread) : undefined });
    await w.refresh();
    expect(value(w, "private-total")).toBe("5");
    const beforeStart = w.requests.length;
    await w.tick(600000);
    expect(w.requests).toHaveLength(beforeStart);
    await w.event("lifecycle", { type: "start" });
    const beforeTimer = w.requests.length;
    unread = 8;
    await w.tick(599999);
    expect(w.requests).toHaveLength(beforeTimer);
    expect(value(w, "private-total")).toBe("5");
    await w.tick(1);
    expect(w.requests.slice(beforeTimer).map(({ url }) => url.pathname)).toEqual([PRIVATE]);
    expect(value(w, "private-total")).toBe("8");
    expect(value(w, "notice-likes")).toBe("8");
    expect(value(w, "followers")).toBe("1,200");
    unread = 9;
    await w.tick(600000);
    expect(w.requests.slice(beforeTimer).map(({ url }) => url.pathname)).toEqual([PRIVATE, PRIVATE]);
    expect(value(w, "private-total")).toBe("9");
  });

  test("each private_refresh select value controls the private-only timer boundary", async () => {
    for (const [setting, interval] of [["5m", 300000], ["10m", 600000], ["30m", 1800000], ["1h", 3600000], ["6h", 21600000]]) {
      const w = worker({ inputs: { private_refresh: setting } });
      await w.refresh();
      await w.event("lifecycle", { type: "start" });
      const before = w.requests.length;
      await w.tick(interval - 1);
      expect(w.requests).toHaveLength(before);
      await w.tick(1);
      expect(w.requests.slice(before).map(({ url }) => url.pathname)).toEqual([PRIVATE]);
      await w.event("lifecycle", { type: "stop" });
    }
  });

  test("changing the private refresh selection reschedules the next request", async () => {
    const w = worker();
    await w.refresh();
    await w.event("lifecycle", { type: "start" });
    await w.tick(100000);
    w.env.inputs.private_refresh = "5m";
    w.render();
    const before = w.requests.length;
    await w.tick(299999);
    expect(w.requests).toHaveLength(before);
    await w.tick(1);
    expect(w.requests.slice(before).map(({ url }) => url.pathname)).toEqual([PRIVATE]);
  });

  test("private or message disable stops the timer and re-enabling resumes it", async () => {
    for (const toggle of ["show_message_private", "show_messages"]) {
      const w = worker();
      await w.refresh();
      await w.event("lifecycle", { type: "start" });
      w.env.inputs[toggle] = false;
      w.render();
      const before = w.requests.length;
      await w.tick(1200000);
      expect(w.requests).toHaveLength(before);
      expect(find(w.render(), "private-total")).toBeUndefined();
      w.env.inputs[toggle] = true;
      w.render();
      await w.tick(599999);
      expect(w.requests).toHaveLength(before);
      await w.tick(1);
      expect(w.requests.slice(before).map(({ url }) => url.pathname)).toEqual([PRIVATE]);
    }
  });

  test("lifecycle stop cancels the timer and repeated starts do not duplicate it", async () => {
    const w = worker();
    await w.refresh();
    await w.event("lifecycle", { type: "start" });
    await w.event("lifecycle", { type: "start" });
    const before = w.requests.length;
    await w.tick(600000);
    expect(w.requests.slice(before).map(({ url }) => url.pathname)).toEqual([PRIVATE]);
    await w.event("lifecycle", { type: "stop" });
    const stopped = w.requests.length;
    await w.tick(1200000);
    expect(w.requests).toHaveLength(stopped);
    await w.event("lifecycle", { type: "start" });
    await w.tick(600000);
    expect(w.requests.slice(stopped).map(({ url }) => url.pathname)).toEqual([PRIVATE]);
  });

  test("a transient private failure preserves counts and the next timer request recovers", async () => {
    let failure = false, unread = 5;
    const w = worker({ intercept: url => url.pathname === PRIVATE
      ? failure ? { code: -352, message: "private-session must not be displayed" } : privatePayload(unread) : undefined });
    await w.refresh();
    await w.event("lifecycle", { type: "start" });
    const before = w.requests.length;
    failure = true;
    await w.tick(600000);
    expect(value(w, "private-total")).toBe("5");
    expect(w.render().tray.error).toContain("风控");
    expect(w.render().tray.error).not.toContain("private-session");
    expect(value(w, "notice-likes")).toBe("8");
    failure = false;
    unread = 12;
    await w.tick(600000);
    expect(value(w, "private-total")).toBe("12");
    expect(w.render().tray.error).toBe("");
    expect(w.requests.slice(before).map(({ url }) => url.pathname)).toEqual([PRIVATE, PRIVATE]);
  });

  test("manual refresh and the private timer share one in-flight private request in either order", async () => {
    for (const first of ["manual", "timer"]) {
      let held = false, release, entered;
      const pending = new Promise(resolve => { release = resolve; });
      const started = new Promise(resolve => { entered = resolve; });
      const w = worker({ intercept: url => {
        if (url.pathname === PRIVATE) {
          if (held) { entered(); return pending; }
          return privatePayload(5);
        }
      } });
      await w.refresh();
      await w.event("lifecycle", { type: "start" });
      const before = w.requests.filter(({ url }) => url.pathname === PRIVATE).length;
      held = true;
      let manual;
      if (first === "manual") {
        manual = w.refresh();
        await started;
        await w.tick(600000);
      } else {
        await w.tick(600000);
        await started;
        manual = w.refresh();
        await w.flush();
      }
      expect(w.requests.filter(({ url }) => url.pathname === PRIVATE)).toHaveLength(before + 1);
      expect(value(w, "private-total")).toBe("5");
      release(privatePayload(17));
      await manual;
      await w.flush();
      expect(value(w, "private-total")).toBe("17");
      expect(w.requests.filter(({ url }) => url.pathname === PRIVATE)).toHaveLength(before + 1);
    }
  });

  test("disable and stop discard late timer success and failure outcomes", async () => {
    for (const action of ["private-disable", "messages-disable", "stop"]) {
      for (const outcome of [privatePayload(99), { code: -352 }]) {
        let held = false, release, signal;
        const pending = new Promise(resolve => { release = resolve; });
        const w = worker({ intercept: (url, options) => {
          if (url.pathname === PRIVATE) {
            if (held) { signal = options.signal; return pending; }
            return privatePayload(5);
          }
        } });
        await w.refresh();
        await w.event("lifecycle", { type: "start" });
        held = true;
        await w.tick(600000);
        expect(signal).toBeDefined();
        if (action === "stop") await w.event("lifecycle", { type: "stop" });
        else {
          w.env.inputs[action === "private-disable" ? "show_message_private" : "show_messages"] = false;
          w.render();
        }
        expect(signal.aborted).toBe(true);
        const before = w.requests.length;
        release(outcome);
        await w.flush();
        if (action !== "stop") {
          w.env.inputs[action === "private-disable" ? "show_message_private" : "show_messages"] = true;
          w.render();
        }
        expect(value(w, "private-total")).not.toBe("99");
        expect(w.render().tray.error).toBe("");
        if (action === "stop") {
          await w.tick(1200000);
          expect(w.requests).toHaveLength(before);
        }
      }
    }
  });

  test("credential changes cancel the old timer and suppress late outcomes after a new account refresh", async () => {
    for (const outcome of [privatePayload(99), { code: -352 }]) {
      let held = false, release, signal;
      const pending = new Promise(resolve => { release = resolve; });
      const w = worker({ intercept: (url, options) => {
        const second = options.headers.Cookie === "SESSDATA=second-fixture-session";
        if (url.pathname === NAV && second) return nav(67890);
        if (url.pathname === FANS && second) return ok({ mid: 67890, follower: 3, following: 1 });
        if (url.pathname === LIST && second) return ok({ arc_audits: [], page: { pn: 1, ps: 30, count: 0 } });
        if (url.pathname === PRIVATE) {
          if (second) return privatePayload(7);
          if (held) { signal = options.signal; return pending; }
          return privatePayload(5);
        }
      } });
      await w.refresh();
      await w.event("lifecycle", { type: "start" });
      held = true;
      await w.tick(600000);
      expect(signal).toBeDefined();
      w.state.secret = "";
      w.render();
      expect(signal.aborted).toBe(true);
      const before = w.requests.length;
      await w.tick(1200000);
      expect(w.requests).toHaveLength(before);
      w.state.secret = "second-fixture-session";
      await w.refresh();
      expect(value(w, "uid")).toBe("UID 67890");
      expect(value(w, "private-total")).toBe("7");
      release(outcome);
      await w.flush();
      expect(value(w, "private-total")).toBe("7");
      expect(w.render().tray.error).toBe("");
    }
  });
});

describe("optional private conversation cards", () => {
  test("summary is the default and never requests sessions or identity cards", async () => {
    for (const inputs of [{}, { private_display: "summary" }]) {
      const feed = conversationFeed();
      const w = worker({ inputs, intercept: feed.intercept });
      await w.refresh();
      expect(value(w, "private-total")).toBe("5");
      expect(value(w, "notice-likes")).toBe("8");
      expect(find(w.render(), "private-conversations")).toBeUndefined();
      expect(w.requests.some(({ url }) => [SESSIONS, USER_CARDS].includes(url.pathname))).toBe(false);
    }
  });

  test("conversation requests require both messages and private messages to be enabled", async () => {
    for (const toggle of ["show_messages", "show_message_private"]) {
      const feed = conversationFeed();
      const w = worker({ inputs: { private_display: "list", [toggle]: false }, intercept: feed.intercept });
      await w.refresh();
      expect(find(w.render(), "private-conversations")).toBeUndefined();
      expect(w.requests.some(({ url }) => [PRIVATE, SESSIONS, USER_CARDS].includes(url.pathname))).toBe(false);
    }
  });

  test("list mode retains unread totals and notifications and honors every conversation count", async () => {
    for (const [setting, expected] of [[undefined, 5], ["3", 3], ["5", 5], ["10", 10]]) {
      const feed = conversationFeed(Array.from({ length: 12 }, (_, i) => conversation(70001 + i, 1800000000000000 - i)));
      const w = worker({ inputs: { private_display: "list", ...(setting ? { private_count: setting } : {}) }, intercept: feed.intercept });
      await w.refresh();
      expect(conversationIDs(w)).toHaveLength(expected);
      expect(value(w, "private-total")).toBe("5");
      expect(value(w, "notice-likes")).toBe("8");
      expect(value(w, "notice-reply")).toBeDefined();
      expect(find(w.render(), "private-conversations")).toBeDefined();
      const cards = w.requests.find(({ url }) => url.pathname === USER_CARDS).url;
      expect(cards.searchParams.get("uids").split(",")).toHaveLength(expected);
    }
  });

  test("identity cards match MID despite reordered responses and use the fixed conversation link", async () => {
    const feed = conversationFeed([conversation(70001, 1800000000000002), conversation(70002, 1800000000000001)]);
    const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
    await w.refresh();
    for (const uid of [70001, 70002]) {
      expect(value(w, "conversation-name-" + uid)).toBe("合成用户 " + uid);
      expect(value(w, "conversation-uid-" + uid)).toBe("UID " + uid);
      expect(value(w, "conversation-unread-" + uid)).toContain("2");
      expect(value(w, "conversation-time-" + uid)).toMatch(/\d{2}:\d{2}/);
      const card = find(w.render(), "private-session-" + uid);
      const avatar = nodes({ panel: card }).find(node => node.props?.src);
      expect(avatar.props.src).toBe("https://i1.hdslb.com/bfs/face/synthetic-" + uid + ".jpg");
      await w.click("private-session-" + uid);
    }
    expect(w.openedURLs).toEqual(["https://message.bilibili.com/#/whisper/mid70001", "https://message.bilibili.com/#/whisper/mid70002"]);
    const request = w.requests.find(({ url }) => url.pathname === USER_CARDS);
    expect(request.url.hostname).toBe("api.vc.bilibili.com");
    expect(request.url.search).toContain("uids=70001%2C70002");
    expect(request.options.headers.Cookie).toBe("SESSDATA=fixture-session");
  });

  test("missing identities fall back to the actual UID and untrusted avatar URLs stay out of the view", async () => {
    const feed = conversationFeed([conversation(70001), conversation(70002, 1799999999999999)]);
    feed.state.cards = [{ mid: 70002, name: "合成第二用户", face: "https://untrusted.invalid/synthetic-face.jpg" },
      { mid: 99999, name: "不相关的合成身份", face: "https://i0.hdslb.com/bfs/face/unrelated.jpg" }];
    const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
    await w.refresh();
    expect(value(w, "conversation-name-70001")).toContain("70001");
    expect(value(w, "conversation-uid-70001")).toBe("UID 70001");
    expect(value(w, "conversation-name-70002")).toBe("合成第二用户");
    expect(JSON.stringify(w.render())).not.toContain("untrusted.invalid");
    expect(JSON.stringify(w.render())).not.toContain("不相关的合成身份");
    expect(find(w.render(), "error-conversations")).toBeUndefined();
  });

  test("session ordering filters groups, system, intercepted and self sessions and deduplicates talkers", async () => {
    const feed = conversationFeed([
      conversation(70003, 1800000000000003), conversation(70001, 1800000000000001),
      conversation(70002, 1800000000000002), conversation(70002, 1800000000000004),
      conversation(71001, 1800000000000010, { session_type: 2 }),
      conversation(0, 1800000000000009, { system_msg_type: 1 }),
      conversation(71003, 1800000000000008, { is_intercept: 1 }), conversation(12345, 1800000000000007),
    ]);
    const w = worker({ inputs: { private_display: "list", private_count: "3" }, intercept: feed.intercept });
    await w.refresh();
    expect(conversationIDs(w)).toEqual(["private-session-70002", "private-session-70003", "private-session-70001"]);
    expect(w.requests.find(({ url }) => url.pathname === USER_CARDS).url.searchParams.get("uids")).toBe("70002,70003,70001");
  });

  test("pagination uses the minimum microsecond cursor and continues until enough distinct eligible talkers", async () => {
    const feed = conversationFeed();
    feed.state.getSessions = url => url.searchParams.has("end_ts")
      ? ok({ session_list: [conversation(70001, 1800000000000015), conversation(70002, 1800000000000014),
        conversation(70003, 1800000000000013)], has_more: 1 })
      : ok({ session_list: [conversation(70001, 1800000000000020),
        conversation(71001, 1800000000000016, { session_type: 2 }), conversation(70001, 1800000000000018)], has_more: 1 });
    const w = worker({ inputs: { private_display: "list", private_count: "3" }, intercept: feed.intercept });
    await w.refresh();
    expect(conversationIDs(w)).toEqual(["private-session-70001", "private-session-70002", "private-session-70003"]);
    const requests = w.requests.filter(({ url }) => url.pathname === SESSIONS);
    expect(requests).toHaveLength(2);
    expect(requests[0].url.origin).toBe("https://api.vc.bilibili.com");
    expect(Object.fromEntries(requests[0].url.searchParams)).toEqual({ session_type: "1", group_fold: "1", unfollow_fold: "0",
      sort_rule: "2", size: "20", build: "0", mobi_app: "web" });
    expect(requests[1].url.searchParams.get("end_ts")).toBe("1800000000000016");
    expect(requests[0].options.signal).toBe(requests[1].options.signal);
  });

  test("pagination rejects repeated or increasing cursors instead of looping or publishing a partial list", async () => {
    for (const [next, hasMore, fill] of [[1800000000000010, 1, false], [1800000000000011, 1, false],
      [1800000000000010, 0, false], [1800000000000011, 0, false],
      [1800000000000010, 1, true], [1800000000000011, 0, true]]) {
      const feed = conversationFeed();
      feed.state.getSessions = url => url.searchParams.has("end_ts")
        ? ok({ session_list: [conversation(70002, next), ...(fill ? [conversation(70003, next)] : [])], has_more: hasMore })
        : ok({ session_list: [conversation(70001, 1800000000000010)], has_more: 1 });
      const w = worker({ inputs: { private_display: "list", private_count: "3" }, intercept: feed.intercept });
      await w.refresh();
      expect(w.requests.filter(({ url }) => url.pathname === SESSIONS)).toHaveLength(2);
      expect(w.requests.some(({ url }) => url.pathname === USER_CARDS)).toBe(false);
      expect(find(w.render(), "error-conversations")).toBeDefined();
      expect(conversationIDs(w)).toEqual([]);
      expect(value(w, "private-total")).toBe("5");
    }
  });

  test("exhausted null, empty and entirely filtered sessions are successful empty lists", async () => {
    for (const sessions of [null, [], [conversation(71001, 1800000000000000, { session_type: 2 })]]) {
      const feed = conversationFeed(sessions);
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(find(w.render(), "no-conversations")).toBeDefined();
      expect(find(w.render(), "error-conversations")).toBeUndefined();
      expect(conversationIDs(w)).toEqual([]);
      expect(w.requests.some(({ url }) => url.pathname === USER_CARDS)).toBe(false);
    }
  });

  test("invalid session envelopes and unsafe session fields are errors rather than successful empty data", async () => {
    const payloads = [{}, { session_list: {}, has_more: 0 }, { session_list: [], has_more: 2 },
      { session_list: [], has_more: 1 }, { session_list: null, has_more: 1 },
      { session_list: [conversation(70001)], has_more: undefined },
      { session_list: [conversation(70001, Number.MAX_SAFE_INTEGER + 1)], has_more: 0 },
      { session_list: [conversation(70001, 1800000000000000, { unread_count: -1 })], has_more: 0 }];
    for (const payload of payloads) {
      const feed = conversationFeed();
      feed.state.getSessions = () => ok(payload);
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(find(w.render(), "error-conversations")).toBeDefined();
      expect(find(w.render(), "no-conversations")).toBeUndefined();
      expect(value(w, "private-total")).toBe("5");
    }
  });

  test("malformed identity responses fail independently instead of manufacturing usable profiles", async () => {
    for (const cards of [{}, [null], [{ mid: "70001", name: "合成错型身份" }], [{ mid: 70001, name: 99 }]]) {
      const feed = conversationFeed();
      feed.state.cards = cards;
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(find(w.render(), "error-conversations")).toBeDefined();
      expect(conversationIDs(w)).toEqual([]);
      expect(value(w, "private-total")).toBe("5");
      expect(find(w.render(), "error-private")).toBeUndefined();
    }
  });

  test("text, outgoing, image, emoji, absent and unsupported message previews are safe and descriptive", async () => {
    const variants = [
      [{ content: JSON.stringify({ content: "合成入站文本" }) }, "合成入站文本"],
      [{ sender_uid: 12345, receiver_id: 70001, content: JSON.stringify({ content: "合成出站文本" }) }, "我：合成出站文本"],
      [{ msg_type: 2, content: JSON.stringify({ url: "https://untrusted.invalid/image-payload" }) }, "[图片]"],
      [{ sender_uid: 12345, receiver_id: 70001, msg_type: 2, content: JSON.stringify({ url: "https://untrusted.invalid/image-payload" }) }, "我：[图片]"],
      [{ msg_type: 6, content: JSON.stringify({ content: "synthetic-emoji-payload" }) }, "[表情]"],
    ];
    for (const [changes, expected] of variants) {
      const session = conversation(70001);
      Object.assign(session.last_msg, changes);
      const feed = conversationFeed([session]);
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(value(w, "conversation-preview-70001")).toBe(expected);
      expect(JSON.stringify(w.render())).not.toContain("untrusted.invalid");
      expect(JSON.stringify(w.render())).not.toContain("synthetic-emoji-payload");
    }
    const empty = conversationFeed([conversation(70001, 1800000000000000, { last_msg: null })]);
    const w = worker({ inputs: { private_display: "list" }, intercept: empty.intercept });
    await w.refresh();
    expect(value(w, "conversation-preview-70001")).toBe("暂无消息内容");
    empty.state.sessions[0].last_msg = { ...conversation(70001).last_msg, msg_type: 999,
      content: JSON.stringify({ content: "synthetic-unsupported-raw-content" }) };
    await w.refresh();
    expect(value(w, "conversation-preview-70001")).toMatch(/消息|类型|不支持/);
    expect(JSON.stringify(w.render())).not.toContain("synthetic-unsupported-raw-content");
  });

  test("recall types, status flags and cancellation payloads never expose recalled text", async () => {
    for (const changes of [{ msg_type: 5 }, { msg_status: 1 }, { msg_status: 2 },
      { sys_cancel: true }]) {
      const session = conversation(70001);
      Object.assign(session.last_msg, { content: JSON.stringify({ content: "synthetic-recalled-private-text" }) }, changes);
      const feed = conversationFeed([session]);
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(value(w, "conversation-preview-70001")).toBe("[消息已撤回]");
      expect(JSON.stringify(w.render())).not.toContain("synthetic-recalled-private-text");
    }
  });

  test("malformed text previews explicitly report unavailable content without exposing raw JSON", async () => {
    for (const content of ["{synthetic-malformed-private-json", JSON.stringify({ other: "synthetic-malformed-private-json" }),
      JSON.stringify({ content: 42 })]) {
      const session = conversation(70001);
      session.last_msg.content = content;
      const feed = conversationFeed([session]);
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(value(w, "conversation-preview-70001")).toMatch(/无法|不可用|暂不可|格式|解析/);
      expect(JSON.stringify(w.render())).not.toContain("synthetic-malformed-private-json");
    }
  });

  test("last messages must belong to the current account and the selected talker", async () => {
    for (const changes of [{ sender_uid: 99999 }, { receiver_id: 99999 }, { receiver_type: 2 },
      { sender_uid: 12345, receiver_id: 12345 }, { sender_uid: 70002, receiver_id: 70001 }]) {
      const session = conversation(70001);
      Object.assign(session.last_msg, { content: JSON.stringify({ content: "synthetic-unrelated-message" }) }, changes);
      const feed = conversationFeed([session]);
      const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
      await w.refresh();
      expect(JSON.stringify(w.render())).not.toContain("synthetic-unrelated-message");
      expect(value(w, "conversation-preview-70001") || value(w, "error-conversations")).toMatch(/无法|不可用|暂不可|结构|格式|解析/);
    }
  });

  test("conversation and unread errors retain their own last successes and recover independently", async () => {
    const feed = conversationFeed();
    const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
    await w.refresh();
    const preview = value(w, "conversation-preview-70001");
    const messageTime = value(w, "conversation-time-70001");
    const initialPrivate = privateSample(w);
    const initialConversation = conversationSample(w);
    expect(initialPrivate).toBeDefined();
    expect(initialConversation).toBeDefined();
    w.clock.now += 60000;
    feed.state.failure = "sessions";
    feed.state.unread = 9;
    await w.refresh();
    expect(value(w, "private-total")).toBe("9");
    expect(privateSample(w)).not.toBe(initialPrivate);
    expect(conversationSample(w)).toBe(initialConversation);
    expect(value(w, "conversation-preview-70001")).toBe(preview);
    expect(value(w, "conversation-time-70001")).toBe(messageTime);
    expect(find(w.render(), "error-private")).toBeUndefined();
    expect(errorSectionText(w, "conversations")).toContain("上次成功");
    const lastConversationError = errorSectionText(w, "conversations");
    w.clock.now += 60000;
    await w.refresh();
    expect(errorSectionText(w, "conversations")).toBe(lastConversationError);
    expect(JSON.stringify(w.render())).not.toContain("synthetic-remote-private-error");
    const lastPrivate = privateSample(w);
    feed.state.failure = "private";
    feed.state.sessions[0].last_msg.content = JSON.stringify({ content: "合成恢复后的会话" });
    w.clock.now += 60000;
    await w.refresh();
    expect(value(w, "private-total")).toBe("9");
    expect(privateSample(w)).toBe(lastPrivate);
    expect(conversationSample(w)).not.toBe(initialConversation);
    expect(find(w.render(), "error-private")).toBeDefined();
    expect(find(w.render(), "error-conversations")).toBeUndefined();
    expect(value(w, "conversation-preview-70001")).toBe("合成恢复后的会话");
    feed.state.failure = null;
    await w.refresh();
    expect(w.render().tray.error).toBe("");
  });

  test("identity request failures preserve prior cards while unread totals continue updating", async () => {
    const feed = conversationFeed();
    const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
    await w.refresh();
    feed.state.failure = "cards";
    feed.state.unread = 13;
    feed.state.sessions = [conversation(70002)];
    await w.refresh();
    expect(value(w, "private-total")).toBe("13");
    expect(conversationIDs(w)).toEqual(["private-session-70001"]);
    expect(value(w, "conversation-name-70001")).toBe("合成用户 70001");
    expect(find(w.render(), "error-conversations")).toBeDefined();
    expect(find(w.render(), "error-private")).toBeUndefined();
  });

  test("the list timer refreshes unread, sessions and cards without notifications or other metrics", async () => {
    const feed = conversationFeed();
    const w = worker({ inputs: { private_display: "list" }, intercept: feed.intercept });
    await w.refresh();
    await w.event("lifecycle", { type: "start" });
    const before = w.requests.length;
    feed.state.unread = 11;
    feed.state.sessions[0].last_msg.content = JSON.stringify({ content: "合成定时更新" });
    await w.tick(599999);
    expect(w.requests).toHaveLength(before);
    await w.tick(1);
    const requests = w.requests.slice(before);
    expect(requests.map(({ url }) => url.pathname).sort()).toEqual([PRIVATE, SESSIONS, USER_CARDS].sort());
    expect(new Set(requests.map(({ options }) => options.signal)).size).toBe(1);
    expect(value(w, "private-total")).toBe("11");
    expect(value(w, "conversation-preview-70001")).toBe("合成定时更新");
    expect(value(w, "notice-likes")).toBe("8");
    expect(value(w, "followers")).toBe("1,200");
  });

  test("manual and timer refreshes share the entire session and identity request job in either order", async () => {
    for (const phase of [SESSIONS, USER_CARDS]) {
      for (const first of ["manual", "timer"]) {
        const feed = conversationFeed();
        let hold = false, release, entered;
        const pending = new Promise(resolve => { release = resolve; });
        const started = new Promise(resolve => { entered = resolve; });
        const w = worker({ inputs: { private_display: "list" }, intercept: (url, options) => {
          if (hold && url.pathname === phase) { entered(); return pending; }
          return feed.intercept(url, options);
        } });
        await w.refresh();
        await w.event("lifecycle", { type: "start" });
        await w.tick(599999);
        const before = w.requests.length;
        hold = true;
        let manual;
        if (first === "manual") {
          manual = w.refresh();
          await started;
          await w.tick(1);
        } else {
          await w.tick(1);
          await started;
          manual = w.refresh();
          await w.flush();
        }
        for (const path of [PRIVATE, SESSIONS, USER_CARDS]) {
          expect(w.requests.slice(before).filter(({ url }) => url.pathname === path).length).toBeLessThanOrEqual(1);
        }
        release(phase === SESSIONS ? ok({ session_list: [conversation(70002)], has_more: 0 })
          : ok([{ mid: 70001, name: "合成合并请求用户", face: "" }]));
        await manual;
        await w.flush();
        for (const path of [PRIVATE, SESSIONS, USER_CARDS]) {
          expect(w.requests.slice(before).filter(({ url }) => url.pathname === path)).toHaveLength(1);
        }
        expect(value(w, phase === SESSIONS ? "conversation-name-70002" : "conversation-name-70001"))
          .toBe(phase === SESSIONS ? "合成用户 70002" : "合成合并请求用户");
      }
    }
  });

  test("disable, summary and stop abort session or identity work and ignore late success and failure", async () => {
    for (const action of ["show_message_private", "show_messages", "summary", "stop"]) {
      for (const phase of [SESSIONS, USER_CARDS]) {
        for (const failure of [false, true]) {
          const feed = conversationFeed();
          let hold = false, release, signal;
          const pending = new Promise(resolve => { release = resolve; });
          const w = worker({ inputs: { private_display: "list" }, intercept: (url, options) => {
            if (hold && url.pathname === phase) { signal = options.signal; return pending; }
            return feed.intercept(url, options);
          } });
          await w.refresh();
          await w.event("lifecycle", { type: "start" });
          hold = true;
          await w.tick(600000);
          expect(signal).toBeDefined();
          if (action === "stop") await w.event("lifecycle", { type: "stop" });
          else {
            if (action === "summary") w.env.inputs.private_display = "summary";
            else w.env.inputs[action] = false;
            w.render();
          }
          expect(signal.aborted).toBe(true);
          const before = w.requests.length;
          release(failure ? { code: -352, message: "synthetic-late-private-error" }
            : phase === SESSIONS ? ok({ session_list: [conversation(70009)], has_more: 0 })
            : ok([{ mid: 70001, name: "synthetic-late-private-name", face: "" }]));
          await w.flush();
          expect(JSON.stringify(w.render())).not.toContain("synthetic-late-private");
          expect(find(w.render(), "private-session-70009")).toBeUndefined();
          expect(find(w.render(), "error-conversations")).toBeUndefined();
          if (action === "stop") {
            await w.tick(1200000);
            expect(w.requests).toHaveLength(before);
          } else {
            if (action === "summary") w.env.inputs.private_display = "list";
            else w.env.inputs[action] = true;
            w.render();
            expect(conversationIDs(w)).toEqual([]);
          }
        }
      }
    }
  });

  test("count and refresh configuration changes abort stale conversation jobs", async () => {
    for (const [setting, next] of [["private_count", "3"], ["private_refresh", "5m"]]) {
      const feed = conversationFeed();
      let hold = false, release, signal;
      const pending = new Promise(resolve => { release = resolve; });
      const w = worker({ inputs: { private_display: "list" }, intercept: (url, options) => {
        if (hold && url.pathname === SESSIONS) { signal = options.signal; return pending; }
        return feed.intercept(url, options);
      } });
      await w.refresh();
      await w.event("lifecycle", { type: "start" });
      hold = true;
      await w.tick(600000);
      w.env.inputs[setting] = next;
      w.render();
      expect(signal.aborted).toBe(true);
      release(ok({ session_list: [conversation(70009)], has_more: 0 }));
      await w.flush();
      expect(find(w.render(), "private-session-70009")).toBeUndefined();
      expect(find(w.render(), "error-conversations")).toBeUndefined();
    }
  });

  test("account changes clear conversation memory and suppress old session and identity responses", async () => {
    for (const phase of [SESSIONS, USER_CARDS]) {
      for (const failure of [false, true]) {
        const feed = conversationFeed();
        let hold = false, release, signal;
        const pending = new Promise(resolve => { release = resolve; });
        const w = worker({ inputs: { private_display: "list" }, intercept: (url, options) => {
          if (hold && feed.state.uid === 12345 && url.pathname === phase) { signal = options.signal; return pending; }
          return feed.intercept(url, options);
        } });
        await w.refresh();
        await w.event("lifecycle", { type: "start" });
        hold = true;
        await w.tick(600000);
        feed.state.uid = 67890;
        feed.state.sessions = [conversation(70002)];
        feed.state.sessions[0].last_msg.receiver_id = 67890;
        w.state.secret = "second-synthetic-session";
        expect(conversationIDs(w)).toEqual([]);
        expect(signal.aborted).toBe(true);
        await w.refresh();
        expect(value(w, "uid")).toBe("UID 67890");
        expect(conversationIDs(w)).toEqual(["private-session-70002"]);
        release(failure ? { code: -352 } : phase === SESSIONS
          ? ok({ session_list: [conversation(70009)], has_more: 0 })
          : ok([{ mid: 70001, name: "synthetic-old-account-name", face: "" }]));
        await w.flush();
        expect(conversationIDs(w)).toEqual(["private-session-70002"]);
        expect(JSON.stringify(w.render())).not.toContain("synthetic-old-account-name");
        expect(find(w.render(), "error-conversations")).toBeUndefined();
      }
    }
  });

  test("conversation content and identities are never persisted or restored after worker restart", async () => {
    const feed = conversationFeed();
    const store = new Map();
    const inputs = { private_display: "list" };
    const w = worker({ store, inputs, intercept: feed.intercept });
    await w.refresh();
    expect(value(w, "conversation-preview-70001")).toBe("合成消息 70001");
    const saved = JSON.stringify({ current: [...store], writes: w.storageWrites });
    for (const marker of ["合成消息", "合成用户", "synthetic-70001.jpg", "70001", "fixture-session"]) expect(saved).not.toContain(marker);
    expect(w.state.saved).toEqual([]);
    const restarted = worker({ store, inputs, intercept: feed.intercept });
    expect(conversationIDs(restarted)).toEqual([]);
    expect(JSON.stringify(restarted.render())).not.toContain("合成消息");
    expect(JSON.stringify(restarted.render())).not.toContain("合成用户");
    const privateRequests = w.requests.filter(({ url }) => url.hostname === "api.vc.bilibili.com");
    expect(privateRequests.every(({ options }) => !options.method || options.method === "GET")).toBe(true);
  });
});
