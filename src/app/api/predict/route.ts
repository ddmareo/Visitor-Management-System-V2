import { NextRequest, NextResponse } from 'next/server';

// Generate hardcoded 90 days of prediction data
type PredictionDay = {
  date: string;
  totalVisits: number;
  timeBins: number[];
  topBusyHours: { label: string; count: number }[];
};

function getFakePredictionData(): PredictionDay[] {
  const days: PredictionDay[] = [];
  const start = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    // Generate 24 bins (hours), with some fake peaks
    const bins = Array.from({ length: 24 }, (_, h) =>
      Math.round(
        50 + 30 * Math.sin((h - 12) / 3) + Math.random() * 10 + (h === 8 || h === 17 ? 40 : 0)
      )
    );
    const total = bins.reduce((a, b) => a + b, 0);
    // Find top 2 hours
    const top = [...bins]
      .map((count, idx) => ({ label: `${idx}:00`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
    days.push({
      date: dateStr,
      totalVisits: total,
      timeBins: bins,
      topBusyHours: top,
    });
  }
  return days;
}

export async function GET(req: NextRequest) {
  const data = getFakePredictionData();
  // Also return summary info for toolkit
  const totalVisits = data.reduce((acc, d) => acc + d.totalVisits, 0);
  // Find peak bins across all days
  const hourSums = Array(24).fill(0);
  data.forEach(day => day.timeBins.forEach((c, i) => (hourSums[i] += c)));
  const topBins = [...hourSums]
    .map((count, idx) => ({ label: `${idx}:00`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  return NextResponse.json({
    days: data,
    summary: {
      totalVisits,
      topBins,
    },
  });
}
