import { runTrip } from "./trip.js";
import { runGrapple } from "./grapple.js";
import { runShove } from "./shove.js";
import { runReposition } from "./reposition.js";
import { runDisarm } from "./disarm.js";

Hooks.once("ready", () => {
  const mod = game.modules.get("pf2e-athletics-pack");
  if (!mod) return;

  mod.api = {
    trip: runTrip,
    grapple: runGrapple,
    shove: runShove,
    reposition: runReposition,
    disarm: runDisarm
  };

  console.log("pf2e-athletics-pack: API ready");
});
