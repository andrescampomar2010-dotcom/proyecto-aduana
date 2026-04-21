import { NextRequest, NextResponse } from "next/server";
import { extractIntrastatData } from "@/lib/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

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
        type: "INTRASTAT",
        status: "PROCESANDO",
      },
    });

    const { data, rawText, tokens } = await extractIntrastatData(base64, file.type);

    await prisma.document.update({ where: { id: doc.id }, data: { status: "PROCESADO", rawText } });

    await prisma.aILog.create({
      data: {
        tipo: "INTRASTAT_OCR",
        prompt: `Extracción Intrastat: ${file.name}`,
        response: rawText,
        tokensInput: tokens.input,
        tokensOutput: tokens.output,
        documentId: doc.id,
      },
    });

    // Auto-create records in DB
    if (data.facturas?.length) {
      for (const factura of data.facturas) {
        await prisma.intrastatRecord.create({
          data: {
            periodo: new Date().toISOString().slice(0, 7).replace("-", ""),
            paisOrigen: factura.paisOrigen,
            paisDestino: factura.paisDestino,
            codigoMercancia: factura.codigoMercancia,
            descripcion: factura.descripcion,
            unidades: Number(factura.unidades) || 0,
            peso: factura.peso ? Number(factura.peso) : undefined,
            pesoEstimado: factura.pesoEstimado ? Number(factura.pesoEstimado) : undefined,
            valorEstadistico: factura.valorEstadistico ? Number(factura.valorEstadistico) : undefined,
            valorFactura: factura.valorFactura ? Number(factura.valorFactura) : undefined,
            moneda: factura.moneda || "EUR",
            expedidor: factura.expedidor,
            destinatario: factura.destinatario,
            tipoTransaccion: factura.tipoTransaccion,
            modoTransporte: factura.modoTransporte,
            documentId: doc.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data, documentId: doc.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error OCR Intrastat" }, { status: 500 });
  }
}
