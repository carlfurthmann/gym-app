const STORAGE_KEY = "gym_split_tracker_v1";
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_REST_DAY = "Friday";

const DEFAULT_PLAN = {
  Monday: {
    focus: "Chest, Arms",
    exercises: [
      { name: "Dumbbell press", weight: "34", reps: "5", sets: "1" },
      { name: "Flies", weight: "60", reps: "6", sets: "1" },
      { name: "Triceps pulldown", weight: "75", reps: "7", sets: "1" },
      { name: "Skull crusher", weight: "32", reps: "8", sets: "1" },
      { name: "Wall curls", weight: "20", reps: "5,5,5", sets: "1" }
    ]
  },
  Tuesday: {
    focus: "Back, Shoulders, Traps",
    exercises: [
      { name: "Pull ups", weight: "bodyweight", reps: "20", sets: "1" },
      { name: "Machine row", weight: "40", reps: "6", sets: "1" },
      { name: "Shoulder press / Machine shoulder press", weight: "24 / 55", reps: "5 / 6", sets: "1" },
      { name: "Shoulder flies", weight: "14", reps: "6", sets: "1" },
      { name: "Trap crunch", weight: "28", reps: "6", sets: "1" },
      { name: "Lat pulldown one hand", weight: "65", reps: "6", sets: "1" }
    ]
  },
  Wednesday: {
    focus: "Legs (Cardio)",
    exercises: [
      { name: "Leg press", weight: "240", reps: "4", sets: "1" },
      { name: "Front raise", weight: "85", reps: "6", sets: "1" },
      { name: "Squat", weight: "", reps: "", sets: "1" },
      { name: "Hamstring curl", weight: "", reps: "", sets: "1" },
      { name: "Calf raise", weight: "", reps: "", sets: "1" },
      { name: "Deadlift unassisted", weight: "120", reps: "3", sets: "1" }
    ]
  },
  Thursday: {
    focus: "Chest, Arms",
    exercises: [
      { name: "Dumbbell press", weight: "34", reps: "5", sets: "1" },
      { name: "Flies", weight: "60", reps: "6", sets: "1" },
      { name: "Triceps pulldown", weight: "75", reps: "7", sets: "1" },
      { name: "Skull crusher", weight: "32", reps: "8", sets: "1" },
      { name: "Wall curls", weight: "20", reps: "5,5,5", sets: "1" }
    ]
  },
  Friday: { focus: "Rest", exercises: [] },
  Saturday: {
    focus: "Back, Shoulders, Traps",
    exercises: [
      { name: "Pull ups", weight: "bodyweight", reps: "20", sets: "1" },
      { name: "Machine row", weight: "40", reps: "6", sets: "1" },
      { name: "Shoulder flies", weight: "14", reps: "6", sets: "1" },
      { name: "Trap crunch", weight: "28", reps: "6", sets: "1" },
      { name: "Machine press / Shoulder press", weight: "22", reps: "5", sets: "1" }
    ]
  },
  Sunday: {
    focus: "Legs (Cardio)",
    exercises: [
      { name: "Leg press", weight: "240", reps: "4", sets: "1" },
      { name: "Front raise", weight: "85", reps: "6", sets: "1" },
      { name: "Squat", weight: "", reps: "", sets: "1" },
      { name: "Hamstring curl", weight: "", reps: "", sets: "1" },
      { name: "Calf raise", weight: "", reps: "", sets: "1" },
      { name: "Deadlift unassisted", weight: "120", reps: "3", sets: "1" }
    ]
  }
};

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeRoutine(routine) {
  routine.exercises.forEach((exercise) => {
    if (exercise.sets === undefined || exercise.sets === null) {
      exercise.sets = "1";
    }
  });
}

function defaultTemplates() {
  return WEEK_DAYS.filter((day) => day !== DEFAULT_REST_DAY).map((day) => deepCopy(DEFAULT_PLAN[day]));
}

function buildPlanFromTemplates(restDay, workoutTemplates) {
  const plan = {};
  let templateIndex = 0;

  WEEK_DAYS.forEach((day) => {
    if (day === restDay) {
      plan[day] = { focus: "Rest", exercises: [] };
      return;
    }

    const template = workoutTemplates[templateIndex] || { focus: "Workout", exercises: [] };
    plan[day] = deepCopy(template);
    templateIndex += 1;
  });

  return plan;
}

