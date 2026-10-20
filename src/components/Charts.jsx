import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const GRID = { color: '#eef0f3' };

// Line chart with a soft fill (Confidence Score / Filler Words)
export function TrendChart({ labels, data, label, color = '#2563eb', max }) {
  return (
    <div className="h-56 md:h-64">
      <Line
        data={{
          labels,
          datasets: [{
            label, data, borderColor: color, backgroundColor: color + '22',
            fill: true, tension: 0.35, spanGaps: true, pointRadius: 4, pointBackgroundColor: color,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ...(max ? { max } : {}), grid: GRID },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
          },
        }}
      />
    </div>
  );
}

// Bars = confidence (left axis), line = pacing WPM (right axis)
export function PerformanceChart({ labels, confidence, wpm }) {
  return (
    <div className="h-56 md:h-64">
      <Bar
        data={{
          labels,
          datasets: [
            { type: 'bar', label: 'Confidence', data: confidence, backgroundColor: '#3b82f6', borderRadius: 6, yAxisID: 'y' },
            { type: 'line', label: 'Pacing (WPM)', data: wpm, borderColor: '#14b8a6', backgroundColor: '#14b8a6', tension: 0.35, spanGaps: true, pointRadius: 4, yAxisID: 'y2' },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
          scales: {
            y: { beginAtZero: true, max: 100, grid: GRID },
            y2: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
          },
        }}
      />
    </div>
  );
}