const STORAGE_KEY = "gym_split_tracker_v1";
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_REST_DAY = "Friday";
const CREATE_WORKOUT_VALUE = "__create_new__";
const SCHEDULE_ROTATE = "rotate";
const SCHEDULE_REST = "rest";
const WANDA_PREFAB_IDS = new Set(["wanda_legs_glutes_v1"]);

const WANDAS_PREFAB_WORKOUTS = [
  {
    id: "wanda_legs_glutes_v1",
    name: "Wandaleins workout",
    exercises: [
      { name: "Leg press", weight: "", reps: "10-12", sets: "3" },
      { name: "Romanian deadlift", weight: "", reps: "10-12", sets: "3" },
      { name: "Hip thrust", weight: "", reps: "10-12", sets: "3" },
      { name: "Leg curl", weight: "", reps: "12-15", sets: "3" },
      { name: "Hip abduction machine", weight: "", reps: "12-15", sets: "3" },
      { name: "Standing calf raise", weight: "", reps: "15-20", sets: "3" },
      { name: "Stairmaster", weight: "", reps: "15 min", sets: "1" }
    ]
  }
];

const DEFAULT_PLAN = {
  Monday: { focus: "Chest, Arms", exercises: [{ name: "Dumbbell press", weight: "34", reps: "5", sets: "1" }, { name: "Flies", weight: "60", reps: "6", sets: "1" }, { name: "Triceps pulldown", weight: "75", reps: "7", sets: "1" }, { name: "Skull crusher", weight: "32", reps: "8", sets: "1" }, { name: "Wall curls", weight: "20", reps: "5,5,5", sets: "1" }] },
  Tuesday: { focus: "Back, Shoulders, Traps", exercises: [{ name: "Pull ups", weight: "bodyweight", reps: "20", sets: "1" }, { name: "Machine row", weight: "40", reps: "6", sets: "1" }, { name: "Shoulder press / Machine shoulder press", weight: "24 / 55", reps: "5 / 6", sets: "1" }, { name: "Shoulder flies", weight: "14", reps: "6", sets: "1" }, { name: "Trap crunch", weight: "28", reps: "6", sets: "1" }, { name: "Lat pulldown one hand", weight: "65", reps: "6", sets: "1" }] },
  Wednesday: { focus: "Legs (Cardio)", exercises: [{ name: "Leg press", weight: "240", reps: "4", sets: "1" }, { name: "Front raise", weight: "85", reps: "6", sets: "1" }, { name: "Squat", weight: "", reps: "", sets: "1" }, { name: "Hamstring curl", weight: "", reps: "", sets: "1" }, { name: "Calf raise", weight: "", reps: "", sets: "1" }, { name: "Deadlift unassisted", weight: "120", reps: "3", sets: "1" }] },
  Thursday: { focus: "Chest, Arms", exercises: [{ name: "Dumbbell press", weight: "34", reps: "5", sets: "1" }, { name: "Flies", weight: "60", reps: "6", sets: "1" }, { name: "Triceps pulldown", weight: "75", reps: "7", sets: "1" }, { name: "Skull crusher", weight: "32", reps: "8", sets: "1" }, { name: "Wall curls", weight: "20", reps: "5,5,5", sets: "1" }] },
  Friday: { focus: "Rest", exercises: [] },
  Saturday: { focus: "Back, Shoulders, Traps", exercises: [{ name: "Pull ups", weight: "bodyweight", reps: "20", sets: "1" }, { name: "Machine row", weight: "40", reps: "6", sets: "1" }, { name: "Shoulder flies", weight: "14", reps: "6", sets: "1" }, { name: "Trap crunch", weight: "28", reps: "6", sets: "1" }, { name: "Machine press / Shoulder press", weight: "22", reps: "5", sets: "1" }] },
  Sunday: { focus: "Legs (Cardio)", exercises: [{ name: "Leg press", weight: "240", reps: "4", sets: "1" }, { name: "Front raise", weight: "85", reps: "6", sets: "1" }, { name: "Squat", weight: "", reps: "", sets: "1" }, { name: "Hamstring curl", weight: "", reps: "", sets: "1" }, { name: "Calf raise", weight: "", reps: "", sets: "1" }, { name: "Deadlift unassisted", weight: "120", reps: "3", sets: "1" }] }
};

