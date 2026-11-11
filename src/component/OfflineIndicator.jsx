import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-status-banner" role="status" aria-live="polite">
      <span className="offline-pulse-dot" />
      <span>
        <i className="fas fa-wifi-slash" style={{ marginRight: '6px' }}></i>
        <strong>Offline Mode:</strong> All your tasks, reminders, and analytics are fully functional offline!
      </span>
    </div>
  );
};

export default OfflineIndicator;
