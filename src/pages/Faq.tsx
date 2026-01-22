import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFaqs, useFaqCategories } from "@/hooks/useFaqs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const Faq = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  const { data: faqs, isLoading } = useFaqs(selectedCategory);
  const { data: categories } = useFaqCategories();

  const filteredFaqs = faqs?.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="FAQ & Aide" 
      subtitle="Questions fréquentes et guides"
      currentPath="/faq"
    >
      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans la FAQ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <Tabs 
          value={selectedCategory || "all"} 
          onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
          className="mb-6"
        >
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* FAQ List */}
      <div className="glass-card p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredFaqs?.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune FAQ trouvée</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contactez le support pour toute question: +237 6 51 98 74 68
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs?.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="border border-border rounded-lg px-4 bg-secondary/30"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-start gap-3 text-left">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="font-medium">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Contact */}
      <div className="glass-card p-6 mt-6 text-center">
        <h3 className="font-display font-semibold text-lg mb-2">
          Vous ne trouvez pas la réponse ?
        </h3>
        <p className="text-muted-foreground mb-4">
          Notre équipe support est disponible pour vous aider
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <a href="tel:+237651987468">
              📞 +237 6 51 98 74 68
            </a>
          </Button>
          <Button asChild className="bg-success hover:bg-success/90">
            <a 
              href="https://whatsapp.com/channel/0029VbCbYXg35fM18DKD7J2R" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              💬 WhatsApp LA PATIENCE TV
            </a>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Faq;
