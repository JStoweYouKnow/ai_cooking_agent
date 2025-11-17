 "use client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(() => new QueryClient());
	const [trpcClient] = React.useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: "/api/trpc",
					transformer: superjson,
					fetch(input, init) {
						return fetch(input, { ...(init ?? {}), credentials: "include" });
					},
				}),
			],
		 }),
	);

	return (
		<ErrorBoundary>
			<ThemeProvider defaultTheme="light">
				<TooltipProvider>
					{/* Register the Service Worker for PWA */}
					{typeof window !== "undefined" && "serviceWorker" in navigator ? (
						<RegisterSW />
					) : null}
					<trpc.Provider client={trpcClient} queryClient={queryClient}>
						<QueryClientProvider client={queryClient}>
							<Toaster />
							{children}
						</QueryClientProvider>
					</trpc.Provider>
				</TooltipProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

function RegisterSW() {
	React.useEffect(() => {
		const url = "/sw.js";
		navigator.serviceWorker
			.register(url, { scope: "/" })
			.catch(() => {});
	}, []);
	return null;
}


