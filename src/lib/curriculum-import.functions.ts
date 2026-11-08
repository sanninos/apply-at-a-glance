import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Curriculum import: the signed-in user uploads a PDF/DOC/DOCX resume and the
 * AI gateway extracts its data into the curriculum draft shape. PDFs go inline
 * to the Responses API; Word files are extracted to text first (mammoth for
 * .docx, best-effort printable-text scan for legacy .doc).
 */

export type ImportedExperience = {
  puesto: string | null;
  empresa: string | null;
  desde: string | null;
  hasta: string | null;
  descripcion: string | null;
  lugar: string | null;
  actualmente: boolean | null;
};

export type ImportedEducation = {
  nivel: string | null;
  titulo: string | null;
  institucion: string | null;
  desde: string | null;
  hasta: string | null;
  descripcion: string | null;
  lugar: string | null;
  actualmente: boolean | null;
};

export type ImportedCurriculum = {
  firstName: string | null;
  lastName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  gender: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  extraPhone: string | null;
  country: string | null;
  city: string | null;
  nationality: string | null;
  summary: string | null;
  skills: string | null;
  experiences: ImportedExperience[];
  education: ImportedEducation[];
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const nullableString = { type: ["string", "null"] } as const;

const experienceSchema = {
  type: "object",
  properties: {
    puesto: nullableString,
    empresa: nullableString,
    desde: nullableString,
    hasta: nullableString,
    descripcion: nullableString,
    lugar: nullableString,
    actualmente: { type: ["boolean", "null"] },
  },
  required: ["puesto", "empresa", "desde", "hasta", "descripcion", "lugar", "actualmente"],
  additionalProperties: false,
} as const;

const educationSchema = {
  type: "object",
  properties: {
    nivel: nullableString,
    titulo: nullableString,
    institucion: nullableString,
    desde: nullableString,
    hasta: nullableString,
    descripcion: nullableString,
    lugar: nullableString,
    actualmente: { type: ["boolean", "null"] },
  },
  required: ["nivel", "titulo", "institucion", "desde", "hasta", "descripcion", "lugar", "actualmente"],
  additionalProperties: false,
} as const;

const curriculumSchema = {
  type: "object",
  properties: {
    firstName: nullableString,
    lastName: nullableString,
    documentType: nullableString,
    documentNumber: nullableString,
    birthDate: nullableString,
    gender: nullableString,
    phone: nullableString,
    phoneCountryCode: nullableString,
    extraPhone: nullableString,
    country: nullableString,
    city: nullableString,
    nationality: nullableString,
    summary: nullableString,
    skills: nullableString,
    experiences: { type: "array", items: experienceSchema },
    education: { type: "array", items: educationSchema },
  },
  required: [
    "firstName", "lastName", "documentType", "documentNumber", "birthDate", "gender",
    "phone", "phoneCountryCode", "extraPhone", "country", "city", "nationality",
    "summary", "skills", "experiences", "education",
  ],
  additionalProperties: false,
} as const;

const PROMPT = `Extraé los datos de este currículum y devolvelos en JSON con el esquema indicado. Reglas:
- Si un dato no aparece, usá null. No inventes datos.
- birthDate en formato AAAA-MM-DD si aparece.
- phoneCountryCode como "UY (+598)", "AR (+54)", etc. según el país del teléfono; null si no hay teléfono.
- gender solo si está explícito: "Mujer", "Hombre" u "Otro".
- skills como una lista separada por comas.
- experiences: cada trabajo con puesto, empresa, años o fechas en desde/hasta (ej: "2022"), descripcion con funciones y logros, lugar, y actualmente=true si sigue trabajando ahí (hasta=null en ese caso).
- education: cada estudio con nivel (Primaria, Secundaria, UTU, Terciario / Universitario, Posgrado o Curso o taller), titulo, institucion, desde/hasta, descripcion, lugar y actualmente.
- summary: un resumen profesional de 2-3 líneas basado en el perfil, en primera persona.`;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Best-effort text scan for legacy .doc binaries: keeps printable runs. */
function extractLegacyDocText(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i] ?? 0);
  const runs = text.match(/[\x20-\x7EáéíóúÁÉÍÓÚñÑüÜ¿¡°]{4,}/g) ?? [];
  return runs.join("\n").slice(0, 30000);
}

async function extractDocxText(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.slice(0, 30000);
}

/** Consumes the Responses SSE stream and returns the accumulated output text. */
async function readResponsesStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") output += event.delta;
      } catch {
        // Incomplete frame; ignore.
      }
    }
  }
  return output;
}

export const importCurriculumFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; mimeType: string; base64: string }) => {
    if (!input || typeof input.fileName !== "string" || typeof input.base64 !== "string") {
      throw new Error("Archivo inválido.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("La extracción automática no está configurada.");

    const name = data.fileName.toLowerCase();
    const isPdf = data.mimeType === "application/pdf" || name.endsWith(".pdf");
    const isDocx = data.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx");
    const isDoc = data.mimeType === "application/msword" || name.endsWith(".doc");
    if (!isPdf && !isDocx && !isDoc) throw new Error("Solo se pueden importar archivos PDF o Word.");
    if (!data.base64.trim()) throw new Error("El archivo está vacío.");
    if (data.base64.length > MAX_FILE_BYTES * 1.4) throw new Error("El archivo es demasiado grande (máximo 8 MB).");

    let content: unknown[];
    if (isPdf) {
      content = [
        { type: "input_file", filename: data.fileName, file_data: `data:application/pdf;base64,${data.base64}` },
        { type: "input_text", text: PROMPT },
      ];
    } else {
      const bytes = base64ToBytes(data.base64);
      const text = isDocx ? await extractDocxText(bytes) : extractLegacyDocText(bytes);
      if (!text.trim()) throw new Error("No pudimos leer el contenido del archivo. Probá con un PDF.");
      content = [{ type: "input_text", text: `${PROMPT}\n\nContenido del currículum:\n${text}` }];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{ role: "user", content }],
        reasoning: { effort: "low" },
        store: false,
        stream: true,
        text: {
          format: {
            type: "json_schema",
            name: "curriculum_import",
            strict: true,
            schema: curriculumSchema,
          },
        },
      }),
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      console.error(`Curriculum import failed [${response.status}]: ${detail}`);
      if (response.status === 402) throw new Error("No hay créditos de IA disponibles para importar el currículum.");
      if (response.status === 429) throw new Error("Hay muchas importaciones en curso. Esperá un momento e intentá de nuevo.");
      throw new Error("No pudimos analizar el archivo. Intentá nuevamente.");
    }

    const output = await readResponsesStream(response.body);
    let parsed: ImportedCurriculum;
    try {
      parsed = JSON.parse(output) as ImportedCurriculum;
    } catch {
      throw new Error("No pudimos interpretar los datos del currículum. Intentá con otro archivo.");
    }
    return {
      ...parsed,
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
    };
  });
