"use strict";
const $ = (id) => document.getElementById(id),
  clone = (x) => structuredClone(x),
  NS = "http://www.w3.org/2000/svg";
let doc = null,
  analysis = null,
  id = null,
  revision = 0,
  dirty = false,
  busy = false,
  undo = [],
  redo = [],
  selected = new Set(),
  query = "",
  filter = "all",
  pageNumber = 0,
  zoom = 1,
  month = "2026-10",
  editCallback = null;
const KIND = "seasongrid",
  KEY = "events";
function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function button(text, fn, cls) {
  const b = node("button", text, cls);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
function svg(tag, attrs, text) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (text !== undefined) n.textContent = text;
  return n;
}
function say(text) {
  $("status").textContent = text;
  $("status").hidden = !text;
}
function fail(error) {
  for (const key of ["error", "dialog-error"]) {
    $(key).textContent = error.message || String(error);
    $(key).hidden = false;
  }
}
function controls() {
  document
    .querySelectorAll("button,input,select,textarea")
    .forEach((e) => (e.disabled = busy));
  $("undo").disabled = busy || !undo.length;
  $("redo").disabled = busy || !redo.length;
  $("save").disabled = busy || !doc;
}
async function api(path, data) {
  const r = await fetch(
    "/api/" + path,
    data === undefined
      ? {}
      : {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "Workspace",
          },
          body: JSON.stringify(data),
        },
  );
  const value = await r.json();
  if (!r.ok) throw Error(value.error || "Request failed.");
  return value;
}
async function task(message, fn) {
  if (busy) return;
  busy = true;
  controls();
  $("error").hidden = true;
  $("dialog-error").hidden = true;
  say(message);
  try {
    await fn();
  } catch (e) {
    fail(e);
    say("");
  } finally {
    busy = false;
    controls();
  }
}
async function change(next, message = "Changes applied. Save when ready.") {
  const checked = await api("validate", next);
  undo.push(clone(doc));
  undo = undo.slice(-50);
  redo = [];
  doc = checked.document;
  analysis = checked.analysis;
  dirty = true;
  selected = new Set(
    [...selected].filter((k) => doc[KEY].some((x) => x.id === k)),
  );
  render();
  say(message);
}
function refreshFacets() {
  const control = $(
    KIND === "collectionatlas" ? "tool-collection" : "tool-equipment",
  );
  if (!control) return;
  const values =
    KIND === "collectionatlas"
      ? doc.folders
      : [...new Set(doc.events.map((e) => e.resource))].sort();
  if (filter !== "all" && !values.includes(filter)) filter = "all";
  control.replaceChildren(
    new Option(
      KIND === "collectionatlas" ? "All collections" : "All equipment",
      "all",
    ),
  );
  values.forEach((value) => control.add(new Option(value, value)));
  control.value = filter;
}
function render() {
  refreshFacets();
  const active = document.activeElement?.id;
  $("document-title").textContent = doc.title;
  $("revision").textContent = dirty
    ? "Unsaved changes"
    : `Saved revision ${revision}`;
  $("metrics").replaceChildren();
  Object.entries(analysis.metrics).forEach(([label, value]) => {
    const n = node("div", undefined, "metric");
    n.append(node("strong", String(value)), node("span", label));
    $("metrics").append(n);
  });
  renderWorkspace();
  controls();
  if (active && $(active)) $(active).focus({ preventScroll: true });
}
function field(label, key, value, type = "text", options) {
  const wrap = node("label", label);
  const input = node(
    options ? "select" : type === "textarea" ? "textarea" : "input",
  );
  input.id = "field-" + key;
  input.name = key;
  if (!options && type !== "textarea") input.type = type;
  if (options) options.forEach((o) => input.add(new Option(o, o)));
  if (type === "checkbox") input.checked = value;
  else input.value = value;
  wrap.append(input);
  if (type === "textarea") wrap.className = "wide";
  $("fields").append(wrap);
  return input;
}
function dialog(title, fields, callback) {
  $("editor-title").textContent = title;
  $("fields").replaceChildren();
  $("dialog-error").hidden = true;
  fields.forEach((f) => field(...f));
  editCallback = () => {
    const values = {};
    fields.forEach(([, key, , type]) => {
      const e = $("field-" + key);
      values[key] =
        type === "number"
          ? Number(e.value)
          : type === "checkbox"
            ? e.checked
            : e.value;
    });
    return callback(values);
  };
  $("editor").showModal();
  $("fields").querySelector("input,select,textarea")?.focus();
}
$("cancel").onclick = () => $("editor").close();
$("editor-form").onsubmit = (e) => {
  e.preventDefault();
  task("Validating edits…", async () => {
    await editCallback();
    $("editor").close();
  });
};
function editEntry(entry) {
  const original = entry ? clone(entry) : newEntry();
  dialog(
    entry ? "Edit entry" : "Add entry",
    entryFields(original),
    async (values) => {
      const next = clone(doc);
      const result = normalizeEntry({ ...original, ...values });
      if (entry)
        next[KEY] = next[KEY].map((x) => (x.id === entry.id ? result : x));
      else next[KEY].push(result);
      selected = new Set([result.id]);
      await change(next);
    },
  );
}
function removeEntry(key) {
  if (
    !confirm(
      "Remove this entry? Undo remains available until you open another document.",
    )
  )
    return;
  task("Checking removal…", () =>
    change({ ...doc, [KEY]: doc[KEY].filter((x) => x.id !== key) }),
  );
}
function selectField(label, options, value, callback) {
  const l = node("label", label),
    s = node("select");
  s.id = "tool-" + label.toLowerCase().replaceAll(" ", "-");
  for (const [v, t] of options) s.add(new Option(t, v));
  s.value = value;
  s.onchange = () => callback(s.value);
  l.append(s);
  return l;
}
function setupTools() {
  const tools = $("tools");
  tools.replaceChildren();
  const l = node("label", "Search entries"),
    input = node("input");
  input.type = "search";
  input.id = "search";
  input.oninput = () => {
    query = input.value.toLowerCase();
    pageNumber = 0;
    renderWorkspace();
    controls();
  };
  l.append(input);
  tools.append(l);
  domainTools(tools);
}
function download(name, data, type) {
  const u = URL.createObjectURL(new Blob([data], { type })),
    a = node("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
async function library() {
  const rows = await api("documents");
  $("library").replaceChildren(new Option("Select a document", ""));
  rows.forEach((x) =>
    $("library").add(new Option(`${x.title} · v${x.revision}`, x.id)),
  );
  $("library").value = id || "";
}
async function load(document, key = null, rev = 0) {
  const checked = await api("validate", document);
  doc = checked.document;
  analysis = checked.analysis;
  id = key;
  revision = rev;
  dirty = !key;
  undo = [];
  redo = [];
  selected.clear();
  query = "";
  filter = "all";
  pageNumber = 0;
  zoom = 1;
  setupTools();
  render();
}
$("new").onclick = () => {
  if (dirty && !confirm("Discard unsaved changes and load the sample?")) return;
  task("Loading sample…", async () => {
    await load(await api("sample"));
    say("Fictional sample ready.");
  });
};
$("save").onclick = () =>
  task("Saving document…", async () => {
    const r = await api("save", { id, revision, document: doc });
    id = r.id;
    revision = r.revision;
    dirty = false;
    await library();
    render();
    say(`Saved revision ${revision} locally.`);
  });
$("open").onclick = () => {
  const key = $("library").value;
  if (!key) return;
  if (dirty && !confirm("Discard unsaved changes and open the saved document?"))
    return;
  task("Opening document…", async () => {
    const r = await api("documents/" + key);
    await load(r.document, r.id, r.revision);
    say("Saved document opened.");
  });
};
$("undo").onclick = () =>
  task("Restoring previous state…", async () => {
    if (!undo.length) return;
    const next = undo.at(-1),
      checked = await api("validate", next);
    undo.pop();
    redo.push(clone(doc));
    doc = checked.document;
    analysis = checked.analysis;
    dirty = true;
    selected = new Set(
      [...selected].filter((k) => doc[KEY].some((x) => x.id === k)),
    );
    render();
    say("Change undone.");
  });
$("redo").onclick = () =>
  task("Reapplying change…", async () => {
    if (!redo.length) return;
    const next = redo.at(-1),
      checked = await api("validate", next);
    redo.pop();
    undo.push(clone(doc));
    doc = checked.document;
    analysis = checked.analysis;
    dirty = true;
    render();
    say("Change reapplied.");
  });
$("add").onclick = () => editEntry();
$("settings").onclick = () =>
  dialog("Document settings", settingsFields(), (values) =>
    change({ ...doc, ...values }),
  );
$("export").onclick = () =>
  task("Validating export…", async () => {
    const checked = await api("validate", doc);
    download(
      KIND + ".json",
      JSON.stringify(checked.document, null, 2) + "\n",
      "application/json",
    );
    say("Validated document exported.");
  });
$("import").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (dirty && !confirm("Replace unsaved changes with this import?")) {
    e.target.value = "";
    return;
  }
  task("Validating import…", async () => {
    try {
      if (file.size > 256000) throw Error("Imports are limited to 256 KB.");
      await load(JSON.parse(await file.text()));
      say("Document imported. Save to add it to the library.");
    } finally {
      e.target.value = "";
    }
  });
};
$("print").onclick = () => window.print();
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function settingsFields() {
  return [["Document title", "title", doc.title]];
}
function normalizeEntry(x) {
  return x;
}
function unique() {
  return "entry-" + crypto.randomUUID().slice(0, 12);
}
function newEntry() {
  return {
    id: unique(),
    title: "New care task",
    resource: "Workshop",
    date: month + "-01",
    duration: 1,
    repeat: "once",
    count: 1,
    note: "—",
  };
}
function entryFields(x) {
  return [
    ["Schedule title", "title", x.title],
    ["Equipment", "resource", x.resource],
    ["First date", "date", x.date, "date"],
    ["Duration · days", "duration", x.duration, "number"],
    ["Recurrence", "repeat", x.repeat, "text", ["once", "weekly"]],
    ["Occurrences", "count", x.count, "number"],
    ["Notes", "note", x.note, "textarea"],
  ];
}
function domainTools(tools) {
  const l = node("label", "Calendar month"),
    input = node("input");
  input.id = "month";
  input.type = "month";
  input.value = month;
  input.min = "2000-01";
  input.max = "2099-12";
  input.onchange = () => {
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(input.value)) {
      input.value = month;
      fail(Error("Select a month from 2000 through 2099."));
      return;
    }
    month = input.value;
    renderWorkspace();
    controls();
  };
  l.append(input);
  tools.append(
    l,
    selectField(
      "Equipment",
      [
        ["all", "All equipment"],
        ...[...new Set(doc.events.map((e) => e.resource))]
          .sort()
          .map((v) => [v, v]),
      ],
      filter,
      (v) => {
        filter = v;
        renderWorkspace();
        controls();
      },
    ),
  );
}
function renderWorkspace() {
  const root = $("workspace");
  root.replaceChildren();
  const card = node("section", undefined, "card");
  card.append(
    node(
      "h2",
      new Date(month + "-15T12:00:00Z").toLocaleDateString("en", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    ),
  );
  const scroll = node("div", undefined, "scroll"),
    grid = node("div", undefined, "calendar");
  grid.setAttribute("aria-label", "Monthly equipment calendar");
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    grid.append(node("div", day, "weekday"));
  const first = new Date(month + "-01T00:00:00Z"),
    offset = (first.getUTCDay() + 6) % 7;
  const filtered = analysis.occurrences.filter(
    (e) =>
      (filter === "all" || e.resource === filter) &&
      [e.title, e.resource, e.note].join(" ").toLowerCase().includes(query),
  );
  const conflicts = new Set(
    analysis.conflicts.flatMap(([a, i, b, j]) => [a + ":" + i, b + ":" + j]),
  );
  for (let i = 0; i < 42; i++) {
    const day = new Date(first);
    day.setUTCDate(1 - offset + i);
    const iso = day.toISOString().slice(0, 10),
      cell = node(
        "div",
        undefined,
        "day" + (iso.startsWith(month) ? "" : " outside"),
      );
    cell.append(node("strong", String(day.getUTCDate())));
    for (const e of filtered.filter((e) => e.start <= iso && e.end > iso)) {
      const b = button(
        `${e.start < iso ? "↳ " : ""}${e.title} · ${e.resource}`,
        () => editEntry(doc.events.find((x) => x.id === e.id)),
        "event" +
          (conflicts.has(e.id + ":" + e.occurrence) ? " conflict" : "") +
          (e.start < iso ? " continued" : ""),
      );
      b.setAttribute(
        "aria-label",
        `${e.title}, ${iso}, ${e.resource}${conflicts.has(e.id + ":" + e.occurrence) ? ", conflict" : ""}`,
      );
      cell.append(b);
    }
    grid.append(cell);
  }
  scroll.append(grid);
  card.append(
    scroll,
    node(
      "p",
      "On narrow screens, scroll the calendar and schedule table horizontally. Dates are calendar days, not time-zone instants. End dates are exclusive. Editing any occurrence changes its entire series. Conflicts flag overlapping use of the same equipment.",
      "muted",
    ),
  );
  root.append(card);
  const list = node("section", undefined, "card");
  list.append(node("h2", "Schedule definitions"));
  const table = node("table"),
    head = node("thead"),
    hr = node("tr");
  ["Schedule", "Equipment", "First date", "Repeat", "Actions"].forEach((v) =>
    hr.append(node("th", v)),
  );
  head.append(hr);
  table.append(head);
  const body = node("tbody");
  for (const e of doc.events.filter(
    (e) =>
      (filter === "all" || e.resource === filter) &&
      [e.title, e.resource, e.note].join(" ").toLowerCase().includes(query),
  )) {
    const row = node("tr");
    [e.title, e.resource, e.date, `${e.repeat} · ${e.count}`].forEach((v) =>
      row.append(node("td", v)),
    );
    const actions = node("td"),
      edit = button("Edit", () => editEntry(e));
    edit.setAttribute("aria-label", "Edit " + e.title);
    actions.append(
      edit,
      button("Remove", () => removeEntry(e.id)),
    );
    row.append(actions);
    body.append(row);
  }
  table.append(body);
  const wrap = node("div", undefined, "scroll");
  wrap.append(table);
  list.append(wrap);
  root.append(list);
}

task("Preparing workspace…", async () => {
  await load(await api("sample"));
  await library();
  say("Fictional sample loaded. Changes stay local.");
});
