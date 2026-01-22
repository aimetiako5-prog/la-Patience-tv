import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Douala', value: 1245, color: 'hsl(45 93% 58%)' },
  { name: 'Yaoundé', value: 890, color: 'hsl(187 85% 53%)' },
  { name: 'Bafoussam', value: 456, color: 'hsl(142 76% 45%)' },
  { name: 'Garoua', value: 234, color: 'hsl(38 92% 50%)' },
  { name: 'Autres', value: 175, color: 'hsl(222 30% 40%)' },
];

export const ZoneDistribution = () => {
  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">Répartition par zone</h3>
        <p className="text-sm text-muted-foreground">Distribution des abonnés actifs</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [`${value} abonnés`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">{item.name}</span>
            <span className="text-sm font-medium text-foreground ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
