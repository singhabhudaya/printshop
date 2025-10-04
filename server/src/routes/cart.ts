import express from "express";
import Cart from "../models/Cart.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get current cart
router.get("/", auth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.userId }).populate("items.productId");
  res.json(cart || { items: [] });
});

// Add item to cart
router.post("/add", auth, async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.session.userId });

  if (!cart) {
    cart = new Cart({ user: req.session.userId, items: [] });
  }

  const item = cart.items.find((i) => i.productId.toString() === productId);                    // please check this route is only called when cart is not empty
  if (item) {
    item.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  res.json(cart);
});

// Remove item
router.post("/remove", auth, async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ user: req.session.userId });

  if (!cart) return res.status(404).json({ msg: "Cart not found" });

  cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
  await cart.save();

  res.json(cart);
});

export default router;