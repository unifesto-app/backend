// Assigns the platform ADMIN role to a user identified by their identity email.
// Usage: node scripts/assign-admin-role.js [email]
//   Defaults to admin@unifesto.app when no email argument is passed.
// Safe to re-run (idempotent: skips if the ADMIN role is already assigned).

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || 'admin@unifesto.app').trim().toLowerCase();
  console.log(`🔎 Looking up user with identity email: ${email}`);

  // Find the identity by email (case-insensitive), then its user.
  const identity = await prisma.userIdentity.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { user: true },
  });

  if (!identity || !identity.user) {
    throw new Error(
      `No user found with email "${email}". Make sure the account has signed up first.`,
    );
  }

  const user = identity.user;
  console.log(`✓ Found user: ${user.id} (${user.fullName ?? 'no name'})`);

  const adminRole = await prisma.role.findUnique({
    where: { code: 'ADMIN' },
  });

  if (!adminRole) {
    throw new Error('ADMIN role not found. Run the seed first: npx prisma db seed');
  }

  // Platform-scoped role: spaceId and eventId are null.
  const existing = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: adminRole.id,
      spaceId: null,
      eventId: null,
    },
  });

  if (existing) {
    console.log('✅ User already has the ADMIN role. Nothing to do.');
    return;
  }

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: adminRole.id,
      spaceId: null,
      eventId: null,
    },
  });

  console.log(`✅ Assigned ADMIN role to ${email} (user ${user.id}).`);
}

main()
  .catch((e) => {
    console.error('❌ Failed to assign ADMIN role:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
