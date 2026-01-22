import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/");
      } else {
        await signUp(email, password, fullName);
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-8 glow-effect">
            <Tv className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground text-center mb-4">
            LA PATIENCE TV
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-md">
            Plateforme de gestion pour câblo-distributeur
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-primary">3,247</p>
              <p className="text-sm text-muted-foreground">Abonnés</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-accent">18</p>
              <p className="text-sm text-muted-foreground">Zones</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-success">87%</p>
              <p className="text-sm text-muted-foreground">Renouvellement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Tv className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">LA PATIENCE</h1>
              <p className="text-xs text-muted-foreground">TV Management</p>
            </div>
          </div>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {isLogin ? "Connexion" : "Créer un compte"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isLogin
                  ? "Accédez à votre espace de gestion"
                  : "Rejoignez l'équipe LA PATIENCE TV"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jean Mbarga"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : isLogin ? (
                  "Se connecter"
                ) : (
                  "Créer le compte"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:text-primary/80"
              >
                {isLogin
                  ? "Pas encore de compte ? Inscrivez-vous"
                  : "Déjà un compte ? Connectez-vous"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Contact: +237 6 51 98 74 68
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
