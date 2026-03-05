import { useEffect, useMemo, useRef, useState } from "react";

export default function TodoScreen({
  todoInput,
  setTodoInput,
  addTodo,
  pendingTodos,
  todayTodos,
  nextTodos,
  completedTodos,
  clearCompletedTodos,
  todos,
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
}) {
  const [activeView, setActiveView] = useState("inbox");
  const [composeBucket, setComposeBucket] = useState("inbox");
  const [composeDescription, setComposeDescription] = useState("");
  const [composeDueDate, setComposeDueDate] = useState("");
  const [composeToday, setComposeToday] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [draggedTodoId, setDraggedTodoId] = useState(null);
  const [dragOverTodoId, setDragOverTodoId] = useState(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [draftComment, setDraftComment] = useState("");
  const [draftDueDate, setDraftDueDate] = useState("");
  const [draftPriority, setDraftPriority] = useState(4);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [saveLabel, setSaveLabel] = useState("Guardar");
  const composeDateRef = useRef(null);
  const detailDateRef = useRef(null);

  const filteredTodos = useMemo(() => {
    const byView =
      activeView === "completed"
        ? todos.filter((todo) => todo.done)
        : activeView === "today"
          ? todos.filter((todo) => !todo.done && todo.bucket === "today")
          : activeView === "upcoming"
            ? todos.filter((todo) => !todo.done && todo.bucket === "upcoming")
            : todos.filter((todo) => !todo.done && todo.bucket === "inbox");

    const q = searchQuery.trim().toLowerCase();
    const bySearch =
      q.length === 0
        ? byView
        : byView.filter((todo) => {
            const subtexts = (todo.subtasks || []).map((s) => s.text.toLowerCase()).join(" ");
            return (
              todo.text.toLowerCase().includes(q) ||
              (todo.description || "").toLowerCase().includes(q) ||
              (todo.comment || "").toLowerCase().includes(q) ||
              subtexts.includes(q)
            );
          });

    return bySearch;
  }, [todos, activeView, searchQuery]);

  const selectedTodo = useMemo(() => todos.find((todo) => todo.id === selectedTodoId) ?? null, [todos, selectedTodoId]);

  useEffect(() => {
    if (activeView === "today") {
      setComposeToday(true);
      setComposeBucket("today");
    } else if (activeView === "upcoming") {
      setComposeToday(false);
      setComposeBucket("upcoming");
    } else {
      setComposeToday(false);
      setComposeBucket("inbox");
    }
  }, [activeView]);

  useEffect(() => {
    if (!selectedTodo && filteredTodos.length > 0) setSelectedTodoId(filteredTodos[0].id);
    if (selectedTodo && !filteredTodos.some((todo) => todo.id === selectedTodo.id)) {
      setSelectedTodoId(filteredTodos[0]?.id ?? null);
    }
  }, [filteredTodos, selectedTodo]);

  useEffect(() => {
    if (!selectedTodo) {
      setDraftDescription("");
      setDraftComment("");
      setCommentInput("");
      return;
    }
    setDraftDescription(selectedTodo.description || "");
    setDraftComment(selectedTodo.comment || "");
    setDraftDueDate(selectedTodo.dueDate || "");
    setDraftPriority(Number(selectedTodo.priority) || 4);
    setSubtaskInput("");
    setCommentInput("");
    setSaveLabel("Guardar");
  }, [selectedTodo?.id]);

  const hasUnsavedChanges = Boolean(
    selectedTodo &&
      (draftDescription !== (selectedTodo.description || "") ||
        draftComment !== (selectedTodo.comment || "") ||
        draftDueDate !== (selectedTodo.dueDate || "") ||
        draftPriority !== (Number(selectedTodo.priority) || 4))
  );

  function handleAddTodo(e) {
    e.preventDefault();
    if (!todoInput.trim()) return;
    addTodo({ bucket: composeBucket, description: composeDescription, dueDate: composeDueDate });
    setComposeDescription("");
    setComposeDueDate("");
  }

  function handleSave() {
    if (!selectedTodo) return;
    updateTodoDetails(selectedTodo.id, {
      description: draftDescription,
      comment: draftComment,
      dueDate: draftDueDate,
      priority: draftPriority,
    });
    setTodoPriority(selectedTodo.id, draftPriority);
    setSaveLabel("Guardado");
    setTimeout(() => setSaveLabel("Guardar"), 1000);
  }

  function handleAddSubtask() {
    if (!selectedTodo) return;
    addSubtask(selectedTodo.id, subtaskInput);
    setSubtaskInput("");
  }

  function handleAddComment() {
    if (!selectedTodo) return;
    addComment(selectedTodo.id, commentInput, "Marta");
    setCommentInput("");
  }

  function startEditTodo(todo) {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.text);
  }

  function cancelEditTodo() {
    setEditingTodoId(null);
    setEditingTitle("");
  }

  function saveEditTodo(todoId) {
    updateTodoTitle(todoId, editingTitle);
    cancelEditTodo();
  }

  function handleDragStart(todoId) {
    setDraggedTodoId(todoId);
  }

  function handleDrop(targetTodoId) {
    if (!draggedTodoId || !targetTodoId || draggedTodoId === targetTodoId) {
      setDraggedTodoId(null);
      setDragOverTodoId(null);
      return;
    }
    const ids = filteredTodos.map((t) => t.id);
    const from = ids.indexOf(draggedTodoId);
    const to = ids.indexOf(targetTodoId);
    if (from < 0 || to < 0) {
      setDraggedTodoId(null);
      setDragOverTodoId(null);
      return;
    }
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    reorderTodos(next);
    setDraggedTodoId(null);
    setDragOverTodoId(null);
  }

  function openComposeCalendar() {
    const el = composeDateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  }

  function openDetailCalendar() {
    const el = detailDateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  }

  const viewTitle =
    activeView === "today" ? "Hoy" : activeView === "upcoming" ? "Proximo" : activeView === "completed" ? "Completado" : "Bandeja de entrada";

  return (
    <section className="todo-main">
      <div className="todo-ui">
        <aside className="todo-ui-sidebar">
          <div className="todo-ui-user">Marta</div>
          <button type="button" className="todo-ui-add">
            Anadir tarea
          </button>

          <button type="button" className={`todo-ui-nav ${activeView === "inbox" ? "active" : ""}`} onClick={() => setActiveView("inbox")}>
            <span>Bandeja de entrada</span>
            <small>{pendingTodos}</small>
          </button>
          <button type="button" className={`todo-ui-nav ${activeView === "today" ? "active" : ""}`} onClick={() => setActiveView("today")}>
            <span>Hoy</span>
            <small>{todayTodos}</small>
          </button>
          <button
            type="button"
            className={`todo-ui-nav ${activeView === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveView("upcoming")}
          >
            <span>Proximo</span>
            <small>{nextTodos}</small>
          </button>
          <button
            type="button"
            className={`todo-ui-nav ${activeView === "completed" ? "active" : ""}`}
            onClick={() => setActiveView("completed")}
          >
            <span>Completado</span>
            <small>{completedTodos}</small>
          </button>

          <button type="button" className="todo-ui-clear" onClick={clearCompletedTodos} disabled={completedTodos === 0}>
            Limpiar completadas
          </button>
        </aside>

        <div className="todo-ui-main">
          <h2>{viewTitle}</h2>
          <input
            className="todo-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tareas..."
          />

          <form className="todo-ui-compose" onSubmit={handleAddTodo}>
            <input
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              placeholder={activeView === "today" ? "Comprar verduras..." : activeView === "upcoming" ? "Tarea proxima..." : "Anadir tarea..."}
            />
            <input
              type="text"
              value={composeDescription}
              onChange={(e) => setComposeDescription(e.target.value)}
              placeholder="Descripcion"
            />
            <div className="todo-ui-compose-row">
              <button
                type="button"
                className={`chip ${composeBucket === "today" ? "on" : ""}`}
                onClick={() => {
                  setComposeToday(true);
                  setComposeBucket("today");
                }}
              >
                Hoy
              </button>
              <button
                type="button"
                className={`chip ${composeBucket === "upcoming" ? "on" : ""}`}
                onClick={() => {
                  setComposeToday(false);
                  setComposeBucket("upcoming");
                }}
              >
                Proximo
              </button>
              <button
                type="button"
                className={`chip ${composeBucket === "inbox" ? "on" : ""}`}
                onClick={() => {
                  setComposeToday(false);
                  setComposeBucket("inbox");
                }}
              >
                Bandeja
              </button>
              <button type="button" className="chip date-chip" onClick={openComposeCalendar}>
                Calendario {composeDueDate ? `(${composeDueDate})` : ""}
              </button>
              <input
                ref={composeDateRef}
                className="hidden-date-input"
                type="date"
                value={composeDueDate}
                onChange={(e) => setComposeDueDate(e.target.value)}
              />
              <span>
                {composeBucket === "today"
                  ? "se guardara en Hoy"
                  : composeBucket === "upcoming"
                    ? "se guardara en Proximo"
                    : "se guardara en Bandeja de entrada"}
              </span>
              <div>
                <button type="button" onClick={() => { setTodoInput(""); setComposeDescription(""); }}>
                  Limpiar
                </button>
                <button type="submit">Anadir tarea</button>
              </div>
            </div>
          </form>

          <ul className="todo-ui-list">
            {filteredTodos.length === 0 && <li className="todo-empty">No hay tareas en esta vista.</li>}
            {filteredTodos.map((todo) => (
              <li
                key={todo.id}
                className={`todo-ui-item ${selectedTodo?.id === todo.id ? "selected" : ""} ${todo.done ? "done" : ""} ${
                  dragOverTodoId === todo.id ? "drag-over" : ""
                }`}
                draggable
                onDragStart={() => handleDragStart(todo.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverTodoId(todo.id);
                }}
                onDrop={() => handleDrop(todo.id)}
                onDragEnd={() => {
                  setDraggedTodoId(null);
                  setDragOverTodoId(null);
                }}
              >
                <label>
                  <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                  {editingTodoId === todo.id ? (
                    <span className="todo-inline-edit">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditTodo(todo.id);
                          if (e.key === "Escape") cancelEditTodo();
                        }}
                      />
                      <button type="button" onClick={() => saveEditTodo(todo.id)}>
                        ok
                      </button>
                      <button type="button" onClick={cancelEditTodo}>
                        x
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="todo-ui-title"
                      onClick={() => {
                        setSelectedTodoId(todo.id);
                        setDetailOpen(true);
                      }}
                    >
                      {todo.text}
                    </button>
                  )}
                </label>
                <span className={`priority-badge p${todo.priority || 4}`}>P{todo.priority || 4}</span>
                {editingTodoId !== todo.id && (
                  <button type="button" className="todo-edit-btn" onClick={() => startEditTodo(todo)}>
                    editar
                  </button>
                )}
                <button type="button" className="todo-delete" onClick={() => deleteTodo(todo.id)}>
                  eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedTodo && (
          <aside className="todo-ui-detail">
            <h3>{selectedTodo.text}</h3>
            <textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} placeholder="Descripcion" />
            <input value={draftComment} onChange={(e) => setDraftComment(e.target.value)} placeholder="Comentario" />
            <div className="todo-ui-detail-row">
              <span>Prioridad</span>
              <div className="todo-ui-mini-actions">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={draftPriority === p ? `priority-btn active p${p}` : `priority-btn p${p}`}
                    onClick={() => setDraftPriority(p)}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>
            <div className="todo-ui-detail-row">
              <span>Proyecto</span>
              <strong>{selectedTodo.bucket === "today" ? "Hoy" : "Bandeja de entrada"}</strong>
            </div>
            <div className="todo-ui-detail-row">
              <span>Fecha</span>
              <div className="todo-ui-mini-actions">
                <button type="button" className="date-btn" onClick={openDetailCalendar}>
                  {draftDueDate ? draftDueDate : "Calendario"}
                </button>
                <input
                  ref={detailDateRef}
                  className="hidden-date-input"
                  type="date"
                  value={draftDueDate}
                  onChange={(e) => setDraftDueDate(e.target.value)}
                />
                <button type="button" onClick={() => moveTodoToBucket(selectedTodo.id, "inbox")}>
                  Bandeja
                </button>
                <button type="button" onClick={() => moveTodoToBucket(selectedTodo.id, "today")}>
                  Hoy
                </button>
                <button type="button" onClick={() => moveTodoToBucket(selectedTodo.id, "upcoming")}>
                  Proximo
                </button>
              </div>
            </div>
            <div className="subtask-box">
              <div className="subtask-add">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Nueva subtarea..."
                />
                <button type="button" onClick={handleAddSubtask}>
                  +
                </button>
              </div>
              <ul>
                {(selectedTodo.subtasks || []).map((sub) => (
                  <li key={sub.id}>
                    <label>
                      <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(selectedTodo.id, sub.id)} />
                      <span className={sub.done ? "done" : ""}>{sub.text}</span>
                    </label>
                    <button type="button" onClick={() => deleteSubtask(selectedTodo.id, sub.id)}>
                      x
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" className="todo-save-btn" onClick={handleSave} disabled={!hasUnsavedChanges}>
              {saveLabel}
            </button>
          </aside>
        )}
      </div>
      {detailOpen && selectedTodo && (
        <div className="todo-modal-backdrop" onClick={() => setDetailOpen(false)}>
          <div className="todo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="todo-modal-head">
              <span>{selectedTodo.bucket === "today" ? "Hoy" : selectedTodo.bucket === "upcoming" ? "Proximo" : "Bandeja de entrada"}</span>
              <button type="button" onClick={() => setDetailOpen(false)}>
                x
              </button>
            </div>
            <div className="todo-modal-body">
              <div className="todo-modal-main">
                <h3>{selectedTodo.text}</h3>
                <p>{selectedTodo.description || "Sin descripcion"}</p>
                <div className="todo-modal-comments">
                  <strong>Comentarios {selectedTodo.comments?.length || 0}</strong>
                  <ul>
                    {(selectedTodo.comments || []).map((c) => (
                      <li key={c.id}>
                        <span>{c.author}</span>
                        <p>{c.text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="todo-modal-comment-input">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Comentar..."
                    />
                    <button type="button" onClick={handleAddComment}>
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
              <div className="todo-modal-side">
                <div>
                  <span>Proyecto</span>
                  <strong>{selectedTodo.bucket === "today" ? "Hoy" : selectedTodo.bucket === "upcoming" ? "Proximo" : "Bandeja"}</strong>
                </div>
                <div>
                  <span>Fecha</span>
                  <strong>{selectedTodo.dueDate || "Sin fecha"}</strong>
                </div>
                <div>
                  <span>Prioridad</span>
                  <strong>P{selectedTodo.priority || 4}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
