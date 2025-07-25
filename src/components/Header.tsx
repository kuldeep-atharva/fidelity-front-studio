import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Header = () => {
  return (
    <header className="bg-judicial-header text-white">
      {/* Top Bar */}
      <div className="border-b border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="text-center flex-1">
              JUDICIAL BRANCH OF CALIFORNIA
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-200">Superior Court</a>
              <a href="#" className="hover:text-gray-200">Courts of Appeal</a>
              <a href="#" className="hover:text-gray-200">Superior Courts</a>
              <a href="#" className="hover:text-gray-200">Judicial Council</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary rounded-lg p-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-primary font-bold text-sm">⚖</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">SUPERIOR COURT OF CALIFORNIA</div>
              <div className="text-xl font-bold">COUNTY OF SAN FRANCISCO</div>
              <div className="text-sm text-gray-300">Self-Help Legal Center</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select defaultValue="english">
              <SelectTrigger className="w-24 bg-white text-black border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Español</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search..." 
                className="pl-10 w-64 bg-white text-black border-0"
              />
              <Button size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary-dark">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;