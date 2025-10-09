import express from "express";
import Cart from "../models/Cart.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get current cart
router.get("/", auth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const cart = await Cart.findOne({ user: userId }).populate("items.productId");
    res.json(cart || { items: [] });
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add item to cart
router.post("/add", auth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { productId, quantity } = req.body;
    if (!productId || !quantity)
      return res.status(400).json({ msg: "Product ID and quantity are required" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const item = cart.items.find((i: any) => i.productId?.toString() === productId);
    if (item) {
      item.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("❌ Error adding to cart:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Remove item from cart
router.post("/remove", auth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ msg: "Product ID is required" });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ msg: "Cart not found" });

    // ✅ Fix TypeScript: use set() instead of reassignment
    cart.set(
      "items",
      cart.items.filter((i: any) => i.productId?.toString() !== productId)
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("❌ Error removing item:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
