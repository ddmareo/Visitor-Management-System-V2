// generate-ai-training-data.js
const { PrismaClient } = require("@prisma/client");
const { writeFileSync } = require("fs");
const {
  format,
  getISOWeek,
  getYear,
  getMonth,
  getDate,
  getDay,
} = require("date-fns");
const https = require("https");

const prisma = new PrismaClient();

// Cache for Indonesian holidays
let holidayCache = new Map();

// Peak hour encoding mapping
const PEAK_HOUR_MAPPING = {
  "00_02": 0,
  "02_04": 1,
  "04_06": 2,
  "06_08": 3,
  "08_10": 4,
  "10_12": 5,
  "12_14": 6,
  "14_16": 7,
  "16_18": 8,
  "18_20": 9,
  "20_22": 10,
  "22_00": 11,
};

// Reverse mapping for decoding predictions
const PEAK_HOUR_REVERSE_MAPPING = {
  0: "00_02",
  1: "02_04",
  2: "04_06",
  3: "06_08",
  4: "08_10",
  5: "10_12",
  6: "12_14",
  7: "14_16",
  8: "16_18",
  9: "18_20",
  10: "20_22",
  11: "22_00",
};

function encodePeakHour(peakHourString) {
  return PEAK_HOUR_MAPPING[peakHourString] || 4; // Default to "08_10" (4)
}

function decodePeakHour(peakHourNumber) {
  const rounded = Math.round(peakHourNumber);
  const clamped = Math.max(0, Math.min(11, rounded)); // Ensure within valid range
  return PEAK_HOUR_REVERSE_MAPPING[clamped] || "08_10";
}

