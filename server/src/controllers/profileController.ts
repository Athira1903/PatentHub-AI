import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials are set
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Zod validation schemas
const createProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Full name must be at least 3 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  dob: z.string().transform((val) => new Date(val)),
  gender: z.string().trim().min(1, 'Gender is required'),
  institution: z.string().trim().min(1, 'Institution name is required'),
  department: z.string().trim().min(1, 'Department is required'),
  designation: z.string().trim().min(1, 'Designation is required'),
  organization: z.string().trim().optional(),
  role: z.enum(['Inventor', 'Co-Inventor', 'Guide', 'Patent Expert', 'Administrator']),
  researchDomain: z.string().trim().min(1, 'Research domain is required'),
  bio: z.string().trim().max(300, 'Biography cannot exceed 300 characters').optional().nullable(),
  profileImage: z.string().trim().optional().nullable(),
});

const updateProfileSchema = createProfileSchema.partial();

export const createProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    const validatedData = createProfileSchema.parse(req.body);

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
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
    } else {
      profile = await prisma.profile.create({
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

    // Sync full name and institution in the User model if updated
    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: validatedData.fullName,
        institution: validatedData.institution,
      },
    });

    res.status(200).json({
      message: 'Profile completed successfully!',
      profile,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to create profile.' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ message: 'Profile not found. Onboarding incomplete.' });
      return;
    }

    res.status(200).json({ status: 'success', profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve profile.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });
    if (!existingProfile) {
      res.status(404).json({ message: 'Profile does not exist. Please complete onboarding first.' });
      return;
    }

    const updatedProfile = await prisma.profile.update({
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

    // Keep User table synced
    if (validatedData.fullName || validatedData.institution) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: validatedData.fullName,
          institution: validatedData.institution,
        },
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully!',
      profile: updatedProfile,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to update profile.' });
  }
};

export const uploadPhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'patenthub_profiles' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });
      imageUrl = uploadResult.secure_url;
    } else {
      // Fallback: save locally in the server's public directory
      const uploadDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(req.file.originalname) || '.jpg';
      const fileName = `profile_${userId}_${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, req.file.buffer);
      console.log(`[MAIL SERVICE FALLBACK] Photo saved locally at ${filePath}`);
      
      // Serve via Express local URL structure
      imageUrl = `/uploads/${fileName}`;
    }

    // Save image URL to Profile
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      await prisma.profile.update({
        where: { userId },
        data: { profileImage: imageUrl },
      });
    }

    res.status(200).json({
      message: 'Profile photo uploaded successfully!',
      profileImage: imageUrl,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Photo upload failed.' });
  }
};

export const deletePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access.' });
      return;
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found.' });
      return;
    }

    // Delete photo in database
    await prisma.profile.update({
      where: { userId },
      data: { profileImage: null },
    });

    res.status(200).json({ message: 'Profile photo removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete profile photo.' });
  }
};