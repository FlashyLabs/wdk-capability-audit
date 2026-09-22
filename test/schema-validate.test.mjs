// Direct unit tests of the small, hand-rolled structural validator, in
// isolation from the report schema it's used against in test/report.test.mjs.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateAgainstSchema } from '../src/schema-validate.js'

test('validateAgainstSchema(): accepts a valid value against a simple object schema', () => {
  const schema = {
    type: 'object',
    required: ['a', 'b'],
    additionalProperties: false,
    properties: { a: { type: 'string' }, b: { type: 'integer' } },
  }
  assert.deepEqual(validateAgainstSchema(schema, { a: 'x', b: 1 }), [])
})

test('validateAgainstSchema(): reports a missing required property', () => {
  const schema = { type: 'object', required: ['a'], properties: { a: { type: 'string' } } }
  const problems = validateAgainstSchema(schema, {})
  assert.equal(problems.length, 1)
  assert.match(problems[0], /missing required property "a"/)
})

test('validateAgainstSchema(): reports a wrong type', () => {
  const schema = { type: 'string' }
  const problems = validateAgainstSchema(schema, 42)
  assert.equal(problems.length, 1)
  assert.match(problems[0], /expected type string/)
})

test('validateAgainstSchema(): rejects an unexpected property when additionalProperties is false', () => {
  const schema = { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false }
  const problems = validateAgainstSchema(schema, { a: 'x', extra: 1 })
  assert.ok(problems.some((p) => p.includes('extra')))
})

test('validateAgainstSchema(): allows an unexpected property when additionalProperties is not false', () => {
  const schema = { type: 'object', properties: { a: { type: 'string' } } }
  assert.deepEqual(validateAgainstSchema(schema, { a: 'x', extra: 1 }), [])
})

test('validateAgainstSchema(): enum rejects a value outside the list', () => {
  const schema = { enum: ['a', 'b'] }
  assert.equal(validateAgainstSchema(schema, 'c').length, 1)
  assert.equal(validateAgainstSchema(schema, 'a').length, 0)
})

test('validateAgainstSchema(): const rejects any other value', () => {
  const schema = { const: 'exact' }
  assert.equal(validateAgainstSchema(schema, 'exact').length, 0)
  assert.equal(validateAgainstSchema(schema, 'other').length, 1)
})

test('validateAgainstSchema(): array items are each checked against the item schema', () => {
  const schema = { type: 'array', items: { type: 'integer' } }
  assert.deepEqual(validateAgainstSchema(schema, [1, 2, 3]), [])
  const problems = validateAgainstSchema(schema, [1, 'two', 3])
  assert.equal(problems.length, 1)
  assert.match(problems[0], /\$\[1\]/)
})

test('validateAgainstSchema(): a type array (union) accepts null alongside string', () => {
  const schema = { type: ['string', 'null'] }
  assert.deepEqual(validateAgainstSchema(schema, null), [])
  assert.deepEqual(validateAgainstSchema(schema, 'x'), [])
  assert.equal(validateAgainstSchema(schema, 1).length, 1)
})

test('validateAgainstSchema(): format date-time rejects an unparseable string', () => {
  const schema = { type: 'string', format: 'date-time' }
  assert.deepEqual(validateAgainstSchema(schema, '2026-01-01T00:00:00.000Z'), [])
  assert.equal(validateAgainstSchema(schema, 'not a date').length, 1)
})
