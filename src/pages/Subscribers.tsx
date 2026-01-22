import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSubscribers, useCreateSubscriber, useUpdateSubscriber, useToggleSignal } from "@/hooks/useSubscribers";
import { useZones } from "@/hooks/useZones";
import { useBouquets } from "@/hooks/useBouquets";
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
import { 
  Search, 
  Plus, 
  Filter, 
  Wifi, 
  WifiOff, 
  Phone, 
  MapPin, 
  Edit2,
  MoreVertical,
  Loader2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Actif",
  expired: "Expiré",
  suspended: "Suspendu",
};

const statusStyles: Record<SubscriptionStatus, string> = {
  active: "badge-active",
  expired: "badge-expired",
  suspended: "badge-pending",
};

const Subscribers = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    phone_secondary: "",
    email: "",
    address: "",
    zone_id: "",
    bouquet_id: "",
    line_number: "",
    notes: "",
  });

  const { data: subscribers, isLoading } = useSubscribers({
    zoneId: zoneFilter || undefined,
    status: statusFilter as SubscriptionStatus || undefined,
    search: search || undefined,
  });
  const { data: zones } = useZones();
  const { data: bouquets } = useBouquets();
  const createSubscriber = useCreateSubscriber();
  const updateSubscriber = useUpdateSubscriber();
  const toggleSignal = useToggleSignal();

  const openCreateDialog = () => {
    setEditingSubscriber(null);
    setFormData({
      name: "",
      phone: "",
      phone_secondary: "",
      email: "",
      address: "",
      zone_id: "",
      bouquet_id: "",
      line_number: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (subscriber: any) => {
    setEditingSubscriber(subscriber);
    setFormData({
      name: subscriber.name,
      phone: subscriber.phone,
      phone_secondary: subscriber.phone_secondary || "",
      email: subscriber.email || "",
      address: subscriber.address,
      zone_id: subscriber.zone_id || "",
      bouquet_id: subscriber.bouquet_id || "",
      line_number: subscriber.line_number || "",
      notes: subscriber.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      zone_id: formData.zone_id || null,
      bouquet_id: formData.bouquet_id || null,
      created_by: user?.id,
    };

    if (editingSubscriber) {
      await updateSubscriber.mutateAsync({ id: editingSubscriber.id, data });
    } else {
      await createSubscriber.mutateAsync(data);
    }
    
    setIsDialogOpen(false);
  };

  const handleToggleSignal = async (id: string, currentStatus: boolean) => {
    await toggleSignal.mutateAsync({ id, signalActive: !currentStatus });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM").format(amount) + " FCFA";
  };

  return (
    <DashboardLayout 
      title="Gestion des abonnés" 
      subtitle={`${subscribers?.length || 0} abonnés au total`}
      currentPath="/subscribers"
    >
      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full md:w-48 bg-secondary border-border">
              <SelectValue placeholder="Toutes les zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les zones</SelectItem>
              {zones?.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.city} - {zone.quartier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40 bg-secondary border-border">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="expired">Expirés</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel abonné
          </Button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : subscribers?.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun abonné trouvé</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un abonné
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-secondary/50">
                  <th>Abonné</th>
                  <th>Zone</th>
                  <th>Bouquet</th>
                  <th>Statut</th>
                  <th>Signal</th>
                  <th>Ligne</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers?.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{subscriber.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {subscriber.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {subscriber.zone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{subscriber.zone.city} - {subscriber.zone.quartier}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      {subscriber.bouquet ? (
                        <div>
                          <p className="font-medium">{subscriber.bouquet.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(subscriber.bouquet.price)}/mois
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      <span className={cn("badge-status", statusStyles[subscriber.subscription_status])}>
                        {statusLabels[subscriber.subscription_status]}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleSignal(subscriber.id, subscriber.signal_active)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          subscriber.signal_active 
                            ? "bg-success/20 text-success hover:bg-success/30"
                            : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                        )}
                      >
                        {subscriber.signal_active ? (
                          <>
                            <Wifi className="w-4 h-4" />
                            Actif
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-4 h-4" />
                            Coupé
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <span className="text-sm font-mono text-muted-foreground">
                        {subscriber.line_number || "—"}
                      </span>
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(subscriber)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="w-4 h-4 mr-2" />
                            Appeler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSubscriber ? "Modifier l'abonné" : "Nouvel abonné"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Mbarga"
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone principal *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_secondary">Téléphone secondaire</Label>
                <Input
                  id="phone_secondary"
                  value={formData.phone_secondary}
                  onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
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
                <Label htmlFor="bouquet">Bouquet</Label>
                <Select 
                  value={formData.bouquet_id} 
                  onValueChange={(value) => setFormData({ ...formData, bouquet_id: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Sélectionner un bouquet" />
                  </SelectTrigger>
                  <SelectContent>
                    {bouquets?.map((bouquet) => (
                      <SelectItem key={bouquet.id} value={bouquet.id}>
                        {bouquet.name} - {formatCurrency(bouquet.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="line_number">Numéro de ligne</Label>
                <Input
                  id="line_number"
                  value={formData.line_number}
                  onChange={(e) => setFormData({ ...formData, line_number: e.target.value })}
                  placeholder="L-001-A"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Quartier, rue, immeuble..."
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplémentaires..."
                className="bg-secondary border-border"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={createSubscriber.isPending || updateSubscriber.isPending}
              >
                {(createSubscriber.isPending || updateSubscriber.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingSubscriber ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Subscribers;
