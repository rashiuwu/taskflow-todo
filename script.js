const STORAGE_KEY = "taskflow_todos";

let todos = loadTodos();
let currentFilter = "all";

const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const filters = document.querySelector("#filters");
const count = document.querySelector("#count");
const emptyState = document.querySelector("#emptyState");
const clearCompleted = document.querySelector("#clearCompleted");

function loadTodos() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createTodo(text) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    completed: false
  };
}

function getVisibleTodos() {
  if (currentFilter === "active") {
    return todos.filter(todo => !todo.completed);
  }

  if (currentFilter === "completed") {
    return todos.filter(todo => todo.completed);
  }

  return todos;
}

function renderTodos() {
  todoList.innerHTML = "";

  const visibleTodos = getVisibleTodos();

  visibleTodos.forEach(todo => {
    const li = document.createElement("li");
    li.className = `todo-item${todo.completed ? " completed" : ""}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <input class="todo-check" type="checkbox" ${todo.completed ? "checked" : ""} aria-label="Complete task">
      <span class="todo-text"></span>
      <div class="actions">
        <button class="action edit" type="button">Edit</button>
        <button class="action delete" type="button">Delete</button>
      </div>
    `;

    li.querySelector(".todo-text").textContent = todo.text;
    todoList.appendChild(li);
  });

  const remaining = todos.filter(todo => !todo.completed).length;
  count.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
  emptyState.hidden = visibleTodos.length !== 0;
}

function addTodo(text) {
  todos.unshift(createTodo(text));
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(item => item.id === id);
  if (!todo) return;

  todo.completed = !todo.completed;
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  saveTodos();
  renderTodos();
}

function startEdit(li, todo) {
  const input = document.createElement("input");
  input.className = "edit-input";
  input.value = todo.text;
  input.maxLength = 120;

  const actions = li.querySelector(".actions");
  const text = li.querySelector(".todo-text");

  text.replaceWith(input);
  input.focus();
  input.select();

  actions.innerHTML = `
    <button class="action save" type="button">Save</button>
    <button class="action cancel" type="button">Cancel</button>
  `;

  const finish = (save) => {
    if (save) {
      const newText = input.value.trim();
      if (newText) {
        todo.text = newText;
        saveTodos();
      }
    }
    renderTodos();
  };

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });

  actions.querySelector(".save").addEventListener("click", () => finish(true));
  actions.querySelector(".cancel").addEventListener("click", () => finish(false));
}

todoForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) return;

  addTodo(text);
  todoInput.value = "";
  todoInput.focus();
});

// Event delegation: one listener handles all dynamic task interactions.
todoList.addEventListener("click", event => {
  const li = event.target.closest(".todo-item");
  if (!li) return;

  const todo = todos.find(item => item.id === li.dataset.id);
  if (!todo) return;

  if (event.target.closest(".delete")) {
    deleteTodo(todo.id);
  } else if (event.target.closest(".edit")) {
    startEdit(li, todo);
  }
});

todoList.addEventListener("change", event => {
  if (!event.target.classList.contains("todo-check")) return;

  const li = event.target.closest(".todo-item");
  if (li) toggleTodo(li.dataset.id);
});

filters.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  currentFilter = button.dataset.filter;

  document.querySelectorAll(".filter").forEach(filterButton => {
    filterButton.classList.toggle(
      "active",
      filterButton === button
    );
  });

  renderTodos();
});

clearCompleted.addEventListener("click", () => {
  todos = todos.filter(todo => !todo.completed);
  saveTodos();
  renderTodos();
});

renderTodos();
