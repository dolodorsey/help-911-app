import React, { useMemo, useState } from "react";
import { submitLead } from "./api.js";

const COLORS = {
  bg: "#08090E",
  card: "#0E1018",
  input: "#1A1C28",
  border: "rgba(255,255,255,0.08)",
  red: "#D42B2B",
  redDark: "#991B1B",
  white: "#F5F6FA",
  muted: "#B0B8CC",
  dim: "#7A82A0",
  green: "#10B981",
};

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "Atlanta",
  accidentDate: "",
  needsAttorney: false,
  needsTreatment: false,
  needsTransportation: false,
  notSure: false,
};

export default function RequestHelp() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.firstName.trim().length >= 2 &&
      form.phone.replace(/\D/g, "").length >= 10 &&
      status !== "submitting"
    );
  }, [form, status]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("submitting");
    setMessage("");

    const result = await submitLead({
      ...form,
      accidentDate: form.accidentDate || null,
      source: "help911_request_help",
    });

    if (!result?.success) {
      setStatus("error");
      setMessage("We could not submit your request. Call 1-800-HELP-911 for immediate assistance.");
      return;
    }

    setStatus("success");
    setMessage("Your request was received. A Help 911 recovery concierge will contact you as soon as possible.");
    setForm(initialForm);
  };

  if (status === "success") {
    return (
      <Page>
        <section style={styles.card}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h1 style={styles.title}>We got you.</h1>
          <p style={styles.body}>{message}</p>
          <a href="/" style={styles.primaryLink}>Return to the Help 911 app</a>
        </section>
      </Page>
    );
  }

  return (
    <Page>
      <a href="/" style={styles.back}>← Back to Help 911</a>
      <div style={styles.eyebrow}>DIRECT RECOVERY INTAKE</div>
      <h1 style={styles.heroTitle}>Request Help</h1>
      <p style={styles.heroCopy}>
        Help 911 begins after emergency response. Call 9-1-1 first when anyone is in immediate danger, then submit this request for accident recovery support.
      </p>

      <form onSubmit={submit} style={styles.card}>
        <div style={styles.grid}>
          <Field label="First name">
            <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} autoComplete="given-name" required style={styles.input} />
          </Field>
          <Field label="Last name">
            <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} autoComplete="family-name" style={styles.input} />
          </Field>
          <Field label="Mobile phone">
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" required style={styles.input} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" style={styles.input} />
          </Field>
          <Field label="Accident date">
            <input type="date" value={form.accidentDate} onChange={(e) => update("accidentDate", e.target.value)} style={styles.input} />
          </Field>
        </div>

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>What do you need?</legend>
          <div style={styles.needsGrid}>
            {[
              ["needsAttorney", "Attorney"],
              ["needsTreatment", "Treatment"],
              ["needsTransportation", "Transportation"],
              ["notSure", "Not sure yet"],
            ].map(([key, label]) => (
              <label key={key} style={{ ...styles.needOption, ...(form[key] ? styles.needSelected : {}) }}>
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => update(key, e.target.checked)}
                  style={{ accentColor: COLORS.red }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {status === "error" && <div style={styles.error}>{message}</div>}

        <button type="submit" disabled={!canSubmit} style={{ ...styles.button, opacity: canSubmit ? 1 : 0.45 }}>
          {status === "submitting" ? "Submitting…" : "Submit Help Request"}
        </button>

        <p style={styles.disclaimer}>
          Help 911 is not a law firm, medical provider, insurance company or emergency-response service. Submission does not create an attorney-client or provider-patient relationship.
        </p>
      </form>
    </Page>
  );
}

function Page({ children }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <main style={styles.page}>{children}</main>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(circle at top right, rgba(212,43,43,.16), transparent 38%), #08090E",
    color: COLORS.white,
    fontFamily: "'DM Sans', sans-serif",
    padding: "32px 20px 80px",
  },
  back: { color: COLORS.muted, textDecoration: "none", fontSize: 13 },
  eyebrow: { marginTop: 34, color: COLORS.red, fontSize: 11, fontWeight: 800, letterSpacing: 2.5 },
  heroTitle: { fontFamily: "'Oswald', sans-serif", fontSize: "clamp(42px, 10vw, 68px)", margin: "8px 0", lineHeight: 1 },
  heroCopy: { maxWidth: 700, color: COLORS.muted, lineHeight: 1.65, marginBottom: 24 },
  card: { maxWidth: 820, margin: "0 auto", background: "rgba(14,16,24,.96)", border: `1px solid ${COLORS.border}`, borderRadius: 22, padding: "clamp(20px, 5vw, 38px)", boxShadow: "0 24px 80px rgba(0,0,0,.35)" },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 34, margin: "0 0 8px" },
  body: { color: COLORS.muted, lineHeight: 1.6 },
  primaryLink: { display: "inline-flex", marginTop: 20, padding: "14px 18px", borderRadius: 12, background: COLORS.red, color: "#fff", textDecoration: "none", fontWeight: 800 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 },
  field: { display: "block" },
  label: { display: "block", marginBottom: 6, color: COLORS.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1 },
  input: { width: "100%", padding: "14px 15px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.input, color: COLORS.white, font: "inherit", boxSizing: "border-box" },
  fieldset: { border: 0, margin: "24px 0", padding: 0 },
  legend: { marginBottom: 10, color: COLORS.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1 },
  needsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
  needOption: { display: "flex", gap: 10, alignItems: "center", padding: "13px 14px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.input, cursor: "pointer" },
  needSelected: { borderColor: "rgba(212,43,43,.55)", background: "rgba(212,43,43,.12)" },
  button: { width: "100%", padding: "16px 20px", border: 0, borderRadius: 13, background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`, color: "#fff", fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: 1, cursor: "pointer" },
  error: { marginBottom: 14, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(239,68,68,.35)", background: "rgba(239,68,68,.12)", color: "#fca5a5" },
  disclaimer: { margin: "16px 0 0", color: COLORS.dim, fontSize: 10, lineHeight: 1.6, textAlign: "center" },
};
