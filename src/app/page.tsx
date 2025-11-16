import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">IC3.0 Online Forms & Workflows</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Build forms, automate workflows, and manage approvals with ease
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Login</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
