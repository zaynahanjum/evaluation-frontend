"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  FileCode2,
  LayoutDashboard,
  LogOut,
  PanelsTopLeft,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearAdminSession, getAdminSession } from "@/lib/admin-session";
import { logoutRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Mentors & Judges", icon: Users },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/rounds", label: "Rounds", icon: ClipboardList },
  { href: "/admin/panels", label: "Panels", icon: PanelsTopLeft },
  { href: "/admin/scores", label: "Scores", icon: Trophy },
  { href: "/admin/submissions", label: "Submissions", icon: FileCode2 },
  { href: "/admin/timeline", label: "Timeline", icon: CalendarClock },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setUsername(session.username);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [router]);

  async function signOut() {
    const session = getAdminSession();
    if (session?.refreshToken) {
      await logoutRequest(session.refreshToken);
    }
    clearAdminSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:w-64 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {"</>"}
              </div>
              <div>
                <p className="text-sm font-semibold">Devhack Admin</p>
                <p className="text-xs text-muted-foreground">{username ?? "Admin"}</p>
              </div>
            </div>
            <Button
              className="lg:mt-4 lg:w-full"
              onClick={() => void signOut()}
              size="sm"
              variant="outline"
            >
              <LogOut />
              Sign out
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
