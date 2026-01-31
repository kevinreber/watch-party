import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useNavigate } from "react-router";

interface RoomTemplatesModalProps {
  onClose: () => void;
}

export const RoomTemplatesModal = ({ onClose }: RoomTemplatesModalProps) => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const systemTemplates = useQuery(api.templates.getSystemTemplates);
  const myTemplates = useQuery(api.templates.getMyTemplates);

  const createFromTemplate = useMutation(api.templates.createRoomFromTemplate);

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !selectedTemplate) return;

    setIsCreating(true);
    try {
      const roomId = await createFromTemplate({
        systemTemplateName: selectedTemplate,
        roomName: roomName.trim(),
        password: password || undefined,
      });

      const roomSlug = roomName.toLowerCase().split(" ").join("-");
      navigate(`/room/${roomSlug}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setIsCreating(false);
    }
  };

  const allTemplates = [
    ...(systemTemplates || []),
    ...(myTemplates || []),
  ];

  const selectedTemplateData = allTemplates.find((t) => t.name === selectedTemplate);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Choose a Template</h2>
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        </div>

        {selectedTemplate && selectedTemplateData ? (
          <div style={styles.configSection}>
            <button
              onClick={() => setSelectedTemplate(null)}
              style={styles.backButton}
            >
              ← Choose different template
            </button>

            <div style={styles.selectedTemplatePreview}>
              <div
                style={{
                  ...styles.templatePreviewBox,
                  backgroundColor: selectedTemplateData.theme?.backgroundColor || "#1a1a2e",
                }}
              >
                <span style={styles.templatePreviewIcon}>
                  {selectedTemplateData.icon || "🎬"}
                </span>
              </div>
              <div style={styles.templatePreviewInfo}>
                <h3 style={styles.templatePreviewName}>{selectedTemplateData.name}</h3>
                <p style={styles.templatePreviewDesc}>
                  {selectedTemplateData.description}
                </p>
              </div>
            </div>

            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  style={styles.input}
                  autoFocus
                />
              </div>

              {selectedTemplateData.isPrivate && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password (optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password..."
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.templateDetails}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Capacity</span>
                  <span style={styles.detailValue}>
                    {selectedTemplateData.maxCapacity} users
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Privacy</span>
                  <span style={styles.detailValue}>
                    {selectedTemplateData.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || isCreating}
                style={{
                  ...styles.createButton,
                  opacity: !roomName.trim() || isCreating ? 0.5 : 1,
                }}
              >
                {isCreating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.content}>
            {/* System Templates */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Quick Start</h3>
              <div style={styles.templateGrid}>
                {systemTemplates?.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template.name)}
                    style={styles.templateCard}
                  >
                    <div
                      style={{
                        ...styles.templateIcon,
                        backgroundColor: template.theme?.backgroundColor || "#1a1a2e",
                      }}
                    >
                      {template.icon || "🎬"}
                    </div>
                    <span style={styles.templateName}>{template.name}</span>
                    <span style={styles.templateDesc}>
                      {template.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Templates */}
            {myTemplates && myTemplates.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>My Templates</h3>
                <div style={styles.templateGrid}>
                  {myTemplates.map((template) => (
                    <button
                      key={template._id}
                      onClick={() => setSelectedTemplate(template.name)}
                      style={styles.templateCard}
                    >
                      <div
                        style={{
                          ...styles.templateIcon,
                          backgroundColor: template.theme?.backgroundColor || "#1a1a2e",
                        }}
                      >
                        {template.icon || "🎬"}
                      </div>
                      <span style={styles.templateName}>{template.name}</span>
                      {template.videos.length > 0 && (
                        <span style={styles.templateDesc}>
                          {template.videos.length} videos
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "28px",
    cursor: "pointer",
    lineHeight: 1,
  },
  content: {
    padding: "20px",
    overflowY: "auto",
    flex: 1,
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "12px",
  },
  templateCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 16px",
    backgroundColor: "#262626",
    border: "1px solid #333",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
  },
  templateIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "12px",
  },
  templateName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px",
  },
  templateDesc: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    lineHeight: 1.3,
  },
  configSection: {
    padding: "20px",
    overflowY: "auto",
    flex: 1,
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#8B5CF6",
    fontSize: "14px",
    cursor: "pointer",
    padding: "0",
    marginBottom: "20px",
  },
  selectedTemplatePreview: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#262626",
    borderRadius: "12px",
    marginBottom: "24px",
  },
  templatePreviewBox: {
    width: "64px",
    height: "64px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0,
  },
  templatePreviewIcon: {
    fontSize: "28px",
  },
  templatePreviewInfo: {
    flex: 1,
  },
  templatePreviewName: {
    margin: "0 0 4px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
  },
  templatePreviewDesc: {
    margin: 0,
    fontSize: "13px",
    color: "#888",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#888",
  },
  input: {
    padding: "12px 16px",
    backgroundColor: "#262626",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
  },
  templateDetails: {
    display: "flex",
    gap: "24px",
    padding: "16px",
    backgroundColor: "#262626",
    borderRadius: "8px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#666",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: "14px",
    color: "#fff",
    fontWeight: "500",
  },
  createButton: {
    padding: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
};
