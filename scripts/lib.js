// PF2e Athletics Pack - shared helpers (single-target, version-tolerant)

// ---------- Selection / targeting ----------

export function getSelectedToken() {
  const token = canvas.tokens.controlled[0];
  if (!token || !token.actor) throw new Error("Select your token first.");
  return token;
}

export function getSingleTarget() {
  const targets = [...game.user.targets];
  const target = targets[0];
  if (!target) throw new Error("Target exactly 1 creature.");
  if (targets.length > 1) throw new Error("Target exactly 1 creature (you have multiple targets).");
  return target;
}

// ---------- Display helpers ----------

export function degreeLabel(degree) {
  // PF2e degreeOfSuccess is commonly: 0=crit fail, 1=fail, 2=success, 3=crit success
  const labels = ["Critical Failure", "Failure", "Success", "Critical Success"];
  return labels[degree] ?? "Unknown";
}

// ---------- DC helpers ----------

/**
 * Get a save DC from a target actor across PF2e versions.
 * saveSlug: "reflex" | "fortitude" | "will"
 */
export function getSaveDC(actor, saveSlug) {
  const save =
    (actor.saves && actor.saves[saveSlug]) ||
    (actor.system && actor.system.saves && actor.system.saves[saveSlug]);

  const dc = (save && save.dc && save.dc.value != null) ? save.dc.value : (save ? save.dc : undefined);

  if (!dc) {
    console.log("Save DC debug:", { saveSlug, save });
    throw new Error("Could not find target " + saveSlug + " DC.");
  }

  return dc;
}

// ---------- Rolling helpers ----------

/**
 * Roll Athletics vs a DC, tolerant to PF2e skill API changes.
 * Returns the roll/check object that includes `degreeOfSuccess`.
 */
export async function rollAthletics(actor, dc, label, options) {
  const opts = Array.isArray(options) ? options : [];

  const athletics =
    (actor.skills && (actor.skills.athletics || actor.skills.ath)) ||
    (actor.system && actor.system.skills && (actor.system.skills.athletics || actor.system.skills.ath));

  if (!athletics) {
    console.log("Athletics debug:", {
      actor: actor,
      actorSkills: actor.skills,
      systemSkills: actor.system ? actor.system.skills : undefined
    });
    throw new Error("Athletics skill not found on this actor.");
  }

  // Modern PF2e: athletics.check.roll(...)
  if (athletics.check && typeof athletics.check.roll === "function") {
    return athletics.check.roll({
      dc: { value: dc },
      label: label,
      extraRollOptions: opts
    });
  }

  // Older PF2e: athletics.roll(...)
  if (typeof athletics.roll === "function") {
    return athletics.roll({
      dc: { value: dc },
      label: label,
      extraRollOptions: opts
    });
  }

  console.log("Athletics object debug:", athletics);
  throw new Error("Athletics roll method not found (no check.roll or roll).");
}

// ---------- Condition helpers ----------

function _normalizeSlugToNames(slug) {
  const s = String(slug || "").trim();
  const a = s.toLowerCase();                 // "off-guard"
  const b = a.replace(/-/g, " ");            // "off guard"
  const c = b.replace(/\s+/g, " ");          // normalize spaces
  return [a, b, c];
}

async function _getConditionFromCompendium(slug) {
  // Primary PF2e pack id in most versions:
  // "pf2e.conditionitems"
  // Some setups might differ, so we try a few fallbacks.
  const candidatePackIds = [
    "pf2e.conditionitems",
    "pf2e.conditions"
  ];

  let pack = null;
  for (const id of candidatePackIds) {
    const p = game.packs.get(id);
    if (p) { pack = p; break; }
  }

  if (!pack) {
    // As a last resort, search all packs for "conditionitems"
    for (const p of game.packs.values()) {
      if (String(p.collection || "").includes("pf2e") && String(p.collection || "").includes("condition")) {
        pack = p;
        break;
      }
    }
  }

  if (!pack) {
    throw new Error("PF2e condition compendium not found (expected pf2e.conditionitems).");
  }

  await pack.getIndex();

  const [n1, n2, n3] = _normalizeSlugToNames(slug);

  // Match by name, case-insensitive.
  // Condition names are typically "Prone", "Off-Guard", "Grabbed", etc.
  const hit =
    pack.index.find(e => e.name && e.name.toLowerCase() === n1) ||
    pack.index.find(e => e.name && e.name.toLowerCase() === n2) ||
    pack.index.find(e => e.name && e.name.toLowerCase() === n3);

  if (!hit) {
    throw new Error('Condition "' + slug + '" not found in ' + pack.collection + ".");
  }

  const doc = await pack.getDocument(hit._id);
  if (!doc) {
    throw new Error('Failed to load condition "' + slug + '" from ' + pack.collection + ".");
  }

  return doc;
}

/**
 * Apply a condition to an actor, tolerant to PF2e version differences.
 * slug examples: "prone", "grabbed", "restrained", "off-guard"
 */
export async function applyCondition(actor, slug, config) {
  const cfg = config || {};
  const value = cfg.value;

  // 1) Newer PF2e: ConditionManager
  const cm = game.pf2e ? game.pf2e.ConditionManager : null;
  if (cm && typeof cm.addCondition === "function") {
    return cm.addCondition(actor, slug, value != null ? { value: value } : undefined);
  }

  // 2) Fallback: embed condition item from compendium
  if (typeof actor.createEmbeddedDocuments !== "function") {
    throw new Error("Cannot apply conditions: actor does not support embedded document creation.");
  }

  const condDoc = await _getConditionFromCompendium(slug);
  const source = condDoc.toObject();

  // Set value if it's a valued condition (e.g. frightened, clumsy).
  // For non-valued conditions (prone/off-guard), this is ignored by the system.
  if (value != null) {
    source.system = source.system || {};
    source.system.value = value;
  }

  return actor.createEmbeddedDocuments("Item", [source]);
}
