const STORAGE_KEY = "gym_split_tracker_v1";
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_REST_DAY = "Friday";

const DEFAULT_PLAN = {
  Monday: { focus: "Chest, Arms", exercises: [{ name: "Dumbbell press", weight: "34", reps: "5", sets: "1" }, { name: "Flies", weight: "60", reps: "6", sets: "1" }, { name: "Triceps pulldown", weight: "75", reps: "7", sets: "1" }, { name: "Skull crusher", weight: "32", reps: "8", sets: "1" }, { name: "Wall curls", weight: "20", reps: "5,5,5", sets: "1" }] },
  Tuesday: { focus: "Back, Shoulders, Traps", exercises: [{ name: "Pull ups", weight: "bodyweight", reps: "20", sets: "1" }, { name: "Machine row", weight: "40", reps: "6", sets: "1" }, { name: "Shoulder press / Machine shoulder press", weight: "24 / 55", reps: "5 / 6", sets: "1" }, { name: "Shoulder flies", weight: "14", reps: "6", sets: "1" }, { name: "Trap crunch", weight: "28", reps: "6", sets: "1" }, { name: "Lat pulldown one hand", weight: "65", reps: "6", sets: "1" }] },
  Wednesday: { focus: "Legs (Cardio)", exercises: [{ name: "Leg press", weight: "240", reps: "4", sets: "1" }, { name: "Front raise", weight: "85", reps: "6", sets: "1" }, { name: "Squat", weight: "", reps: "", sets: "1" }, { name: "Hamstring curl", weight: "", reps: "", sets: "1" }, { name: "Calf raise", weight: "", reps: "", sets: "1" }, { name: "Deadlift unassisted", weight: "120", reps: "3", sets: "1" }] },
  Thursday: { focus: "Chest, Arms", exercises: [{ name: "Dumbbell press", weight: "34", reps: "5", sets: "1" }, { name: "Flies", weight: "60", reps: "6", sets: "1" }, { name: "Triceps pulldown", weight: "75", reps: "7", sets: "1" }, { name: "Skull crusher", weight: "32", reps: "8", sets: "1" }, { name: "Wall curls", weight: "20", reps: "5,5,5", sets: "1" }] },
  Friday: { focus: "Rest", exercises: [] },
  Saturday: { focus: "Back, Shoulders, Traps", exercises: [{ name: "Pull ups", weight: "bodyweight", reps: "20", sets: "1" }, { name: "Machine row", weight: "40", reps: "6", sets: "1" }, { name: "Shoulder flies", weight: "14", reps: "6", sets: "1" }, { name: "Trap crunch", weight: "28", reps: "6", sets: "1" }, { name: "Machine press / Shoulder press", weight: "22", reps: "5", sets: "1" }] },
  Sunday: { focus: "Legs (Cardio)", exercises: [{ name: "Leg press", weight: "240", reps: "4", sets: "1" }, { name: "Front raise", weight: "85", reps: "6", sets: "1" }, { name: "Squat", weight: "", reps: "", sets: "1" }, { name: "Hamstring curl", weight: "", reps: "", sets: "1" }, { name: "Calf raise", weight: "", reps: "", sets: "1" }, { name: "Deadlift unassisted", weight: "120", reps: "3", sets: "1" }] }
};

