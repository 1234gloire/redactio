import RedactioLayout from "@/components/RedactioLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Audit() {
  const { data: logs } = trpc.audit.list.useQuery({ limit: 200 });

  const actionColor = (action: string) => {
    if (action.startsWith("generation")) return "default";
    if (action.startsWith("admin")) return "destructive";
    if (action.startsWith("prompt")) return "secondary";
    return "outline";
  };

  return (
    <RedactioLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Journal d'audit</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Traçabilité des actions techniques. Aucun contenu médical n'est journalisé.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              200 dernières entrées — sans contenu médical (conformité RGPD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!logs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Aucune entrée dans le journal.</p>
            ) : (
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-xs"
                  >
                    <span className="text-muted-foreground font-mono shrink-0 mt-0.5">
                      {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })}
                    </span>
                    <Badge variant={actionColor(log.action) as "default" | "secondary" | "destructive" | "outline"} className="text-xs shrink-0">
                      {log.action}
                    </Badge>
                    <span className="text-muted-foreground">
                      {log.resource}{log.resourceId ? ` #${log.resourceId}` : ""}
                    </span>
                    {log.metadata !== null && log.metadata !== undefined && (
                      <span className="text-muted-foreground/70 font-mono truncate max-w-xs">
                        {JSON.stringify(log.metadata as Record<string, unknown>).slice(0, 120)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RedactioLayout>
  );
}
