import { UnlockForm } from "./unlock-form";

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">This link is password protected</h1>
      <p className="max-w-sm text-muted-foreground">
        Enter the password to continue.
      </p>
      <UnlockForm slug={slug} />
    </main>
  );
}
