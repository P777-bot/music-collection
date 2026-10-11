import { PrismaClient } from '@prisma/client';
import { loadProjectEnvironment } from '../src/config/load-env';

async function main(): Promise<void> {
  loadProjectEnvironment();
  const email = process.argv[2]?.trim().toLowerCase();
  const confirmedEmail = process.argv[3]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run promote-admin -- <existing-account-email> <confirm-same-email>');
  }
  if (confirmedEmail !== email) throw new Error('Confirmation must exactly match the target account email.');

  const prisma = new PrismaClient();
  try {
    const target = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });
    if (!target) throw new Error('No existing account matches that email.');
    if (target.role === 'ADMIN') {
      console.log('This account is already an ADMIN.');
      return;
    }
    await prisma.user.update({ where: { id: target.id }, data: { role: 'ADMIN' } });
    console.log(`ADMIN role granted to ${target.email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Admin promotion failed.');
  process.exitCode = 1;
});
