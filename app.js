/* ---------- Default seed data (used the first time this browser opens the page) ----------
   Todos start empty for every new visitor — those are personal, and this
   file ships to everyone who opens the page. Schedule starts pre-filled
   with the two core cohort classes everyone shares; students add their own
   electives (like studio sections) on top. Events stay populated too:
   they're shared MHCI+D program dates, not private to any one student. */
const DEFAULT_SCHEDULE = [
  { id: "c1", title: "HCID 530 A", subject: "Usability & User Research", room: "L039 200", days: ["Mon", "Wed"], start: "10:00", end: "11:20", color: "navy" },
  { id: "c2", title: "HCID 511 A", subject: "Ideation Studio", room: "L039 200", days: ["Tue", "Thu"], start: "13:30", end: "15:50", color: "purple" },
];

const DEFAULT_EVENTS = [
  { id: "e1",  title: "Program Meeting",                     date: "2026-10-02", time: "11:00", location: "MHCI+D Studio" },
  { id: "e2",  title: "Registration Open/Add-Drop Ends",      date: "2026-10-06", time: "",      location: "Online" },
  { id: "e3",  title: "DUB Seminar — Daniel Epstein",         date: "2026-10-07", time: "11:45", location: "Kane Hall 225" },
  { id: "e4",  title: "CIRCLE — Int'l Grad Student Mixer",    date: "2026-10-09", time: "16:00", location: "HUB Lyceum 160" },
  { id: "e5",  title: "Career Development Intro & Overview",  date: "2026-10-13", time: "16:00", location: "MHCI+D Studio" },
  { id: "e6",  title: "Dawg Dash 5k/10k",                     date: "2026-10-18", time: "09:00", location: "Red Square" },
  { id: "e7",  title: "DUB Community Day",                    date: "2026-10-21", time: "09:30", location: "CSE2, Zillow Commons" },
  { id: "e8",  title: "DUB Seminar — Emily Tseng",            date: "2026-11-04", time: "11:45", location: "Kane Hall 225" },
  { id: "e9",  title: "C14 Alumni Mixer",                     date: "2026-11-05", time: "",      location: "MHCI+D Studio" },
  { id: "e10", title: "Capstone Introduction Meeting",        date: "2026-11-09", time: "11:30", location: "MHCI+D Studio" },
  { id: "e11", title: "DUB Seminar — Qian Yang",               date: "2026-11-18", time: "11:45", location: "Kane Hall 225" },
  { id: "e12", title: "Ideation Studio Showcase",             date: "2026-12-14", time: "",      location: "MHCI+D Studio" },
];

const DEFAULT_TODOS = [];

/* ---------- Per-browser storage ----------
   Everything (name, schedule, events, todos) is read from and written to
   *this browser's* localStorage only. Nothing is sent anywhere, so no one
   else who opens this page can see it, and this page can't see anyone
   else's either. Clearing site data or switching browsers starts fresh. */
const LS_NAME = "mhcid.name";
const LS_SCHEDULE = "mhcid.schedule";
const LS_EVENTS = "mhcid.events";
const LS_TODOS = "mhcid.todos";

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

let schedule = loadLS(LS_SCHEDULE, DEFAULT_SCHEDULE);
let events = loadLS(LS_EVENTS, DEFAULT_EVENTS);
let todos = loadLS(LS_TODOS, DEFAULT_TODOS);

function saveSchedule() { saveLS(LS_SCHEDULE, schedule); }
function saveEvents() { saveLS(LS_EVENTS, events); }
function saveTodos() { saveLS(LS_TODOS, todos); }

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 9);
}

/* ---------- Inline form errors (this page can't use alert()) ---------- */
function showFormError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.hidden = false;
}
function clearFormError(id) {
  const el = document.getElementById(id);
  el.hidden = true;
  el.textContent = "";
}

/* ---------- Two-step inline delete (this page can't use confirm()) ---------- */
function armDelete(button, onConfirm) {
  if (button.dataset.armed === "1") {
    onConfirm();
    return;
  }
  button.dataset.armed = "1";
  const original = button.textContent;
  button.textContent = "Confirm?";
  button.classList.add("armed");
  const revert = () => {
    button.dataset.armed = "0";
    button.textContent = original;
    button.classList.remove("armed");
  };
  button._revertTimer = setTimeout(revert, 3500);
  button._revert = revert;
}

