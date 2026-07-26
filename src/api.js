// HELP 911 — Browser API Client
// Public intake writes go through the HELP 911 Supabase RPC. Private CRM and
// service credentials must remain in server-side automations, never this file.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dzlmtvodpyhetvektfuo.supabase.co";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ekvoOK6QQ05dUZuWgzQfUw_2RgbWPFR";

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function getStoredRepAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("h911_rep") || "null")?.access_token || null;
  } catch {
    return null;
  }
}

function publicHeaders(accessToken) {
  if (!configured()) throw new Error("HELP 911 data connection is not configured.");
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error_description || payload?.error || "Request failed.");
  }
  return payload;
}

export async function submitLead(data) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/help911_create_lead`, {
      method: "POST",
      headers: publicHeaders(),
      body: JSON.stringify({
        p_first_name: data.firstName || "",
        p_last_name: data.lastName || "",
        p_phone: data.phone || "",
        p_city: data.city || "Atlanta",
        p_accident_date: data.accidentDate || null,
        p_needs_attorney: Boolean(data.needsAttorney),
        p_needs_treatment: Boolean(data.needsTreatment),
        p_needs_transportation: Boolean(data.needsTransportation),
        p_not_sure: Boolean(data.notSure),
        p_source: data.source || "app",
      }),
    });

    const result = await parseResponse(response);
    return {
      success: result?.success === true,
      leadId: result?.lead_id || null,
      id: result?.id || null,
    };
  } catch (error) {
    console.error("submitLead error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitAttorneyIntake(data) {
  const intakeId = `H911-ATT-${Date.now().toString().slice(-8)}`;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/help911_attorney_intake`, {
      method: "POST",
      headers: {
        ...publicHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        intake_id: intakeId,
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
        currently_treating: Boolean(data.currentlyTreating),
        treating_provider: data.treatingProvider || "",
        hospitalized: Boolean(data.hospitalized),
        missed_work: Boolean(data.missedWork),
        missed_work_days: data.missedDays ? Number.parseInt(data.missedDays, 10) : null,
        has_insurance: Boolean(data.hasInsurance),
        insurance_company: data.insuranceCo || "",
        policy_number: data.policyNum || "",
        other_driver_insurance: data.otherInsurance || "",
        police_report_filed: Boolean(data.policeReport),
        police_report_number: data.reportNum || "",
        preferred_callback_date: data.callbackDate || null,
        preferred_callback_time: data.callbackTime || "",
        preferred_language: data.language || "English",
        status: "new",
      }),
    });

    await parseResponse(response);

    await submitLead({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      accidentDate: data.accidentDate,
      needsAttorney: true,
      needsTreatment: Boolean(data.currentlyTreating),
      source: "attorney_intake",
    });

    return { success: true, intakeId };
  } catch (error) {
    console.error("submitAttorneyIntake error:", error);
    return { success: false, error: error.message };
  }
}

// Rep-portal queries require a signed-in rep access token. Existing app code can
// omit the argument because this client recovers the rep session from localStorage.
export async function fetchLeads(accessToken = getStoredRepAccessToken()) {
  if (!accessToken) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/help911_leads?select=*&order=created_at.desc&limit=50`, {
      headers: publicHeaders(accessToken),
    });
    const data = await parseResponse(response);
    if (!Array.isArray(data)) return [];
    return data.map((lead) => ({
      id: lead.id,
      name: `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || "Unknown",
      phone: lead.phone || "",
      date: lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      needs: [
        lead.needs_attorney && "Attorney",
        lead.needs_treatment && "Treatment",
        lead.needs_transportation && "Transportation",
        lead.not_sure && "Not Sure",
      ].filter(Boolean),
      status: lead.status || "New",
      urgency: lead.urgency || "med",
      source: lead.source || "app",
    }));
  } catch {
    return [];
  }
}

export async function fetchAppointments(accessToken = getStoredRepAccessToken()) {
  if (!accessToken) return [];
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(`${SUPABASE_URL}/rest/v1/help911_appointments?select=*,help911_clients(first_name,last_name),help911_clinics(name)&scheduled_at=gte.${today}T00:00:00&order=scheduled_at.asc&limit=20`, {
      headers: publicHeaders(accessToken),
    });
    const data = await parseResponse(response);
    if (!Array.isArray(data)) return [];
    return data.map((appointment) => ({
      id: appointment.id,
      client: appointment.help911_clients ? `${appointment.help911_clients.first_name || ""} ${appointment.help911_clients.last_name || ""}`.trim() : "Unknown",
      time: appointment.scheduled_at ? new Date(appointment.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "TBD",
      clinic: appointment.help911_clinics?.name || "TBD",
      type: appointment.appointment_type || "Appointment",
      transport: Boolean(appointment.transport_requested),
    }));
  } catch {
    return [];
  }
}

export async function fetchLeadStats(accessToken = getStoredRepAccessToken()) {
  if (!accessToken) return { total: 0, new: 0, treatment: 0 };
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/help911_leads?select=status&limit=500`, {
      headers: publicHeaders(accessToken),
    });
    const data = await parseResponse(response);
    if (!Array.isArray(data)) return { total: 0, new: 0, treatment: 0 };
    return {
      total: data.length,
      new: data.filter((lead) => lead.status === "New" || lead.status === "Callback Requested").length,
      treatment: data.filter((lead) => (lead.status || "").includes("Treatment")).length,
    };
  } catch {
    return { total: 0, new: 0, treatment: 0 };
  }
}
