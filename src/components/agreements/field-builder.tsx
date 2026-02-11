"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  fieldDataTypes,
  type CreateAgreementInput,
  type UpdateAgreementInput,
} from "@/lib/schemas/agreement";

type FormValues = CreateAgreementInput | UpdateAgreementInput;

interface FieldBuilderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export function FieldBuilder({ form, disabled }: FieldBuilderProps) {
  const { fields, append, remove } = useFieldArray<FormValues>({
    control: form.control,
    name: "fields",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Custom Fields</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({
              label: "",
              dataType: "text" as const,
              required: true,
              description: "",
              sortOrder: fields.length,
              enabled: true,
            })
          }
        >
          <Plus className="size-4" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No custom fields. Signers will only need to accept the agreement text.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-wrap items-start gap-3 rounded-md border p-3"
          >
            <div className="min-w-[180px] flex-1">
              <Label className="mb-1 text-xs">Label</Label>
              <Input
                {...form.register(`fields.${index}.label`)}
                placeholder="Field label"
                disabled={disabled}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(form.formState.errors.fields as any)?.[index]?.label && (
                <p className="text-destructive mt-1 text-xs">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(form.formState.errors.fields as any)[index].label.message}
                </p>
              )}
            </div>

            <div className="w-[140px]">
              <Label className="mb-1 text-xs">Type</Label>
              <Select
                value={form.watch(`fields.${index}.dataType`)}
                onValueChange={(val) =>
                  form.setValue(`fields.${index}.dataType`, val)
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldDataTypes.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {dt.charAt(0).toUpperCase() + dt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px] flex-1">
              <Label className="mb-1 text-xs">Description</Label>
              <Input
                {...form.register(`fields.${index}.description`)}
                placeholder="Optional description"
                disabled={disabled}
              />
            </div>

            <div className="flex flex-col items-center gap-1 pt-5">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.watch(`fields.${index}.required`)}
                  onCheckedChange={(checked) =>
                    form.setValue(`fields.${index}.required`, checked === true)
                  }
                  disabled={disabled}
                />
                <Label className="text-xs">Required</Label>
              </div>
            </div>

            <div className="pt-5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
