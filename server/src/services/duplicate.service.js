import prisma from '../config/db.js';

// Haversine distance in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findDuplicates(lat, lng, category, title, excludeId = null) {
  // Approximate bounding box for 200m radius (avoids full table scan)
  const latDelta = 0.002; // ~222m
  const lngDelta = 0.003; // ~222m at Delhi latitude

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.issue.findMany({
    where: {
      AND: [
        { latitude: { gte: lat - latDelta, lte: lat + latDelta } },
        { longitude: { gte: lng - lngDelta, lte: lng + lngDelta } },
        { category },
        { createdAt: { gte: thirtyDaysAgo } },
        { status: { notIn: ['RESOLVED', 'REJECTED'] } },
        excludeId ? { id: { not: excludeId } } : {},
      ],
    },
    select: {
      id: true, title: true, status: true, latitude: true, longitude: true,
      createdAt: true, address: true,
      _count: { select: { votes: true } },
    },
    take: 10,
  });

  const duplicates = candidates
    .map(issue => ({
      ...issue,
      distanceMeters: Math.round(haversine(lat, lng, issue.latitude, issue.longitude)),
    }))
    .filter(issue => issue.distanceMeters <= 200)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 3);

  return duplicates;
}
