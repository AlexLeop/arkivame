
'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  options?: any;
  height?: number;
  className?: string;
}

export function AnalyticsChart({ data, type, options = {}, height = 300, className }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        },
      },
      scales: type === 'line' || type === 'bar' ? {
        x: {
          display: true,
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      } : {},
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
      ...options,
    };

    const config: ChartConfiguration = {
      type,
      data,
      options: defaultOptions,
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [mounted, data, type, options]);

  if (!mounted) {
    return (
      <div className={className} style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-muted-foreground">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// Usage Analytics Chart
export function UsageChart({ data }: { data: any[] }) {
  const chartData: ChartData = {
    labels: data.map(item => item.day),
    datasets: [
      {
        label: 'Views',
        data: data.map(item => item.views),
        borderColor: 'rgb(45, 212, 191)',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return <AnalyticsChart type="line" data={chartData} />;
}

// Source Breakdown Chart
export function SourceChart({ data }: { data: Record<string, number> }) {
  const chartData: ChartData = {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return <AnalyticsChart type="doughnut" data={chartData} options={options} />;
}

// Growth Trends Chart
export function GrowthChart({ data }: { data: any[] }) {
  const chartData: ChartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Organizations',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(45, 212, 191, 0.8)',
        borderColor: 'rgb(45, 212, 191)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  return <AnalyticsChart type="bar" data={chartData} />;
}

// Tag Usage Chart  
export function TagChart({ data }: { data: any[] }) {
  const chartData: ChartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <AnalyticsChart type="bar" data={chartData} options={options} height={200} />;
}
