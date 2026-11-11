import { useState } from 'react';
import TaskFilter from './TaskFilter';
import TaskItem from './TaskItem';

const TaskList = ({
  items,
  totalItemsCount,
  categories,
  selectedCategory,
  onSelectCategory,
  onEdit,
  onDelete,
  onToggleComplete,
  onUpdateReminder,
  onReorder,
  onMoveStep,
  onClearAll,
  timezoneMode = 'gmt+1',
}) => {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e, id) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId && targetId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleConfirmClear = () => {
    onClearAll();
    setShowConfirmClear(false);
  };

  return (
    <div className="grocery-container">
      <TaskFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      {items.length > 1 && (
        <div className="drag-hint-banner">
          <i className="fas fa-arrows-alt-v" style={{ marginRight: '6px' }}></i>
          <span>Drag tasks or use the arrows to reorder</span>
        </div>
      )}

      <div className="grocery-list">
        {items.length === 0 ? (
          <p className="no-tasks-message">No tasks found for this filter.</p>
        ) : (
          items.map((item, index) => (
            <TaskItem
              key={item.IDs}
              item={item}
              index={index}
              totalItems={items.length}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              onUpdateReminder={onUpdateReminder}
              isDragging={draggedId === item.IDs}
              isDragOver={dragOverId === item.IDs}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onMoveStep={onMoveStep}
              timezoneMode={timezoneMode}
            />
          ))
        )}
      </div>

      <div className="clear-all-container">
        {!showConfirmClear ? (
          <button
            type="button"
            className={`clear-btn ${totalItemsCount === 0 ? 'clear-btn-disabled' : ''}`}
            onClick={() => {
              if (totalItemsCount > 0) setShowConfirmClear(true);
            }}
            disabled={totalItemsCount === 0}
            title={
              totalItemsCount === 0
                ? 'No tasks to clear'
                : 'Clear all tasks from the list and reset Weekly Task Analytics'
            }
          >
            <i className="fas fa-trash-alt" style={{ marginRight: '8px' }}></i>
            Clear All Tasks
          </button>
        ) : (
          <div className="clear-confirm-dialog" role="alertdialog">
            <span className="confirm-text">
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
              Are you sure? This will clear all tasks and reset the Weekly Task Analytics.
            </span>
            <div className="confirm-btn-group">
              <button
                type="button"
                className="confirm-clear-yes"
                onClick={handleConfirmClear}
              >
                Yes, Clear All
              </button>
              <button
                type="button"
                className="confirm-clear-cancel"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