/* ---------- Tab navigation ---------- */
const tabs = ["dashboard", "schedule", "events", "todos"];
function showTab(name) {
  tabs.forEach(t => {
    document.getElementById("tab-" + t).hidden = t !== name;
  });
  document.querySelectorAll(".navlink").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  if (name === "dashboard") renderDashboard();
  if (name === "schedule") renderScheduleTab();
  if (name === "events") renderEventsTab();
  if (name === "todos") renderTodosTab();
  window.scrollTo(0, 0);
}
document.getElementById("navlinks").addEventListener("click", e => {
  const btn = e.target.closest(".navlink");
  if (btn) showTab(btn.dataset.tab);
});
document.querySelectorAll("[data-goto]").forEach(btn => {
  btn.addEventListener("click", () => showTab(btn.dataset.goto));
});

/* ---------- Date helpers ---------- */
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function formatHeaderDate() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
function formatChip(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: d.getDate(),
  };
}
function formatEventMeta(ev) {
  const parts = [];
  if (ev.location) parts.push(ev.location);
  if (ev.time) {
    const [h, m] = ev.time.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = ((h + 11) % 12) + 1;
    parts.push(`${h12}:${String(m).padStart(2, "0")}${ampm}`);
  }
  return parts.join(" · ");
}

/* ---------- Dashboard: Schedule grid rendering ---------- */
const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const COLOR_LABEL = { navy: "block-navy", purple: "block-purple", gold: "block-gold", cream: "block-cream", blue: "block-blue" };
const ROW_H = 44;

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function computeGridBounds() {
  if (schedule.length === 0) return { startHour: 9, endHour: 17 };
  let minStart = Infinity, maxEnd = -Infinity;
  schedule.forEach(c => {
    minStart = Math.min(minStart, timeToMinutes(c.start));
    maxEnd = Math.max(maxEnd, timeToMinutes(c.end));
  });
  const startHour = Math.max(0, Math.floor(minStart / 60));
  const endHour = Math.min(24, Math.ceil(maxEnd / 60));
  return { startHour, endHour: Math.max(endHour, startHour + 1) };
}

