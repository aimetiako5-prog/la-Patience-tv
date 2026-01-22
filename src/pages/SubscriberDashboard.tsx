import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { useSubscriberPayments, useSubscriberTickets, useSubscriberBouquets } from "@/hooks/useSubscriberPortal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Tv, LogOut, User, CreditCard, TicketIcon, Loader2, 
  Calendar, Phone, MapPin, Signal, AlertCircle, CheckCircle,
  Clock, Plus, Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function SubscriberDashboard() {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated, logout, refreshProfile } = useSubscriberAuth();
  const { payments, isLoading: paymentsLoading, fetchPayments, calculateAmount, initiatePayment } = useSubscriberPayments();
  const { tickets, isLoading: ticketsLoading, fetchTickets, createTicket } = useSubscriberTickets();
  const { bouquets, fetchBouquets } = useSubscriberBouquets();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("mtn_momo");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentMonths, setPaymentMonths] = useState("1");
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/abonne");
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayments();
      fetchTickets();
      fetchBouquets();
    }
  }, [isAuthenticated, fetchPayments, fetchTickets, fetchBouquets]);

  useEffect(() => {
    if (profile?.phone) {
      setPaymentPhone(profile.phone);
    }
  }, [profile]);

  useEffect(() => {
    const calculate = async () => {
      if (paymentMonths) {
        const result = await calculateAmount(parseInt(paymentMonths));
        if (result.success) {
          setCalculatedAmount(result.amount);
        }
      }
    };
    calculate();
  }, [paymentMonths, calculateAmount]);

  const handleLogout = async () => {
    await logout();
    navigate("/abonne");
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    const result = await initiatePayment(paymentMethod, paymentPhone, parseInt(paymentMonths));
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Paiement initié");
      setPaymentDialogOpen(false);
      fetchPayments();
    } else {
      toast.error(result.error || "Erreur de paiement");
    }
  };

  const handleCreateTicket = async () => {
    if (ticketSubject.length < 5 || ticketDescription.length < 10) {
      toast.error("Veuillez remplir tous les champs correctement");
      return;
    }

    setIsSubmitting(true);
    const result = await createTicket(ticketSubject, ticketDescription, ticketPriority);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Ticket créé avec succès");
      setTicketDialogOpen(false);
      setTicketSubject("");
      setTicketDescription("");
    } else {
      toast.error(result.error || "Erreur de création");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Actif", variant: "default" },
      expired: { label: "Expiré", variant: "destructive" },
      suspended: { label: "Suspendu", variant: "secondary" },
      pending: { label: "En attente", variant: "outline" },
      open: { label: "Ouvert", variant: "outline" },
      in_progress: { label: "En cours", variant: "default" },
      resolved: { label: "Résolu", variant: "secondary" },
      closed: { label: "Fermé", variant: "secondary" },
      completed: { label: "Complété", variant: "default" },
      failed: { label: "Échoué", variant: "destructive" },
      processing: { label: "En traitement", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const isExpiringSoon = profile.subscription_expires_at && 
    new Date(profile.subscription_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tv className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">LA PATIENCE TV</h1>
              <p className="text-xs text-muted-foreground">Espace Abonné</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.phone}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Alert if expiring soon */}
        {isExpiringSoon && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-6 w-6 text-warning shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-warning">Votre abonnement expire bientôt</p>
                <p className="text-sm text-muted-foreground">
                  {profile.subscription_expires_at && 
                    `Expire ${formatDistanceToNow(new Date(profile.subscription_expires_at), { addSuffix: true, locale: fr })}`
                  }
                </p>
              </div>
              <Button onClick={() => setPaymentDialogOpen(true)}>
                Renouveler
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{profile.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {profile.signal_active ? (
                  <Badge className="bg-success text-success-foreground">
                    <Signal className="h-3 w-3 mr-1" /> Signal Actif
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <Signal className="h-3 w-3 mr-1" /> Signal Inactif
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Subscription Status */}
              <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  {getStatusBadge(profile.subscription_status)}
                </div>
                {profile.subscription_expires_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Expire le {format(new Date(profile.subscription_expires_at), "dd/MM/yyyy", { locale: fr })}</span>
                  </div>
                )}
              </div>

              {/* Bouquet */}
              <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                <span className="text-sm text-muted-foreground">Bouquet</span>
                {profile.bouquet ? (
                  <div>
                    <p className="font-semibold text-primary">{profile.bouquet.name}</p>
                    <p className="text-sm">{profile.bouquet.channels_count} chaînes • {profile.bouquet.price.toLocaleString()} FCFA/mois</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun bouquet</p>
                )}
              </div>

              {/* Zone */}
              <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                <span className="text-sm text-muted-foreground">Zone</span>
                {profile.zone ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{profile.zone.name}</p>
                      <p className="text-sm text-muted-foreground">{profile.zone.quartier}, {profile.zone.city}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Non assigné</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Paiements
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <TicketIcon className="h-4 w-4" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historique des paiements</h2>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Payer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Effectuer un paiement</DialogTitle>
                    <DialogDescription>
                      Renouvelez votre abonnement via Mobile Money
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Méthode de paiement</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                        <div>
                          <RadioGroupItem value="mtn_momo" id="mtn" className="peer sr-only" />
                          <Label
                            htmlFor="mtn"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Smartphone className="mb-2 h-6 w-6" />
                            <span className="font-semibold">MTN MoMo</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="orange_money" id="orange" className="peer sr-only" />
                          <Label
                            htmlFor="orange"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Smartphone className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Orange Money</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pay-phone">Numéro de téléphone</Label>
                      <Input
                        id="pay-phone"
                        type="tel"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="6XXXXXXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="months">Nombre de mois</Label>
                      <Select value={paymentMonths} onValueChange={setPaymentMonths}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 mois</SelectItem>
                          <SelectItem value="3">3 mois</SelectItem>
                          <SelectItem value="6">6 mois</SelectItem>
                          <SelectItem value="12">12 mois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {calculatedAmount !== null && (
                      <div className="p-4 rounded-lg bg-primary/10 text-center">
                        <p className="text-sm text-muted-foreground">Montant total</p>
                        <p className="text-2xl font-bold text-primary">{calculatedAmount.toLocaleString()} FCFA</p>
                      </div>
                    )}

                    <Button className="w-full" onClick={handlePayment} disabled={isSubmitting || !paymentPhone}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Confirmer le paiement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun paiement enregistré</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="glass-card">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.status === "completed" ? "bg-success/20" : "bg-muted"
                        }`}>
                          {payment.status === "completed" ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{payment.amount.toLocaleString()} FCFA</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.payment_date), "dd MMM yyyy", { locale: fr })} • {payment.months_paid} mois
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(payment.status)}
                        {payment.receipt_number && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.receipt_number}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes tickets de support</h2>
              <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un ticket</DialogTitle>
                    <DialogDescription>
                      Décrivez votre problème et notre équipe vous contactera
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet</Label>
                      <Input
                        id="subject"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value.slice(0, 200))}
                        placeholder="Ex: Pas de signal sur la chaîne X"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value.slice(0, 2000))}
                        placeholder="Décrivez votre problème en détail..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <Select value={ticketPriority} onValueChange={setTicketPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full" onClick={handleCreateTicket} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Envoyer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <TicketIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun ticket de support</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="glass-card">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Créé {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: fr })}</span>
                        {ticket.resolved_at && (
                          <span className="text-success">Résolu {formatDistanceToNow(new Date(ticket.resolved_at), { addSuffix: true, locale: fr })}</span>
                        )}
                      </div>
                      {ticket.resolution_notes && (
                        <div className="mt-3 p-3 rounded-lg bg-success/10 text-sm">
                          <p className="font-medium text-success mb-1">Résolution</p>
                          <p>{ticket.resolution_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 LA PATIENCE TV. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