let state = loadState();
let supabaseClient = null;
let cloudPushTimer = null;

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
  editWorkoutSelect: document.getElementById("editWorkoutSelect"),
  editorList: document.getElementById("editorList"),
  rotationWorkoutList: document.getElementById("rotationWorkoutList"),
  weeklyDaySchedule: document.getElementById("weeklyDaySchedule"),
  workoutNamePanel: document.getElementById("workoutNamePanel"),
  workoutNameLabel: document.getElementById("workoutNameLabel"),
  workoutNameInput: document.getElementById("workoutNameInput"),
  saveWorkoutNameBtn: document.getElementById("saveWorkoutNameBtn"),
  todayWorkoutSelect: document.getElementById("todayWorkoutSelect"),
  todayPlanDayLabel: document.getElementById("todayPlanDayLabel"),
  clearTodayWorkoutBtn: document.getElementById("clearTodayWorkoutBtn"),
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
  pages: Array.from(document.querySelectorAll(".page")),
  syncStatus: document.getElementById("syncStatus"),
  syncLoggedOut: document.getElementById("syncLoggedOut"),
  syncLoggedIn: document.getElementById("syncLoggedIn"),
  syncEmail: document.getElementById("syncEmail"),
  syncPassword: document.getElementById("syncPassword"),
  syncLoginBtn: document.getElementById("syncLoginBtn"),
  syncSignupBtn: document.getElementById("syncSignupBtn"),
  syncLogoutBtn: document.getElementById("syncLogoutBtn"),
  syncPullBtn: document.getElementById("syncPullBtn"),
  syncPushBtn: document.getElementById("syncPushBtn"),
  syncUserEmail: document.getElementById("syncUserEmail")
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

function normalizeExercises(exercises) {
  exercises.forEach((exercise) => { if (exercise.sets === undefined || exercise.sets === null) exercise.sets = "1"; });
}

function newWorkoutId() {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isExcludedFromDefaultRotation(workout) {
  return WANDA_PREFAB_IDS.has(workout?.id);
}

function ensureWandasWorkouts(s) {
  WANDAS_PREFAB_WORKOUTS.forEach((prefab) => {
    const existing = s.workoutLibrary.find((w) => w.id === prefab.id
      || w.name === prefab.name
      || w.name.startsWith("Wanda's workouts")
      || w.name.startsWith("Wandaleins"));
    if (existing) {
      existing.id = prefab.id;
      existing.name = prefab.name;
      existing.exercises = deepCopy(prefab.exercises);
      normalizeExercises(existing.exercises);
      return;
    }
    s.workoutLibrary.push({
      id: prefab.id,
      name: prefab.name,
      exercises: deepCopy(prefab.exercises)
    });
  });
}

function defaultWorkoutLibrary() {
  const seen = new Set();
  const library = [];
  WEEK_DAYS.forEach((day) => {
    const routine = DEFAULT_PLAN[day];
    if (!routine || routine.focus === "Rest" || seen.has(routine.focus)) return;
    seen.add(routine.focus);
    library.push({ id: newWorkoutId(), name: routine.focus, exercises: deepCopy(routine.exercises) });
  });
  library.forEach((w) => normalizeExercises(w.exercises));
  return library;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const raw = saved ? safelyParse(saved) : {
    doneByDate: {}, completedByDate: {}, weekRestDayOverrides: {}, dailyWorkoutOverrides: {}
  };
  return migrateState(raw);
}

function safelyParse(raw) { try { return JSON.parse(raw); } catch { return null; } }

function migrateFromTemplates(s) {
  const srcPlan = s.plan || DEFAULT_PLAN;
  const templates = Array.isArray(s.workoutTemplates) && s.workoutTemplates.length
    ? s.workoutTemplates
    : WEEK_DAYS.filter((d) => d !== DEFAULT_REST_DAY).map((d) => deepCopy(srcPlan[d] || { focus: "Workout", exercises: [] }));
  const byName = new Map();
  templates.forEach((template) => {
    const name = template.focus || "Workout";
    if (!byName.has(name)) byName.set(name, { id: newWorkoutId(), name, exercises: deepCopy(template.exercises || []) });
  });
  s.workoutLibrary = [...byName.values()];
  s.rotationWorkoutIds = s.workoutLibrary.filter((w) => !isExcludedFromDefaultRotation(w)).map((w) => w.id);
  s.weeklyDayConfig = {};
  ensureWandasWorkouts(s);
  s.workoutLibrary.forEach((w) => normalizeExercises(w.exercises));
}

function migrateState(parsed) {
  const s = parsed || {};
  s.doneByDate = s.doneByDate || {};
  s.completedByDate = s.completedByDate || {};
  s.weekRestDayOverrides = s.weekRestDayOverrides || {};
  s.dailyWorkoutOverrides = s.dailyWorkoutOverrides || {};
  if (!Array.isArray(s.workoutLibrary) || !s.workoutLibrary.length) migrateFromTemplates(s);
  s.workoutLibrary = (s.workoutLibrary || []).map((w) => ({
    id: w.id || newWorkoutId(),
    name: w.name || w.focus || "Workout",
    exercises: Array.isArray(w.exercises) ? w.exercises : []
  }));
  s.workoutLibrary.forEach((w) => normalizeExercises(w.exercises));
  ensureWandasWorkouts(s);
  s.rotationWorkoutIds = (s.rotationWorkoutIds || [])
    .filter((id) => {
      const w = s.workoutLibrary.find((x) => x.id === id);
      return w && !isExcludedFromDefaultRotation(w);
    });
  if (!s.rotationWorkoutIds.length) {
    s.rotationWorkoutIds = s.workoutLibrary.filter((w) => !isExcludedFromDefaultRotation(w)).map((w) => w.id);
  }
  s.weeklyDayConfig = s.weeklyDayConfig || {};
  Object.keys(s.dailyWorkoutOverrides || {}).forEach((key) => {
    const val = s.dailyWorkoutOverrides[key];
    if (val === "Rest") return;
    const byId = s.workoutLibrary.find((w) => w.id === val);
    if (byId) return;
    const byName = s.workoutLibrary.find((w) => w.name === val);
    if (byName) s.dailyWorkoutOverrides[key] = byName.id;
  });
  if (WEEK_DAYS.includes(s.restDay) && s.restDay !== DEFAULT_REST_DAY) s.weekRestDayOverrides[weekKey(new Date())] = s.restDay;
  delete s.plan;
  delete s.restDay;
  delete s.workoutTemplates;
  return s;
}

function saveState(skipCloud) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!skipCloud) scheduleCloudPush();
}

