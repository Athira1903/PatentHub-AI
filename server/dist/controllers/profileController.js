"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePhoto = exports.uploadPhoto = exports.updateProfile = exports.getProfile = exports.createProfile = void 0;
const zod_1 = require("zod");
const db_1 = require("../config/db");
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Configure Cloudinary if credentials are set
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
// Zod validation schemas
const createProfileSchema = zod_1.z.object({
    fullName: zod_1.z
        .string()
        .trim()
        .min(3, 'Full name must be at least 3 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    dob: zod_1.z.string().transform((val) => new Date(val)),
    gender: zod_1.z.string().trim().min(1, 'Gender is required'),
    institution: zod_1.z.string().trim().min(1, 'Institution name is required'),
    department: zod_1.z.string().trim().min(1, 'Department is required'),
    designation: zod_1.z.string().trim().min(1, 'Designation is required'),
    organization: zod_1.z.string().trim().optional(),
    role: zod_1.z.enum(['Inventor', 'Co-Inventor', 'Guide', 'Patent Expert', 'Administrator']),
    researchDomain: zod_1.z.string().trim().min(1, 'Research domain is required'),
    bio: zod_1.z.string().trim().max(300, 'Biography cannot exceed 300 characters').optional().nullable(),
    profileImage: zod_1.z.string().trim().optional().nullable(),
});
const updateProfileSchema = createProfileSchema.partial();
const mapRoleNameToDbRole = (roleString) => {
    if (!roleString)
        return 'Inventor';
    const clean = roleString.trim();
    if (clean === 'Guide' || clean === 'Faculty Guide')
        return 'Guide';
    if (clean === 'Patent Expert' || clean === 'PatentExpert')
        return 'PatentExpert';
    if (clean === 'Co-Inventor' || clean === 'CoInventor')
        return 'CoInventor';
    if (clean === 'Administrator' || clean === 'Admin')
        return 'Admin';
    return 'Inventor';
};
const createProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        // Check if profile already exists
        const existingProfile = await db_1.prisma.profile.findUnique({
            where: { userId },
        });
        const validatedData = createProfileSchema.parse(req.body);
        let profile;
        if (existingProfile) {
            profile = await db_1.prisma.profile.update({
                where: { userId },
                data: {
                    phone: validatedData.phone,
                    dob: validatedData.dob,
                    gender: validatedData.gender,
                    institution: validatedData.institution,
                    department: validatedData.department,
                    designation: validatedData.designation,
                    organization: validatedData.organization || null,
                    researchDomain: validatedData.researchDomain,
                    bio: validatedData.bio || null,
                    profileImage: validatedData.profileImage || existingProfile.profileImage,
                    profileCompleted: true,
                },
            });
        }
        else {
            profile = await db_1.prisma.profile.create({
                data: {
                    userId,
                    phone: validatedData.phone,
                    dob: validatedData.dob,
                    gender: validatedData.gender,
                    institution: validatedData.institution,
                    department: validatedData.department,
                    designation: validatedData.designation,
                    organization: validatedData.organization || null,
                    researchDomain: validatedData.researchDomain,
                    bio: validatedData.bio || null,
                    profileImage: validatedData.profileImage || null,
                    profileCompleted: true,
                },
            });
        }
        // Look up and assign exact database role
        const dbRoleName = mapRoleNameToDbRole(validatedData.role);
        const roleRecord = await db_1.prisma.role.upsert({
            where: { name: dbRoleName },
            update: {},
            create: { name: dbRoleName },
        });
        // Sync full name, institution, and roleId in User model
        await db_1.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: validatedData.fullName,
                institution: validatedData.institution,
                roleId: roleRecord.id,
            },
        });
        res.status(200).json({
            message: 'Profile completed successfully!',
            profile,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                message: error.errors[0]?.message || 'Validation failed',
                errors: error.errors,
            });
            return;
        }
        res.status(500).json({ message: error.message || 'Failed to create profile.' });
    }
};
exports.createProfile = createProfile;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const profile = await db_1.prisma.profile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        email: true,
                        fullName: true,
                        username: true,
                        role: true,
                    },
                },
            },
        });
        if (!profile) {
            res.status(404).json({ message: 'Profile not found. Onboarding incomplete.' });
            return;
        }
        res.status(200).json({ status: 'success', profile });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to retrieve profile.' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const validatedData = updateProfileSchema.parse(req.body);
        const existingProfile = await db_1.prisma.profile.findUnique({
            where: { userId },
        });
        if (!existingProfile) {
            res.status(404).json({ message: 'Profile does not exist. Please complete onboarding first.' });
            return;
        }
        const updatedProfile = await db_1.prisma.profile.update({
            where: { userId },
            data: {
                phone: validatedData.phone,
                dob: validatedData.dob,
                gender: validatedData.gender,
                institution: validatedData.institution,
                department: validatedData.department,
                designation: validatedData.designation,
                organization: validatedData.organization,
                researchDomain: validatedData.researchDomain,
                bio: validatedData.bio,
                profileImage: validatedData.profileImage,
            },
        });
        // Keep User table synced (excluding role unless caller is Admin)
        const userUpdateData = {};
        if (validatedData.fullName)
            userUpdateData.fullName = validatedData.fullName;
        if (validatedData.institution)
            userUpdateData.institution = validatedData.institution;
        if (validatedData.role && req.user?.role === 'Admin') {
            const dbRoleName = mapRoleNameToDbRole(validatedData.role);
            const roleRecord = await db_1.prisma.role.upsert({
                where: { name: dbRoleName },
                update: {},
                create: { name: dbRoleName },
            });
            userUpdateData.roleId = roleRecord.id;
        }
        if (Object.keys(userUpdateData).length > 0) {
            await db_1.prisma.user.update({
                where: { id: userId },
                data: userUpdateData,
            });
        }
        res.status(200).json({
            message: 'Profile updated successfully!',
            profile: updatedProfile,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                message: error.errors[0]?.message || 'Validation failed',
                errors: error.errors,
            });
            return;
        }
        res.status(500).json({ message: error.message || 'Failed to update profile.' });
    }
};
exports.updateProfile = updateProfile;
const uploadPhoto = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: 'Please upload an image file.' });
            return;
        }
        let imageUrl = '';
        if (isCloudinaryConfigured) {
            // Upload to Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'patenthub_profiles' }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                stream.end(req.file.buffer);
            });
            imageUrl = uploadResult.secure_url;
        }
        else {
            // Fallback: save locally in the server's public directory
            const uploadDir = path_1.default.join(__dirname, '../../public/uploads');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            const fileExtension = path_1.default.extname(req.file.originalname) || '.jpg';
            const fileName = `profile_${userId}_${Date.now()}${fileExtension}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            fs_1.default.writeFileSync(filePath, req.file.buffer);
            console.log(`[MAIL SERVICE FALLBACK] Photo saved locally at ${filePath}`);
            // Serve via Express local URL structure
            imageUrl = `/uploads/${fileName}`;
        }
        // Save image URL to Profile
        const profile = await db_1.prisma.profile.findUnique({ where: { userId } });
        if (profile) {
            await db_1.prisma.profile.update({
                where: { userId },
                data: { profileImage: imageUrl },
            });
        }
        res.status(200).json({
            message: 'Profile photo uploaded successfully!',
            profileImage: imageUrl,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Photo upload failed.' });
    }
};
exports.uploadPhoto = uploadPhoto;
const deletePhoto = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        const profile = await db_1.prisma.profile.findUnique({ where: { userId } });
        if (!profile) {
            res.status(404).json({ message: 'Profile not found.' });
            return;
        }
        // Delete photo in database
        await db_1.prisma.profile.update({
            where: { userId },
            data: { profileImage: null },
        });
        res.status(200).json({ message: 'Profile photo removed successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete profile photo.' });
    }
};
exports.deletePhoto = deletePhoto;
