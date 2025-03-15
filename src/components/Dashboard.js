import { useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import { Link } from "react-router-dom";
import "../style/Dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      {user ? (
        <>
          <p>Welcome, {user.name}</p>
          <div className="create-capsule-option">
            <h3>Create Capsule</h3>
            <Link to="/create-personal-capsule">
              <button>Personal Capsule</button>
            </Link>
            <Link to="/create-collaborative-capsule">
              <button>Collaborative Capsule</button>
            </Link>
          </div>
          <div className="view-capsules-option">
            <h3>View Capsules</h3>
            <Link to="/view-personal-capsules">
              <button>Personal Capsules</button>
            </Link>
            <Link to="/view-collaborative-capsules">
              <button>Collaborative Capsules</button>
            </Link>
          </div>
        </>
      ) : (
        <p>Please log in to view your dashboard.</p>
      )}
    </div>
  );
};

export default Dashboard;