function getStatePayload() {
  return {
    doneByDate: state.doneByDate,
    completedByDate: state.completedByDate,
    weekRestDayOverrides: state.weekRestDayOverrides,
    dailyWorkoutOverrides: state.dailyWorkoutOverrides,
    workoutLibrary: state.workoutLibrary,
    rotationWorkoutIds: state.rotationWorkoutIds,
    weeklyDayConfig: state.weeklyDayConfig
  };
}

function applyStatePayload(payload) {
  const migrated = migrateState(deepCopy(payload));
  state.doneByDate = migrated.doneByDate;
  state.completedByDate = migrated.completedByDate;
  state.weekRestDayOverrides = migrated.weekRestDayOverrides;
  state.dailyWorkoutOverrides = migrated.dailyWorkoutOverrides;
  state.workoutLibrary = migrated.workoutLibrary;
  state.rotationWorkoutIds = migrated.rotationWorkoutIds;
  state.weeklyDayConfig = migrated.weeklyDayConfig;
  saveState(true);
}

function isSyncConfigured() {
  const url = window.GYM_SUPABASE_URL || "";
  const key = window.GYM_SUPABASE_ANON_KEY || "";
  return url.startsWith("https://") && key.length > 20 && !key.includes("PASTE_YOUR");
}

function initSupabase() {
  if (!isSyncConfigured() || !window.supabase) {
    setSyncStatus("Add your anon key in config.js to enable sync.");
    return;
  }
  supabaseClient = window.supabase.createClient(window.GYM_SUPABASE_URL, window.GYM_SUPABASE_ANON_KEY);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateSyncUI(session);
    if (session) handlePostLoginSync();
  });
  supabaseClient.auth.getSession().then(({ data }) => updateSyncUI(data.session));
}

function setSyncStatus(message) {
  if (ui.syncStatus) ui.syncStatus.textContent = message;
}

function updateSyncUI(session) {
  if (!session) {
    ui.syncLoggedOut.classList.remove("hidden");
    ui.syncLoggedIn.classList.add("hidden");
    setSyncStatus("Log in to sync across devices.");
    return;
  }
  ui.syncLoggedOut.classList.add("hidden");
  ui.syncLoggedIn.classList.remove("hidden");
  ui.syncUserEmail.textContent = `Logged in as ${session.user.email}`;
  setSyncStatus("Connected — changes auto-save to cloud.");
}

