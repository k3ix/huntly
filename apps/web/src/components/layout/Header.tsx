import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJobStats } from "@/api/queries";

interface HeaderProps {
  onAddJob: () => void;
}

export function Header({ onAddJob }: HeaderProps) {
  const { data: stats } = useJobStats();
  const location = useLocation();

  return (
    <header className="border-b px-6 py-3 flex items-center gap-6 bg-background">
      <span className="font-bold text-lg">Huntly</span>

      <nav className="flex gap-1">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            location.pathname === "/"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Board
        </Link>
        <Link
          to="/list"
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            location.pathname === "/list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          List
        </Link>
      </nav>

      {stats && (
        <span className="text-sm text-muted-foreground ml-2">
          {stats.total} jobs
        </span>
      )}

      <div className="ml-auto">
        <Button size="sm" onClick={onAddJob}>
          Add Job
        </Button>
      </div>
    </header>
  );
}
