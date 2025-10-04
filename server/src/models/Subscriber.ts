import { Schema, model } from "mongoose";

const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    source: { type: String, default: "web" },
    tags:   [{ type: String }],
  },
  { timestamps: true }
);

export const Subscriber = model("Subscriber", SubscriberSchema);
