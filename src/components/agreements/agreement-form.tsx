"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RepoSelector, type RepoSelection } from "./repo-selector";
import { MarkdownEditor } from "./markdown-editor";
import { FieldBuilder } from "./field-builder";
import type { Installation } from "@/lib/actions/agreement";
import { createAgreement, updateAgreement } from "@/lib/actions/agreement";
import { templates } from "@/lib/templates";
import type {
  UpdateAgreementInput,
  AgreementFieldInput,
} from "@/lib/schemas/agreement";

interface CreateFormProps {
  mode: "create";
  installations: Installation[];
}

interface EditFormProps {
  mode: "edit";
  agreementId: number;
  initialText: string;
  initialFields: AgreementFieldInput[];
}

type AgreementFormProps = CreateFormProps | EditFormProps;

export function AgreementForm(props: AgreementFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  if (props.mode === "create") {
    return <CreateForm {...props} isPending={isPending} startTransition={startTransition} serverError={serverError} setServerError={setServerError} />;
  }
  return <EditForm {...props} isPending={isPending} startTransition={startTransition} serverError={serverError} setServerError={setServerError} />;
}

interface SharedTransitionProps {
  isPending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
  serverError: string | null;
  setServerError: (err: string | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CreateFormValues = Record<string, any>;

function CreateForm({
  installations,
  isPending,
  startTransition,
  serverError,
  setServerError,
}: CreateFormProps & SharedTransitionProps) {
  const form = useForm<CreateFormValues>({
    defaultValues: {
      scope: "repo",
      githubRepoId: "",
      githubOrgId: "",
      ownerName: "",
      repoName: "",
      installationId: "",
      text: "",
      fields: [],
    },
  });

  function onSubmit(values: CreateFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await createAgreement(values);
      // If we get here, redirect didn't happen — must be an error
      if (result && !result.success) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError(key as any, { message: messages[0] });
          }
        }
        toast.error(result.error);
      }
    });
  }

  function handleSelect(selection: RepoSelection) {
    if (selection.scope === "org") {
      form.setValue("scope", "org");
      form.setValue("githubOrgId", selection.githubOrgId);
      form.setValue("githubRepoId", "");
      form.setValue("ownerName", selection.ownerName);
      form.setValue("repoName", "");
      form.setValue("installationId", selection.installationId);
    } else {
      form.setValue("scope", "repo");
      form.setValue("githubRepoId", selection.githubRepoId);
      form.setValue("githubOrgId", "");
      form.setValue("ownerName", selection.ownerName);
      form.setValue("repoName", selection.repoName);
      form.setValue("installationId", selection.installationId);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {serverError}
          </div>
        )}

        <div className="space-y-2">
          <Label>Repository or Organization</Label>
          <RepoSelector
            installations={installations}
            disabled={isPending}
            onSelect={handleSelect}
          />
        </div>

        <div className="space-y-2">
          <Label>Template</Label>
          <Select
            onValueChange={(val) => {
              const template = templates[parseInt(val, 10)];
              if (template) {
                form.setValue("text", template.text);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t, i) => (
                <SelectItem key={i} value={String(i)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agreement Text</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FieldBuilder form={form} disabled={isPending} />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Agreement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditForm({
  agreementId,
  initialText,
  initialFields,
  isPending,
  startTransition,
  serverError,
  setServerError,
}: EditFormProps & SharedTransitionProps) {
  const form = useForm<UpdateAgreementInput>({
    defaultValues: {
      id: agreementId,
      text: initialText,
      changelog: "",
      fields: initialFields,
    },
  });

  function onSubmit(values: UpdateAgreementInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateAgreement(values);
      if (result && !result.success) {
        setServerError(result.error);
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setError(key as any, { message: messages[0] });
          }
        }
        toast.error(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {serverError}
          </div>
        )}

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agreement Text</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="changelog"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Changelog (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Describe what changed in this version"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FieldBuilder form={form} disabled={isPending} />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
