import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractDocumentData } from "@/lib/claude";
import { DocumentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 50);

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count(),
    ]);

    return NextResponse.json({ success: true, data: items, total, page, pageSize });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener documentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "OTRO";
    const customPrompt = (formData.get("customPrompt") as string) || "";

    if (!file) return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    const doc = await prisma.document.create({
      data: {
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        type: type as DocumentType,
        status: "PROCESANDO",
      },
    });

    try {
      const startTime = Date.now();
      const { data, rawText, tokens } = await extractDocumentData(base64, file.type, customPrompt);
      const duration = Date.now() - startTime;

      await prisma.document.update({
        where: { id: doc.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: "PROCESADO", rawText, extractedData: data as any },
      });

      await prisma.aILog.create({
        data: {
          tipo: "OCR",
          prompt: `Extracción de documento: ${file.name}`,
          response: rawText,
          tokensInput: tokens.input,
          tokensOutput: tokens.output,
          duracion: duration,
          documentId: doc.id,
        },
      });

      return NextResponse.json({ success: true, data: { ...doc, status: "PROCESADO", extractedData: data } });
    } catch (ocrError) {
      const errMsg = ocrError instanceof Error ? ocrError.message : "Error OCR";
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "ERROR", errorMessage: errMsg },
      });
      await prisma.aILog.create({
        data: { tipo: "OCR", prompt: `Extracción: ${file.name}`, error: errMsg, documentId: doc.id },
      });
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
