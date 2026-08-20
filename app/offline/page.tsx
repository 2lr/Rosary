export const metadata = { title: 'Hors ligne · Offline' };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl">Hors ligne</h1>
      <p className="mt-3 text-sm text-muted">
        Vous êtes hors réseau. Le rosaire déjà commencé reste enregistré sur cet appareil et sera
        synchronisé au retour de la connexion.
      </p>
      <hr className="my-7 w-16 border-white/15" />
      <h2 className="font-display text-2xl">Offline</h2>
      <p className="mt-3 text-sm text-muted">
        You are off the network. A rosary already under way is kept on this device and will sync
        when the connection returns.
      </p>
    </main>
  );
}
