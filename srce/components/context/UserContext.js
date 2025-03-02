import React, { createContext, useContext, useState } from "react";

// Create the UserContext
const UserContext = createContext();

// Custom hook to access the user context easily
export const useUser = () => useContext(UserContext);

// The provider component that will wrap your app and provide the user context
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);  // Set up the userId state

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};
