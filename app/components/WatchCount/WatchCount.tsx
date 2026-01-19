import VisibilityIcon from "@mui/icons-material/Visibility";

interface WatchCountProps {
  usersCount: number;
}

export const WatchCount = ({ usersCount }: WatchCountProps) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem" }}>
      {usersCount}
      <VisibilityIcon />
    </div>
  );
};
