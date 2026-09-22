// A small, purpose-built structural validator — not a general JSON Schema
// engine, but enough of one to actually walk `schema/report.schema.json`
// and check a value against it, rather than duplicating the schema's rules
// by hand in a second place where they could drift. No runtime dependency:
// this package ships zero, same as its siblings.
//
// Supported keywords: type (incl. arrays of types, and "null"), const, enum,
// required, properties, additionalProperties: false, items, format:
// "date-time". That is every keyword schema/report.schema.json actually
// uses — this file is not meant to validate an arbitrary schema.
'use strict'

/**
 * @param {object} schema - A JSON Schema object (or subschema).
 * @param {*} value
 * @param {string} [path] - For readable problem messages.
 * @returns {string[]} Problems found. Empty means valid.
 */
export function validateAgainstSchema(schema, value, path = '$') {
  const problems = []
  walk(schema, value, path, problems)
  return problems
}

function walk(schema, value, path, problems) {
  if (Object.prototype.hasOwnProperty.call(schema, 'const')) {
    if (!deepEqual(value, schema.const)) {
      problems.push(`${path}: expected constant ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`)
    }
    return
  }

  if (Array.isArray(schema.enum)) {
    if (!schema.enum.some((allowed) => deepEqual(allowed, value))) {
      problems.push(`${path}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`)
    }
    return
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!types.some((t) => matchesType(t, value))) {
      problems.push(`${path}: expected type ${types.join(' | ')}, got ${describeType(value)}`)
      return
    }
  }

  if (isPlainObject(value) && (schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object')))) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) problems.push(`${path}: missing required property "${key}"`)
    }
    if (schema.properties) {
      for (const [key, subschema] of Object.entries(schema.properties)) {
        if (key in value) walk(subschema, value[key], `${path}.${key}`, problems)
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}))
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) problems.push(`${path}: unexpected property "${key}"`)
      }
    }
  }

  if (Array.isArray(value) && schema.items && (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array')))) {
    value.forEach((item, i) => walk(schema.items, item, `${path}[${i}]`, problems))
  }

  if (schema.format === 'date-time' && typeof value === 'string') {
    if (Number.isNaN(Date.parse(value))) problems.push(`${path}: "${value}" is not a valid date-time string`)
  }
}

function matchesType(type, value) {
  switch (type) {
    case 'object': return isPlainObject(value)
    case 'array': return Array.isArray(value)
    case 'string': return typeof value === 'string'
    case 'number': return typeof value === 'number' && Number.isFinite(value)
    case 'integer': return typeof value === 'number' && Number.isInteger(value)
    case 'boolean': return typeof value === 'boolean'
    case 'null': return value === null
    default: return false
  }
}

function describeType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((k) => deepEqual(a[k], b[k]))
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  }
  return false
}
