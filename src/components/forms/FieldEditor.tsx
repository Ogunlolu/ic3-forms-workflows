'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { FormField } from '@/types/form'

interface FieldEditorProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}

export function FieldEditor({ field, onUpdate }: FieldEditorProps) {
  const [label, setLabel] = useState(field.label)
  const [placeholder, setPlaceholder] = useState(field.placeholder || '')
  const [required, setRequired] = useState(field.required)
  const [isPrivate, setIsPrivate] = useState(field.isPrivate)

  useEffect(() => {
    setLabel(field.label)
    setPlaceholder(field.placeholder || '')
    setRequired(field.required)
    setIsPrivate(field.isPrivate)
  }, [field])

  const handleSave = () => {
    onUpdate({
      label,
      placeholder: placeholder || undefined,
      required,
      isPrivate,
    })
  }

  const needsOptions = field.type === 'SELECT' || field.type === 'MULTISELECT' || field.type === 'RADIO'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Field</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Label *</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="required" className="cursor-pointer">
            Required field
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPrivate"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isPrivate" className="cursor-pointer">
            Private field (only visible to admins)
          </Label>
        </div>

        {needsOptions && (
          <div className="space-y-2">
            <Label>Options</Label>
            <p className="text-sm text-muted-foreground">
              Configure options in the form submission interface
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

