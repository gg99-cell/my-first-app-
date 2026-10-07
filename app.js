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

// A labelled date box, e.g. "Due [ 10/10/2026 ]"
function dateField(labelText, value, onChange) {
  const label = document.createElement("label");
  label.className = "date-field";
  label.textContent = labelText + " ";

  const input = document.createElement("input");
  input.type = "date";
  input.value = value || "";
  input.addEventListener("change", () => {
    onChange(input.value);
    save();
    render();
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

    // Due date: can be changed any time
    const due = dateField("Due", todo.due, (value) => {
      todos[index].due = value;
    });
    if (todo.due && !todo.done && todo.due < today()) {
      due.classList.add("overdue");
      due.title = "Overdue!";
    }

    // Closed date: filled in automatically when ticked, and can be set by hand.
    // Setting it closes the task; clearing it re-opens the task.
    const closed = dateField("Closed", todo.closed, (value) => {
      todos[index].closed = value;
      todos[index].done = value !== "";
    });

    const dates = document.createElement("div");
    dates.className = "dates";
    dates.append(due, closed);

    const main = document.createElement("div");
    main.className = "main";
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

// Add a new task when the form is submitted
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
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
