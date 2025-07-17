export type PredictionData = {
  Date: string;
  Visits: number;
  Peak_1: string;
  Peak_2: string;
};

export type ChartData = {
  date: string;
  visits: number;
  displayDate: string;
  timeBins: number[];
  topPeakHours: string[];
};

export const binLabels = ["7-9 AM", "9-11 AM", "11-1 PM", "1-3 PM", "3-5 PM", "5-7 PM"];

export const convertPeakToTimeBins = (peak1: string, peak2: string): number[] => {
  const timeBins = new Array(6).fill(0);
  
  const peakHours = [peak1, peak2];
  peakHours.forEach(peak => {
    const index = binLabels.indexOf(peak);
    if (index !== -1) {
      timeBins[index] = Math.floor(Math.random() * 20) + 10;
    }
  });
  
  timeBins.forEach((value, index) => {
    if (value === 0) {
      timeBins[index] = Math.floor(Math.random() * 10) + 1;
    }
  });
  
  return timeBins;
};

export const getTopPeakHoursForDay = (timeBins: number[]): string[] => {
  const sortedBins = timeBins
    .map((value, index) => ({ index, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  
  return sortedBins.map(bin => binLabels[bin.index]);
};

const processDailyData = (data: PredictionData[]): ChartData[] => {
  return data.map(item => {
    const timeBins = convertPeakToTimeBins(item.Peak_1, item.Peak_2);
    return {
      date: item.Date,
      visits: Math.round(item.Visits),
      displayDate: new Date(item.Date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      timeBins: timeBins,
      topPeakHours: [item.Peak_1, item.Peak_2]
    };
  });
};

const processWeeklyData = (data: PredictionData[]): ChartData[] => {
  const weeklyData: { [key: string]: { visits: number; dates: string[]; timeBins: number[]; peaks: string[] } } = {};
  
  data.forEach(item => {
    const date = new Date(item.Date);
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { visits: 0, dates: [], timeBins: new Array(6).fill(0), peaks: [] };
    }
    weeklyData[weekKey].visits += item.Visits;
    weeklyData[weekKey].dates.push(item.Date);
    weeklyData[weekKey].peaks.push(item.Peak_1, item.Peak_2);
    
    const itemTimeBins = convertPeakToTimeBins(item.Peak_1, item.Peak_2);
    itemTimeBins.forEach((value, index) => {
      weeklyData[weekKey].timeBins[index] += value;
    });
  });

  return Object.entries(weeklyData).map(([weekStart, data]) => {
    const peakCounts: { [key: string]: number } = {};
    data.peaks.forEach(peak => {
      peakCounts[peak] = (peakCounts[peak] || 0) + 1;
    });
    
    const topWeeklyPeaks = Object.entries(peakCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([peak]) => peak);

    return {
      date: weekStart,
      visits: Math.round(data.visits),
      displayDate: `Week of ${new Date(weekStart).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })}`,
      timeBins: data.timeBins,
      topPeakHours: topWeeklyPeaks
    };
  });
};

export const processPredictionData = (data: PredictionData[], selectedFilter: string): ChartData[] => {
  if (selectedFilter === "daily") {
    return processDailyData(data);
  } else {
    return processWeeklyData(data);
  }
};

export const calculateTopPeakHours = (data: PredictionData[]): string[] => {
  const peakCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    [item.Peak_1, item.Peak_2].forEach(peak => {
      peakCounts[peak] = (peakCounts[peak] || 0) + 1;
    });
  });

  return Object.entries(peakCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([peak]) => peak);
};

export const calculateTotalPredictedVisits = (data: PredictionData[]): number => {
  const total = data.reduce((sum: number, item: PredictionData) => 
    sum + item.Visits, 0
  );
  return Math.round(total);
};