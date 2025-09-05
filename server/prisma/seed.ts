
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
