import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { Layout } from "@/components/Layout";
import "@/index.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: "Sous",
	description: "Your kitchen companion - Cooking assistant powered by AI",
	applicationName: "Sous",
	appleWebApp: {
		capable: true,
		title: "Sous",
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
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.variable}>
				<Providers>
					<Layout>
						{children}
					</Layout>
				</Providers>
			</body>
		</html>
	);
}


