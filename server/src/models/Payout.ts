import { Schema, model, Types } from "mongoose";

const PayoutSchema = new Schema(
  {
    sellerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },                 // in INR
    status: { type: String, enum: ["pending","processing","paid","failed"], default: "pending", index: true },
    period: { type: String },                                  // e.g. "2025-10", "Q4-2025"
    txId: { type: String },                                    // gateway / bank reference
    notes: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

export const Payout = model("Payout", PayoutSchema);
