// src/components/StlViewer.tsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { OrbitControls as OrbitControlsType } from "three/examples/jsm/controls/OrbitControls.js";

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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2, 2, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    // three r165+: use outputColorSpace instead of outputEncoding
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    const grid = new THREE.GridHelper(10, 20, 0xcccccc, 0xeeeeee);
    grid.position.y = -0.001;
    scene.add(grid);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

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
      scene.traverse((o) => {
        const anyO = o as any;
        if (anyO.geometry) anyO.geometry.dispose();
        if (anyO.material) Array.isArray(anyO.material) ? anyO.material.forEach((m: any) => m.dispose()) : anyO.material.dispose();
      });
      mount.removeChild(renderer.domElement);
      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, [autoRotate, background]);

  useEffect(() => {
    if (!sceneRef.current || !file) return;
    const scene = sceneRef.current;

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
        const geo = loader.parse(fr.result as ArrayBuffer).toNonIndexed();
        const unitScale = unit === "mm" ? 0.001 : unit === "cm" ? 0.01 : 1;
        geo.scale(unitScale, unitScale, unitScale);
        geo.computeVertexNormals();
        geo.computeBoundingBox();

        const box = geo.boundingBox!;
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        geo.translate(-center.x, -center.y, -center.z);

        const mat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.1, roughness: 0.7 });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        meshRef.current = mesh;

        const cam = cameraRef.current!;
        const controls = controlsRef.current!;
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitDist = Math.max(0.2, maxDim) * 2.2;
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

  return <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden border" style={{ background }} />;
}
