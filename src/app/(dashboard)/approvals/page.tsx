'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'

type Approval = {
  id: string
  status: string
  submission: {
    id: string
    form: {
      title: string
    }
    submitter: {
      email: string
    }
    data: any
  }
  stage: {
    name?: string
    order: number
  }
  createdAt: string
}

export default function ApprovalsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetch('/api/approvals?status=PENDING')
        .then(res => res.json())
        .then(data => {
          if (data.approvals) {
            setApprovals(data.approvals)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
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
        <h1 className="text-3xl font-bold mb-8">Pending Approvals</h1>

        {approvals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No pending approvals
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {approvals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <CardTitle>{approval.submission.form.title}</CardTitle>
                  <CardDescription>
                    Submitted by: {approval.submission.submitter.email}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Stage: {approval.stage.name || `Stage ${approval.stage.order}`}
                      </p>
                    </div>
                    <Link href={`/approvals/${approval.id}`}>
                      <Button>Review</Button>
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

