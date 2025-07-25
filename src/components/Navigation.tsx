import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Online Services", href: "/services" },
  { name: "Forms & Fees", href: "/forms" },
  { name: "Self-Help", href: "/help" },
  { name: "Divisions", href: "/divisions" },
  { name: "General Information", href: "/info" },
];

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-judicial-nav">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "py-4 px-2 text-white hover:bg-white/10 transition-colors border-b-2 border-transparent",
                location.pathname === item.href && "border-white bg-white/10"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;