import { test, expect } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const builder = fileURLToPath(new URL("../scripts/build-registry.js", import.meta.url));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

test("a cached registry index still downloads its original bytes after a new publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "metrix-registry-"));
  const input = join(root, "dashboards");
  const output = join(root, "registry");
  const source = join(input, "nested", "账户.bar");
  const build = async () => {
    const child = Bun.spawn([process.execPath, builder,
      "--input", input, "--output", output, "--id", "fixture", "--name", "Fixture"],
    { stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
    ]);
    if (exit !== 0) throw new Error(stdout + stderr);
    return JSON.parse(await readFile(join(output, "index.json"), "utf8"));
  };
  const publish = async (version, value) => {
    const bytes = Buffer.from(`<bar protocol-version="0" id="account" title="账户" version="${version}"><script><![CDATA[export default {render(){return {tray:{title:"${value}"}}}};]]></script></bar>\n`);
    await writeFile(source, bytes);
    const index = await build();
    const entry = index.dashboards[0];
    const asset = join(output, decodeURIComponent(entry.file));
    expect(await readFile(asset)).toEqual(bytes);
    expect(entry.sha256).toBe(digest(bytes));
    return { entry, asset, bytes };
  };
  try {
    await mkdir(dirname(source), { recursive: true });
    const first = await publish("1.0.0", "first");
    const second = await publish("1.0.1", "second");
    const cachedDownload = await readFile(first.asset);
    expect(cachedDownload).toEqual(first.bytes);
    expect(digest(cachedDownload)).toBe(first.entry.sha256);
    const rebuilt = await build();
    expect(rebuilt.dashboards[0]).toEqual(second.entry);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
