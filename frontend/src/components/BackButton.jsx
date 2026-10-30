import { useNavigate, useLocation } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  const back = () => {
    // idx is set by react-router for in-app navigation; 0 means first page of session
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/');
  };
  return (
    <button onClick={back} className="backbtn" title="Go to previous page">← Back</button>
  );
}
