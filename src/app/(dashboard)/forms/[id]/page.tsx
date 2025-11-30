'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForms'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'

export default function FormDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const formId = params.id as string
  const { form, loading: formLoading } = useForm(formId)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || formLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user || !form) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/forms/${form.id}/builder`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Link href={`/forms/${form.id}/submissions`}>
              <Button variant="outline">Submissions</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Form Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium">{form.status}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Fields:</span>
                <span className="ml-2 font-medium">{form._count?.fields || 0}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Submissions:</span>
                <span className="ml-2 font-medium">{form._count?.submissions || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.status === 'DRAFT' && (
                <Link href={`/forms/${form.id}/builder`}>
                  <Button className="w-full" variant="outline">
                    Continue Building
                  </Button>
                </Link>
              )}
              {form.status === 'PUBLISHED' && (
                <Link href={`/submit/${form.id}`}>
                  <Button className="w-full">Submit Form</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

