import { Material, Mesh, Object3D } from "three";

export const disposeMaterial = (material?: Material | Material[] | null) => {
	if (!material) return;

	if (Array.isArray(material)) {
		material.forEach((item) => item.dispose());
		return;
	}

	material.dispose();
};

export const disposeObject3D = (object: Object3D) => {
	object.traverse((child) => {
		if ((child as Mesh).isMesh) {
			const mesh = child as Mesh;
			mesh.geometry?.dispose();
			disposeMaterial(mesh.material as Material | Material[]);
		}
	});
};
