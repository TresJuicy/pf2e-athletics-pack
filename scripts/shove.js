import {
  getSelectedToken,
  getSingleTarget,
  rollAthletics,
  degreeLabel,
  getSaveDC
} from "./lib.js";

export async function runShove() {
  try {
    const token = getSelectedToken();
    const target = getSingleTarget();

    const dc = getSaveDC(target.actor, "fortitude");

    const roll = await rollAthletics(
      token.actor,
      dc,
      "Shove vs Fortitude DC " + dc,
      ["action:shove"]
    );

    const degree = roll.degreeOfSuccess ?? 1;

    // PF2e Shove distance:
    // Success = 5 ft, Crit Success = 10 ft
    const distance = degree === 2 ? 5 : degree === 3 ? 10 : 0;

    const msg =
      "<p><b>" + token.name + "</b> attempts <b>Shove</b> on <b>" +
      target.name + "</b>: <b>" + degreeLabel(degree) + "</b></p>" +
      (distance
        ? "<p><b>Push " + distance + " ft</b> (move target manually).</p>"
        : "");

    ChatMessage.create({ content: msg });
  } catch (err) {
    ui.notifications.error(err?.message ?? String(err));
  }
}
