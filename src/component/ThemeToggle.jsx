const ThemeToggle = ({ isDarkTheme, onToggleTheme }) => {
  return (
    <button
      type="button"
      className={`toggleBtn ${!isDarkTheme ? 'white-theme' : ''}`}
      onClick={onToggleTheme}
    >
      {isDarkTheme ? 'Light-mode' : 'Dark-mode'}
    </button>
  );
};

export default ThemeToggle;
