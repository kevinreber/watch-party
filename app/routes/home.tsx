import { useState, useContext } from "react";
import { useNavigate } from "react-router";

import { UserContext } from "~/context/UserContext";
import { generateName } from "~/utils/generateName";

export default function Homepage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const { user, setUser } = useContext(UserContext);
  const [isCreating, setIsCreating] = useState(false);

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
  };

  const handleNewRoom = (random = false) => {
    setIsCreating(true);
    let newRoom: string;

    if (random) {
      newRoom = generateName();
      setRoomName(newRoom);
    } else {
      newRoom = roomName;
    }

    const newRoute = newRoom.toLowerCase().split(" ").join("-");
    setTimeout(() => {
      navigate(`/room/${newRoute}`);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      handleNewRoom();
    }
  };

  return (
    <div style={styles.container}>
      {/* Background decoration */}
      <div style={styles.backgroundGlow} />

      {/* Main content */}
      <div style={styles.content}>
        {/* Logo/Brand */}
        <div style={styles.brandSection}>
          <div style={styles.logoContainer}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={styles.logo}>
              <rect width="48" height="48" rx="12" fill="url(#gradient)" />
              <path d="M18 16L34 24L18 32V16Z" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 style={styles.brandName}>Watch Party</h1>
          </div>
          <p style={styles.tagline}>
            Watch YouTube videos together with friends in perfect sync
          </p>
        </div>

        {/* Features */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🎬</span>
            <span style={styles.featureText}>Synchronized playback</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>💬</span>
            <span style={styles.featureText}>Real-time chat</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>👥</span>
            <span style={styles.featureText}>Unlimited guests</span>
          </div>
        </div>

        {/* Form Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Start a Watch Party</h2>
          <p style={styles.cardSubtitle}>
            Create a room and invite your friends to watch together
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                value={user}
                onChange={handleUserChange}
                placeholder="Enter your name"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={handleRoomChange}
                placeholder="Enter room name"
                style={styles.input}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="submit"
                disabled={!roomName.trim() || isCreating}
                style={{
                  ...styles.primaryButton,
                  opacity: !roomName.trim() || isCreating ? 0.5 : 1,
                  cursor: !roomName.trim() || isCreating ? "not-allowed" : "pointer",
                }}
              >
                {isCreating ? (
                  <span style={styles.loadingText}>Creating...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Create Room
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNewRoom(true)}
                disabled={isCreating}
                style={{
                  ...styles.secondaryButton,
                  opacity: isCreating ? 0.5 : 1,
                  cursor: isCreating ? "not-allowed" : "pointer",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4V7M4 7H7M4 7L7 4.5C8.5 3 10.5 2.5 12.5 3C14.5 3.5 16 5 16.5 7M16 16V13M16 13H13M16 13L13 15.5C11.5 17 9.5 17.5 7.5 17C5.5 16.5 4 15 3.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Random Room
              </button>
            </div>
          </form>
        </div>

        {/* Footer hint */}
        <p style={styles.hint}>
          Share the room link with friends after creating
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "800px",
    height: "800px",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  content: {
    width: "100%",
    maxWidth: "440px",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.5s ease-out",
  },
  brandSection: {
    textAlign: "center" as const,
    marginBottom: "2rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  logo: {
    filter: "drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))",
  },
  brandName: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  tagline: {
    color: "#a3a3a3",
    fontSize: "1rem",
    margin: 0,
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
    marginBottom: "2rem",
    flexWrap: "wrap" as const,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "100px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  featureIcon: {
    fontSize: "1rem",
  },
  featureText: {
    fontSize: "0.875rem",
    color: "#a3a3a3",
  },
  card: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: "0 0 0.5rem 0",
    color: "#ffffff",
  },
  cardSubtitle: {
    fontSize: "0.875rem",
    color: "#737373",
    margin: "0 0 1.5rem 0",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#a3a3a3",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "1rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "10px",
    color: "#ffffff",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  primaryButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  secondaryButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background 0.2s ease",
  },
  loadingText: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  hint: {
    textAlign: "center" as const,
    fontSize: "0.875rem",
    color: "#737373",
    marginTop: "1.5rem",
  },
};
