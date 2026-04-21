import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crossCheckStock } from "@/lib/claude";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { unidadesADescontar, motivo, instrucciones, duaId } = body;

    const stock = await prisma.depositStock.findUnique({ where: { id } });
    if (!stock) return NextResponse.json({ success: false, error: "Stock no encontrado" }, { status: 404 });
    if (unidadesADescontar > stock.unidadesDisponibles) {
      return NextResponse.json({
        success: false,
        error: `Discrepancia: se solicitan ${unidadesADescontar} pero solo hay ${stock.unidadesDisponibles} disponibles`,
        discrepancia: true,
      }, { status: 409 });
    }

    const [updatedStock] = await prisma.$transaction([
      prisma.depositStock.update({
        where: { id },
        data: {
          unidadesDisponibles: { decrement: unidadesADescontar },
          unidadesDespachadas: { increment: unidadesADescontar },
          activo: stock.unidadesDisponibles - unidadesADescontar > 0,
        },
      }),
      prisma.depositMovement.create({
        data: {
          tipo: "SALIDA",
          referencia: motivo,
          producto: stock.producto,
          unidades: unidadesADescontar,
          unidadesAntes: stock.unidadesDisponibles,
          unidadesDespues: stock.unidadesDisponibles - unidadesADescontar,
          motivo,
          instrucciones,
          stockId: id,
          duaId: duaId || undefined,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stock: updatedStock,
        unidadesAnteriores: stock.unidadesDisponibles,
        unidadesDescontadas: unidadesADescontar,
        unidadesResultantes: stock.unidadesDisponibles - unidadesADescontar,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error en despacho";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
