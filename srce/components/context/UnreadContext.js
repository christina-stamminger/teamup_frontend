// context/UnreadContext.js
import { createContext, useContext, useState } from "react";

const UnreadContext = createContext();

export const UnreadProvider = ({ children }) => {
    const [hasAnyUnread, setHasAnyUnread] = useState(false);

    return (
        <UnreadContext.Provider value={{ hasAnyUnread, setHasAnyUnread }}>
            {children}
        </UnreadContext.Provider>
    );
};

export const useUnread = () => useContext(UnreadContext);
