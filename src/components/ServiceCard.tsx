import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  href?: string;
}

const ServiceCard = ({ title, description, icon, iconBg = "bg-primary", href }: ServiceCardProps) => {
  const CardWrapper = href ? "a" : "div";
  
  return (
    <CardWrapper href={href} className={cn(href && "block hover:scale-105 transition-transform")}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6 text-center">
          <div className={cn("w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center", iconBg)}>
            <div className="text-white text-2xl">{icon}</div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

export default ServiceCard;