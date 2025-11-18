 "use client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLoginUrl } from "@/const";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: (failureCount, error) => {
							// Don't retry on 401 errors
							if (error instanceof TRPCClientError) {
								if (error.data?.code === "UNAUTHORIZED" || error.message === UNAUTHED_ERR_MSG) {
									return false;
								}
							}
							return failureCount < 3;
						},
					},
				},
			}),
	);

	// Handle unauthorized errors globally
	React.useEffect(() => {
		const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
			// Check if the query state has an error
			if (event?.query?.state?.error) {
				const error = event.query.state.error;
				if (error instanceof TRPCClientError) {
					if (error.data?.code === "UNAUTHORIZED" || error.message === UNAUTHED_ERR_MSG) {
						// Only redirect if we're not already on the login page
						if (typeof window !== "undefined" && !window.location.pathname.includes("/api/oauth")) {
							// Don't redirect immediately - let the component handle it
							// This prevents infinite redirect loops
						}
					}
				}
			}
		});
		return () => unsubscribe();
	}, [queryClient]);

	const [trpcClient] = React.useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: "/api/trpc",
					transformer: superjson,
					fetch(input, init) {
						return fetch(input, { ...(init ?? {}), credentials: "include" }).then(
							(response) => {
								// Suppress console errors for 401 responses
								if (response.status === 401) {
									// Clone the response so we can still read it, but don't log to console
									return response;
								}
								return response;
							},
							(error) => {
								// Suppress network errors for 401s - they're expected when not authenticated
								if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
									// Return a rejected promise but don't log to console
									return Promise.reject(error);
								}
								throw error;
							}
						);
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


