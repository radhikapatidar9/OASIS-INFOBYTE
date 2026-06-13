import { useState, useEffect } from "react";
import IngredientList from "../components/IngredientList";
import axios from "axios";
import "../cssFiles/customPizza.css";
import { useLocation, useNavigate } from "react-router-dom";

export default function CustomizePizza() {
    const navigate = useNavigate();
    const location = useLocation();

    // Verify authentication
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/authform");
        }
    }, [navigate]);

    // Initial pizza variety if passed from dashboard selection
    const initialPizza = location.state?.pizza || null;

    const [step, setStep] = useState(1);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedBase, setSelectedBase] = useState(null);
    const [selectedSauce, setSelectedSauce] = useState(null);
    const [selectedCheese, setSelectedCheese] = useState(null);
    const [selectedVeggie, setSelectedVeggie] = useState(null);
    const [selectedMeat, setSelectedMeat] = useState(null);

    // Payment & checkout state
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [showMockModal, setShowMockModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const getAllIngredients = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                "http://localhost:5000/api/v1/getallingredient"
            );
            setIngredients(response.data.allIngredient || []);
        } catch (err) {
            console.error("Error loading ingredients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAllIngredients();
    }, []);

    const bases = ingredients.filter(item => item.type === "BASE");
    const sauces = ingredients.filter(item => item.type === "SAUCE");
    const cheeses = ingredients.filter(item => item.type === "CHEESE");
    const veggies = ingredients.filter(item => item.type === "VEGGIE");
    const meats = ingredients.filter(item => item.type === "MEAT");

    const handleNext = () => {
        if (step === 1 && !selectedBase) {
            alert("Please select a base");
            return;
        }
        if (step === 2 && !selectedSauce) {
            alert("Please select a sauce");
            return;
        }
        if (step === 3 && !selectedCheese) {
            alert("Please select a cheese");
            return;
        }
        if (step === 4 && !selectedVeggie) {
            alert("Please select a veggie");
            return;
        }
        if (step === 5 && !selectedMeat) {
            alert("Please select a meat");
            return;
        }
        setStep(prev => prev + 1);
    };

    const handlePrevious = () => {
        setStep(prev => prev - 1);
    };

    // Calculate total price
    const basePrice = initialPizza?.basePrice || 0;
    const ingredientsPrice =
        (selectedBase?.price || 0) +
        (selectedSauce?.price || 0) +
        (selectedCheese?.price || 0) +
        (selectedVeggie?.price || 0) +
        (selectedMeat?.price || 0);
    const totalPrice = basePrice + ingredientsPrice;

    // Helper: Dynamically load Razorpay SDK script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Main checkout flow
    const handleCheckout = async () => {
        setCheckoutLoading(true);
        setError("");
        setSuccessMessage("");

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Session expired. Please log in again.");
            setCheckoutLoading(false);
            return;
        }

        try {
            // 1. Create order on backend
            const orderRes = await axios.post(
                "http://localhost:5000/api/v1/create-order",
                { amount: totalPrice },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!orderRes.data.success) {
                setError(orderRes.data.message || "Failed to initiate transaction");
                setCheckoutLoading(false);
                return;
            }

            const paymentData = orderRes.data;
            setPaymentDetails(paymentData);

            if (paymentData.isMock) {
                // If backend returned simulation mode (credentials empty/mock)
                setShowMockModal(true);
                setCheckoutLoading(false);
            } else {
                // Real Razorpay checkout flow
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    setError("Razorpay SDK failed to load. Are you offline?");
                    setCheckoutLoading(false);
                    return;
                }

                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

                const options = {
                    key: paymentData.keyId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    name: "SliceCraft Pizza",
                    description: "Custom Pizza Order Payment",
                    order_id: paymentData.orderId,
                    handler: async (response) => {
                        try {
                            setCheckoutLoading(true);
                            const verifyRes = await axios.post(
                                "http://localhost:5000/api/v1/verify-payment",
                                {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    amount: totalPrice,
                                    items: [{
                                        pizzaVariety: initialPizza?._id || null,
                                        ingredients: [
                                            selectedBase._id,
                                            selectedSauce._id,
                                            selectedCheese._id,
                                            selectedVeggie._id,
                                            selectedMeat._id,
                                        ],
                                        quantity: 1
                                    }],
                                    isMock: false
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            if (verifyRes.data.success) {
                                setSuccessMessage("Order Placed Successfully!");
                                setTimeout(() => {
                                    navigate("/orders");
                                }, 1500);
                            } else {
                                setError(verifyRes.data.message || "Payment verification failed");
                            }
                        } catch (e) {
                            setError(e.response?.data?.message || "Error verifying payment");
                        } finally {
                            setCheckoutLoading(false);
                        }
                    },
                    prefill: {
                        name: `${storedUser.firstName} ${storedUser.lastName}`,
                        email: storedUser.email,
                    },
                    theme: {
                        color: "#ea580c"
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                setCheckoutLoading(false);
            }

        } catch (e) {
            console.error(e);
            setError(e.response?.data?.message || "Failed to process payment checkout");
            setCheckoutLoading(false);
        }
    };

    // Execute mock success callback
    const handleMockPaymentSuccess = async () => {
        setCheckoutLoading(true);
        setError("");
        setShowMockModal(false);

        const token = localStorage.getItem("token");

        try {
            const verifyRes = await axios.post(
                "http://localhost:5000/api/v1/verify-payment",
                {
                    razorpay_order_id: paymentDetails.orderId,
                    razorpay_payment_id: `pay_mock_${Date.now()}`,
                    razorpay_signature: "mock_signature",
                    amount: totalPrice,
                    items: [{
                        pizzaVariety: initialPizza?._id || null,
                        ingredients: [
                            selectedBase._id,
                            selectedSauce._id,
                            selectedCheese._id,
                            selectedVeggie._id,
                            selectedMeat._id,
                        ],
                        quantity: 1
                    }],
                    isMock: true
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
                setSuccessMessage("Order Placed Successfully via Simulated Payment!");
                setTimeout(() => {
                    navigate("/orders");
                }, 1500);
            } else {
                setError(verifyRes.data.message || "Failed to place simulated order");
            }
        } catch (e) {
            setError(e.response?.data?.message || "Error placing simulated order");
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <h2>🍕 Baking ingredients list...</h2>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", animation: 'fadeIn 0.4s ease' }}>
            {/* Step Progress bar */}
            <div className="glass-card" style={{ marginBottom: "30px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "5%",
                        right: "5%",
                        height: "4px",
                        backgroundColor: "var(--bg-tertiary)",
                        transform: "translateY(-50%)",
                        zIndex: 1
                    }}>
                        <div style={{
                            width: `${((step - 1) / 5) * 100}%`,
                            height: "100%",
                            backgroundColor: "var(--primary)",
                            transition: "width 0.3s ease"
                        }}></div>
                    </div>
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                        <div
                            key={s}
                            style={{
                                zIndex: 2,
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: step >= s ? "var(--primary)" : "var(--bg-tertiary)",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontWeight: "bold",
                                border: step === s ? "3px solid white" : "none",
                                transition: "all 0.3s ease",
                                color: "white"
                            }}
                        >
                            {s === 6 ? "🏁" : s}
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", color: "var(--text-secondary)", fontSize: "12px" }}>
                    <span>Base</span>
                    <span>Sauce</span>
                    <span>Cheese</span>
                    <span>Veggie</span>
                    <span>Meat</span>
                    <span>Summary</span>
                </div>
            </div>

            {/* Customization steps */}
            <div style={{ minHeight: "350px" }}>
                {step === 1 && (
                    <IngredientList
                        title="Choose Pizza Base"
                        ingredients={bases}
                        selectedItem={selectedBase}
                        onSelect={setSelectedBase}
                    />
                )}
                {step === 2 && (
                    <IngredientList
                        title="Choose Sauce"
                        ingredients={sauces}
                        selectedItem={selectedSauce}
                        onSelect={setSelectedSauce}
                    />
                )}
                {step === 3 && (
                    <IngredientList
                        title="Choose Cheese"
                        ingredients={cheeses}
                        selectedItem={selectedCheese}
                        onSelect={setSelectedCheese}
                    />
                )}
                {step === 4 && (
                    <IngredientList
                        title="Choose Veggies"
                        ingredients={veggies}
                        selectedItem={selectedVeggie}
                        onSelect={setSelectedVeggie}
                    />
                )}
                {step === 5 && (
                    <IngredientList
                        title="Choose Meat"
                        ingredients={meats}
                        selectedItem={selectedMeat}
                        onSelect={setSelectedMeat}
                    />
                )}
                {step === 6 && (
                    <div className="summary_card glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                            🍕 Order Summary
                        </h2>

                        {initialPizza && (
                            <div className="summary_row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Signature Base ({initialPizza.name})</span>
                                <span style={{ fontWeight: '600' }}>₹{initialPizza.basePrice}</span>
                            </div>
                        )}

                        <div className="summary_row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Selected Base</span>
                            <span style={{ fontWeight: '600' }}>{selectedBase?.name} (₹{selectedBase?.price})</span>
                        </div>

                        <div className="summary_row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Selected Sauce</span>
                            <span style={{ fontWeight: '600' }}>{selectedSauce?.name} (₹{selectedSauce?.price})</span>
                        </div>

                        <div className="summary_row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Selected Cheese</span>
                            <span style={{ fontWeight: '600' }}>{selectedCheese?.name} (₹{selectedCheese?.price})</span>
                        </div>

                        <div className="summary_row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Selected Veggies</span>
                            <span style={{ fontWeight: '600' }}>{selectedVeggie?.name} (₹{selectedVeggie?.price})</span>
                        </div>

                        <div className="summary_row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Selected Meat</span>
                            <span style={{ fontWeight: '600' }}>{selectedMeat?.name} (₹{selectedMeat?.price})</span>
                        </div>

                        <div style={{ borderTop: '2px solid var(--primary)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Amount</span>
                            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>₹{totalPrice}</span>
                        </div>

                        {error && (
                            <div style={{ color: 'var(--danger)', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {successMessage && (
                            <div style={{ color: 'var(--success)', marginBottom: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px' }}>
                                ✓ {successMessage}
                            </div>
                        )}

                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px' }}
                            onClick={handleCheckout}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading ? "Processing payment secure window..." : `Pay ₹${totalPrice} & Place Order`}
                        </button>
                    </div>
                )}
            </div>

            {/* Step navigation buttons */}
            <div
                style={{
                    marginTop: "30px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "15px"
                }}
            >
                {step > 1 && step < 6 && (
                    <button className="btn-secondary" onClick={handlePrevious}>
                        ← Back
                    </button>
                )}

                {step < 6 && (
                    <button className="btn-primary" onClick={handleNext}>
                        Continue →
                    </button>
                )}
            </div>

            {/* Sandbox payment simulator modal */}
            {showMockModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '480px', border: '2px solid var(--primary)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '48px' }}>💳</span>
                            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '10px' }}>Razorpay Sandbox Simulator</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                Razorpay test mode is active because credentials are set to sandbox.
                            </p>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
                                <span style={{ fontFamily: 'monospace' }}>{paymentDetails?.orderId}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Amount to Pay:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{totalPrice}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                className="btn-primary"
                                style={{ width: '100%', padding: '12px', background: 'var(--success)' }}
                                onClick={handleMockPaymentSuccess}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? "Baking Order..." : "Simulate Payment Success"}
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', padding: '12px' }}
                                onClick={() => {
                                    setShowMockModal(false);
                                    setCheckoutLoading(false);
                                }}
                                disabled={checkoutLoading}
                            >
                                Cancel Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
