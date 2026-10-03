// Rebuild the production bundle and (re)start the static server on port 3100.
// Kept as a two-step PowerShell invocation from the agent shell; this script
// only rebuilds.
import { spawnSync } from "node:child_process";

const cwd = "S:\\Apps\\spidey\\relab";
const build = spawnSync("npm", ["run", "build"], { cwd, shell: true, stdio: "inherit" });
process.exit(build.status ?? 1);