import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import "../style/Register.css";
import axios from "axios";

const Register = () => {
  const { register, setUserAndToken } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength("");
      return;
    }

    // Check password strength
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    let strength = "";
    let score = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;

    if (score === 0) strength = "";
    else if (score <= 2) strength = "weak";
    else if (score <= 4) strength = "medium";
    else strength = "strong";

    setPasswordStrength(strength);
  }, [password]);

  // Check if passwords match
  useEffect(() => {
    if (!confirmPassword) {
      setPasswordMatch(true);
      return;
    }
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    // Validate form
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Optionally, convert email to lowercase on the frontend too
      const userData = { 
        name, 
        email: email.toLowerCase(), 
        password,
        confirmPassword
      };
      
      const response = await register(userData);
      setRegisteredEmail(email);
      setShowOtpForm(true);
    } catch (error) {
      // Display error message returned from backend
      setError(error.response?.data?.message || "Registration failed");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/verify-registration", {
        email: registeredEmail,
        otp
      });

      // Store token and user data
      const { token, user } = response.data;
      
      // Set user and token in context (this will log the user in)
      setUserAndToken(user, token);
      
      // Show success message
      alert("Account verified successfully! You are now logged in.");
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Verification failed");
      console.error("OTP verification error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {!showOtpForm ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
          <div className="password-container">
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            {password && (
              <div className={`password-strength ${passwordStrength}`}>
                {passwordStrength && `Password strength: ${passwordStrength}`}
              </div>
            )}
            {password && (
              <div className="password-requirements">
                Password must contain at least 8 characters, including uppercase, lowercase, and numbers.
              </div>
            )}
          </div>
          <div className="password-container">
            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              required
            />
            {confirmPassword && !passwordMatch && (
              <div className="password-mismatch">
                Passwords do not match
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || !passwordMatch}
            className={isSubmitting ? "submitting" : ""}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <p>Please enter the verification code sent to {registeredEmail}</p>
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
            {isSubmitting ? "Verifying..." : "Verify Account"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Register;
