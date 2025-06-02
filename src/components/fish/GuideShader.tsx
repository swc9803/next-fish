import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, CanvasTexture, Vector2 } from "three";

import vertex from "@/shaders/guideVertex.glsl";
import fragment from "@/shaders/guideFragment.glsl";

export const GuideShader = ({ onFinish }: { onFinish: () => void }) => {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();
	const [clicked, setClicked] = useState(false);

	const texture = useMemo(() => {
		const DPR = Math.min(window.devicePixelRatio || 1, 2);
		const width = size.width * DPR;
		const height = size.height * DPR;

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d")!;
		ctx.scale(DPR, DPR);

		const centerX = size.width / 2;
		const centerY = size.height / 2;
		const scale = size.width <= 768 ? 0.2 : 0.3;

		ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
		ctx.fillRect(0, 0, size.width, size.height);

		const viewBoxWidth = 272;
		const viewBoxHeight = 299;

		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.scale(scale, scale);
		ctx.translate(-viewBoxWidth / 2, -viewBoxHeight / 2);
		ctx.lineWidth = 5;
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "#ffffff";

		const cursorPath1 = new Path2D(`
			M239.801 258.568l.017.025.018.025a6.53 6.53 0 0 1-1.542 9.104l-30.234 21.471v.001a6.527 6.527 0 0 1-9.103-1.544l-.014-.02-.015-.02-42.793-57.821-1.741-2.353-2.051 2.088-29.435 29.956-.074.076-.068.082a6.522 6.522 0 0 1-6.579 2.176h-.001a6.53 6.53 0 0 1-4.833-4.971L72.713 76.895c-.311-1.446-.269-2.635.086-3.643.348-.99 1.073-2.026 2.517-3.05a6.527 6.527 0 0 1 7.177-.252h.001l157.135 95.801a6.53 6.53 0 0 1-1.124 11.695l-.088.032-.086.04-37.89 17.424-2.672 1.229 1.643 2.439 40.389 59.958Z
		`);
		const cursorPath2 = new Path2D(`
			M51.062 20.448a9.034 9.034 0 0 0-12.59-2.134 9.031 9.031 0 0 0-2.135 12.59l16.427 23.134a9 9 0 0 0 5.853 3.674 9 9 0 0 0 6.736-1.54 9.029 9.029 0 0 0 2.134-12.59L51.062 20.449ZM47.331 83.127a9.03 9.03 0 0 0-7.394-10.411l-27.973-4.743a9.03 9.03 0 0 0-3.019 17.805l27.974 4.743a9.031 9.031 0 0 0 10.412-7.394ZM39.065 109.991l-23.137 16.428a9.03 9.03 0 0 0 10.455 14.724l23.136-16.428a9.03 9.03 0 0 0-10.454-14.724ZM96.74 48.04a9.03 9.03 0 0 0 10.412-7.393l4.743-27.976a9.029 9.029 0 0 0-7.394-10.412 9.03 9.03 0 0 0-10.41 7.393L89.346 37.63a9.03 9.03 0 0 0 7.393 10.412ZM128.541 65.352a8.997 8.997 0 0 0 6.736-1.54l23.133-16.427a9.03 9.03 0 1 0-10.454-14.724l-23.134 16.427a9.028 9.028 0 0 0-2.134 12.59 9.001 9.001 0 0 0 5.853 3.674Z
		`);
		ctx.stroke(cursorPath1);
		ctx.fill(cursorPath1);
		ctx.fill(cursorPath2);
		ctx.restore();

		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.font = size.width <= 768 ? "bold 20px sans-serif" : "bold 36px sans-serif";
		const text = size.width <= 768 ? ["Click the screen", "to move the fish!"] : ["Click the screen to move the fish!"];
		const lineHeight = size.width <= 768 ? 24 : 36;
		text.forEach((line, i) => {
			ctx.fillText(line, centerX, centerY + 80 + i * lineHeight);
		});

		const tex = new CanvasTexture(canvas);
		tex.needsUpdate = true;
		return tex;
	}, [size]);

	const uniforms = useMemo(
		() => ({
			time: { value: 0 },
			progress: { value: 0 },
			texture1: { value: texture },
			resolution: { value: new Vector4() },
			holeCenter: { value: new Vector2(Math.random(), Math.random()) },
		}),
		[texture]
	);

	useEffect(() => {
		const mesh = meshRef.current;

		return () => {
			texture.dispose();
			mesh?.geometry?.dispose();
			if (Array.isArray(mesh?.material)) {
				mesh.material.forEach((m) => m.dispose());
			} else {
				mesh?.material?.dispose();
			}
		};
	}, [texture]);

	useEffect(() => {
		if (!clicked) return;

		let raf: number;
		const DURATION = 1000;
		const startTime = performance.now();

		const animate = (now: number) => {
			const elapsed = now - startTime;
			const next = Math.min(elapsed / DURATION, 1);
			uniforms.progress.value = next;
			if (next < 1) raf = requestAnimationFrame(animate);
			else onFinish();
		};

		raf = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(raf);
	}, [clicked, uniforms.progress, onFinish]);

	useFrame((_, delta) => {
		uniforms.time.value += delta;

		const aspect = size.height / size.width;
		const imageAspect = size.height / size.width;
		const a1 = aspect > imageAspect ? (size.width / size.height) * imageAspect : 1;
		const a2 = aspect > imageAspect ? 1 : aspect / imageAspect;
		uniforms.resolution.value.set(size.width, size.height, a1, a2);
		meshRef.current?.scale.set(size.width, size.height, 1);
	});

	return (
		<mesh ref={meshRef} position={[0, 0, 0]} onClick={() => setClicked(true)}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
		</mesh>
	);
};
