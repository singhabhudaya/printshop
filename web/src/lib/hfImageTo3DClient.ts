// src/lib/hfImageTo3DClient.ts
import { Client } from "@gradio/client";

export type Gen3DOptions = {
  steps?: number;
  guidance_scale?: number;
  seed?: number;
  octree_resolution?: number;
  num_chunks?: number;
  target_face_num?: number;
  randomize_seed?: boolean;
};

export type Gen3DResult = {
  bestUrl: string;
  html?: string;
  downloadUrl?: string;
  glbUrl?: string;
  objUrl?: string;
  allUrls: string[];
  raw: unknown;
};

function asUrl(x: unknown): string | undefined {
  if (!x) return undefined;
  if (typeof x === "string") return x;
  if (typeof x === "object" && x !== null && "url" in x && typeof (x as any).url === "string") {
    return (x as any).url as string;
  }
  return undefined;
}

/** Best-effort to compute the Space origin if env/override isn’t provided. */
function guessSpaceOrigin(spaceId: string) {
  const [owner, repo] = spaceId.split("/");
  if (!owner || !repo) return undefined;
  const slug = `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `https://${slug}.hf.space`;
}

export async function generate3DModel(
  file: File | Blob,
  options: Gen3DOptions = {},
  opts?: { hfToken?: string; space?: string; spaceOrigin?: string }
): Promise<Gen3DResult> {
  const space = opts?.space ?? "frogleo/Image-to-3D";
  const token = opts?.hfToken ?? (import.meta as any)?.env?.VITE_HF_TOKEN;
  const spaceOrigin =
    opts?.spaceOrigin ||
    (import.meta as any)?.env?.VITE_HF_SPACE_ORIGIN ||
    guessSpaceOrigin(space) ||
    "https://frogleo-image-to-3d.hf.space";

  const norm = (u?: string) =>
    !u ? u : /^https?:\/\//i.test(u) ? u : `${spaceOrigin}${u.startsWith("/") ? u : "/" + u}`;

  const payload = {
    image: file,
    steps: options.steps ?? 5,
    guidance_scale: options.guidance_scale ?? 5.5,
    seed: options.seed ?? 1234,
    octree_resolution: options.octree_resolution ?? 256,
    num_chunks: options.num_chunks ?? 8000,
    target_face_num: options.target_face_num ?? 10000,
    randomize_seed: options.randomize_seed ?? true,
  };

  const client = await Client.connect(space, { hf_token: token });
  const result = await client.predict("/gen_shape", payload);

  // ✅ ensure this is an array
  const rawData = (result as any)?.data;
  const data: unknown[] = Array.isArray(rawData) ? rawData : [];

  const html = typeof data[0] === "string" ? (data[0] as string) : undefined;
  const downloadUrl = norm(asUrl(data[1]));
  const glbUrl = norm(asUrl(data[2]));
  const objUrl = norm(asUrl(data[3]));

  const allUrlsSet = new Set<string>();
  [downloadUrl, glbUrl, objUrl].forEach((u) => u && allUrlsSet.add(u));

  // Fallback: scan any url-ish entries
  for (const x of data as unknown[]) {
    const u = norm(asUrl(x));
    if (u) allUrlsSet.add(u);
  }

  const allUrls = [...allUrlsSet];
  if (!allUrls.length) throw new Error("No file URLs returned from the API.");

  const best =
    allUrls.find((u) => /\.stl(\?|$)/i.test(u)) ??
    allUrls.find((u) => /\.glb(\?|$)/i.test(u)) ??
    allUrls.find((u) => /\.obj(\?|$)/i.test(u)) ??
    allUrls[0];

  return {
    bestUrl: best,
    html,
    downloadUrl,
    glbUrl,
    objUrl,
    allUrls,
    raw: data,
  };
}
