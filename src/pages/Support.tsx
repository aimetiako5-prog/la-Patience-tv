import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTickets, useCreateTicket, useUpdateTicket } from "@/hooks/useTickets";
import { useSubscribers } from "@/hooks/useSubscribers";
import { useZones } from "@/hooks/useZones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  MessageSquare,
  Phone,
  User,
  Loader2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

const statusConfig: Record<TicketStatus, { label: string; icon: typeof AlertCircle; color: string }> = {
  open: { label: "Ouvert", icon: AlertCircle, color: "text-warning" },
  in_progress: { label: "En cours", icon: Clock, color: "text-accent" },
  resolved: { label: "Résolu", icon: CheckCircle2, color: "text-success" },
  closed: { label: "Fermé", icon: XCircle, color: "text-muted-foreground" },
};

const priorityConfig: Record<TicketPriority, { label: string; style: string }> = {
  low: { label: "Faible", style: "bg-accent/20 text-accent" },
  medium: { label: "Moyen", style: "bg-warning/20 text-warning" },
  high: { label: "Élevé", style: "bg-destructive/20 text-destructive" },
  urgent: { label: "Urgent", style: "bg-destructive text-destructive-foreground" },
};

const Support = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    subscriber_id: "",
    zone_id: "",
    subject: "",
    description: "",
    priority: "medium" as TicketPriority,
  });

  const { data: tickets, isLoading } = useTickets({ status: statusFilter });
  const { data: subscribers } = useSubscribers();
  const { data: zones } = useZones();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const openCreateDialog = () => {
    setFormData({
      subscriber_id: "",
      zone_id: "",
      subject: "",
      description: "",
      priority: "medium",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTicket.mutateAsync({
      ...formData,
      subscriber_id: formData.subscriber_id || null,
      zone_id: formData.zone_id || null,
      created_by: user?.id,
      ticket_number: "", // Will be auto-generated
    });
    
    setIsDialogOpen(false);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await updateTicket.mutateAsync({
      id: ticketId,
      data: {
        status: newStatus,
        resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
      },
    });
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  const openTickets = tickets?.filter(t => t.status === "open") || [];
  const inProgressTickets = tickets?.filter(t => t.status === "in_progress") || [];
  const resolvedTickets = tickets?.filter(t => ["resolved", "closed"].includes(t.status)) || [];

  return (
    <DashboardLayout 
      title="Support client" 
      subtitle={`${tickets?.length || 0} tickets au total`}
      currentPath="/support"
    >
      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ticket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <Select 
            value={statusFilter || "all"} 
            onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v as TicketStatus)}
          >
            <SelectTrigger className="w-full md:w-40 bg-secondary border-border">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="open">Ouverts</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolus</SelectItem>
              <SelectItem value="closed">Fermés</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      {/* Tickets Kanban View */}
      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="kanban">Vue Kanban</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Open Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-warning/30">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <h3 className="font-display font-semibold">Ouverts</h3>
                  <span className="ml-auto bg-warning/20 text-warning text-xs font-medium px-2 py-0.5 rounded-full">
                    {openTickets.length}
                  </span>
                </div>
                {openTickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onStatusChange={handleStatusChange}
                    formatDate={formatDate}
                  />
                ))}
                {openTickets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun ticket ouvert
                  </p>
                )}
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-accent/30">
                  <Clock className="w-5 h-5 text-accent" />
                  <h3 className="font-display font-semibold">En cours</h3>
                  <span className="ml-auto bg-accent/20 text-accent text-xs font-medium px-2 py-0.5 rounded-full">
                    {inProgressTickets.length}
                  </span>
                </div>
                {inProgressTickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onStatusChange={handleStatusChange}
                    formatDate={formatDate}
                  />
                ))}
                {inProgressTickets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun ticket en cours
                  </p>
                )}
              </div>

              {/* Resolved Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-success/30">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="font-display font-semibold">Résolus</h3>
                  <span className="ml-auto bg-success/20 text-success text-xs font-medium px-2 py-0.5 rounded-full">
                    {resolvedTickets.length}
                  </span>
                </div>
                {resolvedTickets.slice(0, 5).map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onStatusChange={handleStatusChange}
                    formatDate={formatDate}
                  />
                ))}
                {resolvedTickets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun ticket résolu
                  </p>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="glass-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tickets?.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun ticket trouvé</p>
                <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un ticket
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th>Ticket</th>
                      <th>Abonné</th>
                      <th>Priorité</th>
                      <th>Statut</th>
                      <th>Créé</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets?.map((ticket) => {
                      const status = statusConfig[ticket.status];
                      const priority = priorityConfig[ticket.priority];
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={ticket.id}>
                          <td>
                            <div>
                              <p className="font-medium text-foreground">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground">{ticket.ticket_number}</p>
                            </div>
                          </td>
                          <td>
                            {ticket.subscriber ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>{ticket.subscriber.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td>
                            <span className={cn("badge-status", priority.style)}>
                              {priority.label}
                            </span>
                          </td>
                          <td>
                            <div className={cn("flex items-center gap-2", status.color)}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{status.label}</span>
                            </div>
                          </td>
                          <td className="text-sm text-muted-foreground">
                            {formatDate(ticket.created_at)}
                          </td>
                          <td>
                            <Select
                              value={ticket.status}
                              onValueChange={(v) => handleStatusChange(ticket.id, v as TicketStatus)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Ouvert</SelectItem>
                                <SelectItem value="in_progress">En cours</SelectItem>
                                <SelectItem value="resolved">Résolu</SelectItem>
                                <SelectItem value="closed">Fermé</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Nouveau ticket</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Décrivez brièvement le problème"
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriber">Abonné concerné</Label>
                <Select 
                  value={formData.subscriber_id} 
                  onValueChange={(value) => setFormData({ ...formData, subscriber_id: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscribers?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorité *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zone concernée</Label>
              <Select 
                value={formData.zone_id} 
                onValueChange={(value) => setFormData({ ...formData, zone_id: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones?.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.city} - {zone.quartier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le problème en détail..."
                className="bg-secondary border-border"
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={createTicket.isPending}
              >
                {createTicket.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Créer le ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Ticket Card Component
const TicketCard = ({ 
  ticket, 
  onStatusChange,
  formatDate 
}: { 
  ticket: any; 
  onStatusChange: (id: string, status: TicketStatus) => void;
  formatDate: (date: string) => string;
}) => {
  const priority = priorityConfig[ticket.priority as TicketPriority];

  return (
    <div className="glass-card p-4 hover:border-primary/30 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
        <span className={cn("badge-status text-xs", priority.style)}>
          {priority.label}
        </span>
      </div>
      
      <h4 className="font-medium text-foreground mb-2 line-clamp-2">{ticket.subject}</h4>
      
      {ticket.subscriber && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <User className="w-3 h-3" />
          <span>{ticket.subscriber.name}</span>
        </div>
      )}

      {ticket.subscriber?.phone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Phone className="w-3 h-3" />
          <span>{ticket.subscriber.phone}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {formatDate(ticket.created_at)}
        </span>
        
        <Select
          value={ticket.status}
          onValueChange={(v) => onStatusChange(ticket.id, v as TicketStatus)}
        >
          <SelectTrigger className="h-7 w-24 text-xs border-0 bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Support;
