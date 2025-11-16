'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForms'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { FieldEditor } from '@/components/forms/FieldEditor'
import { FieldList } from '@/components/forms/FieldList'
import type { FormField } from '@/types/form'
import { FieldType } from '@prisma/client'

export default function FormBuilderPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const formId = params.id as string
  const { form, loading: formLoading } = useForm(formId)
  const router = useRouter()
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [fields, setFields] = useState<FormField[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (form && form.fields) {
      setFields(form.fields as FormField[])
    }
  }, [form])

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

  const handleAddField = async (type: FieldType) => {
    try {
      const res = await fetch(`/api/forms/${formId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          label: `New ${type.toLowerCase()} field`,
          required: false,
        }),
      })

      const data = await res.json()
      if (data.field) {
        setFields([...fields, data.field])
        setSelectedField(data.field)
      }
    } catch (error) {
      console.error('Failed to add field:', error)
    }
  }

  const handleUpdateField = async (fieldId: string, updates: Partial<FormField>) => {
    try {
      const res = await fetch(`/api/forms/${formId}/fields/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await res.json()
      if (data.field) {
        setFields(fields.map(f => f.id === fieldId ? data.field : f))
        setSelectedField(data.field)
      }
    } catch (error) {
      console.error('Failed to update field:', error)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    try {
      await fetch(`/api/forms/${formId}/fields/${fieldId}`, {
        method: 'DELETE',
      })

      setFields(fields.filter(f => f.id !== fieldId))
      if (selectedField?.id === fieldId) {
        setSelectedField(null)
      }
    } catch (error) {
      console.error('Failed to delete field:', error)
    }
  }

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: 'POST',
      })

      const data = await res.json()
      if (data.form) {
        router.push(`/forms/${formId}`)
      }
    } catch (error) {
      console.error('Failed to publish form:', error)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Form Builder</h1>
            <p className="text-muted-foreground">{form.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/forms/${formId}`)}>
              Back
            </Button>
            {form.status === 'DRAFT' && (
              <Button onClick={handlePublish}>Publish Form</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Field Types Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add Field</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.values(FieldType).slice(0, 8).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddField(type)}
                  >
                    {type.replace('_', ' ')}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Fields List */}
          <div className="lg:col-span-1">
            <FieldList
              fields={fields}
              selectedField={selectedField}
              onSelect={setSelectedField}
              onDelete={handleDeleteField}
            />
          </div>

          {/* Field Editor */}
          <div className="lg:col-span-1">
            {selectedField ? (
              <FieldEditor
                field={selectedField}
                onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Select a field to edit
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