function getTemplateIndexForDay(day, restDay) {
  if (day === restDay) return -1;
  const nonRestDays = WEEK_DAYS.filter((weekday) => weekday !== restDay);
  return nonRestDays.indexOf(day);
}

function migrateState(parsed) {
  const state = parsed || {};
  state.doneByDate = state.doneByDate || {};
  state.completedByDate = state.completedByDate || {};
  state.restDay = WEEK_DAYS.includes(state.restDay) ? state.restDay : DEFAULT_REST_DAY;

  if (!Array.isArray(state.workoutTemplates) || state.workoutTemplates.length !== 6) {
    const sourcePlan = state.plan || DEFAULT_PLAN;
    const sourceRestDay = WEEK_DAYS.includes(state.restDay) ? state.restDay : DEFAULT_REST_DAY;
    const sourceDays = WEEK_DAYS.filter((day) => day !== sourceRestDay);
    state.workoutTemplates = sourceDays.map((day) => deepCopy(sourcePlan[day] || { focus: "Workout", exercises: [] }));
  }

  while (state.workoutTemplates.length < 6) {
    state.workoutTemplates.push({ focus: "Workout", exercises: [] });
  }
  state.workoutTemplates = state.workoutTemplates.slice(0, 6);
  state.workoutTemplates.forEach(normalizeRoutine);
  state.plan = buildPlanFromTemplates(state.restDay, state.workoutTemplates);
  return state;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return migrateState({
      restDay: DEFAULT_REST_DAY,
      workoutTemplates: defaultTemplates()
    });
  }

  try {
    return migrateState(JSON.parse(saved));
  } catch (error) {
    return migrateState({
      restDay: DEFAULT_REST_DAY,
      workoutTemplates: defaultTemplates()
    });
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKey() {
  return formatDateKey(new Date());
}

function todayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function dayNameFromDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function tomorrowName() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dayNameFromDate(d);
}

function rebuildPlan() {
  state.plan = buildPlanFromTemplates(state.restDay, state.workoutTemplates);
}

const state = loadState();

const todayLabel = document.getElementById("todayLabel");
const routineTitle = document.getElementById("routineTitle");
const routineSubtitle = document.getElementById("routineSubtitle");
const exerciseList = document.getElementById("exerciseList");
const upcomingText = document.getElementById("upcomingText");
const completeWorkoutBtn = document.getElementById("completeWorkoutBtn");
const resetTodayBtn = document.getElementById("resetTodayBtn");
const restDaySelect = document.getElementById("restDaySelect");
const daySelect = document.getElementById("daySelect");
const editorList = document.getElementById("editorList");
const addExerciseForm = document.getElementById("addExerciseForm");
const addDaySelect = document.getElementById("addDaySelect");
const exerciseNameInput = document.getElementById("exerciseNameInput");
const exerciseWeightInput = document.getElementById("exerciseWeightInput");
const exerciseRepsInput = document.getElementById("exerciseRepsInput");
const exerciseSetsInput = document.getElementById("exerciseSetsInput");
const dailyKgCounter = document.getElementById("dailyKgCounter");
const pastDateInput = document.getElementById("pastDateInput");
const markPastDoneBtn = document.getElementById("markPastDoneBtn");
const unmarkPastDoneBtn = document.getElementById("unmarkPastDoneBtn");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarGrid = document.getElementById("calendarGrid");
const exerciseTemplate = document.getElementById("exerciseTemplate");
const editorTemplate = document.getElementById("editorTemplate");

function formatExerciseInfo(exercise) {
  const weight = exercise.weight ? `${exercise.weight} kg` : "Weight not set";
  const reps = exercise.reps ? `${exercise.reps} reps` : "Reps not set";
  const sets = exercise.sets ? `${exercise.sets} sets` : "Sets not set";
  return `${weight} x ${reps} x ${sets}`;
}

