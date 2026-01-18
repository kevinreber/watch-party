import { Eye } from "lucide-react";

interface WatchCountProps {
  usersCount: number;
}

export const WatchCount = ({ usersCount }: WatchCountProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm">
      <Eye className="h-4 w-4 text-purple-400" />
      <span className="text-white font-medium">{usersCount}</span>
      <span className="text-muted-foreground">watching</span>
    </div>
  );
};
