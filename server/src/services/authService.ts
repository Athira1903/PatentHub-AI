import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

export const DEFAULT_ROLES = ['Inventor', 'Guide', 'CoInventor', 'PatentExpert', 'Admin'] as const;

// Ensure default roles exist in the database
export const seedRoles = async () => {
  for (const roleName of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
};

export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  institution?: string;
  password: string;
  roleName: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export class AuthService {
  static async register(input: RegisterInput) {
    await seedRoles();

    // Check if email or username already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw new Error('Username is already taken');
    }

    // Find role
    const role = await prisma.role.findUnique({
      where: { name: input.roleName },
    });
    if (!role) {
      throw new Error(`Invalid role selected: ${input.roleName}`);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        username: input.username,
        email: input.email,
        password: hashedPassword,
        institution: input.institution || null,
        roleId: role.id,
      },
      include: {
        role: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role.name },
      process.env.JWT_SECRET || 'patenthub_secret',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        institution: user.institution,
        role: user.role.name,
      },
    };
  }

  static async login(input: LoginInput) {
    // User can login with either email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.emailOrUsername },
          { username: input.emailOrUsername },
        ],
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(input.password, user.password);
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role.name },
      process.env.JWT_SECRET || 'patenthub_secret',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        institution: user.institution,
        role: user.role.name,
      },
    };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        institution: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      role: user.role.name,
    };
  }
}
