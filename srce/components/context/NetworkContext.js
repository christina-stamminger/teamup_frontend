import React, { createContext, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

// 🌐 Network Context to monitor internet connectivity (offline check)
const NetworkContext = createContext({ isConnected: true });

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Sichere Fetch-Funktion die Offline-Status prüft
  const safeFetch = async (url, options) => {
    // Prüfe ob Internet verfügbar ist
    if (!isConnected) {
      console.log('⚠️ Offline - request blocked:', url);
      return { 
        ok: false, 
        offline: true,
        status: 0 
      };
    }
    
    // Normaler Fetch wenn Online
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // Network error (z.B. Server nicht erreichbar)
      if (error.message === 'Network request failed') {
        console.log('⚠️ Network request failed:', url);
        return { 
          ok: false, 
          offline: true,
          status: 0 
        };
      }
      // Andere Errors normal werfen
      throw error;
    }
  };

  // ✅ Hilfsfunktion: Soll Error angezeigt werden?
  const shouldShowError = () => {
    if (!isConnected) {
      console.log('⚠️ Suppressing error alert - device offline');
      return false;
    }
    return true;
  };

  return (
    <NetworkContext.Provider value={{ 
      isConnected, 
      safeFetch,
      shouldShowError 
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);