const n=v=>Number.isFinite(Number(v))?Number(v):0
const distance=v=>{const m=String(v||'').match(/[\d.]+/);return m?Number(m[0]):999}

export function scoreEmergencyResource(resource={}){
  const official=resource.source_status==='official_directory'?40:resource.source_status==='primary_verified'?45:0
  const contact=resource.contact_verified===true?25:0
  const availability=resource.availability_status==='live_verified'?25:resource.availability_status==='call_to_confirm'?10:0
  const service=Array.isArray(resource.svc)&&resource.svc.length?10:0
  return official+contact+availability+service
}

export function rankEmergencyResources(resources=[]){
  return [...resources]
    .filter(r=>['official_directory','primary_verified'].includes(r.source_status)&&r.contact_verified===true)
    .sort((a,b)=>scoreEmergencyResource(b)-scoreEmergencyResource(a)||distance(a.dist)-distance(b.dist)||String(a.name||'').localeCompare(String(b.name||'')))
}

export function normalizeDirectoryResource(resource={}){
  return {...resource,source_status:'official_directory',contact_verified:true,availability_status:'call_to_confirm',hrs:'Call to confirm current hours'}
}
