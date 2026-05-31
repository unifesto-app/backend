import { PrismaClient, RoleCode, RoleScope } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Roles
  console.log('Creating default roles...');

  const roles = [
    {
      code: RoleCode.ADMIN,
      name: 'Platform Administrator',
      scope: RoleScope.PLATFORM,
    },
    {
      code: RoleCode.SUPER_ORGANISER,
      name: 'Super Organiser',
      scope: RoleScope.SPACE,
    },
    {
      code: RoleCode.ORGANISER,
      name: 'Organiser',
      scope: RoleScope.SPACE,
    },
    {
      code: RoleCode.CO_ORGANISER,
      name: 'Co-Organiser',
      scope: RoleScope.SPACE,
    },
    {
      code: RoleCode.MEMBER,
      name: 'Member',
      scope: RoleScope.SPACE,
    },
  ];

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
    console.log(`✓ Created role: ${created.name} (${created.code})`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
