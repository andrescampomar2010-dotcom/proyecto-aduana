import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed default configuration
  await prisma.configuration.upsert({
    where: { key: "ocrModel" },
    update: {},
    create: { key: "ocrModel", value: "claude-opus-4-7" },
  });
  await prisma.configuration.upsert({
    where: { key: "ocrMaxTokens" },
    update: {},
    create: { key: "ocrMaxTokens", value: "2000" },
  });
  await prisma.configuration.upsert({
    where: { key: "stockAlertThreshold" },
    update: {},
    create: { key: "stockAlertThreshold", value: "20" },
  });
  await prisma.configuration.upsert({
    where: { key: "defaultRegimen" },
    update: {},
    create: { key: "defaultRegimen", value: "4000" },
  });
  await prisma.configuration.upsert({
    where: { key: "defaultMoneda" },
    update: {},
    create: { key: "defaultMoneda", value: "EUR" },
  });
  await prisma.configuration.upsert({
    where: { key: "autoDespacho" },
    update: {},
    create: { key: "autoDespacho", value: "false" },
  });

  // Seed default user
  await prisma.user.upsert({
    where: { email: "admin@aduana.es" },
    update: {},
    create: {
      email: "admin@aduana.es",
      name: "Administrador",
      role: "ADMIN",
    },
  });

  // Seed sample stock
  const stockItems = [
    { referencia: "BMW-X5-2024", descripcion: "BMW X5 xDrive30d — Lote 2024/A", producto: "BMW X5", unidadesTotal: 50, unidadesDisponibles: 30, unidadesReservadas: 5, unidadesDespachadas: 15, ubicacion: "Nave A — Zona 1", lote: "2024/A" },
    { referencia: "MERC-C200-2024", descripcion: "Mercedes Clase C 200 CDI — Lote 2024/B", producto: "Mercedes Clase C", unidadesTotal: 25, unidadesDisponibles: 25, unidadesReservadas: 0, unidadesDespachadas: 0, ubicacion: "Nave B — Zona 2", lote: "2024/B" },
  ];

  for (const item of stockItems) {
    await prisma.depositStock.upsert({
      where: { referencia: item.referencia },
      update: {},
      create: item,
    });
  }

  console.log("Seed completado correctamente");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
