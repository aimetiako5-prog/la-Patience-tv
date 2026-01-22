import { UserPlus, CreditCard, Megaphone, FileText, Wifi, MapPin } from "lucide-react";

const actions = [
  { icon: UserPlus, label: "Nouvel abonné", color: "bg-primary/20 text-primary" },
  { icon: CreditCard, label: "Enregistrer paiement", color: "bg-success/20 text-success" },
  { icon: Wifi, label: "Activer signal", color: "bg-accent/20 text-accent" },
  { icon: MapPin, label: "Nouvelle zone", color: "bg-warning/20 text-warning" },
  { icon: Megaphone, label: "Campagne SMS", color: "bg-purple-500/20 text-purple-400" },
  { icon: FileText, label: "Générer rapport", color: "bg-blue-500/20 text-blue-400" },
];

export const QuickActions = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">Actions rapides</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
