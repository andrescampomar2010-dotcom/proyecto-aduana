import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DUAStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 50);

    const where = status ? { status: status as DUAStatus } : {};

    const [items, total] = await Promise.all([
      prisma.dUA.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.dUA.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: items, total });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener DUAs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dua = await prisma.dUA.create({
      data: {
        numeroDUA: body.numeroDUA,
        cliente: body.cliente,
        mercancia: body.mercancia,
        descripcion: body.descripcion,
        unidades: Number(body.unidades) || 0,
        peso: body.peso ? Number(body.peso) : undefined,
        valor: body.valor ? Number(body.valor) : undefined,
        moneda: body.moneda || "EUR",
        regimen: body.regimen,
        paisOrigen: body.paisOrigen,
        paisDestino: body.paisDestino,
        aduanaEntrada: body.aduanaEntrada,
        aduanaSalida: body.aduanaSalida,
        matricula: body.matricula,
        bastidor: body.bastidor,
        instrucciones: body.instrucciones,
        status: (body.status as DUAStatus) || "BORRADOR",
        notas: body.notas,
        documentId: body.documentId,
      },
    });
    return NextResponse.json({ success: true, data: dua });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear DUA";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
