const $ = (selector) => document.querySelector(selector);

const KEY = "data-extractor";

const VERIFIED = "__verifiedId";

let tab = null;

let matchedPage = null;

async function getState() {
  const data = await chrome.storage.local.get(KEY);

  return data[KEY] || { draft: {}, rows: [] };
}

async function setState(state) {
  await chrome.storage.local.set({
    [KEY]: state,
  });
}

function extractFields(fieldMap) {
  const squash = (s) => (s || "").replace(/\s+/g, " ").replace(/:/g, "").trim();

  const textOf = (el) => {
    if (!el) return "";

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
      return squash(el.value);

    if (el.tagName === "SELECT")
      return squash(el.selectedOptions[0]?.text || el.value);

    return squash(el.innerText || el.textContent);
  };

  const normalize = (s) =>
    squash(s)
      .toLowerCase()
      .replace(/[:*]+$/, "")
      .trim();

  const byLabel = (label) => {
    const want = normalize(label);

    for (const tr of document.querySelectorAll("tr")) {
      const cells = tr.querySelectorAll("th, td");
      if (cells.length >= 2 && normalize(cells[0].innerText) === want)
        return textOf(cells[1]);
    }
    return "";
  };

  let output = {};
  for (const [column, rule] of Object.entries(fieldMap)) {
    let value = "";

    if (rule.selector) {
      const node = document.querySelector(rule.selector);
      value = rule.attr ? squash(node?.getAttribute(rule.attr)) : textOf(node);
    }

    if (!value && rule.label) value = byLabel(rule.label);

    if (rule.regex && value) {
      const m = value.match(new RegExp(rule.regex));
      value = m ? (m[1] ?? m[0]) : "";
    }

    output[column] = value;
  }
  return output;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TRANSFORMS = {
  // "RII50520 : Diploma of Civil Construction Design-21/07/2025 - Finished"
  //   -> "RII50520 Diploma of Civil Construction Design"
  courseName: (v) => {
    const m = v.match(
      /^\s*([A-Za-z0-9]+)\s*:?\s+(.+?)\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}/,
    );
    return m ? `${m[1]} ${m[2]}` : v;
  },

  // "11/01/2020" -> "11 Jan 2020"
  longDate: (v) => {
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return v;
    const month = MONTHS[Number(m[2]) - 1];
    return month ? `${Number(m[1])} ${month} ${m[3]}` : v;
  },
};

const applyTransform = (rule, value) => {
  const fn = rule?.transform && TRANSFORMS[rule.transform];
  return fn && value ? fn(value) : value;
};

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

const cell = (v) =>
  (v ?? "")
    .toString()
    .replace(/[\t\r\n]+/g, " ")
    .trim();
const toTsv = (rows) =>
  rows.map((r) => CONFIG.columns.map((c) => cell(r[c])).join("\t")).join("\n");

function say(message, tone = "") {
  const el = $("#status");
  el.textContent = message;
  el.className = tone;
}

async function render() {
  const { draft, rows } = await getState();

  $("#draft").innerHTML = CONFIG.columns
    .map((c) => {
      const v = draft[c];
      const filled = v !== undefined && v !== "";
      return `<tr><th>${escapeHtml(c)}</th><td class="${filled ? "" : "empty"}">${
        filled ? escapeHtml(v) : "—"
      }</td></tr>`;
    })
    .join("");

  const started = CONFIG.columns.some((c) => draft[c]);
  $("#save").disabled = !started;
  $("#copy").disabled = rows.length === 0;
  $("#copy").textContent = rows.length
    ? `Copy ${rows.length} row${rows.length > 1 ? "s" : ""}`
    : "Copy rows";
  $("#buffer").textContent = rows.length
    ? `${rows.length} row${rows.length > 1 ? "s" : ""} saved and ready to paste`
    : "";
}

const escapeHtml = (s) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const sameId = (a, b) =>
  a.replace(/\s+/g, "").toLowerCase() === b.replace(/\s+/g, "").toLowerCase();

