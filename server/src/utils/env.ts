import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  RZP_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RZP_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ""
};
