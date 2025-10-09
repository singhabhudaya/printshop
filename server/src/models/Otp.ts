import mongoose, { Schema, Document, Model } from "mongoose";

export interface OtpDoc extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<OtpDoc>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      unique: true, // single active OTP doc per email
    },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete at expiresAt (Mongo's TTL monitor runs ~every 60s)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp: Model<OtpDoc> =
  mongoose.models.Otp || mongoose.model<OtpDoc>("Otp", otpSchema);

export default Otp;
