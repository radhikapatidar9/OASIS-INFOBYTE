import { useLoaderData, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../cssFiles/home.css";

export default function Home() {
  const varieties = useLoaderData() || [];
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken) {
      navigate("/authform");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleSelectPizza = (pizza) => {
    navigate("/customize", { state: { pizza } });
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>Verifying session...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      {/* Hero Welcome banner */}
      <div className="glass-card" style={{ 
        marginBottom: '40px', 
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(249, 115, 22, 0.15) 100%)',
        padding: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>
          Welcome back, <span style={{ color: 'var(--primary)' }}>{user.name}!</span> 🍕
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Explore our signature varieties below, or jump directly into creating your own masterfully customized pizza!
        </p>
        <button 
          className="btn-primary" 
          style={{ marginTop: '24px', padding: '12px 30px' }}
          onClick={() => navigate("/customize")}
        >
          Create Custom Pizza from Scratch
        </button>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🍕</span> Signature Pizza Varieties
      </h2>

      <div className="variety_main_container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', padding: 0 }}>
        {varieties.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No pizza varieties available at the moment. Admin can create them.</p>
          </div>
        ) : (
          varieties.map((item, index) => {
            return (
              <div 
                className="glass-card animate-fade-in" 
                key={item._id || index}
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                  <img 
                    className="variety_image" 
                    src={item.image} 
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '4px 12px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: 'bold',
                    color: 'var(--primary)'
                  }}>
                    From ₹{item.basePrice}
                  </div>
                </div>
                
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                    {item.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flexGrow: 1, marginBottom: '20px' }}>
                    {item.description}
                  </p>
                  <button 
                    className="btn-primary" 
                    style={{ width: '100%' }} 
                    onClick={() => handleSelectPizza(item)}
                  >
                    Select & Customize
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
