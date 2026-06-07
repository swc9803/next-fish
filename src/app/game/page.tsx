import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.scss";

const games = [
	{
		title: "슈팅 게임",
		description: "심해 균열로 잠수하세요. 내 물고기와 회전 조개 무기로 적성 생물을 밀어내고 유물을 회수합니다.",
		href: "/game/shooting-game",
		image: "/images/gallery6-1.webp",
		status: "Ready",
		isPlayable: true,
	},
	{
		title: "준비 중",
		description: "새로운 심해 미션을 준비하고 있습니다. 다음 카트리지가 장착되면 이곳에서 바로 출격할 수 있습니다.",
		href: "",
		image: "/images/gallery3-2.webp",
		status: "Coming Soon",
		isPlayable: false,
	},
];

const GamePage = () => {
	return (
		<main className={styles.page}>
			<section className={styles.header}>
				<p className={styles.kicker}>Arcade Deck</p>
				<h1>작전 선택</h1>
				<p className={styles.description}>출격 가능한 게임 카트리지입니다. 장비를 확인하고 바로 전장으로 진입하세요.</p>
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
									<p className={`${styles.status} ${!game.isPlayable ? styles.pending : ""}`}>{game.status}</p>
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