function parseFirstNumber(value) {
  if (!value) return 0;
  const match = String(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function computeTodayTotalKg(day, routine, doneSet) {
  if (!routine) return 0;
  let total = 0;
  routine.exercises.forEach((exercise, index) => {
    const id = `${day}-${index}`;
    if (!doneSet.has(id)) return;
    const weight = parseFirstNumber(exercise.weight);
    const reps = parseFirstNumber(exercise.reps);
    const sets = parseFirstNumber(exercise.sets || "1");
    total += weight * reps * (sets || 1);
  });
  return total;
}

function getDoneSetForToday() {
  const key = dateKey();
  if (!state.doneByDate[key]) {
    state.doneByDate[key] = [];
  }
  return new Set(state.doneByDate[key]);
}

function updateTemplateForDay(day, updater) {
  const templateIndex = getTemplateIndexForDay(day, state.restDay);
  if (templateIndex < 0) return false;
  updater(state.workoutTemplates[templateIndex]);
  rebuildPlan();
  return true;
}

function renderToday() {
  const day = todayName();
  const routine = state.plan[day];
  const doneSet = getDoneSetForToday();

  todayLabel.textContent = `Today is ${day}`;
  routineTitle.textContent = `${day} Routine`;
  routineSubtitle.textContent = routine ? routine.focus : "No routine found";
  exerciseList.innerHTML = "";

  if (!routine || routine.exercises.length === 0) {
    dailyKgCounter.textContent = "Daily total lifted: 0 kg";
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Rest day. Recover and come back stronger.";
    exerciseList.appendChild(p);
    return;
  }

  routine.exercises.forEach((exercise, index) => {
    const node = exerciseTemplate.content.firstElementChild.cloneNode(true);
    const nameEl = node.querySelector(".exercise-name");
    const infoEl = node.querySelector(".exercise-info");
    const checkbox = node.querySelector(".done-toggle");
    const id = `${day}-${index}`;

    nameEl.textContent = exercise.name;
    infoEl.textContent = formatExerciseInfo(exercise);
    checkbox.checked = doneSet.has(id);

    if (checkbox.checked) {
      node.classList.add("completed");
    }

    checkbox.addEventListener("change", () => {
      const key = dateKey();
      const currentSet = new Set(state.doneByDate[key] || []);

      if (checkbox.checked) {
        currentSet.add(id);
        node.classList.add("completed");
      } else {
        currentSet.delete(id);
        node.classList.remove("completed");
      }

      state.doneByDate[key] = [...currentSet];
      saveState();
      dailyKgCounter.textContent = `Daily total lifted: ${Math.round(computeTodayTotalKg(day, routine, currentSet))} kg`;
      renderCalendar();
    });

    exerciseList.appendChild(node);
  });

  dailyKgCounter.textContent = `Daily total lifted: ${Math.round(computeTodayTotalKg(day, routine, doneSet))} kg`;
}

function renderUpcoming() {
  const day = tomorrowName();
  const routine = state.plan[day];
  if (!routine) {
    upcomingText.textContent = "No upcoming routine found.";
    return;
  }
  upcomingText.textContent = `${day}: ${routine.focus}`;
}

function renderDayOptions(selectedDay) {
  daySelect.innerHTML = "";
  addDaySelect.innerHTML = "";
  restDaySelect.innerHTML = "";

  WEEK_DAYS.forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);

    const addOption = document.createElement("option");
    addOption.value = day;
    addOption.textContent = day;
    addDaySelect.appendChild(addOption);

    const restOption = document.createElement("option");
    restOption.value = day;
    restOption.textContent = day;
    restDaySelect.appendChild(restOption);
  });

  const fallbackDay = WEEK_DAYS.includes(selectedDay) ? selectedDay : todayName();
  daySelect.value = fallbackDay;
  addDaySelect.value = fallbackDay;
  restDaySelect.value = state.restDay;
}

