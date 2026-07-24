import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Repeat, Tv, ShieldAlert, Award } from "lucide-react";

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  amount_minor?: number;
  currency?: string;
  type: "transaction" | "recurring" | "subscription" | "loan" | "goal";
  kind?: "income" | "expense" | "transfer";
}

export function FinancialCalendarView({ events }: { events: CalendarEventItem[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const getEventsForDay = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date.slice(0, 10) === dayStr);
  };

  const getBadgeColor = (type: string, kind?: string) => {
    if (type === "subscription") return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    if (type === "recurring") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (type === "loan") return "bg-red-500/15 text-red-400 border-red-500/30";
    if (type === "goal") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    return kind === "income" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400";
  };

  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" /> {monthLabel}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      {/* Grid days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-28 rounded-lg bg-muted/20 border border-transparent" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={day}
              className={`h-28 rounded-lg p-1.5 border transition overflow-hidden flex flex-col justify-between ${
                isToday ? "border-primary bg-primary/5" : "border-border/60 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold h-5 w-5 grid place-items-center rounded-full ${
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {dayEvents.length} items
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`rounded px-1 py-0.5 text-[9px] font-medium truncate border ${getBadgeColor(
                      e.type,
                      e.kind
                    )}`}
                    title={`${e.title} - ${e.amount_minor ? (e.amount_minor / 100).toFixed(2) : ""}`}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-muted-foreground text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
