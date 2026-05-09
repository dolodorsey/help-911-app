// Help 911 — Route Landings
// One per IG auto-reply rule destination. Each landing pre-tags the lead intent
// and POSTs to the existing submitLead() pipeline.
import React, { useState } from "react";
import { submitLead } from "./api.js";

// Match App.jsx design tokens
const C = {
  bg: "#08090E", bgCard: "#0E1018", bgInput: "#1A1C28", bgSurface: "#1E2030",
  accent: "#D42B2B", accentLight: "#EF4444", accentDark: "#991B1B",
  blue: "#1E40AF", blueLight: "#3B82F6",
  white: "#F5F6FA", muted: "#B0B8CC", dim: "#7A82A0", chrome: "#C8CDD8",
  green: "#10B981", orange: "#F59E0B",
  border: "rgba(255,255,255,0.06)",
};

const FONT_OSWALD = "'Oswald', sans-serif";
const FONT_DM = "'DM Sans', sans-serif";

// ─── Shared Layout ───
const Page = ({ children }) => (
  <>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:${C.bg};-webkit-font-smoothing:antialiased;font-family:${FONT_DM};color:${C.white}}
      a{color:${C.accentLight};text-decoration:none}
      input:focus,textarea:focus,select:focus{outline:none;border-color:${C.accent}!important}
      button:disabled{opacity:0.5;cursor:not-allowed}
    `}</style>
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: FONT_DM, color: C.white }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", padding: "0 0 90px" }}>
        {children}
      </div>
    </div>
  </>
);

const Header = ({ accent = C.accent, eyebrow }) => (
  <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,9,14,0.96)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}`, padding: "14px 18px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <a href="/" style={{ fontFamily: FONT_OSWALD, fontWeight: 800, fontSize: 20, color: C.white, letterSpacing: 0.5 }}>
        HELP <span style={{ color: C.accent }}>911</span>
      </a>
      {eyebrow && <span style={{ fontFamily: FONT_DM, fontSize: 11, fontWeight: 600, color: accent, letterSpacing: 1.2, textTransform: "uppercase", marginLeft: "auto" }}>{eyebrow}</span>}
    </div>
  </div>
);

const Hero = ({ kicker, title, sub, color = C.accent }) => (
  <div style={{ padding: "32px 22px 18px", borderBottom: `1px solid ${C.border}` }}>
    <div style={{ fontFamily: FONT_DM, fontSize: 12, fontWeight: 700, color: color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{kicker}</div>
    <h1 style={{ fontFamily: FONT_OSWALD, fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: C.white, marginBottom: 12 }}>{title}</h1>
    {sub && <p style={{ fontFamily: FONT_DM, fontSize: 15, lineHeight: 1.5, color: C.muted }}>{sub}</p>}
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 14, ...style }}>{children}</div>
);

const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 14 }}>
    <div style={{ fontFamily: FONT_DM, fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);

const inputStyle = {
  width: "100%", padding: "14px 16px", background: C.bgInput, border: `1px solid ${C.border}`,
  borderRadius: 12, color: C.white, fontSize: 15, fontFamily: FONT_DM,
  transition: "border 0.2s",
};

const Btn = ({ children, color = C.accent, onClick, disabled, type = "button" }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{
    width: "100%", padding: "16px 20px",
    background: disabled ? C.dim : `linear-gradient(135deg, ${color}, ${color === C.accent ? C.accentDark : color})`,
    color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700,
    fontFamily: FONT_DM, cursor: disabled ? "not-allowed" : "pointer", letterSpacing: 0.4,
    boxShadow: `0 6px 20px ${color}40`,
  }}>{children}</button>
);

const Disclaimer = () => (
  <div style={{ padding: "16px 22px 30px", textAlign: "center", color: C.dim, fontSize: 11, fontFamily: FONT_DM, lineHeight: 1.6 }}>
    <div>Help 911 is not a law firm and does not provide legal advice.</div>
    <div>Help 911 is not a medical provider and does not provide medical advice.</div>
    <div>Past results do not guarantee future outcomes.</div>
    <div style={{ marginTop: 6 }}>Always call 9-1-1 in an emergency. We pick up after.</div>
  </div>
);

