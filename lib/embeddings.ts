import {
  env,
  type FeatureExtractionPipeline,
  pipeline,
} from "@xenova/transformers";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    // Force WASM backend in serverless/prod to avoid native onnxruntime-node
    // shared-library loading failures (e.g. missing libonnxruntime.so).
    env.backends.onnx.wasm.proxy = false;
    env.backends.onnx.wasm.numThreads = 1;

    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { device: "wasm" },
    );
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const trunc =
    text.length > 8000 ? `${text.slice(0, 8000)}…[truncated]` : text;
  const extract = await getExtractor();
  const out = await extract(trunc, {
    pooling: "mean",
    normalize: true,
  });
  const data = out.data as Float32Array;
  return Array.from(data);
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  const batch = 4;
  for (let i = 0; i < texts.length; i += batch) {
    const slice = texts.slice(i, i + batch);
    const batchVecs = await Promise.all(slice.map((t) => embedText(t)));
    results.push(...batchVecs);
  }
  return results;
}
