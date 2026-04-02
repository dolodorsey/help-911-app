# HELP 911 — API SPECIFICATION

## Lead Intake Endpoint
POST /api/intake

Request Body:
```json
{
  "firstName": "string",
  "lastName": "string (optional)",
  "phone": "string (required)",
  "city": "string",
  "accidentDate": "date",
  "needsAttorney": boolean,
  "needsTreatment": boolean,
  "needsTransportation": boolean,
  "notSure": boolean,
  "source": "app|website|referral"
}
```

Flow:
1. Insert into help911_leads (Supabase)
2. Create/upsert contact in GHL (via PIT token)
3. Log to help911_ghl_sync
4. Send notification to agent queue
5. Return { success: true, leadId: "H911-2026-00001" }

## GHL Contact Creation
POST https://services.leadconnectorhq.com/contacts/
Headers:
  Authorization: Bearer pit-9a59cc0e-98f4-4968-a45a-a6c3663ffeaf
  Version: 2021-07-28

Body:
```json
{
  "locationId": "My8EzLOwxDNkXVKLbFBh",
  "firstName": "...",
  "lastName": "...",
  "phone": "...",
  "tags": ["help911", "app_lead"],
  "source": "Help 911 App",
  "customFields": [
    { "id": "17vQEJWpVCf9gJYIG0A1", "field_value": "2026-04-02" },
    { "id": "SEFg5RMLfSzNJlhxWSmh", "field_value": "Yes" },
    { "id": "Vd75D4j5nWC6h4GYYlin", "field_value": "Yes" },
    { "id": "m3DU0BBqwnfxBw4d9q3u", "field_value": "No" },
    { "id": "Ru2Csh7AjUBNModKS4PH", "field_value": "app" },
    { "id": "W8frBt8kbZ5aqifgHNsq", "field_value": "New" }
  ]
}
```

## GHL Custom Field IDs
- Accident Date: 17vQEJWpVCf9gJYIG0A1
- Needs Attorney: SEFg5RMLfSzNJlhxWSmh
- Needs Treatment: Vd75D4j5nWC6h4GYYlin
- Needs Transportation: m3DU0BBqwnfxBw4d9q3u
- Injury Type: PvWsqcBvN7fdIZUOhLGb
- Lead Source: Ru2Csh7AjUBNModKS4PH
- Case Phase: W8frBt8kbZ5aqifgHNsq
- Assigned Agent: ZMWzWvfXmC7dt4Vlm76u
- Preferred Clinic: xr5d0v6LqlsbfERHMB6O

## GHL Location: My8EzLOwxDNkXVKLbFBh
## GHL PIT Token: pit-9a59cc0e-98f4-4968-a45a-a6c3663ffeaf
