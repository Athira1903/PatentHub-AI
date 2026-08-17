"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationPolicy = void 0;
const db_1 = require("../../config/db");
class AuthenticationPolicy {
    /**
     * Check if a user is allowed to log in.
     */
    static async canLogin(emailOrUsername) {
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username: emailOrUsername },
                    { email: emailOrUsername.toLowerCase() },
                ],
            },
        });
        if (!user)
            return false;
        return user.isActive;
    }
    /**
     * Check if user has permission to access system resources.
     */
    static async canAccessSystem(user) {
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.userId },
        });
        return !!dbUser && dbUser.isActive;
    }
    /**
     * Check if a user account can be activated using a given OTP.
     */
    static async canActivateAccount(username, otp) {
        const user = await db_1.prisma.user.findUnique({
            where: { username },
        });
        if (!user)
            return false;
        if (user.isActive)
            return false;
        if (!user.activationOtp || user.activationOtp !== otp)
            return false;
        if (user.activationOtpExpires && new Date() > user.activationOtpExpires)
            return false;
        return true;
    }
    /**
     * Check if the user is authorized to change their password.
     */
    static async canChangePassword(user) {
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.userId },
        });
        return !!dbUser && dbUser.isActive;
    }
    /**
     * Check if password reset is permitted for an email address.
     */
    static async canResetPassword(email) {
        const user = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        return !!user;
    }
    /**
     * Check if user has system Administrator permissions.
     */
    static isAdmin(user) {
        return user.role === 'Admin' || user.role === 'Administrator';
    }
}
exports.AuthenticationPolicy = AuthenticationPolicy;
