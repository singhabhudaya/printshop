// src/components/StlViewer.tsx
import React, { useEffect, useRef } from "react";
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  Object3D,
  Material,
  Color,
  HemisphereLight,
  DirectionalLight,
  GridHelper,
  Vector3,
  MeshStandardMaterial,
  SRGBColorSpace, // ✅ use typed constant
} from "three";
// ❗ use no ".js" suffix so TypeScript finds the bundled type defs
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export type StlUnit = "mm" | "cm" | "m";

type Props = {
  file: File;
  unit?: StlUnit;
  autoRotate?: boolean;
  background?: string;
};

export default function StlViewer({
  file,
  unit = "mm",
  autoRotate = true,
  background = "#f8fafc",
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null);
  const meshRef = useRef<Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;

    // Scene
    const scene = new Scene();
    scene.background = new Color(background);
    sceneRef.current = scene;

    // Camera
    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2, 2, 2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = SRGBColorSpace; // ✅ typed, no ts-expect-error
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lights
    const hemi = new HemisphereLight(0xffffff, 0x444444, 0.8);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);

    const dir = new DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    // Grid
    const grid = new GridHelper(10, 20, 0xcccccc, 0xeeeeee);
    (grid.position as any).y = -0.001;
    scene.add(grid);

    // Resize handling
    const onResize = () => {
      const w = mount.clientWidth || 800;
      const h = mount.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // Animate
    let req = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      req = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(req);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();

      // Dispose scene materials/geometries
      scene.traverse((obj: Object3D) => {
        const anyObj = obj as any;
        if (anyObj.geometry) anyObj.geometry.dispose?.();
        if (anyObj.material) {
          const m = anyObj.material as Material | Material[];
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.());
          else m.dispose?.();
        }
      });

      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, [autoRotate, background]);

  useEffect(() => {
    if (!sceneRef.current || !file) return;

    const scene = sceneRef.current;

    // Remove previous mesh if any
    if (meshRef.current) {
      scene.remove(meshRef.current);
      (meshRef.current.geometry as any)?.dispose?.();
      (meshRef.current.material as any)?.dispose?.();
      meshRef.current = null;
    }

    const loader = new STLLoader();
    const fr = new FileReader();

    fr.onload = () => {
      try {
        // Parse STL and normalize
        const geo = loader.parse(fr.result as ArrayBuffer).toNonIndexed();
        const unitScale = unit === "mm" ? 0.001 : unit === "cm" ? 0.01 : 1;
        geo.scale(unitScale, unitScale, unitScale);
        geo.computeVertexNormals();
        geo.computeBoundingBox();

        const box = geo.boundingBox!;
        const size = new Vector3();
        box.getSize(size);
        const center = new Vector3();
        box.getCenter(center);
        geo.translate(-center.x, -center.y, -center.z);

        const mat = new MeshStandardMaterial({
          color: 0x607d8b,
          metalness: 0.1,
          roughness: 0.7,
        });
        const mesh = new Mesh(geo, mat);
        scene.add(mesh);
        meshRef.current = mesh;

        // Fit camera to object
        const cam = cameraRef.current!;
        const controls = controlsRef.current!;
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitDist = maxDim * 2.2;

        cam.position.set(fitDist, fitDist, fitDist);
        cam.near = Math.max(fitDist / 1000, 0.01);
        cam.far = fitDist * 1000;
        cam.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.update();
      } catch (e) {
        console.warn("STL parse failed:", e);
      }
    };

    fr.readAsArrayBuffer(file);
  }, [file, unit]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-xl overflow-hidden border"
      style={{ background }}
    />
  );
}
