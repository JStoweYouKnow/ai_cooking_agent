import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import "@/index.css";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
	title: "AI Cooking Agent",
	description: "Cooking assistant powered by AI",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
	],
	applicationName: "AI Cooking Agent",
	appleWebApp: {
		capable: true,
		title: "AI Cooking Agent",
		statusBarStyle: "default",
	},
	formatDetection: {
		telephone: false,
	},
	manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Providers>
					<Layout>
						{children}
					</Layout>
				</Providers>
			</body>
		</html>
	);
}


