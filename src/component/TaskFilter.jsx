const TaskFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="filter-container">
      {['All', ...categories].map((cat) => (
        <button
          key={cat}
          type="button"
          className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default TaskFilter;
