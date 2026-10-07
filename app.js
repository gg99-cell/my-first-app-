// Grab the elements we need from the page
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const count = document.getElementById("count");
const clearDone = document.getElementById("clear-done");

// Load saved tasks from the browser (or start with an empty list)
let todos = JSON.parse(localStorage.getItem("todos") || "[]");

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
      save();
      render();
    });

    const text = document.createElement("span");
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "×";
    del.title = "Delete";
    del.addEventListener("click", () => {
      todos.splice(index, 1);
      save();
      render();
    });

    li.append(checkbox, text, del);
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
  todos.push({ text, done: false });
  input.value = "";
  save();
  render();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

render();
