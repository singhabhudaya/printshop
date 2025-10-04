import { Router } from "express";
import { Types } from "mongoose";
import { auth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Payout } from "../models/Payout.js";

const router = Router();

function pickSellerIdFromReq(req: any): string | null {
  if (req.user?.role === "admin") {
    const q = String(req.query?.sellerId || "").trim();
    return q || null;
  }
  return req.user?.id || null;
}

function asSellerFilter(sellerId: string) {
  // Product.sellerId is an ObjectId; Order.items[].sellerId is a string snapshot.
  // For Product/Payout queries: cast to ObjectId when valid.
  return Types.ObjectId.isValid(sellerId) ? new Types.ObjectId(sellerId) : sellerId;
}

/** GET /api/sellers/me (seller dashboard snapshot)
 *  Response:
 *  {
 *    seller: { id, name, email, sellerTier, role },
 *    stats: { products, itemsSold, gross },
 *    products: [...],
 *    payouts: [...]
 *  }
 */
router.get("/me", auth, requireRole("seller", "admin"), async (req, res, next) => {
  try {
    const sellerId = pickSellerIdFromReq(req);
    if (!sellerId) return res.status(400).json({ error: "sellerId is required for admin view" });

    const sellerObj = asSellerFilter(sellerId);

    const [seller, products, ordersForSeller, payouts] = await Promise.all([
      User.findById(sellerObj).select("_id name email sellerTier role"),
      Product.find({ sellerId: sellerObj }).sort({ createdAt: -1 }),
      // only pull orders where this seller appears in the snapshot
      Order.find({ "items.sellerId": String(sellerId) }).sort({ createdAt: -1 }),
      Payout.find({ sellerId: sellerObj }).sort({ createdAt: -1 })
    ]);

    if (!seller) return res.status(404).json({ error: "Seller not found" });

    // compute gross & itemsSold from orders containing this seller's items
    let gross = 0;
    let itemsSold = 0;
    for (const o of ordersForSeller) {
      for (const it of (o.items as any[]) || []) {
        if (it.sellerId === String(sellerId)) {
          gross += Number(it.price) * Number(it.quantity);
          itemsSold += Number(it.quantity);
        }
      }
    }

    res.json({
      seller: {
        id: String(seller._id),
        name: seller.name,
        email: seller.email,
        sellerTier: (seller as any).sellerTier ?? 1,
        role: seller.role
      },
      stats: { products: products.length, itemsSold, gross },
      products,
      payouts
    });
  } catch (e) { next(e); }
});

/** GET /api/sellers/products (seller's own products) */
router.get("/products", auth, requireRole("seller", "admin"), async (req, res, next) => {
  try {
    const sellerId = pickSellerIdFromReq(req);
    if (!sellerId) return res.status(400).json({ error: "sellerId is required for admin view" });

    const items = await Product.find({ sellerId: asSellerFilter(sellerId) }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

/** GET /api/sellers/payouts */
router.get("/payouts", auth, requireRole("seller", "admin"), async (req, res, next) => {
  try {
    const sellerId = pickSellerIdFromReq(req);
    if (!sellerId) return res.status(400).json({ error: "sellerId is required for admin view" });

    const items = await Payout.find({ sellerId: asSellerFilter(sellerId) }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

export default router;
