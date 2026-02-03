import {
  getSelectedToken,
  getSingleTarget,
  rollAthletics,
  applyCondition,
  degreeLabel,
  getSaveDC
} from "./lib.js";

export async function runGrapple() {
  try {
    const token = getSelectedToken();
    const target = getSingleTarget();

    const dc = getSaveDC(target.actor, "fortitude");

    const roll = await rollAthletics(
      token.actor,
      dc,
      "Grapple vs Fortitude DC " + dc,
      ["action:grapple"]
    );

    const degree = roll.degreeOfSuccess ?? 1;

    let applied = "";

    if (degree === 2) {
      await applyCondition(target.actor, "grabbed");
      applied = "Grabbed applied.";
    }

    if (degree === 3) {
      await applyCondition(target.actor, "restrained");
      applied = "Restrained applied.";
    }

    const msg =
      "<p><b>" + token.name + "</b> attempts <b>Grapple</b> on <b>" +
      target.name + "</b>: <b>" + degreeLabel(degree) + "</b></p>" +
      (applied ? "<p><b>" + applied + "</b></p>" : "");

    ChatMessage.create({ content: msg });
  } catch (err) {
    ui.notifications.error(err?.message ?? String(err));
  }
}
