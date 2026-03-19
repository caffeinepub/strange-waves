import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Globe, Music2, Twitter } from "lucide-react";
import { motion } from "motion/react";

interface SocialLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  featured?: boolean;
  label: string;
}

const socialLinks: SocialLink[] = [
  {
    id: "universal-profile",
    title: "Universal Profile",
    description:
      "Connect across the decentralized web — explore Steve Strange's full digital identity, creative credentials, and cross-chain presence.",
    url: "https://profile.link/stevestrange@9B51",
    icon: <Globe className="h-6 w-6" />,
    featured: true,
    label: "Visit Profile →",
  },
  {
    id: "x-twitter",
    title: "X (Twitter)",
    description:
      "Follow for updates, thoughts, and dispatches from the edge of sound and spirit.",
    url: "https://x.com/Scubadadoo",
    icon: <Twitter className="h-6 w-6" />,
    label: "Follow on X →",
  },
  {
    id: "audius",
    title: "Audius",
    description:
      "Stream the full catalogue on the decentralized music platform — no middlemen, pure signal.",
    url: "https://audius.co/stevestrange",
    icon: <Music2 className="h-6 w-6" />,
    label: "Listen on Audius →",
  },
];

export function SocialsPage() {
  return (
    <div
      data-ocid="socials.page"
      className="container mx-auto px-4 py-12 max-w-4xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 space-y-3"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Socials
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Connect with Steve Strange across the decentralized web. Every link is
          a doorway — choose where your journey takes you.
        </p>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialLinks.map((link, index) => (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.1 }}
            className={link.featured ? "sm:col-span-2 lg:col-span-3" : ""}
          >
            {link.featured ? (
              // Featured card — full-width with gradient border glow
              <div
                className="relative rounded-xl p-[1.5px]"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.7 0.18 270), oklch(0.65 0.22 200), oklch(0.6 0.20 300))",
                }}
              >
                <Card className="rounded-[10px] bg-card border-0 shadow-2xl overflow-hidden">
                  {/* Glow backdrop */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 0%, oklch(0.7 0.18 270), transparent 70%)",
                    }}
                  />
                  <CardHeader className="relative pb-2 sm:flex-row sm:items-start sm:gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/20 mb-3 sm:mb-0">
                      {link.icon}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold">
                        {link.title}
                      </CardTitle>
                      <CardDescription className="text-base text-muted-foreground">
                        {link.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="relative pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      data-ocid="socials.universal_profile.button"
                      asChild
                      className="bg-primary hover:bg-primary/90 font-semibold"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        {link.label}
                      </a>
                    </Button>
                    <span className="font-mono text-xs text-muted-foreground break-all">
                      {link.url}
                    </span>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Regular card
              <Card className="h-full border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground mb-3">
                    {link.icon}
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {link.title}
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    data-ocid={`socials.${link.id}.button`}
                    variant="outline"
                    asChild
                    className="w-full"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {link.label}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
