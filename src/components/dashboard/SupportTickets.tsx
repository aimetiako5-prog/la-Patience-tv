import { AlertCircle, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  title: string;
  subscriber: string;
  zone: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  time: string;
}

const tickets: Ticket[] = [
  {
    id: "TKT-089",
    title: "Pas de signal depuis 2 jours",
    subscriber: "Jean Mbarga",
    zone: "Douala - Bonapriso",
    priority: "high",
    status: "open",
    time: "Il y a 30 min"
  },
  {
    id: "TKT-088",
    title: "Chaînes floues sur le bouquet Premium",
    subscriber: "Marie Ngo",
    zone: "Yaoundé - Bastos",
    priority: "medium",
    status: "in_progress",
    time: "Il y a 2h"
  },
  {
    id: "TKT-087",
    title: "Demande de changement de bouquet",
    subscriber: "Paul Kamga",
    zone: "Douala - Akwa",
    priority: "low",
    status: "open",
    time: "Il y a 4h"
  },
];

const priorityStyles = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-warning/20 text-warning",
  low: "bg-accent/20 text-accent",
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
};

export const SupportTickets = () => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Tickets support</h3>
          <p className="text-sm text-muted-foreground">Demandes en attente</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Nouveau ticket
        </Button>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => {
          const StatusIcon = statusIcons[ticket.status];
          return (
            <div 
              key={ticket.id}
              className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    priorityStyles[ticket.priority]
                  )}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {ticket.subscriber} • {ticket.zone}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {ticket.time}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">{ticket.id}</span>
                <span className={cn(
                  "badge-status text-xs",
                  ticket.priority === "high" && "badge-expired",
                  ticket.priority === "medium" && "badge-pending",
                  ticket.priority === "low" && "badge-active"
                )}>
                  {ticket.priority === "high" ? "Urgent" : ticket.priority === "medium" ? "Moyen" : "Faible"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <a 
        href="/support" 
        className="block text-center text-sm text-primary hover:text-primary/80 font-medium mt-4 pt-4 border-t border-border"
      >
        Voir tous les tickets →
      </a>
    </div>
  );
};
