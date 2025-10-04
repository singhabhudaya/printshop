import { Schema, model } from "mongoose";

const SellerApplicationSchema = new Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    portfolioUrl: { type: String },
    message: { type: String },

    status: { type: String, enum: ["submitted","under_review","approved","rejected"], default: "submitted", index: true },
    reviewedBy: { type: String },          // admin email/id
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

export const SellerApplication = model("SellerApplication", SellerApplicationSchema);
