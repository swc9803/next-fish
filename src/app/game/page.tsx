import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.scss";

const games = [
	{
		title: "1945",
		description: "적 편대를 격추하고 보스를 상대하는 세로 스크롤 비행 슈팅 게임입니다.",
		href: "/game/1945",
		image: "/images/gallery6-1.webp",
		status: "Play",
		isPlayable: true,
	},
];

const GamePage = () => {
	return (
		<main className={styles.page}>
			<section className={styles.header}>
				<p className={styles.kicker}>Game Archive</p>
				<h1>게임 목록</h1>
				<p className={styles.description}>플레이할 게임을 선택하세요.</p>
			</section>

			<section className={styles.grid} aria-label="게임 목록">
				{games.map((game, index) => {
					const cardContent = (
						<>
							<div className={styles.imageWrap}>
								<Image src={game.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" priority={index === 0} />
							</div>
							<div className={styles.cardBody}>
								<div>
									<p className={styles.status}>{game.status}</p>
									<h2>{game.title}</h2>
								</div>
								<p>{game.description}</p>
							</div>
						</>
					);

					if (!game.isPlayable) {
						return (
							<article key={game.title} className={`${styles.card} ${styles.disabled}`}>
								{cardContent}
							</article>
						);
					}

					return (
						<Link key={game.title} className={styles.card} href={game.href}>
							{cardContent}
						</Link>
					);
				})}
			</section>
		</main>
	);
};

export default GamePage;
