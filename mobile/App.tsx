import React from "react";
import { SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { trpc, queryClient, trpcClient } from "./src/api/client";
import { AuthProvider } from "./src/contexts/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import RootErrorBoundary from "./src/components/RootErrorBoundary";

console.log("[App] All imports loaded successfully");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  console.log("[App] Component rendering...");
  
  // @ts-ignore - tRPC types are complex, runtime works correctly
  const TRPCProvider = trpc.Provider;
  
  console.log("[App] Rendering full app with providers");
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F0" }}>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider client={trpcClient} queryClient={queryClient}>
          <AuthProvider>
            <RootErrorBoundary>
              <RootNavigator />
            </RootErrorBoundary>
            <StatusBar style="auto" />
          </AuthProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </SafeAreaView>
  );
}

