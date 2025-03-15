import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/Authcontext";
import Timer from "./Timer";
import "../style/CollaborativeCapsuleTree.css";

const CollaborativeCapsuleTree = () => {
  const { token } = useContext(AuthContext);
  const [collabCapsules, setCollabCapsules] = useState([]);

  useEffect(() => {
    const fetchCollaborativeCapsules = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/capsules", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const capsulesData =
          res.data?.collaborative ||
          res.data?.filter((c) => c.type === "collaborative") ||
          [];
        setCollabCapsules(capsulesData);
      } catch (error) {
        console.error("Error fetching collaborative capsules:", error.response?.data || error.message);
      }
    };

    if (token) fetchCollaborativeCapsules();
  }, [token]);

  return (
    <div className="collab-capsule-tree">
      <h2>Collaborative Capsules</h2>
      {collabCapsules.length === 0 ? (
        <p>No collaborative capsules found.</p>
      ) : (
        collabCapsules.map((capsule) => {
          const currentTime = new Date();
          const capsuleLockTime = capsule.lockDate ? new Date(capsule.lockDate) : null;
          const isCapsuleLocked = capsuleLockTime ? capsuleLockTime > currentTime : false;

          return (
            <div key={capsule._id} className="collab-capsule">
              <div className="capsule-header">
                <a href={`/capsules/${capsule._id}`} className="capsule-title-link">
                  <h3>{capsule.title || "Untitled Capsule"}</h3>
                </a>
                <div className="capsule-details">
                  <p className="capsule-members">
                    <strong>Members:</strong>{" "}
                    {capsule.memberDetails && capsule.memberDetails.length > 0
                      ? capsule.memberDetails.map((m) => `${m.name} (${m.email})`).join(", ")
                      : capsule.members && capsule.members.length > 0
                      ? capsule.members.map((member) => member.email || "Unknown Email").join(", ")
                      : "No members found"}
                  </p>
                  <div className="capsule-entries">
                    {capsule.entries && capsule.entries.length > 0 ? (
                      capsule.entries.map((entry) => {
                        const isEntryLocked = entry.lockDate && new Date(entry.lockDate) > currentTime;
                        return (
                          <div key={entry._id} className="entry-summary">
                            {isEntryLocked ? (
                              <Timer targetDate={entry.lockDate} />
                            ) : (
                              "Unlocked"
                            )}
                            {" - Added by "}
                            {entry.createdBy?.email || entry.createdBy || "Unknown"}
                          </div>
                        );
                      })
                    ) : (
                      <p>No memory entries added by members</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CollaborativeCapsuleTree;
