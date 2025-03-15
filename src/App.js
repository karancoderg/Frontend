import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/Authcontext";
import { useContext } from "react";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PersonalCapsule from "./components/PersonalCapsule"; // Capsule creation for personal capsules
import CollaborativeCapsule from "./components/CollaborativeCapsule"; // Capsule creation for collaborative capsules
import CapsuleManager from "./components/CapsuleManager"; // (Optional: list view for capsules)
import CapsuleDetail from "./components/CapsuleDetail"; // Detail view for a single capsule
import PersonalCapsuleTree from "./components/PersonalCapsuleTree"; // Tree view for personal capsules
import CollaborativeCapsuleTree from "./components/CollaborativeCapsuleTree"; // Tree view for collaborative capsules
import ForgotPassword from "./components/forgot-password"; // New Forgot Password page
import ResetPassword from "./components/reset-password/[token]"; // New Reset Password page
import ProtectedRoute from "./components/ProtectedRoute"; // Protected route wrapper
import "./App.css";

// Loading component
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Main app with routes
const AppRoutes = () => {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/create-personal-capsule" element={
          <ProtectedRoute>
            <PersonalCapsule />
          </ProtectedRoute>
        } />
        <Route path="/create-collaborative-capsule" element={
          <ProtectedRoute>
            <CollaborativeCapsule />
          </ProtectedRoute>
        } />
        <Route path="/capsules" element={
          <ProtectedRoute>
            <CapsuleManager />
          </ProtectedRoute>
        } />
        <Route path="/capsules/:capsuleId" element={
          <ProtectedRoute>
            <CapsuleDetail />
          </ProtectedRoute>
        } />
        <Route path="/view-personal-capsules" element={
          <ProtectedRoute>
            <PersonalCapsuleTree />
          </ProtectedRoute>
        } />
        <Route path="/view-collaborative-capsules" element={
          <ProtectedRoute>
            <CollaborativeCapsuleTree />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
