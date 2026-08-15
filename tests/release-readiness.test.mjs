import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('health contract identifies authority and restricted classification', () => {
  const health = JSON.parse(read('public/health.json'))
  assert.equal(health.app, 'help-911-app')
  assert.equal(health.authority, 'MCP Gateway public.help911_*')
  assert.equal(health.data_classification, 'highly-restricted')
})

test('handoff protects consent, assignment, and contact preferences', () => {
  const handoff = read('docs/HANDOFF.md')
  assert.match(handoff, /consent/i)
  assert.match(handoff, /DNC|contact preferences/i)
  assert.match(handoff, /may not overwrite/i)
})
