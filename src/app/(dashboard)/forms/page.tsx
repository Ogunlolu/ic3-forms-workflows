'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useForms } from '@/hooks/useForms'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'

export default function FormsPage() {
  const { user, loading: authLoading } = useAuth()
  const { forms, loading: formsLoading } = useForms()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Forms</h1>
          <Link href="/forms/new">
            <Button>Create New Form</Button>
          </Link>
        </div>

        {formsLoading ? (
          <div>Loading...</div>
        ) : forms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No forms yet. Create your first form to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <CardTitle>{form.title}</CardTitle>
                  <CardDescription>{form.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Status: {form.status}
                    </span>
                    <Link href={`/forms/${form.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

