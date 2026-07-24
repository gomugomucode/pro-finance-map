import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNotifications, markNotificationRead, deleteNotification } from "@/lib/finance.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, AlertTriangle, Info, ShieldAlert, Award } from "lucide-react";
import { toast } from "sonner";

const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => listNotifications(),
});

export const Route = createFileRoute("/_authenticated/notifications")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(notificationsQuery);
  },
  component: NotificationsPage,
  pendingComponent: () => <div className="p-8 text-sm text-muted-foreground">Loading notifications...</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

function NotificationsPage() {
  const { data: notifications = [] } = useSuspenseQuery(notificationsQuery);
  const queryClient = useQueryClient();

  const markFn = useServerFn(markNotificationRead);
  const deleteFn = useServerFn(deleteNotification);

  const markMutation = useMutation({
    mutationFn: (d: { id?: string; all?: boolean }) => markFn({ data: d }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Updated notification status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "budget_alert":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "loan_overdue":
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case "goal_reminder":
        return <Award className="h-5 w-5 text-success" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notification Center</h1>
          <p className="text-sm text-muted-foreground">
            System alerts for budget limits, loan due dates, bill renewals, and goal milestones.
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markMutation.mutate({ all: true })}
          >
            <Check className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card-elevated p-12 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
            No notifications recorded. You're all caught up!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`card-elevated p-4 flex items-center justify-between gap-4 transition ${
                n.is_read ? "opacity-75" : "border-l-4 border-l-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {n.type.replace("_", " ")}
                    </Badge>
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markMutation.mutate({ id: n.id })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(n.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
