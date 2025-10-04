import { Schema, model, Types } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product" },
    title: { type: String, required: true },     // snapshot so history survives edits
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },     // per unit in INR
    image: { type: String },                     // optional snapshot image
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    buyerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true, validate: v => v.length > 0 },
    amount: { type: Number, required: true },       // total in INR
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending","confirmed","in_progress","shipped","delivered","cancelled"],
      default: "pending",
      index: true
    },
    paymentStatus: { type: String, enum: ["unpaid","paid","refunded"], default: "unpaid", index: true },
    notes: { type: String },
    meta: { type: Object },                         // any extra (files, customizations)
  },
  { timestamps: true }
);

export const Order = model("Order", OrderSchema);
