import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DUAStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dua = await prisma.dUA.findUnique({ where: { id }, include: { movements: true } });
    if (!dua) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: dua });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const dua = await prisma.dUA.update({
      where: { id },
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
        matricula: body.matricula,
        bastidor: body.bastidor,
        instrucciones: body.instrucciones,
        status: body.status as DUAStatus,
        notas: body.notas,
        fechaDespacho: body.fechaDespacho ? new Date(body.fechaDespacho) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: dua });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.dUA.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
