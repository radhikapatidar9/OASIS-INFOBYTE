import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/authform");
      return;
    }
    try {
      const res = await axios.get("http://localhost:5000/api/v1/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders);
        setError("");
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to fetch order history.");
    } finally {
      setLoading(false);
    }
  };

  // Poll orders database every 10 seconds to get real-time kitchen status changes from admin
  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStepIndex = (status) => {
    switch (status) {
      case "Order Received": return 0;
      case "In Kitchen": return 1;
      case "Ready For Delivery": return 2;
      case "Out For Delivery": return 3;
      case "Delivered": return 4;
      default: return 0;
    }
  };

  const statusSteps = ["Received", "In Kitchen", "Ready", "Out for Delivery", "Delivered"];

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <h2>🍕 Retrieving your orders...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span>📋</span> Your Pizza Orders
      </h2>

      {error && (
        <div style={{ color: "var(--danger)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>You haven't placed any pizza orders yet.</p>
          <button className="btn-primary" onClick={() => navigate("/customize")}>
            Customize a Pizza Now
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {orders.map((order) => {
            const currentStep = getStatusStepIndex(order.status);

            return (
              <div className="glass-card" key={order._id} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Header info */}
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>ORDER ID</span>
                    <span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold" }}>{order._id}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>DATE & TIME</span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>TOTAL AMOUNT</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--primary)" }}>₹{order.amount}</span>
                  </div>
                </div>

                {/* Items summary */}
                <div>
                  <h4 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>YOUR ITEMS:</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                            {item.pizzaVariety && (
                            <span style={{ backgroundColor: "rgba(249, 115, 22, 0.15)", color: "var(--primary)", border: "1px solid rgba(249, 115, 22, 0.3)", padding: "4px 10px", borderRadius: "50px", fontSize: "13px" }}>
                                Signature: {item.pizzaVariety.name}
                            </span>
                            )}
                            {item.ingredients && item.ingredients.map((ing) => (
                            <span key={ing._id} style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", padding: "4px 10px", borderRadius: "50px", fontSize: "13px" }}>
                                {ing.name} ({ing.type.toLowerCase()})
                            </span>
                            ))}
                            <span style={{ fontWeight: 'bold', marginLeft: 'auto', alignSelf: 'center' }}>Qty: {item.quantity || 1}</span>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar tracking status updates in real-time */}
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Status Tracker:</span>
                    <span className={`badge badge-${order.status.toLowerCase().includes('kitchen') ? 'kitchen' : order.status.toLowerCase().includes('delivery') ? 'delivery' : order.status.toLowerCase().includes('received') ? 'received' : 'delivered'}`}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginTop: "15px", padding: "0 10px" }}>
                    {/* Line behind steps */}
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      left: "10%",
                      right: "10%",
                      height: "3px",
                      backgroundColor: "var(--bg-tertiary)",
                      zIndex: 1
                    }}>
                      <div style={{
                        width: `${(currentStep / 4) * 100}%`,
                        height: "100%",
                        backgroundColor: "var(--success)",
                        transition: "width 0.5s ease"
                      }}></div>
                    </div>

                    {/* Step Nodes */}
                    {statusSteps.map((stepText, idx) => {
                      const isCompleted = currentStep >= idx;
                      const isCurrent = currentStep === idx;

                      return (
                        <div key={idx} style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: isCompleted ? "var(--success)" : "var(--bg-tertiary)",
                            border: isCurrent ? "3px solid var(--text-primary)" : "none",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "12px",
                            color: "white",
                            transition: "all 0.3s ease"
                          }}>
                            {isCompleted ? "✓" : ""}
                          </div>
                          <span style={{
                            fontSize: "10px",
                            marginTop: "8px",
                            textAlign: "center",
                            fontWeight: isCurrent ? "bold" : "normal",
                            color: isCurrent ? "var(--text-primary)" : "var(--text-secondary)"
                          }}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
