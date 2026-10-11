import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma.service';
import { AuthCredentialsDto } from './auth.dto';
import { PublicUser, VerifiedSession } from './auth.types';

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;
const SESSION_SECONDS = 60 * 60 * 8;
const DUMMY_PASSWORD_HASH = `scrypt$${'0'.repeat(32)}$${'0'.repeat(PASSWORD_KEY_LENGTH * 2)}`;

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly failedLogins = new Map<string, { count: number; resetAt: number }>();
  private readonly loginWindowMs = 15 * 60 * 1000;
  private readonly maxFailedLogins = 10;

  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new Error('JWT_SECRET must be configured with at least 32 bytes in backend/.env.');
    }
    this.jwtSecret = secret;
  }

  async register(credentials: AuthCredentialsDto) {
    try {
      const passwordHash = await this.hashPassword(credentials.password);
      const user = await this.prisma.user.create({
        data: { email: credentials.email, passwordHash },
        select: { id: true, email: true, createdAt: true, role: true },
      });
      return { user, token: this.createSessionToken(user) };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async login(credentials: AuthCredentialsDto) {
    const now = Date.now();
    for (const [email, record] of this.failedLogins) {
      if (record.resetAt <= now) this.failedLogins.delete(email);
    }
    if (this.failedLogins.size >= 10_000 && !this.failedLogins.has(credentials.email)) {
      const oldest = this.failedLogins.keys().next().value;
      if (oldest) this.failedLogins.delete(oldest);
    }
    const attempts = this.failedLogins.get(credentials.email);
    if (attempts && attempts.resetAt <= now) this.failedLogins.delete(credentials.email);
    else if (attempts && attempts.count >= this.maxFailedLogins) {
      throw new HttpException('Too many login attempts. Try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email },
      select: { id: true, email: true, createdAt: true, role: true, passwordHash: true },
    });
    const validPassword = await this.verifyPassword(
      credentials.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !validPassword) {
      const current = this.failedLogins.get(credentials.email);
      this.failedLogins.set(credentials.email, {
        count: current && current.resetAt > now ? current.count + 1 : 1,
        resetAt: current && current.resetAt > now ? current.resetAt : now + this.loginWindowMs,
      });
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    this.failedLogins.delete(credentials.email);
    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
    };
    return { user: publicUser, token: this.createSessionToken(publicUser) };
  }

  async verifySession(token: string): Promise<PublicUser> {
    const claims = this.readSessionToken(token);
    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, createdAt: true, role: true },
    });
    if (!user || user.email !== claims.email) {
      throw new UnauthorizedException('Session is no longer valid.');
    }
    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
    return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
  }

  private async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [, saltHex, expectedHex] = encoded.split('$');
    if (!saltHex || !expectedHex || !/^[a-f0-9]+$/i.test(saltHex + expectedHex)) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== PASSWORD_KEY_LENGTH) return false;
    const actual = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length)) as Buffer;
    return timingSafeEqual(actual, expected);
  }

  private createSessionToken(user: Pick<PublicUser, 'id' | 'email'>): string {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + SESSION_SECONDS,
    })).toString('base64url');
    const content = `${header}.${payload}`;
    return `${content}.${this.sign(content)}`;
  }

  private readSessionToken(token: string): VerifiedSession {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Login is required.');
    const [headerPart, payloadPart, signature] = parts;
    const content = `${headerPart}.${payloadPart}`;
    const expectedSignature = Buffer.from(this.sign(content), 'base64url');
    const actualSignature = Buffer.from(signature, 'base64url');
    if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
      throw new UnauthorizedException('Session token is invalid.');
    }

    try {
      const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as { alg?: string };
      const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as {
        sub?: unknown; email?: unknown; exp?: unknown;
      };
      if (header.alg !== 'HS256' || !Number.isInteger(claims.sub) || typeof claims.email !== 'string' ||
          !Number.isInteger(claims.exp) || (claims.exp as number) <= Math.floor(Date.now() / 1000)) {
        throw new Error('Invalid claims');
      }
      return { sub: claims.sub as number, email: claims.email };
    } catch {
      throw new UnauthorizedException('Session token is invalid or expired.');
    }
  }

  private sign(content: string): string {
    return createHmac('sha256', this.jwtSecret).update(content).digest('base64url');
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error &&
      (error as { code?: unknown }).code === 'P2002';
  }
}
