import { OpenAPIV3 } from 'openapi-types';

type ZodJson = {
  type?: string;
  description?: string;
  nullable?: boolean;
  enum?: (string | number)[];
  properties?: Record<string, ZodJson>;
  required?: string[];
  items?: ZodJson | { any?: ZodJson } | { oneOf?: ZodJson[] };
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

// convert a Zod toJSONSchema() payload into an OpenAPI SchemaObject
export function zodToOpenApi(p: unknown): OpenAPIV3.SchemaObject {
  if (!p || typeof p !== 'object') return {};

  const payload = p as ZodJson;
  const base: OpenAPIV3.SchemaObject = {};

  if (typeof payload.description === 'string') base.description = payload.description;
  if (payload.nullable === true) base.nullable = true;
  if (Array.isArray(payload.enum)) base.enum = payload.enum;

  const t = payload.type;
  if (!t) return base;

  switch (t) {
    case 'object': {
      base.type = 'object';
      base.properties = {} as Record<string, OpenAPIV3.SchemaObject>;
      const props = payload.properties || {};

      for (const key of Object.keys(props)) {
        base.properties[key] = zodToOpenApi(props[key]);
      }

      if (Array.isArray(payload.required)) base.required = payload.required as string[];
      return base;
    }

    case 'array': {
      // treat as array schema
      const arrBase = base as unknown as OpenAPIV3.ArraySchemaObject;
      arrBase.type = 'array';
      let itemsPayload: ZodJson | undefined;

      if (
        payload.items
        && typeof payload.items === 'object'
        && 'any' in (payload.items as Record<string, unknown>)
      ) {
        itemsPayload = (payload.items as { any?: ZodJson }).any;
      } else if (
        payload.items
        && typeof payload.items === 'object'
        && 'oneOf' in (payload.items as Record<string, unknown>)
      ) {
        itemsPayload = (payload.items as { oneOf?: ZodJson[] }).oneOf?.[0];
      } else {
        itemsPayload = payload.items as ZodJson | undefined;
      }

      arrBase.items = zodToOpenApi(itemsPayload);
      return arrBase as OpenAPIV3.SchemaObject;
    }

    default: {
      // primitive
      base.type = t as OpenAPIV3.NonArraySchemaObjectType;

      if (typeof payload.format === 'string') base.format = payload.format;
      if (typeof payload.minimum === 'number') base.minimum = payload.minimum;
      if (typeof payload.maximum === 'number') base.maximum = payload.maximum;
      if (typeof payload.minLength === 'number') base.minLength = payload.minLength;
      if (typeof payload.maxLength === 'number') base.maxLength = payload.maxLength;
      if (typeof payload.pattern === 'string') base.pattern = payload.pattern;

      return base;
    }
  }
}
