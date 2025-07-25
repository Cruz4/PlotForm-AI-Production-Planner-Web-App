import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center text-foreground">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">Could not find the requested resource.</p>
      <Link href="/" className="text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-3 rounded-md text-lg font-medium transition-colors">
        Return Home
      </Link>
    </main>
  )
}