const state = loadState();
const ui = {
  todayLabel: document.getElementById("todayLabel"),
  monthlyAttendanceCounter: document.getElementById("monthlyAttendanceCounter"),
  monthlyKgCounter: document.getElementById("monthlyKgCounter"),
  dailyKgCounter: document.getElementById("dailyKgCounter"),
  homeTodayTitle: document.getElementById("homeTodayTitle"),
  homeTodaySubtitle: document.getElementById("homeTodaySubtitle"),
  homeTodayCount: document.getElementById("homeTodayCount"),
  routineTitle: document.getElementById("routineTitle"),
  routineSubtitle: document.getElementById("routineSubtitle"),
  exerciseList: document.getElementById("exerciseList"),
  upcomingText: document.getElementById("upcomingText"),
  upcomingPreview: document.getElementById("upcomingPreview"),
  toggleUpcomingPreviewBtn: document.getElementById("toggleUpcomingPreviewBtn"),
  completeWorkoutBtn: document.getElementById("completeWorkoutBtn"),
  resetTodayBtn: document.getElementById("resetTodayBtn"),
  restDaySelect: document.getElementById("restDaySelect"),
  daySelectLabel: document.getElementById("daySelectLabel"),
  daySelect: document.getElementById("daySelect"),
  editorList: document.getElementById("editorList"),
  addExerciseForm: document.getElementById("addExerciseForm"),
  addWorkoutSelect: document.getElementById("addWorkoutSelect"),
  exerciseNameInput: document.getElementById("exerciseNameInput"),
  exerciseWeightInput: document.getElementById("exerciseWeightInput"),
  exerciseRepsInput: document.getElementById("exerciseRepsInput"),
  exerciseSetsInput: document.getElementById("exerciseSetsInput"),
  specificDateInput: document.getElementById("specificDateInput"),
  specificWorkoutSelect: document.getElementById("specificWorkoutSelect"),
  applyDayWorkoutBtn: document.getElementById("applyDayWorkoutBtn"),
  clearDayWorkoutBtn: document.getElementById("clearDayWorkoutBtn"),
  specificDateSummary: document.getElementById("specificDateSummary"),
  pastDateInput: document.getElementById("pastDateInput"),
  markPastDoneBtn: document.getElementById("markPastDoneBtn"),
  unmarkPastDoneBtn: document.getElementById("unmarkPastDoneBtn"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  exerciseTemplate: document.getElementById("exerciseTemplate"),
  editorTemplate: document.getElementById("editorTemplate"),
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  pages: Array.from(document.querySelectorAll(".page"))
};
let upcomingPreviewVisible = false;

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }
function formatDateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateKey() { return formatDateKey(new Date()); }
function dayNameFromDate(date) { return date.toLocaleDateString("en-US", { weekday: "long" }); }
function shortWeekdayName(date) { return date.toLocaleDateString("en-US", { weekday: "short" }); }
function parseFirstNumber(value) { const m = String(value || "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : 0; }
function startOfWeek(date) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
function weekKey(date) { return formatDateKey(startOfWeek(date)); }

function normalizeRoutine(routine) {
  routine.exercises.forEach((exercise) => { if (exercise.sets === undefined || exercise.sets === null) exercise.sets = "1"; });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const raw = saved ? safelyParse(saved) : {
    doneByDate: {}, completedByDate: {}, weekRestDayOverrides: {}, dailyWorkoutOverrides: {},
    workoutTemplates: WEEK_DAYS.filter((d) => d !== DEFAULT_REST_DAY).map((d) => deepCopy(DEFAULT_PLAN[d]))
  };
  return migrateState(raw);
}

function safelyParse(raw) { try { return JSON.parse(raw); } catch { return null; } }

function migrateState(parsed) {
  const s = parsed || {};
  s.doneByDate = s.doneByDate || {};
  s.completedByDate = s.completedByDate || {};
  s.weekRestDayOverrides = s.weekRestDayOverrides || {};
  s.dailyWorkoutOverrides = s.dailyWorkoutOverrides || {};
  if (!Array.isArray(s.workoutTemplates) || s.workoutTemplates.length !== 6) {
    const srcPlan = s.plan || DEFAULT_PLAN;
    const srcRest = WEEK_DAYS.includes(s.restDay) ? s.restDay : DEFAULT_REST_DAY;
    s.workoutTemplates = WEEK_DAYS.filter((d) => d !== srcRest).map((d) => deepCopy(srcPlan[d] || { focus: "Workout", exercises: [] }));
  }
  while (s.workoutTemplates.length < 6) s.workoutTemplates.push({ focus: "Workout", exercises: [] });
  s.workoutTemplates = s.workoutTemplates.slice(0, 6);
  s.workoutTemplates.forEach(normalizeRoutine);
  if (WEEK_DAYS.includes(s.restDay) && s.restDay !== DEFAULT_REST_DAY) s.weekRestDayOverrides[weekKey(new Date())] = s.restDay;
  delete s.plan;
  delete s.restDay;
  return s;
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getRestDayForWeek(date) { return state.weekRestDayOverrides[weekKey(date)] || DEFAULT_REST_DAY; }
function buildPlanForDate(date) {
  const restDay = getRestDayForWeek(date);
  const plan = {};
  let i = 0;
  WEEK_DAYS.forEach((day) => {
    if (day === restDay) plan[day] = { focus: "Rest", exercises: [] };
    else plan[day] = deepCopy(state.workoutTemplates[i++] || { focus: "Workout", exercises: [] });
  });
  return plan;
}
function getTemplateByFocus(focus) { return state.workoutTemplates.find((t) => (t.focus || "Workout") === focus); }
function getRoutineForDate(date) {
  const key = formatDateKey(date);
  const override = state.dailyWorkoutOverrides[key];
  if (override) {
    if (override === "Rest") return { focus: "Rest", exercises: [] };
    const template = getTemplateByFocus(override);
    if (template) return deepCopy(template);
  }
  return buildPlanForDate(date)[dayNameFromDate(date)];
}
function getDateForDayInCurrentWeek(dayName) {
  const base = startOfWeek(new Date());
  const out = new Date(base);
  out.setDate(base.getDate() + Math.max(WEEK_DAYS.indexOf(dayName), 0));
  return out;
}
function workoutOptions() {
  const seen = new Set();
  const options = [];
  state.workoutTemplates.forEach((template) => {
    const focus = template.focus || "Workout";
    if (!seen.has(focus)) { seen.add(focus); options.push(focus); }
  });
  return options;
}

function formatExerciseInfo(exercise) {
  const weight = exercise.weight ? `${exercise.weight} kg` : "Weight not set";
  const reps = exercise.reps ? `${exercise.reps} reps` : "Reps not set";
  const sets = exercise.sets ? `${exercise.sets} sets` : "Sets not set";
  return `${weight} x ${reps} x ${sets}`;
}

function computeTotalKgForDate(date, routine) {
  const key = formatDateKey(date);
  const doneSet = new Set(state.doneByDate[key] || []);
  const dayName = dayNameFromDate(date);
  let total = 0;
  routine.exercises.forEach((exercise, idx) => {
    if (!doneSet.has(`${dayName}-${idx}`)) return;
    total += parseFirstNumber(exercise.weight) * parseFirstNumber(exercise.reps) * (parseFirstNumber(exercise.sets || "1") || 1);
  });
  return Math.round(total);
}

function renderNav() {
  ui.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.pageTarget;
      ui.navButtons.forEach((b) => b.classList.toggle("active", b === btn));
      ui.pages.forEach((p) => p.classList.toggle("hidden", p.id !== target));
    });
  });
}

