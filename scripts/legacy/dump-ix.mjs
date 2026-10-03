import fs from "node:fs";

const ix = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/root-8a5edab2/webflow-ix.json", "utf8")
);
const arr = Object.values(ix.events).flat();

for (const e of arr) {
  console.log("=== " + e.eventTypeId + " id=" + e.id);
  console.log("   target: " + JSON.stringify(e.target));
  console.log("   config: " + JSON.stringify(e.config));
  const acts = e.actionLists ? Object.values(e.actionLists).flat() : [];
  for (const a of acts) {
    console.log("   - actionTypeId=" + a.actionTypeId + " id=" + a.id);
    for (const k of Object.keys(a)) {
      if (
        [
          "id", "actionTypeId", "eventTypeId", "eventListenerId", "target",
          "config", "targets", "instanceId", "order", "webflowEventData",
          "nestedActionLists", "actionListId",
        ].includes(k)
      ) {
        continue;
      }
      console.log("       " + k + ": " + JSON.stringify(a[k]).slice(0, 900));
    }
    const nested = a.nestedActionLists ? Object.values(a.nestedActionLists).flat() : [];
    for (const n of nested) {
      console.log("       * nested actionTypeId=" + n.actionTypeId + " id=" + n.id);
      for (const k of Object.keys(n)) {
        if (
          [
            "id", "actionTypeId", "eventTypeId", "eventListenerId", "target",
            "config", "targets", "instanceId", "order", "webflowEventData",
            "nestedActionLists", "actionListId",
          ].includes(k)
        ) {
          continue;
        }
        console.log("            " + k + ": " + JSON.stringify(n[k]).slice(0, 900));
      }
      const nested2 = n.nestedActionLists ? Object.values(n.nestedActionLists).flat() : [];
      for (const n2 of nested2) {
        console.log("            * nested actionTypeId=" + n2.actionTypeId + " id=" + n2.id);
        for (const k of Object.keys(n2)) {
          if (
            [
              "id", "actionTypeId", "eventTypeId", "eventListenerId", "target",
              "config", "targets", "instanceId", "order", "webflowEventData",
              "nestedActionLists", "actionListId",
            ].includes(k)
          ) {
            continue;
          }
          console.log("                " + k + ": " + JSON.stringify(n2[k]).slice(0, 900));
        }
      }
    }
  }
}