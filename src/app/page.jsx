import styles from "./page.module.scss";

import Experience from "@/components/fish/Experience.tsx";

const Home = () => {
	return (
		<div className={styles.container}>
			<main>
				<Experience />
			</main>
		</div>
	);
};

export default Home;
