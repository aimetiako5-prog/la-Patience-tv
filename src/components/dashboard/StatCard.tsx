import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary"
}: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-secondary",
          iconColor
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
