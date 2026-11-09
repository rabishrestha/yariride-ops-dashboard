"use client";
import { useState } from "react";
import { Trash2, FileWarning, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Action = { id: string; label: string; description: string; command: string } | null;

const ACTIONS: Exclude<Action, null>[] = [
  {
    id: "vacuum-logs",
    label: "Vacuum logs",
    description:
      "Rotate and compress /var/log, truncate the vitals.jsonl file. Safe to run weekly.",
    command: "sudo logrotate -f /etc/logrotate.d/yarri && truncate -s 0 /var/log/yarri/vitals.jsonl",
  },
  {
    id: "prune-docker",
    label: "Prune Docker",
    description:
      "Remove dangling images, stopped containers and unused build cache. Frees disk space.",
    command: "docker system prune -af --volumes",
  },
  {
    id: "restart-api",
    label: "Restart API containers",
    description: "Gracefully restart prod and test API containers.",
    command: "docker compose restart yarri_backend-prod yarri_backend-test",
  },
];

export default function HousekeepingPage() {
  const [pending, setPending] = useState<Action>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current disk usage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Detail coming from the live snapshot. Check the Overview page for the current
          <code className="mx-1 rounded bg-muted px-1">/var/log</code> and{" "}
          <code className="mx-1 rounded bg-muted px-1">vitals.jsonl</code> sizes.
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {ACTIONS.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-sm">{a.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{a.description}</p>
              <code className="block break-all rounded bg-muted p-2 text-xs">
                {a.command}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPending(a)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Run
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Manual runbook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <FileWarning className="mr-1 inline h-4 w-4" /> Log rotation is handled by{" "}
            <code className="rounded bg-muted px-1">logrotate</code>. To rotate now:
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
{`sudo logrotate -f /etc/logrotate.d/yarri

# Force a fresh truncation of the streamed log file
sudo truncate -s 0 /var/log/yarri/vitals.jsonl`}
          </pre>
          <p>
            <RotateCw className="mr-1 inline h-4 w-4" /> Docker cleanup:
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
{`docker system df           # see what's using space
docker system prune -af    # prune images / containers / build cache`}
          </pre>
        </CardContent>
      </Card>

      <AlertDialog open={!!pending} onOpenChange={() => setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run “{pending?.label}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will execute:
              <code className="mt-2 block break-all rounded bg-muted p-2 text-xs">
                {pending?.command}
              </code>
              <span className="mt-2 block text-xs">
                (Wiring to a secure endpoint is coming soon. This UI is currently a
                dry-run preview.)
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPending(null);
                // TODO: POST to /api/actions
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}