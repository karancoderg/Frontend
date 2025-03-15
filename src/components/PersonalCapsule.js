import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import "../style/PersonalCapsule.css";

const PersonalCapsule = () => {
  const { token } = useContext(AuthContext);
  const [capsuleData, setCapsuleData] = useState({
    title: "",
    description: "",
    lockDate: ""
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [s3Status, setS3Status] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Test S3 connectivity when component mounts
  useEffect(() => {
    const testS3Connection = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/capsules/test-s3");
        console.log("S3 connection test result:", res.data);
        setS3Status({ success: true, message: "S3 connection successful" });
      } catch (error) {
        console.error("S3 connection test failed:", error.response?.data || error.message);
        setS3Status({ 
          success: false, 
          message: error.response?.data?.message || "S3 connection failed" 
        });
        setError("Warning: S3 storage connection failed. File uploads may not work.");
      }
    };

    if (token) {
      testS3Connection();
    }
  }, [token]);

  const handleChange = (e) => {
    setCapsuleData({ ...capsuleData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append("mediaFile", file);

      console.log("Uploading file:", file.name, "Type:", file.type, "Size:", file.size);
      
      const res = await axios.post("http://localhost:5000/api/capsules/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("File upload response:", res.data); // Debugging
      
      if (!res.data.url) {
        console.error("No URL returned from upload:", res.data);
        throw new Error("No URL returned from upload");
      }
      
      return res.data.url;
    } catch (error) {
      console.error("File upload error:", error.response?.data || error.message);
      
      // Show more detailed error message
      let errorMessage = "File upload failed";
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        if (responseData.error === "file_type_not_allowed") {
          errorMessage = responseData.message || "File type not allowed. Please check the list of allowed file types.";
        } else if (responseData.error === "no_file") {
          errorMessage = "No file was received by the server. Please try again.";
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring click");
      return;
    }
    
    if (!file) {
      setError("Media file is required.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Upload the file first
      let mediaUrl = "";
      if (file) {
        mediaUrl = await uploadFile();
      }

      if (!mediaUrl) {
        throw new Error("Failed to upload media file");
      }

      const payload = {
        title: capsuleData.title,
        description: capsuleData.description,
        media: mediaUrl ? [{ url: mediaUrl, type: file.type }] : [],
        lockDate: capsuleData.lockDate || null,
        type: "personal",
      };

      const res = await axios.post("http://localhost:5000/api/capsules", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Capsule creation response:", res.data); // Debugging
      alert("Personal capsule created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error creating personal capsule:", error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || "Error creating capsule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="personal-capsule-container">
      <h2>Create Personal Capsule</h2>
      
      {s3Status && !s3Status.success && (
        <div className="s3-status error">
          <p>{s3Status.message}</p>
          <p>File uploads may not work. Please contact the administrator.</p>
        </div>
      )}
      
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={capsuleData.title}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
        <textarea
          name="description"
          placeholder="Description or memories"
          value={capsuleData.description}
          onChange={handleChange}
          disabled={isSubmitting}
        ></textarea>
        <input
          type="file"
          name="mediaFile"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/rtf,audio/mpeg,audio/wav,audio/ogg,audio/aac"
          required
          disabled={isSubmitting}
        />
        <p className="file-types-help">
          Allowed file types: Images (jpg, png, gif, webp, svg), Videos (mp4, mov, avi, webm, mkv), 
          Documents (pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf), Audio (mp3, wav, ogg, aac)
        </p>
        <input
          type="date"
          name="lockDate"
          placeholder="Unlock Date (YYYY-MM-DD)"
          value={capsuleData.lockDate}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
        {error && <p className="error-message">{error}</p>}
        <button 
          type="submit" 
          disabled={isSubmitting || (s3Status && !s3Status.success)}
          className={isSubmitting ? "submitting" : ""}
        >
          {isSubmitting ? "Creating Capsule..." : "Create Personal Capsule"}
        </button>
      </form>
    </div>
  );
};

export default PersonalCapsule;