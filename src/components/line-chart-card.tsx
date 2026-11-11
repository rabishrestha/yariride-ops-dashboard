"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInTimeZone } from "date-fns-tz";

export interface ChartPoint {
  t: string | number; // <-- Updated to accept both string and number
  [key: string]: string | number;
}

const TZ = "Asia/Kathmandu"; // Nepal Time (NPT)

export function LineChartCard({
  title,
  data,
  series,
  unit = "",
  yDomain,
}: {
  title: string;
  data: ChartPoint[];
  series: { key: string; label: string; color: string }[];
  unit?: string;
  yDomain?: [number | "auto", number | "auto"];
}) {
  // Format time strings for the X-Axis (e.g., "16:20")
  const formatXAxis = (tickItem: string | number) => {
    if (!tickItem) return "";
    try {
      // new Date() handles both ISO strings and Unix timestamps correctly
      return formatInTimeZone(new Date(tickItem), TZ, "HH:mm");
    } catch {
      return String(tickItem);
    }
  };

  // Format tooltips to show full date & time with NPT label
  const formatTooltipLabel = (label: React.ReactNode) => {
    const labelStr = String(label ?? "");
    if (!labelStr) return "";
    try {
      const date = new Date(labelStr);
      if (isNaN(date.getTime())) return labelStr;
      return formatInTimeZone(date, TZ, "MMM d, HH:mm") + " NPT";
    } catch {
      return labelStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

            <XAxis
              dataKey="t"
              fontSize={11}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatXAxis}
              type="number"
              domain={["auto", "auto"]}   // <-- Changed from dataMin/dataMax to auto
              scale="time"
            />

            <YAxis
              fontSize={11}
              domain={yDomain ?? ["auto", "auto"]}
              unit={unit}
              width={50}
            />

            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelFormatter={formatTooltipLabel}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                return [`${Number.isFinite(n) ? n : value}${unit}`, ""];
              }}
            />

            {series.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="line"
                verticalAlign="top"
                height={24}
              />
            )}

            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}