function renderHomeAndWorkout() {
  const today = new Date();
  const todayRoutine = getRoutineForDate(today);
  const todayName = dayNameFromDate(today);
  ui.todayLabel.textContent = `Today is ${todayName}`;
  ui.homeTodayTitle.textContent = `${todayName}: ${todayRoutine.focus}`;
  ui.homeTodaySubtitle.textContent = todayRoutine.exercises.length ? "Your scheduled workout is ready." : "Rest and recover.";
  ui.homeTodayCount.textContent = `Exercises: ${todayRoutine.exercises.length}`;
  ui.dailyKgCounter.textContent = `Today's lifted total: ${computeTotalKgForDate(today, todayRoutine)} kg`;

  ui.routineTitle.textContent = `${todayName} Routine`;
  ui.routineSubtitle.textContent = todayRoutine.focus;
  ui.exerciseList.innerHTML = "";
  if (!todayRoutine.exercises.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Rest day. Recover and come back stronger.";
    ui.exerciseList.appendChild(p);
    return;
  }

  const todayKey = dateKey();
  const doneSet = new Set(state.doneByDate[todayKey] || []);
  todayRoutine.exercises.forEach((exercise, index) => {
    const node = ui.exerciseTemplate.content.firstElementChild.cloneNode(true);
    const id = `${todayName}-${index}`;
    const checkbox = node.querySelector(".done-toggle");
    node.querySelector(".exercise-name").textContent = exercise.name;
    node.querySelector(".exercise-info").textContent = formatExerciseInfo(exercise);
    checkbox.checked = doneSet.has(id);
    if (checkbox.checked) node.classList.add("completed");
    checkbox.addEventListener("change", () => {
      const current = new Set(state.doneByDate[todayKey] || []);
      if (checkbox.checked) { current.add(id); node.classList.add("completed"); } else { current.delete(id); node.classList.remove("completed"); }
      state.doneByDate[todayKey] = [...current];
      saveState();
      renderAll();
    });
    ui.exerciseList.appendChild(node);
  });
}

