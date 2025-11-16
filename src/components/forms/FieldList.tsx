'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { FormField } from '@/types/form'

interface FieldListProps {
  fields: FormField[]
  selectedField: FormField | null
  onSelect: (field: FormField) => void
  onDelete: (fieldId: string) => void
}

export function FieldList({ fields, selectedField, onSelect, onDelete }: FieldListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Fields ({fields.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No fields yet. Add a field to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {fields
              .sort((a, b) => a.order - b.order)
              .map((field) => (
                <div
                  key={field.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedField?.id === field.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelect(field)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <span className="text-xs text-destructive">*</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.type.replace('_', ' ')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(field.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