async function handlePostLoginSync() {
  const cloud = await fetchCloudState();
  const localHasData = Object.keys(state.doneByDate || {}).length > 0
    || Object.keys(state.completedByDate || {}).length > 0;
  if (cloud) {
    applyStatePayload(cloud);
    setSyncStatus("Loaded your data from the cloud.");
    renderAll();
  } else if (localHasData) {
    await pushToCloud();
    setSyncStatus("Your local data was saved to the cloud.");
  }
}

async function fetchCloudState() {
  if (!supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabaseClient
    .from("gym_profiles")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data || !data.data) return null;
  return data.data;
}

async function pushToCloud() {
  if (!supabaseClient) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  const { error } = await supabaseClient.from("gym_profiles").upsert(
    {
      user_id: user.id,
      data: getStatePayload(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );
  if (error) {
    setSyncStatus(`Cloud save failed: ${error.message}`);
    return;
  }
  setSyncStatus("Saved to cloud.");
}

function scheduleCloudPush() {
  if (!supabaseClient) return;
  clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(() => pushToCloud(), 800);
}

async function syncLogin() {
  if (!supabaseClient) return;
  const email = ui.syncEmail.value.trim();
  const password = ui.syncPassword.value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) setSyncStatus(error.message);
  else ui.syncPassword.value = "";
}

async function syncSignup() {
  if (!supabaseClient) return;
  const email = ui.syncEmail.value.trim();
  const password = ui.syncPassword.value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) setSyncStatus(error.message);
  else setSyncStatus("Account created. Check email if confirmation is required, then log in.");
}

async function syncLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  setSyncStatus("Logged out. This device keeps local data only.");
}

async function syncPull() {
  const cloud = await fetchCloudState();
  if (!cloud) {
    setSyncStatus("No cloud data found for this account.");
    return;
  }
  applyStatePayload(cloud);
  setSyncStatus("Loaded from cloud.");
  renderAll();
}
function getRestDayForWeek(date) { return state.weekRestDayOverrides[weekKey(date)] || DEFAULT_REST_DAY; }

function getWorkoutById(id) {
  return state.workoutLibrary.find((w) => w.id === id) || null;
}

function getWorkoutByName(name) {
  return state.workoutLibrary.find((w) => w.name === name) || null;
}

function routineFromWorkout(workout) {
  if (!workout) return { focus: "Rest", exercises: [], workoutId: null };
  return { focus: workout.name, exercises: deepCopy(workout.exercises), workoutId: workout.id };
}

function getRotationPool() {
  return state.rotationWorkoutIds
    .map((id) => getWorkoutById(id))
    .filter(Boolean);
}

function getDayScheduleValue(dayName) {
  const cfg = state.weeklyDayConfig[dayName];
  if (!cfg || !cfg.mode) return SCHEDULE_ROTATE;
  return cfg.mode;
}

function buildWeekAssignments(date) {
  const restDay = getRestDayForWeek(date);
  const pool = getRotationPool();
  let rotateIndex = 0;
  const plan = {};
  WEEK_DAYS.forEach((day) => {
    if (day === restDay) {
      plan[day] = { focus: "Rest", exercises: [], workoutId: null };
      return;
    }
    const mode = getDayScheduleValue(day);
    if (mode === SCHEDULE_REST) {
      plan[day] = { focus: "Rest", exercises: [], workoutId: null };
      return;
    }
    if (mode === "workout") {
      const workout = getWorkoutById(state.weeklyDayConfig[day].workoutId);
      plan[day] = routineFromWorkout(workout);
      return;
    }
    const workout = pool[rotateIndex % Math.max(pool.length, 1)];
    rotateIndex += 1;
    plan[day] = routineFromWorkout(workout);
  });
  return plan;
}

function getRoutineForDate(date) {
  const key = formatDateKey(date);
  const override = state.dailyWorkoutOverrides[key];
  if (override) {
    if (override === "Rest") return { focus: "Rest", exercises: [], workoutId: null };
    const workout = getWorkoutById(override) || getWorkoutByName(override);
    if (workout) return routineFromWorkout(workout);
  }
  return buildWeekAssignments(date)[dayNameFromDate(date)];
}

