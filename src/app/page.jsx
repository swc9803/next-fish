import styles from "./page.module.scss";

// components
// import Guide from "../components/Guide.jsx";
import Experience from "@/components/fish/Experience.tsx";

const Home = () => {
	return (
		<div className={styles.container}>
			{/* <Guide /> */}
			<main>
				<Experience />
			</main>
		</div>
	);
};

export default Home;
