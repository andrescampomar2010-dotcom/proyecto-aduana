import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 50);

    const where = tipo ? { tipo: tipo as MovementType } : {};

    const [items, total] = await Promise.all([
      prisma.lAME.findMany({ where, orderBy: { fecha: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { stock: { select: { referencia: true, producto: true } } } }),
      prisma.lAME.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: items, total });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener LAMEs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const lame = await prisma.lAME.create({
      data: {
        numeroLAME: body.numeroLAME,
        tipo: (body.tipo as MovementType) || "ENTRADA",
        referencia: body.referencia,
        producto: body.producto,
        descripcion: body.descripcion,
        unidades: Number(body.unidades) || 0,
        peso: body.peso ? Number(body.peso) : undefined,
        ubicacion: body.ubicacion,
        instrucciones: body.instrucciones,
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        stockId: body.stockId,
        documentId: body.documentId,
      },
    });

    // Auto-update stock if stockId provided
    if (body.stockId) {
      const stock = await prisma.depositStock.findUnique({ where: { id: body.stockId } });
      if (stock) {
        const delta = lame.tipo === "ENTRADA" ? lame.unidades : -lame.unidades;
        await prisma.depositStock.update({
          where: { id: body.stockId },
          data: {
            unidadesDisponibles: { increment: delta },
            unidadesTotal: lame.tipo === "ENTRADA" ? { increment: lame.unidades } : undefined,
          },
        });
        await prisma.depositMovement.create({
          data: {
            tipo: lame.tipo,
            referencia: lame.referencia,
            producto: lame.producto,
            unidades: lame.unidades,
            unidadesAntes: stock.unidadesDisponibles,
            unidadesDespues: stock.unidadesDisponibles + delta,
            motivo: `LAME ${lame.numeroLAME}`,
            instrucciones: lame.instrucciones,
            stockId: body.stockId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: lame });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear LAME";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
