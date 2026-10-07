// Grab the elements we need from the page
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const list = document.getElementById("todo-list");
const count = document.getElementById("count");
const clearDone = document.getElementById("clear-done");

// Load saved tasks from the browser (or start with an empty list)
let todos = JSON.parse(localStorage.getItem("todos") || "[]");

// Today's date as "YYYY-MM-DD" (the same format date inputs use)
function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// Show a short red message under `container` for a few seconds
function showError(container, message) {
  let box = container.querySelector(":scope > .error");
  if (!box) {
    box = document.createElement("div");
    box.className = "error";
    container.appendChild(box);
  }
  box.textContent = message;
  clearTimeout(box.timer);
  box.timer = setTimeout(() => box.remove(), 3500);
}

// Check a date against the allowed range. Returns an error message, or "" if OK.
// rules = { min, max, name } with min/max as "YYYY-MM-DD" (either is optional)
function checkDate(value, rules) {
  if (!value) return "";
  if (rules.min && value < rules.min) return `${rules.name} can't be in the past`;
  if (rules.max && value > rules.max) return `${rules.name} can't be in the future`;
  return "";
}

// While someone types a year digit by digit, the box briefly holds dates
// like 0002-10-07. Treat those as "still typing", not as a real date.
function stillTyping(value) {
  return value !== "" && value.slice(0, 4) < "1000";
}

// A labelled date box, e.g. "Due [ 10/10/2026 ]"
// `rules` limits which dates are allowed; `errorArea` is where messages appear.
function dateField(labelText, value, rules, errorArea, onChange) {
  const label = document.createElement("label");
  label.className = "date-field";
  label.textContent = labelText + " ";

  const input = document.createElement("input");
  input.type = "date";
  input.value = value || "";
  if (rules.min) input.min = rules.min; // greys out earlier days in the picker
  if (rules.max) input.max = rules.max; // greys out later days in the picker

  input.addEventListener("change", () => {
    if (stillTyping(input.value)) return;
    const error = checkDate(input.value, rules);
    if (error) {
      input.value = value || ""; // put the old date back
      showError(errorArea, error);
      return;
    }
    onChange(input.value);
    save();
    render();
  });

  // If they leave the box half-typed, put the old date back
  input.addEventListener("blur", () => {
    if (stillTyping(input.value)) input.value = value || "";
  });

  label.appendChild(input);
  return label;
}

function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// Redraw the whole list from the `todos` array
function render() {
  list.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    if (todo.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todos[index].done = checkbox.checked;
      // Record the day it was closed (or clear it if re-opened)
      todos[index].closed = checkbox.checked ? today() : "";
      save();
      render();
    });

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;

    // Colour the crossed-out text by when it was closed vs. the due date
    if (todo.done && todo.due && todo.closed) {
      if (todo.closed > todo.due) li.classList.add("late");
      else if (todo.closed === todo.due) li.classList.add("on-time");
      else li.classList.add("early");
    }

    const main = document.createElement("div");
    main.className = "main";

    // Due date: if changed, must be today or later
    const due = dateField("Due", todo.due, { min: today(), name: "Due date" }, main, (value) => {
      todos[index].due = value;
    });
    if (todo.due && !todo.done && todo.due < today()) {
      due.classList.add("overdue");
      due.title = "Overdue!";
    }

    // Closed date: filled in automatically when ticked, and can be set by hand.
    // Must be today or earlier. Setting it closes the task; clearing it re-opens it.
    const closed = dateField("Closed", todo.closed, { max: today(), name: "Closed date" }, main, (value) => {
      todos[index].closed = value;
      todos[index].done = value !== "";
    });

    const dates = document.createElement("div");
    dates.className = "dates";
    dates.append(due, closed);

    main.append(text, dates);

    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "×";
    del.title = "Delete";
    del.addEventListener("click", () => {
      todos.splice(index, 1);
      save();
      render();
    });

    li.append(checkbox, main, del);
    list.appendChild(li);
  });

  const left = todos.filter((t) => !t.done).length;
  count.textContent = `${left} task${left === 1 ? "" : "s"} left`;
}

// The new-task date must be today or later.
// A bad date stays in the box (outlined red) and blocks Add until it's fixed.
const newDueRules = { min: today(), name: "Due date" };
const formArea = document.getElementById("form-errors");
dateInput.min = newDueRules.min;

// Returns an error message for the new-task date box, or "" if it's OK
function newDueError() {
  // badInput = only part of the date is filled in (e.g. day but no month).
  // Check this first: changing the box's `min` wipes a half-typed date in Chrome.
  if (dateInput.validity.badInput || stillTyping(dateInput.value)) {
    return "Finish entering the due date, or clear it";
  }
  // Keep "today" correct if the page is left open overnight
  newDueRules.min = today();
  if (dateInput.min !== newDueRules.min) dateInput.min = newDueRules.min;
  return checkDate(dateInput.value, newDueRules);
}

function showNewDueError(error) {
  dateInput.classList.toggle("invalid", error !== "");
  formArea.innerHTML = "";
  if (error) {
    const box = document.createElement("div");
    box.className = "error";
    box.textContent = error;
    formArea.appendChild(box);
  }
}

dateInput.addEventListener("change", () => {
  if (stillTyping(dateInput.value)) return;
  showNewDueError(newDueError());
});

// Add a new task when the form is submitted
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const error = newDueError();
  showNewDueError(error);
  if (error) {
    dateInput.focus();
    return;
  }
  todos.push({ text, done: false, due: dateInput.value });
  input.value = "";
  dateInput.value = "";
  save();
  render();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

render();
