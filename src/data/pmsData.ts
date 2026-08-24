import { Room, Booking, ChannelConfig, ChannelSyncLog } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-101',
    number: '101',
    name: 'Deluxe Room with Balcony Ground Floor',
    floor: 'Ground Floor',
    basePriceUSD: 140,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'King Bed',
    amenities: ['Ground Floor Balcony', 'Tea/Coffee Maker', 'Rain Shower', 'Free High-Speed Wi-Fi', 'Mountain Garden View', 'Work Desk'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'Easy access ground floor unit, ideal for guests preferring no stairs.'
  },
  {
    id: 'room-102',
    number: '102',
    name: 'Deluxe Room with Balcony Ground Floor',
    floor: 'Ground Floor',
    basePriceUSD: 140,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'King Bed',
    amenities: ['Ground Floor Balcony', 'Tea/Coffee Maker', 'Rain Shower', 'Free High-Speed Wi-Fi', 'Garden & Tea View', 'Mini Safe'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'Adjacent to main courtyard pathway.'
  },
  {
    id: 'room-103',
    number: '103',
    name: 'Deluxe King Room with Garden',
    floor: 'Ground Floor',
    basePriceUSD: 165,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'Super King Bed',
    amenities: ['Private Garden Patio', 'Sun Loungers', 'Espresso Machine', 'Luxury Soaking Tub', 'Panoramic Nature View', 'Free Wi-Fi'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'Premium ground floor suite with direct private garden lawn.'
  },
  {
    id: 'room-201',
    number: '201',
    name: 'Deluxe Room with Balcony',
    floor: '1st Floor',
    basePriceUSD: 150,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'King Bed',
    amenities: ['Private Mountain Balcony', 'Elevated Valley View', 'Ceylon Tea Station', 'Rain Shower', 'Smart TV', 'Free Wi-Fi'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'First floor corner unit with panoramic Ella Rock vista.'
  },
  {
    id: 'room-202',
    number: '202',
    name: 'Deluxe Room with Balcony',
    floor: '1st Floor',
    basePriceUSD: 150,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'King Bed',
    amenities: ['Private Balcony', 'Forest & Valley View', 'Ceylon Tea Station', 'Rain Shower', 'Mini Fridge', 'Free Wi-Fi'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'Quiet first floor balcony room facing mountain mist.'
  },
  {
    id: 'room-301',
    number: '301',
    name: 'Deluxe Room with Balcony',
    floor: '2nd Floor (Top Level)',
    basePriceUSD: 160,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'King Bed',
    amenities: ['Top-Floor Vista Balcony', 'Highest Sunrise Viewpoint', 'Ceylon Tea Bar', 'Rain Shower', 'Boutique Toiletries', 'Free Wi-Fi'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'Top floor vantage point with unobstructed hill country sunrise.'
  },
  {
    id: 'room-302',
    number: '302',
    name: 'Deluxe Room with Balcony',
    floor: '2nd Floor (Top Level)',
    basePriceUSD: 160,
    capacity: { adults: 2, children: 1, maxGuests: 3 },
    bedType: 'King Bed',
    amenities: ['Top-Floor Vista Balcony', 'Valley & Tea Estate Panorama', 'Ceylon Tea Bar', 'Rain Shower', 'Mini Safe', 'Free Wi-Fi'],
    housekeepingStatus: 'clean',
    isAvailableForOnlineBooking: true,
    notes: 'Top floor balcony unit, ready for guests.'
  }
];

export const INITIAL_CHANNELS: ChannelConfig[] = [
  {
    id: 'booking_com',
    name: 'Booking.com',
    icon: '🏨',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    commissionRate: 15,
    autoRateSync: true,
    autoAvailabilitySync: true,
    activeListingsCount: 7,
    iCalExportUrl: 'https://api.hilldaleretreat.com/ical/booking-com/all-rooms.ics',
    apiCredentialsSet: true
  },
  {
    id: 'agoda',
    name: 'Agoda YCS',
    icon: '🌏',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    commissionRate: 14,
    autoRateSync: true,
    autoAvailabilitySync: true,
    activeListingsCount: 7,
    iCalExportUrl: 'https://api.hilldaleretreat.com/ical/agoda/all-rooms.ics',
    apiCredentialsSet: true
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏡',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    commissionRate: 3,
    autoRateSync: true,
    autoAvailabilitySync: true,
    activeListingsCount: 7,
    iCalExportUrl: 'https://api.hilldaleretreat.com/ical/airbnb/all-rooms.ics',
    apiCredentialsSet: true
  },
  {
    id: 'expedia',
    name: 'Expedia Partner Central',
    icon: '✈️',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    commissionRate: 18,
    autoRateSync: true,
    autoAvailabilitySync: true,
    activeListingsCount: 7,
    iCalExportUrl: 'https://api.hilldaleretreat.com/ical/expedia/all-rooms.ics',
    apiCredentialsSet: true
  },
  {
    id: 'direct_website',
    name: 'Hilldale Direct Web Engine',
    icon: '🌐',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    commissionRate: 0,
    autoRateSync: true,
    autoAvailabilitySync: true,
    activeListingsCount: 7,
    iCalExportUrl: 'https://api.hilldaleretreat.com/ical/direct/all-rooms.ics',
    apiCredentialsSet: true
  },
  {
    id: 'walk_in',
    name: 'Front Desk Walk-In',
    icon: '🛎️',
    status: 'connected',
    lastSyncAt: new Date().toISOString(),
    commissionRate: 0,
    autoRateSync: false,
    autoAvailabilitySync: true,
    activeListingsCount: 7,
    iCalExportUrl: '',
    apiCredentialsSet: true
  }
];

export const INITIAL_SYNC_LOGS: ChannelSyncLog[] = [];

export const INITIAL_BOOKINGS: Booking[] = [];