function fmtHourLabel(h) {
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${ampm}`;
}

function renderScheduleGrid(container) {
  container.innerHTML = "";
  const { startHour, endHour } = computeGridBounds();
  const hours = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const totalH = (endHour - startHour) * ROW_H;

  const header = document.createElement("div");
  header.className = "grid-header";
  header.innerHTML = `<div></div>` + DAY_ORDER.map(d => `<div class="day-label">${d.toUpperCase()}</div>`).join("");
  container.appendChild(header);

  const body = document.createElement("div");
  body.className = "grid-body";
  body.style.setProperty("--row-h", ROW_H + "px");

  const timeCol = document.createElement("div");
  timeCol.className = "time-col";
  timeCol.style.height = totalH + "px";
  hours.forEach((h, i) => {
    const lbl = document.createElement("div");
    lbl.className = "time-label";
    lbl.style.top = (i * ROW_H) + "px";
    lbl.textContent = fmtHourLabel(h);
    timeCol.appendChild(lbl);
  });
  body.appendChild(timeCol);

  const dayCols = {};
  DAY_ORDER.forEach(day => {
    const col = document.createElement("div");
    col.className = "day-col";
    col.style.height = totalH + "px";
    col.style.setProperty("--row-h", ROW_H + "px");
    body.appendChild(col);
    dayCols[day] = col;
  });

  // Collect every class instance per day first, so overlapping classes on
  // the same day can be laid out side by side instead of stacked on top of
  // each other.
  const dayEntries = {};
  DAY_ORDER.forEach(day => { dayEntries[day] = []; });
  schedule.forEach(cls => {
    const startMin = timeToMinutes(cls.start);
    const endMin = timeToMinutes(cls.end);
    const top = (startMin - startHour * 60) / 60 * ROW_H;
    const height = (endMin - startMin) / 60 * ROW_H;
    cls.days.forEach(day => {
      if (!dayEntries[day]) return;
      dayEntries[day].push({ cls, top, height, start: startMin, end: endMin });
    });
  });

  DAY_ORDER.forEach(day => {
    const entries = dayEntries[day];
    const col = dayCols[day];
    if (!col || entries.length === 0) return;

    assignOverlapColumns(entries);

    entries.forEach(entry => {
      const { cls, top, height, col: colIndex, totalCols } = entry;
      const block = document.createElement("div");
      block.className = "class-block " + (COLOR_LABEL[cls.color] || "block-navy");
      block.style.top = (top + 2) + "px";
      block.style.height = Math.max(height - 4, 18) + "px";
      const widthPct = 100 / totalCols;
      block.style.left = `calc(${colIndex * widthPct}% + 3px)`;
      block.style.width = `calc(${widthPct}% - 6px)`;
      block.style.right = "auto";
      block.innerHTML = `<div class="cb-title">${escapeHtml(cls.title)}</div>` +
        (cls.room ? `<div class="cb-meta">${escapeHtml(cls.room)}</div>` : "");
      block.tabIndex = 0;
      block.setAttribute("role", "button");
      block.setAttribute("aria-label", `${cls.title}${cls.subject ? ", " + cls.subject : ""}, details`);
      block.addEventListener("click", e => {
        e.stopPropagation();
        showClassPopover(cls, block);
      });
      block.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showClassPopover(cls, block);
        }
      });
      col.appendChild(block);
    });
  });

  container.appendChild(body);
}

/* Greedy interval layout: sorts same-day entries by start time, places each
   in the first free column among the classes it currently overlaps with,
   and gives every entry in that overlap cluster the same column count so
   they divide the day's width evenly (same approach most calendar UIs use). */
function assignOverlapColumns(entries) {
  entries.sort((a, b) => a.start - b.start || a.end - b.end);

  let cluster = [];
  let columnEnds = [];
  let clusterMaxEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const totalCols = Math.max(...cluster.map(e => e.col)) + 1;
    cluster.forEach(e => { e.totalCols = totalCols; });
    cluster = [];
  };

  entries.forEach(entry => {
    if (entry.start >= clusterMaxEnd) {
      flush();
      columnEnds = [];
      clusterMaxEnd = -Infinity;
    }
    let placed = false;
    for (let i = 0; i < columnEnds.length; i++) {
      if (columnEnds[i] <= entry.start) {
        columnEnds[i] = entry.end;
        entry.col = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      entry.col = columnEnds.length;
      columnEnds.push(entry.end);
    }
    clusterMaxEnd = Math.max(clusterMaxEnd, entry.end);
    cluster.push(entry);
  });
  flush();
}

/* ---------- Class detail popover (click a block on the grid) ---------- */
let closeActivePopover = null;

function showClassPopover(cls, anchorEl) {
  if (closeActivePopover) closeActivePopover();

  const pop = document.createElement("div");
  pop.className = "class-popover";
  pop.setAttribute("role", "dialog");
  const timeRange = `${fmtTime(cls.start)} – ${fmtTime(cls.end)}`;
  pop.innerHTML = `
    <button class="class-popover-close" aria-label="Close">&times;</button>
    <div class="cp-title">${escapeHtml(cls.title)}</div>
    ${cls.subject ? `<div class="cp-subject">${escapeHtml(cls.subject)}</div>` : ""}
    <div class="cp-row">${cls.days.join(", ")} · ${timeRange}</div>
    ${cls.room ? `<div class="cp-row">${escapeHtml(cls.room)}</div>` : ""}
  `;
  document.body.appendChild(pop);

  const r = anchorEl.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  let left = r.left + r.width / 2 - popRect.width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - popRect.width - 12));
  let top = r.bottom + 8;
  if (top + popRect.height > window.innerHeight - 12) top = r.top - popRect.height - 8;
  pop.style.left = left + "px";
  pop.style.top = Math.max(12, top) + "px";

  const onClose = () => {
    pop.remove();
    document.removeEventListener("click", onOutsideClick, true);
    document.removeEventListener("keydown", onKey);
    closeActivePopover = null;
  };
  const onOutsideClick = e => {
    if (!pop.contains(e.target)) onClose();
  };
  const onKey = e => {
    if (e.key === "Escape") onClose();
  };
  pop.querySelector(".class-popover-close").addEventListener("click", onClose);
  setTimeout(() => {
    document.addEventListener("click", onOutsideClick, true);
    document.addEventListener("keydown", onKey);
  }, 0);
  closeActivePopover = onClose;
}

function renderScheduleLegend(container) {
  container.innerHTML = "";
  if (schedule.length === 0) {
    container.innerHTML = '<p class="empty-note">No classes yet — add one in the Schedule tab.</p>';
    return;
  }
  schedule.forEach(cls => {
    const item = document.createElement("div");
    item.className = "legend-item";
    const label = cls.subject ? `${cls.title} — ${cls.subject}` : cls.title;
    item.innerHTML = `<span class="legend-dot ${COLOR_LABEL[cls.color] || "block-navy"}"></span>${escapeHtml(label)}`;
    container.appendChild(item);
  });
}

/* ---------- Dashboard: events ---------- */
function getUpcomingEvents(limit) {
  const today = todayStr();
  return events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
    .slice(0, limit || events.length);
}

function renderEventRow(ev, { withActions } = {}) {
  const chip = formatChip(ev.date);
  const row = document.createElement("div");
  row.className = "event-row";
  row.innerHTML = `
    <div class="date-chip"><div class="dc-month">${chip.month}</div><div class="dc-day">${chip.day}</div></div>
    <div class="event-text">
      <div class="ev-title">${escapeHtml(ev.title)}</div>
      <div class="ev-meta">${escapeHtml(formatEventMeta(ev))}</div>
    </div>
  `;
  if (withActions) {
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn-link-text";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => editEvent(ev.id));
    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger-text";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => armDelete(delBtn, () => deleteEvent(ev.id)));
    actions.append(editBtn, delBtn);
    row.appendChild(actions);
  }
  return row;
}

function renderDashEvents() {
  const container = document.getElementById("dashEventsList");
  container.innerHTML = "";
  const upcoming = getUpcomingEvents(6);
  if (upcoming.length === 0) {
    container.innerHTML = '<p class="empty-note">No upcoming events. Add one from the Events tab.</p>';
    return;
  }
  upcoming.forEach(ev => container.appendChild(renderEventRow(ev)));
}

/* ---------- Dashboard: todos ---------- */
function renderTodoRow(todo, { withDelete } = {}) {
  const row = document.createElement("div");
  row.className = "todo-row";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = todo.done;
  cb.id = "todo-" + todo.id;
  cb.addEventListener("change", () => toggleTodo(todo.id));

  const label = document.createElement("label");
  label.className = "todo-task" + (todo.done ? " done" : "");
  label.htmlFor = cb.id;
  label.textContent = todo.task;

  const due = document.createElement("span");
  due.className = "due-badge";
  due.textContent = todo.due;

  row.append(cb, label, due);

  if (withDelete) {
    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger-text";
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "4px";
    delBtn.addEventListener("click", () => armDelete(delBtn, () => deleteTodo(todo.id)));
    row.appendChild(delBtn);
  }

  return row;
}

function renderDashTodos() {
  const container = document.getElementById("dashTodoGrid");
  container.innerHTML = "";
  if (todos.length === 0) {
    container.innerHTML = '<p class="empty-note">No tasks yet.</p>';
    return;
  }
  todos.forEach(t => container.appendChild(renderTodoRow(t)));
}

function toggleTodo(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTodos();
  renderDashboard();
  if (!document.getElementById("tab-todos").hidden) renderTodosTab();
}

/* ---------- Dashboard render ---------- */
function renderDashboard() {
  document.getElementById("todaySubtitle").textContent = formatHeaderDate() + " · Autumn Quarter";
  renderScheduleGrid(document.getElementById("scheduleGrid"));
  renderScheduleLegend(document.getElementById("scheduleLegend"));
  renderDashEvents();
  renderDashTodos();
}

/* ---------- Schedule tab (edit classes) ---------- */
function renderClassList() {
  const container = document.getElementById("classList");
  container.innerHTML = "";
  if (schedule.length === 0) {
    container.innerHTML = '<p class="empty-note">No classes yet.</p>';
    return;
  }
  schedule.forEach(cls => {
    const row = document.createElement("div");
    row.className = "class-row";

    const swatch = document.createElement("span");
    swatch.className = "class-swatch " + (COLOR_LABEL[cls.color] || "block-navy");

    const info = document.createElement("div");
    info.className = "class-info";
    const titleLabel = cls.subject ? `${cls.title} — ${cls.subject}` : cls.title;
    info.innerHTML = `<div class="ci-title">${escapeHtml(titleLabel)}</div>
      <div class="ci-meta">${cls.days.join(", ")} · ${fmtTimeRange(cls.start, cls.end)}${cls.room ? " · " + escapeHtml(cls.room) : ""}</div>`;

    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn-link-text";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => editClass(cls.id));
    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger-text";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => armDelete(delBtn, () => deleteClass(cls.id)));
    actions.append(editBtn, delBtn);

    row.append(swatch, info, actions);
    container.appendChild(row);
  });
}

function fmtTimeRange(start, end) {
  return `${fmtTime(start)} – ${fmtTime(end)}`;
}
function fmtTime(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""}${ampm}`;
}

