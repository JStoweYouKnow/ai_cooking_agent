/** @type {import('next').NextConfig} */
const nextConfig = {
	typedRoutes: true,
	experimental: {
		serverActions: {
			allowedOrigins: ['*'],
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
};

export default nextConfig;


