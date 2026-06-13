import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
    const [isSignup, setIsSignup] = useState(false);
    const [isForgot, setIsForgot] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = verify otp & set new password
    const [isVerifyEmail, setIsVerifyEmail] = useState(false);
    const [showResendOtp, setShowResendOtp] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [role, setRole] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setShowResendOtp(false);
        setLoading(true);

        try {
            if (isForgot) {
                if (forgotStep === 1) {
                    // Send forgot password OTP
                    const res = await axios.post("http://localhost:5000/api/v1/forgot-password-otp", { email });
                    if (res.data.success) {
                        setMessage("Reset OTP sent to your email.");
                        setForgotStep(2);
                    } else {
                        setError(res.data.message || "Failed to send reset OTP");
                    }
                } else {
                    // Reset password with OTP
                    const res = await axios.post("http://localhost:5000/api/v1/reset-password", { email, otp, password });
                    if (res.data.success) {
                        setMessage("Password updated successfully! Please log in.");
                        setIsForgot(false);
                        setIsSignup(false);
                        setForgotStep(1);
                        setPassword("");
                        setOtp("");
                    } else {
                        setError(res.data.message || "Password reset failed");
                    }
                }
            } else if (isVerifyEmail) {
                // Verify email OTP
                const res = await axios.post("http://localhost:5000/api/v1/verify-email", { email, otp });
                if (res.data.success) {
                    setMessage("Email verified successfully! Please log in.");
                    setIsVerifyEmail(false);
                    setIsSignup(false);
                    setOtp("");
                    setPassword("");
                } else {
                    setError(res.data.message || "Email verification failed");
                }
            } else {
                // Sign up or Log in
                const endpoint = isSignup ? "signup" : "login";
                const data = isSignup 
                    ? { name, email, password, role } 
                    : { email, password };

                const res = await axios.post(`http://localhost:5000/api/v1/${endpoint}`, data);

                if (res.data.success) {
                    if (isSignup) {
                        setMessage(res.data.message || "Registered successfully! Check your email for OTP.");
                        setIsVerifyEmail(true);
                    } else {
                        localStorage.setItem("token", res.data.token);
                        localStorage.setItem("user", JSON.stringify(res.data.user));
                        setMessage(res.data.message || "Logged in successfully!");
                        
                        setTimeout(() => {
                            navigate(res.data.user.role === "admin" ? "/admin" : "/");
                        }, 800);
                    }
                } else {
                    setError(res.data.message || "Authentication failed");
                }
            }
        } catch (error) {
            console.error("Auth error details:", error);
            setError(error.response?.data?.message || error.response?.data?.error || "Something went wrong");
            if (error.response?.data?.isUnverified) {
                setShowResendOtp(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await axios.post("http://localhost:5000/api/v1/sendotp", { email });
            if (res.data.success) {
                setMessage("OTP sent! Please verify your email.");
                setIsVerifyEmail(true);
                setShowResendOtp(false);
            } else {
                setError(res.data.message || "Failed to send OTP");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 150px)',
            padding: '20px'
        }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '450px' }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    fontSize: '28px', 
                    fontWeight: 700, 
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                }}>
                    🍕 {isForgot ? "Forgot Password" : (isVerifyEmail ? "Verify Email" : (isSignup ? "Create Account" : "Welcome Back"))}
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    marginBottom: '24px'
                }}>
                    {isForgot 
                        ? "Recover your credentials" 
                        : (isVerifyEmail ? "Check your email for the verification code" : (isSignup ? "Join SliceCraft and customize your perfect slice" : "Log in to check pizza stock and track orders"))}
                </p>

                <form onSubmit={submitHandler}>
                    {/* SignUp Fields */}
                    {isSignup && !isForgot && !isVerifyEmail && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input 
                                type="text" 
                                placeholder="Jane Doe" 
                                value={name} 
                                required
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    {isSignup && !isForgot && !isVerifyEmail && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Account Type</label>
                            <select 
                                value={role} 
                                required 
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="">Select Role</option>
                                <option value="user">User (Customer)</option>
                                <option value="admin">Admin (Manager)</option>
                            </select>
                        </div>
                    )}

                    {/* Email Field (Required for all states except verify email where it's read-only) */}
                    {(!isForgot || forgotStep === 1) && !isVerifyEmail && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Email Address</label>
                            <input 
                                type="email" 
                                placeholder="jane.doe@example.com" 
                                value={email} 
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Email verification step */}
                    {isVerifyEmail && (
                        <div style={{ animation: 'fadeIn 0.3s ease', marginBottom: '12px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Enter the OTP sent to <b>{email}</b>.
                            </p>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Enter 6-Digit OTP</label>
                            <input 
                                type="text" 
                                placeholder="123456" 
                                value={otp} 
                                required
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Forgot Password OTP Verification Step */}
                    {isForgot && forgotStep === 2 && (
                        <div style={{ animation: 'fadeIn 0.3s ease', marginBottom: '12px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Enter the OTP sent to <b>{email}</b> and set your new password.
                            </p>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Enter 6-Digit OTP</label>
                            <input 
                                type="text" 
                                placeholder="123456" 
                                value={otp} 
                                required
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Password Field (Required for Login, reset Step 2, and Signup) */}
                    {(!isForgot || forgotStep === 2) && !isVerifyEmail && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                {isForgot ? "New Password" : "Password"}
                            </label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                        disabled={loading}
                    >
                        {loading 
                            ? "Processing..." 
                            : (isForgot 
                                ? (forgotStep === 1 ? "Send Reset Code" : "Update Password")
                                : (isVerifyEmail ? "Verify Email" : (isSignup ? "Create Free Account" : "Log In Securely")))}
                    </button>

                    {/* Messages */}
                    {error && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid var(--danger)', 
                            borderRadius: '6px', 
                            color: 'var(--danger)',
                            fontSize: '14px'
                        }}>
                            ⚠️ {error}
                            {showResendOtp && (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ marginTop: '10px', width: '100%', padding: '8px' }}
                                    onClick={handleResendOtp}
                                >
                                    Resend OTP & Verify
                                </button>
                            )}
                        </div>
                    )}

                    {message && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                            border: '1px solid var(--success)', 
                            borderRadius: '6px', 
                            color: 'var(--success)',
                            fontSize: '14px'
                        }}>
                            ✓ {message}
                        </div>
                    )}

                    {/* Navigation Links */}
                    <div style={{ 
                        marginTop: '24px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '10px',
                        alignItems: 'center',
                        fontSize: '14px'
                    }}>
                        {!isForgot && !isVerifyEmail ? (
                            <>
                                <span 
                                    onClick={() => {
                                        setIsSignup(prev => !prev);
                                        setError("");
                                        setMessage("");
                                    }}
                                    style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
                                </span>
                                {!isSignup && (
                                    <span 
                                        onClick={() => {
                                            setIsForgot(true);
                                            setForgotStep(1);
                                            setError("");
                                            setMessage("");
                                        }}
                                        style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    >
                                        Forgot Password?
                                    </span>
                                )}
                            </>
                        ) : (
                            <span 
                                onClick={() => {
                                    setIsForgot(false);
                                    setIsVerifyEmail(false);
                                    setForgotStep(1);
                                    setError("");
                                    setMessage("");
                                }}
                                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Back to Log In
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
