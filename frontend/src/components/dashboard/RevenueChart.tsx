import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function RevenueChart({ data }: { data: Array<{ label: string; total: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue trend</CardTitle>
        <span className="text-xs text-zinc-400">Last 6 months</span>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e4e4ea', fontSize: 13 }}
              formatter={(value: number) => [`$${value}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} fill="url(#revenueFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
