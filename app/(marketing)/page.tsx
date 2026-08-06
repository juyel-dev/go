import { QuickShortenForm } from "@/components/links/quick-shorten-form";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Short links you can trust
        </h1>
        <p className="max-w-md text-muted-foreground">
          Shorten a link in seconds. No account needed to start -- sign up
          when you want analytics, custom slugs, and links that never expire.
        </p>
      </div>
      <QuickShortenForm />
    </main>
  );
}
