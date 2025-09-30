// /src/pages/ImageToSTLPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, Material, Box3,
  Vector3, Color, HemisphereLight, DirectionalLight, GridHelper,
  MeshStandardMaterial, SRGBColorSpace, Mesh,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { generate3DModel, type Gen3DOptions } from "../lib/hfImageTo3DClient";

const bronze = "#A47C5B";
const bronzeDeep = "#8B684B";
const inputCls =
  "w-full rounded border px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E8DCCD]";
const labelCls = "block text-sm font-medium text-gray-800 mb-1";

// camera helper (same math you used)
function fitCameraToBox(
  camera: PerspectiveCamera,
  controls: InstanceType<typeof OrbitControls>,
  box: Box3,
  padding = 1.35
) {
  const size = new Vector3(); box.getSize(size);
  const center = new Vector3(); box.getCenter(center);
  const fov = (camera.fov * Math.PI) / 180;
  const aspect = camera.aspect;
  const distY = size.y / 2 / Math.tan(fov / 2);
  const fovX = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const distX = size.x / 2 / Math.tan(fovX / 2);
  const dist = Math.max(distX, distY, size.z) * padding;
  const dir = new Vector3(1, 1, 1).normalize();
  camera.position.copy(center).add(dir.multiplyScalar(dist));
  camera.near = Math.max(dist / 1000, 0.01);
  camera.far = dist * 1000;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = dist * 0.2;
  controls.maxDistance = dist * 5;
  controls.update();
}

const defaultOpts: Gen3DOptions = {
  steps: 5,
  guidance_scale: 5.5,
  seed: 1234,
  octree_resolution: 256,
  num_chunks: 8000,
  target_face_num: 10000,
  randomize_seed: true,
};

