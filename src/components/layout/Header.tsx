import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar reuniões, leads, vendedores..."
          className="pl-10 bg-secondary/50 border-transparent hover:border-border focus:border-primary"
        />
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="gradient" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Reunião
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
