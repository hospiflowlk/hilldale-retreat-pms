import { db } from './index';
import { rooms } from './schema';
import { INITIAL_ROOMS } from '../../src/data/pmsData';
import * as dotenv from 'dotenv';
dotenv.config();

async function seedRooms() {
  console.log('?? Seeding Rooms & PMS Data...');
  try {
    console.log('Inserting Rooms...');
    for (const r of INITIAL_ROOMS) {
      await db.insert(rooms).values({
        id: r.id,
        number: r.number,
        name: r.name,
        type: r.name,
        floor: r.floor,
        basePriceUSD: r.basePriceUSD.toString(),
        capacity: r.capacity,
        bedType: r.bedType,
        amenities: r.amenities,
        housekeepingStatus: r.housekeepingStatus,
        isAvailableForOnlineBooking: r.isAvailableForOnlineBooking,
        notes: r.notes,
      }).onConflictDoUpdate({
        target: rooms.id,
        set: {
          name: r.name,
          type: r.name,
          floor: r.floor,
          basePriceUSD: r.basePriceUSD.toString(),
          capacity: r.capacity,
          bedType: r.bedType,
          amenities: r.amenities,
          housekeepingStatus: r.housekeepingStatus,
          isAvailableForOnlineBooking: r.isAvailableForOnlineBooking,
          notes: r.notes,
        }
      });
    }
    console.log('? Rooms seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('? Seeding failed:', err);
    process.exit(1);
  }
}

seedRooms();
