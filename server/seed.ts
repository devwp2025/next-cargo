import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { log } from "./index";

export async function seedDatabase() {
  const existingAdmin = await storage.getUserByEmail("admin@luxemarket.com");
  if (existingAdmin) {
    log("Database already seeded, skipping");
    return;
  }

  log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await storage.createUser("Admin", "admin@luxemarket.com", adminHash, "admin");

  const seller1Hash = await bcrypt.hash("seller123", 10);
  const seller1 = await storage.createUser("Luxury Boutique", "seller1@luxemarket.com", seller1Hash);

  const seller2Hash = await bcrypt.hash("seller123", 10);
  const seller2 = await storage.createUser("Premium Kicks", "seller2@luxemarket.com", seller2Hash);

  const buyerHash = await bcrypt.hash("buyer123", 10);
  const buyer = await storage.createUser("Somchai K.", "buyer@luxemarket.com", buyerHash);

  const categoryData = [
    { name: "รองเท้า", slug: "shoes" },
    { name: "กระเป๋า", slug: "bags" },
    { name: "เสื้อผ้า", slug: "clothes" },
    { name: "ของสะสม", slug: "collectibles" },
    { name: "เครื่องประดับ", slug: "jewelry" },
    { name: "เคสโทรศัพท์", slug: "phone-cases" },
    { name: "โทรศัพท์", slug: "phones" },
    { name: "ของใช้", slug: "household" },
    { name: "ของเล่น", slug: "toys" },
  ];

  const cats: Record<string, number> = {};
  for (const c of categoryData) {
    const cat = await storage.createCategory(c.name, c.slug);
    cats[c.slug] = cat.id;
  }

  const productData = [
    {
      sellerId: seller1.id, categoryId: cats["bags"], title: "Louis Vuitton Neverfull MM Monogram",
      description: "Authentic Louis Vuitton Neverfull MM in classic monogram canvas. Excellent condition with minimal signs of use. Comes with pouch and dust bag. Date code verified.",
      price: 35000, condition: "excellent",
      images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller1.id, categoryId: cats["bags"], title: "Chanel Classic Flap Medium Black Caviar",
      description: "Chanel Medium Classic Flap in black caviar leather with gold hardware. Very good condition. Authenticity card and dust bag included.",
      price: 185000, condition: "like-new",
      images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller2.id, categoryId: cats["shoes"], title: "Nike Air Jordan 1 Retro High OG Chicago",
      description: "Jordan 1 Retro High OG 'Chicago' (2015 release). US Size 10. Very clean condition, worn only a handful of times. OG all included.",
      price: 22000, condition: "excellent",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller2.id, categoryId: cats["shoes"], title: "New Balance 550 White Green",
      description: "New Balance 550 in White/Green colorway. Brand new with tags, never worn. US Size 9.5. Complete with original box.",
      price: 5500, condition: "new",
      images: ["https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller1.id, categoryId: cats["clothes"], title: "Gucci GG Monogram Silk Scarf",
      description: "Authentic Gucci silk scarf with GG monogram pattern. Beautiful beige and brown colorway. 140x140cm. Like new condition.",
      price: 8900, condition: "like-new",
      images: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller2.id, categoryId: cats["shoes"], title: "Adidas Yeezy Boost 350 V2 Cream White",
      description: "Adidas Yeezy Boost 350 V2 in Cream/Triple White. Deadstock, never worn. US Size 11. Comes with receipt and original packaging.",
      price: 12000, condition: "new",
      images: ["https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller1.id, categoryId: cats["jewelry"], title: "Cartier Love Bracelet Yellow Gold Size 17",
      description: "Authentic Cartier Love Bracelet in 18k yellow gold. Size 17. Comes with screwdriver, box, and certificate. Minimal scratches from normal wear.",
      price: 195000, condition: "good",
      images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller2.id, categoryId: cats["collectibles"], title: "Bearbrick 1000% KAWS Companion",
      description: "Medicom Toy BE@RBRICK x KAWS Companion 1000%. Limited edition, displayed in glass case. Mint condition with original box.",
      price: 45000, condition: "like-new",
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller1.id, categoryId: cats["bags"], title: "Hermes Birkin 25 Togo Gold GHW",
      description: "Hermes Birkin 25 in Togo leather, Gold color with gold hardware. Stamp Y. Excellent condition with all accessories. Full set.",
      price: 580000, condition: "excellent",
      images: ["https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller2.id, categoryId: cats["phones"], title: "iPhone 15 Pro Max 256GB Natural Titanium",
      description: "Apple iPhone 15 Pro Max 256GB in Natural Titanium. Used for 3 months, battery health 98%. No scratches, always used with case and screen protector.",
      price: 38000, condition: "like-new",
      images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller1.id, categoryId: cats["clothes"], title: "Balenciaga Triple S Sneakers Black",
      description: "Balenciaga Triple S in all black. EU Size 42. Good condition with some sole wear. Comes with dust bag and extra laces.",
      price: 18000, condition: "good",
      images: ["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=600&fit=crop"],
    },
    {
      sellerId: seller2.id, categoryId: cats["shoes"], title: "Nike Dunk Low Panda Black White",
      description: "Nike Dunk Low 'Panda' in Black/White. DS with tags. Women's US Size 8 (Men's 6.5). Complete OG all.",
      price: 4200, condition: "new",
      images: ["https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop"],
    },
  ];

  for (const p of productData) {
    await storage.createProduct(p);
  }

  log(`Seeded: ${categoryData.length} categories, ${productData.length} products, 4 users`);
  log("Demo accounts:");
  log("  Admin:  admin@luxemarket.com / admin123");
  log("  Seller: seller1@luxemarket.com / seller123");
  log("  Seller: seller2@luxemarket.com / seller123");
  log("  Buyer:  buyer@luxemarket.com / buyer123");
}
