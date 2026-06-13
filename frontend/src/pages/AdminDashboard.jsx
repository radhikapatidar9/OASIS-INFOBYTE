import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "inventory"
  
  // Inventory state
  const [ingredients, setIngredients] = useState([]);
  const [newIngName, setNewIngName] = useState("");
  const [newIngType, setNewIngType] = useState("");
  const [newIngPrice, setNewIngPrice] = useState("");
  const [newIngStock, setNewIngStock] = useState("");
  const [newIngImage, setNewIngImage] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  
  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Verify Admin Authentication
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken) {
      navigate("/authform");
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "admin") {
      navigate("/");
    }
  }, [navigate]);

  const fetchData = async () => {
    setError("");
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      // Fetch all ingredients
      const ingRes = await axios.get("http://localhost:5000/api/v1/getallingredient");
      setIngredients(ingRes.data.allIngredient || []);

      // Fetch all orders
      const orderRes = await axios.get("http://localhost:5000/api/v1/orders/all-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(orderRes.data.orders || []);

      // Fetch analytics
      const analyticsRes = await axios.get("http://localhost:5000/api/v1/analytics/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching store data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle restock count update
  const handleRestock = async (ingredient, amount) => {
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      alert("Please enter a valid stock amount to add.");
      return;
    }
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    
    try {
      const newStock = parseInt(ingredient.stock) + parseInt(amount);
      const res = await axios.put("http://localhost:5000/api/v1/updateingredient", 
        {
          id: ingredient._id,
          name: ingredient.name,
          type: ingredient.type,
          price: ingredient.price,
          stock: newStock
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess(`Restocked ${ingredient.name} successfully!`);
        fetchData();
      } else {
        setError(res.data.message || "Failed to update stock");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error updating stock");
    }
  };

  // Add new ingredient
  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = localStorage.getItem("token");
    if (!newIngImage) {
      setError("Please select an image file for the ingredient.");
      setActionLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newIngName);
      formData.append("type", newIngType);
      formData.append("price", newIngPrice);
      formData.append("stock", newIngStock);
      formData.append("image", newIngImage);

      const res = await axios.post("http://localhost:5000/api/v1/createingredient", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        setSuccess(`Successfully added ingredient: ${newIngName}`);
        setNewIngName("");
        setNewIngType("");
        setNewIngPrice("");
        setNewIngStock("");
        setNewIngImage(null);
        // Reset file input element
        document.getElementById("ingredient-image-file").value = "";
        fetchData();
      } else {
        setError(res.data.message || "Failed to create ingredient");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error adding ingredient");
    } finally {
      setActionLoading(false);
    }
  };

  // Update customer order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    
    try {
      const res = await axios.put("http://localhost:5000/api/v1/orders/update-status", 
        { orderId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess(`Order status updated to '${newStatus}'`);
        fetchData();
      } else {
        setError(res.data.message || "Failed to update order status");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error updating status");
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "800" }}>⚙️ Store Management Admin Console</h2>
        <button className="btn-secondary" onClick={fetchData} style={{ padding: "8px 16px" }}>
          🔄 Refresh Data
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
            <h4 style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "14px" }}>Total Orders</h4>
            <span style={{ fontSize: "28px", fontWeight: "bold" }}>{analytics.totalOrders}</span>
          </div>
          <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
            <h4 style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "14px" }}>Total Revenue</h4>
            <span style={{ fontSize: "28px", fontWeight: "bold", color: "var(--primary)" }}>₹{analytics.revenue}</span>
          </div>
          <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
            <h4 style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "14px" }}>Pending Deliveries</h4>
            <span style={{ fontSize: "28px", fontWeight: "bold", color: "var(--warning)" }}>{analytics.pendingOrders}</span>
          </div>
          <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
            <h4 style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "14px" }}>Low Stock Alerts</h4>
            <span style={{ fontSize: "28px", fontWeight: "bold", color: analytics.lowStockCount > 0 ? "var(--danger)" : "var(--success)" }}>
              {analytics.lowStockCount}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: "var(--danger)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ color: "var(--success)", backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
          ✓ {success}
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <button 
          className="btn-secondary"
          onClick={() => setActiveTab("orders")}
          style={{
            backgroundColor: activeTab === "orders" ? "var(--primary)" : "var(--bg-tertiary)",
            color: "white",
            border: "none",
            borderRadius: "8px"
          }}
        >
          📦 Customer Orders ({orders.length})
        </button>
        <button 
          className="btn-secondary"
          onClick={() => setActiveTab("inventory")}
          style={{
            backgroundColor: activeTab === "inventory" ? "var(--primary)" : "var(--bg-tertiary)",
            color: "white",
            border: "none",
            borderRadius: "8px"
          }}
        >
          🍕 Inventory Stock Management ({ingredients.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <h2>🍕 Fetching records...</h2>
        </div>
      ) : (
        <>
          {/* TAB 1: Orders System */}
          {activeTab === "orders" && (
            <div className="glass-card">
              <h3 style={{ fontSize: "20px", marginBottom: "20px", fontWeight: "bold" }}>Fulfillment Tracking Board</h3>
              {orders.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>No orders placed in the system yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                        <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>ORDER ID</th>
                        <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>CUSTOMER</th>
                        <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>ITEMS</th>
                        <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>AMOUNT</th>
                        <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>STATUS</th>
                        <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "14px", textAlign: "right" }}>UPDATE STEP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "16px 12px", fontFamily: "monospace", fontSize: "13px" }}>
                            {order._id}
                          </td>
                          <td style={{ padding: "16px 12px", fontSize: "14px" }}>
                            {order.user ? (
                              <>
                                <b>{order.user.name}</b>
                                <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)" }}>{order.user.email}</span>
                              </>
                            ) : (
                              <span style={{ color: "var(--danger)" }}>Unknown user</span>
                            )}
                          </td>
                          <td style={{ padding: "16px 12px", maxWidth: "300px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", flexWrap: "wrap", gap: "6px", backgroundColor: "rgba(0,0,0,0.1)", padding: "4px", borderRadius: "4px" }}>
                                  <span style={{ fontSize: "11px", fontWeight: "bold" }}>Qty {item.quantity || 1}:</span>
                                  {item.pizzaVariety && (
                                    <span style={{ fontSize: "11px", backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px" }}>
                                      {item.pizzaVariety.name}
                                    </span>
                                  )}
                                  {item.ingredients && item.ingredients.map((ing) => (
                                    <span key={ing._id} style={{ fontSize: "11px", backgroundColor: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: "4px" }}>
                                      {ing.name}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: "16px 12px", fontWeight: "bold", color: "var(--primary)", fontSize: "15px" }}>
                            ₹{order.amount}
                          </td>
                          <td style={{ padding: "16px 12px" }}>
                            <span className={`badge badge-${order.status.toLowerCase().includes('kitchen') ? 'kitchen' : order.status.toLowerCase().includes('delivery') ? 'delivery' : order.status.toLowerCase().includes('received') ? 'received' : 'delivered'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: "16px 12px", textAlign: "right" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end", maxWidth: "200px" }}>
                              <button 
                                className="btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: order.status === "Order Received" ? "var(--warning)" : "" }}
                                onClick={() => handleUpdateOrderStatus(order._id, "Order Received")}
                              >
                                Received
                              </button>
                              <button 
                                className="btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: order.status === "In Kitchen" ? "#3b82f6" : "" }}
                                onClick={() => handleUpdateOrderStatus(order._id, "In Kitchen")}
                              >
                                Kitchen
                              </button>
                              <button 
                                className="btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: order.status === "Ready For Delivery" ? "#a855f7" : "" }}
                                onClick={() => handleUpdateOrderStatus(order._id, "Ready For Delivery")}
                              >
                                Ready
                              </button>
                              <button 
                                className="btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: order.status === "Out For Delivery" ? "#d946ef" : "" }}
                                onClick={() => handleUpdateOrderStatus(order._id, "Out For Delivery")}
                              >
                                Out
                              </button>
                              <button 
                                className="btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: order.status === "Delivered" ? "var(--success)" : "" }}
                                onClick={() => handleUpdateOrderStatus(order._id, "Delivered")}
                              >
                                Delivered
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Inventory Management */}
          {activeTab === "inventory" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px", alignItems: "start" }}>
              
              {/* Ingredient Stock levels list */}
              <div className="glass-card">
                <h3 style={{ fontSize: "20px", marginBottom: "20px", fontWeight: "bold" }}>Pizza Ingredient Inventory</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {ingredients.map((ing) => {
                    const isLowStock = ing.stock < 20;

                    return (
                      <div 
                        key={ing._id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "16px",
                          backgroundColor: "var(--bg-primary)",
                          borderRadius: "8px",
                          border: isLowStock ? "1px solid var(--danger)" : "1px solid rgba(255,255,255,0.05)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <img src={ing.image} alt={ing.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }} />
                          <div>
                            <h4 style={{ fontWeight: "bold" }}>{ing.name}</h4>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>
                              Type: <b style={{ color: "var(--primary)" }}>{ing.type}</b> | Price: ₹{ing.price}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>STOCK</span>
                            <span style={{ fontSize: "18px", fontWeight: "bold", color: isLowStock ? "var(--danger)" : "var(--success)" }}>
                              {ing.stock}
                            </span>
                            {isLowStock && (
                              <span style={{ display: "block", fontSize: "10px", color: "var(--danger)", fontWeight: "bold" }}>
                                ⚠️ LOW STOCK
                              </span>
                            )}
                          </div>

                          {/* Quick Restock count input */}
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input 
                              type="number" 
                              placeholder="+Qty" 
                              id={`restock-${ing._id}`}
                              style={{ width: "80px", marginBottom: 0, padding: "8px" }}
                            />
                            <button 
                              className="btn-primary" 
                              style={{ padding: "8px 12px" }}
                              onClick={() => {
                                const inputEl = document.getElementById(`restock-${ing._id}`);
                                handleRestock(ing, inputEl.value);
                                inputEl.value = "";
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar form: Add new Ingredient */}
              <div className="glass-card">
                <h3 style={{ fontSize: "20px", marginBottom: "20px", fontWeight: "bold" }}>Add New Ingredient</h3>
                <form onSubmit={handleAddIngredient}>
                  <div>
                    <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ingredient Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mushroom, Extra Virgin Olive Oil" 
                      value={newIngName}
                      required
                      onChange={(e) => setNewIngName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ingredient Type</label>
                    <select 
                      value={newIngType}
                      required
                      onChange={(e) => setNewIngType(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      <option value="BASE">BASE</option>
                      <option value="SAUCE">SAUCE</option>
                      <option value="CHEESE">CHEESE</option>
                      <option value="VEGGIE">VEGGIE</option>
                      <option value="MEAT">MEAT</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Price (INR)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 40" 
                      value={newIngPrice}
                      required
                      onChange={(e) => setNewIngPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Initial Stock Level</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 50" 
                      value={newIngStock}
                      required
                      onChange={(e) => setNewIngStock(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Ingredient Image (Cloudinary)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="ingredient-image-file"
                      required
                      onChange={(e) => setNewIngImage(e.target.files[0])}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ width: "100%", padding: "12px", marginTop: "10px" }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Uploading ingredient image..." : "Upload Ingredient"}
                  </button>
                </form>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
