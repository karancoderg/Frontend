import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/Authcontext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../style/Login.css"; // Your existing styling
import axios from "axios";

const Login = () => {
  const { login, user, setUserAndToken } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [redirectMessage, setRedirectMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect parameters
  useEffect(() => {
    // Check for redirect in query params
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    
    // Check for message in location state
    const message = location.state?.message;
    
    if (message) {
      setRedirectMessage(message);
    } else {
      // Clear any previous redirect message if there's no message in the state
      setRedirectMessage("");
    }
    
    // Store the redirect path in session storage
    if (redirectPath) {
      sessionStorage.setItem("redirectAfterLogin", redirectPath);
    }
  }, [location]);

  // If user is already logged in, redirect to Dashboard or the redirect path
  useEffect(() => {
    if (user) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setError("");

    try {
      // Convert email to lowercase before sending
      const userData = { email: email.toLowerCase(), password };
      const data = await login(userData);
      
      // Redirect will be handled by the useEffect above
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/request-login-otp", {
        email: email.toLowerCase()
      });
      
      setShowOtpForm(true);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP");
      console.error("OTP request error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login-with-otp", {
        email: email.toLowerCase(),
        otp
      });
      
      // Get token and user data from response
      const { token, user } = response.data;
      
      // Set user and token in context
      setUserAndToken(user, token);
      
      // Redirect will be handled by the useEffect above
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
      console.error("OTP login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === "password" ? "otp" : "password");
    setShowOtpForm(false);
    setError("");
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      
      {redirectMessage && (
        <div className="redirect-message">
          {redirectMessage}
        </div>
      )}
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="login-method-toggle">
        <button 
          className={loginMethod === "password" ? "active" : ""}
          onClick={() => setLoginMethod("password")}
        >
          Password Login
        </button>
        <button 
          className={loginMethod === "otp" ? "active" : ""}
          onClick={() => setLoginMethod("otp")}
        >
          OTP Login
        </button>
      </div>

      {loginMethod === "password" ? (
        <form onSubmit={handlePasswordLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className={isSubmitting ? "submitting" : ""}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        !showOtpForm ? (
          <form onSubmit={handleRequestOTP}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className={isSubmitting ? "submitting" : ""}
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpLogin}>
            <p>Please enter the verification code sent to {email}</p>
            <input
              type="text"
              placeholder="Verification Code"
              onChange={(e) => setOtp(e.target.value)}
              value={otp}
              className="otp-input"
              maxLength="6"
              required
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className={isSubmitting ? "submitting" : ""}
            >
              {isSubmitting ? "Verifying..." : "Login"}
            </button>
          </form>
        )
      )}

      {/* Forgot Password Link */}
      <div className="forgot-password">
        <Link to="/forgot-password" className="forgot-password-link">
          Forgot Password?
        </Link>
      </div>
    </div>
  );
};

export default Login;
