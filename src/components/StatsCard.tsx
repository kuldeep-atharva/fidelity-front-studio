import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
}

const StatsCard = ({ title, value, subtitle, icon, iconBg = "bg-primary", trend }: StatsCardProps) => {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", iconBg)}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
        {trend && (
          <div className="absolute top-2 right-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              trend === "up" && "bg-success",
              trend === "down" && "bg-destructive",
              trend === "neutral" && "bg-warning"
            )} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;