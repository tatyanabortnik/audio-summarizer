'use client';

import { useState } from 'react';
import { z } from 'zod';

export function useFormValidation<T>(schema: z.ZodType<T>) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function validate(e: React.SubmitEvent<HTMLFormElement>): boolean {
    const result = schema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget))
    );
    if (!result.success) {
      setFieldErrors(
        z.flattenError(result.error).fieldErrors as Record<string, string[]>
      );
      return false;
    }
    setFieldErrors({});
    return true;
  }

  function fieldError(
    field: string,
    serverErrors?: Record<string, string[]>
  ): string | undefined {
    return (fieldErrors[field] ?? serverErrors?.[field])?.[0];
  }

  return { validate, fieldError };
}
