import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function DockerTable({ docker }: { docker: Record<string, string> }) {
  const entries = Object.entries(docker);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Container</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-muted-foreground">
              No container data.
            </TableCell>
          </TableRow>
        )}
        {entries.map(([name, status]) => {
          const healthy =
            status.toLowerCase().includes("healthy") ||
            status.toLowerCase().startsWith("up");
          return (
            <TableRow key={name}>
              <TableCell className="font-mono text-xs">{name}</TableCell>
              <TableCell>
                <Badge variant={healthy ? "default" : "destructive"}>{status}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
