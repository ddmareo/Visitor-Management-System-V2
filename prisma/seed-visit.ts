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

// Helper function to generate business hours with realistic distribution
function getBusinessHours(date: Date): { checkIn: Date; checkOut: Date } {
  // Generate a random integer between min and max (inclusive)
  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate check-in time with realistic distribution
  const checkInTime = generateRealisticCheckInTimeWeighted();
  
  // Use the passed date parameter instead of new Date()
  const checkIn = new Date(Date.UTC(
    date.getUTCFullYear(),   // Use the passed date
    date.getUTCMonth(),      // Use the passed date
    date.getUTCDate(),       // Use the passed date
    checkInTime.hour - 7,    // convert WIB (UTC+7) to UTC
    checkInTime.minute,
    0,
    0
  ));

  const checkOut = new Date(checkIn);
  // Visit duration between 30 minutes to 4 hours
  const durationMinutes = 30 + Math.floor(Math.random() * 210); // 30-240 minutes
  checkOut.setTime(checkIn.getTime() + durationMinutes * 60 * 1000);

  // Ensure checkout doesn't go past 7 PM (19:00) for late visits
  const maxCheckout = new Date(date);
  maxCheckout.setHours(19, 0, 0, 0);

  if (checkOut > maxCheckout) {
    checkOut.setTime(maxCheckout.getTime());
  }

  return { checkIn, checkOut };
}

// Weighted distribution with rare time slots
function generateRealisticCheckInTimeWeighted(): { hour: number; minute: number } {
  // Define time slots with weights (higher = more likely)
  const timeSlots = [
    { startHour: 7, startMinute: 0, endHour: 7, endMinute: 30, weight: 0.05 },    // 7-7:30 AM: very rare
    { startHour: 8, startMinute: 0, endHour: 9, endMinute: 0, weight: 2 },        // 8-9 AM: some early
    { startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, weight: 15 },      // 9-10 AM: rising
    { startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, weight: 20 },     // 10-11 AM: rising  
    { startHour: 11, startMinute: 0, endHour: 12, endMinute: 0, weight: 25 },     // 11-12 PM: peak
    { startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, weight: 25 },     // 12-1 PM: peak
    { startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, weight: 15 },     // 1-2 PM: declining
    { startHour: 14, startMinute: 0, endHour: 15, endMinute: 0, weight: 10 },      // 2-3 PM: low
    { startHour: 15, startMinute: 0, endHour: 16, endMinute: 0, weight: 5 },      // 3-4 PM: low
    { startHour: 16, startMinute: 0, endHour: 17, endMinute: 0, weight: 5 },    // 4-5 PM: low
    { startHour: 17, startMinute: 0, endHour: 17, endMinute: 30, weight: 3 },  // 5-5:30 PM: low
    { startHour: 17, startMinute: 30, endHour: 19, endMinute: 0, weight: 0.05 },  // 5:30-7 PM: very rare
  ];

  // Calculate total weight
  const totalWeight = timeSlots.reduce((sum, slot) => sum + slot.weight, 0);
  
  // Generate random number and find corresponding time slot
  let randomWeight = Math.random() * totalWeight;
  let selectedSlot = timeSlots[0]; // default
  
  for (const slot of timeSlots) {
    randomWeight -= slot.weight;
    if (randomWeight <= 0) {
      selectedSlot = slot;
      break;
    }
  }

  // Generate random time within the selected slot
  const slotDurationMinutes = 
    (selectedSlot.endHour - selectedSlot.startHour) * 60 + 
    (selectedSlot.endMinute - selectedSlot.startMinute);
  
  const randomMinutesInSlot = Math.floor(Math.random() * slotDurationMinutes);
  
  const totalStartMinutes = selectedSlot.startHour * 60 + selectedSlot.startMinute;
  const finalTotalMinutes = totalStartMinutes + randomMinutesInSlot;
  
  const hour = Math.floor(finalTotalMinutes / 60);
  const minute = finalTotalMinutes % 60;

  return { hour, minute };
}

// Updated visit creation logic
function createVisitData(currentDate: Date, visitorId: number, employeeId: number, securityId: number, visitCategories: VisitCategory[], entryMethods: EntryMethod[]): VisitData {
  const visitCategory: VisitCategory = visitCategories[Math.floor(Math.random() * visitCategories.length)];
  const entryMethod: EntryMethod = entryMethods[Math.floor(Math.random() * entryMethods.length)];
  
  const { checkIn, checkOut } = getBusinessHours(currentDate);
  
  // Generate vehicle number if not walking
  const vehicleNumber: string | null = entryMethod !== "Walking" ? generateVehicleNumber() : null;
  
  // Occasionally have team visits (10% chance)
  const bringsTeam = Math.random() < 0.1;
  const teamMembersQuantity = bringsTeam ? Math.floor(Math.random() * 4) + 1 : 0;
  
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
    verification_status: checkIn !== null, // Only true if checked in
    safety_permit: null,
    brings_team: bringsTeam,
    team_members_quantity: teamMembersQuantity,
    entry_start_date: currentDate, // This is the scheduled date
  };
  
  return visit;
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
  const baseWeekendCount = 2; // Reduced from 8 to 2 visits per weekend day
  const baseHolidayCount = 0; // Reduced from 3 to 0 visits per holiday

  let baseCount: number;

  if (isHolidayDay) {
    baseCount = baseHolidayCount;
  } else if (isWeekendDay) {
    baseCount = baseWeekendCount;
  } else {
    baseCount = baseWeekdayCount;
  }

  // Add some randomness
  let variance: number;
  if (isWeekendDay) {
    variance = 0.5 + Math.random() * 1.0; // 0.5 to 1.5 for weekends (can result in 0 visits)
  } else {
    variance = 0.6 + Math.random() * 0.6; // 0.6 to 1.2 for weekdays (15-30 visits possible)
  }
  
  const finalCount = Math.floor(baseCount * variance);

  // For weekends, allow 0 visits
  return isWeekendDay ? finalCount : Math.max(1, finalCount);
}

// Helper function to select employee ID with bias towards employee ID 1
function selectEmployeeId(employeeIds: number[]): number {
  const random = Math.random();
  
  // 40% chance to select employee ID 1, 60% for others
  if (random < 0.4) {
    return 1;
  } else {
    // Select from remaining employees (excluding ID 1)
    const otherEmployees = employeeIds.filter(id => id !== 1);
    return otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
  }
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
  const employeeIds: number[] = [1, 2, 3, 4, 5, 6];
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
  const startDate = new Date("2025-07-15");
  const endDate = new Date("2025-07-16");
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
      const employeeId: number = selectEmployeeId(employeeIds); // Use biased selection

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

      const visit = createVisitData(
        currentDate,
        visitorId,
        employeeId,
        securityId,
        visitCategories,
        entryMethods
      );

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