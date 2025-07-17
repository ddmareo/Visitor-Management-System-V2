"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  processPredictionData,
  calculateTopPeakHours,
  calculateTotalPredictedVisits,
  type PredictionData,
  type ChartData,
} from "@/utils/prediction-utils";

type ApiResponse = {
  status: string;
  forecast: PredictionData[];
  metadata: {
    total_predictions: number;
    historical_data_points: number;
    last_historical_date: string;
    forecast_start_date: string;
    forecast_end_date: string;
  };
};

const VisitorPredictionChart = () => {
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("daily");
  const [totalPredictedVisits, setTotalPredictedVisits] = useState(0);
  const [topPeakHours, setTopPeakHours] = useState<string[]>([]);

  const filters = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
  ];

  const fetchPredictionData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setPredictionData(data.forecast);
        
        const total = calculateTotalPredictedVisits(data.forecast);
        setTotalPredictedVisits(total);
        
        const peakHours = calculateTopPeakHours(data.forecast);
        setTopPeakHours(peakHours);
      }
    } catch (error) {
      console.error('Error fetching prediction data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (predictionData.length > 0) {
      const processed = processPredictionData(predictionData, selectedFilter);
      setChartData(processed);
    }
  }, [predictionData, selectedFilter]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              3-Month Visitor Prediction
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedFilter === filter.id
                      ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}>
                  {filter.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={fetchPredictionData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Predicting...' : 'Generate Forecast'}
            </button>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Generating prediction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            90-Day Visitor Prediction
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  selectedFilter === filter.id
                    ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                {filter.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={fetchPredictionData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Predicting...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-gray-700 dark:text-gray-300 mr-2" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Predicted Visits
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalPredictedVisits.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-gray-700 dark:text-gray-300 mr-2" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Average Daily Visits
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(totalPredictedVisits / 90)}
          </p>
        </div>
      </div>

      <div className="h-80">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-300">Generating prediction...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <XAxis
                dataKey="displayDate"
                stroke="currentColor"
                interval={selectedFilter === "daily" ? 6 : 0}
                angle={-45}
                textAnchor="end"
                height={60}
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
                formatter={(value: number, name: string, props: any) => {
                  const { payload } = props;
                  return [
                    <div key="tooltip-content">
                      <div>{`${value} visits`}</div>
                      <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.8 }}>
                        <div>Peak Hours:</div>
                        <div>• {payload.topPeakHours[0]}</div>
                        <div>• {payload.topPeakHours[1]}</div>
                      </div>
                    </div>,
                    "Predicted Visits"
                  ];
                }}
                labelFormatter={(label: string) => `Date: ${label}`}
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
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-300">Click "Generate Forecast" to load prediction data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorPredictionChart;