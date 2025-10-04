import { Schema, model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // unique index lives here; DO NOT also call schema.index({slug:1})
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export const Category = model("Category", CategorySchema);
