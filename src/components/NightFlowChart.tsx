import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DayAnalysis } from '../types.ts';
import { AlertCircle, Activity, Info } from 'lucide-react';

interface NightFlowChartProps {
  days: DayAnalysis[];
}

export const NightFlowChart: React.FC<NightFlowChartProps> = ({ days }) => {
  const validFlowsCount = days.filter(d => d.nightFlow !== null).length;

  if (validFlowsCount === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center my-6">
        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-700">No Valid Overnight Flows</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          At least two consecutive days with valid 11 PM and 5 AM readings are required to calculate the 6-hour overnight flow.
        </p>
      </div>
    );
  }

  // Prepare chart data format
  const chartData = days.map(d => ({
    day: d.day,
    dayLabel: `Day ${d.day}`,
    nightFlow: d.nightFlow !== null ? Number(d.nightFlow.toFixed(2)) : null,
    baseline: d.baseline !== null ? Number(d.baseline.toFixed(2)) : null,
    threshold: d.threshold !== null ? Number(d.threshold.toFixed(2)) : null,
    isFlagged: d.isFlagged,
    flowStatus: d.flowStatus,
    confidence: d.confidence,
    hasAlert: d.hasAlert,
  }));

  // Custom Dot Renderer to highlight flagged nights in bold red
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderFlowDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps;
    if (cx === null || cy === null || payload?.nightFlow === null) return null;

    if (payload.isFlagged === true) {
      return (
        <svg key={`dot-flag-${payload.day}`}>
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth={2}
            className="animate-pulse"
          />
          <circle
            cx={cx}
            cy={cy}
            r={9}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeOpacity={0.6}
          />
        </svg>
      );
    }

    return (
      <circle
        key={`dot-norm-${payload.day}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="#2563eb"
        stroke="#ffffff"
        strokeWidth={1}
      />
    );
  };

  // Custom Tooltip component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md max-w-xs">
        <div className="font-bold text-sm text-slate-100 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between">
          <span>{label}</span>
          {data.isFlagged === true ? (
            <span className="bg-red-500/80 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Flagged Anomaly
            </span>
          ) : data.flowStatus === 'learning' ? (
            <span className="bg-amber-500/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Learning Phase
            </span>
          ) : data.nightFlow === null ? (
            <span className="bg-slate-600 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
              Missing Data
            </span>
          ) : (
            <span className="bg-emerald-500/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              Normal Baseline
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Night Flow:</span>
            <span className="font-bold text-blue-400">
              {data.nightFlow !== null ? `${data.nightFlow} L/h` : 'Missing'}
            </span>
          </div>

          {data.baseline !== null && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Baseline (Median):</span>
              <span className="font-semibold text-emerald-400">{data.baseline} L/h</span>
            </div>
          )}

          {data.threshold !== null && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Alert Threshold:</span>
              <span className="font-semibold text-amber-400">{data.threshold} L/h</span>
            </div>
          )}

          {data.hasAlert && (
            <div className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-red-300 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Rolling Alert Active ({data.confidence} Conf.)
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 my-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Overnight Water Flow Timeline (11 PM - 5 AM)
          </h3>
          <p className="text-xs text-slate-500">
            Calculated as <code>(5 AM reading - previous 11 PM reading) / 6 hours</code>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md font-semibold border border-red-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            Red dots = Flagged Nights
          </span>
        </div>
      </div>

      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              stroke="#64748b"
              fontSize={11}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              stroke="#64748b"
              fontSize={11}
              label={{
                value: 'Night flow (L/hour)',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: { textAnchor: 'middle', fill: '#475569', fontSize: 12, fontWeight: 600 },
              }}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            {/* Night Flow series */}
            <Line
              type="monotone"
              dataKey="nightFlow"
              name="Night Flow (L/hour)"
              stroke="#2563eb"
              strokeWidth={2.2}
              dot={renderFlowDot}
              activeDot={{ r: 7, stroke: '#1d4ed8', strokeWidth: 2 }}
              connectNulls={false}
            />
            {/* Baseline series */}
            <Line
              type="monotone"
              dataKey="baseline"
              name="Normal Baseline"
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
            {/* Threshold series */}
            <Line
              type="monotone"
              dataKey="threshold"
              name="Detection Threshold"
              stroke="#f59e0b"
              strokeWidth={1.8}
              strokeDasharray="2 2"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>
          Days with missing endpoint readings appear as gaps to prevent misleading linear interpolation.
          Normal history excludes flagged nights to preserve baseline sensitivity.
        </span>
      </div>
    </div>
  );
};
