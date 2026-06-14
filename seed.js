const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function seed() {
  const userId = 'cb45e236-3d65-46e2-83d4-13d2e0d87b21';
  const organiserRoleId = '20c407ed-1962-4285-ac55-a35c452a9b22';

  const space = await p.space.create({
    data: {
      name: 'Unifesto Tech Community',
      slug: 'unifesto-tech-' + Date.now(),
      description: 'A community for tech enthusiasts in Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      status: 'APPROVED',
      visibility: 'PUBLIC',
      type: 'REGULAR',
      plan: 'PRO',
      createdBy: userId,
      approvedBy: userId,
      approvedAt: new Date(),
      submittedAt: new Date(),
      userRoles: {
        create: {
          user: { connect: { id: userId } },
          role: { connect: { id: organiserRoleId } },
        }
      }
    }
  });
  console.log('Space:', space.id, space.name);

  const rsvpEvent = await p.event.create({
    data: {
      title: 'Unifesto Tech Meetup',
      slug: 'unifesto-tech-meetup-' + Date.now(),
      description: 'A fun tech meetup for developers and designers.',
      spaceId: space.id,
      createdBy: userId,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      registrationType: 'RSVP',
      isFree: true,
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      type: 'IN_PERSON',
      category: 'Technology',
      venueName: 'T-Hub',
      venueAddress: 'Raidurgam, Hyderabad',
      startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 100,
    }
  });
  console.log('RSVP Event:', rsvpEvent.id, rsvpEvent.slug);

  const ticketedEvent = await p.event.create({
    data: {
      title: 'Unifesto Dev Conference 2026',
      slug: 'unifesto-dev-conf-' + Date.now(),
      description: 'Annual developer conference with workshops and talks.',
      spaceId: space.id,
      createdBy: userId,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      registrationType: 'TICKETED',
      isFree: false,
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      type: 'IN_PERSON',
      category: 'Technology',
      venueName: 'HICC',
      venueAddress: 'Madhapur, Hyderabad',
      startDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      capacity: 500,
    }
  });
  console.log('Ticketed Event:', ticketedEvent.id, ticketedEvent.slug);

  await p.ticketType.createMany({
    data: [
      { eventId: ticketedEvent.id, name: 'General Admission', description: 'Access to all talks', price: '999', currency: 'INR', quantity: 400, maxPerUser: 2 },
      { eventId: ticketedEvent.id, name: 'VIP Pass', description: 'Front row + lunch', price: '2499', currency: 'INR', quantity: 100, maxPerUser: 1 },
    ]
  });
  console.log('Ticket types created');

  await p.wallet.upsert({
    where: { userId },
    create: { userId, balance: 150 },
    update: {},
  });

  console.log('\nDone!');
  console.log('Space ID:', space.id);
  console.log('RSVP slug:', rsvpEvent.slug);
  console.log('Ticketed slug:', ticketedEvent.slug);
}

seed().catch(console.error).finally(() => p.$disconnect());
