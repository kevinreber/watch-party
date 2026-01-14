import { createContext } from "react";

interface UserContextType {
  user: string;
  setUser: (user: string) => void;
}

export const UserContext = createContext<UserContextType>({
  user: "",
  setUser: () => {},
});
