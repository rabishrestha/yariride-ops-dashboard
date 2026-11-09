import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function WarningBanner({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="animate-in fade-in-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Attention required</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}