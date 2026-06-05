const STORAGE_KEY = "gym_split_tracker_v1";
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_REST_DAY = "Friday";
const CREATE_WORKOUT_VALUE = "__create_new__";
const SCHEDULE_ROTATE = "rotate";
const SCHEDULE_REST = "rest";
const WANDA_PREFAB_IDS = new Set(["wanda_legs_glutes_v1"]);

const THEME_OPTIONS = [
  { id: "orange", label: "Orange", swatches: ["#EA580C", "#C2410C", "#FFF7ED"] },
  { id: "blue", label: "Blue", swatches: ["#2563EB", "#0284C7", "#EFF6FF"] },
  { id: "red", label: "Red", swatches: ["#DC2626", "#B91C1C", "#FFF5F5"] },
  { id: "purple", label: "Purple", swatches: ["#7C3AED", "#6D28D9", "#F5F3FF"] },
  { id: "green", label: "Green", swatches: ["#16A34A", "#059669", "#F0FDF4"] },
  { id: "mustard", label: "Mustard", swatches: ["#CA8A04", "#A16207", "#FEFCE8"] },
  { id: "pink", label: "Pink", swatches: ["#DB2777", "#BE185D", "#FDF2F8"] }
];

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
      { name: "Stairmaster", weight: "", reps: "15", sets: "1", kind: "cardio" }
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