function renderScheduleTab() {
  renderClassList();
}

const scheduleForm = document.getElementById("scheduleForm");
scheduleForm.addEventListener("submit", e => {
  e.preventDefault();
  clearFormError("scheduleFormError");
  const id = document.getElementById("scheduleId").value;
  const title = document.getElementById("fTitle").value.trim();
  const subject = document.getElementById("fSubject").value.trim();
  const room = document.getElementById("fRoom").value.trim();
  const start = document.getElementById("fStart").value;
  const end = document.getElementById("fEnd").value;
  const days = Array.from(document.querySelectorAll("#dayChecks input:checked")).map(c => c.value);
  const color = document.querySelector('input[name="fColor"]:checked').value;

  if (!title || !start || !end || days.length === 0) {
    showFormError("scheduleFormError", "Please fill in a title, start/end time, and at least one day.");
    return;
  }
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    showFormError("scheduleFormError", "End time must be after start time.");
    return;
  }

  if (id) {
    const cls = schedule.find(c => c.id === id);
    Object.assign(cls, { title, subject, room, start, end, days, color });
  } else {
    schedule.push({ id: uid("c"), title, subject, room, start, end, days, color });
  }
  saveSchedule();
  resetScheduleForm();
  renderClassList();
  renderDashboard();
});

