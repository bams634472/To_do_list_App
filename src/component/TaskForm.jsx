import { useState, useEffect } from 'react';
import {
  getDevicePresetMinutes,
  getDeviceTomorrowMorning,
  getDeviceCurrentTimeFormatted,
  getDeviceTodayFormatted,
  formatDeviceDate,
  toDeviceDatetimeLocal,
  getDeviceTimezoneName,
} from '../utils/timeUtils';

const TaskForm = ({
  text,
  setText,
  category,
  setCategory,
  categories,
  dueDate,
  setDueDate,
  reminderTime,
  setReminderTime,
  notificationPermission,
  onRequestNotificationPermission,
  editFlag,
  onSubmit,
  onKeyDown,
}) => {
  const [deviceTime, setDeviceTime] = useState(getDeviceCurrentTimeFormatted());
  const [deviceToday, setDeviceToday] = useState(getDeviceTodayFormatted());
  const timezone = getDeviceTimezoneName();

  useEffect(() => {
    const timer = setInterval(() => {
      setDeviceTime(getDeviceCurrentTimeFormatted());
      setDeviceToday(getDeviceTodayFormatted());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickReminder = (minutes) => {
    setReminderTime(getDevicePresetMinutes(minutes));
  };

  const handleTomorrowMorningReminder = () => {
    setReminderTime(getDeviceTomorrowMorning(9));
  };

  const handleSetCurrentDeviceDateTime = () => {
    setReminderTime(toDeviceDatetimeLocal(new Date()));
  };

  return (
    <form action="" id="ToDoList_section" onSubmit={onSubmit}>
      <div className="section_item">
        <textarea
          id="text"
          name="event"
          rows={10}
          cols={50}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter task or item..."
        ></textarea>
      </div>

      {/* Current Device Date & Time banner */}
      <div className="gmt-clock-banner">
        <i className="fas fa-calendar-check" style={{ marginRight: '6px', color: '#0284c7' }}></i>
        <span>Device Date & Time: <strong>{deviceTime}</strong> ({timezone})</span>
      </div>

      <div className="form-controls-grid">
        <div className="category-select-group">
          <label htmlFor="category-select">Category:</label>
          <select
            id="category-select"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="datetime-input-group">
          <label htmlFor="due-date">
            <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
            Due Date:
          </label>
          <div className="datetime-input-wrapper">
            <input
              type="datetime-local"
              id="due-date"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {dueDate && (
              <button
                type="button"
                className="clear-date-btn"
                onClick={() => setDueDate('')}
                title="Clear due date"
              >
                Clear
              </button>
            )}
          </div>
          {dueDate && (
            <span className="datetime-preview-hint">
              <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
              Due: {formatDeviceDate(dueDate, { includeWeekday: true, includeYear: true })}
            </span>
          )}
        </div>
      </div>

      {/* Set Reminder Bar */}
      <div className="reminder-form-section" aria-label="Set reminder bar">
        <div className="datetime-input-group" style={{ width: '100%' }}>
          <div className="reminder-label-row">
            <label htmlFor="reminder-time">
              <i className="fas fa-bell reminder-bell-icon" style={{ marginRight: '6px' }}></i>
              Set Reminder Alert:
            </label>
            <div className="reminder-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={handleSetCurrentDeviceDateTime}
                title="Set to current device date and time"
              >
                Now (Device Date)
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleQuickReminder(15)}
                title="Remind in 15 minutes from now"
              >
                +15m
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleQuickReminder(60)}
                title="Remind in 1 hour from now"
              >
                +1h
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={handleTomorrowMorningReminder}
                title="Remind tomorrow at 9 AM"
              >
                Tomorrow 9 AM
              </button>
            </div>
          </div>

          <div className="datetime-input-wrapper">
            <input
              type="datetime-local"
              id="reminder-time"
              name="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
            {reminderTime && (
              <button
                type="button"
                className="clear-date-btn"
                onClick={() => setReminderTime('')}
                title="Clear reminder"
              >
                Clear
              </button>
            )}
          </div>

          {/* Formatted Date on the Set Reminder Bar */}
          {reminderTime ? (
            <div className="datetime-preview-hint reminder-preview-active">
              <i className="fas fa-calendar-check" style={{ marginRight: '6px', color: '#d97706' }}></i>
              Reminder Date (Device): <strong>{formatDeviceDate(reminderTime, { includeWeekday: true, includeYear: true })}</strong>
            </div>
          ) : (
            <div className="datetime-preview-hint reminder-bar-guide">
              <i className="fas fa-calendar-day" style={{ marginRight: '6px', color: '#b45309' }}></i>
              Device Date: <strong>{deviceToday}</strong> &bull; Pick a date/time or select a preset
            </div>
          )}
        </div>
      </div>

      {notificationPermission !== 'granted' && (
        <div className="notification-permission-prompt">
          <button
            type="button"
            className="enable-notifications-btn"
            onClick={onRequestNotificationPermission}
          >
            <i className="fas fa-bell" style={{ marginRight: '6px' }}></i>
            {notificationPermission === 'denied'
              ? 'Notifications blocked by browser (in-app alerts active)'
              : 'Enable Browser Due & Reminder Alerts'}
          </button>
        </div>
      )}

      {notificationPermission === 'granted' && (
        <div className="notification-status-active">
          <i className="fas fa-check-circle" style={{ color: '#155724', marginRight: '6px' }}></i>
          Browser alerts enabled for task reminders & due dates
        </div>
      )}

      <button type="submit" id="submit-btn" className="submit-btn">
        {editFlag ? 'Edit Item' : 'Add_list'}
      </button>
    </form>
  );
};

export default TaskForm;
