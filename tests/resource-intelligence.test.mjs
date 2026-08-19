import test from 'node:test'
import assert from 'node:assert/strict'
import { isEmergencyResourceEligible, normalizeDirectoryResource, rankEmergencyResources, scoreEmergencyResource } from '../src/resource-intelligence.js'

test('verified resource quality outranks proximity',()=>{
  const near={name:'Near unverified',dist:'0.2 mi',source_status:'unknown',contact_verified:false,availability_status:'unknown',svc:['Chiro']}
  const far={name:'Far verified',dist:'15 mi',source_status:'primary_verified',contact_verified:true,availability_status:'live_verified',svc:['Chiro']}
  const ranked=rankEmergencyResources([near,far])
  assert.equal(ranked.length,1)
  assert.equal(ranked[0].name,'Far verified')
  assert.ok(scoreEmergencyResource(far)>scoreEmergencyResource(near))
})

test('closed or unavailable resources never surface even when closest',()=>{
  const closed={name:'Closed nearby',dist:'0.1 mi',source_status:'primary_verified',contact_verified:true,availability_status:'closed',svc:['PT']}
  const live={name:'Open farther',dist:'12 mi',source_status:'primary_verified',contact_verified:true,availability_status:'live_verified',svc:['PT']}
  assert.equal(isEmergencyResourceEligible(closed),false)
  assert.deepEqual(rankEmergencyResources([closed,live]).map(r=>r.name),['Open farther'])
})

test('live verified availability outranks call-to-confirm before distance breaks a tie',()=>{
  const confirm={name:'Confirm first',dist:'0.2 mi',source_status:'official_directory',contact_verified:true,availability_status:'call_to_confirm',svc:['PT']}
  const live={name:'Live service',dist:'8 mi',source_status:'official_directory',contact_verified:true,availability_status:'live_verified',svc:['PT']}
  assert.equal(rankEmergencyResources([confirm,live])[0].name,'Live service')
})

test('official directory data does not claim live hours',()=>{
  const resource=normalizeDirectoryResource({name:'Clinic',hrs:'Mon-Fri 9AM-6PM',dist:'2 mi',svc:['PT']})
  assert.equal(resource.source_status,'official_directory')
  assert.equal(resource.contact_verified,true)
  assert.equal(resource.availability_status,'call_to_confirm')
  assert.equal(resource.hrs,'Call to confirm current hours')
})
