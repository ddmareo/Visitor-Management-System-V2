import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function to generate random date between two dates
function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Helper function to check if date is weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Helper function to check if date is a holiday (Indonesian public holidays)
function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  // Indonesian public holidays (simplified list)
  const holidays = [
    // 2024
    { year: 2024, month: 1, day: 1 }, // New Year
    { year: 2024, month: 2, day: 8 }, // Isra and Mi'raj
    { year: 2024, month: 2, day: 10 }, // Chinese New Year
    { year: 2024, month: 3, day: 11 }, // Nyepi
    { year: 2024, month: 3, day: 29 }, // Good Friday
    { year: 2024, month: 4, day: 10 }, // Eid al-Fitr
    { year: 2024, month: 4, day: 11 }, // Eid al-Fitr
    { year: 2024, month: 5, day: 1 }, // Labor Day
    { year: 2024, month: 5, day: 9 }, // Ascension Day
    { year: 2024, month: 6, day: 1 }, // Pancasila Day
    { year: 2024, month: 6, day: 17 }, // Eid al-Adha
    { year: 2024, month: 8, day: 17 }, // Independence Day
    { year: 2024, month: 9, day: 7 }, // Islamic New Year
    { year: 2024, month: 11, day: 16 }, // Prophet's Birthday
    { year: 2024, month: 12, day: 25 }, // Christmas

    // 2025
    { year: 2025, month: 1, day: 1 }, // New Year
    { year: 2025, month: 1, day: 29 }, // Chinese New Year
    { year: 2025, month: 2, day: 27 }, // Isra and Mi'raj
    { year: 2025, month: 3, day: 22 }, // Nyepi
    { year: 2025, month: 3, day: 30 }, // Eid al-Fitr
    { year: 2025, month: 3, day: 31 }, // Eid al-Fitr
    { year: 2025, month: 4, day: 18 }, // Good Friday
    { year: 2025, month: 5, day: 1 }, // Labor Day
    { year: 2025, month: 5, day: 29 }, // Ascension Day
    { year: 2025, month: 6, day: 1 }, // Pancasila Day
    { year: 2025, month: 6, day: 6 }, // Eid al-Adha
  ];

  return holidays.some(
    (holiday) =>
      holiday.year === year && holiday.month === month && holiday.day === day
  );
}

// Helper function to generate business hours (8 AM - 6 PM)
function getBusinessHours(date: Date): { checkIn: Date; checkOut: Date } {
  const checkIn = new Date(date);
  // Check-in between 8 AM and 4 PM (to allow for reasonable duration)
  const checkInHour = 8 + Math.floor(Math.random() * 8); // 8-15 (8 AM - 3 PM)
  const checkInMinute = Math.floor(Math.random() * 60);
  checkIn.setHours(checkInHour, checkInMinute, 0, 0);

  const checkOut = new Date(checkIn);
  // Visit duration between 30 minutes to 4 hours
  const durationMinutes = 30 + Math.floor(Math.random() * 210); // 30-240 minutes
  checkOut.setTime(checkIn.getTime() + durationMinutes * 60 * 1000);

  // Ensure checkout doesn't go past 6 PM (18:00)
  const maxCheckout = new Date(date);
  maxCheckout.setHours(18, 0, 0, 0);

  if (checkOut > maxCheckout) {
    checkOut.setTime(maxCheckout.getTime());
  }

  return { checkIn, checkOut };
}

// Helper function to generate vehicle number
function generateVehicleNumber(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  // Indonesian format: X 1234 XX
  const firstLetter = letters[Math.floor(Math.random() * letters.length)];
  const nums = Array.from(
    { length: 4 },
    () => numbers[Math.floor(Math.random() * numbers.length)]
  ).join("");
  const lastLetters = Array.from(
    { length: 2 },
    () => letters[Math.floor(Math.random() * letters.length)]
  ).join("");

  return `${firstLetter} ${nums} ${lastLetters}`;
}

