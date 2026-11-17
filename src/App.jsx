import { useState, useEffect, useCallback, useRef } from 'react';
import ThemeToggle from './component/ThemeToggle';
import Alert from './component/Alert';
import TaskForm from './component/TaskForm';
import TaskList from './component/TaskList';
import TaskStatsChart from './component/TaskStatsChart';
import DueNotificationToast from './component/DueNotificationToast';
import PWAInstallButton from './component/PWAInstallButton';
import OfflineIndicator from './component/OfflineIndicator';
import {
  parseWATDatetimeToMillis,
  formatWATDate,
  getWATPresetMinutes,
  toWATDatetimeLocal,
} from './utils/timeUtils';

const CATEGORIES = ['Personal', 'Work', 'Shopping'];

const decodeVapidPublicKey = (key) => {
  const padding = '='.repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

const App = () => {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editFlag, setEditFlag] = useState(false);
  const [editID, setEditID] = useState('');
  const [alert, setAlert] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [backgroundNotificationStatus, setBackgroundNotificationStatus] = useState('idle');
  const notificationSyncRun = useRef(0);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('task');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e);
    } finally {
      setTasksLoaded(true);
    }
  }, []);

  useEffect(() => {
    const run = ++notificationSyncRun.current;
    if (!tasksLoaded) return undefined;
    if (notificationPermission !== 'granted') {
      setBackgroundNotificationStatus('permission-required');
      return undefined;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setBackgroundNotificationStatus('unsupported');
      return undefined;
    }

    setBackgroundNotificationStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const keyResponse = await fetch('/api/push/public-key');
        if (!keyResponse.ok) {
          throw new Error(`Could not load push configuration (HTTP ${keyResponse.status}).`);
        }
        const { publicKey } = await keyResponse.json();
        if (typeof publicKey !== 'string' || !publicKey) {
          throw new Error('The server did not provide a VAPID public key.');
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidPublicKey(publicKey),
          });
        }

        const events = items.flatMap((item) => {
          if (item.completed) return [];
          const reminders = [];
          const taskText = String(item.Value || 'Task').slice(0, 100);
          const categoryName = item.category || 'Personal';

          if (item.reminderTime && !item.reminderFired) {
            const timestamp = parseWATDatetimeToMillis(item.reminderTime);
            if (Number.isFinite(timestamp)) {
              reminders.push({
                id: `${item.IDs}:reminder`,
                title: `Reminder: ${taskText}`,
                body: `${categoryName} · ${formatWATDate(item.reminderTime)} WAT`,
                timestamp,
              });
            }
          }

          if (item.dueDate && !item.notified) {
            const timestamp = parseWATDatetimeToMillis(item.dueDate);
            if (Number.isFinite(timestamp)) {
              reminders.push({
                id: `${item.IDs}:due`,
                title: `Task due: ${taskText}`,
                body: `${categoryName} · Due ${formatWATDate(item.dueDate, { includeYear: true })} WAT`,
                timestamp,
              });
            }
          }

          return reminders;
        });

        if (events.length > 500) {
          throw new Error('Background notifications support up to 500 scheduled alerts per device.');
        }

        const syncResponse = await fetch('/api/reminders/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON(), events }),
        });
        if (!syncResponse.ok) {
          const result = await syncResponse.json().catch(() => ({}));
          throw new Error(result.error || `Could not sync reminders (HTTP ${syncResponse.status}).`);
        }

        if (run === notificationSyncRun.current) {
          setBackgroundNotificationStatus('active');
        }
      } catch (error) {
        console.error('Background notification setup failed:', error);
        if (run === notificationSyncRun.current) {
          setBackgroundNotificationStatus(`error: ${error.message}`);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [items, notificationPermission, tasksLoaded]);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pleasant alert chime (D5 -> F#5 -> A5)
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(587.33, now, 0.25); // D5
      playTone(739.99, now + 0.15, 0.25); // F#5
      playTone(880.0, now + 0.3, 0.45); // A5
      // Echo chime
      playTone(587.33, now + 0.65, 0.2);
      playTone(880.0, now + 0.8, 0.4);
    } catch (err) {
      console.warn('Audio chime notice:', err);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      displayAlert('Browser notifications not supported in this browser', 'danger');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        displayAlert('Browser notification alerts enabled!', 'success');
        try {
          new Notification('🔔 Notifications Active', {
            body: 'You will receive reminders when your tasks are due!',
            icon: '/src/assets/images/vite.svg',
          });
        } catch (e) {
          console.warn('Test notification notice:', e);
        }
      } else if (perm === 'denied') {
        displayAlert('Notifications denied; in-app audio & alerts active', 'danger');
      }
    } catch (e) {
      console.warn('Notification permission request error:', e);
    }
  };

  // Check reminders and due dates against their West Africa Time values.
  useEffect(() => {
    const checkDueAndReminders = () => {
      const now = Date.now();
      let hasUpdates = false;
      const newAlerts = [];

      const updatedItems = items.map((item) => {
        let updated = { ...item };

        // 1. Check Reminder Alert using device time
        if (item.reminderTime && !item.reminderFired && !item.completed) {
          const rTime = parseWATDatetimeToMillis(item.reminderTime);
          if (!isNaN(rTime) && rTime <= now) {
            hasUpdates = true;
            updated.reminderFired = true;

            // Browser Native Notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`🔔 Reminder: ${item.Value.slice(0, 35)}`, {
                  body: `Category: ${item.category || 'Personal'}\nReminder: ${formatWATDate(item.reminderTime)} WAT\nTime reached!`,
                  icon: '/src/assets/images/vite.svg',
                  requireInteraction: true,
                });
              } catch (e) {
                console.warn('Could not launch system notification:', e);
              }
            }

            newAlerts.push({
              type: 'reminder',
              taskId: item.IDs,
              taskValue: item.Value,
              category: item.category || 'Personal',
              time: item.reminderTime,
            });
          }
        }

        // 2. Check Due Date using device time
        if (item.dueDate && !item.notified && !item.completed) {
          const dueTime = parseWATDatetimeToMillis(item.dueDate);
          if (!isNaN(dueTime) && dueTime <= now) {
            hasUpdates = true;
            updated.notified = true;

            // Browser Native Notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`⏰ Task Due: ${item.Value.slice(0, 35)}`, {
                  body: `Category: ${item.category || 'Personal'}\nDue: ${formatWATDate(item.dueDate, { includeYear: true })} WAT\nDue date reached!`,
                  icon: '/src/assets/images/vite.svg',
                  requireInteraction: true,
                });
              } catch (e) {
                console.warn('Could not launch system notification:', e);
              }
            }

            newAlerts.push({
              type: 'due',
              taskId: item.IDs,
              taskValue: item.Value,
              category: item.category || 'Personal',
              time: item.dueDate,
            });
          }
        }

        return updated;
      });

      if (hasUpdates) {
        setItems(updatedItems);
        localStorage.setItem('task', JSON.stringify(updatedItems));
      }

      if (newAlerts.length > 0) {
        playChime();
        setActiveNotifications((prev) => {
          const existingIds = new Set(prev.map((a) => a.taskId + a.type));
          const uniqueNew = newAlerts.filter((a) => !existingIds.has(a.taskId + a.type));
          return [...prev, ...uniqueNew];
        });
      }
    };

    checkDueAndReminders();
    const timer = setInterval(checkDueAndReminders, 1000);
    return () => clearInterval(timer);
  }, [items, playChime]);

  const displayAlert = (msg, action) => {
    setAlert({ text: msg, type: action });
    setTimeout(() => {
      setAlert(null);
    }, 1500);
  };

  const setDefault = () => {
    setText('');
    setCategory('Personal');
    setDueDate('');
    setReminderTime('');
    setEditFlag(false);
    setEditID('');
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const value = text.trim();
    if (!value) return;

    if ((dueDate || reminderTime) && notificationPermission === 'default') {
      requestNotificationPermission();
    }

    if (editFlag && editID) {
      const updatedItems = items.map((item) =>
        item.IDs === editID
          ? {
              ...item,
              Value: value,
              category,
              dueDate: dueDate || null,
              reminderTime: reminderTime || null,
              reminderFired: reminderTime && reminderTime !== item.reminderTime ? false : item.reminderFired,
              notified: dueDate && dueDate !== item.dueDate ? false : item.notified,
            }
          : item
      );
      setItems(updatedItems);
      localStorage.setItem('task', JSON.stringify(updatedItems));
      displayAlert('Task updated successfully', 'success');
      setDefault();
      return;
    }

    const date = new Date();
    const id = formatWATDate(date, {
      includeYear: true,
      includeSeconds: true,
    });

    const newItem = {
      IDs: id,
      Value: value,
      category,
      dueDate: dueDate || null,
      reminderTime: reminderTime || null,
      reminderFired: false,
      notified: false,
      completed: false,
      completedAt: null,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    localStorage.setItem('task', JSON.stringify(updatedItems));
    displayAlert('Task added with reminder tracking', 'success');
    setDefault();
  };

  const handleDelete = (id) => {
    const updatedItems = items.filter((item) => item.IDs !== id);
    setItems(updatedItems);
    localStorage.setItem('task', JSON.stringify(updatedItems));
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== id));
    displayAlert('Item removed from list', 'danger');
  };

  const handleEdit = (item) => {
    setEditFlag(true);
    setEditID(item.IDs);
    setText(item.Value);
    setCategory(item.category || 'Personal');
    setDueDate(item.dueDate || '');
    setReminderTime(item.reminderTime || '');
  };

  const handleToggleComplete = (id) => {
    const updatedItems = items.map((item) => {
      if (item.IDs === id) {
        const willBeCompleted = !item.completed;
        return {
          ...item,
          completed: willBeCompleted,
          completedAt: willBeCompleted ? new Date().toISOString() : null,
        };
      }
      return item;
    });
    setItems(updatedItems);
    localStorage.setItem('task', JSON.stringify(updatedItems));
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== id));
    const target = updatedItems.find((i) => i.IDs === id);
    displayAlert(
      target?.completed ? 'Task marked as completed!' : 'Task returned to active',
      'success'
    );
  };

  const handleUpdateTaskReminder = (id, newReminderTime) => {
    const updatedItems = items.map((item) => {
      if (item.IDs === id) {
        return {
          ...item,
          reminderTime: newReminderTime,
          reminderFired: false,
        };
      }
      return item;
    });
    setItems(updatedItems);
    localStorage.setItem('task', JSON.stringify(updatedItems));

    if (newReminderTime) {
      if (notificationPermission === 'default') {
        requestNotificationPermission();
      }
      displayAlert('Reminder scheduled! You will be alerted when reached.', 'success');
    } else {
      displayAlert('Reminder removed from task', 'danger');
    }
  };

  const handleSnoozeReminder = (id, minutes = 5) => {
    const snoozeTime = getWATPresetMinutes(minutes);

    const updated = items.map((item) => {
      if (item.IDs === id) {
        return {
          ...item,
          reminderTime: snoozeTime,
          reminderFired: false,
        };
      }
      return item;
    });

    setItems(updated);
    localStorage.setItem('task', JSON.stringify(updated));
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== id));
    displayAlert(`Reminder snoozed for ${minutes} min (until ${formatWATDate(snoozeTime)} WAT)`, 'success');
  };

  const handleDismissNotification = (id) => {
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== id));
  };

  const handleTriggerTestReminder = () => {
    playChime();
    const nowWAT = toWATDatetimeLocal(new Date());
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 Test Reminder Alert', {
          body: `Time: ${formatWATDate(nowWAT)} WAT\nThis is how your task reminders alert you in West Africa Time.`,
          icon: '/src/assets/images/vite.svg',
        });
      } catch (e) {
        console.warn('Test notice:', e);
      }
    }
    setActiveNotifications((prev) => [
      ...prev,
      {
        type: 'reminder',
        taskId: 'test-' + Date.now(),
        taskValue: 'Sample: Complete Project Task & Review Notes',
        category: 'Work',
        time: nowWAT,
      },
    ]);
    displayAlert(`Test alert triggered (${formatWATDate(nowWAT)} WAT)!`, 'success');
  };

  const handleSeedSampleData = () => {
    const now = Date.now();
    const sampleItems = [
      {
        IDs: 'Sample 1',
        Value: 'Review project requirements and sprint roadmap',
        category: 'Work',
        completed: true,
        completedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        IDs: 'Sample 2',
        Value: 'Prepare weekly client presentation slides',
        category: 'Work',
        completed: true,
        completedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        IDs: 'Sample 3',
        Value: 'Weekly groceries: fresh veggies, milk & beans',
        category: 'Shopping',
        completed: true,
        completedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        IDs: 'Sample 4',
        Value: 'Order new ergonomic mouse and desk mat',
        category: 'Shopping',
        completed: true,
        completedAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        IDs: 'Sample 5',
        Value: 'Morning 5km jog and mobility stretching',
        category: 'Personal',
        completed: true,
        completedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        IDs: 'Sample 6',
        Value: 'Read 2 chapters of system design architecture',
        category: 'Personal',
        completed: true,
        completedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        IDs: 'Sample 7',
        Value: 'Code review for user authentication feature',
        category: 'Work',
        completed: true,
        completedAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const merged = [...items, ...sampleItems];
    setItems(merged);
    localStorage.setItem('task', JSON.stringify(merged));
    displayAlert('Loaded sample weekly completed tasks!', 'success');
  };

  const handleToggleTheme = () => {
    const root = document.documentElement;
    const dark = root.classList.toggle('dark-theme');
    setIsDarkTheme(dark);
  };

  const handleReorderTasks = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setItems((prevItems) => {
      const sourceIndex = prevItems.findIndex((item) => item.IDs === sourceId);
      const targetIndex = prevItems.findIndex((item) => item.IDs === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return prevItems;

      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(sourceIndex, 1);
      newItems.splice(targetIndex, 0, movedItem);

      localStorage.setItem('task', JSON.stringify(newItems));
      return newItems;
    });

    displayAlert('Task order updated!', 'success');
  };

  const handleMoveTaskStep = (id, direction) => {
    setItems((prevItems) => {
      const index = prevItems.findIndex((item) => item.IDs === id);
      if (index === -1) return prevItems;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prevItems.length) return prevItems;

      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(index, 1);
      newItems.splice(targetIndex, 0, movedItem);

      localStorage.setItem('task', JSON.stringify(newItems));
      return newItems;
    });
  };

  const handleClearAll = () => {
    setItems([]);
    localStorage.setItem('task', JSON.stringify([]));
    setActiveNotifications([]);
    setDefault();
    displayAlert('All tasks and Weekly Analytics cleared!', 'danger');
  };

  const handleClearAnalytics = () => {
    const remainingTasks = items.filter((item) => !item.completed);
    setItems(remainingTasks);
    localStorage.setItem('task', JSON.stringify(remainingTasks));
    displayAlert('Weekly Task Analytics cleared!', 'danger');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter((item) => (item.category || 'Personal') === selectedCategory);

  return (
    <>
      <OfflineIndicator />
      <DueNotificationToast
        notifications={activeNotifications}
        onDismiss={handleDismissNotification}
        onSnooze={handleSnoozeReminder}
        onCompleteTask={handleToggleComplete}
        onReplayChime={playChime}
      />

      <div className="container">
        <div className="top-bar-actions">
          <ThemeToggle
            isDarkTheme={isDarkTheme}
            onToggleTheme={handleToggleTheme}
          />
          <div className="top-actions-right">
            <PWAInstallButton />
            <button
              type="button"
              className="test-alert-btn"
              onClick={handleTriggerTestReminder}
              title="Test notification sound and alert popup"
            >
              <i className="fas fa-bell" style={{ marginRight: '6px' }}></i>
              Test Alert
            </button>
            <button
              type="button"
              className="toggle-analytics-btn"
              onClick={() => setShowAnalytics(!showAnalytics)}
              title="Toggle weekly analytics chart"
            >
              <i className={`fas ${showAnalytics ? 'fa-chart-line' : 'fa-chart-bar'}`} style={{ marginRight: '6px' }}></i>
              {showAnalytics ? 'Hide Weekly Chart' : 'Show Weekly Chart'}
            </button>
          </div>
        </div>

        <article className="container-section">
          <h1>What are you upto today</h1>
          <Alert alert={alert} />
          <TaskForm
            text={text}
            setText={setText}
            category={category}
            setCategory={setCategory}
            categories={CATEGORIES}
            dueDate={dueDate}
            setDueDate={setDueDate}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            notificationPermission={notificationPermission}
            backgroundNotificationStatus={backgroundNotificationStatus}
            onRequestNotificationPermission={requestNotificationPermission}
            editFlag={editFlag}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
          />
        </article>
      </div>

      {showAnalytics && (
        <TaskStatsChart
          items={items}
          categories={CATEGORIES}
          onSeedSampleData={handleSeedSampleData}
          onClearAnalytics={handleClearAnalytics}
        />
      )}

      <TaskList
        items={filteredItems}
        totalItemsCount={items.length}
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleComplete={handleToggleComplete}
        onUpdateReminder={handleUpdateTaskReminder}
        onReorder={handleReorderTasks}
        onMoveStep={handleMoveTaskStep}
        onClearAll={handleClearAll}
      />
    </>
  );
};

export default App;
