<<<<<<< HEAD
import "dotenv/config";

=======

import "dotenv/config";
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
export const env = {
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  RZP_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
<<<<<<< HEAD
  RZP_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ""
=======
  RZP_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
};
