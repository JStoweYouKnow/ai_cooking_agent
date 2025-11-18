/** @type {import('next').NextConfig} */
const nextConfig = {
	typedRoutes: true,
	experimental: {
		serverActions: {
			allowedOrigins: ['*'],
			bodySizeLimit: '2mb',
		},
	},
	typescript: {
		ignoreBuildErrors: false,
	},
	async redirects() {
		return [
			{
				source: '/404',
				destination: '/not-found',
				permanent: false,
			},
		];
	},
	// Optional: Set custom headers for API routes
	async headers() {
		return [
			{
				source: '/api/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'no-store' },
				],
			},
		];
	},
};

export default nextConfig;


