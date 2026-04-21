import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const lame = await prisma.lAME.update({
      where: { id },
      data: {
        tipo: body.tipo as MovementType,
        referencia: body.referencia,
        producto: body.producto,
        descripcion: body.descripcion,
        unidades: Number(body.unidades),
        peso: body.peso ? Number(body.peso) : undefined,
        ubicacion: body.ubicacion,
        instrucciones: body.instrucciones,
        fecha: body.fecha ? new Date(body.fecha) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: lame });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar LAME" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.lAME.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
