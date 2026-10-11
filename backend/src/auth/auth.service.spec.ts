import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const previousSecret = process.env.JWT_SECRET;
  const safeUser = { id: 7, email: 'user@example.test', role: 'USER' as const, createdAt: new Date('2026-01-01T00:00:00Z') };
  let prisma: { user: { create: jest.Mock; findUnique: jest.Mock } };
  let service: AuthService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-secret-that-is-long-enough-for-hmac-256';
    prisma = { user: { create: jest.fn(), findUnique: jest.fn() } };
    service = new AuthService(prisma as unknown as PrismaService);
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it('hashes passwords, issues a signed session, and returns only public user fields', async () => {
    prisma.user.create.mockResolvedValue(safeUser);
    const registered = await service.register({ email: safeUser.email, password: 'StrongPassword123' });
    expect(registered.user).toEqual(safeUser);
    expect(registered.user).not.toHaveProperty('passwordHash');
    expect(prisma.user.create.mock.calls[0][0].data.passwordHash).toMatch(/^scrypt\$/);
    expect(prisma.user.create.mock.calls[0][0].data.passwordHash).not.toBe('StrongPassword123');

    const passwordHash = prisma.user.create.mock.calls[0][0].data.passwordHash;
    prisma.user.findUnique.mockImplementation(async ({ select }) =>
      select.passwordHash ? { ...safeUser, passwordHash } : safeUser,
    );
    await expect(service.verifySession(registered.token)).resolves.toEqual(safeUser);
    await expect(service.login({ email: safeUser.email, password: 'WrongPassword123' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.login({ email: safeUser.email, password: 'StrongPassword123' }))
      .resolves.toMatchObject({ user: safeUser, token: expect.any(String) });
  });

  it('returns a conflict when the unique email already exists', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.register({ email: safeUser.email, password: 'StrongPassword123' }))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