// Helper function to generate QR code
function generateQRCode(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Helper function to get realistic visit count for a given date
function getRealisticVisitCount(date: Date): number {
  const isWeekendDay = isWeekend(date);
  const isHolidayDay = isHoliday(date);

  // Base counts
  const baseWeekdayCount = 25; // Average 25 visits per weekday
  const baseWeekendCount = 8; // Average 8 visits per weekend day
  const baseHolidayCount = 3; // Average 3 visits per holiday

  let baseCount: number;

  if (isHolidayDay) {
    baseCount = baseHolidayCount;
  } else if (isWeekendDay) {
    baseCount = baseWeekendCount;
  } else {
    baseCount = baseWeekdayCount;
  }

  // Add some randomness (-20% to +30% of base count)
  const variance = 0.2 + Math.random() * 0.5; // 0.2 to 0.7
  const finalCount = Math.floor(baseCount * variance);

  return Math.max(1, finalCount); // Ensure at least 1 visit
}

// Define types for better type safety
type VisitCategory = "Meeting___Visits" | "Delivery" | "VIP";
type EntryMethod = "Walking" | "Vehicle_Roda_Dua" | "Vehicle_Roda_Empat";

interface VisitData {
  visitor_id: number;
  employee_id: number;
  security_id: number;
  visit_category: VisitCategory;
  entry_method: EntryMethod;
  vehicle_number: string | null;
  check_in_time: Date;
  check_out_time: Date;
  qr_code: string;
  verification_status: boolean;
  safety_permit: null;
  brings_team: boolean;
  team_members_quantity: number | null;
  entry_start_date: Date;
}

// Helper function to get all dates in range
function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

async function seedVisits(): Promise<void> {
  const visitorIds: number[] = [1, 2, 3, 4];
  const employeeIds: number[] = [13, 14, 21, 22, 23, 24];
  const securityId: number = 1;

  const visitCategories: VisitCategory[] = [
    "Meeting___Visits",
    "Delivery",
    "VIP",
  ];

  const entryMethods: EntryMethod[] = [
    "Walking",
    "Vehicle_Roda_Dua",
    "Vehicle_Roda_Empat",
  ];

  // Define date range: January 1, 2024 to June 30, 2025
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2025-07-05");
  const allDates = getDateRange(startDate, endDate);

  const visits: VisitData[] = [];

  // Generate visits for each date
  for (const currentDate of allDates) {
    const visitCount = getRealisticVisitCount(currentDate);

    for (let i = 0; i < visitCount; i++) {
      const visitCategory: VisitCategory =
        visitCategories[Math.floor(Math.random() * visitCategories.length)];
      const entryMethod: EntryMethod =
        entryMethods[Math.floor(Math.random() * entryMethods.length)];
      const visitorId: number =
        visitorIds[Math.floor(Math.random() * visitorIds.length)];
      const employeeId: number =
        employeeIds[Math.floor(Math.random() * employeeIds.length)];

      const { checkIn, checkOut } = getBusinessHours(currentDate);

      // Generate vehicle number if not walking
      const vehicleNumber: string | null =
        entryMethod !== "Walking" ? generateVehicleNumber() : null;

      // Occasionally have visits without checkout (5% chance)
      const hasCheckout = Math.random() > 0.05;

      // Occasionally have team visits (10% chance)
      const bringsTeam = Math.random() < 0.1;
      const teamMembersQuantity = bringsTeam
        ? Math.floor(Math.random() * 4) + 1
        : 0;

      const visit: VisitData = {
        visitor_id: visitorId,
        employee_id: employeeId,
        security_id: securityId,
        visit_category: visitCategory,
        entry_method: entryMethod,
        vehicle_number: vehicleNumber,
        check_in_time: checkIn,
        check_out_time: checkOut,
        qr_code: generateQRCode(),
        verification_status: true,
        safety_permit: null,
        brings_team: false,
        team_members_quantity: 0,
        entry_start_date: currentDate,
      };

      visits.push(visit);
    }
  }

  // Insert visits in batches to avoid memory issues
  const batchSize = 1000;
  for (let i = 0; i < visits.length; i += batchSize) {
    const batch = visits.slice(i, i + batchSize);
    await prisma.visit.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
}

async function main(): Promise<void> {
  try {
    await seedVisits();
  } catch (error) {
    console.error("Error seeding visits:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
