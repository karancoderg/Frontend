import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/Authcontext";
import Timer from "./Timer";
import "../style/CollaborativeCapsuleDetail.css";

const CollaborativeCapsuleDetail = () => {
  const { token, user } = useContext(AuthContext);
  const { capsuleId } = useParams();
  const [capsule, setCapsule] = useState(null);
  const [entryData, setEntryData] = useState({
    content: "",
    lockDate: ""
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

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
      return res.data.fileUrl;
    } catch (error) {
      console.error("File upload error:", error.response?.data || error.message);
      return null;
    }
  };

  // Submit new memory entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let mediaUrl = "";
      if (file) {
        mediaUrl = await uploadFile();
      }
      const payload = {
        content: entryData.content,
        lockDate: entryData.lockDate || null,
        // If a file is uploaded, store it as media (an array with one media object)
        media: mediaUrl ? [{ url: mediaUrl, type: file.type }] : []
      };

      const res = await axios.post(
        `http://localhost:5000/api/capsules/${capsuleId}/entries`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Clear form inputs and refresh capsule details
      setEntryData({ content: "", lockDate: "" });
      setFile(null);
      fetchCapsule();
    } catch (err) {
      console.error("Error adding entry:", err.response?.data || err.message);
      setError("Error adding memory entry.");
    }
  };

  // Render memory entries (grouped by member or simply list them)
  const renderEntries = () => {
    if (!capsule || !capsule.entries || capsule.entries.length === 0) {
      return <p>No memory entries added yet.</p>;
    }
    return (
      <ul className="entry-list">
        {capsule.entries.map((entry) => {
          const currentTime = new Date();
          const isLocked = entry.lockDate && new Date(entry.lockDate) > currentTime;
          return (
            <li key={entry._id} className="entry-node">
              <div className="entry-content">
                {isLocked ? (
                  <Timer targetDate={entry.lockDate} />
                ) : (
                  <>
                    {entry.media && entry.media.length > 0 ? (
                      renderMedia(entry.media)
                    ) : (
                      <p>{entry.content || "No content"}</p>
                    )}
                  </>
                )}
              </div>
              <div className="entry-footer">
                <small>
                  Added by:{" "}
                  {entry.createdBy?.name || entry.createdBy || "Unknown Member"}
                </small>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="collab-capsule-detail">
      <h2>{capsule ? capsule.title : "Loading capsule..."}</h2>
      {error && <p className="error">{error}</p>}
      {capsule && !capsule.lockDate && (
        <p className="capsule-description">{capsule.description}</p>
      )}
      {/* Show capsule-level media and content if capsule is unlocked */}
      {capsule && capsule.lockDate && new Date(capsule.lockDate) > new Date() ? (
        <div className="capsule-locked">
          <Timer targetDate={capsule.lockDate} />
          <p>This capsule is locked until {new Date(capsule.lockDate).toLocaleDateString()}</p>
        </div>
      ) : (
        capsule && (
          <div className="capsule-unlocked">
            {capsule.content && <p className="capsule-main-text">{capsule.content}</p>}
            {capsule.media && capsule.media.length > 0 && (
              <div className="media-container">
                {capsule.media.map((mediaItem, index) => {
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
                      <img key={index} src={mediaItem.url || mediaItem} alt="capsule media" className="capsule-media" />
                    );
                  }
                })}
              </div>
            )}
          </div>
        )
      )}

      <h3>Add Your Memory</h3>
      <form onSubmit={handleSubmit} className="entry-form">
        <textarea
          name="content"
          placeholder="Your memory..."
          value={entryData.content}
          onChange={handleEntryChange}
          required
        ></textarea>
        <input
          type="file"
          name="entryFile"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*"
        />
        <input
          type="date"
          name="lockDate"
          placeholder="Entry Lock Date (YYYY-MM-DD)"
          value={entryData.lockDate}
          onChange={handleEntryChange}
        />
        <button type="submit">Add Memory</button>
      </form>

      <h3>Memory Entries</h3>
      {capsule ? renderEntries() : <p>Loading entries...</p>}
    </div>
  );
};

export default CollaborativeCapsuleDetail;
