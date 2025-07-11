"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Building2,
  Building,
} from "lucide-react";
import VisitorPredictionChart from "./predictionchart";

type VisitData = {
  day?: string;
  month?: string;
  visits: number;
};

type DepartmentData = {
  department: string;
  visits: number;
};

type CompanyData = {
  company: string;
  visits: number;
};

type TimeData = {
  time: string;
  visits: number;
};

type Stats = {
  total_visits: number;
  average_visits: number;
  peak_visits: number;
};

const VisitorDashboard = () => {
  // ...existing state and hooks...

  // --- Forecast Button Handler ---
  const getNext30DaysForecast = async () => {
    setPredictLoading(true);
    setPredictResult(null);
    try {
      // Fetch the normalized sequence from public/data/last30.json
      const seqRes = await fetch('/data/last30.json');
      const sequence = await seqRes.json();
      const response = await fetch('/api/visits/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence,
          startDate: '2025-07-11', // use the current date as specified
        })
      });
      const data = await response.json();
      if (response.ok && data.forecast) {
        setPredictResult({ success: true, message: 'Forecast generated! Check console for details.' });
        data.forecast.forEach((day: any) => {
          const topBins = day.timeBins
            .map((value: number, idx: number) => ({ bin: idx, value }))
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 2);
          const binLabels = ['7–9', '9–11', '11–13', '13–15', '15–17', '17–19'];
          console.log(`📅 ${day.date}: ${day.totalVisits.toFixed(1)} visits`);
          console.log(`   Top Hours:`);
          topBins.forEach((bin: any) =>
            console.log(`     - ${binLabels[bin.bin]} (${bin.value.toFixed(1)} visits)`)
          );
        });
      } else {
        setPredictResult({ success: false, message: data.error || 'Forecast failed.' });
      }
    } catch (err) {
      setPredictResult({ success: false, message: 'Forecast request failed.' });
    } finally {
      setPredictLoading(false);
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return selectedPeriod === "monthly"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      : String(now.getFullYear());
  });

  const [predictLoading, setPredictLoading] = useState(false);
  const [predictResult, setPredictResult] = useState<{ success: boolean; message: string } | null>(null);

  const [visitData, setVisitData] = useState<VisitData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_visits: 0,
    average_visits: 0,
    peak_visits: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const formatXAxis = (tickItem: string) => {
    return tickItem;
  };

  const AngledXAxisTick = (props: {
    x: number;
    y: number;
    payload: { value: string };
  }) => {
    const { x, y, payload } = props;
    const words = payload.value.split(" ");
    return (
      <text
        x={x}
        y={y + 20}
        textAnchor="middle"
        fill="currentColor"
        className="text-xs text-gray-600 dark:text-gray-300">
        {words.map((word, index) => (
          <tspan key={index} x={x} dy={index ? "1.2em" : 0}>
            {word}
          </tspan>
        ))}
      </text>
    );
  };

  const CompanyXAxisTick = (props: {
    x: number;
    y: number;
    payload: { value: string };
  }) => {
    const { x, y, payload } = props;

    const lines = payload.value.match(/.{1,25}/g) || [];

    return (
      <text
        x={x}
        y={y + 10}
        textAnchor="end"
        fill="currentColor"
        transform={`rotate(-45, ${x}, ${y})`}
        className="text-xs text-gray-600 dark:text-gray-300">
        {lines.map((line, index) => (
          <tspan x={x} dy={index === 0 ? 0 : 12} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/visits/charts?period=${selectedPeriod}&date=${selectedDate}`
        );
        const data = await response.json();

        if (response.ok) {
          if (selectedPeriod === "monthly") {
            const [year, month] = selectedDate.split("-").map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const fullMonthData: VisitData[] = [];

            for (let day = 1; day <= daysInMonth; day++) {
              const dayString = `${year}-${String(month).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
              const existingData = data.visitsData.find(
                (item: { day: string }) => item.day === dayString
              );
              fullMonthData.push({
                day: String(day),
                visits: existingData ? existingData.visits : 0,
              });
            }
            setVisitData(fullMonthData);
          } else if (selectedPeriod === "yearly") {
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const fullYearData: VisitData[] = [];

            for (const month of months) {
              const existingData = data.visitsData.find(
                (item: { month: string }) => item.month === month
              );
              fullYearData.push({
                month: month,
                visits: existingData ? existingData.visits : 0,
              });
            }
            setVisitData(fullYearData);
          }

          setTimeData(data.timeDistribution);
          setStats(data.stats);
          setDepartmentData(data.departmentData || []);
          setCompanyData(data.companyData || []);
        } else {
          console.error("Failed to fetch data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod, selectedDate]);

  const periods = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    setSelectedDate(
      period === "monthly"
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        : String(now.getFullYear())
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Total Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total_visits}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Average Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.average_visits}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Peak Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.peak_visits}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => handlePeriodChange(period.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedPeriod === period.id
                    ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                {period.label}
              </button>
            ))}
          </div>

          <input
            type={selectedPeriod === "monthly" ? "month" : "number"}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={selectedPeriod === "yearly" ? "2000" : "2000-01"}
            max={selectedPeriod === "yearly" ? "2099" : "2099-12"}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Visitor Trends
          </h2>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitData}>
                  <XAxis
                    dataKey={selectedPeriod === "monthly" ? "day" : "month"}
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="currentColor"
                    className="fill-gray-900 dark:fill-gray-100"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <Building2 className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Visits by Department
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <XAxis
                    dataKey="department"
                    stroke="currentColor"
                    height={80}
                    interval={0}
                    tick={
                      <AngledXAxisTick
                        x={0}
                        y={0}
                        payload={{
                          value: "",
                        }}
                      />
                    }
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="currentColor"
                    className="fill-gray-900 dark:fill-gray-100"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Visits by Company
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={companyData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
                  <XAxis
                    dataKey="company"
                    stroke="currentColor"
                    height={100}
                    interval={0}
                    className="text-gray-600 dark:text-gray-300"
                    tick={
                      <CompanyXAxisTick x={0} y={0} payload={{ value: "" }} />
                    }
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="currentColor"
                    className="fill-gray-900 dark:fill-gray-100"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Time Distribution
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <XAxis
                    dataKey="time"
                    stroke="currentColor"
                    interval={1}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                    formatter={(value: number) => [`${value} visits`, "Visits"]}
                    labelFormatter={(time: string) => `Time: ${time}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--tw-prose-body)"
                    strokeWidth={2}
                    dot={{
                      fill: "var(--tw-prose-body)",
                      r: 3,
                    }}
                    className="stroke-gray-900 dark:stroke-gray-100 fill-gray-900 dark:fill-gray-100"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <VisitorPredictionChart />
      </div>
    </div>
  );
};

export default VisitorDashboard;