function getDateForDayInCurrentWeek(dayName) {
  const base = startOfWeek(new Date());
  const out = new Date(base);
  out.setDate(base.getDate() + Math.max(WEEK_DAYS.indexOf(dayName), 0));
  return out;
}

function workoutOptions() {
  return state.workoutLibrary.map((w) => ({ id: w.id, name: w.name }));
}

function createWorkout(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const workout = { id: newWorkoutId(), name: trimmed, exercises: [] };
  state.workoutLibrary.push(workout);
  state.rotationWorkoutIds.push(workout.id);
  saveState();
  return workout;
}

function renameWorkout(workoutId, name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const workout = getWorkoutById(workoutId);
  if (!workout) return false;
  workout.name = trimmed;
  saveState();
  return true;
}

function syncWorkoutNamePanel() {
  const val = ui.addWorkoutSelect.value;
  if (!val) {
    ui.workoutNamePanel.classList.add("hidden");
    return;
  }
  const isCreate = val === CREATE_WORKOUT_VALUE;
  const workout = isCreate ? null : getWorkoutById(val);
  if (!isCreate && !workout) {
    ui.workoutNamePanel.classList.add("hidden");
    return;
  }
  ui.workoutNamePanel.classList.remove("hidden");
  ui.workoutNameLabel.textContent = isCreate ? "New workout name" : "Workout name";
  ui.saveWorkoutNameBtn.textContent = isCreate ? "Create workout" : "Save name";
  if (document.activeElement !== ui.workoutNameInput) {
    ui.workoutNameInput.value = isCreate ? "" : workout.name;
  }
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

function fillWorkoutSelect(select, { includeRest, includeCreateNew }) {
  const prev = select.value;
  select.innerHTML = "";
  if (includeRest) {
    const restOption = document.createElement("option");
    restOption.value = "Rest";
    restOption.textContent = "Rest";
    select.appendChild(restOption);
  }
  workoutOptions().forEach(({ id, name }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    select.appendChild(option);
  });
  if (includeCreateNew) {
    const createOption = document.createElement("option");
    createOption.value = CREATE_WORKOUT_VALUE;
    createOption.textContent = "+ Create new workout…";
    select.appendChild(createOption);
  }
  if (prev && [...select.options].some((o) => o.value === prev)) select.value = prev;
}

function appendRotationRow(container, workout) {
  const row = document.createElement("div");
  row.className = "rotation-item";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.rotationWorkoutIds.includes(workout.id);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      if (!state.rotationWorkoutIds.includes(workout.id)) state.rotationWorkoutIds.push(workout.id);
    } else {
      state.rotationWorkoutIds = state.rotationWorkoutIds.filter((id) => id !== workout.id);
    }
    saveState();
    renderWeeklySchedule();
    renderHomeAndWorkout();
    renderUpcoming();
    renderSpecificDayOverride();
    renderTodayWorkoutPicker();
  });
  const label = document.createElement("label");
  label.textContent = `${workout.name} (${workout.exercises.length} exercises)`;
  row.appendChild(checkbox);
  row.appendChild(label);
  container.appendChild(row);
}

function renderRotationList() {
  ui.rotationWorkoutList.innerHTML = "";
  if (!state.workoutLibrary.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No workouts yet. Create one below when adding an exercise.";
    ui.rotationWorkoutList.appendChild(p);
    return;
  }
  const heading = document.createElement("p");
  heading.className = "muted";
  heading.textContent = "Check which workouts rotate through your week.";
  ui.rotationWorkoutList.appendChild(heading);
  state.workoutLibrary.forEach((workout) => appendRotationRow(ui.rotationWorkoutList, workout));
}

function scheduleSelectValue(dayName) {
  const cfg = state.weeklyDayConfig[dayName];
  if (!cfg || !cfg.mode || cfg.mode === SCHEDULE_ROTATE) return SCHEDULE_ROTATE;
  if (cfg.mode === SCHEDULE_REST) return SCHEDULE_REST;
  if (cfg.mode === "workout" && cfg.workoutId) return `workout:${cfg.workoutId}`;
  return SCHEDULE_ROTATE;
}

