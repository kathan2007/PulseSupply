import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthenticatedUser } from '../middlewares/auth.middleware';

export class AuthService {
  public static async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError(`User with email '${data.email}' already exists`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'STAFF',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  public static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password credentials');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password credentials');
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  public static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    return user;
  }

  private static generateToken(payload: AuthenticatedUser): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });
  }
}

