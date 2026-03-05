import { useEffect, useMemo, useState } from "react";
import { TODO_STORAGE_KEY } from "../constants/storageKeys";

export default function useTodos() {
  const [todoInput, setTodoInput] = useState("");
  const [todos, setTodos] = useState([]);

  const completedTodos = useMemo(() => todos.filter((todo) => todo.done).length, [todos]);
  const pendingTodos = useMemo(() => todos.filter((todo) => !todo.done && todo.bucket === "inbox").length, [todos]);
  const todayTodos = useMemo(
    () => todos.filter((todo) => !todo.done && todo.bucket === "today").length,
    [todos]
  );
  const nextTodos = useMemo(
    () => todos.filter((todo) => !todo.done && todo.bucket === "upcoming").length,
    [todos]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TODO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setTodos(
        parsed
          .filter((item) => item && typeof item.text === "string")
          .map((item, index) => ({
            id: item.id || `${Date.now()}-${index}`,
            text: item.text,
            done: Boolean(item.done),
            description: typeof item.description === "string" ? item.description : "",
            comment: typeof item.comment === "string" ? item.comment : "",
            bucket: item.bucket === "today" || item.bucket === "upcoming" ? item.bucket : "inbox",
            dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
            comments: Array.isArray(item.comments)
              ? item.comments
                  .filter((c) => c && typeof c.text === "string")
                  .map((c, cIndex) => ({
                    id: c.id || `${Date.now()}-${index}-${cIndex}`,
                    text: c.text,
                    author: typeof c.author === "string" ? c.author : "Marta",
                    createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString(),
                  }))
              : typeof item.comment === "string" && item.comment.trim()
                ? [
                    {
                      id: `${Date.now()}-${index}-legacy`,
                      text: item.comment.trim(),
                      author: "Marta",
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : [],
            priority:
              Number(item.priority) >= 1 && Number(item.priority) <= 4
                ? Number(item.priority)
                : 4,
            subtasks: Array.isArray(item.subtasks)
              ? item.subtasks
                  .filter((sub) => sub && typeof sub.text === "string")
                  .map((sub, subIndex) => ({
                    id: sub.id || `${Date.now()}-${index}-${subIndex}`,
                    text: sub.text,
                    done: Boolean(sub.done),
                  }))
              : [],
            createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
            completedAt: typeof item.completedAt === "string" ? item.completedAt : null,
          }))
      );
    } catch {
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  function addTodo(options = {}) {
    const clean = todoInput.trim();
    if (!clean) return;
    const bucket = options.bucket === "today" || options.bucket === "upcoming" ? options.bucket : "inbox";
    const description = typeof options.description === "string" ? options.description.trim() : "";
    const dueDate = typeof options.dueDate === "string" ? options.dueDate : "";
    setTodos((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        text: clean,
        done: false,
        description,
        comment: "",
        bucket,
        dueDate,
        priority: 4,
        comments: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      ...prev,
    ]);
    setTodoInput("");
  }

  function toggleTodo(todoId) {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== todoId) return todo;
        const nextDone = !todo.done;
        return {
          ...todo,
          done: nextDone,
          completedAt: nextDone ? new Date().toISOString() : null,
        };
      })
    );
  }

  function updateTodoDetails(todoId, details) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              description: typeof details?.description === "string" ? details.description : todo.description,
              comment: typeof details?.comment === "string" ? details.comment : todo.comment,
              dueDate: typeof details?.dueDate === "string" ? details.dueDate : todo.dueDate,
              priority:
                Number(details?.priority) >= 1 && Number(details?.priority) <= 4
                  ? Number(details.priority)
                  : todo.priority,
            }
          : todo
      )
    );
  }

  function updateTodoTitle(todoId, title) {
    const clean = String(title || "").trim();
    if (!clean) return;
    setTodos((prev) => prev.map((todo) => (todo.id === todoId ? { ...todo, text: clean } : todo)));
  }

  function setTodoPriority(todoId, priority) {
    const safePriority = Number(priority);
    if (safePriority < 1 || safePriority > 4) return;
    setTodos((prev) => prev.map((todo) => (todo.id === todoId ? { ...todo, priority: safePriority } : todo)));
  }

  function addSubtask(todoId, text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: [{ id: `${Date.now()}-${Math.random()}`, text: clean, done: false }, ...(todo.subtasks || [])],
            }
          : todo
      )
    );
  }

  function toggleSubtask(todoId, subtaskId) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: (todo.subtasks || []).map((sub) => (sub.id === subtaskId ? { ...sub, done: !sub.done } : sub)),
            }
          : todo
      )
    );
  }

  function deleteSubtask(todoId, subtaskId) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: (todo.subtasks || []).filter((sub) => sub.id !== subtaskId),
            }
          : todo
      )
    );
  }

  function reorderTodos(orderedIds) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
    setTodos((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]));
      const moved = orderedIds.map((id) => byId.get(id)).filter(Boolean);
      const movedSet = new Set(moved.map((t) => t.id));
      const rest = prev.filter((t) => !movedSet.has(t.id));
      return [...moved, ...rest];
    });
  }

  function addComment(todoId, text, author = "Marta") {
    const clean = String(text || "").trim();
    if (!clean) return;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              comments: [
                ...(todo.comments || []),
                {
                  id: `${Date.now()}-${Math.random()}`,
                  text: clean,
                  author,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : todo
      )
    );
  }

  function moveTodoToBucket(todoId, bucket) {
    const safeBucket = bucket === "today" ? "today" : "inbox";
    setTodos((prev) => prev.map((todo) => (todo.id === todoId ? { ...todo, bucket: safeBucket } : todo)));
  }

  function deleteTodo(todoId) {
    setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
  }

  function clearCompletedTodos() {
    setTodos((prev) => prev.filter((todo) => !todo.done));
  }

  return {
    todoInput,
    setTodoInput,
    todos,
    completedTodos,
    pendingTodos,
    todayTodos,
    nextTodos,
    addTodo,
    toggleTodo,
    updateTodoDetails,
    updateTodoTitle,
    setTodoPriority,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTodos,
    addComment,
    moveTodoToBucket,
    deleteTodo,
    clearCompletedTodos,
  };
}
