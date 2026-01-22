import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 2400000 },
  { month: 'Fév', revenue: 2800000 },
  { month: 'Mar', revenue: 3200000 },
  { month: 'Avr', revenue: 2900000 },
  { month: 'Mai', revenue: 3500000 },
  { month: 'Jun', revenue: 3800000 },
  { month: 'Jul', revenue: 4200000 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-CM', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value) + ' FCFA';
};

export const RevenueChart = () => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Revenus mensuels</h3>
          <p className="text-sm text-muted-foreground">Évolution sur les 7 derniers mois</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg">
            7 mois
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg">
            1 an
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(45 93% 58%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(45 93% 58%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -5px rgba(0,0,0,0.4)'
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              formatter={(value: number) => [formatCurrency(value), 'Revenus']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(45 93% 58%)" 
              strokeWidth={2}
              fill="url(#revenueGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
