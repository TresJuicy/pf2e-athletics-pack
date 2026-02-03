import {
  getSelectedToken,
  getSingleTarget,
  rollAthletics,
  degreeLabel,
  getSaveDC
} from "./lib.js";

export async function runReposition() {
  try {
    const token = getSelectedToken();
    const target = getSingleTarget();

    const dc = getSaveDC(target.actor, "reflex");

    const roll = await rollAthletics(
      token.actor,
      dc,
      "Reposition vs Reflex DC " + dc,
      ["action:reposition"]
    );

    const degree = roll.degreeOfSuccess ?? 1;

    const distance = degree === 2 ? 5 : degree === 3 ? 10 : 0;

    const msg =
      "<p><b>" + token.name + "</b> attempts <b>Reposition</b> on <b>" +
      target.name + "</b>: <b>" + degreeLabel(degree) + "</b></p>" +
      (distance
        ? "<p><b>Move target " + distance + " ft</b> (move manually).</p>"
        : "");

    ChatMessage.create({ content: msg });
  } catch (err) {
    ui.notifications.error(err?.message ?? String(err));
  }
}
