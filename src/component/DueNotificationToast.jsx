import { useEffect } from 'react';
import { formatDeviceDate } from '../utils/timeUtils';

const DueNotificationToast = ({
  notifications,
  onDismiss,
  onSnooze,
  onCompleteTask,
  onReplayChime,
}) => {
  // Flash browser document title while notifications are active (must be called unconditionally)
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const originalTitle = document.title;
    let isAlert = true;

    const interval = setInterval(() => {
      if (notifications.length > 0) {
        const topTask = notifications[0];
        document.title = isAlert
          ? `🔔 REMINDER: ${topTask.taskValue.slice(0, 20)}...`
          : `(${notifications.length}) Task Reminder Alert!`;
        isAlert = !isAlert;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, [notifications]);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="notifications-overlay" role="region" aria-label="Task reminders">
      {notifications.map((item) => {
        const isReminder = item.type === 'reminder';

        return (
          <div
            key={`${item.taskId}-${item.type}`}
            className={`due-notification-toast active-alert-pulse ${isReminder ? 'reminder-toast' : ''}`}
            role="alert"
          >
            <div className="due-notification-header">
              <span className="due-notification-title">
                <i className={`fas ${isReminder ? 'fa-bell' : 'fa-clock'} bell-ring`} style={{ marginRight: '6px' }}></i>
                {isReminder ? 'Task Reminder Reached!' : 'Task Due Date Reached!'}
              </span>
              <div className="header-actions">
                {onReplayChime && (
                  <button
                    type="button"
                    className="replay-sound-btn"
                    onClick={onReplayChime}
                    title="Play alert sound again"
                  >
                    <i className="fas fa-volume-up"></i>
                  </button>
                )}
                <button
                  type="button"
                  className="due-notification-close"
                  onClick={() => onDismiss(item.taskId)}
                  aria-label="Dismiss notification"
                  title="Dismiss notification"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="due-notification-body">
              <p className="due-notification-text">{item.taskValue}</p>
              <div className="due-notification-meta">
                <span className="category-badge">{item.category}</span>
                <span className="due-notification-time">
                  <i className="fas fa-history" style={{ marginRight: '4px' }}></i>
                  {isReminder ? 'Alert Time: ' : 'Due Time: '}
                  {item.time ? formatDeviceDate(item.time, { includeYear: true }) : 'Now'}
                </span>
              </div>
            </div>

            <div className="due-notification-actions-row">
              <button
                type="button"
                className="complete-alert-btn"
                onClick={() => onCompleteTask(item.taskId)}
              >
                <i className="fas fa-check" style={{ marginRight: '4px' }}></i>
                Mark Done
              </button>
              <button
                type="button"
                className="snooze-alert-btn"
                onClick={() => onSnooze(item.taskId, 5)}
                title="Remind me again in 5 minutes"
              >
                <i className="fas fa-hourglass-half" style={{ marginRight: '4px' }}></i>
                Snooze 5m
              </button>
              <button
                type="button"
                className="due-notification-dismiss-btn"
                onClick={() => onDismiss(item.taskId)}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DueNotificationToast;
