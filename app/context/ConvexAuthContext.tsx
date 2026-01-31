import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
} from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Types matching the existing User type but with Convex IDs
interface ConvexUser {
  _id: Id<"users">;
  id: Id<"users">;
  clerkId: string;
  username: string;
  email?: string;
  avatar?: string;
  avatarColor: string;
  stats: {
    totalWatchTime: number;
    videosWatched: number;
    partiesHosted: number;
    partiesJoined: number;
    messagesSent: number;
    reactionsGiven: number;
  };
  themeSettings: {
    mode: "light" | "dark" | "system";
    accentColor: string;
    soundEffectsEnabled: boolean;
    soundVolume: number;
  };
  badges: Array<{
    _id: Id<"badges">;
    name: string;
    description: string;
    icon: string;
    category: "watching" | "hosting" | "social" | "special";
    earnedAt: number;
  }>;
  createdAt: number;
}

interface AuthContextType {
  user: ConvexUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  updateProfile: (data: {
    username?: string;
    avatar?: string;
    avatarColor?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const { openSignIn } = useClerk();
  const [isSyncing, setIsSyncing] = useState(false);

  const convexUser = useQuery(api.users.getCurrentUser);
  const syncUser = useMutation(api.users.syncUser);
  const updateProfileMutation = useMutation(api.users.updateProfile);

  // Sync Clerk user to Convex on login
  useEffect(() => {
    const sync = async () => {
      if (clerkUser && convexUser === null && !isSyncing) {
        setIsSyncing(true);
        try {
          await syncUser({
            clerkId: clerkUser.id,
            username:
              clerkUser.username ||
              clerkUser.firstName ||
              clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
              "User",
            email: clerkUser.primaryEmailAddress?.emailAddress,
            avatar: clerkUser.imageUrl,
          });
        } catch (error) {
          console.error("Failed to sync user:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    sync();
  }, [clerkUser, convexUser, syncUser, isSyncing]);

  const isLoading = !clerkLoaded || convexUser === undefined || isSyncing;

  const handleSignOut = async () => {
    await clerkSignOut();
  };

  const handleUpdateProfile = async (data: {
    username?: string;
    avatar?: string;
    avatarColor?: string;
  }) => {
    await updateProfileMutation(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user: convexUser as ConvexUser | null,
        isLoading,
        isLoggedIn: !!convexUser,
        signIn: openSignIn,
        signOut: handleSignOut,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useConvexAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useConvexAuth must be used within ConvexAuthProvider");
  }
  return context;
}
