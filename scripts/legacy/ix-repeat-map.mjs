// Correlate timeline-level `settings.repeat` / `yoyo` with the trigger types
// that play each timeline, so the runtime's repeat semantics can be derived
// from the real payloads instead of guessed.
import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";
const rows = new Map();

for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = path.join(ART_ROOT, dir, "webflow-ix2.json");
  if (!fs.existsSync(file)) continue;
  const ix = JSON.parse(fs.readFileSync(file, "utf8"));
  const byId = new Map(ix.timelines.map((t) => [t.id, t]));

  for (const it of ix.interactions) {
    const triggers = it.triggers
      .map(([name, cfg]) => {
        const plugin = cfg?.pluginConfig?.type ? `:${cfg.pluginConfig.type}` : "";
        return `${name}/${cfg?.control ?? cfg?.controlType}${plugin}`;
      })
      .join(" + ");
    for (const tid of it.timelineIds ?? []) {
      const tl = byId.get(tid);
      if (!tl) continue;
      const settings = JSON.stringify(tl.settings ?? {});
      const canvases = tl.canvasDuration;
      const key = `${settings} | ${triggers}`;
      if (!rows.has(key)) rows.set(key, { count: 0, dirs: new Set(), sample: tl.id });
      const rec = rows.get(key);
      rec.count += 1;
      rec.dirs.add(dir);
    }
  }
}

for (const [key, rec] of [...rows.entries()].sort((a, b) => b[1].count - a[1].count)) {
  console.log(
    `${String(rec.count).padStart(4)} pages=${String(rec.dirs.size).padStart(2)} ${key}`
  );
}