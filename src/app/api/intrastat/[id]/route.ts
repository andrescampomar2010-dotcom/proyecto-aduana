import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const record = await prisma.intrastatRecord.update({
      where: { id },
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
        exportado: body.exportado,
      },
    });
    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.intrastatRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