function isMobileDevice() {
  return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

let state = loadState();
applyUserTheme();
let supabaseClient = null;
let cloudPushTimer = null;
let liquidEtherInstance = null;
let liquidEtherFailed = false;
let authSession = null;

const LIQUID_THEME_COLORS = {
  orange: ["#F97316", "#FB923C", "#FDBA74"],
  blue: ["#3B82F6", "#60A5FA", "#93C5FD"],
  red: ["#EF4444", "#F87171", "#FCA5A5"],
  purple: ["#A78BFA", "#8B5CF6", "#C4B5FD"],
  green: ["#22C55E", "#4ADE80", "#86EFAC"],
  mustard: ["#EAB308", "#FACC15", "#FDE047"],
  pink: ["#F472B6", "#EC4899", "#F9A8D4"]
};

function isLightMode() {
  return !document.documentElement.classList.contains("dark");
}

function getThemeLiquidColors() {
  const theme = state.userSettings?.colorTheme || "purple";
  return LIQUID_THEME_COLORS[theme] || LIQUID_THEME_COLORS.purple;
}

function getLiquidEtherOptions() {
  const mobile = isMobileDevice();
  const light = isLightMode();
  return {
    colors: getThemeLiquidColors(),
    resolution: mobile ? 0.28 : 0.45,
    iterationsPoisson: mobile ? 10 : 24,
    iterationsViscous: mobile ? 10 : 24,
    mouseForce: mobile ? 10 : light ? 14 : 15,
    cursorSize: mobile ? 72 : light ? 88 : 95,
    autoDemo: true,
    autoSpeed: light ? 0.26 : 0.32,
    autoIntensity: light ? 1.0 : 1.3
  };
}

function initLiquidBackground() {
  const mount = document.getElementById("liquidEtherBg");
  const enabled = Boolean(state.userSettings?.liquidBackground);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (liquidEtherInstance) {
    liquidEtherInstance.dispose();
    liquidEtherInstance = null;
  }
  liquidEtherFailed = false;

  document.body.classList.remove("liquid-bg-active", "liquid-bg-fallback");
  if (!mount) return;

  if (!enabled || reducedMotion) {
    mount.classList.add("hidden");
    updateLiquidBackgroundHint(reducedMotion);
    return;
  }

  if (typeof createLiquidEther !== "function" || typeof THREE === "undefined") {
    mount.classList.add("hidden");
    liquidEtherFailed = true;
    document.body.classList.add("liquid-bg-fallback");
    updateLiquidBackgroundHint(reducedMotion);
    return;
  }

  mount.classList.remove("hidden");
  liquidEtherInstance = createLiquidEther(mount, getLiquidEtherOptions());
  if (liquidEtherInstance.failed) {
    liquidEtherInstance.dispose();
    liquidEtherInstance = null;
    liquidEtherFailed = true;
    mount.classList.add("hidden");
    document.body.classList.add("liquid-bg-fallback");
    updateLiquidBackgroundHint(reducedMotion);
    return;
  }
  document.body.classList.add("liquid-bg-active");
  updateLiquidBackgroundHint(reducedMotion);
}

function updateLiquidBackgroundHint(reducedMotion) {
  if (!ui.liquidBackgroundHint) return;
  if (reducedMotion) {
    ui.liquidBackgroundHint.textContent = "Animated background is off because reduced motion is enabled in your system settings.";
    ui.liquidBackgroundHint.classList.remove("hidden");
    return;
  }
  if (liquidEtherFailed && state.userSettings?.liquidBackground) {
    ui.liquidBackgroundHint.textContent = "WebGL fluid unavailable — using animated gradient instead.";
    ui.liquidBackgroundHint.classList.remove("hidden");
    return;
  }
  if (isMobileDevice()) {
    ui.liquidBackgroundHint.textContent = "Uses WebGL — off by default on phones for performance. Turn on above to try it.";
    ui.liquidBackgroundHint.classList.remove("hidden");
    return;
  }
  ui.liquidBackgroundHint.textContent = "Subtle fluid animation behind the app. Uses WebGL.";
  ui.liquidBackgroundHint.classList.add("hidden");
}

function setLiquidBackground(enabled) {
  state.userSettings = state.userSettings || { colorTheme: "purple", darkMode: true };
  state.userSettings.liquidBackground = enabled;
  saveState();
  initLiquidBackground();
  if (ui.liquidBackgroundToggle) ui.liquidBackgroundToggle.checked = enabled;
}

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
  syncUserEmail: document.getElementById("syncUserEmail"),
  offlineIndicator: document.getElementById("offlineIndicator"),
  dailyCardioCounter: document.getElementById("dailyCardioCounter"),
  workoutHistoryBlock: document.getElementById("workoutHistoryBlock"),
  workoutHistoryTitle: document.getElementById("workoutHistoryTitle"),
  workoutHistoryList: document.getElementById("workoutHistoryList"),
  copyHistoryWeightsBtn: document.getElementById("copyHistoryWeightsBtn"),
  deleteWorkoutBtn: document.getElementById("deleteWorkoutBtn"),
  exerciseKindInput: document.getElementById("exerciseKindInput"),
  exerciseNoteInput: document.getElementById("exerciseNoteInput"),
  cloudConfirmDialog: document.getElementById("cloudConfirmDialog"),
  cloudConfirmMessage: document.getElementById("cloudConfirmMessage"),
  cloudConfirmUseCloud: document.getElementById("cloudConfirmUseCloud"),
  cloudConfirmKeepPhone: document.getElementById("cloudConfirmKeepPhone"),
  showPrsOnlyBtn: document.getElementById("showPrsOnlyBtn"),
  expandAllExercisesBtn: document.getElementById("expandAllExercisesBtn"),
  collapseAllExercisesBtn: document.getElementById("collapseAllExercisesBtn"),
  recordsTodaySummary: document.getElementById("recordsTodaySummary"),
  recordsTodayList: document.getElementById("recordsTodayList"),
  recordsAllSummary: document.getElementById("recordsAllSummary"),
  recordsAllList: document.getElementById("recordsAllList"),
  recordsOneRmSummary: document.getElementById("recordsOneRmSummary"),
  recordsOneRmList: document.getElementById("recordsOneRmList"),
  profileAvatarInitials: document.getElementById("profileAvatarInitials"),
  profileEmailLine: document.getElementById("profileEmailLine"),
  profileSummaryLine: document.getElementById("profileSummaryLine"),
  profileDisplayName: document.getElementById("profileDisplayName"),
  profileHeight: document.getElementById("profileHeight"),
  profileBodyWeight: document.getElementById("profileBodyWeight"),
  profileAge: document.getElementById("profileAge"),
  saveProfileBtn: document.getElementById("saveProfileBtn"),
  darkModeToggle: document.getElementById("darkModeToggle"),
  liquidBackgroundToggle: document.getElementById("liquidBackgroundToggle"),
  liquidBackgroundHint: document.getElementById("liquidBackgroundHint"),
  themeSwatches: document.getElementById("themeSwatches")
};
let upcomingPreviewVisible = false;
let showPrsOnly = false;
let exercisesExpanded = false;
let restTimerInterval = null;
let restTimerEndsAt = 0;
let cloudPullPending = null;
let syncPending = false;

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }
function formatDateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateKey() { return formatDateKey(new Date()); }
function parseDateInputValue(value) {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function dayNameFromDate(date) { return date.toLocaleDateString("en-US", { weekday: "long" }); }
function shortWeekdayName(date) { return date.toLocaleDateString("en-US", { weekday: "short" }); }
function parseFirstNumber(value) { const m = String(value || "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : 0; }
function startOfWeek(date) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
function weekKey(date) { return formatDateKey(startOfWeek(date)); }

function isCardioExercise(exercise) {
  if (!exercise) return false;
  if (exercise.kind === "cardio") return true;
  const name = (exercise.name || "").toLowerCase();
  if (/stairmaster|treadmill|elliptical|rowing|bike|cardio|walk/.test(name)) return true;
  return /\bmin\b/i.test(String(exercise.reps || ""));
}

function normalizeExercise(exercise) {
  if (exercise.sets === undefined || exercise.sets === null) exercise.sets = "1";
  if (isCardioExercise(exercise)) exercise.kind = "cardio";
  else if (!exercise.kind) exercise.kind = "weights";
  if (exercise.note === undefined) exercise.note = "";
  if (exercise.warmupWeight === undefined) exercise.warmupWeight = "";
  if (exercise.warmupReps === undefined) exercise.warmupReps = "";
  if (exercise.warmupSets === undefined) exercise.warmupSets = "";
  if (exercise.oneRm === undefined) exercise.oneRm = "";
}

function normalizeExercises(exercises) {
  exercises.forEach(normalizeExercise);
}

function exerciseVolume(exercise) {
  if (isCardioExercise(exercise)) return 0;
  return parseFirstNumber(exercise.weight) * parseFirstNumber(exercise.reps) * (parseFirstNumber(exercise.sets || "1") || 1);
}

function parseCardioMinutes(exercise) {
  const fromReps = parseFirstNumber(String(exercise.reps || "").replace(/min/gi, ""));
  if (fromReps > 0) return fromReps;
  return parseFirstNumber(exercise.weight);
}

function formatExerciseInfo(exercise) {
  if (isCardioExercise(exercise)) {
    const mins = parseCardioMinutes(exercise);
    const level = exercise.weight ? ` · level ${exercise.weight}` : "";
    return mins ? `${mins} min${level}` : "Duration not set";
  }
  const weight = exercise.weight ? `${exercise.weight} kg` : "Weight not set";
  const reps = exercise.reps ? `${exercise.reps} reps` : "Reps not set";
  const sets = exercise.sets ? `${exercise.sets} sets` : "Sets not set";
  return `${weight} x ${reps} x ${sets}`;
}

function formatWarmupLine(exercise) {
  if (!exercise.warmupWeight && !exercise.warmupReps) return "";
  const w = exercise.warmupWeight ? `${exercise.warmupWeight} kg` : "";
  const r = exercise.warmupReps ? `${exercise.warmupReps} reps` : "";
  const s = exercise.warmupSets ? `${exercise.warmupSets} sets` : "";
  return `Warm-up: ${[w, r, s].filter(Boolean).join(" x ")}`;
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
  if (s.weeklyDayConfig[DEFAULT_REST_DAY]?.mode === SCHEDULE_REST) {
    delete s.weeklyDayConfig[DEFAULT_REST_DAY];
  }
  s.workoutSessions = Array.isArray(s.workoutSessions) ? s.workoutSessions : [];
  s.personalBests = s.personalBests || {};
  s.userProfile = {
    displayName: s.userProfile?.displayName || "",
    heightCm: s.userProfile?.heightCm || "",
    bodyWeightKg: s.userProfile?.bodyWeightKg || "",
    age: s.userProfile?.age || ""
  };
  const defaultLiquidBg = !isMobileDevice();
  s.userSettings = {
    colorTheme: THEME_OPTIONS.some((t) => t.id === s.userSettings?.colorTheme) ? s.userSettings.colorTheme : "purple",
    darkMode: s.userSettings?.darkMode !== undefined ? Boolean(s.userSettings.darkMode) : true,
    liquidBackground: s.userSettings?.liquidBackground !== undefined ? Boolean(s.userSettings.liquidBackground) : defaultLiquidBg
  };
  s.workoutLibrary.forEach((w) => w.exercises.forEach(normalizeExercise));
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
  updateOfflineIndicator();
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
    weeklyDayConfig: state.weeklyDayConfig,
    workoutSessions: state.workoutSessions,
    personalBests: state.personalBests,
    userProfile: state.userProfile,
    userSettings: state.userSettings
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
  state.workoutSessions = migrated.workoutSessions;
  state.personalBests = migrated.personalBests;
  state.userProfile = migrated.userProfile;
  state.userSettings = migrated.userSettings;
  applyUserTheme();
  saveState(true);
}

function applyUserTheme() {
  const settings = state.userSettings || { colorTheme: "purple", darkMode: true };
  const theme = settings.colorTheme || "purple";
  const root = document.documentElement;
  root.classList.toggle("dark", Boolean(settings.darkMode));
  if (theme === "orange") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

function setColorTheme(themeId) {
  state.userSettings = state.userSettings || { colorTheme: "purple", darkMode: true };
  state.userSettings.colorTheme = themeId;
  applyUserTheme();
  saveState();
  renderThemeSwatches();
  if (liquidEtherInstance) liquidEtherInstance.setColors(getThemeLiquidColors());
  if (state.userSettings?.liquidBackground) initLiquidBackground();
}

function setDarkMode(enabled) {
  state.userSettings = state.userSettings || { colorTheme: "purple", darkMode: true };
  state.userSettings.darkMode = enabled;
  applyUserTheme();
  saveState();
  if (ui.darkModeToggle) ui.darkModeToggle.checked = enabled;
  if (state.userSettings?.liquidBackground) initLiquidBackground();
}

function saveUserProfile() {
  state.userProfile = {
    displayName: ui.profileDisplayName?.value.trim() || "",
    heightCm: ui.profileHeight?.value.trim() || "",
    bodyWeightKg: ui.profileBodyWeight?.value.trim() || "",
    age: ui.profileAge?.value.trim() || ""
  };
  saveState();
  renderProfilePage();
}

function renderThemeSwatches() {
  if (!ui.themeSwatches) return;
  const current = state.userSettings?.colorTheme || "purple";
  ui.themeSwatches.innerHTML = "";
  THEME_OPTIONS.forEach((theme) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `theme-swatch${current === theme.id ? " active" : ""}`;
    btn.innerHTML = `${theme.label}<div class="theme-swatch-dots">${theme.swatches.map((c) => `<span style="background:${c}"></span>`).join("")}</div>`;
    btn.addEventListener("click", () => setColorTheme(theme.id));
    ui.themeSwatches.appendChild(btn);
  });
}

function renderProfilePage() {
  const profile = state.userProfile || {};
  updateProfileAvatar();
  if (ui.profileDisplayName && document.activeElement !== ui.profileDisplayName) ui.profileDisplayName.value = profile.displayName || "";
  if (ui.profileHeight && document.activeElement !== ui.profileHeight) ui.profileHeight.value = profile.heightCm || "";
  if (ui.profileBodyWeight && document.activeElement !== ui.profileBodyWeight) ui.profileBodyWeight.value = profile.bodyWeightKg || "";
  if (ui.profileAge && document.activeElement !== ui.profileAge) ui.profileAge.value = profile.age || "";
  if (ui.darkModeToggle) ui.darkModeToggle.checked = Boolean(state.userSettings?.darkMode);
  if (ui.liquidBackgroundToggle) ui.liquidBackgroundToggle.checked = Boolean(state.userSettings?.liquidBackground);
  updateLiquidBackgroundHint(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const parts = [];
  if (profile.displayName) parts.push(profile.displayName);
  if (profile.heightCm) parts.push(`${profile.heightCm} cm`);
  if (profile.bodyWeightKg) parts.push(`${profile.bodyWeightKg} kg`);
  if (profile.age) parts.push(`age ${profile.age}`);
  if (ui.profileSummaryLine) {
    ui.profileSummaryLine.textContent = parts.length ? parts.join(" · ") : "Add your stats below";
  }
  renderThemeSwatches();
}

function updateProfileAuthLine(session) {
  if (!ui.profileEmailLine) return;
  if (session?.user?.email) {
    ui.profileEmailLine.textContent = `Signed in as ${session.user.email}`;
    const name = state.userProfile?.displayName;
    if (name && ui.profileSummaryLine) {
      const parts = [name];
      if (state.userProfile.heightCm) parts.push(`${state.userProfile.heightCm} cm`);
      if (state.userProfile.bodyWeightKg) parts.push(`${state.userProfile.bodyWeightKg} kg`);
      if (state.userProfile.age) parts.push(`age ${state.userProfile.age}`);
      ui.profileSummaryLine.textContent = parts.join(" · ");
    }
  } else {
    ui.profileEmailLine.textContent = "Not signed in — use Account & sync below";
  }
}

function localDataSummary() {
  const days = Object.keys(state.doneByDate || {}).length + Object.keys(state.completedByDate || {}).length;
  return `${state.workoutLibrary.length} workouts, ${days} logged days`;
}

function hasMeaningfulLocalData() {
  return state.workoutLibrary.length > 0
    || Object.keys(state.doneByDate || {}).length > 0
    || Object.keys(state.completedByDate || {}).length > 0
    || (state.workoutSessions || []).length > 0;
}

function updateOfflineIndicator() {
  if (!ui.offlineIndicator) return;
  ui.offlineIndicator.classList.remove("hidden", "online", "offline", "pending", "error");
  if (!navigator.onLine) {
    ui.offlineIndicator.textContent = "Saved on this device — will sync when online";
    ui.offlineIndicator.classList.add("offline");
    return;
  }
  if (syncPending) {
    ui.offlineIndicator.textContent = "Saved locally — syncing to cloud…";
    ui.offlineIndicator.classList.add("pending");
    return;
  }
  if (supabaseClient) {
    ui.offlineIndicator.textContent = "Online — changes save to this device and cloud when logged in";
    ui.offlineIndicator.classList.add("online");
    return;
  }
  ui.offlineIndicator.textContent = "Saved on this device only (log in to sync)";
  ui.offlineIndicator.classList.add("offline");
}

function getPersonalBest(name) {
  return state.personalBests[name] || null;
}

function checkIsPR(exercise) {
  if (isCardioExercise(exercise)) return false;
  const vol = exerciseVolume(exercise);
  if (vol <= 0) return false;
  const best = getPersonalBest(exercise.name);
  if (!best) return false;
  return vol > best.volume;
}

function mergeBestRecord(name, patch) {
  const prev = getPersonalBest(name) || {};
  state.personalBests[name] = { ...prev, ...patch };
}

function updatePersonalBestsFromExercises(exercises, dateKey) {
  exercises.forEach((exercise) => {
    if (isCardioExercise(exercise)) return;
    const vol = exerciseVolume(exercise);
    if (vol <= 0) return;
    const best = getPersonalBest(exercise.name);
    if (!best || vol > (best.volume || 0)) {
      mergeBestRecord(exercise.name, {
        volume: vol,
        weight: exercise.weight,
        reps: exercise.reps,
        sets: exercise.sets,
        dateKey
      });
    }
  });
}

function getStoredOneRm(name) {
  const best = getPersonalBest(name);
  return best?.oneRm ? parseFirstNumber(best.oneRm) : 0;
}

function checkIsOneRmPR(exercise) {
  if (isCardioExercise(exercise)) return false;
  const current = exercise.oneRm ? parseFirstNumber(exercise.oneRm) : 0;
  if (current <= 0) return false;
  const stored = getStoredOneRm(exercise.name);
  if (stored <= 0) return false;
  return current > stored;
}

function saveOneRepMax(workoutId, exerciseIndex, weightStr) {
  const weight = parseFirstNumber(weightStr);
  if (weight <= 0) return { ok: false, isNew: false };
  const workout = getWorkoutById(workoutId);
  const exercise = workout?.exercises[exerciseIndex];
  if (!exercise || isCardioExercise(exercise)) return { ok: false, isNew: false };

  const key = dateKey();
  const stored = getStoredOneRm(exercise.name);
  const isNew = stored <= 0 || weight > stored;

  exercise.oneRm = String(weight);
  if (isNew) {
    mergeBestRecord(exercise.name, { oneRm: String(weight), oneRmDateKey: key });
  } else if (!getPersonalBest(exercise.name)?.oneRm) {
    mergeBestRecord(exercise.name, { oneRm: String(weight), oneRmDateKey: key });
  }

  saveState();
  return { ok: true, isNew };
}

function formatOneRmLine(name) {
  const best = getPersonalBest(name);
  if (!best?.oneRm) return "No 1RM logged yet";
  const date = best.oneRmDateKey ? formatSessionDate(best.oneRmDateKey) : "";
  return `1RM record: ${best.oneRm} kg${date ? ` (${date})` : ""}`;
}

function recordWorkoutSession(date, routine) {
  if (!routine.workoutId || !routine.exercises.length) return;
  const entry = {
    dateKey: formatDateKey(date),
    workoutId: routine.workoutId,
    workoutName: routine.focus,
    exercises: deepCopy(routine.exercises)
  };
  state.workoutSessions = (state.workoutSessions || []).filter((s) => s.dateKey !== entry.dateKey);
  state.workoutSessions.push(entry);
  state.workoutSessions.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  if (state.workoutSessions.length > 120) state.workoutSessions = state.workoutSessions.slice(0, 120);
}

function findLastSessionForWorkout(workoutId) {
  return (state.workoutSessions || []).find((s) => s.workoutId === workoutId) || null;
}

function formatSessionDate(dateKey) {
  const d = new Date(dateKey);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function copyLastSessionWeightsToWorkout(workoutId, session) {
  const workout = getWorkoutById(workoutId);
  if (!workout || !session) return false;
  session.exercises.forEach((past, idx) => {
    if (!workout.exercises[idx]) return;
    const cur = workout.exercises[idx];
    if (past.name && past.name !== cur.name) return;
    cur.weight = past.weight;
    cur.reps = past.reps;
    cur.sets = past.sets;
    cur.kind = past.kind || cur.kind;
    cur.warmupWeight = past.warmupWeight || "";
    cur.warmupReps = past.warmupReps || "";
    cur.warmupSets = past.warmupSets || "";
    cur.note = past.note || "";
    normalizeExercise(cur);
  });
  saveState();
  return true;
}

function stopRestTimer() {
  if (restTimerInterval) clearInterval(restTimerInterval);
  restTimerInterval = null;
  restTimerEndsAt = 0;
  document.querySelectorAll(".timer-active").forEach((el) => el.classList.add("hidden"));
}

function formatTimerRemaining(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function startRestTimer(articleEl, seconds) {
  stopRestTimer();
  const active = articleEl.querySelector(".timer-active");
  const display = articleEl.querySelector(".timer-display");
  if (!active || !display) return;
  restTimerEndsAt = Date.now() + seconds * 1000;
  active.classList.remove("hidden");
  const tick = () => {
    const left = restTimerEndsAt - Date.now();
    display.textContent = left > 0 ? formatTimerRemaining(left) : "Done";
    if (left <= 0) {
      stopRestTimer();
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };
  tick();
  restTimerInterval = setInterval(tick, 250);
  const skipBtn = active.querySelector(".timer-skip");
  const plusBtn = active.querySelector(".timer-plus");
  if (skipBtn) skipBtn.onclick = () => stopRestTimer();
  if (plusBtn) plusBtn.onclick = () => { restTimerEndsAt += 30000; };
}

function deleteExerciseFromWorkout(workoutId, index) {
  const workout = getWorkoutById(workoutId);
  if (!workout) return;
  workout.exercises.splice(index, 1);
  saveState();
  renderAll();
}

function deleteWorkoutById(workoutId) {
  if (state.workoutLibrary.length <= 1) {
    alert("Keep at least one workout in your library.");
    return;
  }
  const workout = getWorkoutById(workoutId);
  if (!workout) return;
  if (!confirm(`Delete "${workout.name}"? This cannot be undone.`)) return;
  state.workoutLibrary = state.workoutLibrary.filter((w) => w.id !== workoutId);
  state.rotationWorkoutIds = state.rotationWorkoutIds.filter((id) => id !== workoutId);
  Object.keys(state.weeklyDayConfig).forEach((day) => {
    if (state.weeklyDayConfig[day]?.workoutId === workoutId) delete state.weeklyDayConfig[day];
  });
  Object.keys(state.dailyWorkoutOverrides).forEach((key) => {
    if (state.dailyWorkoutOverrides[key] === workoutId) delete state.dailyWorkoutOverrides[key];
  });
  saveState();
  renderAll();
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
  updateOfflineIndicator();
}

function updateSyncUI(session) {
  authSession = session;
  if (!session) {
    ui.syncLoggedOut.classList.remove("hidden");
    ui.syncLoggedIn.classList.add("hidden");
    setSyncStatus("Log in to sync across devices.");
    updateProfileAuthLine(null);
    updateProfileAvatar();
    return;
  }
  ui.syncLoggedOut.classList.add("hidden");
  ui.syncLoggedIn.classList.remove("hidden");
  ui.syncUserEmail.textContent = `Logged in as ${session.user.email}`;
  setSyncStatus("Connected — changes auto-save to cloud.");
  updateProfileAuthLine(session);
  updateProfileAvatar();
}

function mergePersonalBestRecord(a, b) {
  const left = a || {};
  const right = b || {};
  const out = { ...right, ...left };
  const volLeft = left.volume || 0;
  const volRight = right.volume || 0;
  if (volRight > volLeft) {
    out.volume = right.volume;
    out.weight = right.weight;
    out.reps = right.reps;
    out.sets = right.sets;
    out.dateKey = right.dateKey;
  }
  const rmLeft = parseFirstNumber(left.oneRm);
  const rmRight = parseFirstNumber(right.oneRm);
  if (rmRight > rmLeft) {
    out.oneRm = right.oneRm;
    out.oneRmDateKey = right.oneRmDateKey;
  }
  return out;
}

function mergeProgressPayload(local, cloud) {
  const merged = {
    completedByDate: {},
    doneByDate: {},
    personalBests: {},
    workoutSessions: []
  };
  const completedKeys = new Set([
    ...Object.keys(local.completedByDate || {}),
    ...Object.keys(cloud.completedByDate || {})
  ]);
  completedKeys.forEach((key) => {
    if (local.completedByDate?.[key] || cloud.completedByDate?.[key]) merged.completedByDate[key] = true;
  });
  const doneKeys = new Set([
    ...Object.keys(local.doneByDate || {}),
    ...Object.keys(cloud.doneByDate || {})
  ]);
  doneKeys.forEach((key) => {
    const ids = [...new Set([...(local.doneByDate?.[key] || []), ...(cloud.doneByDate?.[key] || [])])];
    if (ids.length) merged.doneByDate[key] = ids;
  });
  const bestNames = new Set([
    ...Object.keys(local.personalBests || {}),
    ...Object.keys(cloud.personalBests || {})
  ]);
  bestNames.forEach((name) => {
    merged.personalBests[name] = mergePersonalBestRecord(local.personalBests?.[name], cloud.personalBests?.[name]);
  });
  const sessionsByDate = new Map();
  (cloud.workoutSessions || []).forEach((session) => sessionsByDate.set(session.dateKey, session));
  (local.workoutSessions || []).forEach((session) => sessionsByDate.set(session.dateKey, session));
  merged.workoutSessions = [...sessionsByDate.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return merged;
}

function mergeStatePayloads(localPayload, cloudPayload) {
  const local = migrateState(deepCopy(localPayload));
  const cloud = migrateState(deepCopy(cloudPayload));
  const progress = mergeProgressPayload(local, cloud);
  return {
    ...local,
    completedByDate: progress.completedByDate,
    doneByDate: progress.doneByDate,
    personalBests: progress.personalBests,
    workoutSessions: progress.workoutSessions
  };
}

async function handlePostLoginSync() {
  const cloud = await fetchCloudState();
  const localPayload = getStatePayload();
  const localHasData = hasMeaningfulLocalData();
  if (cloud && localHasData) {
    applyStatePayload(mergeStatePayloads(localPayload, cloud));
    await pushToCloud();
    setSyncStatus("Merged this device with your cloud data.");
    renderAll();
  } else if (cloud) {
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
  if (!supabaseClient) return false;
  if (!navigator.onLine) {
    syncPending = true;
    updateOfflineIndicator();
    return false;
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;
  syncPending = true;
  updateOfflineIndicator();
  const { error } = await supabaseClient.from("gym_profiles").upsert(
    {
      user_id: user.id,
      data: getStatePayload(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );
  syncPending = false;
  if (error) {
    setSyncStatus(`Cloud save failed: ${error.message}`);
    return false;
  }
  setSyncStatus("Saved to cloud.");
  return true;
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

async function applyCloudPull(cloud) {
  const merged = hasMeaningfulLocalData()
    ? mergeStatePayloads(getStatePayload(), cloud)
    : migrateState(deepCopy(cloud));
  applyStatePayload(merged);
  await pushToCloud();
  setSyncStatus("Loaded from cloud and merged with this device.");
  renderAll();
}

async function syncPull() {
  const cloud = await fetchCloudState();
  if (!cloud) {
    setSyncStatus("No cloud data found for this account.");
    return;
  }
  if (hasMeaningfulLocalData()) {
    cloudPullPending = cloud;
    ui.cloudConfirmMessage.textContent = `Cloud backup found. This device: ${localDataSummary()}. Replace local data with cloud?`;
    ui.cloudConfirmDialog.showModal();
    return;
  }
  await applyCloudPull(cloud);
}
function getRestDayForWeek(date) { return state.weekRestDayOverrides[weekKey(date)] || DEFAULT_REST_DAY; }

function getWeekRestDayOverride(date) {
  return state.weekRestDayOverrides[weekKey(date)] || null;
}

function isDayRestForWeek(day, date) {
  const mode = getDayScheduleValue(day);
  if (mode === "workout" && state.weeklyDayConfig[day]?.workoutId) return false;
  if (day === getRestDayForWeek(date) && mode !== "workout") return true;
  if (mode !== SCHEDULE_REST) return false;
  const weekOverride = getWeekRestDayOverride(date);
  if (weekOverride && weekOverride !== DEFAULT_REST_DAY && day === DEFAULT_REST_DAY) return false;
  return true;
}

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
  const pool = getRotationPool();
  let rotateIndex = 0;
  const plan = {};
  WEEK_DAYS.forEach((day) => {
    if (isDayRestForWeek(day, date)) {
      plan[day] = { focus: "Rest", exercises: [], workoutId: null };
      return;
    }
    const mode = getDayScheduleValue(day);
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

function syncAddWorkoutFromEditor() {
  if (!ui.addWorkoutSelect || !ui.editWorkoutSelect) return;
  ui.addWorkoutSelect.value = ui.editWorkoutSelect.value;
}

function syncWorkoutNamePanel() {
  const val = ui.editWorkoutSelect?.value || ui.addWorkoutSelect.value;
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

function isBeforeToday(date) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return dayStart < todayStart;
}

function getRoutineForDateWithHistory(date) {
  const key = formatDateKey(date);
  const session = (state.workoutSessions || []).find((s) => s.dateKey === key);
  if (session?.exercises?.length && (state.completedByDate[key] || (state.doneByDate[key] || []).length)) {
    return {
      focus: session.workoutName,
      exercises: deepCopy(session.exercises),
      workoutId: session.workoutId
    };
  }
  return getRoutineForDate(date);
}

function isExerciseCountedForDate(date, routine, idx) {
  const key = formatDateKey(date);
  if (state.completedByDate[key]) return true;
  const dayName = dayNameFromDate(date);
  return new Set(state.doneByDate[key] || []).has(`${dayName}-${idx}`);
}

function markAllExercisesDoneForDate(date, routine) {
  if (!routine.exercises.length) return;
  const key = formatDateKey(date);
  const dayName = dayNameFromDate(date);
  state.doneByDate[key] = routine.exercises.map((_, idx) => `${dayName}-${idx}`);
}

function computeTotalKgForDate(date, routine) {
  let total = 0;
  routine.exercises.forEach((exercise, idx) => {
    if (!isExerciseCountedForDate(date, routine, idx)) return;
    if (isCardioExercise(exercise)) return;
    total += exerciseVolume(exercise);
  });
  return Math.round(total);
}

function computeCardioMinutesForDate(date, routine) {
  let total = 0;
  routine.exercises.forEach((exercise, idx) => {
    if (!isExerciseCountedForDate(date, routine, idx)) return;
    if (!isCardioExercise(exercise)) return;
    total += parseCardioMinutes(exercise);
  });
  return Math.round(total);
}

function computeMonthlyCardioMinutes(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let total = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    total += computeCardioMinutesForDate(new Date(year, month, day), getRoutineForDate(new Date(year, month, day)));
  }
  return total;
}

function renderWorkoutHistory(todayRoutine) {
  if (!ui.workoutHistoryBlock) return;
  const last = todayRoutine.workoutId ? findLastSessionForWorkout(todayRoutine.workoutId) : null;
  const today = dateKey();
  const previous = last && last.dateKey !== today ? last : (state.workoutSessions || []).find(
    (s) => s.workoutId === todayRoutine.workoutId && s.dateKey !== today
  );
  if (!previous || !todayRoutine.exercises.length) {
    ui.workoutHistoryBlock.classList.add("hidden");
    return;
  }
  ui.workoutHistoryBlock.classList.remove("hidden");
  ui.workoutHistoryTitle.textContent = `Last time (${formatSessionDate(previous.dateKey)}): ${previous.workoutName}`;
  ui.workoutHistoryList.innerHTML = "";
  previous.exercises.forEach((ex) => {
    const line = document.createElement("p");
    line.className = "history-line";
    line.textContent = `${ex.name} — ${formatExerciseInfo(ex)}`;
    ui.workoutHistoryList.appendChild(line);
  });
  ui.copyHistoryWeightsBtn.onclick = () => {
    if (todayRoutine.workoutId && copyLastSessionWeightsToWorkout(todayRoutine.workoutId, previous)) {
      renderAll();
    }
  };
}

function getProfileInitials() {
  const name = state.userProfile?.displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (authSession?.user?.email) return authSession.user.email[0].toUpperCase();
  return "BB";
}

function updateProfileAvatar() {
  if (ui.profileAvatarInitials) ui.profileAvatarInitials.textContent = getProfileInitials();
}

function navigateToPage(pageId) {
  document.querySelectorAll(".site-nav .nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.pageTarget === pageId);
  });
  document.querySelectorAll(".profile-avatar-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.pageTarget === pageId);
  });
  ui.pages.forEach((p) => p.classList.toggle("hidden", p.id !== pageId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderNav() {
  document.querySelectorAll("[data-page-target]").forEach((btn) => {
    btn.addEventListener("click", () => navigateToPage(btn.dataset.pageTarget));
  });
}

function setExerciseExpanded(node, open) {
  node.classList.toggle("collapsed", !open);
  const toggle = node.querySelector(".expand-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "▾" : "▸";
  }
}

function bindCollapsibleExercise(node) {
  const toggle = node.querySelector(".expand-toggle");
  const summaryBtn = node.querySelector(".exercise-summary-btn");
  setExerciseExpanded(node, exercisesExpanded);
  const flip = () => setExerciseExpanded(node, node.classList.contains("collapsed"));
  if (toggle) toggle.addEventListener("click", (e) => { e.stopPropagation(); flip(); });
  if (summaryBtn) summaryBtn.addEventListener("click", flip);
}

function formatBestLine(best) {
  if (!best) return "No record yet — complete a workout to set a baseline";
  return `Previous best: ${best.weight} kg × ${best.reps} × ${best.sets || "1"} (${formatSessionDate(best.dateKey)})`;
}

function renderRecordsPage() {
  const today = getRoutineForDate(new Date());
  const weightExercises = today.exercises.filter((e) => !isCardioExercise(e));
  const prCount = weightExercises.filter((e) => checkIsPR(e)).length;

  const oneRmEntries = Object.entries(state.personalBests || {})
    .filter(([, best]) => best.oneRm)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (ui.recordsOneRmSummary) {
    ui.recordsOneRmSummary.textContent = oneRmEntries.length
      ? `${oneRmEntries.length} exercises with a logged 1RM.`
      : "Use Save 1RM on the Workout page after a max attempt.";
  }
  if (ui.recordsOneRmList) {
    ui.recordsOneRmList.innerHTML = "";
    if (!oneRmEntries.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "No 1RMs logged yet.";
      ui.recordsOneRmList.appendChild(p);
    } else {
      oneRmEntries.forEach(([name, best]) => {
        const row = document.createElement("article");
        row.className = "record-row";
        row.innerHTML = `
          <div class="record-row-head"><span>${name}</span><span class="one-rm-badge">1RM</span></div>
          <p class="muted">${best.oneRm} kg — ${formatSessionDate(best.oneRmDateKey || "")}</p>
        `;
        ui.recordsOneRmList.appendChild(row);
      });
    }
  }

  if (ui.recordsTodaySummary) {
    ui.recordsTodaySummary.textContent = today.exercises.length
      ? `${today.focus}: ${prCount} PR${prCount === 1 ? "" : "s"} possible today (based on Plan weights).`
      : "Rest day — no exercises scheduled.";
  }
  if (ui.recordsTodayList) {
    ui.recordsTodayList.innerHTML = "";
    if (!weightExercises.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "Nothing to track today.";
      ui.recordsTodayList.appendChild(p);
    } else {
      weightExercises.forEach((exercise) => {
        const isPr = checkIsPR(exercise);
        const best = getPersonalBest(exercise.name);
        const row = document.createElement("article");
        row.className = `record-row${isPr ? " is-pr" : ""}`;
        row.innerHTML = `
          <div class="record-row-head">
            <span>${exercise.name}</span>
            ${isPr ? '<span class="pr-badge">PR</span>' : ""}
          </div>
          <p class="muted">Today: ${formatExerciseInfo(exercise)}</p>
          <p class="muted">${formatBestLine(best)}</p>
          ${isPr && best ? `<p class="muted">Beat your best by ${Math.round(exerciseVolume(exercise) - best.volume)} kg volume</p>` : ""}
        `;
        ui.recordsTodayList.appendChild(row);
      });
    }
  }

  const bestEntries = Object.entries(state.personalBests || {}).sort((a, b) => a[0].localeCompare(b[0]));
  if (ui.recordsAllSummary) {
    ui.recordsAllSummary.textContent = bestEntries.length
      ? `${bestEntries.length} exercises with saved bests.`
      : "Complete a workout to start tracking bests.";
  }
  if (ui.recordsAllList) {
    ui.recordsAllList.innerHTML = "";
    if (!bestEntries.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "No personal bests yet.";
      ui.recordsAllList.appendChild(p);
    } else {
      bestEntries.forEach(([name, best]) => {
        const row = document.createElement("article");
        row.className = "record-row";
        row.innerHTML = `
          <div class="record-row-head"><span>${name}</span></div>
          <p class="muted">${best.weight} kg × ${best.reps} × ${best.sets || "1"} — ${formatSessionDate(best.dateKey)}</p>
        `;
        ui.recordsAllList.appendChild(row);
      });
    }
  }
}

function renderHomeAndWorkout() {
  const today = new Date();
  const todayRoutine = getRoutineForDate(today);
  const todayName = dayNameFromDate(today);
  ui.todayLabel.textContent = `Today is ${todayName}`;
  ui.homeTodayTitle.textContent = `${todayName}: ${todayRoutine.focus}`;
  ui.homeTodaySubtitle.textContent = todayRoutine.exercises.length
    ? `${todayRoutine.focus} — ${todayRoutine.exercises.length} exercises on deck.`
    : "Rest day — recover and come back stronger.";
  ui.homeTodayCount.textContent = `Exercises: ${todayRoutine.exercises.length}`;
  const kg = computeTotalKgForDate(today, todayRoutine);
  const cardio = computeCardioMinutesForDate(today, todayRoutine);
  ui.dailyKgCounter.textContent = `Today's lifted total: ${kg} kg`;
  if (ui.dailyCardioCounter) {
    ui.dailyCardioCounter.textContent = cardio > 0 ? `Cardio today: ${cardio} min` : "";
    ui.dailyCardioCounter.classList.toggle("hidden", cardio <= 0);
  }

  ui.routineTitle.textContent = `${todayName} Routine`;
  ui.routineSubtitle.textContent = todayRoutine.focus;
  renderWorkoutHistory(todayRoutine);
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
  if (ui.showPrsOnlyBtn) {
    ui.showPrsOnlyBtn.textContent = showPrsOnly ? "Show all exercises" : "Show PRs only";
  }

  todayRoutine.exercises.forEach((exercise, index) => {
    normalizeExercise(exercise);
    const isPr = !isCardioExercise(exercise) && checkIsPR(exercise);
    if (showPrsOnly && !isPr) return;

    const node = ui.exerciseTemplate.content.firstElementChild.cloneNode(true);
    const id = `${todayName}-${index}`;
    const checkbox = node.querySelector(".done-toggle");
    node.querySelector(".exercise-name").textContent = exercise.name;
    node.querySelector(".exercise-info-short").textContent = formatExerciseInfo(exercise);
    node.querySelector(".exercise-info").textContent = formatExerciseInfo(exercise);
    const best = getPersonalBest(exercise.name);
    const bestEl = node.querySelector(".exercise-best");
    if (bestEl && !isCardioExercise(exercise)) {
      bestEl.textContent = formatBestLine(best);
      bestEl.classList.remove("hidden");
    }
    const oneRmRecordEl = node.querySelector(".exercise-one-rm-record");
    if (oneRmRecordEl && !isCardioExercise(exercise)) {
      oneRmRecordEl.textContent = formatOneRmLine(exercise.name);
      oneRmRecordEl.classList.remove("hidden");
    }
    const oneRmInput = node.querySelector(".one-rm-input");
    if (oneRmInput) oneRmInput.value = exercise.oneRm || "";
    const isOneRmPr = checkIsOneRmPR(exercise);
    if (isOneRmPr) node.querySelector(".one-rm-badge")?.classList.remove("hidden");
    node.querySelector(".save-one-rm-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!todayRoutine.workoutId) return;
      const result = saveOneRepMax(todayRoutine.workoutId, index, oneRmInput.value);
      if (result.ok && result.isNew) {
        renderHomeAndWorkout();
        renderRecordsPage();
      } else if (result.ok) {
        setSyncStatus("1RM saved (not higher than your record).");
        renderHomeAndWorkout();
        renderRecordsPage();
      }
    });
    const warmupEl = node.querySelector(".exercise-warmup");
    const warmupText = formatWarmupLine(exercise);
    if (warmupText) {
      warmupEl.textContent = warmupText;
      warmupEl.classList.remove("hidden");
    }
    const noteEl = node.querySelector(".exercise-note");
    if (exercise.note) {
      noteEl.textContent = exercise.note;
      noteEl.classList.remove("hidden");
    }
    if (isPr) {
      node.classList.add("is-pr");
      node.querySelector(".pr-badge").classList.remove("hidden");
      const detail = node.querySelector(".pr-detail");
      if (best) {
        detail.textContent = `New best — was ${best.weight} kg × ${best.reps} (${formatSessionDate(best.dateKey)})`;
        detail.classList.remove("hidden");
      }
    }
    checkbox.checked = doneSet.has(id);
    if (checkbox.checked) node.classList.add("completed");
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      const current = new Set(state.doneByDate[todayKey] || []);
      if (checkbox.checked) { current.add(id); node.classList.add("completed"); } else { current.delete(id); node.classList.remove("completed"); }
      state.doneByDate[todayKey] = [...current];
      saveState();
      renderHomeAndWorkout();
      renderCalendarAndStats();
      renderRecordsPage();
      updateOfflineIndicator();
    });
    node.querySelectorAll(".timer-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        startRestTimer(node, Number(btn.dataset.secs));
        setExerciseExpanded(node, true);
      });
    });
    bindCollapsibleExercise(node);
    ui.exerciseList.appendChild(node);
  });

  if (showPrsOnly && !ui.exerciseList.children.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No PRs for today’s planned weights. Check Records tab or lower weights in Plan.";
    ui.exerciseList.appendChild(p);
  }
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
  const today = new Date();
  const restDay = getRestDayForWeek(today);
  const weekOverride = getWeekRestDayOverride(today);
  if (dayName === restDay && mode === SCHEDULE_ROTATE) {
    return weekOverride && weekOverride !== DEFAULT_REST_DAY
      ? `Rest (this week — moved from ${DEFAULT_REST_DAY})`
      : "Rest (weekly rest day)";
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
  const createEdit = document.createElement("option");
  createEdit.value = CREATE_WORKOUT_VALUE;
  createEdit.textContent = "+ Create new workout…";
  ui.editWorkoutSelect.appendChild(createEdit);
  fillWorkoutSelect(ui.addWorkoutSelect, { includeRest: false, includeCreateNew: true });
  ui.restDaySelect.value = getRestDayForWeek(new Date());
  if (!ui.daySelect.value) ui.daySelect.value = dayNameFromDate(new Date());
  renderRotationList();
  renderWeeklySchedule();
  if (!ui.editWorkoutSelect.value && state.workoutLibrary[0]) ui.editWorkoutSelect.value = state.workoutLibrary[0].id;
  syncAddWorkoutFromEditor();
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
    ui.editorList.appendChild(buildEditorItem(workout.id, exercise, index));
  });
}

function buildEditorItem(workoutId, exercise, index) {
  normalizeExercise(exercise);
  const node = document.createElement("article");
  node.className = "editor-item";
  const head = document.createElement("div");
  head.className = "editor-item-head";
  const nameEl = document.createElement("p");
  nameEl.className = "exercise-name";
  nameEl.textContent = exercise.name;
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn ghost danger-text";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    if (confirm(`Remove "${exercise.name}" from this workout?`)) deleteExerciseFromWorkout(workoutId, index);
  });
  head.appendChild(nameEl);
  head.appendChild(removeBtn);
  node.appendChild(head);

  const kindLabel = document.createElement("label");
  kindLabel.textContent = "Type";
  const kindSelect = document.createElement("select");
  kindSelect.className = "kind-select";
  ["weights", "cardio"].forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = k === "cardio" ? "Cardio (minutes)" : "Weights";
    kindSelect.appendChild(opt);
  });
  kindSelect.value = exercise.kind || "weights";
  kindSelect.addEventListener("change", () => {
    exercise.kind = kindSelect.value;
    saveState();
    renderEditor();
  });
  kindLabel.appendChild(kindSelect);
  node.appendChild(kindLabel);

  const isCardio = () => kindSelect.value === "cardio";

  const warmLabel = document.createElement("p");
  warmLabel.className = "editor-section-label";
  warmLabel.textContent = "Warm-up (optional)";
  node.appendChild(warmLabel);
  const warmGrid = document.createElement("div");
  warmGrid.className = "editor-row-2";
  [["warmupWeight", "Weight", exercise.warmupWeight], ["warmupReps", "Reps", exercise.warmupReps], ["warmupSets", "Sets", exercise.warmupSets]].forEach(([field, label, val]) => {
    const lab = document.createElement("label");
    lab.textContent = label;
    const input = document.createElement("input");
    input.type = "text";
    input.value = val || "";
    bindEditorInput(input, workoutId, index, field);
    lab.appendChild(input);
    warmGrid.appendChild(lab);
  });
  node.appendChild(warmGrid);

  const workLabel = document.createElement("p");
  workLabel.className = "editor-section-label";
  workLabel.textContent = "Working set";
  node.appendChild(workLabel);
  const workGrid = document.createElement("div");
  workGrid.className = "editor-row-2";
  const weightLab = document.createElement("label");
  weightLab.textContent = isCardio() ? "Level (optional)" : "Weight (kg)";
  const weightInput = document.createElement("input");
  weightInput.type = "text";
  weightInput.value = exercise.weight;
  bindEditorInput(weightInput, workoutId, index, "weight");
  weightLab.appendChild(weightInput);
  const repsLab = document.createElement("label");
  repsLab.textContent = isCardio() ? "Minutes" : "Reps";
  const repsInput = document.createElement("input");
  repsInput.type = "text";
  repsInput.value = exercise.reps;
  bindEditorInput(repsInput, workoutId, index, "reps");
  repsLab.appendChild(repsInput);
  const setsLab = document.createElement("label");
  setsLab.textContent = "Sets";
  const setsInput = document.createElement("input");
  setsInput.type = "text";
  setsInput.value = exercise.sets || "1";
  bindEditorInput(setsInput, workoutId, index, "sets");
  setsLab.appendChild(setsInput);
  workGrid.appendChild(weightLab);
  workGrid.appendChild(repsLab);
  workGrid.appendChild(setsLab);
  node.appendChild(workGrid);

  const noteLab = document.createElement("label");
  noteLab.textContent = "Note";
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.value = exercise.note || "";
  bindEditorInput(noteInput, workoutId, index, "note");
  noteLab.appendChild(noteInput);
  node.appendChild(noteLab);

  if (!isCardio()) {
    const oneRmLab = document.createElement("label");
    oneRmLab.textContent = "1 rep max (kg)";
    const oneRmInput = document.createElement("input");
    oneRmInput.type = "text";
    oneRmInput.inputMode = "decimal";
    oneRmInput.value = exercise.oneRm || "";
    oneRmInput.addEventListener("change", () => {
      exercise.oneRm = oneRmInput.value.trim();
      saveState();
    });
    oneRmInput.addEventListener("blur", () => {
      if (exercise.oneRm) saveOneRepMax(workoutId, index, exercise.oneRm);
      renderRecordsPage();
    });
    oneRmLab.appendChild(oneRmInput);
    node.appendChild(oneRmLab);
    const oneRmHint = document.createElement("p");
    oneRmHint.className = "muted";
    oneRmHint.textContent = formatOneRmLine(exercise.name);
    node.appendChild(oneRmHint);
  }

  return node;
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
  let monthlyCardio = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    const routine = getRoutineForDateWithHistory(date);
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.tabIndex = 0;
    cell.innerHTML = `<span class="calendar-weekday">${shortWeekdayName(date)}</span><span class="calendar-daynum">${day}</span>`;
    cell.addEventListener("click", () => { ui.pastDateInput.value = key; ui.specificDateInput.value = key; renderSpecificDayOverride(); });
    if (!routine.exercises.length) {
      cell.classList.add("rest");
    } else {
      workoutDays += 1;
      monthlyKg += computeTotalKgForDate(date, routine);
      monthlyCardio += computeCardioMinutesForDate(date, routine);
      if (state.completedByDate[key] || (state.doneByDate[key] || []).length > 0) {
        attended += 1;
        cell.classList.add("done");
      } else if (isBeforeToday(date)) {
        cell.classList.add("missed");
      }
    }
    ui.calendarGrid.appendChild(cell);
  }
  ui.monthlyAttendanceCounter.textContent = `Gym attendance this month: ${attended}/${workoutDays} workout days`;
  ui.monthlyKgCounter.textContent = monthlyCardio > 0
    ? `Total lifted this month: ${monthlyKg} kg · Cardio: ${monthlyCardio} min`
    : `Total lifted this month: ${monthlyKg} kg`;
}

function completeWorkoutForDate(date) {
  const routine = getRoutineForDate(date);
  const key = formatDateKey(date);
  if (!routine.exercises.length) return;
  state.completedByDate[key] = true;
  markAllExercisesDoneForDate(date, routine);
  recordWorkoutSession(date, routine);
  updatePersonalBestsFromExercises(routine.exercises, key);
  saveState();
  renderAll();
}

function completeTodayWorkout() {
  completeWorkoutForDate(new Date());
}

function resetTodayProgress() {
  const key = dateKey();
  delete state.completedByDate[key];
  state.doneByDate[key] = [];
  saveState();
  renderAll();
}

function markPastDone() {
  if (!ui.pastDateInput.value) return;
  const date = parseDateInputValue(ui.pastDateInput.value);
  if (!date) return;
  completeWorkoutForDate(date);
}
function unmarkPastDone() {
  if (!ui.pastDateInput.value) return;
  const key = ui.pastDateInput.value;
  delete state.completedByDate[key];
  state.doneByDate[key] = [];
  saveState();
  renderAll();
}
function handleRestDayChange() {
  const wk = weekKey(new Date());
  const newRest = ui.restDaySelect.value;
  if (newRest === DEFAULT_REST_DAY) {
    delete state.weekRestDayOverrides[wk];
  } else {
    state.weekRestDayOverrides[wk] = newRest;
    if (state.weeklyDayConfig[DEFAULT_REST_DAY]?.mode === SCHEDULE_REST) {
      delete state.weeklyDayConfig[DEFAULT_REST_DAY];
    }
  }
  saveState();
  renderAll();
}
function handleAddWorkoutSelectChange() {
  syncWorkoutNamePanel();
}

function handleSaveWorkoutName() {
  const name = ui.workoutNameInput.value;
  const selected = ui.editWorkoutSelect.value || ui.addWorkoutSelect.value;
  if (selected === CREATE_WORKOUT_VALUE) {
    const workout = createWorkout(name);
    if (!workout) return;
    ui.editWorkoutSelect.value = workout.id;
    syncAddWorkoutFromEditor();
    syncWorkoutNamePanel();
    renderAll();
    return;
  }
  if (!renameWorkout(selected, name)) return;
  ui.editWorkoutSelect.value = selected;
  syncAddWorkoutFromEditor();
  renderAll();
}

function handleAddExercise(event) {
  event.preventDefault();
  let workoutId = ui.editWorkoutSelect?.value || ui.addWorkoutSelect.value;
  if (workoutId === CREATE_WORKOUT_VALUE) {
    const workout = createWorkout(ui.workoutNameInput.value);
    if (!workout) return;
    workoutId = workout.id;
    ui.editWorkoutSelect.value = workoutId;
    syncAddWorkoutFromEditor();
  }
  const workout = getWorkoutById(workoutId);
  const kind = ui.exerciseKindInput?.value || "weights";
  const payload = {
    name: ui.exerciseNameInput.value.trim(),
    weight: ui.exerciseWeightInput.value.trim(),
    reps: ui.exerciseRepsInput.value.trim(),
    sets: ui.exerciseSetsInput.value.trim() || "1",
    kind,
    note: ui.exerciseNoteInput?.value.trim() || "",
    warmupWeight: "",
    warmupReps: "",
    warmupSets: "",
    oneRm: ""
  };
  normalizeExercise(payload);
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
  if (ui.exerciseNoteInput) ui.exerciseNoteInput.value = "";
  ui.editWorkoutSelect.value = workoutId;
  syncAddWorkoutFromEditor();
  renderAll();
}

function handleEditWorkoutSelectChange() {
  syncAddWorkoutFromEditor();
  syncWorkoutNamePanel();
  if (ui.editWorkoutSelect.value !== CREATE_WORKOUT_VALUE) renderEditor();
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
  renderRecordsPage();
  renderProfilePage();
  renderSpecificDayOverride();
  renderTodayWorkoutPicker();
  renderCalendarAndStats();
  updateOfflineIndicator();
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
  ui.deleteWorkoutBtn?.addEventListener("click", () => {
    if (ui.editWorkoutSelect.value) deleteWorkoutById(ui.editWorkoutSelect.value);
  });
  ui.cloudConfirmDialog?.addEventListener("close", async () => {
    if (ui.cloudConfirmDialog.returnValue === "cloud" && cloudPullPending) {
      await applyCloudPull(cloudPullPending);
      cloudPullPending = null;
    } else if (ui.cloudConfirmDialog.returnValue === "keep") {
      await pushToCloud();
      setSyncStatus("Kept this device’s data and saved it to the cloud.");
      cloudPullPending = null;
    } else {
      cloudPullPending = null;
    }
  });
  window.addEventListener("online", () => { updateOfflineIndicator(); pushToCloud(); });
  window.addEventListener("offline", updateOfflineIndicator);
  ui.completeWorkoutBtn.addEventListener("click", completeTodayWorkout);
  ui.resetTodayBtn.addEventListener("click", resetTodayProgress);
  ui.markPastDoneBtn.addEventListener("click", markPastDone);
  ui.unmarkPastDoneBtn.addEventListener("click", unmarkPastDone);
  ui.restDaySelect.addEventListener("change", handleRestDayChange);
  ui.daySelect.addEventListener("change", renderEditor);
  ui.editWorkoutSelect.addEventListener("change", handleEditWorkoutSelectChange);
  ui.addWorkoutSelect.addEventListener("change", handleAddWorkoutSelectChange);
  ui.saveWorkoutNameBtn.addEventListener("click", handleSaveWorkoutName);
  ui.addExerciseForm.addEventListener("submit", handleAddExercise);
  ui.todayWorkoutSelect.addEventListener("change", applyTodayWorkout);
  ui.clearTodayWorkoutBtn.addEventListener("click", clearTodayWorkout);
  ui.toggleUpcomingPreviewBtn.addEventListener("click", () => { upcomingPreviewVisible = !upcomingPreviewVisible; renderUpcoming(); });
  ui.applyDayWorkoutBtn.addEventListener("click", applySpecificDayWorkout);
  ui.clearDayWorkoutBtn.addEventListener("click", clearSpecificDayWorkout);
  ui.specificDateInput.addEventListener("change", renderSpecificDayOverride);
  ui.saveProfileBtn?.addEventListener("click", saveUserProfile);
  ui.darkModeToggle?.addEventListener("change", () => setDarkMode(ui.darkModeToggle.checked));
  ui.liquidBackgroundToggle?.addEventListener("change", () => setLiquidBackground(ui.liquidBackgroundToggle.checked));
  initLiquidBackground();
  ui.showPrsOnlyBtn?.addEventListener("click", () => {
    showPrsOnly = !showPrsOnly;
    renderHomeAndWorkout();
  });
  ui.expandAllExercisesBtn?.addEventListener("click", () => {
    exercisesExpanded = true;
    renderHomeAndWorkout();
  });
  ui.collapseAllExercisesBtn?.addEventListener("click", () => {
    exercisesExpanded = false;
    renderHomeAndWorkout();
  });
  renderAll();
}

setup();