document.getElementById("scheduleCancelBtn").addEventListener("click", resetScheduleForm);

function resetScheduleForm() {
  document.getElementById("scheduleId").value = "";
  scheduleForm.reset();
  clearFormError("scheduleFormError");
  document.getElementById("scheduleFormTitle").textContent = "Add a Class";
  document.getElementById("scheduleSubmitBtn").textContent = "Add Class";
  document.getElementById("scheduleCancelBtn").hidden = true;
}

function editClass(id) {
  const cls = schedule.find(c => c.id === id);
  if (!cls) return;
  document.getElementById("scheduleId").value = cls.id;
  document.getElementById("fTitle").value = cls.title;
  document.getElementById("fSubject").value = cls.subject || "";
  document.getElementById("fRoom").value = cls.room || "";
  document.getElementById("fStart").value = cls.start;
  document.getElementById("fEnd").value = cls.end;
  document.querySelectorAll("#dayChecks input").forEach(c => { c.checked = cls.days.includes(c.value); });
  document.querySelector(`input[name="fColor"][value="${cls.color}"]`).checked = true;
  clearFormError("scheduleFormError");
  document.getElementById("scheduleFormTitle").textContent = "Edit Class";
  document.getElementById("scheduleSubmitBtn").textContent = "Save Changes";
  document.getElementById("scheduleCancelBtn").hidden = false;
  document.getElementById("scheduleForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteClass(id) {
  schedule = schedule.filter(c => c.id !== id);
  saveSchedule();
  renderClassList();
  renderDashboard();
}

/* ---------- Events tab ---------- */
function renderAllEvents() {
  const container = document.getElementById("allEventsList");
  container.innerHTML = "";
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-note">No events yet.</p>';
    return;
  }
  const today = todayStr();
  sorted.forEach(ev => {
    const row = renderEventRow(ev, { withActions: true });
    if (ev.date < today) row.style.opacity = "0.45";
    container.appendChild(row);
  });
}

function renderEventsTab() {
  renderAllEvents();
}

