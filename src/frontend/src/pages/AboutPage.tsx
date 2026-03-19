import { ExternalLink } from "lucide-react";

export function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="relative container mx-auto max-w-3xl">
          <p className="text-sm uppercase tracking-widest text-primary mb-4 font-medium">
            Strange Waves
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
            The Journey Is About You
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            You are not a passive listener here. Strange Waves is a space built
            for the seeker — the one who feels music as a transmission, not just
            sound. Every track, every frequency, every moment of stillness
            between notes is an invitation to go deeper into who you are.
          </p>
        </div>
      </section>

      {/* Cosmic Divine Callout */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="relative rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none rounded-2xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-primary mb-3 font-semibold">
                Companion Portal
              </p>
              <h2 className="text-3xl font-bold mb-4">Cosmic Divine</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Strange Waves and Cosmic Divine are sister platforms. Where
                Strange Waves carries the sonic dimension of your journey,
                Cosmic Divine holds the astrological and spiritual map — your
                birth chart, cosmic cycles, and the deeper intelligence woven
                through your life. Together, they are a mirror.
              </p>
              <a
                href="https://cosmicdivine-zh7.caffeine.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Explore Cosmic Divine
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What Strange Waves Is */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold">What Strange Waves Is</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Strange Waves is a music streaming and NFT platform built on the
            Internet Computer — a decentralized, sovereign space where music
            lives on-chain, artists own their work outright, and listeners
            become collectors, collaborators, and participants in something
            real.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            There are no algorithms curating your taste here. There is no
            engagement economy built on distraction. What you find here found
            you — because you were looking.
          </p>
        </div>
      </section>

      {/* Ethos */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <blockquote className="border-l-4 border-primary pl-6 py-2">
            <p className="text-2xl font-medium italic leading-relaxed">
              "Strange Waves is where genre boundaries dissolve and authenticity
              amplifies. We celebrate music that refuses to be commodified,
              championing Art that creates from the spirit, not the algorithm."
            </p>
          </blockquote>
        </div>
      </section>

      {/* The Creator */}
      <section className="py-12 px-4 pb-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">The Creator</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Strange Waves is created and curated by Steve Strange — artist,
            explorer, and architect of sonic and spiritual experience. This
            platform is a living extension of that work: a place where music
            becomes a vehicle for genuine connection, self-discovery, and
            creative sovereignty.
          </p>
        </div>
      </section>
    </div>
  );
}
