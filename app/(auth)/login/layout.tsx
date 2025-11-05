export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 h-screen overflow-x-hidden p-3 space-y-3">
      {children}
    </main>
  );
}
