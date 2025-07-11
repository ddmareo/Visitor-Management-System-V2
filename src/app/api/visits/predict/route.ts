// app/api/visits/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate } = body;
    
    // Generate 90 days of hardcoded prediction data
    const forecast = [];
    const baseDate = new Date(startDate || '2025-07-11');
    
    for (let i = 0; i < 90; i++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + i);
      
      // Generate realistic visitor patterns
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Much lower base visits: weekends are nearly empty, weekdays moderate
      let baseVisits;
      if (isWeekend) {
        // Weekends: 0-5 visitors (often completely empty)
        baseVisits = Math.random() < 0.4 ? 0 : Math.random() * 5;
      } else {
        // Weekdays: 12-25 visitors with some variation
        baseVisits = 12 + Math.random() * 13;
      }
      
      // Add some weekly variation (smaller impact)
      const weeklyVariation = Math.sin((i / 7) * Math.PI) * 2;
      baseVisits += weeklyVariation;
      
      // Add some monthly trend (very slight increase over time)
      const monthlyTrend = (i / 90) * 3;
      baseVisits += monthlyTrend;
      
      // Generate time bins (6 time slots: 7-9, 9-11, 11-13, 13-15, 15-17, 17-19)
      const timeBins = [];
      const totalVisits = Math.max(0, Math.round(baseVisits));
      
      // Distribution patterns for different time slots
      const timePatterns = [
        0.08, // 7-9 AM (low)
        0.15, // 9-11 AM (medium)
        0.25, // 11-1 PM (high - lunch meetings)
        0.28, // 1-3 PM (highest - afternoon meetings)
        0.18, // 3-5 PM (medium-high)
        0.06  // 5-7 PM (low)
      ];
      
      // Add some randomness to the patterns
      for (let j = 0; j < 6; j++) {
        const baseAmount = totalVisits * timePatterns[j];
        const variation = (Math.random() - 0.5) * baseAmount * 0.4;
        timeBins.push(Math.max(0, baseAmount + variation));
      }
      
      // Ensure timeBins sum roughly equals totalVisits
      const timeBinsSum = timeBins.reduce((sum, val) => sum + val, 0);
      if (timeBinsSum > 0) {
        const adjustmentFactor = totalVisits / timeBinsSum;
        for (let j = 0; j < timeBins.length; j++) {
          timeBins[j] *= adjustmentFactor;
        }
      }
      
      forecast.push({
        date: currentDate.toISOString().split('T')[0],
        totalVisits: totalVisits,
        timeBins: timeBins
      });
    }
    
    return NextResponse.json({
      success: true,
      forecast: forecast,
      message: 'Prediction generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating prediction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate prediction',
        forecast: []
      },
      { status: 500 }
    );
  }
}