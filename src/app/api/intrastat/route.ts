import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 100);

    const where = periodo ? { periodo } : {};

    const [items, total] = await Promise.all([
      prisma.intrastatRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.intrastatRecord.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: items, total });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener registros Intrastat" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.intrastatRecord.create({
      data: {
        periodo: body.periodo,
        paisOrigen: body.paisOrigen,
        paisDestino: body.paisDestino,
        codigoMercancia: body.codigoMercancia,
        descripcion: body.descripcion,
        unidades: Number(body.unidades) || 0,
        peso: body.peso ? Number(body.peso) : undefined,
        pesoEstimado: body.pesoEstimado ? Number(body.pesoEstimado) : undefined,
        valorEstadistico: body.valorEstadistico ? Number(body.valorEstadistico) : undefined,
        valorFactura: body.valorFactura ? Number(body.valorFactura) : undefined,
        moneda: body.moneda || "EUR",
        expedidor: body.expedidor,
        destinatario: body.destinatario,
        tipoTransaccion: body.tipoTransaccion,
        modoTransporte: body.modoTransporte,
        documentId: body.documentId,
      },
    });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
