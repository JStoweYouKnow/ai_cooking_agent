import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Network from "expo-network";

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  networkType: Network.NetworkStateType | null;
  checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [networkType, setNetworkType] = useState<Network.NetworkStateType | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setNetworkType(state.type ?? null);
    } catch (error) {
      console.warn("[Network] Failed to check network state:", error);
      // Assume connected if we can't check
      setIsConnected(true);
      setIsInternetReachable(true);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkConnection();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [checkConnection]);

  // Poll for connectivity changes every 10 seconds when app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        checkConnection();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable,
    networkType,
    checkConnection,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};
