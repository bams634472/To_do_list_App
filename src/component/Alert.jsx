const Alert = ({ alert }) => {
  return (
    <p className={`alert ${alert ? `alert-${alert.type}` : ''}`}>
      {alert ? alert.text : ''}
    </p>
  );
};

export default Alert;