function dayAssignmentLabel(dayName, weekPlan) {
  const routine = weekPlan[dayName];
  const mode = getDayScheduleValue(dayName);
  const restDay = getRestDayForWeek(new Date());
  if (dayName === restDay && mode === SCHEDULE_ROTATE) {
    return "Rest (weekly rest day)";
  }
  if (!routine || routine.focus === "Rest") return "Rest";
  if (mode === SCHEDULE_ROTATE) return `Auto → ${routine.focus}`;
  if (mode === "workout") return `Fixed → ${routine.focus}`;
  return routine.focus;
}

function renderWeeklySchedule() {
  ui.weeklyDaySchedule.innerHTML = "";
  const pool = getRotationPool();
  const rotateLabel = pool.map((w) => w.name).join(" → ") || "(none — check workouts above)";
  const weekPlan = buildWeekAssignments(new Date());
  const hint = document.createElement("p");
  hint.className = "muted";
  hint.textContent = `Rotation pool (auto days only): ${rotateLabel}. Fixed and rest days do not advance the rotation.`;
  ui.weeklyDaySchedule.appendChild(hint);
  WEEK_DAYS.forEach((day) => {
    const row = document.createElement("div");
    row.className = "schedule-row";
    const dayLabel = document.createElement("span");
    dayLabel.className = "day-label";
    dayLabel.textContent = day;
    const col = document.createElement("div");
    col.className = "schedule-day-col";
    const select = document.createElement("select");
    const auto = document.createElement("option");
    auto.value = SCHEDULE_ROTATE;
    auto.textContent = "Auto (rotation)";
    select.appendChild(auto);
    const rest = document.createElement("option");
    rest.value = SCHEDULE_REST;
    rest.textContent = "Rest";
    select.appendChild(rest);
    workoutOptions().forEach(({ id, name }) => {
      const option = document.createElement("option");
      option.value = `workout:${id}`;
      option.textContent = `Fixed: ${name}`;
      select.appendChild(option);
    });
    select.value = scheduleSelectValue(day);
    const assignmentEl = document.createElement("span");
    assignmentEl.className = "day-assignment";
    assignmentEl.textContent = dayAssignmentLabel(day, weekPlan);
    select.addEventListener("change", () => {
      const val = select.value;
      if (val === SCHEDULE_ROTATE) delete state.weeklyDayConfig[day];
      else if (val === SCHEDULE_REST) state.weeklyDayConfig[day] = { mode: SCHEDULE_REST };
      else if (val.startsWith("workout:")) state.weeklyDayConfig[day] = { mode: "workout", workoutId: val.slice(8) };
      saveState();
      renderWeeklySchedule();
      renderEditor();
      renderHomeAndWorkout();
      renderUpcoming();
      renderSpecificDayOverride();
      renderTodayWorkoutPicker();
    });
    col.appendChild(select);
    col.appendChild(assignmentEl);
    row.appendChild(dayLabel);
    row.appendChild(col);
    ui.weeklyDaySchedule.appendChild(row);
  });
}

function renderPlanPage() {
  ui.daySelect.innerHTML = "";
  ui.restDaySelect.innerHTML = "";
  ui.editWorkoutSelect.innerHTML = "";
  WEEK_DAYS.forEach((day) => {
    const a = document.createElement("option");
    a.value = day;
    a.textContent = day;
    ui.daySelect.appendChild(a);
    const b = document.createElement("option");
    b.value = day;
    b.textContent = day;
    ui.restDaySelect.appendChild(b);
  });
  workoutOptions().forEach(({ id, name }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    ui.editWorkoutSelect.appendChild(option);
  });
  fillWorkoutSelect(ui.addWorkoutSelect, { includeRest: false, includeCreateNew: true });
  ui.restDaySelect.value = getRestDayForWeek(new Date());
  if (!ui.daySelect.value) ui.daySelect.value = dayNameFromDate(new Date());
  renderRotationList();
  renderWeeklySchedule();
  if (!ui.editWorkoutSelect.value && state.workoutLibrary[0]) ui.editWorkoutSelect.value = state.workoutLibrary[0].id;
  syncWorkoutNamePanel();
  renderEditor();
}

function updateEditorField(workoutId, exerciseIndex, field, value) {
  const workout = getWorkoutById(workoutId);
  if (!workout) return;
  workout.exercises[exerciseIndex][field] = value;
  saveState();
  const todayRoutine = getRoutineForDate(new Date());
  if (todayRoutine.workoutId === workoutId) renderHomeAndWorkout();
}

