'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForms'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import type { FormField } from '@/types/form'
import { FieldType } from '@prisma/client'

export default function SubmitFormPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const formId = params.formId as string
  const { form, loading: formLoading } = useForm(formId)
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

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

  if (form.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">This form is not yet published.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const fields = (form.fields || []) as FormField[]
  const visibleFields = fields.filter(field => {
    if (field.isPrivate) return false
    
    // Simple display logic check (Release 1: single trigger)
    if (field.displayLogic) {
      const logic = field.displayLogic as any
      const triggerValue = formData[logic.triggerFieldId]
      
      if (logic.operator === 'equals') {
        return triggerValue === logic.triggerValue
      }
      // Add more operators as needed
    }
    
    return true
  })

  const handleChange = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value })
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: '' })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    visibleFields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (submit: boolean) => {
    if (submit && !validate()) {
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          data: formData,
          submit,
        }),
      })

      const data = await res.json()
      if (data.error) {
        alert(data.error.message)
      } else {
        if (submit) {
          router.push(`/submissions/${data.submission.id}`)
        } else {
          alert('Draft saved successfully')
        }
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || ''
    const error = errors[field.id]

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.PHONE:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === FieldType.EMAIL ? 'email' : field.type === FieldType.PHONE ? 'tel' : 'text'}
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder || undefined}
              required={field.required}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case FieldType.TEXTAREA:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder || undefined}
              required={field.required}
              rows={4}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case FieldType.NUMBER:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleChange(field.id, parseFloat(e.target.value) || '')}
              placeholder={field.placeholder || undefined}
              required={field.required}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case FieldType.SELECT:
        const options = (field.config as any)?.options || []
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleChange(field.id, val)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case FieldType.CHECKBOX:
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.id}
                checked={!!value}
                onChange={(e) => handleChange(field.id, e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <p className="text-sm text-muted-foreground">
              Field type {field.type} not yet implemented
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </CardHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true) }}>
            <CardContent className="space-y-6">
              {visibleFields.map(renderField)}
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                Save Draft
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