const eventForm = document.getElementById("eventForm");
eventForm.addEventListener("submit", e => {
  e.preventDefault();
  clearFormError("eventFormError");
  const id = document.getElementById("eventId").value;
  const title = document.getElementById("eTitle").value.trim();
  const date = document.getElementById("eDate").value;
  const time = document.getElementById("eTime").value;
  const location = document.getElementById("eLocation").value.trim();

  if (!title || !date) {
    showFormError("eventFormError", "Please fill in an event name and date.");
    return;
  }

  if (id) {
    const ev = events.find(x => x.id === id);
    Object.assign(ev, { title, date, time, location });
  } else {
    events.push({ id: uid("e"), title, date, time, location });
  }
  saveEvents();
  resetEventForm();
  renderAllEvents();
  renderDashEvents();
});

document.getElementById("eventCancelBtn").addEventListener("click", resetEventForm);

function resetEventForm() {
  document.getElementById("eventId").value = "";
  eventForm.reset();
  clearFormError("eventFormError");
  document.getElementById("eventFormTitle").textContent = "Add an Event";
  document.getElementById("eventSubmitBtn").textContent = "Add Event";
  document.getElementById("eventCancelBtn").hidden = true;
}

function editEvent(id) {
  const ev = events.find(x => x.id === id);
  if (!ev) return;
  document.getElementById("eventId").value = ev.id;
  document.getElementById("eTitle").value = ev.title;
  document.getElementById("eDate").value = ev.date;
  document.getElementById("eTime").value = ev.time || "";
  document.getElementById("eLocation").value = ev.location || "";
  clearFormError("eventFormError");
  document.getElementById("eventFormTitle").textContent = "Edit Event";
  document.getElementById("eventSubmitBtn").textContent = "Save Changes";
  document.getElementById("eventCancelBtn").hidden = false;
  document.getElementById("eventForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteEvent(id) {
  events = events.filter(x => x.id !== id);
  saveEvents();
  renderAllEvents();
  renderDashEvents();
}

/* ---------- Todos tab ---------- */
function renderAllTodos() {
  const container = document.getElementById("allTodoGrid");
  container.innerHTML = "";
  if (todos.length === 0) {
    container.innerHTML = '<p class="empty-note">No tasks yet.</p>';
    return;
  }
  todos.forEach(t => container.appendChild(renderTodoRow(t, { withDelete: true })));
}

function renderTodosTab() {
  renderAllTodos();
}

document.getElementById("todoForm").addEventListener("submit", e => {
  e.preventDefault();
  clearFormError("todoFormError");
  const task = document.getElementById("tTask").value.trim();
  const due = document.getElementById("tDue").value.trim();
  if (!task || !due) {
    showFormError("todoFormError", "Please fill in both the task and a due date.");
    return;
  }
  todos.push({ id: uid("t"), task, due, done: false });
  saveTodos();
  e.target.reset();
  renderAllTodos();
  renderDashTodos();
});

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderAllTodos();
  renderDashTodos();
}

/* ---------- Utility ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Name gate ----------
   First visit on this browser: ask for a first name, store it locally, and
   use it to personalize the dashboard. No account, no password — just a
   label for "whose schedule is this" on this device. */
const nameGate = document.getElementById("nameGate");
const appRoot = document.getElementById("appRoot");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInputField");

function enterApp(name) {
  nameGate.hidden = true;
  appRoot.hidden = false;
  document.getElementById("userName").textContent = name;
  document.getElementById("greeting").textContent = `${name}'s Schedule`;
  showTab("dashboard");
}

nameForm.addEventListener("submit", e => {
  e.preventDefault();
  const errEl = document.getElementById("nameError");
  const name = nameInput.value.trim();
  if (!name) {
    errEl.textContent = "Please enter your name.";
    errEl.hidden = false;
    return;
  }
  errEl.hidden = true;
  saveLS(LS_NAME, name);
  enterApp(name);
});

document.getElementById("changeNameBtn").addEventListener("click", () => {
  appRoot.hidden = true;
  nameGate.hidden = false;
  nameInput.value = loadLS(LS_NAME, "");
  nameInput.focus();
});

const savedName = loadLS(LS_NAME, "");
if (savedName) {
  enterApp(savedName);
} else {
  nameGate.hidden = false;
}
