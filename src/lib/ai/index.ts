import { pipeline } from "@xenova/transformers";

export const CATALOGUE_EMBEDDING_DIMENSIONS = 384;

export const CATALOGUE_MODELS = {
  embedding:
    process.env.CATALOGUE_EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2",
  gemini: process.env.CATALOGUE_GEMINI_MODEL ?? "gemini-2.5-flash",
} as const;

const SEMANTIC_IMAGE_PROMPT =
  "You are generating hierarchical search metadata for a catalogue item image. " +
  "Use both the image and the provided item text. " +
  "Return exactly 5 comma-separated labels in this order: " +
  "1. specific item identity, " +
  "2. item type, " +
  "3. functional category, " +
  "4. domain or genre, " +
  "5. broad top-level grouping. " +
  "Prioritize readable text such as title, brand, product name, series name, or model number. " +
  "Use the item description to disambiguate the image when needed. " +
  "Prefer practical catalogue labels over visual description. " +
  "Do not write sentences. " +
  "Do not explain. " +
  "Do not output fewer or more than 5 labels. " +
  "Do not mention colors, poses, background details, artistic style, or decorative elements unless essential for identification. " +
  "Keep each label short and reusable for search. " +
  "Example: The Hobbit, Book, Novel, Fantasy, Entertainment. " +
  "Example: Wireless Microphone, Microphone, Audio Visual, Electronics, Equipment." +
  "";

export type CatalogueSearchableFields = {
  itemDesc: string;
  itemRemarks?: string | null;
  itemSloc: string;
  itemIh: string;
  itemImageCaption?: string | null;
};

export type CatalogueImageContext = {
  itemDesc?: string | null;
  itemRemarks?: string | null;
  itemUom?: string | null;
  itemSloc?: string | null;
};

class EmbeddingPipeline {
  private static task = "feature-extraction" as const;
  private static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, CATALOGUE_MODELS.embedding);
    }

    return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === "") {
    return [];
  }

  const extractor = await EmbeddingPipeline.getInstance();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export function buildItemSearchableText({
  itemDesc,
  itemRemarks,
  itemSloc,
  itemIh,
  itemImageCaption,
}: CatalogueSearchableFields): string {
  return [itemDesc, itemRemarks, itemSloc, itemIh, itemImageCaption]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function toPgVectorString(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

async function toDataUrl(imageUrl: string): Promise<string | null> {
  try {
    let imageBuffer: ArrayBuffer;
    let contentType: string;

    if (imageUrl.startsWith("/")) {
      const { readFile } = await import("fs/promises");
      const { join } = await import("path");
      const filePath = join(process.cwd(), "public", imageUrl);
      const fileBytes = await readFile(filePath);
      imageBuffer = fileBytes.buffer.slice(
        fileBytes.byteOffset,
        fileBytes.byteOffset + fileBytes.byteLength,
      ) as ArrayBuffer;

      const ext = imageUrl.split(".").pop()?.toLowerCase();
      contentType =
        ext === "png"
          ? "image/png"
          : ext === "gif"
            ? "image/gif"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg";
    } else {
      const imageRes = await fetch(imageUrl, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!imageRes.ok) {
        return null;
      }

      imageBuffer = await imageRes.arrayBuffer();
      contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    }

    const base64 = Buffer.from(imageBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function buildGeminiContextText(context?: CatalogueImageContext): string {
  return [
    context?.itemDesc ? `Item Description: ${context.itemDesc}` : null,
    context?.itemRemarks ? `Item Remarks: ${context.itemRemarks}` : null,
    context?.itemUom ? `Unit of Measure: ${context.itemUom}` : null,
    context?.itemSloc ? `Storage Location: ${context.itemSloc}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeSemanticLabels(text?: string | null): string | null {
  if (!text) {
    return null;
  }

  const labels = text
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => label.replace(/\.$/, ""))
    .slice(0, 5);

  if (labels.length < 5) {
    return null;
  }

  return labels.join(", ");
}

async function requestGeminiLabel(
  imageUrl: string,
  context?: CatalogueImageContext,
  attempt = 1,
): Promise<string | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!geminiApiKey) {
    return null;
  }

  const imageDataUrl = await toDataUrl(imageUrl);
  if (!imageDataUrl) {
    return null;
  }

  const dataUrlMatch = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    return null;
  }

  const [, mimeType, data] = dataUrlMatch;
  const attemptInstruction =
    attempt === 1
      ? "This is the first attempt."
      : "Retry. Your previous answer did not return exactly 5 comma-separated labels. Return exactly 5 labels this time.";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CATALOGUE_MODELS.gemini}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    SEMANTIC_IMAGE_PROMPT,
                    attemptInstruction,
                    buildGeminiContextText(context),
                  ]
                    .filter(Boolean)
                    .join("\n\n"),
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 160,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );

    if (!response.ok) {
      console.error(
        `Gemini API error: ${response.status} - ${await response.text()}`,
      );
      return null;
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join(" ")
      .trim();

    return normalizeSemanticLabels(text);
  } catch (error) {
    console.error(`Gemini enrichment failed for ${imageUrl}:`, error);
    return null;
  }
}

export async function captionImage(
  imageUrl: string,
  context?: CatalogueImageContext,
): Promise<string | null> {
  if (!imageUrl) {
    return null;
  }

  const firstAttempt = await requestGeminiLabel(imageUrl, context, 1);
  if (firstAttempt) {
    return firstAttempt;
  }

  return requestGeminiLabel(imageUrl, context, 2);
}
