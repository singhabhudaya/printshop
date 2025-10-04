import nodemailer from 'nodemailer';

// const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "theprintingmuse@gmail.com",
    pass: "pbuc scma cznp oaqg",
  },
});


export async function sendOTP(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"PrintingMuse" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code. mail generated from nodemailer backend.",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  });
}

// sendOTP("singhabhudaya7@gmail.com", "123456")