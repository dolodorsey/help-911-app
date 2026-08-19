import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDirectoryResource, rankEmergencyResources, scoreEmergencyResource } from '../src/resource-intelligence.js'

test('verified resource quality outranks proximity',()=>{
  const near={name:'Near unverified',dist:'0.2 mi',source_status:'unknown',contact_verified:false,availability_status:'unknown',svc:['Chiro']}
  const far={name:'Far verified',dist:'15 mi',source_status:'primary_verified',contact_verified:true,availability_status:'live_verified',svc:['Chiro']}
  const ranked=rankEmergencyResources([near,far])
  assert.equal(ranked.length,1)
  assert.equal(ranked[0].name,'Far verified')
  assert.ok(scoreEmergencyResource(far)>scoreEmergencyResource(near))
})

test('official directory data does not claim live hours',()=>{
  const resource=normalizeDirectoryResource({name:'Clinic',hrs:'Mon-Fri 9AM-6PM',dist:'2 mi',svc:['PT']})
  assert.equal(resource.source_status,'official_directory')
  assert.equal(resource.contact_verified,true)
  assert.equal(resource.availability_status,'call_to_confirm')
  assert.equal(resource.hrs,'Call to confirm current hours')
})