async function fetchIndonesianHolidays(year) {
  if (holidayCache.has(year)) {
    return holidayCache.get(year);
  }

  return new Promise((resolve, reject) => {
    const url = `https://api-harilibur.vercel.app/api?year=${year}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            const holidays = new Set();

            console.log(
              `Holiday API response for ${year}:`,
              JSON.stringify(response, null, 2)
            );

            if (response && Array.isArray(response)) {
              response.forEach((holiday) => {
                // Try different possible field names
                const dateField =
                  holiday.holiday_date || holiday.tanggal || holiday.date;
                if (dateField) {
                  holidays.add(dateField);
                  console.log(
                    `Added holiday: ${dateField} - ${
                      holiday.holiday_name || holiday.nama || holiday.name
                    }`
                  );
                }
              });
            }

            // Manual fallback for common Indonesian holidays
            const commonHolidays = getCommonIndonesianHolidays(year);
            commonHolidays.forEach((date) => {
              holidays.add(date);
              console.log(`Added manual holiday: ${date}`);
            });

            console.log(`Total holidays for ${year}: ${holidays.size}`);
            holidayCache.set(year, holidays);
            resolve(holidays);
          } catch (error) {
            console.warn(`Failed to parse holidays for ${year}:`, error);
            console.log(`Raw response: ${data}`);

            // Fallback to manual holidays
            const holidays = new Set();
            const commonHolidays = getCommonIndonesianHolidays(year);
            commonHolidays.forEach((date) => holidays.add(date));

            holidayCache.set(year, holidays);
            resolve(holidays);
          }
        });
      })
      .on("error", (error) => {
        console.warn(`Failed to fetch holidays for ${year}:`, error);

        // Fallback to manual holidays
        const holidays = new Set();
        const commonHolidays = getCommonIndonesianHolidays(year);
        commonHolidays.forEach((date) => holidays.add(date));

        holidayCache.set(year, holidays);
        resolve(holidays);
      });
  });
}

function getCommonIndonesianHolidays(year) {
  // Common Indonesian holidays that are consistent every year
  return [
    `${year}-01-01`, // New Year's Day
    `${year}-08-17`, // Independence Day
    `${year}-12-25`, // Christmas Day
    // Add more fixed holidays as needed
  ];
}

function isVisitInRange(visit, targetDate, mode) {
  if (!visit.check_in_time || !visit.check_out_time) {
    return false;
  }

  const visitStart = new Date(visit.entry_start_date);
  const visitEnd = new Date(visit.entry_end_date || visit.entry_start_date);

  if (mode === 0) {
    // Daily mode
    const target = new Date(targetDate);
    return visitStart <= target && visitEnd >= target;
  } else {
    // Weekly mode
    const [year, week] = targetDate.split("-W");
    const targetYear = parseInt(year);
    const targetWeek = parseInt(week);

    const visitYear = getYear(visitStart);
    const visitWeek = getISOWeek(visitStart);
    const visitEndYear = getYear(visitEnd);
    const visitEndWeek = getISOWeek(visitEnd);

    return (
      (visitYear === targetYear && visitWeek === targetWeek) ||
      (visitEndYear === targetYear && visitEndWeek === targetWeek) ||
      (visitYear === targetYear &&
        visitEndYear === targetYear &&
        visitWeek <= targetWeek &&
        visitEndWeek >= targetWeek)
    );
  }
}

function getPeakHour(visits, targetDate, mode) {
  const hourBinCount = new Map();

  visits.forEach((visit) => {
    if (!isVisitInRange(visit, targetDate, mode) || !visit.check_in_time) {
      return;
    }

    const checkInHour = visit.check_in_time.getHours();
    const checkOutHour = visit.check_out_time
      ? visit.check_out_time.getHours()
      : checkInHour;

    // Account for visits that span multiple hours
    for (let hour = checkInHour; hour <= checkOutHour; hour++) {
      // Convert hour to 2-hour bin
      const binStart = Math.floor(hour / 2) * 2;
      const binEnd = binStart + 2;
      const binLabel = `${binStart.toString().padStart(2, "0")}_${binEnd
        .toString()
        .padStart(2, "0")}`;

      hourBinCount.set(binLabel, (hourBinCount.get(binLabel) || 0) + 1);
    }
  });

  if (hourBinCount.size === 0) {
    return "08_10"; // Default peak hour bin
  }

  // Find the 2-hour bin with maximum visits
  let maxCount = 0;
  let peakHour = "08_10";

  for (const [binLabel, count] of hourBinCount) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = binLabel;
    }
  }

  return peakHour;
}

function normalizeValue(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

async function generateAITrainingData() {
  try {
    console.log("Fetching all visits...");

    // Fetch all visits with related data
    const visits = await prisma.visit.findMany({
      include: {
        visitor: {
          include: {
            company: true,
          },
        },
        employee: true,
      },
    });

    console.log(`Found ${visits.length} visits`);

    // Filter out visits without check-in or check-out
    const validVisits = visits.filter(
      (visit) => visit.check_in_time && visit.check_out_time
    );
    console.log(
      `Valid visits (with check-in/check-out): ${validVisits.length}`
    );

    // Get all unique years for holiday fetching
    const years = new Set();
    validVisits.forEach((visit) => {
      years.add(getYear(new Date(visit.entry_start_date)));
    });

    // Fetch holidays for all years
    console.log("Fetching Indonesian holidays...");
    for (const year of years) {
      await fetchIndonesianHolidays(year);
    }

    const trainingData = [];

    // Generate Daily Data
    console.log("Generating daily training data...");
    const dailyData = new Map();

    validVisits.forEach((visit) => {
      const visitDate = new Date(visit.entry_start_date);
      const dateKey = format(visitDate, "yyyy-MM-dd");

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey).push(visit);
    });

    // Calculate min/max for normalization
    const dailyVisitCounts = Array.from(dailyData.values()).map(
      (visits) => visits.length
    );
    const minDailyVisits = Math.min(...dailyVisitCounts);
    const maxDailyVisits = Math.max(...dailyVisitCounts);

    for (const [dateKey, dayVisits] of dailyData) {
      const date = new Date(dateKey);
      const year = getYear(date);
      const month = getMonth(date) + 1; // getMonth() returns 0-based month
      const day = getDate(date); // Day of month (1-31)
      const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.

      const holidays = holidayCache.get(year) || new Set();
      const isHoliday = holidays.has(dateKey) ? 1 : 0;

      const totalVisits = dayVisits.length;
      const normalizedVisits = normalizeValue(
        totalVisits,
        minDailyVisits,
        maxDailyVisits
      );
      const peakHourString = getPeakHour(validVisits, dateKey, 0);
      const peakHourEncoded = encodePeakHour(peakHourString);

      trainingData.push({
        id: `daily_${year}_${month.toString().padStart(2, "0")}_${day
          .toString()
          .padStart(2, "0")}`,
        input: {
          mode: 0, // daily
          day: day, // Day of month (1-31)
          dayOfWeek: dayOfWeek, // 0-6 (0=Sunday)
          week: getISOWeek(date),
          month: month,
          year: year,
          isHoliday: isHoliday,
        },
        output: {
          total_visits: normalizedVisits,
          peak_hour: peakHourEncoded, // Now encoded as number
          peak_hour_label: peakHourString, // Keep original for reference
        },
      });
    }

    // Generate Weekly Data
    console.log("Generating weekly training data...");
    const weeklyData = new Map();

    validVisits.forEach((visit) => {
      const visitDate = new Date(visit.entry_start_date);
      const year = getYear(visitDate);
      const week = getISOWeek(visitDate);
      const weekKey = `${year}-W${week.toString().padStart(2, "0")}`;

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, []);
      }
      weeklyData.get(weekKey).push(visit);
    });

    // Calculate min/max for weekly normalization
    const weeklyVisitCounts = Array.from(weeklyData.values()).map(
      (visits) => visits.length
    );
    const minWeeklyVisits = Math.min(...weeklyVisitCounts);
    const maxWeeklyVisits = Math.max(...weeklyVisitCounts);

    for (const [weekKey, weekVisits] of weeklyData) {
      const [year, weekStr] = weekKey.split("-W");
      const weekNum = parseInt(weekStr);

      // Get the first day of the week to determine month and check for holidays
      const firstDayOfWeek = new Date(parseInt(year), 0, 1 + (weekNum - 1) * 7);
      const month = getMonth(firstDayOfWeek) + 1;

      // Check if any day in the week is a holiday
      const holidays = holidayCache.get(parseInt(year)) || new Set();
      let isHoliday = 0;

      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(firstDayOfWeek);
        checkDate.setDate(firstDayOfWeek.getDate() + i);
        const checkDateStr = format(checkDate, "yyyy-MM-dd");

        if (holidays.has(checkDateStr)) {
          isHoliday = 1;
          break;
        }
      }

      const totalVisits = weekVisits.length;
      const normalizedVisits = normalizeValue(
        totalVisits,
        minWeeklyVisits,
        maxWeeklyVisits
      );
      const peakHourString = getPeakHour(validVisits, weekKey, 1);
      const peakHourEncoded = encodePeakHour(peakHourString);

      trainingData.push({
        id: `weekly_${year}_W${weekStr}`,
        input: {
          mode: 1, // weekly
          day: 0, // Not applicable for weekly
          dayOfWeek: 0, // Not applicable for weekly
          week: weekNum,
          month: month,
          year: parseInt(year),
          isHoliday: isHoliday,
        },
        output: {
          total_visits: normalizedVisits,
          peak_hour: peakHourEncoded, // Now encoded as number
          peak_hour_label: peakHourString, // Keep original for reference
        },
      });
    }

    // Sort training data by year, month, week/day
    trainingData.sort((a, b) => {
      if (a.input.year !== b.input.year) return a.input.year - b.input.year;
      if (a.input.month !== b.input.month) return a.input.month - b.input.month;
      if (a.input.mode !== b.input.mode) return a.input.mode - b.input.mode;
      if (a.input.mode === 0) return a.input.day - b.input.day;
      return a.input.week - b.input.week;
    });

    // Convert to CSV format
    const csvHeaders = [
      "id",
      "mode",
      "day",
      "dayOfWeek",
      "week",
      "month",
      "year",
      "isHoliday",
      "total_visits",
      "peak_hour",
      "peak_hour_label",
    ];

    const csvRows = trainingData.map((item) => [
      item.id,
      item.input.mode,
      item.input.day,
      item.input.dayOfWeek,
      item.input.week,
      item.input.month,
      item.input.year,
      item.input.isHoliday,
      item.output.total_visits.toFixed(6),
      item.output.peak_hour,
      item.output.peak_hour_label,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Save to files
    const metadata = {
      dailyNormalization: {
        min: minDailyVisits,
        max: maxDailyVisits,
      },
      weeklyNormalization: {
        min: minWeeklyVisits,
        max: maxWeeklyVisits,
      },
      peakHourMapping: PEAK_HOUR_MAPPING,
      peakHourReverseMapping: PEAK_HOUR_REVERSE_MAPPING,
      totalRecords: trainingData.length,
      generatedAt: new Date().toISOString(),
    };

    writeFileSync(
      "ai-training-data.json",
      JSON.stringify(trainingData, null, 2)
    );
    writeFileSync(
      "ai-training-metadata.json",
      JSON.stringify(metadata, null, 2)
    );
    writeFileSync("ai-training-data.csv", csvContent);

    console.log(`✅ Generated training data: ${trainingData.length} records`);
    console.log(
      `📊 Daily records: ${
        trainingData.filter((d) => d.input.mode === 0).length
      }`
    );
    console.log(
      `📊 Weekly records: ${
        trainingData.filter((d) => d.input.mode === 1).length
      }`
    );
    console.log(
      `📁 Files saved: ai-training-data.json, ai-training-data.csv, ai-training-metadata.json`
    );
    console.log(`📈 Daily visits range: ${minDailyVisits} - ${maxDailyVisits}`);
    console.log(
      `📈 Weekly visits range: ${minWeeklyVisits} - ${maxWeeklyVisits}`
    );
    console.log(`🕐 Peak hour encoding: 0-11 (see metadata for mapping)`);

    // Show peak hour distribution
    const peakHourDistribution = {};
    trainingData.forEach((item) => {
      const label = item.output.peak_hour_label;
      peakHourDistribution[label] = (peakHourDistribution[label] || 0) + 1;
    });
    console.log(`📊 Peak hour distribution:`, peakHourDistribution);
  } catch (error) {
    console.error("Error generating AI training data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for use in other files
module.exports = {
  encodePeakHour,
  decodePeakHour,
  PEAK_HOUR_MAPPING,
  PEAK_HOUR_REVERSE_MAPPING,
};

// Run the generator
generateAITrainingData();
