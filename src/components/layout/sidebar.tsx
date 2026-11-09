"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Wrench,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/health", label: "API Health", icon: Activity },
  { href: "/infra", label: "Infrastructure", icon: Server },
  { href: "/housekeeping", label: "Housekeeping", icon: Wrench },
  { href: "/security", label: "Security", icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-background">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">Yari Ride Ops</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        Yarri Ride · v2
      </div>
    </aside>
  );
}