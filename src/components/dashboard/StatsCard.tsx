import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  valueClassName?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName,
}: StatsCardProps) {
  return (
    <Card className="h-full p-4 border-2 hover:border-accent transition-colors hover-scale">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground leading-snug">
            {title}
          </p>
          <div className="p-2 bg-accent/10 rounded-lg shrink-0">
            <Icon className="w-4 h-4 text-accent" />
          </div>
        </div>
        <div className="space-y-1">
          <p className={cn("text-xl font-display font-bold text-foreground", valueClassName)}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
