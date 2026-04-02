// HELP 911 — Direct API Client
// Calls Supabase + GHL without n8n middleware

const SUPABASE_URL = "https://dzlmtvodpyhetvektfuo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bG10dm9kcHloZXR2ZWt0ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NjQsImV4cCI6MjA4NTE2MDg2NH0.qmnWB4aWdb7U8Iod9Hv8PQAOJO3AG0vYEGnPS--kfAo";
const GHL_PIT = "pit-9a59cc0e-98f4-4968-a45a-a6c3663ffeaf";
const GHL_LOCATION = "My8EzLOwxDNkXVKLbFBh";

export async function submitLead(data) {
  try {
    // 1. Create lead in Supabase
    const sbResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/help911_create_lead`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_first_name: data.firstName || "",
        p_last_name: data.lastName || "",
        p_phone: data.phone || "",
        p_city: data.city || "Atlanta",
        p_accident_date: data.accidentDate || null,
        p_needs_attorney: data.needsAttorney || false,
        p_needs_treatment: data.needsTreatment || false,
        p_needs_transportation: data.needsTransportation || false,
        p_not_sure: data.notSure || false,
        p_source: data.source || "app",
      }),
    });
    const sbData = await sbResp.json();

    // 2. Create contact in GHL
    const ghlResp = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_PIT}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION,
        firstName: data.firstName,
        lastName: data.lastName || "",
        phone: data.phone,
        tags: ["help911", "app_lead"],
        source: "Help 911 App",
        customFields: [
          { id: "17vQEJWpVCf9gJYIG0A1", field_value: data.accidentDate || "" },
          { id: "SEFg5RMLfSzNJlhxWSmh", field_value: data.needsAttorney ? "Yes" : "No" },
          { id: "Vd75D4j5nWC6h4GYYlin", field_value: data.needsTreatment ? "Yes" : "No" },
          { id: "m3DU0BBqwnfxBw4d9q3u", field_value: data.needsTransportation ? "Yes" : "No" },
          { id: "Ru2Csh7AjUBNModKS4PH", field_value: "app" },
          { id: "W8frBt8kbZ5aqifgHNsq", field_value: "New" },
        ],
      }),
    });
    const ghlData = await ghlResp.json();

    // 3. Log sync
    await fetch(`${SUPABASE_URL}/rest/v1/help911_ghl_sync`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        direction: "to_ghl",
        entity_type: "contact",
        entity_id: sbData?.lead_id || "unknown",
        ghl_id: ghlData?.contact?.id || "unknown",
        status: ghlData?.contact?.id ? "success" : "error",
      }),
    });

    return { success: true, leadId: sbData?.lead_id, ghlId: ghlData?.contact?.id };
  } catch (err) {
    console.error("submitLead error:", err);
    return { success: false, error: err.message };
  }
}

export async function submitAttorneyIntake(data) {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/help911_attorney_intake`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        intake_id: "H911-ATT-" + Date.now().toString().slice(-6),
        first_name: data.firstName,
        last_name: data.lastName || "",
        phone: data.phone,
        email: data.email || "",
        city: data.city || "Atlanta",
        accident_date: data.accidentDate || null,
        accident_type: data.accidentType || "",
        accident_description: data.accidentDesc || "",
        at_fault: data.atFault || "",
        injury_description: data.injuryDesc || "",
        currently_treating: data.currentlyTreating || false,
        treating_provider: data.treatingProvider || "",
        hospitalized: data.hospitalized || false,
        missed_work: data.missedWork || false,
        missed_work_days: data.missedDays ? parseInt(data.missedDays) : null,
        has_insurance: data.hasInsurance || false,
        insurance_company: data.insuranceCo || "",
        policy_number: data.policyNum || "",
        other_driver_insurance: data.otherInsurance || "",
        police_report_filed: data.policeReport || false,
        police_report_number: data.reportNum || "",
        preferred_callback_date: data.callbackDate || null,
        preferred_callback_time: data.callbackTime || "",
        preferred_language: data.language || "English",
        status: "new",
      }),
    });
    const result = await resp.json();

    // Also create as a lead + GHL contact
    await submitLead({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      accidentDate: data.accidentDate,
      needsAttorney: true,
      needsTreatment: data.currentlyTreating || false,
      source: "attorney_intake",
    });

    return { success: true, intakeId: result?.[0]?.intake_id || "submitted" };
  } catch (err) {
    console.error("submitAttorneyIntake error:", err);
    return { success: false, error: err.message };
  }
}
