import { Router } from "express";
import bcrypt from "bcrypt"; // use bcryptjs to avoid native builds; or keep 'bcrypt' if you prefer
import { User } from "../models/User";           // ⬅️ no `.js` in TS imports
import Otp from "../models/Otp";                 // ⬅️ adjust default/named import to match your model
import { signJwt } from "../utils/jwt";          // ⬅️ no `.js`
import { auth } from "../middleware/auth";       // ⬅️ no `.js`
import { sendOTP } from "../utils/mailer";       // ⬅️ no `.js`

const router = Router();

/**
 * Helpers
 */
function normalizeEmail(raw: unknown): string {
  return String(raw || "").toLowerCase().trim();
}

/**
 * Step 1: Request OTP (email verification)
 */
router.post("/send-otp", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ msg: "Email required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // upsert OTP (overwrite if exists)
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt, verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // await sendOTP(email, otp); // enable when mailer is ready

    res.json({ msg: "OTP sent to email" });
  } catch (e) {
    next(e);
  }
});

/**
 * Step 2: Verify OTP
 */
router.post("/verify-otp", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "");
    if (!email || !otp) return res.status(400).json({ msg: "All fields required" });

    const record = await Otp.findOne({ email });
    if (!record) return res.status(400).json({ msg: "OTP not yet requested" });

    if (record.expiresAt < new Date()) return res.status(400).json({ msg: "OTP expired" });
    if (record.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });

    record.verified = true;
    await record.save();

    res.json({ msg: "OTP verified, you can now set password" });
  } catch (e) {
    next(e);
  }
});

/**
 * Step 3: Register user (only if email verified)
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, password } = req.body as { name: string; password: string };
    const email = normalizeEmail((req.body as any)?.email);

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    // ensure verified
    const record = await Otp.findOne({ email });
    if (!record || !record.verified) return res.status(400).json({ msg: "Email not verified" });
    if (record.expiresAt < new Date()) return res.status(400).json({ msg: "OTP expired" });

    // ensure not already created
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: "buyer" });

    // cleanup OTP entry
    await Otp.deleteOne({ email });

    // optionally auto-login:
    // const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
    // return res.status(201).json({ msg: "User registered", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

    res.status(201).json({ msg: "User registered successfully" });
  } catch (e) {
    next(e);
  }
});

/**
 * Legacy single-step register (kept for reference)
 * // delete this block when done
 */

// router.post("/register", async (req, res, next) => {
//   try {
//     const { name, email, password } = req.body as { name: string; email: string; password: string };
//     if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

//     const emailNorm = normalizeEmail(email);
//     const exists = await User.findOne({ email: emailNorm });
//     if (exists) return res.status(409).json({ error: "Email already in use" });

//     const passwordHash = await bcrypt.hash(password, 12);
//     const user = await User.create({ name, email: emailNorm, passwordHash, role: "buyer" });

//     const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
//     res.status(201).json({
//       token,
//       user: { id: user._id, name: user.name, email: user.email, role: user.role }
//     });
//   } catch (e) { next(e); }
// });

/**
 * Login
 */
router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail((req.body as any)?.email);
    const password = String((req.body as any)?.password || "");

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Me
 */
router.get("/me", auth, async (req, res, next) => {
  try {
    const me = await User.findById(req.user!.id).select("name email role createdAt updatedAt");
    if (!me) return res.status(404).json({ error: "Not found" });
    res.json({
      user: {
        id: me._id,
        name: me.name,
        email: me.email,
        role: me.role,
        createdAt: me.createdAt,
        updatedAt: me.updatedAt
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