async function capture() {
  if (!matchedPage) return;

  const verify = matchedPage.verify || {};

  let result;
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFields,
      args: [{ ...matchedPage.fields, ...verify }],
    });
    result = injection.result || {};
  } catch (e) {
    say("Could not read this page. Check host permissions.", "warn");
    return;
  }

  const state = await getState();

  // Identity guard: bail out before writing anything if this page describes a
  // different record than the one already in the draft. This runs on every
  // page, not just the one carrying `verify`, so capture order does not matter.
  const rules = { ...matchedPage.fields, ...verify };
  for (const column of IDENTITY_COLUMNS) {
    const onPage = applyTransform(rules[column], result[column] || "");
    if (!onPage) continue;

    const known = state.draft[VERIFIED] || state.draft[column] || "";
    if (known && !sameId(onPage, known)) {
      say(
        `Record mismatch — page shows ${onPage}, draft holds ${known}. Nothing captured. Clear the draft or open the right record.`,
        "warn",
      );
      return;
    }

    // Only a `verify` field counts as confirmation; a plain column is just data.
    if (verify[column]) state.draft[VERIFIED] = onPage;
  }

  const found = [];
  const missing = [];

  for (const [column, rule] of Object.entries(matchedPage.fields)) {
    const value = applyTransform(rule, result[column] || "");
    if (value) {
      state.draft[column] = value;
      found.push(column);
    } else {
      missing.push(column);
    }
  }

  await setState(state);
  await render();

  if (!found.length) {
    say(`Nothing found. Check the selectors for ${matchedPage.name}.`, "warn");
    return;
  }

  const complete = CONFIG.columns.every((c) => state.draft[c]);
  if (complete && CONFIG.autoCopyWhenComplete) {
    await saveRow({ autoCopied: true });
    return;
  }

  say(
    missing.length
      ? `Captured ${found.length}. Not found: ${missing.join(", ")}`
      : `Captured ${found.join(", ")}.`,
    missing.length ? "warn" : "ok",
  );
}

// Columns that only a verified page can supply.
const guardedColumns = CONFIG.pages
  .filter((p) => p.verify)
  .flatMap((p) => Object.keys(p.fields));

// Columns used to confirm that two pages describe the same record.
const IDENTITY_COLUMNS = [
  ...new Set(CONFIG.pages.flatMap((p) => Object.keys(p.verify || {}))),
];

async function saveRow({ autoCopied = false } = {}) {
  const state = await getState();
  if (!CONFIG.columns.some((c) => state.draft[c])) return;

  if (guardedColumns.some((c) => state.draft[c]) && !state.draft[VERIFIED]) {
    say("Row not verified against the record ID — not saved.", "warn");
    return;
  }

  const row = {};
  for (const c of CONFIG.columns) row[c] = state.draft[c] || "";

  state.rows.push(row);
  state.draft = {};
  await setState(state);
  await render();

  if (autoCopied) {
    const ok = await copyText(toTsv([row]));
    say(
      ok
        ? "Row complete and copied — paste into Excel."
        : "Row saved. Copy failed, use Copy rows.",
      ok ? "ok" : "warn",
    );
  } else {
    say("Row saved.", "ok");
  }
}

async function copyRows() {
  const { rows } = await getState();
  if (!rows.length) return;
  const ok = await copyText(toTsv(rows));
  say(
    ok ? `${rows.length} row(s) copied — paste into Excel.` : "Copy failed.",
    ok ? "ok" : "warn",
  );
}

async function clearAll() {
  await setState({ draft: {}, rows: [] });
  await render();
  say("Cleared.");
}

/* ---------- init ---------- */

(async () => {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  matchedPage = CONFIG.pages.find((p) => p.match.test(tab?.url || "")) || null;

  const tag = $("#page-tag");
  if (matchedPage) {
    tag.textContent = matchedPage.name;
    tag.classList.add("matched");
  } else {
    tag.textContent = "no page matched";
    $("#capture").disabled = true;
  }

  $("#capture").addEventListener("click", capture);
  $("#save").addEventListener("click", () => saveRow());
  $("#copy").addEventListener("click", copyRows);
  $("#clear").addEventListener("click", clearAll);

  await render();
})();
