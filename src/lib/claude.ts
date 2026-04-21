import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");
  if (!_client) _client = new Anthropic({ apiKey });
  return _client;
}

export interface ExtractedDocumentData {
  referencia?: string;
  matricula?: string;
  bastidor?: string;
  unidades?: number;
  peso?: number;
  valor?: number;
  moneda?: string;
  destinatario?: string;
  expedidor?: string;
  tipoOperacion?: string;
  instruccionesDespacho?: string;
  mercancia?: string;
  descripcion?: string;
  paisOrigen?: string;
  paisDestino?: string;
  aduanaEntrada?: string;
  aduanaSalida?: string;
  regimen?: string;
  numeroDUA?: string;
  codigoMercancia?: string;
  tipoTransaccion?: string;
  modoTransporte?: string;
}

export interface IntrastatData {
  facturas: Array<{
    numero?: string;
    paisOrigen?: string;
    paisDestino?: string;
    codigoMercancia?: string;
    descripcion?: string;
    unidades?: number;
    peso?: number;
    pesoEstimado?: number;
    valorEstadistico?: number;
    valorFactura?: number;
    moneda?: string;
    expedidor?: string;
    destinatario?: string;
    tipoTransaccion?: string;
    modoTransporte?: string;
  }>;
}

export async function extractDocumentData(
  base64Content: string,
  mimeType: string,
  customPrompt?: string
): Promise<{ data: ExtractedDocumentData; rawText: string; tokens: { input: number; output: number } }> {
  const client = getClient();

  const systemPrompt = `Eres un experto en documentación aduanera. Extrae información estructurada de documentos aduaneros.
Devuelve SIEMPRE un JSON válido con los campos disponibles. Si un campo no existe, omítelo.
Campos a extraer: referencia, matricula, bastidor, unidades (número), peso (número en kg), valor (número), moneda,
destinatario, expedidor, tipoOperacion, instruccionesDespacho, mercancia, descripcion, paisOrigen, paisDestino,
aduanaEntrada, aduanaSalida, regimen, numeroDUA, codigoMercancia, tipoTransaccion, modoTransporte.
${customPrompt ? `Instrucciones adicionales: ${customPrompt}` : ""}`;

  const content: Anthropic.MessageParam["content"] = [];

  if (mimeType.startsWith("image/")) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: base64Content,
      },
    });
  } else {
    content.push({
      type: "text",
      text: `Contenido del documento (base64 decodificado):\n${Buffer.from(base64Content, "base64").toString("utf-8")}`,
    });
  }

  content.push({
    type: "text",
    text: "Extrae todos los datos del documento y devuelve SOLO un JSON válido con los campos encontrados.",
  });

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const rawText = textContent?.type === "text" ? textContent.text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const data: ExtractedDocumentData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    data,
    rawText,
    tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}

export async function extractIntrastatData(
  base64Content: string,
  mimeType: string
): Promise<{ data: IntrastatData; rawText: string; tokens: { input: number; output: number } }> {
  const client = getClient();

  const systemPrompt = `Eres un experto en declaraciones INTRASTAT y documentación aduanera europea.
Analiza el documento y detecta TODAS las facturas presentes. Para cada factura extrae los datos INTRASTAT.
Devuelve SIEMPRE un JSON con la estructura: { "facturas": [ {...}, {...} ] }
Para cada factura incluye: numero, paisOrigen, paisDestino, codigoMercancia, descripcion, unidades, peso,
pesoEstimado, valorEstadistico, valorFactura, moneda, expedidor, destinatario, tipoTransaccion, modoTransporte.`;

  const content: Anthropic.MessageParam["content"] = [];

  if (mimeType.startsWith("image/")) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: base64Content,
      },
    });
  } else {
    content.push({
      type: "text",
      text: Buffer.from(base64Content, "base64").toString("utf-8"),
    });
  }

  content.push({
    type: "text",
    text: "Detecta todas las facturas y extrae los datos INTRASTAT. Devuelve SOLO JSON válido.",
  });

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const rawText = textContent?.type === "text" ? textContent.text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const data: IntrastatData = jsonMatch ? JSON.parse(jsonMatch[0]) : { facturas: [] };

  return {
    data,
    rawText,
    tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}

export async function crossCheckStock(
  documentData: ExtractedDocumentData,
  stockItems: Array<{ referencia: string; producto: string; unidadesDisponibles: number }>
): Promise<{ matches: Array<{ stockRef: string; unidadesADescontar: number; confianza: number; razon: string }> }> {
  const client = getClient();

  const prompt = `Analiza el documento aduanero y el stock disponible. Determina qué unidades de stock corresponden al despacho.

Datos del documento:
${JSON.stringify(documentData, null, 2)}

Stock disponible:
${JSON.stringify(stockItems, null, 2)}

Devuelve JSON: { "matches": [ { "stockRef": "REF", "unidadesADescontar": N, "confianza": 0-1, "razon": "..." } ] }`;

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const rawText = textContent?.type === "text" ? textContent.text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);

  return jsonMatch ? JSON.parse(jsonMatch[0]) : { matches: [] };
}
