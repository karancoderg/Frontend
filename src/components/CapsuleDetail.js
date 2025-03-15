import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/Authcontext";
import Timer from "./Timer";
import "../style/CollaborativeCapsuleDetail.css";
import "../style/PersonalCapsuleDetail.css";

const CapsuleDetail = () => {
  const { token } = useContext(AuthContext);
  const { capsuleId } = useParams();
  const [capsule, setCapsule] = useState(null);
  const [entryData, setEntryData] = useState({
    content: "",
    lockDate: ""
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch capsule details (including entries) from backend
  const fetchCapsule = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/capsules/${capsuleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCapsule(res.data);
    } catch (err) {
      console.error("Error fetching capsule:", err.response?.data || err.message);
      setError("Error fetching capsule details.");
    }
  };

  useEffect(() => {
    if (token) fetchCapsule();
  }, [token, capsuleId]);

  // Handler for text input and date
  const handleEntryChange = (e) => {
    setEntryData({ ...entryData, [e.target.name]: e.target.value });
  };

  // Handler for file input
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Function to upload the file (if any) and return the URL
  const uploadFile = async () => {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append("mediaFile", file);

      const res = await axios.post("http://localhost:5000/api/capsules/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Uploaded file response:", res.data);
      return res.data.url;
    } catch (error) {
      console.error("File upload error:", error.response?.data || error.message);
      return null;
    }
  };

  // Submit new memory entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring click");
      return;
    }
    
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      let mediaArray = [];

      if (file) {
        const mediaUrl = await uploadFile();
        if (mediaUrl) {
          mediaArray.push({ url: mediaUrl, type: file.type });
        }
      }

      const payload = {
        content: entryData.content,
        lockDate: entryData.lockDate || null,
        media: mediaArray
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      await axios.post(
        `http://localhost:5000/api/capsules/${capsuleId}/entries`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEntryData({ content: "", lockDate: "" });
      setFile(null);
      setSuccess("Memory added successfully!");
      fetchCapsule(); // Refresh the capsule to show the new entry
    } catch (err) {
      console.error("Error adding entry:", err.response?.data || err.message);
      setError("Error adding memory entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render memory entries without fallback text
  const renderEntries = () => {
    if (!capsule || !capsule.entries || capsule.entries.length === 0) {
      // Return null (no text) instead of "No memory entries added yet."
      return null;
    }
    return (
      <ul className="entry-list">
        {capsule.entries.map((entry) => {
          const isLocked = entry.lockDate && new Date(entry.lockDate) > new Date();
          return (
            <li key={entry._id} className="entry-node">
              <div className="entry-header">
                <p>
                  <strong>Added by:</strong> {entry.createdBy?.email || entry.createdBy || "Unknown"}
                </p>
                {entry.lockDate && (
                  <p>
                    <strong>Lock Date:</strong> {new Date(entry.lockDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="entry-content">
                {isLocked ? (
                  <Timer targetDate={entry.lockDate} />
                ) : (
                  <>
                    {entry.media && entry.media.length > 0 ? (
                      <div className="media-container">
                        {entry.media.map((mediaItem, index) => {
                          if (mediaItem.type?.startsWith("video/")) {
                            return (
                              <video key={index} controls className="entry-media">
                                <source src={mediaItem.url} type={mediaItem.type} />
                                Your browser does not support the video tag.
                              </video>
                            );
                          } else if (mediaItem.type?.startsWith("audio/")) {
                            return (
                              <audio key={index} controls className="entry-media">
                                <source src={mediaItem.url} type={mediaItem.type} />
                                Your browser does not support the audio element.
                              </audio>
                            );
                          } else {
                            return (
                              <img
                                key={index}
                                src={mediaItem.url || mediaItem}
                                alt="entry media"
                                className="entry-media"
                              />
                            );
                          }
                        })}
                      </div>
                    ) : (
                      <p>{entry.content || "No content"}</p>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // Render media items
  const renderMedia = (mediaItems) => {
    if (!mediaItems || mediaItems.length === 0) return null;
    
    return (
      <div className="media-container">
        {mediaItems.map((mediaItem, index) => {
          if (mediaItem.type?.startsWith("video/")) {
            return (
              <video key={index} controls className="capsule-media">
                <source src={mediaItem.url} type={mediaItem.type} />
                Your browser does not support the video tag.
              </video>
            );
          } else if (mediaItem.type?.startsWith("audio/")) {
            return (
              <audio key={index} controls className="capsule-media">
                <source src={mediaItem.url} type={mediaItem.type} />
                Your browser does not support the audio element.
              </audio>
            );
          } else {
            return (
              <img
                key={index}
                src={mediaItem.url || mediaItem}
                alt="capsule media"
                className="capsule-media"
              />
            );
          }
        })}
      </div>
    );
  };

  if (!capsule) return <p>Loading capsule...</p>;

  // Check if the entire capsule is locked
  const isCapsuleLocked = capsule.lockDate && new Date(capsule.lockDate) > new Date();
  
  // Render different layouts based on capsule type
  if (capsule.type === "personal") {
    return (
      <div className="personal-capsule-detail">
        <h2>{capsule.title}</h2>
        {error && <p className="error">{error}</p>}
        
        <div className="capsule-info">
          <p className="capsule-description">{capsule.description}</p>
          
          {isCapsuleLocked ? (
            <div className="capsule-locked">
              <Timer targetDate={capsule.lockDate} />
              <p>This capsule is locked until {new Date(capsule.lockDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="capsule-unlocked">
              {capsule.content && <p className="capsule-main-text">{capsule.content}</p>}
              {renderMedia(capsule.media)}
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Collaborative capsule layout
    return (
      <div className="collab-capsule-detail">
        <h2>{capsule.title}</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Add Memory Form */}
        <div className="add-entry-section">
          <h3>Add a Memory</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              name="content"
              placeholder="Share your memory..."
              value={entryData.content}
              onChange={handleEntryChange}
              required
              disabled={isSubmitting}
            ></textarea>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              disabled={isSubmitting}
            />
            <input
              type="date"
              name="lockDate"
              placeholder="Lock until (optional)"
              value={entryData.lockDate}
              onChange={handleEntryChange}
              disabled={isSubmitting}
            />
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <button 
              type="submit"
              disabled={isSubmitting}
              className={isSubmitting ? "submitting" : ""}
            >
              {isSubmitting ? "Adding Memory..." : "Add Memory"}
            </button>
          </form>
        </div>

        {/* Memory Entries */}
        <h3>Memory Entries</h3>
        {renderEntries()}

        {/* Capsule-level content and media AFTER memory entries */}
        {isCapsuleLocked ? (
          <div className="capsule-locked">
            <Timer targetDate={capsule.lockDate} />
            <p>This capsule is locked until {new Date(capsule.lockDate).toLocaleDateString()}</p>
          </div>
        ) : (
          <div className="capsule-unlocked">
            {capsule.content && <p className="capsule-main-text">{capsule.content}</p>}
            {renderMedia(capsule.media)}
          </div>
        )}
      </div>
    );
  }
};

export default CapsuleDetail;
