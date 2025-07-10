import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getISOWeek, getYear } from "date-fns";

const prisma = new PrismaClient();

interface WeeklyAggregation {
  week: string;
  total_visits: number;
  top_companies: Array<{ name: string; p: number }>;
  top_departments: Array<{ name: string; p: number }>;
  peak_hours: Array<{ range: string; p: number }>;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all visits with related data (no date filtering)
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

    // Group visits by week
    const weeklyData = new Map<string, any[]>();

    visits.forEach((visit) => {
      const visitDate = new Date(visit.entry_start_date);
      const year = getYear(visitDate);
      const week = getISOWeek(visitDate);
      const weekKey = `${year}-W${week.toString().padStart(2, "0")}`;

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, []);
      }
      weeklyData.get(weekKey)!.push(visit);
    });

    // Process each week's data
    const result: WeeklyAggregation[] = [];

    for (const [weekKey, weekVisits] of weeklyData) {
      const totalVisits = weekVisits.length;

      // Calculate top companies
      const companyCount = new Map<string, number>();
      weekVisits.forEach((visit) => {
        if (visit.visitor?.company?.company_name) {
          const companyName = visit.visitor.company.company_name;
          companyCount.set(
            companyName,
            (companyCount.get(companyName) || 0) + 1
          );
        }
      });

      const topCompanies = Array.from(companyCount.entries())
        .map(([name, count]) => ({ name, p: count / totalVisits }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 3);

      // Calculate top departments
      const departmentCount = new Map<string, number>();
      weekVisits.forEach((visit) => {
        if (visit.employee?.department) {
          const deptName = visit.employee.department;
          departmentCount.set(
            deptName,
            (departmentCount.get(deptName) || 0) + 1
          );
        }
      });

      const topDepartments = Array.from(departmentCount.entries())
        .map(([name, count]) => ({ name, p: count / totalVisits }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 3);

      // Calculate peak hours
      const hourCount = new Map<string, number>();
      weekVisits.forEach((visit) => {
        if (visit.check_in_time) {
          const hour = visit.check_in_time.getHours();
          const hourRange = `${hour.toString().padStart(2, "0")}:00–${(hour + 1)
            .toString()
            .padStart(2, "0")}:00`;
          hourCount.set(hourRange, (hourCount.get(hourRange) || 0) + 1);
        }
      });

      const peakHours = Array.from(hourCount.entries())
        .map(([range, count]) => ({ range, p: count / totalVisits }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 3);

      result.push({
        week: weekKey,
        total_visits: totalVisits,
        top_companies: topCompanies,
        top_departments: topDepartments,
        peak_hours: peakHours,
      });
    }

    // Sort by week
    result.sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error aggregating weekly data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
