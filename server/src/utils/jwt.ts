import jwt from "jsonwebtoken";

export function signJwt(payload: {
  id: string;
  role: "buyer" | "seller" | "admin";
  email?: string;
  name?: string;
}) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}
