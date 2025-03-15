import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  // Check if the user is coming from an external link
  const isExternalNavigation = () => {
    // Check if there's a referrer and if it's from a different domain
    if (document.referrer) {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = window.location;
      return referrerUrl.host !== currentUrl.host;
    }
    
    // Check if this is a direct navigation (no referrer)
    return !document.referrer && !sessionStorage.getItem('internalNavigation');
  };

  useEffect(() => {
    // Wait for the auth context to finish loading
    if (!loading) {
      setIsChecking(false);
    }
    
    // Mark that we've had internal navigation in this session
    sessionStorage.setItem('internalNavigation', 'true');
  }, [loading]);

  if (isChecking) {
    // Show loading state while checking authentication
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!token || !user) {
    // Determine if we should show the login message
    const showLoginMessage = isExternalNavigation() || 
                            location.pathname.includes('/capsules/');
    
    // If not authenticated, redirect to login with the return URL
    return (
      <Navigate 
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`} 
        state={{ 
          from: location, 
          message: showLoginMessage ? "Please log in to access this content" : null 
        }} 
        replace 
      />
    );
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute; 