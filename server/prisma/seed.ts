<<<<<<< HEAD
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Printing Muse...");

  // --- Admin user ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@printingmuse.com" },
    update: {},
    create: {
      name: "Printing Muse Admin",
      email: "admin@printingmuse.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin"
    }
  });

  // --- Seller user ---
  const seller = await prisma.user.upsert({
    where: { email: "seller@printingmuse.com" },
    update: {},
    create: {
      name: "Printing Muse Seller",
      email: "seller@printingmuse.com",
      passwordHash: await bcrypt.hash("seller123", 10),
      role: "seller",
      sellerTier: 1
    }
  });

  // --- Categories ---
  const categories = ["Toys", "Gadgets", "Cosplay", "Decor", "Gifts"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        image: `/categories/${name.toLowerCase()}.jpg`
      }
    });
  }

  const toys = await prisma.category.findUnique({ where: { name: "Toys" } });

  // --- Sample product for seller ---
  await prisma.product.upsert({
    where: { id: "seed-product-1" }, // stable id trick: create if not exists
    update: {},
    create: {
      id: "seed-product-1",
      title: "Cosplay Mask STL (Printable)",
      description: "High-detail cosplay mask STL ready for 3D printing.",
      price: 19.99,
      images: ["/products/mask-1.png", "/products/mask-2.png"] as any,
      sellerId: seller.id,
      categoryId: toys?.id || null
    }
  });

  console.log("✅ Seed complete.");
  console.log("   Admin:  admin@printingmuse.com / admin123");
  console.log("   Seller: seller@printingmuse.com / seller123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
=======

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Admin", email: "admin@example.com", password: await bcrypt.hash("admin123", 10), role: "admin" },
  });
  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: { name: "Top Seller", email: "seller@example.com", password: await bcrypt.hash("seller123", 10), role: "seller", sellerTier: 1 },
  });
  const names = ["Toys","Gadgets","Cosplay","Decor","Gifts"];
  for (const n of names) {
    await prisma.category.upsert({ where: { name: n }, update: {}, create: { name: n, image: `/categories/${n.toLowerCase()}.jpg` } });
  }
  const toys = await prisma.category.findUnique({ where: { name: "Toys" } });
  await prisma.product.create({ data: { title: "Cosplay Mask STL", price: 799, images: ["/placeholder.png"], sellerId: seller.id, categoryId: toys?.id || null } });
  console.log("Seed complete. Admin: admin@example.com / admin123 • Seller: seller@example.com / seller123");
}
main().finally(() => prisma.$disconnect());
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
