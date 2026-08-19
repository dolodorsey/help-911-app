const n=v=>Number.isFinite(Number(v))?Number(v):0
const distance=v=>{const m=String(v||'').match(/[\d.]+/);return m?Number(m[0]):999}
const UNAVAILABLE=new Set(['closed','unavailable','inactive','invalid_contact','discontinued','expired'])

export function isEmergencyResourceEligible(resource={}){
  return ['official_directory','primary_verified'].includes(resource.source_status)
    && resource.contact_verified===true
    && !UNAVAILABLE.has(String(resource.availability_status||'').toLowerCase())
}

export function scoreEmergencyResource(resource={}){
  if(!isEmergencyResourceEligible(resource))return -1
  const official=resource.source_status==='official_directory'?40:resource.source_status==='primary_verified'?45:0
  const contact=25
  const availability=resource.availability_status==='live_verified'?25:resource.availability_status==='call_to_confirm'?10:5
  const service=Array.isArray(resource.svc)&&resource.svc.length?10:0
  const freshness=resource.last_verified_at&&Date.now()-new Date(resource.last_verified_at).getTime()<=30*24*60*60*1000?5:0
  return official+contact+availability+service+freshness
}

export function rankEmergencyResources(resources=[]){
  return [...resources]
    .filter(isEmergencyResourceEligible)
    .sort((a,b)=>scoreEmergencyResource(b)-scoreEmergencyResource(a)||distance(a.dist)-distance(b.dist)||String(a.name||'').localeCompare(String(b.name||'')))
}

export function normalizeDirectoryResource(resource={}){
  return {...resource,source_status:'official_directory',contact_verified:true,availability_status:'call_to_confirm',hrs:'Call to confirm current hours'}
}
