"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { signAgreement } from "@/lib/actions/signing";
import {
  buildSigningSchema,
  buildDefaultValues,
  type SerializedField,
} from "@/lib/schemas/signing";

interface SigningFormProps {
  agreementId: number;
  fields: SerializedField[];
  referrer: string | null;
}

export function SigningForm({
  agreementId,
  fields,
  referrer,
}: SigningFormProps) {
  const [isPending, startTransition] = useTransition();
  const [signed, setSigned] = useState(false);

  const schema = buildSigningSchema(fields);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(fields),
  });

  function onSubmit(values: Record<string, unknown>) {
    startTransition(async () => {
      const result = await signAgreement({
        agreementId,
        fields: values as Record<string, string | boolean>,
      });

      if (result.success) {
        toast.success("Agreement signed successfully!");
        setSigned(true);

        if (referrer) {
          setTimeout(() => {
            window.location.href = referrer;
          }, 1500);
        }
      } else {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError(key as any, { message: messages[0] });
          }
        }
      }
    });
  }

  if (signed) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950">
        <p className="font-medium text-green-800 dark:text-green-200">
          Thank you for signing!
        </p>
        {referrer && (
          <p className="text-muted-foreground mt-2 text-sm">
            Redirecting you back to the pull request...
          </p>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Required Information</h3>
            {fields.map((field) => {
              const key = `field_${field.id}`;
              return (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={key}
                  render={({ field: formField }) => (
                    <FormItem>
                      {field.dataType !== "checkbox" && (
                        <FormLabel>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </FormLabel>
                      )}
                      <FormControl>
                        {renderFieldInput(field, formField)}
                      </FormControl>
                      {field.description && (
                        <FormDescription>{field.description}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Signing..." : "Sign Agreement"}
        </Button>
      </form>
    </Form>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderFieldInput(field: SerializedField, formField: any) {
  switch (field.dataType) {
    case "text":
      return (
        <Textarea
          {...formField}
          placeholder={field.description ?? ""}
          disabled={formField.disabled}
        />
      );
    case "email":
      return (
        <Input
          type="email"
          {...formField}
          placeholder={field.description ?? "your@email.com"}
        />
      );
    case "url":
      return (
        <Input
          type="url"
          {...formField}
          placeholder={field.description ?? "https://"}
        />
      );
    case "date":
      return <Input type="date" {...formField} />;
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={formField.value}
            onCheckedChange={formField.onChange}
          />
          <Label>
            {field.label}
            {field.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
        </div>
      );
    default:
      return <Input {...formField} placeholder={field.description ?? ""} />;
  }
}
