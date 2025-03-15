import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import "../style/CollaborativeCapsule.css";

const CollaborativeCapsule = () => {
  const { token } = useContext(AuthContext);
  const [capsuleData, setCapsuleData] = useState({
    title: "",         // Group Name
    description: "",   // Description
    lockDate: ""       // Unlock date
  });
  const [memberInput, setMemberInput] = useState(""); // e.g., "John Doe <john@example.com>, Jane Doe <jane@example.com>"
  const [error, setError] = useState("");
  const [memberStatus, setMemberStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCapsuleData({ ...capsuleData, [e.target.name]: e.target.value });
  };

  const handleMemberInputChange = (e) => {
    setMemberInput(e.target.value);
    // Clear member status when input changes
    if (memberStatus) {
      setMemberStatus(null);
    }
  };

  // Function to parse member input string into an array of objects
  const parseMemberInput = (input) => {
    return input.split(",").map((item) => {
      const trimmed = item.trim();
      const match = trimmed.match(/(.*)<(.*)>/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      } else {
        return { name: "Unknown", email: trimmed };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring click");
      return;
    }
    
    setError("");
    setMemberStatus(null);

    if (!memberInput.trim()) {
      setError("At least one member is required.");
      return;
    }

    setIsSubmitting(true);
    console.log("Starting capsule creation process...");

    try {
      const members = parseMemberInput(memberInput); // Parse the member input
      
      const payload = {
        ...capsuleData,
        memberEmails: members, // This array now contains objects with { name, email }
        type: "collaborative",
      };

      console.log("Creating collaborative capsule with payload:", payload);
      const res = await axios.post("http://localhost:5000/api/capsules", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Capsule created successfully:", res.data);
      
      // Check if there are any members not found
      if (res.data.memberStatus && res.data.memberStatus.notFound && res.data.memberStatus.notFound.length > 0) {
        setMemberStatus(res.data.memberStatus);
        // Don't navigate away if there are warnings to show
      } else {
        alert("Collaborative capsule group created successfully!");
        navigate("/"); // Redirect to Dashboard after creation
      }
    } catch (error) {
      console.error("Error creating collaborative capsule:", error.response?.data || error.message);
      
      if (error.response?.data?.notFoundMembers) {
        setMemberStatus({
          found: [],
          notFound: error.response.data.notFoundMembers
        });
      }
      
      setError(error.response?.data?.message || error.message || "Error creating capsule");
    } finally {
      console.log("Capsule creation process completed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="collaborative-capsule-container">
      <h2>Create Collaborative Capsule Group</h2>
      
      {memberStatus && (
        <div className="member-status">
          {memberStatus.notFound && memberStatus.notFound.length > 0 && (
            <div className="not-found-members">
              <h4>The following members were not found in the system:</h4>
              <ul>
                {memberStatus.notFound.map((member, index) => (
                  <li key={index}>
                    {member.name} &lt;{member.email}&gt;
                  </li>
                ))}
              </ul>
              <p>Please ensure these users are registered before adding them to the capsule.</p>
              {memberStatus.found && memberStatus.found.length > 0 && (
                <div className="success-message">
                  <p>Capsule created successfully with the following members:</p>
                  <ul>
                    {memberStatus.found.map((member, index) => (
                      <li key={index}>
                        {member.name} &lt;{member.email}&gt;
                      </li>
                    ))}
                  </ul>
                  <button 
                    className="continue-button" 
                    onClick={() => navigate("/")}
                  >
                    Continue to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Group Name"
          value={capsuleData.title}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={capsuleData.description}
          onChange={handleChange}
          disabled={isSubmitting}
        ></textarea>
        <input
          type="date"
          name="lockDate"
          placeholder="Unlock Date (YYYY-MM-DD)"
          value={capsuleData.lockDate}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
        <input
          type="text"
          name="memberInput"
          placeholder="Member Details Including Creator (e.g., John Doe <john@example.com>, Jane Doe <jane@example.com>)"
          value={memberInput}
          onChange={handleMemberInputChange}
          required
          disabled={isSubmitting}
        />
        <p className="help-text">
          Note: All members must have registered accounts in the system.
        </p>
        {error && <p className="error-message">{error}</p>}
        <button 
          type="submit"
          disabled={isSubmitting}
          className={isSubmitting ? "submitting" : ""}
        >
          {isSubmitting ? "Creating Capsule..." : "Create Collaborative Capsule"}
        </button>
      </form>
    </div>
  );
};

export default CollaborativeCapsule;
