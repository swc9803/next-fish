const nextConfig = {
	devIndicators: false,
	transpilePackages: ["three"],
	sassOptions: {},
	reactStrictMode: false,
	webpack: (config) => {
		config.module.rules.push({
			test: /\.(glsl|vs|fs)$/,
			use: ["raw-loader"],
		});

		return config;
	},
};

export default nextConfig;
