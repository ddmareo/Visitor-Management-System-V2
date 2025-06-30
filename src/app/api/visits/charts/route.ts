import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const roundToNearestInterval = (time: Date) => {
  const localTime = new Date(time.getTime() + 7 * 60 * 60 * 1000);
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();

  let roundedMinutes;
  if (minutes < 15) {
    roundedMinutes = 0;
  } else if (minutes >= 15 && minutes < 45) {
    roundedMinutes = 30;
  } else {
    roundedMinutes = 0;
    localTime.setHours(hours + 1);
  }

  return `${String(localTime.getHours()).padStart(2, "0")}:${String(
    roundedMinutes
  ).padStart(2, "0")}`;
};

const transformData = (data: any[]) => {
  return data.map((item) => {
    const transformed = { ...item };
    if ("visits" in item) {
      transformed.visits = Number(item.visits);
    }
    if ("total_visits" in item) {
      transformed.total_visits = Number(item.total_visits);
    }
    if ("average_visits" in item) {
      transformed.average_visits = Number(item.average_visits);
    }
    if ("peak_visits" in item) {
      transformed.peak_visits = Number(item.peak_visits);
    }

    if ("check_in_time" in item) {
      transformed.time = new Date(item.check_in_time).toLocaleTimeString(
        "en-US",
        {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        }
      );
    }
    return transformed;
  });
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }
  return slots;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const date = searchParams.get("date");

  try {
    let visitsData;
    let departmentData;
    let companyData;
    let timeDistribution;
    let statsData;

    if (period === "monthly") {
      const [year, month] = date!.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const monthlyData = await prisma.$queryRaw`
        SELECT 
          DATE(entry_start_date)::text as day, 
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit
        WHERE entry_start_date >= ${startDate} 
        AND entry_start_date <= ${endDate}
        GROUP BY DATE(entry_start_date)
        ORDER BY day
      `;

      visitsData = transformData(monthlyData as any[]);

      statsData = await prisma.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM visit WHERE entry_start_date >= ${startDate} AND entry_start_date <= ${endDate}) AS total_visits,
          CAST(ROUND(AVG(daily_visits)) AS INTEGER) as average_visits,
          CAST(MAX(daily_visits) AS INTEGER) as peak_visits
        FROM (
          SELECT DATE(entry_start_date), COUNT(*) AS daily_visits
          FROM visit
          WHERE entry_start_date >= ${startDate} AND entry_start_date <= ${endDate}
          GROUP BY DATE(entry_start_date)
        ) AS daily_visits;
      `;

      const monthlyDepartmentData = await prisma.$queryRaw`
        SELECT 
          e.department,
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit v
        JOIN employee e ON v.employee_id = e.employee_id
        WHERE v.entry_start_date >= ${startDate} 
        AND v.entry_start_date <= ${endDate}
        AND e.department IS NOT NULL
        GROUP BY e.department
        ORDER BY visits DESC
      `;

      departmentData = transformData(monthlyDepartmentData as any[]);

      const monthlyCompanyData = await prisma.$queryRaw`
        SELECT 
          c.company_name as company,
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit v
        JOIN visitor vi ON v.visitor_id = vi.visitor_id
        JOIN company c ON vi.company_id = c.company_id
        WHERE v.entry_start_date >= ${startDate} 
        AND v.entry_start_date <= ${endDate}
        GROUP BY c.company_name
        ORDER BY visits DESC
      `;

      companyData = transformData(monthlyCompanyData as any[]);

      const timeData = await prisma.$queryRaw`
        SELECT 
          check_in_time
        FROM visit
        WHERE check_in_time IS NOT NULL
        AND entry_start_date >= ${startDate}
        AND entry_start_date <= ${endDate}
      `;

      const processedTimeData = (timeData as any[]).reduce((acc: any, curr) => {
        const time = new Date(curr.check_in_time);
        const roundedTime = roundToNearestInterval(time);

        if (!acc[roundedTime]) {
          acc[roundedTime] = 0;
        }
        acc[roundedTime] += 1;
        return acc;
      }, {});

      const timeSlots = generateTimeSlots();
      timeDistribution = timeSlots.map((slot) => ({
        time: slot,
        visits: processedTimeData[slot] || 0,
      }));
    } else if (period === "yearly") {
      const year = parseInt(date!);

      const yearlyData = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(entry_start_date, 'Mon') as month,
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit
        WHERE EXTRACT(YEAR FROM entry_start_date) = ${year}
        GROUP BY EXTRACT(MONTH FROM entry_start_date), TO_CHAR(entry_start_date, 'Mon')
        ORDER BY EXTRACT(MONTH FROM entry_start_date)
      `;

      visitsData = transformData(yearlyData as any[]);

      statsData = await prisma.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM visit WHERE EXTRACT(YEAR FROM entry_start_date) = ${year}) AS total_visits,
          CAST(ROUND(AVG(monthly_visits)) AS INTEGER) as average_visits,
          CAST(MAX(monthly_visits) AS INTEGER) as peak_visits
        FROM (
          SELECT EXTRACT(MONTH FROM entry_start_date) AS month, COUNT(*) AS monthly_visits
          FROM visit
          WHERE EXTRACT(YEAR FROM entry_start_date) = ${year}
          GROUP BY EXTRACT(MONTH FROM entry_start_date)
        ) AS monthly_visits;
      `;

      const yearlyDepartmentData = await prisma.$queryRaw`
        SELECT 
          e.department,
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit v
        JOIN employee e ON v.employee_id = e.employee_id
        WHERE EXTRACT(YEAR FROM v.entry_start_date) = ${year}
        AND e.department IS NOT NULL
        GROUP BY e.department
        ORDER BY visits DESC
      `;

      departmentData = transformData(yearlyDepartmentData as any[]);

      const yearlyCompanyData = await prisma.$queryRaw`
        SELECT 
          c.company_name as company,
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit v
        JOIN visitor vi ON v.visitor_id = vi.visitor_id
        JOIN company c ON vi.company_id = c.company_id
        WHERE EXTRACT(YEAR FROM v.entry_start_date) = ${year}
        GROUP BY c.company_name
        ORDER BY visits DESC
      `;

      companyData = transformData(yearlyCompanyData as any[]);

      const timeData = await prisma.$queryRaw`
        SELECT 
          check_in_time
        FROM visit
        WHERE check_in_time IS NOT NULL
        AND EXTRACT(YEAR FROM entry_start_date) = ${year}
      `;

      const processedTimeData = (timeData as any[]).reduce((acc: any, curr) => {
        const time = new Date(curr.check_in_time);
        const roundedTime = roundToNearestInterval(time);

        if (!acc[roundedTime]) {
          acc[roundedTime] = 0;
        }
        acc[roundedTime] += 1;
        return acc;
      }, {});

      const timeSlots = generateTimeSlots();
      timeDistribution = timeSlots.map((slot) => ({
        time: slot,
        visits: processedTimeData[slot] || 0,
      }));
    }

    return NextResponse.json({
      visitsData,
      departmentData,
      companyData,
      timeDistribution,
      stats: transformData(statsData as any[])[0],
    });
  } catch (error) {
    console.error("Error fetching visit data:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit data" },
      { status: 500 }
    );
  }
}