function bindEditorInput(input, workoutId, exerciseIndex, field) {
  const apply = () => updateEditorField(workoutId, exerciseIndex, field, input.value.trim());
  input.addEventListener("input", apply);
  input.addEventListener("change", apply);
  input.addEventListener("blur", apply);
}

function renderEditor() {
  const previewDay = ui.daySelect.value || dayNameFromDate(new Date());
  const previewRoutine = getRoutineForDate(getDateForDayInCurrentWeek(previewDay));
  let workoutId = ui.editWorkoutSelect.value;
  if (!workoutId && previewRoutine.workoutId) workoutId = previewRoutine.workoutId;
  const workout = getWorkoutById(workoutId);
  ui.daySelectLabel.textContent = workout
    ? `Editing: ${workout.name}`
    : "Workout to edit";
  const previewNote = document.createElement("p");
  previewNote.className = "muted";
  previewNote.textContent = `${previewDay} on your schedule: ${previewRoutine.focus}`;
  ui.editorList.innerHTML = "";
  ui.editorList.appendChild(previewNote);
  if (!workout) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Select or create a workout to edit exercises.";
    ui.editorList.appendChild(p);
    return;
  }
  if (!workout.exercises.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No exercises yet. Add one in the form below.";
    ui.editorList.appendChild(p);
    return;
  }
  workout.exercises.forEach((exercise, index) => {
    const node = ui.editorTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".exercise-name").textContent = exercise.name;
    const weightInput = node.querySelector(".weight-input");
    const repsInput = node.querySelector(".reps-input");
    const setsInput = node.querySelector(".sets-input");
    weightInput.value = exercise.weight;
    repsInput.value = exercise.reps;
    setsInput.value = exercise.sets || "1";
    bindEditorInput(weightInput, workout.id, index, "weight");
    bindEditorInput(repsInput, workout.id, index, "reps");
    bindEditorInput(setsInput, workout.id, index, "sets");
    ui.editorList.appendChild(node);
  });
}

function renderSpecificDayOverride() {
  const now = new Date();
  if (!ui.specificDateInput.value) ui.specificDateInput.value = dateKey();
  fillWorkoutSelect(ui.specificWorkoutSelect, { includeRest: true, includeCreateNew: false });
  const targetDate = new Date(ui.specificDateInput.value || now);
  const targetKey = formatDateKey(targetDate);
  const override = state.dailyWorkoutOverrides[targetKey];
  if (override) {
    const resolved = override === "Rest" ? "Rest" : (getWorkoutById(override)?.id || override);
    if ([...ui.specificWorkoutSelect.options].some((o) => o.value === resolved)) {
      ui.specificWorkoutSelect.value = resolved;
    }
  }
  const routine = getRoutineForDate(targetDate);
  ui.specificDateSummary.textContent = `${targetKey} is set to: ${routine.focus}`;
}

