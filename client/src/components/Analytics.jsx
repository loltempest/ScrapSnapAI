import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Analytics({ stats }) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  const { overall, topItems, dailyStats, categoryStats } = stats;

  // Daily waste trend chart
  const dailyChartData = {
    labels: dailyStats?.map(day => format(parseISO(day.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'Daily Waste Value ($)',
        data: dailyStats?.map(day => day.total_value) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Top wasted items chart
  const topItemsChartData = {
    labels: topItems?.slice(0, 5).map(item => item.name) || [],
    datasets: [
      {
        label: 'Frequency',
        data: topItems?.slice(0, 5).map(item => item.frequency) || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(252, 165, 165, 0.8)',
          'rgba(254, 202, 202, 0.8)',
          'rgba(254, 226, 226, 0.8)'
        ]
      }
    ]
  };

  // Category breakdown
  const categoryChartData = {
    labels: categoryStats?.map(cat => cat.category) || [],
    datasets: [
      {
        data: categoryStats?.map(cat => cat.total_value) || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ]
      }
    ]
  };

  return (
    <div id="analytics-section"
          className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Analytics Dashboard
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Total Entries</div>
          <div className="text-3xl font-bold text-gray-900">
            {overall?.total_entries || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Total Waste Value</div>
          <div className="text-3xl font-bold text-red-600">
            ${parseFloat(overall?.total_value || 0).toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Average Per Entry</div>
          <div className="text-3xl font-bold text-orange-600">
            ${parseFloat(overall?.avg_value || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div  className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Waste Trend (Last 30 Days)
          </h3>
          {dailyStats && dailyStats.length > 0 ? (
            <Line
              data={dailyChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toFixed(2);
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No daily data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 Wasted Items (Frequency)
          </h3>
          {topItems && topItems.length > 0 ? (
            <Bar
              data={topItemsChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No item data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Waste by Category
          </h3>
          {categoryStats && categoryStats.length > 0 ? (
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Wasted Items Details
          </h3>
          {topItems && topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        ${parseFloat(item.total_value || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.frequency} times
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No item data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;






