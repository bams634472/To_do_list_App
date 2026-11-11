import { useState } from 'react';
import {
  formatDeviceDate,
  parseDeviceDatetimeToMillis,
  getDevicePresetMinutes,
  getDeviceTomorrowMorning,
  toDeviceDatetimeLocal,
} from '../utils/timeUtils';

const TaskItem = ({
  item,
  index,
  totalItems,
  onEdit,
  onDelete,
  onToggleComplete,
  onUpdateReminder,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveStep,
}) => {
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [tempReminder, setTempReminder] = useState(item.reminderTime || '');

  const hasDueDate = Boolean(item.dueDate);
  const dueMillis = hasDueDate ? parseDeviceDatetimeToMillis(item.dueDate) : NaN;
  const isOverdue = !isNaN(dueMillis) ? dueMillis <= Date.now() : false;
  const formattedDueDate = hasDueDate
    ? formatDeviceDate(item.dueDate, { includeWeekday: true, includeYear: true })
    : null;

  const hasReminder = Boolean(item.reminderTime);
  const reminderMillis = hasReminder ? parseDeviceDatetimeToMillis(item.reminderTime) : NaN;
  const isReminderFired = item.reminderFired || (!isNaN(reminderMillis) && reminderMillis <= Date.now());
  const formattedReminder = hasReminder
    ? formatDeviceDate(item.reminderTime, { includeWeekday: true, includeYear: true })
    : null;

  const handleSaveReminder = () => {
    if (onUpdateReminder) {
      onUpdateReminder(item.IDs, tempReminder || null);
    }
    setIsEditingReminder(false);
  };

  const handleRemoveReminder = () => {
    if (onUpdateReminder) {
      onUpdateReminder(item.IDs, null);
    }
    setTempReminder('');
    setIsEditingReminder(false);
  };

  const setQuickPreset = (minutes) => {
    setTempReminder(getDevicePresetMinutes(minutes));
  };

  const setTomorrowMorningPreset = () => {
    setTempReminder(getDeviceTomorrowMorning(9));
  };

  return (
    <article
      className={`grocery-item ${isOverdue && !item.completed ? 'grocery-item-overdue' : ''} ${
        item.completed ? 'grocery-item-completed' : ''
      } ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
      data-id={item.IDs}
      draggable={true}
      onDragStart={(e) => onDragStart(e, item.IDs)}
      onDragOver={(e) => onDragOver(e, item.IDs)}
      onDragEnter={(e) => onDragEnter(e, item.IDs)}
      onDragLeave={(e) => onDragLeave(e, item.IDs)}
      onDrop={(e) => onDrop(e, item.IDs)}
      onDragEnd={onDragEnd}
    >
      <div className="task-header-row">
        <div className="task-header-left">
          <span className="drag-handle" title="Drag to reorder" aria-label="Drag handle">
            <i className="fas fa-grip-vertical"></i>
          </span>
          <button
            type="button"
            className={`complete-toggle-btn ${item.completed ? 'completed' : ''}`}
            onClick={() => onToggleComplete(item.IDs)}
            title={item.completed ? 'Mark as active' : 'Mark as completed'}
          >
            <i className={`fas ${item.completed ? 'fa-check-circle' : 'fa-circle'}`}></i>
            <span className="complete-btn-label">
              {item.completed ? 'Done' : 'Mark Done'}
            </span>
          </button>
        </div>

        <div className="task-header-right">
          <p className="task-created-id">{item.IDs}</p>
          <div className="reorder-step-btns">
            <button
              type="button"
              className="step-btn"
              onClick={() => onMoveStep(item.IDs, 'up')}
              disabled={index === 0}
              title="Move up"
              aria-label="Move task up"
            >
              <i className="fas fa-chevron-up"></i>
            </button>
            <button
              type="button"
              className="step-btn"
              onClick={() => onMoveStep(item.IDs, 'down')}
              disabled={index === totalItems - 1}
              title="Move down"
              aria-label="Move task down"
            >
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="task-badges">
        <span className="category-badge">{item.category || 'Personal'}</span>

        {item.completed && (
          <span className="completed-badge">
            <i className="fas fa-check" style={{ marginRight: '4px' }}></i>
            Completed
          </span>
        )}

        {hasDueDate && (
          <span
            className={`due-badge ${
              item.completed
                ? 'due-badge-done'
                : isOverdue
                ? 'due-badge-overdue'
                : 'due-badge-pending'
            }`}
            title={isOverdue && !item.completed ? 'Task is due or overdue' : 'Scheduled due date'}
          >
            <i
              className={`fas ${
                item.completed
                  ? 'fa-check'
                  : isOverdue
                  ? 'fa-exclamation-circle'
                  : 'fa-clock'
              }`}
              style={{ marginRight: '4px' }}
            ></i>
            {isOverdue && !item.completed ? 'Overdue: ' : 'Due: '}
            {formattedDueDate}
          </span>
        )}

        {hasReminder && (
          <span
            className={`reminder-badge ${isReminderFired ? 'reminder-badge-fired' : ''}`}
            title={isReminderFired ? 'Reminder was sent' : 'Active reminder set'}
          >
            <i className="fas fa-bell" style={{ marginRight: '4px' }}></i>
            {isReminderFired ? 'Alert Sent: ' : 'Reminder: '}
            {formattedReminder}
          </span>
        )}
      </div>

      <span className={`task-text-content ${item.completed ? 'task-completed-text' : ''}`}>
        {item.Value}
      </span>

      {/* Inline Reminder Setter */}
      {isEditingReminder ? (
        <div className="inline-reminder-box">
          <div className="inline-reminder-header">
            <span>
              <i className="fas fa-bell" style={{ color: '#d97706', marginRight: '6px' }}></i>
              {hasReminder ? 'Update Task Reminder' : 'Set Task Reminder'}
            </span>
            <div className="reminder-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => setTempReminder(toDeviceDatetimeLocal(new Date()))}
                title="Set to current device date and time"
              >
                Now (Device Date)
              </button>
              <button type="button" className="preset-btn" onClick={() => setQuickPreset(15)} title="Remind in 15 minutes">+15m</button>
              <button type="button" className="preset-btn" onClick={() => setQuickPreset(60)} title="Remind in 1 hour">+1h</button>
              <button type="button" className="preset-btn" onClick={setTomorrowMorningPreset} title="Remind tomorrow 9 AM">Tomorrow 9 AM</button>
            </div>
          </div>
          <div className="inline-reminder-inputs">
            <input
              type="datetime-local"
              value={tempReminder}
              onChange={(e) => setTempReminder(e.target.value)}
              className="inline-reminder-datetime"
            />
            {tempReminder && (
              <span className="datetime-preview-hint" style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                <i className="fas fa-calendar-check" style={{ marginRight: '4px', color: '#d97706' }}></i>
                Reminder Date (Device): <strong>{formatDeviceDate(tempReminder, { includeWeekday: true, includeYear: true })}</strong>
              </span>
            )}
            <div className="inline-reminder-actions">
              <button
                type="button"
                className="save-reminder-btn"
                onClick={handleSaveReminder}
                disabled={!tempReminder}
              >
                Save
              </button>
              {hasReminder && (
                <button
                  type="button"
                  className="remove-reminder-btn"
                  onClick={handleRemoveReminder}
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                className="cancel-reminder-btn"
                onClick={() => setIsEditingReminder(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="btn-container">
        <button
          type="button"
          className={`reminder-action-btn ${hasReminder ? 'has-reminder' : ''}`}
          onClick={() => {
            setTempReminder(item.reminderTime || toDeviceDatetimeLocal(new Date(Date.now() + 15 * 60 * 1000)));
            setIsEditingReminder(!isEditingReminder);
          }}
          title={hasReminder ? 'Edit or remove reminder' : 'Set a reminder for this task'}
          style={{ marginRight: '8px', cursor: 'pointer' }}
        >
          <i className="fas fa-bell" style={{ marginRight: '4px' }}></i>
          {hasReminder ? 'Edit Reminder' : 'Set Reminder'}
        </button>

        <button
          type="button"
          className="edit-btn"
          onClick={() => onEdit(item)}
          style={{ marginRight: '8px', cursor: 'pointer' }}
        >
          <i className="fas fa-edit" style={{ marginRight: '4px' }}></i>Edit
        </button>
        <button
          type="button"
          className="delete-btn"
          onClick={() => onDelete(item.IDs)}
          style={{ cursor: 'pointer' }}
        >
          <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>delete
        </button>
      </div>
    </article>
  );
};

export default TaskItem;
