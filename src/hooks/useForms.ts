'use client'

import { useState, useEffect } from 'react'
import type { FormWithFields } from '@/types/form'

export function useForms(filters?: { status?: string }) {
  const [forms, setForms] = useState<FormWithFields[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters?.status) {
      params.append('status', filters.status)
    }

    fetch(`/api/forms?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error.message)
        } else {
          setForms(data.forms || [])
        }
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [filters?.status])

  return { forms, loading, error }
}

export function useForm(id: string) {
  const [form, setForm] = useState<FormWithFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    fetch(`/api/forms/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error.message)
        } else {
          setForm(data.form)
        }
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  return { form, loading, error }
}

