const nextConfig = {
	transpilePackages: ["three"],
	sassOptions: {},
	reactStrictMode: false,
	webpack: (config, { isServer }) => {
		config.module.rules.push({
			test: /\.(glsl|vs|fs)$/,
		});

		return config;
	},
};

export default nextConfig;
