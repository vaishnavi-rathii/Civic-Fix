const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CATEGORIES = ['POTHOLE', 'GARBAGE', 'STREETLIGHT', 'WATER_SUPPLY', 'DRAINAGE', 'ROAD_DAMAGE', 'PARK', 'OTHER'];
const STATUSES = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

const SAMPLE_ISSUES = [
  {
    title: 'Large pothole on MG Road near metro exit',
    description: 'A dangerous pothole approximately 2 feet wide near the Rajiv Chowk metro exit. Multiple vehicles have been damaged. The pothole has been here for over 3 weeks.',
    category: 'POTHOLE',
    status: 'IN_PROGRESS',
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'MG Road, near Rajiv Chowk Metro, New Delhi',
  },
  {
    title: 'Overflowing garbage bin at Lodi Garden entrance',
    description: 'The municipal garbage bin at the main entrance of Lodi Garden has not been cleared in 5 days. It is overflowing and causing a foul smell, attracting flies and stray animals.',
    category: 'GARBAGE',
    status: 'OPEN',
    latitude: 28.5931,
    longitude: 77.2197,
    address: 'Lodi Garden Entrance, South Delhi',
  },
  {
    title: '3 consecutive street lights not working near Connaught Place',
    description: 'Three street lights on the stretch between Gate No. 2 and Gate No. 4 of Connaught Place inner circle have been non-functional for 2 weeks. The area is unsafe at night for pedestrians.',
    category: 'STREETLIGHT',
    status: 'RESOLVED',
    latitude: 28.6304,
    longitude: 77.2177,
    address: 'Connaught Place Inner Circle, New Delhi',
  },
  {
    title: 'Burst water main flooding Janpath Road',
    description: 'A water main has burst on Janpath Road near the Jantar Mantar intersection. Water has been flowing since 2 days causing traffic disruption and significant water wastage.',
    category: 'WATER_SUPPLY',
    status: 'IN_REVIEW',
    latitude: 28.6200,
    longitude: 77.2100,
    address: 'Janpath Road, near Jantar Mantar, New Delhi',
  },
  {
    title: 'Blocked storm drain causing flooding in Karol Bagh',
    description: 'The storm drain on the main market road in Karol Bagh is completely blocked with debris and plastic. Even light rain causes the road to flood, disrupting pedestrians and shopkeepers.',
    category: 'DRAINAGE',
    status: 'OPEN',
    latitude: 28.6520,
    longitude: 77.1900,
    address: 'Karol Bagh Main Market Road, New Delhi',
  },
  {
    title: 'Road completely broken on Rohini Sector 15 road',
    description: 'The service road near the Rohini Sector 15 market has completely deteriorated. Half the road width is covered with craters and loose asphalt. Two-wheelers are at serious risk.',
    category: 'ROAD_DAMAGE',
    status: 'OPEN',
    latitude: 28.7215,
    longitude: 77.1025,
    address: 'Sector 15 Service Road, Rohini, Delhi',
  },
  {
    title: 'Park benches broken and playground unusable in Dwarka',
    description: 'Most of the benches in the sector 6 park in Dwarka are broken. The children\'s playground equipment is rusted and dangerous. One swing has collapsed. This park serves hundreds of families.',
    category: 'PARK',
    status: 'IN_REVIEW',
    latitude: 28.5921,
    longitude: 77.0460,
    address: 'Sector 6 Park, Dwarka, New Delhi',
  },
  {
    title: 'Sewage water overflowing on Chandni Chowk lane',
    description: 'Raw sewage is overflowing from a manhole on the small lane behind Dariba Kalan in Chandni Chowk. The drain cover is broken and sewage water has been flooding the lane for 4 days.',
    category: 'DRAINAGE',
    status: 'OPEN',
    latitude: 28.6506,
    longitude: 77.2309,
    address: 'Lane behind Dariba Kalan, Chandni Chowk, Delhi',
  },
  {
    title: 'Illegal encroachment blocking footpath in Saket',
    description: 'A vendor has set up a permanent structure on the footpath near Select Citywalk mall in Saket, completely blocking pedestrian access. People are forced to walk on the road, causing safety hazards.',
    category: 'OTHER',
    status: 'REJECTED',
    latitude: 28.5262,
    longitude: 77.2194,
    address: 'Footpath near Select Citywalk, Saket, New Delhi',
  },
  {
    title: 'Street light pole leaning dangerously in Vasant Kunj',
    description: 'An electricity pole carrying street lights near the DDA flats in Vasant Kunj Sector C is leaning at a 30-degree angle after a storm. It could fall any time and is a serious danger to passersby.',
    category: 'STREETLIGHT',
    status: 'IN_PROGRESS',
    latitude: 28.5213,
    longitude: 77.1580,
    address: 'DDA Flats, Vasant Kunj Sector C, New Delhi',
  },
];

