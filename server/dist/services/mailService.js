"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class MailService {
    static transporter = null;
    static isGenerating = false;
    static async getTransporter() {
        if (this.transporter)
            return this.transporter;
        if (this.isGenerating) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (this.transporter)
                return this.transporter;
        }
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
        const secure = process.env.SMTP_SECURE === 'true';
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        // Check if configuration is missing, contains placeholder text, or points to local dummy values
        const isPlaceholder = !host || !user || !pass ||
            (host.includes('gmail.com') && user.includes('your_email@gmail.com'));
        if (isPlaceholder) {
            this.isGenerating = true;
            try {
                console.log('[MAIL SERVICE] Credentials missing or placeholder. Generating Ethereal Test SMTP account...');
                const testAccount = await nodemailer_1.default.createTestAccount();
                this.transporter = nodemailer_1.default.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log('[MAIL SERVICE] Dynamic Ethereal Test SMTP account generated successfully.');
                this.isGenerating = false;
                return this.transporter;
            }
            catch (error) {
                console.error('[MAIL SERVICE ERROR] Failed to create Ethereal test transporter:', error);
                this.isGenerating = false;
                return null;
            }
        }
        try {
            this.transporter = nodemailer_1.default.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
            });
            return this.transporter;
        }
        catch (error) {
            console.error('[MAIL SERVICE ERROR] Failed to create nodemailer transporter:', error);
            return null;
        }
    }
    static async sendOtpEmail(email, otp) {
        const transporter = await this.getTransporter();
        if (!transporter) {
            console.warn('[MAIL SERVICE WARNING] Transporter could not be initialized.');
            return false;
        }
        const from = process.env.SMTP_FROM || `"PatentHub" <${process.env.SMTP_USER || 'no-reply@patenthub.ai'}>`;
        const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #006670; margin-bottom: 20px; text-align: center; font-weight: bold;">PatentHub</h2>
        <p style="font-size: 14px; color: #476865; line-height: 1.5;">
          You requested to reset your password. Please use the following 6-digit One-Time Password (OTP) to complete your request. This OTP is valid for 10 minutes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0a2a28; background-color: #f7faf9; border: 1px solid #dce4e2; padding: 10px 25px; border-radius: 8px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #698581; text-align: center; margin-top: 30px; border-top: 1px solid #eef3f2; padding-top: 15px;">
          If you did not request this password reset, you can safely ignore this email.
        </p>
      </div>
    `;
        try {
            const info = await transporter.sendMail({
                from,
                to: email,
                subject: 'Reset your PatentHub password',
                text: `Your PatentHub password reset OTP is: ${otp}. It is valid for 10 minutes.`,
                html: htmlContent,
            });
            console.log(`[MAIL SERVICE] Reset OTP sent successfully to ${email}`);
            const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`\n==================================================`);
                console.log(`[MAIL SERVICE] Ethereal Email Sent!`);
                console.log(`[MAIL SERVICE] Preview URL: ${previewUrl}`);
                console.log(`==================================================\n`);
            }
            return true;
        }
        catch (error) {
            console.error(`[MAIL SERVICE ERROR] Failed to send email to ${email}:`, error);
            return false;
        }
    }
    static async sendActivationEmail(email, fullName, username, otp) {
        const transporter = await this.getTransporter();
        if (!transporter) {
            console.warn('[MAIL SERVICE WARNING] Transporter could not be initialized.');
            return false;
        }
        const from = process.env.SMTP_FROM || `"PatentHub" <${process.env.SMTP_USER || 'no-reply@patenthub.ai'}>`;
        const htmlContent = `
      <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="color: #006670; margin-bottom: 24px; text-align: center; font-weight: 800; font-size: 24px; letter-spacing: -0.5px;">Welcome to PatentHub</h2>
        <p style="font-size: 14px; color: #1e293b; line-height: 1.6; margin-bottom: 20px;">
          Dear <strong>${fullName}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
          Your PatentHub account has been created successfully. To complete your activation and set your account password, please use the credentials and verification code below:
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;">
            <strong style="color: #0f172a;">Generated Username:</strong> 
            <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #006670;">${username}</span>
          </p>
          <p style="margin: 0; font-size: 14px; color: #475569;">
            <strong style="color: #0f172a;">Activation Code (OTP):</strong> 
            <span style="font-family: monospace; font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: 2px;">${otp}</span>
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 20px;">
          Note: This activation OTP is valid for 15 minutes. Please log in and set up your permanent password to access your role dashboard.
        </p>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          Regards,<br />
          <strong>PatentHub AI Team</strong>
        </p>
      </div>
    `;
        try {
            const info = await transporter.sendMail({
                from,
                to: email,
                subject: 'Welcome to PatentHub - Activate Your Account',
                text: `Dear ${fullName}, welcome to PatentHub. Your generated username is: ${username}. Your activation OTP is: ${otp}.`,
                html: htmlContent,
            });
            console.log(`[MAIL SERVICE] Activation email sent successfully to ${email}`);
            const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`\n==================================================`);
                console.log(`[MAIL SERVICE] Ethereal Activation Email Sent!`);
                console.log(`[MAIL SERVICE] Preview URL: ${previewUrl}`);
                console.log(`==================================================\n`);
            }
            return true;
        }
        catch (error) {
            console.error(`[MAIL SERVICE ERROR] Failed to send activation email to ${email}:`, error);
            return false;
        }
    }
}
exports.MailService = MailService;
