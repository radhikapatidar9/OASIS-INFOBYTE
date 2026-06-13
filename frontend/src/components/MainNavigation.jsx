import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MainNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Sync state with localStorage on route change
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Error reading user storage", e);
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/authform");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div>
      <header className="nav-container">
        <Link to="/" className="nav-logo">
          🍕 <span>SliceCraft</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <span style={{ fontSize: '14px', color: '#f8fafc', marginRight: '10px' }}>
                Welcome, <b>{user.firstName}</b> ({user.role})
              </span>
              <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
                Pizza Varieties
              </Link>
              <Link to="/customize" className={`nav-link ${isActive("/customize") ? "active" : ""}`}>
                Customize Pizza
              </Link>
              <Link to="/orders" className={`nav-link ${isActive("/orders") ? "active" : ""}`}>
                My Orders
              </Link>
              {user.role === "Admin" && (
                <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`} style={{ color: '#fb923c', fontWeight: 'bold' }}>
                  ⚙️ Admin Panel
                </Link>
              )}
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
                Varieties
              </Link>
              <Link to="/authform" className="nav-link-btn">
                Login / Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main style={{ padding: '24px 40px', minHeight: 'calc(100vh - 80px)' }}>
        <Outlet />
      </main>
    </div>
  );
}
