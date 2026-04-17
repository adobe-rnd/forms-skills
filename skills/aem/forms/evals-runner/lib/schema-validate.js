export function validate(schema, value, pathPrefix = '') {
  const errors = [];
  walk(schema, value, pathPrefix, errors);
  return { valid: errors.length === 0, errors };
}

function walk(schema, value, path, errors) {
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${path || '<root>'} must be an object`);
      return;
    }
    for (const req of schema.required || []) {
      if (!(req in value)) errors.push(`${path || '<root>'} missing required property "${req}"`);
    }
    for (const [k, v] of Object.entries(value)) {
      const propSchema = schema.properties?.[k];
      if (!propSchema) {
        if (schema.additionalProperties === false) {
          errors.push(`${path}${path ? '.' : ''}${k} is not allowed`);
        }
        continue;
      }
      walk(propSchema, v, `${path}${path ? '.' : ''}${k}`, errors);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return;
    }
    if (schema.items) {
      value.forEach((el, i) => walk(schema.items, el, `${path}[${i}]`, errors));
    }
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${path} must have at least ${schema.minItems} items`);
    }
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${path} must be a string`);
      return;
    }
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${path} must have minLength ${schema.minLength}`);
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path} must be one of ${JSON.stringify(schema.enum)}`);
    }
  } else if (schema.type === 'integer') {
    if (!Number.isInteger(value)) {
      errors.push(`${path} must be an integer`);
      return;
    }
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path} fails minimum ${schema.minimum}`);
    }
  } else if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') errors.push(`${path} must be a boolean`);
  } else if (schema.oneOf) {
    const matches = schema.oneOf.filter(sub => validate(sub, value, path).valid);
    if (matches.length !== 1) errors.push(`${path} must match exactly one of oneOf (matched ${matches.length})`);
  }
}
