// flatten-for-ai-builder.js
const { readFileSync, writeFileSync } = require("fs");

function flattenWeeklyData() {
  const weeklyData = JSON.parse(
    readFileSync("weekly-training-data.json", "utf8")
  );

  const flattenedData = weeklyData.map((week) => {
    // Get top companies (pad with nulls if less than 3)
    const topCompanies = [...week.top_companies];
    while (topCompanies.length < 3) {
      topCompanies.push({ name: null, p: 0 });
    }

    // Get top departments (pad with nulls if less than 3)
    const topDepartments = [...week.top_departments];
    while (topDepartments.length < 3) {
      topDepartments.push({ name: null, p: 0 });
    }

    // Get peak hours (pad with nulls if less than 3)
    const peakHours = [...week.peak_hours];
    while (peakHours.length < 3) {
      peakHours.push({ range: null, p: 0 });
    }

    return {
      week: week.week,
      total_visits: week.total_visits,

      // Top companies
      top_company_1: topCompanies[0].name || "Unknown",
      top_company_1_percentage: topCompanies[0].p,
      top_company_1_visits: Math.round(week.total_visits * topCompanies[0].p),

      top_company_2: topCompanies[1].name || "Unknown",
      top_company_2_percentage: topCompanies[1].p,
      top_company_2_visits: Math.round(week.total_visits * topCompanies[1].p),

      top_company_3: topCompanies[2].name || "Unknown",
      top_company_3_percentage: topCompanies[2].p,
      top_company_3_visits: Math.round(week.total_visits * topCompanies[2].p),

      // Top departments
      top_dept_1: topDepartments[0].name || "Unknown",
      top_dept_1_percentage: topDepartments[0].p,
      top_dept_1_visits: Math.round(week.total_visits * topDepartments[0].p),

      top_dept_2: topDepartments[1].name || "Unknown",
      top_dept_2_percentage: topDepartments[1].p,
      top_dept_2_visits: Math.round(week.total_visits * topDepartments[1].p),

      top_dept_3: topDepartments[2].name || "Unknown",
      top_dept_3_percentage: topDepartments[2].p,
      top_dept_3_visits: Math.round(week.total_visits * topDepartments[2].p),

      // Peak hours
      peak_hour_1: peakHours[0].range || "Unknown",
      peak_hour_1_percentage: peakHours[0].p,
      peak_hour_1_visits: Math.round(week.total_visits * peakHours[0].p),

      peak_hour_2: peakHours[1].range || "Unknown",
      peak_hour_2_percentage: peakHours[1].p,
      peak_hour_2_visits: Math.round(week.total_visits * peakHours[1].p),

      peak_hour_3: peakHours[2].range || "Unknown",
      peak_hour_3_percentage: peakHours[2].p,
      peak_hour_3_visits: Math.round(week.total_visits * peakHours[2].p),
    };
  });

  // Save as CSV for AI Builder
  const csvHeader = Object.keys(flattenedData[0]).join(",");
  const csvRows = flattenedData.map((row) =>
    Object.values(row)
      .map((value) => (typeof value === "string" ? `"${value}"` : value))
      .join(",")
  );

  const csvContent = [csvHeader, ...csvRows].join("\n");

  writeFileSync("weekly-training-data-flat.csv", csvContent);
  writeFileSync(
    "weekly-training-data-flat.json",
    JSON.stringify(flattenedData, null, 2)
  );

  console.log(`✅ Flattened ${flattenedData.length} weeks of data`);
  console.log(
    "📁 Files created: weekly-training-data-flat.csv, weekly-training-data-flat.json"
  );

  return flattenedData;
}

function convertPredictionsBackToNested(flatPredictions) {
  return flatPredictions.map((pred) => ({
    week: pred.week,
    total_visits: pred.total_visits,
    top_companies: [
      { name: pred.top_company_1, p: pred.top_company_1_percentage },
      { name: pred.top_company_2, p: pred.top_company_2_percentage },
      { name: pred.top_company_3, p: pred.top_company_3_percentage },
    ].filter((c) => c.name !== "Unknown" && c.p > 0),
    top_departments: [
      { name: pred.top_dept_1, p: pred.top_dept_1_percentage },
      { name: pred.top_dept_2, p: pred.top_dept_2_percentage },
      { name: pred.top_dept_3, p: pred.top_dept_3_percentage },
    ].filter((d) => d.name !== "Unknown" && d.p > 0),
    peak_hours: [
      { range: pred.peak_hour_1, p: pred.peak_hour_1_percentage },
      { range: pred.peak_hour_2, p: pred.peak_hour_2_percentage },
      { range: pred.peak_hour_3, p: pred.peak_hour_3_percentage },
    ].filter((h) => h.range !== "Unknown" && h.p > 0),
    is_prediction: true,
  }));
}

// Run the flattening
flattenWeeklyData();

module.exports = { flattenWeeklyData, convertPredictionsBackToNested };