function renderEditor(day) {
  const routine = state.plan[day];
  editorList.innerHTML = "";

  if (!routine || routine.exercises.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = day === state.restDay
      ? "This is your selected rest day. Change rest day above if needed."
      : "No exercises to edit for this day.";
    editorList.appendChild(p);
    return;
  }

  routine.exercises.forEach((exercise, index) => {
    const node = editorTemplate.content.firstElementChild.cloneNode(true);
    const nameEl = node.querySelector(".exercise-name");
    const weightInput = node.querySelector(".weight-input");
    const repsInput = node.querySelector(".reps-input");
    const setsInput = node.querySelector(".sets-input");

    nameEl.textContent = exercise.name;
    weightInput.value = exercise.weight;
    repsInput.value = exercise.reps;
    setsInput.value = exercise.sets || "1";

    weightInput.addEventListener("input", () => {
      updateTemplateForDay(day, (template) => {
        template.exercises[index].weight = weightInput.value.trim();
      });
      saveState();
      if (day === todayName()) renderToday();
    });

    repsInput.addEventListener("input", () => {
      updateTemplateForDay(day, (template) => {
        template.exercises[index].reps = repsInput.value.trim();
      });
      saveState();
      if (day === todayName()) renderToday();
    });

    setsInput.addEventListener("input", () => {
      updateTemplateForDay(day, (template) => {
        template.exercises[index].sets = setsInput.value.trim();
      });
      saveState();
      if (day === todayName()) renderToday();
    });

    editorList.appendChild(node);
  });
}

function resetTodayProgress() {
  state.doneByDate[dateKey()] = [];
  saveState();
  renderToday();
  renderCalendar();
}

function handleAddExercise(event) {
  event.preventDefault();

  const day = addDaySelect.value;
  const name = exerciseNameInput.value.trim();
  const weight = exerciseWeightInput.value.trim();
  const reps = exerciseRepsInput.value.trim();
  const sets = exerciseSetsInput.value.trim();

  if (!day || !name || day === state.restDay) {
    return;
  }

  updateTemplateForDay(day, (template) => {
    template.exercises.push({
      name,
      weight,
      reps,
      sets: sets || "1"
    });
  });

  saveState();

  if (day === todayName()) {
    renderToday();
  }

  if (daySelect.value === day) {
    renderEditor(day);
  }

  addExerciseForm.reset();
  addDaySelect.value = day;
}

function hasAnyWorkoutDone(date) {
  const key = formatDateKey(date);
  return (state.doneByDate[key] || []).length > 0 || Boolean(state.completedByDate[key]);
}

function isRestDay(date) {
  return dayNameFromDate(date) === state.restDay;
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = firstDay.getDay();

  calendarMonthLabel.textContent = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  calendarGrid.innerHTML = "";

  for (let i = 0; i < firstWeekDay; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell empty";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month, day);
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.textContent = String(day);

    if (isRestDay(cellDate)) {
      cell.classList.add("rest");
    } else if (hasAnyWorkoutDone(cellDate)) {
      cell.classList.add("done");
    } else if (cellDate < new Date(year, month, now.getDate())) {
      cell.classList.add("missed");
    }

    calendarGrid.appendChild(cell);
  }
}

function completeWorkoutForDate(key) {
  state.completedByDate[key] = true;
  saveState();
  renderCalendar();
}

function completeTodayWorkout() {
  completeWorkoutForDate(dateKey());
}

function markSelectedPastDateDone() {
  if (!pastDateInput.value) return;
  completeWorkoutForDate(pastDateInput.value);
}

function unmarkSelectedPastDateDone() {
  if (!pastDateInput.value) return;
  delete state.completedByDate[pastDateInput.value];
  saveState();
  renderCalendar();
}

function handleRestDayChange() {
  const selected = restDaySelect.value;
  if (!WEEK_DAYS.includes(selected) || selected === state.restDay) return;
  state.restDay = selected;
  rebuildPlan();
  saveState();
  renderDayOptions(daySelect.value);
  renderToday();
  renderUpcoming();
  renderEditor(daySelect.value);
  renderCalendar();
}

pastDateInput.max = dateKey();
pastDateInput.value = dateKey();
saveState();
completeWorkoutBtn.addEventListener("click", completeTodayWorkout);
resetTodayBtn.addEventListener("click", resetTodayProgress);
restDaySelect.addEventListener("change", handleRestDayChange);
daySelect.addEventListener("change", () => renderEditor(daySelect.value));
addExerciseForm.addEventListener("submit", handleAddExercise);
markPastDoneBtn.addEventListener("click", markSelectedPastDateDone);
unmarkPastDoneBtn.addEventListener("click", unmarkSelectedPastDateDone);

renderDayOptions(todayName());
renderToday();
renderUpcoming();
renderEditor(daySelect.value);
renderCalendar();
