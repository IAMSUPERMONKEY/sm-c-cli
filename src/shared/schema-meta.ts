import { z } from 'zod';

export function labelOf<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
  key: Extract<keyof S['shape'], string>,
): string {
  const field = schema.shape[key];
  if (!field) return key;
  return z.globalRegistry.get(field)?.description ?? key;
}

export function labelsOf<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
  keys: readonly Extract<keyof S['shape'], string>[],
): string[] {
  return keys.map((key) => labelOf(schema, key));
}