export default function ImageToSTLPage() {
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [opts, setOpts] = useState<Gen3DOptions>(defaultOpts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // returned URLs
  const [objUrl, setObjUrl] = useState<string | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [allUrls, setAllUrls] = useState<string[]>([]);

  // auto converted STL blob url (primary download + preview source)
  const [stlUrl, setStlUrl] = useState<string | null>(null);

  // logs
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const log = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs((l) => [...l, `[${t}] ${msg}`]);
  };
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  // three viewer
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null);
  const currentObjectRef = useRef<Object3D | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);

  const canGenerate = useMemo(() => !!imgFile && !loading, [imgFile, loading]);

  // init viewer
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new Scene();
    scene.background = new Color("#f8fafc");
    sceneRef.current = scene;

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.01, 2000);
    camera.position.set(2, 2, 2);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    const hemi = new HemisphereLight(0xffffff, 0x444444, 0.9);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);

    const dir = new DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    const grid = new GridHelper(10, 20, 0xcccccc, 0xeeeeee);
    (grid.material as Material).opacity = 0.6;
    (grid.material as Material).transparent = true;
    scene.add(grid);

    const onResize = () => {
      if (!mount || !rendererRef.current || !cameraRef.current) return;
      const w = mount.clientWidth, h = mount.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    resizeObsRef.current = ro;

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
      mount.removeChild(renderer.domElement);
      scene.traverse((obj: any) => {
        obj.geometry?.dispose?.();
        if (obj.material) {
          Array.isArray(obj.material) ? obj.material.forEach((m: any) => m.dispose?.()) : obj.material.dispose?.();
        }
      });
      currentObjectRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      resizeObsRef.current = null;
    };
  }, []);

  const setSceneObject = (obj: Object3D) => {
    const scene = sceneRef.current;
    if (!scene || !cameraRef.current || !controlsRef.current) return;

    if (currentObjectRef.current) {
      scene.remove(currentObjectRef.current);
      currentObjectRef.current.traverse((o: any) => {
        o.geometry?.dispose?.();
        if (o.material) {
          Array.isArray(o.material) ? o.material.forEach((m: any) => m.dispose?.()) : o.material.dispose?.();
        }
      });
    }
    scene.add(obj);
    currentObjectRef.current = obj;

    obj.traverse((c: any) => {
      if (c.isMesh && !c.material) {
        c.material = new MeshStandardMaterial({ color: 0x607d8b, metalness: 0.1, roughness: 0.75 });
      }
    });

    const box = new Box3().setFromObject(obj);
    fitCameraToBox(cameraRef.current!, controlsRef.current!, box, 1.35);
  };

  // ---- AUTO CONVERT to STL + PREVIEW FROM STL ----
  const exportToSTLAndPreview = async (srcObj: Object3D) => {
    try {
      log("Converting to STL…");

      // create STL blob
      const exporter = new STLExporter();
      const arrayBuffer = exporter.parse(srcObj, { binary: true }) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "model/stl" });

      // revoke previous url, then set new one for download
      setStlUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });

      // use a local object URL for preview immediately
      const localUrl = URL.createObjectURL(blob);

      // now preview FROM STL (so user sees exactly what they’ll download)
      const stlLoader = new STLLoader();
      const geometry = await new Promise((resolve, reject) => {
        stlLoader.load(
          localUrl,
          (geo: unknown) => resolve(geo),
          undefined,
          (err: unknown) => reject(err)
        );
      });

      // we no longer need the temporary preview url
      URL.revokeObjectURL(localUrl);

      // replace scene object with STL mesh
      const mat = new MeshStandardMaterial({ color: 0x607d8b, metalness: 0.1, roughness: 0.75 });
      const mesh = new Mesh(geometry as any, mat);
      setSceneObject(mesh);
      log("STL ready. Preview is now the STL. Primary download is STL.");
    } catch (e: any) {
      console.error(e);
      log(`STL conversion/preview failed: ${e?.message ?? e}`);
    }
  };

  // load OBJ or GLB, then auto-convert to STL and preview from STL
  const loadAndConvert = async (url: string) => {
    try {
      log(`Loading model: ${url}`);
      let obj3d: Object3D | null = null;

      if (/\.obj(\?|$)/i.test(url)) {
        const loader = new OBJLoader();
        try {
          obj3d = await loader.loadAsync(url);
          log("OBJ loaded.");
        } catch {
          log("OBJ direct load failed, retrying via blob…");
          const res = await fetch(url, { mode: "cors" });
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          obj3d = await new OBJLoader().loadAsync(blobUrl);
          URL.revokeObjectURL(blobUrl);
          log("OBJ loaded via blob.");
        }
      } else if (/\.glb(\?|$)|\.gltf(\?|$)/i.test(url)) {
        const gltfLoader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
        gltfLoader.setDRACOLoader(draco);
        try {
          const gltf = await gltfLoader.loadAsync(url);
          obj3d = gltf.scene;
          log("GLB/GLTF loaded.");
        } catch {
          log("GLB direct load failed, retrying via blob…");
          const res = await fetch(url, { mode: "cors" });
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const gltf = await new GLTFLoader().loadAsync(blobUrl);
          URL.revokeObjectURL(blobUrl);
          obj3d = gltf.scene;
          log("GLB/GLTF loaded via blob.");
        }
      } else {
        log("Unknown format (expected .obj/.glb)");
      }

      if (obj3d) {
        setSceneObject(obj3d);
        await exportToSTLAndPreview(obj3d); // <-- auto convert + show STL
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to load/convert model.");
      log(`Load/convert error: ${e?.message ?? e}`);
    }
  };

  // file pick
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImgFile(f);
    setError(null);
    setObjUrl(null);
    setGlbUrl(null);
    setAllUrls([]);
    if (stlUrl) { URL.revokeObjectURL(stlUrl); setStlUrl(null); }
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewImg(url);
      log(`Selected image: ${f.name} (${Math.round(f.size / 1024)} KB)`);
    }
  };

  const onGenerate = async () => {
    if (!imgFile) return;
    setLoading(true);
    setError(null);
    if (stlUrl) { URL.revokeObjectURL(stlUrl); setStlUrl(null); }

    log("Connecting to Hugging Face… (Space may cold-start)");
    try {
      log(`Options: steps=${opts.steps}, guidance=${opts.guidance_scale}, faces=${opts.target_face_num}, seed=${opts.seed}, randomize=${opts.randomize_seed}`);
      const res = await generate3DModel(imgFile, opts);
      log("Generation finished. Parsing result…");
      log(`Found URLs: ${JSON.stringify(res.allUrls, null, 2)}`);

      const prefer =
        res.allUrls.find((u) => /\.obj(\?|$)/i.test(u)) ??
        res.allUrls.find((u) => /\.glb(\?|$)/i.test(u)) ??
        res.bestUrl;

      setObjUrl(res.allUrls.find((u) => /\.obj(\?|$)/i.test(u)) || null);
      setGlbUrl(res.allUrls.find((u) => /\.glb(\?|$)/i.test(u)) || null);
      setAllUrls(res.allUrls);

      if (prefer) {
        log(`Picked for conversion: ${prefer}`);
        await loadAndConvert(prefer); // load, auto-export to STL, preview STL
      } else {
        setError("No OBJ/GLB URL found.");
        log("No usable model URL.");
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Generation failed.";
      setError(msg);
      log(`Generation error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // cleanup STL objectURL on unmount
  useEffect(() => () => { if (stlUrl) URL.revokeObjectURL(stlUrl); }, [stlUrl]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Image → STL (auto)</h1>
        <p className="text-slate-600 mb-6">
          Upload an image → model is generated on Hugging Face → we auto-convert to STL and preview the STL here.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="mb-4" style={{ height: 360 }}>
              <div
                ref={mountRef}
                className="w-full h-full rounded-xl overflow-hidden border"
                style={{ background: "#f8fafc" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Reference Image</label>
                <input type="file" accept="image/*" onChange={onPick} className={inputCls} />
                {previewImg && (
                  <img
                    src={previewImg}
                    alt="preview"
                    className="mt-3 w-full h-36 object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Actions</label>
                <button
                  onClick={onGenerate}
                  disabled={!canGenerate}
                  className="px-4 py-2 rounded text-white disabled:opacity-60"
                  style={{ backgroundImage: `linear-gradient(135deg, ${bronze} 0%, ${bronzeDeep} 100%)` }}
                >
                  {loading ? "Generating…" : "Generate & Convert to STL"}
                </button>
                {error && <div className="text-sm text-rose-600">{error}</div>}
              </div>
            </div>

            {/* Downloads */}
            <div className="mt-5">
              <h3 className="font-semibold mb-2">Downloads</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href={stlUrl ?? undefined}
                  className={`px-3 py-2 rounded text-white ${stlUrl ? "bg-emerald-600" : "bg-slate-400 cursor-not-allowed"}`}
                  download={stlUrl ? "model.stl" : undefined}
                  onClick={(e) => { if (!stlUrl) e.preventDefault(); }}
                >
                  Download STL (auto)
                </a>

                {/* Optional: expose originals for debugging */}
                {objUrl && (
                  <a href={objUrl} className="px-3 py-2 rounded bg-slate-800 text-white" download>
                    Download OBJ
                  </a>
                )}
                {glbUrl && (
                  <a href={glbUrl} className="px-3 py-2 rounded bg-slate-800 text-white" download>
                    Download GLB
                  </a>
                )}
              </div>
            </div>

            {/* Logs */}
            <div className="mt-5">
              <h3 className="font-semibold mb-2">Status / Logs</h3>
              <div
                ref={logRef}
                className="h-40 overflow-auto rounded-md border bg-slate-50 p-2 text-xs font-mono"
              >
                {logs.length === 0 ? (
                  <div className="text-slate-500">No logs yet. Choose an image and click “Generate & Convert to STL”.</div>
                ) : (
                  logs.map((l, i) => <div key={i}>{l}</div>)
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Fine-tune */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-xl font-semibold mb-3">Fine-Tune</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Steps (quality vs speed)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={opts.steps ?? 5}
                  onChange={(e) => setOpts((o) => ({ ...o, steps: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Guidance scale</label>
                <input
                  type="number"
                  step="0.1"
                  value={opts.guidance_scale ?? 5.5}
                  onChange={(e) => setOpts((o) => ({ ...o, guidance_scale: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Target face count</label>
                <input
                  type="number"
                  min={1000}
                  value={opts.target_face_num ?? 10000}
                  onChange={(e) => setOpts((o) => ({ ...o, target_face_num: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Seed</label>
                <input
                  type="number"
                  value={opts.seed ?? 1234}
                  onChange={(e) => setOpts((o) => ({ ...o, seed: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="rand"
                  type="checkbox"
                  checked={opts.randomize_seed ?? true}
                  onChange={(e) => setOpts((o) => ({ ...o, randomize_seed: e.target.checked }))}
                />
                <label htmlFor="rand" className="text-sm">Randomize seed</label>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Tip: start with faces 10k–30k for printing; increase if you see facets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