async function main() {
  console.log('Seeding database...');

  // Clean up existing data
  await prisma.statusHistory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminHash = await bcrypt.hash('admin123', 10);
  const citizenHash = await bcrypt.hash('password', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@civicfix.in',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const arjun = await prisma.user.create({
    data: {
      name: 'Arjun Sharma',
      email: 'arjun@example.com',
      passwordHash: citizenHash,
      role: 'CITIZEN',
    },
  });

  const meera = await prisma.user.create({
    data: {
      name: 'Meera Patel',
      email: 'meera@example.com',
      passwordHash: citizenHash,
      role: 'CITIZEN',
    },
  });

  console.log('Created users:', admin.email, arjun.email, meera.email);

  // Create issues and their histories
  const authors = [arjun, meera, arjun, meera, arjun, meera, arjun, meera, arjun, meera];

  const issues = [];
  for (let i = 0; i < SAMPLE_ISSUES.length; i++) {
    const data = SAMPLE_ISSUES[i];
    const author = authors[i];

    const issue = await prisma.issue.create({
      data: {
        ...data,
        photos: '[]',
        authorId: author.id,
        createdAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - (5 - Math.min(i, 4)) * 24 * 60 * 60 * 1000),
      },
    });

    // Initial status history
    await prisma.statusHistory.create({
      data: {
        issueId: issue.id,
        status: 'OPEN',
        note: 'Issue reported by citizen',
        changedBy: author.id,
        createdAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
      },
    });

    // Add subsequent status entries for non-OPEN issues
    if (data.status !== 'OPEN') {
      const transitions = {
        IN_REVIEW: [{ status: 'IN_REVIEW', note: 'Issue received and under review by municipal team', by: admin.id }],
        IN_PROGRESS: [
          { status: 'IN_REVIEW', note: 'Issue received and under review', by: admin.id },
          { status: 'IN_PROGRESS', note: 'Work order issued, team deployed', by: admin.id },
        ],
        RESOLVED: [
          { status: 'IN_REVIEW', note: 'Issue received and under review', by: admin.id },
          { status: 'IN_PROGRESS', note: 'Repair team dispatched', by: admin.id },
          { status: 'RESOLVED', note: 'Issue resolved. Work completed and verified.', by: admin.id },
        ],
        REJECTED: [
          { status: 'IN_REVIEW', note: 'Issue received and under review', by: admin.id },
          { status: 'REJECTED', note: 'Issue rejected: falls under private property, not municipal jurisdiction.', by: admin.id },
        ],
      };

      const steps = transitions[data.status] || [];
      for (let s = 0; s < steps.length; s++) {
        await prisma.statusHistory.create({
          data: {
            issueId: issue.id,
            status: steps[s].status,
            note: steps[s].note,
            changedBy: steps[s].by,
            createdAt: new Date(Date.now() - (8 - i - s) * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    issues.push(issue);
  }

  console.log(`Created ${issues.length} issues`);

  // Add votes
  const voteData = [
    [0, arjun], [0, meera], [0, admin],
    [1, arjun], [1, admin],
    [2, arjun], [2, meera],
    [3, arjun], [3, meera], [3, admin],
    [4, meera],
    [5, arjun], [5, meera],
    [6, admin],
    [9, arjun], [9, meera],
  ];

  for (const [issueIdx, voter] of voteData) {
    await prisma.vote.create({
      data: { issueId: issues[issueIdx].id, userId: voter.id },
    }).catch(() => {}); // ignore unique constraint errors
  }

  // Add comments
  const comments = [
    { issueIdx: 0, author: meera, body: 'This pothole damaged my scooter tyre last week! It needs urgent attention.' },
    { issueIdx: 0, author: admin, body: 'Work order has been issued to the PWD department. Expected repair in 48 hours.' },
    { issueIdx: 1, author: arjun, body: 'The smell has become unbearable. Kids from the nearby school pass this route daily.' },
    { issueIdx: 2, author: meera, body: 'Finally fixed! Great response from the electricity department.' },
    { issueIdx: 3, author: arjun, body: 'The water is now entering nearby shops. Please expedite.' },
    { issueIdx: 4, author: meera, body: 'The flooding has been getting worse. The market traders are very frustrated.' },
    { issueIdx: 7, author: arjun, body: 'Residents have been complaining about this for months. Need immediate action.' },
    { issueIdx: 9, author: meera, body: 'This is a serious safety issue, especially for children walking to school.' },
    { issueIdx: 9, author: admin, body: 'Structural assessment team has been dispatched. Pole will be secured tonight.' },
  ];

  for (const c of comments) {
    await prisma.comment.create({
      data: {
        body: c.body,
        issueId: issues[c.issueIdx].id,
        authorId: c.author.id,
        createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Created votes and comments');
  console.log('\nSeed complete! Demo accounts:');
  console.log('  Admin:   admin@civicfix.in / admin123');
  console.log('  Citizen: arjun@example.com / password');
  console.log('  Citizen: meera@example.com / password');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