const Success = ({ title = "We've got you.", body }) => (
  <Card style={{ borderColor: `${C.green}40`, background: `${C.green}10` }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
    <div style={{ fontFamily: FONT_OSWALD, fontSize: 22, fontWeight: 700, color: C.green, marginBottom: 8 }}>{title}</div>
    <div style={{ fontFamily: FONT_DM, fontSize: 14, lineHeight: 1.6, color: C.chrome }}>{body}</div>
  </Card>
);

// ─── Reusable intake form ───
function Intake({ source, kind, prePromise, fields = ["firstName", "phone"], extra, sla = "60 seconds", color = C.accent, ctaLabel = "Get Help Now" }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.firstName || !form.phone) {
      setErr("Name + phone are required.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName || "",
        phone: form.phone,
        city: form.city || "Atlanta",
        accidentDate: form.accidentDate || null,
        needsAttorney: kind === "attorney" || kind === "atfault" || kind === "family" || kind === "insurance" || kind === "restart",
        needsTreatment: kind === "treatment" || kind === "now",
        needsTransportation: kind === "dispatch" || kind === "now",
        notSure: kind === "now" || kind === "restart",
        source,
      };
      const result = await submitLead(payload);
      if (!result?.success) throw new Error("submit failed");
      setDone(true);
    } catch (e) {
      setErr("Couldn't submit. DM @help911.hep on Instagram or email help@help911.help.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Success
        body={
          <>
            We received your info. Someone from Help 911 will reach out within <strong style={{ color: C.white }}>{sla}</strong>.
            <br /><br />
            If you need to talk faster — DM <a href="https://instagram.com/help911.hep" style={{ color: C.accentLight, fontWeight: 600 }}>@help911.hep</a> or email <a href="mailto:help@help911.help" style={{ color: C.accentLight, fontWeight: 600 }}>help@help911.help</a>.
          </>
        }
      />
    );
  }

  return (
    <Card>
      {prePromise && <div style={{ marginBottom: 14, padding: "12px 14px", background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, fontSize: 13, color: C.chrome, lineHeight: 1.5 }}>{prePromise}</div>}
      {fields.includes("firstName") && (
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="First Name">
            <input style={inputStyle} value={form.firstName || ""} onChange={set("firstName")} placeholder="First" autoComplete="given-name" />
          </Field>
          <Field label="Last Name">
            <input style={inputStyle} value={form.lastName || ""} onChange={set("lastName")} placeholder="Last (optional)" autoComplete="family-name" />
          </Field>
        </div>
      )}
      {fields.includes("phone") && (
        <Field label="Best Phone (we'll text first)">
          <input style={inputStyle} type="tel" value={form.phone || ""} onChange={set("phone")} placeholder="(404) 555-0123" autoComplete="tel" />
        </Field>
      )}
      {fields.includes("city") && (
        <Field label="City / Neighborhood">
          <input style={inputStyle} value={form.city || ""} onChange={set("city")} placeholder="Atlanta, Decatur, Marietta..." autoComplete="address-level2" />
        </Field>
      )}
      {fields.includes("accidentDate") && (
        <Field label="When did the crash happen?">
          <input style={inputStyle} type="date" value={form.accidentDate || ""} onChange={set("accidentDate")} />
        </Field>
      )}
      {extra}
      {err && <div style={{ padding: "10px 14px", background: `${C.accent}15`, border: `1px solid ${C.accent}40`, borderRadius: 12, color: C.accentLight, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</div>}
      <Btn color={color} onClick={submit} disabled={loading}>{loading ? "Sending..." : ctaLabel + " →"}</Btn>
      <div style={{ marginTop: 10, fontSize: 11, color: C.dim, textAlign: "center", lineHeight: 1.5 }}>
        Free to victims · No fee unless you win · Your info stays between you, your matched attorney + medical provider
      </div>
    </Card>
  );
}

// ═══ ROUTE: /now ═══════════════════════════════════════════════════
export const RouteNow = () => (
  <Page>
    <Header eyebrow="🚨 EMERGENCY DISPATCH" />
    <Hero
      kicker="Just hit · Right now"
      title="Stay safe. We're calling you back in under 60 seconds."
      sub="Drop your number — someone's on the line within 60 sec. While you wait: get to safety, take photos of all vehicles + plates, get witness names + numbers, and don't admit fault to anyone."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Right now, do this:</div>
        {[
          "Get to safety — pull over if you can.",
          "Take photos of every vehicle, plate, and visible damage.",
          "Get witness names + phone numbers if anyone saw it.",
          "Don't admit fault. Don't sign anything from the other driver's insurance.",
          "Drop your number below — we call you in 60 sec.",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 24px", height: 24, borderRadius: 6, background: C.accent, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            <div style={{ fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>{t}</div>
          </div>
        ))}
      </Card>
      <Intake
        source="ig_now_landing"
        kind="now"
        prePromise="Submitting tells our dispatch to call you in under 60 seconds. We handle attorney, doctor, tow, rental — all free to you."
        fields={["firstName", "phone", "city"]}
        sla="60 seconds"
        ctaLabel="Call Me Right Now"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /treatment ═════════════════════════════════════════════
export const RouteTreatment = () => (
  <Page>
    <Header eyebrow="🩺 MEDICAL ROUTING" color={C.blue} />
    <Hero
      color={C.blue}
      kicker="In Pain · Need a Doctor"
      title="Pain after a crash is real — even if adrenaline is hiding it."
      sub="We have 4 ATL chiropractors, 2 imaging centers, and an ER doc on call who all bill the lien. Zero out of pocket to you."
    />
    <div style={{ padding: 18 }}>
      <Card style={{ borderColor: `${C.blue}30`, background: `${C.blue}08` }}>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.blueLight, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Why "bill the lien" matters</div>
        <div style={{ fontSize: 14, color: C.chrome, lineHeight: 1.6 }}>
          Our medical partners get paid <strong style={{ color: C.white }}>only when your case settles</strong>. You pay $0 out of pocket. No insurance hassle. No bills hitting your credit. Whiplash, soft tissue, MRIs, PT — all covered.
        </div>
      </Card>
      <Intake
        source="ig_treatment_landing"
        kind="treatment"
        color={C.blue}
        prePromise="Drop your info — a clinic near you will reach out within 30 minutes to schedule. Same day or next day usually."
        fields={["firstName", "phone", "city", "accidentDate"]}
        sla="30 minutes"
        ctaLabel="Get a Doctor Now"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /attorney ══════════════════════════════════════════════
export const RouteAttorney = () => (
  <Page>
    <Header eyebrow="⚖️ ATTORNEY MATCH" />
    <Hero
      kicker="Personal Injury · Free Consult"
      title="We don't pick the attorney for you — we route you to the right one."
      sub="12 vetted Atlanta personal-injury firms. Auto, motorcycle, commercial truck, rideshare, slip & fall. Contingency only — no fee unless they win."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>How the match works</div>
        {[
          { n: "1", t: "30-second intake below — name, phone, what happened" },
          { n: "2", t: "We match your case type to the firm that wins those cases" },
          { n: "3", t: "Attorney calls you within 60 minutes for a free consult" },
          { n: "4", t: "You decide. No pressure. Switch firms anytime." },
        ].map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 24px", height: 24, borderRadius: 6, background: C.accent, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</div>
            <div style={{ fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>{s.t}</div>
          </div>
        ))}
      </Card>
      <Intake
        source="ig_attorney_landing"
        kind="attorney"
        prePromise="Free consult. No obligation. Most cases settle without ever going to court."
        fields={["firstName", "phone", "city", "accidentDate"]}
        sla="60 minutes"
        ctaLabel="Match Me With an Attorney"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /dispatch ══════════════════════════════════════════════
export const RouteDispatch = () => (
  <Page>
    <Header eyebrow="🚗 TOW + RENTAL" />
    <Hero
      kicker="24/7 Dispatch"
      title="Tow + rental + body shop in 30 minutes."
      sub="Drop crash location and your number. If your vehicle was already towed, we can coordinate release with the yard."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>What we'll handle</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            "Tow truck dispatched to your location",
            "Rental car coordinated (most insurance covers this — we know how to push them)",
            "Body shop estimate from a partner that bills the at-fault driver's insurance",
            "Yard release coordination if your car was already towed",
          ].map((t) => (
            <li key={t} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>
              <span style={{ color: C.green }}>✓</span> {t}
            </li>
          ))}
        </ul>
      </Card>
      <Intake
        source="ig_dispatch_landing"
        kind="dispatch"
        prePromise="Tow + rental usually rolling within 30 minutes. We text you the driver's name + ETA before they arrive."
        fields={["firstName", "phone", "city"]}
        extra={
          <Field label="Where is your vehicle right now?">
            <input style={inputStyle} placeholder="Address, intersection, or tow yard" />
          </Field>
        }
        sla="30 minutes"
        ctaLabel="Dispatch Tow + Rental"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /restart ═══════════════════════════════════════════════
export const RouteRestart = () => (
  <Page>
    <Header eyebrow="🔄 REACTIVATE YOUR CASE" />
    <Hero
      kicker="Crash was days, weeks, months ago"
      title="You're not too late."
      sub="GA statute of limitations is 2 years from the crash date. If you're still in pain — or your case stalled with another firm — we may be able to plug in fresh resources."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.orange, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Common reasons to restart</div>
        {[
          "Still in pain weeks later — original treatment plan stopped working",
          "First attorney isn't returning calls",
          "Settlement offer came in low and you don't trust it",
          "Got dropped or never properly opened a case",
          "Insurance ran out — want a new chiro who bills the lien",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>
            <span style={{ color: C.accent }}>•</span> {t}
          </div>
        ))}
      </Card>
      <Intake
        source="ig_restart_landing"
        kind="restart"
        prePromise="Tell us where it stands. We'll either find a path forward — or honestly tell you it's already as good as it gets."
        fields={["firstName", "phone", "city", "accidentDate"]}
        ctaLabel="Restart My Case"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /insurance ═════════════════════════════════════════════
export const RouteInsurance = () => (
  <Page>
    <Header eyebrow="🛡️ INSURANCE QUESTION" color={C.orange} />
    <Hero
      color={C.orange}
      kicker="DON'T talk to their adjuster solo"
      title="Recorded statements work against you. We can take that call FOR you."
      sub="The other driver's insurance will ask innocent-sounding questions designed to limit your recovery. Don't give a recorded statement until you've talked to someone on your side."
    />
    <div style={{ padding: 18 }}>
      <Card style={{ borderColor: `${C.orange}30`, background: `${C.orange}08` }}>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Quick rules</div>
        {[
          { do: "Tell YOUR insurance the basic facts (date, location, other driver info)" },
          { dont: "Give a recorded statement to the OTHER driver's insurance" },
          { dont: "Accept a quick settlement offer in the first 2 weeks" },
          { dont: "Sign a release before your treatment is complete" },
          { do: "Save every text, voicemail, and email from any adjuster" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>
            {r.do ? <span style={{ color: C.green, fontWeight: 700 }}>DO</span> : <span style={{ color: C.accent, fontWeight: 700 }}>DON'T</span>} {r.do || r.dont}
          </div>
        ))}
      </Card>
      <Intake
        source="ig_insurance_landing"
        kind="insurance"
        color={C.orange}
        prePromise="We'll connect you with someone in under an hour who can take the adjuster call for you."
        fields={["firstName", "phone", "city", "accidentDate"]}
        sla="60 minutes"
        ctaLabel="Don't Let Me Talk to Them Solo"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /atfault ═══════════════════════════════════════════════
export const RouteAtFault = () => (
  <Page>
    <Header eyebrow="🤝 PARTIAL FAULT" />
    <Hero
      kicker="You think it was your fault"
      title="Don't self-disqualify. GA uses modified comparative negligence."
      sub="As long as you were under 50% responsible, you can still recover. A real attorney will tell you for free in 5 minutes — we'll match you."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>What "modified comparative negligence" means in GA</div>
        <div style={{ fontSize: 14, color: C.chrome, lineHeight: 1.6 }}>
          Even if you were partially at fault, you can recover damages reduced by your % of fault — as long as you were under 50% responsible. So if you're found 30% at fault on a $100K case, you still recover $70K.
          <br /><br />
          <strong style={{ color: C.white }}>Most "I caused it" stories — the driver was actually 0-30% at fault.</strong> Don't decide your case is dead. Let an attorney look.
        </div>
      </Card>
      <Intake
        source="ig_atfault_landing"
        kind="atfault"
        prePromise="Free 5-minute attorney consult. They'll tell you straight up if you have a case or not. No pressure either way."
        fields={["firstName", "phone", "city", "accidentDate"]}
        ctaLabel="Tell Me If I Have a Case"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /family ════════════════════════════════════════════════
export const RouteFamily = () => (
  <Page>
    <Header eyebrow="❤️ FAMILY MEMBER · PASSENGER" />
    <Hero
      kicker="Loved one was hurt or in the car"
      title="So sorry to hear. Passengers + family usually have the strongest case."
      sub="There's rarely an at-fault question for you or your loved one. Send the basics — we'll handle the next 5 calls so your family doesn't have to."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>What we'll handle for you</div>
        {[
          "Insurance calls (theirs and yours)",
          "Attorney coordination — separate counsel for separate parties when it makes sense",
          "Medical scheduling for everyone affected — no out of pocket cost",
          "Tow + rental + body shop logistics",
          "Funeral coordination (if fatal)",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>
            <span style={{ color: C.green }}>✓</span> {t}
          </div>
        ))}
      </Card>
      <Intake
        source="ig_family_landing"
        kind="family"
        prePromise="Tell us who's affected and what you need handled. We'll start working calls today."
        fields={["firstName", "phone", "city", "accidentDate"]}
        extra={
          <Field label="What's the relationship + situation?">
            <textarea
              style={{ ...inputStyle, minHeight: 90, fontFamily: FONT_DM, resize: "vertical" }}
              placeholder="e.g. 'My mom was a passenger and broke her arm. She's in the hospital now.'"
            />
          </Field>
        }
        ctaLabel="Help My Family"
      />
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /partners ══════════════════════════════════════════════
export const RoutePartners = () => (
  <Page>
    <Header eyebrow="🤝 PARTNER WITH HELP 911" color={C.blue} />
    <Hero
      color={C.blue}
      kicker="Attorneys · Doctors · Body Shops · Tow · Rental"
      title="Build the network with us."
      sub="We're vetting new partner firms and medical providers across Atlanta. Drop your info and we'll respond within 24 hours."
    />
    <div style={{ padding: 18 }}>
      <Card style={{ borderColor: `${C.blue}30`, background: `${C.blue}08` }}>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 14, fontWeight: 700, color: C.blueLight, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>What we look for</div>
        {[
          "Active license, clean record, valid insurance",
          "Capacity to absorb new cases/patients monthly",
          "Same-day or next-day responsiveness",
          "Fair lien terms (medical) or contingency-only (legal)",
          "Atlanta metro coverage (other GA cities welcome)",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, color: C.chrome, lineHeight: 1.5 }}>
            <span style={{ color: C.blueLight }}>›</span> {t}
          </div>
        ))}
      </Card>
      <Card>
        <Field label="Firm / Practice Name"><input style={inputStyle} placeholder="Your firm or clinic" /></Field>
        <Field label="Specialty"><input style={inputStyle} placeholder="e.g. PI law, chiro, MRI, ortho, body shop" /></Field>
        <Field label="Coverage Area"><input style={inputStyle} placeholder="Atlanta metro? Statewide?" /></Field>
        <Field label="Cases / Patients you can absorb monthly"><input style={inputStyle} placeholder="Realistic monthly capacity" /></Field>
        <Field label="Your Name + Phone"><input style={inputStyle} placeholder="Best contact" /></Field>
        <Btn color={C.blue}>Apply to Partner →</Btn>
        <div style={{ marginTop: 10, fontSize: 12, color: C.dim, textAlign: "center" }}>
          Or email <a href="mailto:partners@help911.help" style={{ color: C.blueLight }}>partners@help911.help</a> · We respond within 24h
        </div>
      </Card>
    </div>
    <Disclaimer />
  </Page>
);

// ═══ ROUTE: /press ═════════════════════════════════════════════════
export const RoutePress = () => (
  <Page>
    <Header eyebrow="📰 PRESS · MEDIA INQUIRY" color={C.muted} />
    <Hero
      color={C.muted}
      kicker="Journalists · Podcasts · Documentary"
      title="Help 911 in the news."
      sub="For press inquiries — including interview requests, podcast guesting, expert sourcing on Atlanta-area injury / first-responder topics — please email below. We respond within 24 hours."
    />
    <div style={{ padding: 18 }}>
      <Card>
        <div style={{ fontFamily: FONT_OSWALD, fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Send your request to:</div>
        <a href="mailto:press@help911.help" style={{ display: "block", fontFamily: FONT_OSWALD, fontSize: 22, fontWeight: 700, color: C.accentLight, textDecoration: "none", marginBottom: 14 }}>press@help911.help</a>
        <div style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>Please include:</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {["Outlet name + audience", "Topic / angle", "Deadline", "Best contact + format (phone, video, email Q&A)"].map((t) => (
            <li key={t} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 14, color: C.chrome }}>
              <span style={{ color: C.accent }}>·</span> {t}
            </li>
          ))}
        </ul>
      </Card>
      <Card style={{ borderColor: `${C.dim}30` }}>
        <div style={{ fontFamily: FONT_DM, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
          We don't comment on individual cases for privacy and legal reasons. We're happy to discuss the broader Atlanta injury-services landscape, founder story (Dr. Dorsey, KHG), the AIC accident-intelligence pipeline, or how concierge-style routing improves outcomes for crash victims.
        </div>
      </Card>
    </div>
    <Disclaimer />
  </Page>
);

// ─── Path → Component map ───
export const ROUTE_MAP = {
  "/now": RouteNow,
  "/treatment": RouteTreatment,
  "/attorney": RouteAttorney,
  "/dispatch": RouteDispatch,
  "/restart": RouteRestart,
  "/insurance": RouteInsurance,
  "/atfault": RouteAtFault,
  "/family": RouteFamily,
  "/partners": RoutePartners,
  "/press": RoutePress,
};

export function getRouteComponent(pathname) {
  if (!pathname) return null;
  // Strip trailing slash
  const clean = pathname.replace(/\/$/, "") || "/";
  return ROUTE_MAP[clean] || null;
}
