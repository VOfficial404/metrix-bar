import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const source = readFileSync(new URL("../../dashboards/asf/asf.bar", import.meta.url), "utf8");
const script = source.match(/<script[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/script>/)[1];
const game = { AppID: 440, GameName: "Example game", CardsRemaining: 3 };
const bot = (name = "alpha", overrides = {}) => ({ BotName: name, Nickname: "演示账号", KeepRunning: true, IsConnectedAndLoggedOn: true, IsPlayingPossible: true,
  CardsFarmer: { Paused: false, NowFarming: true, CurrentGamesFarming: [game], GamesToFarm: [game] }, ...overrides });
function worker(route) {
  const calls = [], secrets = { ipc_key: "asf-fixture-only" };
  const env = { inputs: { base_url: "http://127.0.0.1:1242" } };
  const context = createContext({ URL, AbortController, setTimeout, clearTimeout,
    $metrix: { secret: name => { if (!Object.hasOwn(secrets, name)) throw new Error("Secret unavailable"); return secrets[name]; }, invalidate() {}, openURL() {} },
    fetch: async (url, options) => { calls.push({ url, options }); const r = await route(url, options); return r instanceof Response ? r : Response.json(r); },
  });
  runInContext(script.replace("export default {", "globalThis.dashboard = {"), context);
  const render = () => context.dashboard.render(env);
  const nodes = () => { const out = []; const walk = n => { if (n) { out.push(n); (n.children || []).forEach(walk); } }; walk(render().panel); return out; };
  const find = key => nodes().find(n => n.props?.key === key);
  render();
  return { env, secrets, calls, render, find, refresh: () => context.dashboard.scheduled(env), event: context.dashboard.event,
    click: key => { const n = find(key); if (!n || n.props.disabled) throw new Error("Disabled or absent: " + key); return n.props.onClick(); } };
}
const ok = Result => ({ Success: true, Result });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test("pause, resume, stop and start display server state after each accepted operation", async () => {
  let b = bot();
  const w = worker((url, options) => {
    if (options.method === "POST") {
      const action = url.split("/").at(-1);
      if (action === "Pause") { expect(JSON.parse(options.body)).toEqual({ Permanent: true, ResumeInSeconds: 0 }); b.CardsFarmer.Paused = true; b.CardsFarmer.NowFarming = false; }
      if (action === "Resume") { b.CardsFarmer.Paused = false; b.CardsFarmer.NowFarming = true; }
      if (action === "Stop") { b.KeepRunning = false; b.IsConnectedAndLoggedOn = false; }
      if (action === "Start") b.KeepRunning = true;
      return ok(null);
    }
    return ok({ alpha: b });
  });
  await w.refresh();
  expect(w.render().tray.title).toBe("ASF 1");
  for (const [action, label] of [["Pause", "挂卡已暂停"], ["Resume", "正在挂卡"], ["Stop", "已停止"], ["Start", "连接中／等待登录"]]) {
    await w.click("action-alpha-" + action);
    expect(w.find("status-alpha").props.text).toBe(label);
  }
  expect(w.render().tray.title).toBe("ASF 0");
  expect(w.calls.every(c => c.options.headers.Authentication === (c.url.startsWith("http://127.0.0.1:1242/") ? w.secrets.ipc_key : undefined) && c.options.redirect === "error")).toBe(true);
});

test("rejected actions preserve status, disable stale controls and allow refresh recovery", async () => {
  const w = worker((url, options) => options.method === "POST" ? { Success: false, Message: "private server details" } : ok({ alpha: bot() }));
  await w.refresh(); await w.click("action-alpha-Pause");
  expect(w.find("status-alpha").props.text).toBe("正在挂卡");
  expect(w.find("action-alpha-Stop").props.disabled).toBe(true);
  expect(w.render().tray.error).toContain("操作未确认");
  expect(JSON.stringify(w.render())).not.toContain("private server details");
  await w.click("refresh");
  expect(w.render().tray.error).toBe("");
  expect(w.find("action-alpha-Stop").props.disabled).toBe(false);
});

test("failed refresh retains last counts; missing and malformed fields do not become zero", async () => {
  let response = ok({ alpha: bot() });
  const w = worker(() => response); await w.refresh();
  response = new Response("unauthorized", { status: 401 }); await w.refresh();
  expect(w.render().tray.title).toBe("ASF 1");
  expect(w.render().tray.error).toContain("密码");
  response = ok({ alpha: bot("alpha", { KeepRunning: undefined }) }); await w.refresh();
  expect(w.render().tray.error).toContain("格式无效");
  response = ok({ alpha: bot("alpha", { CardsFarmer: { Paused: false, NowFarming: false } }) }); await w.refresh();
  expect(w.render().tray.error).toBe("");
  expect(JSON.stringify(w.render())).toContain("剩余卡牌 —");
});

test("connection changes discard pending old reads and old control handlers", async () => {
  const slow = deferred(); let delay = false;
  const w = worker(url => url.startsWith("https://store.steampowered.com/") ? {} : url.includes("localhost") ? ok({ beta: bot("beta") }) : delay ? slow.promise : ok({ alpha: bot() }));
  await w.refresh(); const stale = w.find("action-alpha-Stop").props.onClick;
  delay = true; const old = w.refresh();
  w.env.inputs.base_url = "http://localhost:1242"; await w.refresh();
  slow.resolve(ok({ alpha: bot() })); await old;
  await stale();
  expect(w.find("bot-alpha")).toBeUndefined(); expect(w.find("bot-beta")).toBeDefined();
  expect(w.calls.filter(c => c.options.method === "POST")).toHaveLength(0);
});

test("duplicate actions share busy state; credential changes isolate pending action completion", async () => {
  const slow = deferred();
  const w = worker((url, options) => options.method === "POST" ? slow.promise : ok({ alpha: bot() }));
  await w.refresh(); const action = w.find("action-alpha-Pause").props.onClick;
  const first = action(); await action();
  expect(w.calls.filter(c => c.options.method === "POST")).toHaveLength(1);
  w.secrets.ipc_key = "replacement"; w.render();
  slow.resolve(ok(null)); await first;
  expect(w.find("result")).toBeUndefined(); expect(w.find("bot-alpha")).toBeUndefined();
  expect(w.calls.filter(c => c.options.method === "GET" && c.url.startsWith("http://127.0.0.1:1242/"))).toHaveLength(1);
});

test("selector names cannot trigger multi-account controls; empty accounts remain valid", async () => {
  let response = ok(Object.fromEntries(["ASF", "@ALL", "r!.*", "a,b", "a..z"].map(name => [name, bot(name)])));
  const w = worker(() => response); await w.refresh();
  for (const name of Object.keys(response.Result)) {
    const node = w.find("action-" + name + "-Stop"); expect(node.props.disabled).toBe(true); await node.props.onClick();
  }
  expect(w.calls.filter(c => c.options.method === "POST")).toHaveLength(0);
  response = ok({}); await w.refresh(); expect(w.find("empty")).toBeDefined(); expect(w.render().tray.error).toBe("");
});

test("unset optional IPC secret permits unauthenticated local connections", async () => {
  const w = worker(() => ok({ alpha: bot() }));
  delete w.secrets.ipc_key;
  await w.refresh();
  expect(w.render().tray.error).toBe("");
  expect(w.find("status-alpha").props.text).toBe("正在挂卡");
  expect(w.calls[0].options.headers.Authentication).toBeUndefined();
});

test("idle game configuration remains distinct from active card farming", async () => {
  const idle = bot("alpha", { BotConfig: { GamesPlayedWhileIdle: [394360], CustomGamePlayedWhileIdle: "Idle example" },
    CardsFarmer: { Paused: false, NowFarming: false, CurrentGamesFarming: [], GamesToFarm: [] } });
  const w = worker(() => ok({ alpha: idle })); await w.refresh();
  expect(w.render().tray.title).toBe("ASF 0");
  expect(w.find("idle-alpha-394360-name").props.text).toContain("394360");
  expect(w.find("games-alpha")).toBeUndefined();
  idle.CardsFarmer.NowFarming = true; idle.CardsFarmer.CurrentGamesFarming = [game]; idle.CardsFarmer.GamesToFarm = [game];
  await w.refresh();
  expect(w.render().tray.title).toBe("ASF 1");
  expect(w.find("games-alpha-440-name").props.text).toBe(game.GameName);
  idle.CardsFarmer.Paused = true; await w.refresh();
  expect(w.find("farming-alpha")).toBeUndefined();
  expect(w.find("action-alpha-Resume").props.disabled).toBe(false);
  idle.CardsFarmer.Paused = false; await w.refresh();
  expect(w.find("games-alpha-440-name").props.text).toBe(game.GameName);
  idle.IsPlayingPossible = false; await w.refresh();
  expect(w.render().tray.title).toBe("ASF 0");
  expect(w.find("games-alpha")).toBeUndefined();
});

test("disconnected queues stay unknown and are excluded from online card totals", async () => {
  const disconnected = bot("offline", { KeepRunning: false, IsConnectedAndLoggedOn: false });
  const w = worker(() => ok({ alpha: bot(), offline: disconnected })); await w.refresh();
  const offlineText = JSON.stringify(w.find("bot-offline"));
  expect(offlineText).toContain("剩余卡牌 —");
  expect(offlineText).toContain("剩余游戏 —");
  expect(w.find("games-offline")).toBeUndefined();
  expect(w.find("online-cards").props.text).toBe("3");
});

test("Steam avatar hashes generate only permitted CDN URLs, invalid hashes fall back to initials", async () => {
  let avatar = "ABCDEF0123456789ABCDEF0123456789ABCDEF01";
  const w = worker(() => ok({ alpha: bot("alpha", { AvatarHash: avatar }) }));
  await w.refresh();
  expect(w.find("avatar-alpha").props.src).toBe("https://avatars.steamstatic.com/" + avatar.toLowerCase() + "_medium.jpg");
  for (const invalid of ["", "0".repeat(40), "https://example.com/image.jpg", "../image", null]) {
    avatar = invalid; await w.refresh();
    expect(w.find("avatar-alpha").props.src).toBe("");
    expect(w.find("avatar-alpha").props.name).toBe("演示账号");
  }
});

test("idle game names are deduplicated and cached without sending ASF credentials to Steam", async () => {
  const w = worker((url, options) => {
    if (url.startsWith("https://store.steampowered.com/")) {
      expect(options.headers.Authentication).toBeUndefined();
      const id = Number(new URL(url).searchParams.get("appids"));
      return { [id]: { success: true, data: { steam_appid: id, name: id === 394360 ? "Hearts of Iron IV" : "Example game" } } };
    }
    return ok({ alpha: bot("alpha", { BotConfig: { GamesPlayedWhileIdle: [394360, 394360] } }),
      beta: bot("beta", { BotConfig: { GamesPlayedWhileIdle: [394360] } }) });
  });
  await w.refresh(); await w.refresh();
  expect(w.find("idle-alpha-394360-name").props.text).toBe("Hearts of Iron IV");
  expect(w.find("idle-beta-394360-name").props.text).toBe("Hearts of Iron IV");
  expect(w.find("idle-beta-394360").props.tooltip).toContain("394360");
  expect(w.find("idle-alpha").children).toHaveLength(1);
  expect(w.calls.filter(c => c.url.startsWith("https://store.steampowered.com/"))).toHaveLength(2);
});

test("unavailable or mismatched Steam metadata keeps IDs without failing ASF state", async () => {
  let metadata = new Response("unavailable", { status: 503 });
  const w = worker(url => url.startsWith("https://store.steampowered.com/") ? metadata
    : ok({ alpha: bot("alpha", { BotConfig: { GamesPlayedWhileIdle: [394360] } }) }));
  for (const response of [metadata, { "394360": { success: false } }, { "394360": { success: true, data: { steam_appid: 1, name: "Wrong game" } } }]) {
    metadata = response; await w.refresh();
    expect(w.find("idle-alpha-394360-name").props.text).toBe("App 394360");
    expect(w.render().tray.error).toBe("");
    expect(w.render().tray.title).toBe("ASF 1");
  }
});

test("late game metadata cannot repopulate a changed connection", async () => {
  const old = deferred(); let calls = 0;
  const w = worker(url => url.startsWith("https://store.steampowered.com/")
    ? new URL(url).searchParams.get("appids") === "394360" && ++calls === 1 ? old.promise : {}
    : ok({ alpha: bot("alpha", { BotConfig: { GamesPlayedWhileIdle: [394360] } }) }));
  const pending = w.refresh();
  for (let i = 0; i < 20 && calls === 0; i++) await Promise.resolve();
  expect(calls).toBe(1);
  w.env.inputs.base_url = "http://localhost:1242"; await w.refresh();
  old.resolve({ "394360": { success: true, data: { steam_appid: 394360, name: "Old response" } } });
  await pending;
  expect(w.find("idle-alpha-394360-name").props.text).toBe("App 394360");
});

test("game capsules pair each app with its own artwork and reject foreign image URLs", async () => {
  const art = id => "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/" + id + "/capsule_184x69.jpg";
  const w = worker(url => {
    if (!url.startsWith("https://store.steampowered.com/")) return ok({ alpha: bot("alpha", { BotConfig: { GamesPlayedWhileIdle: [394360, 480] } }) });
    const id = Number(new URL(url).searchParams.get("appids"));
    return { [id]: { success: true, data: { steam_appid: id, name: "Game " + id, capsule_imagev5: art(id) } } };
  });
  await w.refresh();
  for (const id of [394360, 480]) {
    expect(w.find("idle-alpha-" + id + "-icon").props.src).toBe(art(id));
    expect(w.find("idle-alpha-" + id + "-name").props.text).toBe("Game " + id);
  }
  expect(w.find("games-alpha-440-icon").props.src).toBe(art(440));
  expect(w.find("games-alpha-440-name").props.text).toBe(game.GameName);
  for (const invalid of ["https://example.com/icon.jpg", art(480), art(440).replace("https:", "http:"), art(440).replace("https://", "https://secret@"), art(440).replace("https://", "https://:secret@"), art(440).replace(".com/", ".com:8443/")]) {
    const bad = worker(url => url.startsWith("https://store.steampowered.com/")
      ? { "440": { success: true, data: { steam_appid: 440, name: "Game 440", capsule_imagev5: invalid } } } : ok({ alpha: bot() }));
    await bad.refresh();
    expect(bad.find("games-alpha-440-icon").props.src).toBe("");
    expect(bad.find("games-alpha-440-name").props.text).toBe(game.GameName);
  }
});
