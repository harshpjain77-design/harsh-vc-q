import React from 'react';
import KanbanColumn from './KanbanColumn';

const COLUMNS = [
  { id: 'todo', title: 'To-Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

export default function KanbanBoard({
  tasks = [],
  onDropTask,
  onEditTask,
  onDeleteTask,
  onMoveColumn,
  onQuickAdd
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {COLUMNS.map((col, index) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            columnIndex={index}
            totalColumns={COLUMNS.length}
            tasks={columnTasks}
            onDropTask={onDropTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onMoveColumn={onMoveColumn}
            onQuickAdd={onQuickAdd}
          />
        );
      })}
    </div>
  );
}
