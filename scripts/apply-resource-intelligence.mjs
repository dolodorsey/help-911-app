import fs from 'node:fs'
const path='src/App.jsx'
let source=fs.readFileSync(path,'utf8')
if(!source.includes('rankEmergencyResources')){
  source=source.replace('import { submitLead, submitAttorneyIntake, fetchLeads, fetchAppointments, fetchLeadStats } from "./api.js";','import { submitLead, submitAttorneyIntake, fetchLeads, fetchAppointments, fetchLeadStats } from "./api.js";\nimport { normalizeDirectoryResource, rankEmergencyResources } from "./resource-intelligence.js";')
}
source=source.replace('const CLINICS = [','const CLINIC_DIRECTORY_SEEDS = [')
const marker='];\n\nconst ACCIDENT_TYPES = ['
if(source.includes(marker) && !source.includes('const CLINICS = rankEmergencyResources')){
  source=source.replace(marker,'];\n\n// Official-directory entries are contact-verified records, not a claim of real-time availability.\n// Resource quality is evaluated before distance; callers confirm current hours directly.\nconst CLINICS = rankEmergencyResources(CLINIC_DIRECTORY_SEEDS.map(normalizeDirectoryResource));\n\nconst ACCIDENT_TYPES = [')
}
fs.writeFileSync(path,source)
console.log('HELP 911 resource intelligence guard applied')
