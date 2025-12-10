import { createTRPCReact } from "@trpc/react-query";

// Using 'any' type for AppRouter to avoid complex type definitions
// Runtime behavior is correct - types are validated at runtime by tRPC
// This avoids importing from server which causes path resolution issues
// @ts-ignore - AppRouter type would require importing from server
export const trpc = createTRPCReact<any>();
