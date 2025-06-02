import "./globals.scss";

export const metadata = {
	title: {
		default: "Sungwooo's Portfolio",
		template: "%s | Sungwooo's Portfolio",
	},
	description: "Sungwooo's Portfolio",
	keywords: ["포트폴리오", "웹 개발자", "프론트엔드", "Sungwooo"],
	openGraph: {
		title: "Sungwooo's Portfolio",
		description: "Sungwooo's Portfolio",
		url: "https://sungwooo.com",
		siteName: "Sungwooo's Portfolio",
		images: [
			{
				url: "https://sungwooo.com/favicon/android-icon-192x192.png",
				width: 192,
				height: 192,
				alt: "Sungwooo's Portfolio Favicon",
			},
		],
		locale: "ko_KR",
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "Sungwooo's Portfolio",
		description: "Sungwooo's Portfolio",
		images: ["https://sungwooo.com/favicon/android-icon-192x192.png"],
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="ko">
			<head>
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
				<link rel="shortcut icon" href="/favicon/favicon.ico" />

				<link rel="apple-touch-icon" sizes="57x57" href="/favicon/apple-icon-57x57.png" />
				<link rel="apple-touch-icon" sizes="60x60" href="/favicon/apple-icon-60x60.png" />
				<link rel="apple-touch-icon" sizes="72x72" href="/favicon/apple-icon-72x72.png" />
				<link rel="apple-touch-icon" sizes="76x76" href="/favicon/apple-icon-76x76.png" />
				<link rel="apple-touch-icon" sizes="114x114" href="/favicon/apple-icon-114x114.png" />
				<link rel="apple-touch-icon" sizes="120x120" href="/favicon/apple-icon-120x120.png" />
				<link rel="apple-touch-icon" sizes="144x144" href="/favicon/apple-icon-144x144.png" />
				<link rel="apple-touch-icon" sizes="152x152" href="/favicon/apple-icon-152x152.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-icon-180x180.png" />

				<link rel="icon" type="image/png" sizes="192x192" href="/favicon/android-icon-192x192.png" />
			</head>
			<body>{children}</body>
		</html>
	);
}