function renderTodayWorkoutPicker() {
  if (!ui.todayWorkoutSelect) return;
  const dayName = dayNameFromDate(new Date());
  if (ui.todayPlanDayLabel) ui.todayPlanDayLabel.textContent = dayName;
  fillWorkoutSelect(ui.todayWorkoutSelect, { includeRest: true, includeCreateNew: false });
  const planned = getWeekdayPlanValue(dayName);
  const routine = getRoutineForDate(new Date());
  const value = planned || routine.workoutId || (routine.focus === "Rest" ? "Rest" : null);
  if (value && [...ui.todayWorkoutSelect.options].some((o) => o.value === value)) {
    ui.todayWorkoutSelect.value = value;
  }
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
function handleAddWorkoutSelectChange() {
  syncWorkoutNamePanel();
}

function handleSaveWorkoutName() {
  const name = ui.workoutNameInput.value;
  if (ui.addWorkoutSelect.value === CREATE_WORKOUT_VALUE) {
    const workout = createWorkout(name);
    if (!workout) return;
    ui.addWorkoutSelect.value = workout.id;
    ui.editWorkoutSelect.value = workout.id;
    syncWorkoutNamePanel();
    renderAll();
    return;
  }
  if (!renameWorkout(ui.addWorkoutSelect.value, name)) return;
  ui.editWorkoutSelect.value = ui.addWorkoutSelect.value;
  renderAll();
}

function handleAddExercise(event) {
  event.preventDefault();
  let workoutId = ui.addWorkoutSelect.value;
  if (workoutId === CREATE_WORKOUT_VALUE) {
    const workout = createWorkout(ui.workoutNameInput.value);
    if (!workout) return;
    workoutId = workout.id;
    ui.addWorkoutSelect.value = workoutId;
  }
  const workout = getWorkoutById(workoutId);
  const payload = {
    name: ui.exerciseNameInput.value.trim(),
    weight: ui.exerciseWeightInput.value.trim(),
    reps: ui.exerciseRepsInput.value.trim(),
    sets: ui.exerciseSetsInput.value.trim() || "1"
  };
  if (!workout) return;
  const nameFromPanel = ui.workoutNameInput.value.trim();
  if (nameFromPanel && nameFromPanel !== workout.name) workout.name = nameFromPanel;
  if (!payload.name) {
    if (nameFromPanel) saveState();
    renderAll();
    return;
  }
  workout.exercises.push(payload);
  saveState();
  ui.exerciseNameInput.value = "";
  ui.exerciseWeightInput.value = "";
  ui.exerciseRepsInput.value = "";
  ui.exerciseSetsInput.value = "";
  ui.addWorkoutSelect.value = workoutId;
  renderAll();
}

function setWeekdayPlan(dayName, val) {
  if (val === "Rest") state.weeklyDayConfig[dayName] = { mode: SCHEDULE_REST };
  else state.weeklyDayConfig[dayName] = { mode: "workout", workoutId: val };
}

function getWeekdayPlanValue(dayName) {
  const cfg = state.weeklyDayConfig[dayName];
  if (!cfg || !cfg.mode || cfg.mode === SCHEDULE_ROTATE) return null;
  if (cfg.mode === SCHEDULE_REST) return "Rest";
  if (cfg.mode === "workout" && cfg.workoutId) return cfg.workoutId;
  return null;
}

function applyTodayWorkout() {
  const val = ui.todayWorkoutSelect.value;
  if (!val) return;
  const dayName = dayNameFromDate(new Date());
  delete state.dailyWorkoutOverrides[dateKey()];
  setWeekdayPlan(dayName, val);
  saveState();
  renderAll();
}

function clearTodayWorkout() {
  const dayName = dayNameFromDate(new Date());
  delete state.dailyWorkoutOverrides[dateKey()];
  delete state.weeklyDayConfig[dayName];
  saveState();
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
  renderTodayWorkoutPicker();
  renderCalendarAndStats();
}

function setup() {
  ui.pastDateInput.max = dateKey();
  ui.pastDateInput.value = dateKey();
  ui.specificDateInput.value = dateKey();
  renderNav();
  initSupabase();
  ui.syncLoginBtn.addEventListener("click", syncLogin);
  ui.syncSignupBtn.addEventListener("click", syncSignup);
  ui.syncLogoutBtn.addEventListener("click", syncLogout);
  ui.syncPullBtn.addEventListener("click", syncPull);
  ui.syncPushBtn.addEventListener("click", pushToCloud);
  ui.completeWorkoutBtn.addEventListener("click", completeTodayWorkout);
  ui.resetTodayBtn.addEventListener("click", resetTodayProgress);
  ui.markPastDoneBtn.addEventListener("click", markPastDone);
  ui.unmarkPastDoneBtn.addEventListener("click", unmarkPastDone);
  ui.restDaySelect.addEventListener("change", handleRestDayChange);
  ui.daySelect.addEventListener("change", renderEditor);
  ui.editWorkoutSelect.addEventListener("change", renderEditor);
  ui.addWorkoutSelect.addEventListener("change", handleAddWorkoutSelectChange);
  ui.saveWorkoutNameBtn.addEventListener("click", handleSaveWorkoutName);
  ui.addExerciseForm.addEventListener("submit", handleAddExercise);
  ui.todayWorkoutSelect.addEventListener("change", applyTodayWorkout);
  ui.clearTodayWorkoutBtn.addEventListener("click", clearTodayWorkout);
  ui.toggleUpcomingPreviewBtn.addEventListener("click", () => { upcomingPreviewVisible = !upcomingPreviewVisible; renderUpcoming(); });
  ui.applyDayWorkoutBtn.addEventListener("click", applySpecificDayWorkout);
  ui.clearDayWorkoutBtn.addEventListener("click", clearSpecificDayWorkout);
  ui.specificDateInput.addEventListener("change", renderSpecificDayOverride);
  renderAll();
}

setup();
