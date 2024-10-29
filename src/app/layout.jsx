import "./globals.scss";

export const metadata = {
	title: "Fish Title",
	description: "Fish Description",
};

export default function RootLayout({ children }) {
	return (
		<html lang="ko">
			<body>{children}</body>
		</html>
	);
}
