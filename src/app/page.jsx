import styles from "./page.module.scss";

// components
// import Guide from "../components/Guide.jsx";
import Experience from "../components/Experience.jsx";
// import ExperienceTest from "../components/ExperienceTest.jsx";

const Home = () => {
	return (
		<div className={styles.container}>
			{/* <Guide /> */}
			<main>
				<Experience />
				{/* <ExperienceTest /> */}
			</main>
		</div>
	);
};

export default Home;
