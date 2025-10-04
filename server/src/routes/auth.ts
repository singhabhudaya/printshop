import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { signJwt } from "../utils/jwt.js";
import { auth } from "../middleware/auth.js";
import { sendOTP } from "../utils/mailer.js";
import Otp from "../models/Otp.js";

const router = Router();


// Step 1: Request OTP to get email verified

router.post("/send-otp", async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: "Email required" });


        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ msg: "User already exists" });


        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min


        // upsert OTP (overwrite if exists)
        await Otp.findOneAndUpdate(
                { email },
                { otp, expiresAt },
                { upsert: true, new: true }
        );

        // await sendOTP(email, otp);   // Uncomment this line to actually send email   

        res.json({ msg: "OTP sent to email" });
});




// Step 2: Verify OTP

router.post("/verify-otp", async (req, res) => {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ msg: "All fields required" });

        const record = await Otp.findOne({ email });
        if (!record) return res.status(400).json({ msg: "OTP not yet requested" });

        if (record.expiresAt < new Date()) return res.status(400).json({ msg: "OTP expired" });

        if (record.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });

        // ✅ Mark as verified
        record.verified = true;
        await record.save();

        res.json({ msg: "OTP verified, you can now set password" });
});



// Step 3: Register user (set password) - only if email is verified. User will have to first verify email and then be allowed to set password.



router.post("/register", async (req, res, next) => {
        const { name, email, password } = req.body as { name: string; email: string; password: string };
        if (!name || !email || !password)
                return res.status(400).json({ msg: "All fields required" });


        const emailNorm = email.toLowerCase().trim();

        const record = await Otp.findOne({ email });
        if (!record || !record.verified) return res.status(400).json({ msg: "Email not verified" });

        if (record.expiresAt < new Date()) return res.status(400).json({ msg: "OTP expired" });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email: emailNorm, passwordHash, role: "buyer" });



        // cleanup OTP entry
        await Otp.deleteOne({ email });

        res.json({ msg: "User registered successfully" });
});



// this is the old register route, kept here for reference. It can be deleted later. (Written by Jai, I have replaced it with the above 3-step OTP based registration flow)

/** POST /api/auth/register */
// router.post("/register", async (req, res, next) => {
//         try {
//                 const { name, email, password } = req.body as { name: string; email: string; password: string };
//                 if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

//                 const emailNorm = email.toLowerCase().trim();
//                 const exists = await User.findOne({ email: emailNorm });
//                 if (exists) return res.status(409).json({ error: "Email already in use" });

//                 const passwordHash = await bcrypt.hash(password, 12);
//                 const user = await User.create({ name, email: emailNorm, passwordHash, role: "buyer" });

//                 const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
//                 res.status(201).json({
//                   token,
//                   user: { id: user._id, name: user.name, email: user.email, role: user.role }
//                 });
//         } catch (e) { next(e); }
// });







/** POST /api/auth/login */


router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});








/** GET /api/auth/me */
router.get("/me", auth, async (req, res, next) => {
  try {
    const me = await User.findById(req.user!.id).select("name email role createdAt updatedAt");
    if (!me) return res.status(404).json({ error: "Not found" });
    res.json({ user: { id: me._id, name: me.name, email: me.email, role: me.role, createdAt: me.createdAt, updatedAt: me.updatedAt } });
  } catch (e) { next(e); }
});

export default router;