function renderUpcoming() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const routine = getRoutineForDate(d);
  ui.upcomingText.textContent = `${dayNameFromDate(d)}: ${routine.focus}`;
  ui.upcomingPreview.innerHTML = "";
  if (!routine.exercises.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Rest day coming up.";
    ui.upcomingPreview.appendChild(p);
  } else {
    routine.exercises.forEach((exercise) => {
      const item = document.createElement("article");
      item.className = "exercise-item";
      item.innerHTML = `<p class="exercise-name">${exercise.name}</p><p class="exercise-info">${formatExerciseInfo(exercise)}</p>`;
      ui.upcomingPreview.appendChild(item);
    });
  }
  const showPreview = upcomingPreviewVisible;
  ui.upcomingPreview.classList.toggle("hidden", !showPreview);
  ui.toggleUpcomingPreviewBtn.textContent = showPreview ? "Hide upcoming exercises" : "Show upcoming exercises";
  ui.toggleUpcomingPreviewBtn.setAttribute("aria-expanded", String(showPreview));
}

function renderPlanPage() {
  ui.daySelect.innerHTML = "";
  ui.restDaySelect.innerHTML = "";
  ui.addWorkoutSelect.innerHTML = "";
  WEEK_DAYS.forEach((day) => {
    const a = document.createElement("option"); a.value = day; a.textContent = day; ui.daySelect.appendChild(a);
    const b = document.createElement("option"); b.value = day; b.textContent = day; ui.restDaySelect.appendChild(b);
  });
  workoutOptions().forEach((focus) => {
    const option = document.createElement("option");
    option.value = focus;
    option.textContent = focus;
    ui.addWorkoutSelect.appendChild(option);
  });
  ui.restDaySelect.value = getRestDayForWeek(new Date());
  if (!ui.daySelect.value) ui.daySelect.value = dayNameFromDate(new Date());
  renderEditor();
}

function renderEditor() {
  const day = ui.daySelect.value || dayNameFromDate(new Date());
  const routine = getRoutineForDate(getDateForDayInCurrentWeek(day));
  ui.daySelectLabel.textContent = `Edit this day/workout (${day}: ${routine.focus})`;
  ui.editorList.innerHTML = "";
  if (!routine.exercises.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "This day is currently rest for this week.";
    ui.editorList.appendChild(p);
    return;
  }
  const restDay = getRestDayForWeek(new Date());
  const templateIndex = WEEK_DAYS.filter((d) => d !== restDay).indexOf(day);
  if (templateIndex < 0) return;
  const template = state.workoutTemplates[templateIndex];
  template.exercises.forEach((exercise, index) => {
    const node = ui.editorTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".exercise-name").textContent = exercise.name;
    const weightInput = node.querySelector(".weight-input");
    const repsInput = node.querySelector(".reps-input");
    const setsInput = node.querySelector(".sets-input");
    weightInput.value = exercise.weight;
    repsInput.value = exercise.reps;
    setsInput.value = exercise.sets || "1";
    weightInput.addEventListener("input", () => { template.exercises[index].weight = weightInput.value.trim(); saveState(); renderAll(); });
    repsInput.addEventListener("input", () => { template.exercises[index].reps = repsInput.value.trim(); saveState(); renderAll(); });
    setsInput.addEventListener("input", () => { template.exercises[index].sets = setsInput.value.trim(); saveState(); renderAll(); });
    ui.editorList.appendChild(node);
  });
}

function renderSpecificDayOverride() {
  const now = new Date();
  if (!ui.specificDateInput.value) ui.specificDateInput.value = dateKey();
  ui.specificWorkoutSelect.innerHTML = "";
  const restOption = document.createElement("option");
  restOption.value = "Rest";
  restOption.textContent = "Rest";
  ui.specificWorkoutSelect.appendChild(restOption);
  workoutOptions().forEach((focus) => {
    const option = document.createElement("option");
    option.value = focus;
    option.textContent = focus;
    ui.specificWorkoutSelect.appendChild(option);
  });
  const targetDate = new Date(ui.specificDateInput.value || now);
  const targetKey = formatDateKey(targetDate);
  const override = state.dailyWorkoutOverrides[targetKey];
  if (override) ui.specificWorkoutSelect.value = override;
  const routine = getRoutineForDate(targetDate);
  ui.specificDateSummary.textContent = `${targetKey} is set to: ${routine.focus}`;
}

function renderCalendarAndStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  ui.calendarMonthLabel.textContent = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  ui.calendarGrid.innerHTML = "";
  for (let i = 0; i < firstDay.getDay(); i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell empty";
    ui.calendarGrid.appendChild(empty);
  }
  let attended = 0;
  let workoutDays = 0;
  let monthlyKg = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    const routine = getRoutineForDate(date);
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.tabIndex = 0;
    cell.innerHTML = `<span class="calendar-weekday">${shortWeekdayName(date)}</span><span class="calendar-daynum">${day}</span>`;
    cell.addEventListener("click", () => { ui.pastDateInput.value = key; ui.specificDateInput.value = key; renderSpecificDayOverride(); });
    if (!routine.exercises.length) {
      cell.classList.add("rest");
    } else {
      workoutDays += 1;
      const doneSet = new Set(state.doneByDate[key] || []);
      monthlyKg += computeTotalKgForDate(date, routine);
      if (doneSet.size > 0 || state.completedByDate[key]) {
        attended += 1;
        cell.classList.add("done");
      } else if (date < new Date(year, month, now.getDate())) {
        cell.classList.add("missed");
      }
    }
    ui.calendarGrid.appendChild(cell);
  }
  ui.monthlyAttendanceCounter.textContent = `Gym attendance this month: ${attended}/${workoutDays} workout days`;
  ui.monthlyKgCounter.textContent = `Total lifted this month: ${monthlyKg} kg`;
}

function completeTodayWorkout() { state.completedByDate[dateKey()] = true; saveState(); renderAll(); }
function resetTodayProgress() { state.doneByDate[dateKey()] = []; saveState(); renderAll(); }
function markPastDone() { if (ui.pastDateInput.value) { state.completedByDate[ui.pastDateInput.value] = true; saveState(); renderAll(); } }
function unmarkPastDone() { if (ui.pastDateInput.value) { delete state.completedByDate[ui.pastDateInput.value]; saveState(); renderAll(); } }
function handleRestDayChange() {
  const wk = weekKey(new Date());
  if (ui.restDaySelect.value === DEFAULT_REST_DAY) delete state.weekRestDayOverrides[wk];
  else state.weekRestDayOverrides[wk] = ui.restDaySelect.value;
  saveState();
  renderAll();
}
function handleAddExercise(event) {
  event.preventDefault();
  const focus = ui.addWorkoutSelect.value;
  const payload = { name: ui.exerciseNameInput.value.trim(), weight: ui.exerciseWeightInput.value.trim(), reps: ui.exerciseRepsInput.value.trim(), sets: ui.exerciseSetsInput.value.trim() || "1" };
  if (!focus || !payload.name) return;
  state.workoutTemplates.forEach((template) => { if ((template.focus || "Workout") === focus) template.exercises.push(payload); });
  saveState();
  ui.addExerciseForm.reset();
  ui.addWorkoutSelect.value = focus;
  renderAll();
}
function applySpecificDayWorkout() {
  if (!ui.specificDateInput.value) return;
  state.dailyWorkoutOverrides[ui.specificDateInput.value] = ui.specificWorkoutSelect.value;
  saveState();
  renderAll();
}
function clearSpecificDayWorkout() {
  if (!ui.specificDateInput.value) return;
  delete state.dailyWorkoutOverrides[ui.specificDateInput.value];
  saveState();
  renderAll();
}

function renderAll() {
  renderHomeAndWorkout();
  renderUpcoming();
  renderPlanPage();
  renderSpecificDayOverride();
  renderCalendarAndStats();
}

function setup() {
  ui.pastDateInput.max = dateKey();
  ui.pastDateInput.value = dateKey();
  ui.specificDateInput.value = dateKey();
  renderNav();
  ui.completeWorkoutBtn.addEventListener("click", completeTodayWorkout);
  ui.resetTodayBtn.addEventListener("click", resetTodayProgress);
  ui.markPastDoneBtn.addEventListener("click", markPastDone);
  ui.unmarkPastDoneBtn.addEventListener("click", unmarkPastDone);
  ui.restDaySelect.addEventListener("change", handleRestDayChange);
  ui.daySelect.addEventListener("change", renderEditor);
  ui.addExerciseForm.addEventListener("submit", handleAddExercise);
  ui.toggleUpcomingPreviewBtn.addEventListener("click", () => { upcomingPreviewVisible = !upcomingPreviewVisible; renderUpcoming(); });
  ui.applyDayWorkoutBtn.addEventListener("click", applySpecificDayWorkout);
  ui.clearDayWorkoutBtn.addEventListener("click", clearSpecificDayWorkout);
  ui.specificDateInput.addEventListener("change", renderSpecificDayOverride);
  renderAll();
}

setup();
