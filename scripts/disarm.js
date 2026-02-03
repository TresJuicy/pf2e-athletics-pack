import {
  getSelectedToken,
  getSingleTarget,
  rollAthletics,
  degreeLabel,
  getSaveDC
} from "./lib.js";

export async function runDisarm() {
  try {
    const token = getSelectedToken();
    const target = getSingleTarget();

    const dc = getSaveDC(target.actor, "reflex");

    const roll = await rollAthletics(
      token.actor,
      dc,
      "Disarm vs Reflex DC " + dc,
      ["action:disarm"]
    );

    const degree = roll.degreeOfSuccess ?? 1;

    let rulesText = "";

    if (degree === 2) {
      rulesText =
        "<b>Success:</b> Target is <i>Disarmed</i> until the start of its next turn. " +
        "It takes a <b>−2 circumstance penalty</b> to attacks with that item, and other " +
        "checks requiring a firm grasp may also take penalties (GM discretion).";
    }

    if (degree === 3) {
      rulesText =
        "<b>Critical Success:</b> As Success, and the item is knocked to the ground in the target’s space " +
        "(GM/table enforces the drop).";
    }

    const msg =
      "<p><b>" + token.name + "</b> attempts <b>Disarm</b> on <b>" +
      target.name + "</b>: <b>" + degreeLabel(degree) + "</b></p>" +
      (rulesText ? "<p>" + rulesText + "</p>" : "");

    ChatMessage.create({ content: msg });
  } catch (err) {
    ui.notifications.error(err?.message ?? String(err));
  }
}
