import {
  getSelectedToken,
  getSingleTarget,
  rollAthletics,
  applyCondition,
  degreeLabel,
  getSaveDC
} from "./lib.js";

export async function runTrip() {
  try {
    const token = getSelectedToken();
    const target = getSingleTarget();

    const dc = getSaveDC(target.actor, "reflex");

    const roll = await rollAthletics(
      token.actor,
      dc,
      "Trip vs Reflex DC " + dc,
      ["action:trip"]
    );

    const degree = roll.degreeOfSuccess ?? 1;

    let applied = false;
    if (degree >= 2) {
      await applyCondition(target.actor, "prone");
      applied = true;
    }

    const msg =
      "<p><b>" + token.name + "</b> attempts <b>Trip</b> on <b>" + target.name +
      "</b>: <b>" + degreeLabel(degree) + "</b></p>" +
      (applied ? "<p><b>Prone applied.</b></p>" : "");

    ChatMessage.create({ content: msg });
  } catch (err) {
    ui.notifications.error(err?.message ?? String(err));
  }
}
