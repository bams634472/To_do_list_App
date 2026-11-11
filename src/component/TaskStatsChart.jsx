import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

const CATEGORY_COLORS = {
  Personal: '#49a6e9',
  Work: '#d23669',
  Shopping: '#10b981',
};

const TaskStatsChart = ({
  items,
  categories = ['Personal', 'Work', 'Shopping'],
  onSeedSampleData,
  onClearAnalytics,
}) => {
  const [viewMode, setViewMode] = useState('category'); // 'category' | 'daily'
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Calculate completed tasks in the last 7 days
  const { categoryData, dailyData, totalCompletedLastWeek, topCategory } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter tasks completed in the last 7 days
    const completedLastWeek = items.filter((item) => {
      if (!item.completed || !item.completedAt) return false;
      const completedDate = new Date(item.completedAt);
      return !isNaN(completedDate.getTime()) && completedDate >= sevenDaysAgo && completedDate <= now;
    });

    // 1. Data by Category
    const catCounts = {
      Personal: 0,
      Work: 0,
      Shopping: 0,
    };
    categories.forEach((cat) => {
      catCounts[cat] = 0;
    });

    completedLastWeek.forEach((item) => {
      const cat = item.category || 'Personal';
      if (catCounts[cat] !== undefined) {
        catCounts[cat] += 1;
      } else {
        catCounts[cat] = 1;
      }
    });

    const categoryChartData = Object.keys(catCounts).map((cat) => ({
      category: cat,
      completed: catCounts[cat],
      fill: CATEGORY_COLORS[cat] || '#8884d8',
    }));

    // Find top category
    let maxCat = 'None';
    let maxCount = 0;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxCat = cat;
      }
    });

    // 2. Data by Day (Last 7 Days)
    const dayBuckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayObj = {
        name: `${dayLabel} (${fullDateLabel})`,
        shortDay: dayLabel,
        dateKey: d.toISOString().split('T')[0],
        Personal: 0,
        Work: 0,
        Shopping: 0,
        total: 0,
      };

      completedLastWeek.forEach((item) => {
        const cDate = new Date(item.completedAt);
        const itemDateKey = cDate.toISOString().split('T')[0];
        if (itemDateKey === dayObj.dateKey) {
          const cat = item.category || 'Personal';
          if (dayObj[cat] !== undefined) {
            dayObj[cat] += 1;
          }
          dayObj.total += 1;
        }
      });

      dayBuckets.push(dayObj);
    }

    return {
      categoryData: categoryChartData,
      dailyData: dayBuckets,
      totalCompletedLastWeek: completedLastWeek.length,
      topCategory: maxCount > 0 ? `${maxCat} (${maxCount})` : 'None',
    };
  }, [items, categories]);

  const handleConfirmClear = () => {
    if (onClearAnalytics) {
      onClearAnalytics();
    }
    setShowConfirmClear(false);
  };

  return (
    <div className="task-stats-card">
      <div className="stats-header">
        <div>
          <h2>Weekly Task Analytics</h2>
          <p className="stats-subtitle">Completed tasks per category over the last 7 days</p>
        </div>
        <div className="stats-controls">
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'category' ? 'active' : ''}`}
              onClick={() => setViewMode('category')}
            >
              <i className="fas fa-chart-bar" style={{ marginRight: '5px' }}></i>
              By Category
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              <i className="fas fa-calendar-week" style={{ marginRight: '5px' }}></i>
              Daily Breakdown
            </button>
          </div>

          {totalCompletedLastWeek > 0 && onClearAnalytics && !showConfirmClear && (
            <button
              type="button"
              className="clear-analytics-btn"
              onClick={() => setShowConfirmClear(true)}
              title="Clear completed tasks from weekly analytics"
            >
              <i className="fas fa-trash-alt" style={{ marginRight: '5px' }}></i>
              Clear Analytics
            </button>
          )}
        </div>
      </div>

      {showConfirmClear && (
        <div className="clear-confirm-dialog" style={{ marginBottom: '1rem' }} role="alertdialog">
          <span className="confirm-text">
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
            Clear all completed tasks from the Weekly Analytics?
          </span>
          <div className="confirm-btn-group">
            <button
              type="button"
              className="confirm-clear-yes"
              onClick={handleConfirmClear}
            >
              Yes, Clear Analytics
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

      <div className="stats-summary-grid">
        <div className="stat-box">
          <span className="stat-label">Completed (7 Days)</span>
          <span className="stat-value">{totalCompletedLastWeek}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Top Category</span>
          <span className="stat-value top-cat">{topCategory}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Tracked</span>
          <span className="stat-value">{items.length}</span>
        </div>
      </div>

      <div className="chart-wrapper">
        {totalCompletedLastWeek === 0 ? (
          <div className="chart-empty-state">
            <i className="fas fa-chart-pie empty-icon"></i>
            <p>No tasks completed in the last 7 days yet.</p>
            <p className="empty-subtext">
              Check off tasks in your list below to see them appear here, or load sample weekly data.
            </p>
            {onSeedSampleData && (
              <button
                type="button"
                className="seed-sample-btn"
                onClick={onSeedSampleData}
              >
                <i className="fas fa-magic" style={{ marginRight: '6px' }}></i>
                Load Sample Week Data
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            {viewMode === 'category' ? (
              <BarChart
                data={categoryData}
                margin={{ top: 20, right: 25, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="category" tick={{ fill: '#4b5563', fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#4b5563', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  formatter={(value) => [`${value} tasks`, 'Completed']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="completed"
                  name="Tasks Completed"
                  radius={[6, 6, 0, 0]}
                  barSize={48}
                >
                  {categoryData.map((entry) => (
                    <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart
                data={dailyData}
                margin={{ top: 20, right: 25, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="shortDay" tick={{ fill: '#4b5563', fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#4b5563', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Personal" fill={CATEGORY_COLORS.Personal} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Work" fill={CATEGORY_COLORS.Work} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Shopping" fill={CATEGORY_COLORS.Shopping} stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TaskStatsChart;
