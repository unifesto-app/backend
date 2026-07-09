"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    console.log('Creating default roles...');
    const roles = [
        {
            code: client_1.RoleCode.ADMIN,
            name: 'Platform Administrator',
            scope: client_1.RoleScope.PLATFORM,
        },
        {
            code: client_1.RoleCode.ORGANISER,
            name: 'Organiser',
            scope: client_1.RoleScope.SPACE,
        },
        {
            code: client_1.RoleCode.CO_ORGANISER,
            name: 'Co-Organiser',
            scope: client_1.RoleScope.SPACE,
        },
        {
            code: client_1.RoleCode.MEMBER,
            name: 'Member',
            scope: client_1.RoleScope.SPACE,
        },
        {
            code: client_1.RoleCode.VOLUNTEER,
            name: 'Volunteer',
            scope: client_1.RoleScope.EVENT,
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
//# sourceMappingURL=seed.js.map