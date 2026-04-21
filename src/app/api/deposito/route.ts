import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activo = searchParams.get("activo");

    const where = activo !== null ? { activo: activo === "true" } : {};

    const items = await prisma.depositStock.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { movements: { orderBy: { createdAt: "desc" }, take: 5 } },
    });

    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener stock" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await prisma.depositStock.create({
      data: {
        referencia: body.referencia,
        descripcion: body.descripcion,
        producto: body.producto,
        unidadesTotal: Number(body.unidadesTotal) || 0,
        unidadesDisponibles: Number(body.unidadesDisponibles ?? body.unidadesTotal) || 0,
        unidadesReservadas: Number(body.unidadesReservadas) || 0,
        unidadesDespachadas: Number(body.unidadesDespachadas) || 0,
        ubicacion: body.ubicacion,
        lote: body.lote,
        activo: body.activo !== false,
      },
    });

    await prisma.depositMovement.create({
      data: {
        tipo: "ENTRADA",
        referencia: body.referencia,
        producto: body.producto,
        unidades: item.unidadesTotal,
        unidadesAntes: 0,
        unidadesDespues: item.unidadesTotal,
        motivo: "Alta inicial en depósito",
        stockId: item.id,
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
