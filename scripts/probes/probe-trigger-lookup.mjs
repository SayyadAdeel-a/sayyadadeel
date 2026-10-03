// Dump every attribute name on the elements around a hook target, with
// codepoints, and compare three ways of finding the trigger.
//
// Why: on `/`, the reference hides 7 `[group-fedup-move]` elements on a fresh
// load and the clone hides 17. The 7 are exactly the ones inside
// `.featured-collection-list` — which implies the trigger element is the CMS
// list wrapper `.w-dyn-list` carrying `group-fedup-move-pfriend`. Yet two probes
// report `[group-fedup-move-pfriend]` matching 0 elements, while a third saw
// that attribute in an `element.attributes` listing inside the very same
// evaluate. Rather than keep theorising, this prints the ground truth: every
// attribute name on the DOM path, codepoint by codepoint, alongside the count
// each lookup method returns.
//
// Usage: node scripts/probe-trigger-lookup.mjs [route] [targetHook] [triggerHook]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const targetHook = process.argv[3] ?? "group-fedup-move";
const triggerHook = process.argv[4] ?? "group-fedup-move-pfriend";

/** Runs in the page. */
const DUMP = ({ targetHook: target, triggerHook: trigger }) => {
  const targets = [...document.querySelectorAll(`[${target}]`)];

  const path = (element, depth = 0) => {
    const names = [...element.attributes].map((a) => ({
      name: a.name,
      value: a.value,
      codepoints: [...a.name].map((c) => c.codePointAt(0)),
    }));
    return {
      tag: element.tagName.toLowerCase(),
      cls: element.className?.toString().slice(0, 60) ?? "",
      hookLikeAttributes: names.filter((n) =>
        /fedup|fade|friend|parent|child|slide|marku/i.test(n.name)
      ),
      attributeNames: names.map((n) => n.name),
      child: depth < 6 ? path(element.parentElement, depth + 1) : undefined,
    };
  };

  // Three independent ways to find the trigger, so the disagreement is visible.
  const bySelector = (() => {
    try {
      return document.querySelectorAll(`[${trigger}]`).length;
    } catch (error) {
      return `THROWS ${error.message}`;
    }
  })();
  const byAttributeScan = [...document.querySelectorAll("*")].filter((el) =>
    [...el.attributes].some((a) => a.name === trigger)
  ).length;
  const byContains = [...document.querySelectorAll("*")].filter((el) =>
    [...el.attributes].some((a) => a.name.includes("pfriend"))
  ).length;
  const byFriend = [...document.querySelectorAll("*")].filter((el) =>
    [...el.attributes].some((a) => a.name.includes("friend"))
  ).length;

  // All attribute names anywhere on the page that mention "friend", with
  // codepoints — the decisive list.
  const friendish = new Map();
  for (const el of document.querySelectorAll("*")) {
    for (const attr of el.attributes) {
      if (!/friend/i.test(attr.name)) continue;
      if (!friendish.has(attr.name)) {
        friendish.set(attr.name, {
          name: attr.name,
          codepoints: [...attr.name].map((c) => c.codePointAt(0)),
          value: attr.value,
          count: 0,
          on: [],
        });
      }
      const bucket = friendish.get(attr.name);
      bucket.count += 1;
      if (bucket.on.length < 3) {
        bucket.on.push(
          `<${el.tagName.toLowerCase()} class="${el.className?.toString().slice(0, 50) ?? ""}">`
        );
      }
    }
  }

  // The hide state of every target, so the "7 vs 17" split is quantified here
  // rather than inferred from two different probes.
  const state = targets.map((el, i) => {
    const cs = getComputedStyle(el);
    const m = /matrix(3d)?\(([^)]+)\)/.exec(cs.transform);
    const matrix = m ? m[2].split(",").map(Number) : null;
    return {
      i,
      cls: el.className?.toString().slice(0, 50) ?? "",
      opacity: Math.round(Number(cs.opacity) * 1000) / 1000,
      ty: matrix && matrix.length >= 6 ? Math.round(matrix[5] * 10) / 10 : 0,
      // Which ancestor has a "friend"-ish hook, if any?
      friendAncestor: (() => {
        let node = el;
        while (node) {
          for (const attr of node.attributes) {
            if (/friend/i.test(attr.name)) {
              return `<${node.tagName.toLowerCase()} class="${node.className?.toString().split(/\s+/).slice(0, 2).join(".")}" ${attr.name}="${attr.value}">`;
            }
          }
          node = node.parentElement;
        }
        return null;
      })(),
    };
  });

  return {
    trigger: {
      bySelector,
      byAttributeScan,
      byContainsPfriend: byContains,
      byContainsFriend: byFriend,
    },
    friendishAttributes: [...friendish.values()],
    targetCount: targets.length,
    firstTargetPath: targets[0] ? path(targets[0]) : null,
    state,
  };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await open(page, base + route, { settle: false });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(DUMP, { targetHook, triggerHook });

  console.log(`\n=== ${label} ${route} ===`);
  console.log(
    `  trigger "${triggerHook}": selector=${out.trigger.bySelector} ` +
      `attributeScan=${out.trigger.byAttributeScan} ` +
      `endsWith-pfriend=${out.trigger.byContainsPfriend} ` +
      `contains-friend=${out.trigger.byContainsFriend}`
  );
  if (out.friendishAttributes.length === 0) {
    console.log("  no attribute name on the page contains \"friend\"");
  }
  for (const attr of out.friendishAttributes) {
    console.log(
      `  attribute ${JSON.stringify(attr.name)} x${attr.count} value=${JSON.stringify(attr.value)}`
    );
    console.log(`      codepoints ${JSON.stringify(attr.codepoints)}`);
    for (const on of attr.on) console.log(`      on ${on}`);
  }

  const hidden = out.state.filter((s) => s.opacity < 0.99);
  console.log(
    `  targets ${out.targetCount}; hidden at load ${hidden.length} ` +
      `(${out.targetCount - hidden.length} already revealed)`
  );
  for (const row of out.state) {
    const flag = row.opacity < 0.99 ? "HIDDEN " : "shown ";
    console.log(
      `    ${flag} [${String(row.i).padStart(2)}] opacity=${row.opacity} ty=${row.ty} .${row.cls}`
    );
    if (row.friendAncestor) console.log(`            friend ancestor: ${row.friendAncestor}`);
  }
  await context.close();
}
await browser.close();