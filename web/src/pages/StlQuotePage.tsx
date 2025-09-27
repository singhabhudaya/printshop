// /web/src/pages/StlQuotePage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  Object3D,
  Material,
  Box3,
  BufferGeometry,
  BufferAttribute,
  Vector3,
  Matrix3,
  Color,
  HemisphereLight,
  DirectionalLight,
  GridHelper,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const BASE_FEE_INR = 100 as const;
const FILAMENT_PRICE_PER_KG = { PLA: 900, ABS: 1000, PETG: 1400 } as const;
const FILAMENT_DENSITY = { PLA: 1.24, ABS: 1.04, PETG: 1.27 } as const;

// 🔧 Pricing knobs
const SLICER_SETUP_FEE_INR = 50;
const PER_PART_FEE_INR = 25;
const MARKUP_PCT = 0.25;
const RISK_BUFFER_PCT = 0.10;
const MIN_ORDER_INR = 200;

type FilamentType = keyof typeof FILAMENT_PRICE_PER_KG;
type StlUnit = "mm" | "cm" | "m";

function pricePerGramINR(material: FilamentType) {
  return FILAMENT_PRICE_PER_KG[material] / 1000;
}

function cm3FromGeometry(geometry: BufferGeometry): number {
  const pos = geometry.attributes.position as BufferAttribute;
  const index = geometry.index?.array as ArrayLike<number> | undefined;

  const vA = new Vector3();
  const vB = new Vector3();
  const vC = new Vector3();

  let volume = 0;
  const tri = (a: number, b: number, c: number) => {
    vA.fromBufferAttribute(pos, a);
    vB.fromBufferAttribute(pos, b);
    vC.fromBufferAttribute(pos, c);
    volume += vA.dot(vB.clone().cross(vC));
  };

  if (index) {
    for (let i = 0; i < index.length; i += 3) tri(index[i]!, index[i + 1]!, index[i + 2]!);
  } else {
    for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
  }
  return Math.abs(volume) / 6.0;
}

function convertGeometryUnitsToCm(geometry: BufferGeometry, unit: StlUnit) {
  const scale = unit === "mm" ? 0.1 : unit === "cm" ? 1 : 100;
  geometry.scale(scale, scale, scale);
}

function estimateGrams(volumeCm3: number, material: FilamentType, infillPct: number) {
  const density = FILAMENT_DENSITY[material];
  return density * volumeCm3 * (Math.max(0, Math.min(infillPct, 100)) / 100);
}

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

function triArea(a: Vector3, b: Vector3, c: Vector3) {
  return b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5;
}

function computeBaseAreaAndHeight(geo: BufferGeometry) {
  const pos = geo.getAttribute("position") as BufferAttribute;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const epsilon = Math.max(1e-5, (maxY - minY) * 1e-4);
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const n = new Vector3();

  let baseArea = 0;
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);

    const onBottom =
      Math.abs(a.y - minY) <= epsilon &&
      Math.abs(b.y - minY) <= epsilon &&
      Math.abs(c.y - minY) <= epsilon;

    if (!onBottom) continue;

    n.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
    if (n.y > 0.7071) baseArea += triArea(a, b, c);
  }
  const height = maxY - minY;
  return { baseArea, height };
}

function autoOrientForPrint(geo: BufferGeometry) {
  const pos = geo.getAttribute("position") as BufferAttribute;
  const original = new Float32Array(pos.array as ArrayLike<number>);

  const perms: Array<[number, number, number]> = [
    [1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]
  ];
  const signs = [
    [ 1, 1, 1],[ 1, 1,-1],[ 1,-1, 1],[ 1,-1,-1],
    [-1, 1, 1],[-1, 1,-1],[-1,-1, 1],[-1,-1,-1],
  ];

  let bestScore = -Infinity;
  let bestArray: Float32Array | null = null;

  const applyTransform = (perm: [number, number, number], s: number[]) => {
    const m = new Matrix3();
    const rows = [[0,0,0],[0,0,0],[0,0,0]];
    rows[0][perm[0]-1] = s[0];
    rows[1][perm[1]-1] = s[1];
    rows[2][perm[2]-1] = s[2];
    m.set(
      rows[0][0], rows[0][1], rows[0][2],
      rows[1][0], rows[1][1], rows[1][2],
      rows[2][0], rows[2][1], rows[2][2],
    );

    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromArray(original, i * 3).applyMatrix3(m);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeBoundingBox();
    geo.computeVertexNormals();
  };

  for (const p of perms) {
    for (const s of signs) {
      pos.copyArray(original);
      pos.needsUpdate = true;

      applyTransform(p, s);

      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const cx = (bb.min.x + bb.max.x) / 2;
      const cz = (bb.min.z + bb.max.z) / 2;
      geo.translate(-cx, 0, -cz);

      const { baseArea, height } = computeBaseAreaAndHeight(geo);
      const score = baseArea - height * 0.01;

      if (score > bestScore) {
        bestScore = score;
        bestArray = new Float32Array(pos.array as ArrayLike<number>);
      }
    }
  }

  if (bestArray) {
    pos.copyArray(bestArray);
    pos.needsUpdate = true;
    geo.computeBoundingBox();
    const b = geo.boundingBox!;
    const offsetX = (b.min.x + b.max.x) / 2;
    const offsetZ = (b.min.z + b.max.z) / 2;
    geo.translate(-offsetX, -b.min.y, -offsetZ);
    geo.computeVertexNormals();
  }
}

