import { NavLink, Route, Routes } from 'react-router-dom';
import SubmitComplaint from './pages/SubmitComplaint.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            ComplaintDesk
          </NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Submit a complaint
            </NavLink>
            <NavLink to="/admin">Admin dashboard</NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<SubmitComplaint />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/complaints/:id" element={<ComplaintDetail />} />
          <Route
            path="*"
            element={
              <div className="panel empty">
                <h1>Page not found</h1>
                <p>The page you are looking for does not exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
    </>
  );
}
