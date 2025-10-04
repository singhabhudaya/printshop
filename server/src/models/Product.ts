import { Schema, model, Types } from "mongoose";

const ProductSchema = new Schema({
  title: { type: String, required: true, index: "text" },
  description: { type: String, default: "" },
  price: { type: Number, required: true, index: true },
  images: [{ type: String }],
  categoryId: { type: Types.ObjectId, ref: "Category" },
  sellerId: { type: Types.ObjectId, ref: "User", required: false, index: true },
}, { timestamps: true });

export const Product = model("Product", ProductSchema);