function fitCameraToBox(
  camera: PerspectiveCamera,
  controls: InstanceType<typeof OrbitControls>,
  box: Box3,
  padding = 1.35
) {
  const size = new Vector3();
  box.getSize(size);
  const center = new Vector3();
  box.getCenter(center);

  const fov = (camera.fov * Math.PI) / 180;
  const aspect = camera.aspect;

  const distY = (size.y / 2) / Math.tan(fov / 2);
  const fovX = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const distX = (size.x / 2) / Math.tan(fovX / 2);

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

interface StlItem {
  id: string;
  name: string;
  file: File;
  unit: StlUnit;
  volumeCm3?: number;
  error?: string;
}

export default function StlQuotePage() {
  const [items, setItems] = useState<StlItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filament, setFilament] = useState<FilamentType>("PLA");
  const [color, setColor] = useState("Black");
  const [infill, setInfill] = useState(20);
  const [absFinish, setAbsFinish] = useState<"normal" | "glossy">("normal");
  const [gdriveLink, setGdriveLink] = useState("");
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Viewer refs
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);

  const onPickFiles = () => fileInputRef.current?.click();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return;
    const loader = new STLLoader();

    const loadOne = (file: File, unit: StlUnit): Promise<StlItem> =>
      new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const arrayBuffer = fr.result as ArrayBuffer;
            const geometry = loader.parse(arrayBuffer);
            const geo = geometry.toNonIndexed();
            convertGeometryUnitsToCm(geo, unit);
            autoOrientForPrint(geo);
            const volumeCm3 = cm3FromGeometry(geo);
            resolve({
              id: (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
              name: file.name,
              file,
              unit,
              volumeCm3
            });
          } catch (e: any) {
            resolve({
              id: (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
              name: file.name,
              file,
              unit,
              error: e?.message || "Failed to parse STL"
            });
          }
        };
        fr.onerror = () => resolve({
          id: (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
          name: file.name,
          file,
          unit,
          error: "File read error"
        });
        fr.readAsArrayBuffer(file);
      });

    setBusy(true);
    const newOnes: StlItem[] = [];
    for (const f of Array.from(files)) {
      const unitGuess: StlUnit = "mm";
      const parsed = await loadOne(f, unitGuess);
      newOnes.push(parsed);
    }
    setItems((prev) => {
      const next = [...prev, ...newOnes];
      if (!selectedId && next.length) setSelectedId(next[0].id);
      return next;
    });
    setBusy(false);
  }, [selectedId]);

  const totalVolumeCm3 = useMemo(() => items.reduce((acc, it) => acc + (it.volumeCm3 || 0), 0), [items]);
  const finishCost = useMemo(() => (filament === "ABS" && absFinish === "glossy" ? 100 : 0), [filament, absFinish]);
  const totalGrams = useMemo(() => estimateGrams(totalVolumeCm3, filament, infill), [totalVolumeCm3, filament, infill]);
  const filamentCost = useMemo(() => totalGrams * pricePerGramINR(filament), [totalGrams, filament]);

  const pricingBreakdown = useMemo(() => {
    const partsFee = PER_PART_FEE_INR * items.length;
    const baseSubtotal = BASE_FEE_INR + filamentCost + finishCost + SLICER_SETUP_FEE_INR + partsFee;
    const withMarkup = baseSubtotal * (1 + MARKUP_PCT);
    const withRisk = withMarkup * (1 + RISK_BUFFER_PCT);
    const total = Math.max(MIN_ORDER_INR, withRisk);
    return { partsFee, baseSubtotal, withMarkup, withRisk, total };
  }, [items.length, filamentCost, finishCost]);

  const grandTotal = pricingBreakdown.total;

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (selectedId === id) setSelectedId(next.length ? next[0].id : null);
      return next;
    });
  };
  const updateUnit = (id: string, unit: StlUnit) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, unit } : x)));

  const recalcOne = async (id: string) => {
    const target = items.find((x) => x.id === id);
    if (!target) return;
    const loader = new STLLoader();
    const fr = new FileReader();
    setBusy(true);
    fr.onload = () => {
      try {
        const geometry = loader.parse(fr.result as ArrayBuffer);
        const geo = geometry.toNonIndexed();
        convertGeometryUnitsToCm(geo, target.unit);
        autoOrientForPrint(geo);
        const volumeCm3 = cm3FromGeometry(geo);
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, volumeCm3 } : x)));
      } catch {
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, error: "Recalc failed" } : x)));
      } finally {
        setBusy(false);
      }
    };
    fr.onerror = () => {
      setBusy(false);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, error: "Read failed" } : x)));
    };
    fr.readAsArrayBuffer(target.file);
  };

  const canContinue = items.length > 0 && !busy && /^https?:\/\//i.test(gdriveLink.trim());

  const handleContinue = () => {
    if (!canContinue) return;
    const payload = {
      items: items.map((x) => ({ name: x.name, unit: x.unit, volumeCm3: x.volumeCm3 ?? null })),
      options: { filament, color, infill, absFinish, gdriveLink },
      pricing: {
        baseFee: BASE_FEE_INR,
        slicerSetupFee: SLICER_SETUP_FEE_INR,
        perPartFee: PER_PART_FEE_INR,
        partsCount: items.length,
        pricePerGram: pricePerGramINR(filament),
        finishCost,
        totalGrams: Number(totalGrams.toFixed(2)),
        subtotalBeforeMarkup: Number(pricingBreakdown.baseSubtotal.toFixed(2)),
        afterMarkup: Number(pricingBreakdown.withMarkup.toFixed(2)),
        afterRiskBuffer: Number(pricingBreakdown.withRisk.toFixed(2)),
        minOrder: MIN_ORDER_INR,
        total: Number(pricingBreakdown.total.toFixed(2)),
        markupPct: MARKUP_PCT,
        riskBufferPct: RISK_BUFFER_PCT,
      },
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("stl_quote_order", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("stl-quote:ready-for-payment", { detail: payload }));
    alert("Order details saved. Redirecting to payment...");
  };

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
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();

      if (meshRef.current) {
        const g = meshRef.current.geometry as BufferGeometry;
        g.computeBoundingBox();
        fitCameraToBox(cameraRef.current!, controlsRef.current!, g.boundingBox!, 1.35);
      }
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
      scene.traverse((obj: Object3D) => {
        const anyObj = obj as any;
        if (anyObj.geometry) anyObj.geometry.dispose();
        if (anyObj.material) {
          const m = anyObj.material as Material | Material[];
          if (Array.isArray(m)) m.forEach((mm: Material) => mm.dispose());
          else m.dispose();
        }
      });
      meshRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      resizeObsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedId || !sceneRef.current) return;
    const item = items.find((x) => x.id === selectedId);
    if (!item) return;

    if (meshRef.current && sceneRef.current) {
      sceneRef.current.remove(meshRef.current);
      (meshRef.current.geometry as any)?.dispose?.();
      (meshRef.current.material as any)?.dispose?.();
      meshRef.current = null;
    }

    const loader = new STLLoader();
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const geo = loader.parse(fr.result as ArrayBuffer).toNonIndexed();

        const unitScale = item.unit === "mm" ? 0.001 : item.unit === "cm" ? 0.01 : 1;
        geo.scale(unitScale, unitScale, unitScale);
        geo.computeVertexNormals();

        autoOrientForPrint(geo);

        const mat = new MeshStandardMaterial({ color: 0x607d8b, metalness: 0.1, roughness: 0.75 });
        const mesh = new Mesh(geo, mat);
        sceneRef.current!.add(mesh);
        meshRef.current = mesh;

        geo.computeBoundingBox();
        fitCameraToBox(cameraRef.current!, controlsRef.current!, geo.boundingBox!, 1.35);
      } catch (e) {
        console.warn("STL preview parse failed:", e);
      }
    };
    fr.readAsArrayBuffer(item.file);
  }, [selectedId, items]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Upload Your STL & Get Instant Quote</h1>
        <p className="text-slate-600 mb-6">
          All processing happens in your browser. We don’t upload your files—your CPU/RAM does the work.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="mb-4" style={{ height: 340 }}>
              <div
                ref={mountRef}
                className="w-full h-full rounded-xl overflow-hidden border"
                style={{ background: "#f8fafc" }}
              />
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50"
              onClick={onPickFiles}
            >
              <div className="text-lg font-medium">Drop STL files here or click to browse</div>
              <div className="text-sm text-slate-500">Multiple files supported (.stl)</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".stl"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {busy && <div className="mt-4 text-sm text-blue-600">Parsing STL(s)…</div>}

            <ul className="mt-4 space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className={`border rounded-xl p-3 cursor-pointer ${selectedId === it.id ? "ring-2 ring-indigo-500" : ""}`}
                  onClick={() => setSelectedId(it.id)}
                />
              ))}
            </ul>

            {/* details for selected item */}
            {items.map((it) => (
              <div
                key={`${it.id}-details`}
                className={`mt-3 border rounded-xl p-3 ${selectedId === it.id ? "" : "hidden"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    {it.error ? (
                      <div className="text-sm text-red-600">{it.error}</div>
                    ) : (
                      <div className="text-sm text-slate-600">
                        Volume: {it.volumeCm3 ? `${fmt(it.volumeCm3)} cm³` : "…"}
                      </div>
                    )}
                  </div>
                  <button
                    className="text-sm text-rose-600 hover:underline"
                    onClick={() => removeItem(it.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <label className="text-sm">Units:</label>
                  <select
                    className="border rounded-md px-2 py-1 text-sm"
                    value={it.unit}
                    onChange={(e) => updateUnit(it.id, e.target.value as StlUnit)}
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                  <button
                    className="text-xs border rounded-md px-2 py-1 hover:bg-slate-50"
                    onClick={() => recalcOne(it.id)}
                  >
                    Recalculate
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-xl font-semibold mb-3">Options</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Filament Type</label>
                  <select
                    className="border rounded-md px-3 py-2"
                    value={filament}
                    onChange={(e) => setFilament(e.target.value as FilamentType)}
                  >
                    <option value="PLA">PLA</option>
                    <option value="ABS">ABS</option>
                    <option value="PETG">PETG</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Color</label>
                  <input
                    className="border rounded-md px-3 py-2"
                    placeholder="e.g. Black, White, Red"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Infill (%)</label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={infill}
                  onChange={(e) => setInfill(Number(e.target.value))}
                />
                <div className="text-sm text-slate-600">Approximate. Current: {infill}%</div>
              </div>

              {filament === "ABS" && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">ABS Finish</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={absFinish === "normal"}
                        onChange={() => setAbsFinish("normal")}
                      />
                      Normal (Free)
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={absFinish === "glossy"}
                        onChange={() => setAbsFinish("glossy")}
                      />
                      Glossy via acetone (+₹100)
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t" />

              <h3 className="text-lg font-semibold">Pricing</h3>
              <div className="text-sm text-slate-700 space-y-1">
                <div>Base fee: <strong>₹{fmt(BASE_FEE_INR)}</strong></div>
                <div>Slicer / setup: <strong>₹{fmt(SLICER_SETUP_FEE_INR)}</strong></div>
                <div>Per-part fee ({items.length}×₹{fmt(PER_PART_FEE_INR)}): <strong>₹{fmt(PER_PART_FEE_INR * items.length)}</strong></div>
                <div>Total volume: <strong>{fmt(totalVolumeCm3)} cm³</strong></div>
                <div>Est. total grams: <strong>{fmt(totalGrams)} g</strong></div>
                <div>Filament cost (₹/g = {fmt(pricePerGramINR(filament))}): <strong>₹{fmt(filamentCost)}</strong></div>
                {finishCost > 0 && <div>ABS glossy finish: <strong>₹{fmt(finishCost)}</strong></div>}

                <div className="pt-2 text-slate-600">
                  Subtotal before margin: <strong>₹{fmt(pricingBreakdown.baseSubtotal)}</strong>
                </div>
                <div className="text-slate-600">
                  + Margin ({Math.round(MARKUP_PCT * 100)}%): <strong>₹{fmt(pricingBreakdown.withMarkup)}</strong>
                </div>
                <div className="text-slate-600">
                  + Risk buffer ({Math.round(RISK_BUFFER_PCT * 100)}%): <strong>₹{fmt(pricingBreakdown.withRisk)}</strong>
                </div>
                <div className="text-slate-600">
                  Minimum order: <strong>₹{fmt(MIN_ORDER_INR)}</strong>
                </div>

                <div className="text-base pt-2">
                  Grand Total: <strong>₹{fmt(grandTotal)}</strong>
                </div>
              </div>

              <div className="pt-2 border-t" />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Google Drive link to your STL files</label>
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="https://drive.google.com/…"
                  value={gdriveLink}
                  onChange={(e) => setGdriveLink(e.target.value)}
                />
                <div className="text-xs text-slate-500">
                  We’ll pass this link to checkout and your confirmation email.
                </div>
              </div>

              <button
                className={`mt-2 rounded-xl px-4 py-2 text-white ${canContinue ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400 cursor-not-allowed"}`}
                disabled={!canContinue}
                onClick={handleContinue}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          <p>⚠️ Estimates assume consistent units (default mm) and scale grams with infill. Actual weights vary by walls/top/bottom.</p>
        </div>
      </div>
    </div>
  );
}
