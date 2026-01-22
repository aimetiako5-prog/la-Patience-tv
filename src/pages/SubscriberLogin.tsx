import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tv, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Step = "phone" | "set-pin" | "enter-pin";

export default function SubscriberLogin() {
  const navigate = useNavigate();
  const { checkPhone, setPin, login, isLoading: authLoading } = useSubscriberAuth();
  
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPinValue] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      toast.error("Veuillez entrer un numéro valide");
      return;
    }

    setIsLoading(true);
    const result = await checkPhone(phone);
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error || "Numéro non trouvé dans notre système");
      return;
    }

    setSubscriberName(result.subscriberName || "");
    if (result.hasPin) {
      setStep("enter-pin");
    } else {
      setStep("set-pin");
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      toast.error("Le code PIN doit être de 4 chiffres");
      return;
    }

    setIsLoading(true);
    let result;
    
    if (step === "set-pin") {
      result = await setPin(phone, pin);
    } else {
      result = await login(phone, pin);
    }

    setIsLoading(false);

    if (result.success) {
      toast.success("Connexion réussie !");
      navigate("/mon-compte");
    } else {
      toast.error(result.error || "Erreur de connexion");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
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
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Espace Staff
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step === "phone" ? (
                <Phone className="h-8 w-8 text-primary" />
              ) : (
                <Lock className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {step === "phone" && "Accès Abonné"}
                {step === "set-pin" && "Créer votre code PIN"}
                {step === "enter-pin" && "Connexion"}
              </CardTitle>
              <CardDescription className="mt-2">
                {step === "phone" && "Entrez votre numéro de téléphone pour accéder à votre espace"}
                {step === "set-pin" && (
                  <>
                    Bienvenue <span className="text-primary font-medium">{subscriberName}</span> ! Créez un code PIN à 4 chiffres pour sécuriser votre compte.
                  </>
                )}
                {step === "enter-pin" && (
                  <>
                    Bonjour <span className="text-primary font-medium">{subscriberName}</span>, entrez votre code PIN
                  </>
                )}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="6XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="text-lg tracking-wider"
                    autoComplete="tel"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || phone.length < 9}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Continuer
                </Button>
              </form>
            )}

            {(step === "set-pin" || step === "enter-pin") && (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Label className="text-center">
                    {step === "set-pin" ? "Choisissez votre code PIN" : "Entrez votre code PIN"}
                  </Label>
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={setPinValue}
                    onComplete={handlePinSubmit}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
                      <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
                      <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
                      <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep("phone");
                      setPinValue("");
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isLoading || pin.length !== 4}
                    onClick={handlePinSubmit}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {step === "set-pin" ? "Créer" : "Connexion"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 LA PATIENCE TV. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
