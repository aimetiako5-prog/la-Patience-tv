import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  subscriber: string;
  zone: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

const payments: Payment[] = [
  { 
    id: "PAY-001", 
    subscriber: "Jean Mbarga", 
    zone: "Douala - Bonapriso",
    amount: 15000, 
    method: "MTN MoMo",
    status: "completed",
    date: "Il y a 5 min"
  },
  { 
    id: "PAY-002", 
    subscriber: "Marie Ngo", 
    zone: "Yaoundé - Bastos",
    amount: 25000, 
    method: "Orange Money",
    status: "completed",
    date: "Il y a 12 min"
  },
  { 
    id: "PAY-003", 
    subscriber: "Paul Kamga", 
    zone: "Douala - Akwa",
    amount: 15000, 
    method: "Cash",
    status: "pending",
    date: "Il y a 25 min"
  },
  { 
    id: "PAY-004", 
    subscriber: "Résidence Émeraude", 
    zone: "Yaoundé - Mvan",
    amount: 150000, 
    method: "MTN MoMo",
    status: "completed",
    date: "Il y a 1h"
  },
  { 
    id: "PAY-005", 
    subscriber: "André Fouda", 
    zone: "Bafoussam - Centre",
    amount: 15000, 
    method: "Orange Money",
    status: "failed",
    date: "Il y a 2h"
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-CM').format(amount) + ' FCFA';
};

const StatusIcon = ({ status }: { status: Payment["status"] }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case "pending":
      return <Clock className="w-4 h-4 text-warning" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
};

export const RecentPayments = () => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Paiements récents</h3>
          <p className="text-sm text-muted-foreground">Dernières transactions</p>
        </div>
        <a href="/payments" className="text-sm text-primary hover:text-primary/80 font-medium">
          Voir tout →
        </a>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <div 
            key={payment.id} 
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <StatusIcon status={payment.status} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{payment.subscriber}</p>
              <p className="text-sm text-muted-foreground truncate">{payment.zone}</p>
            </div>

            <div className="text-right">
              <p className="font-medium text-foreground">{formatCurrency(payment.amount)}</p>
              <p className="text-xs text-muted-foreground">{payment.date}</p>
            </div>

            <span className={cn(
              "badge-status",
              payment.status === "completed" && "badge-active",
              payment.status === "pending" && "badge-pending",
              payment.status === "failed" && "badge-expired"
            )}>
              {payment.method}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
