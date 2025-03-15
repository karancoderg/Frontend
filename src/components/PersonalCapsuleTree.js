import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/Authcontext";
import Timer from "./Timer";
import "../style/PersonalCapsuleTree.css";

const PersonalCapsuleTree = () => {
  const { token } = useContext(AuthContext);
  const [capsules, setCapsules] = useState([]);

  useEffect(() => {
    const fetchPersonalCapsules = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/capsules", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.personal) {
          setCapsules(res.data.personal);
        } else {
          setCapsules(res.data.filter(c => c.type === "personal"));
        }
      } catch (error) {
        console.error("Error fetching personal capsules:", error.response?.data || error.message);
      }
    };

    if (token) fetchPersonalCapsules();
  }, [token]);

  // Group capsules by creation date
  const groupedCapsules = capsules.reduce((acc, capsule) => {
    const dateKey = new Date(capsule.createdAt).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(capsule);
    return acc;
  }, {});

  // Count locked and unlocked capsules
  let lockedCount = 0;
  let unlockedCount = 0;
  capsules.forEach(capsule => {
    if (capsule.lockDate && new Date(capsule.lockDate) > new Date()) {
      lockedCount++;
    } else {
      unlockedCount++;
    }
  });

  return (
    <div className="personal-capsule-tree">
      <h2>Personal Capsules</h2>
      <div className="tree-summary">
        <p>Locked: {lockedCount}</p>
        <p>Unlocked: {unlockedCount}</p>
      </div>
      <div className="tree-container">
        {Object.keys(groupedCapsules).map(dateKey => (
          <div key={dateKey} className="tree-branch">
            <h3 className="tree-date">{dateKey}</h3>
            <ul>
              {groupedCapsules[dateKey].map(capsule => {
                const isLocked = capsule.lockDate && new Date(capsule.lockDate) > new Date();
                return (
                  <li key={capsule._id} className="tree-leaf">
                    <div className="capsule-node">
                      <span className="capsule-title">{capsule.title}</span>
                      {isLocked ? (
                        <div className="capsule-timer">
                          <Timer targetDate={capsule.lockDate} />
                        </div>
                      ) : (
                        <div className="capsule-content">
                          <span className="unlocked-label">Unlocked</span>
                          {/* Display description if available */}
                          {capsule.description && capsule.description.trim().length > 0 && (
                            <p className="capsule-description">{capsule.description}</p>
                          )}
                          {/* Render media if available */}
                          {capsule.media && capsule.media.length > 0 && (
                            <div className="media-container">
                              {capsule.media.map((mediaItem, index) => {
                                let mediaUrl = "";
                                let mediaType = "";
                                // Handle both string and object formats
                                if (typeof mediaItem === "string") {
                                  mediaUrl = mediaItem;
                                  // Simple detection based on extension (case insensitive)
                                  if (mediaUrl.toLowerCase().endsWith(".mp4")) {
                                    mediaType = "video/mp4";
                                  } else if (mediaUrl.toLowerCase().endsWith(".webm")) {
                                    mediaType = "video/webm";
                                  } else if (mediaUrl.toLowerCase().endsWith(".mp3")) {
                                    mediaType = "audio/mpeg";
                                  } else {
                                    mediaType = "image/jpeg";
                                  }
                                } else if (typeof mediaItem === "object" && mediaItem.url) {
                                  mediaUrl = mediaItem.url;
                                  mediaType = mediaItem.type || "image/jpeg";
                                }
                                console.log("Displaying media:", mediaUrl, "Type:", mediaType);
                                if (mediaType.startsWith("video/")) {
                                  return (
                                    <video key={index} controls className="capsule-media">
                                      <source src={mediaUrl} type={mediaType} />
                                      Your browser does not support the video tag.
                                    </video>
                                  );
                                } else if (mediaType.startsWith("audio/")) {
                                  return (
                                    <audio key={index} controls className="capsule-media">
                                      <source src={mediaUrl} type={mediaType} />
                                      Your browser does not support the audio element.
                                    </audio>
                                  );
                                } else {
                                  return (
                                    <img
                                      key={index}
                                      src={mediaUrl}
                                      alt="capsule media"
                                      className="capsule-media"
                                    />
                                  );
                                }
                              })}
                            </div>
                          )}
                          {/* Always display text content below media */}
                          <p className="capsule-text">
                            {capsule.content && capsule.content.trim().length > 0
                              ? capsule.content
                              : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalCapsuleTree;