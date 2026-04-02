import { useState, useEffect, useRef, useCallback } from "react";

// ─── HURT 911 RECOVERY CONCIERGE ───
// 9-screen app: Immediate Help → Intake → Clinic Locator → What Happens Next
// → Client Dashboard → Treatment Hub → Case Support → Transportation → Documents

const COLORS = {
  bg: "#0A0B10",
  bgCard: "#13141B",
  bgCardAlt: "#1A1B24",
  bgInput: "#1E1F2A",
  red: "#C82424",
  redGlow: "rgba(200,36,36,0.3)",
  redLight: "#E83A3A",
  chrome: "#B8BCC8",
  chromeDark: "#6B7080",
  white: "#F5F5F7",
  textMuted: "#8B8FA0",
  textDim: "#5A5E70",
  green: "#22C55E",
  orange: "#F59E0B",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.1)",
};

const CLINICS = [
  { id: 1, name: "Stonecrest Clinic", address: "5745 Hillandale Dr, Lithonia GA 30058", phone: "(770) 808-1234", services: ["Chiropractic", "Physical Therapy", "MRI"], hours: "Mon-Fri 8AM-6PM", distance: "2.3 mi" },
  { id: 2, name: "Hurt 911 Decatur", address: "2501 N Decatur Rd, Decatur GA 30033", phone: "(404) 555-0911", services: ["Accident Doctor", "X-Ray", "Diagnostics"], hours: "Mon-Sat 7AM-7PM", distance: "4.1 mi" },
  { id: 3, name: "Midtown Recovery Center", address: "1100 Peachtree St NE, Atlanta GA 30309", phone: "(404) 555-1911", services: ["Physical Therapy", "Chiropractic", "Pain Management"], hours: "Mon-Fri 9AM-5PM", distance: "7.8 mi" },
  { id: 4, name: "South DeKalb Accident Care", address: "2862 Candler Rd, Decatur GA 30034", phone: "(470) 555-0911", services: ["Chiropractic", "MRI", "X-Ray", "Diagnostics"], hours: "Mon-Fri 8AM-6PM, Sat 9AM-2PM", distance: "5.2 mi" },
];

const CASE_PHASES = [
  { label: "Intake", icon: "📋" },
  { label: "In Treatment", icon: "🏥" },
  { label: "Records Review", icon: "📄" },
  { label: "Case Build", icon: "⚖️" },
  { label: "Demand Sent", icon: "📨" },
  { label: "Negotiation", icon: "🤝" },
  { label: "Settlement", icon: "💰" },
];

// ─── LOGO COMPONENT ───
function HurtLogo({ size = "md" }) {
  const sizes = { sm: { h: 28, font: 16 }, md: { h: 40, font: 22 }, lg: { h: 56, font: 32 } };
  const s = sizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.red}, #8B1515)`,
        borderRadius: 6,
        width: s.h,
        height: s.h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 20px ${COLORS.redGlow}`,
      }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: s.font * 0.7, fontFamily: "Oswald, sans-serif" }}>H</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: s.font, color: COLORS.white, letterSpacing: 1 }}>
          1-800-<span style={{ color: COLORS.red }}>HURT</span> 911
        </span>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: s.font * 0.38, color: COLORS.chromeDark, letterSpacing: 3, textTransform: "uppercase" }}>
          Personal Injury Care
        </span>
      </div>
    </div>
  );
}

// ─── BUTTON COMPONENT ───
function Btn({ children, variant = "primary", onClick, icon, full, disabled, small }) {
  const [hover, setHover] = useState(false);
  const base = {
    primary: {
      background: hover ? COLORS.redLight : `linear-gradient(135deg, ${COLORS.red}, #A01E1E)`,
      color: "#fff",
      border: "none",
      boxShadow: hover ? `0 4px 24px ${COLORS.redGlow}` : `0 2px 12px rgba(200,36,36,0.2)`,
    },
    secondary: {
      background: hover ? COLORS.bgCardAlt : COLORS.bgCard,
      color: COLORS.white,
      border: `1px solid ${hover ? COLORS.borderLight : COLORS.border}`,
      boxShadow: "none",
    },
    ghost: {
      background: "transparent",
      color: hover ? COLORS.white : COLORS.chrome,
      border: `1px solid ${hover ? COLORS.chromeDark : COLORS.border}`,
      boxShadow: "none",
    },
    success: {
      background: hover ? "#16A34A" : COLORS.green,
      color: "#fff",
      border: "none",
      boxShadow: hover ? "0 4px 16px rgba(34,197,94,0.3)" : "none",
    },
  };
  const s = base[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: small ? "10px 16px" : "14px 24px",
        borderRadius: 12,
        fontFamily: "DM Sans, sans-serif",
        fontSize: small ? 13 : 15,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: full ? "100%" : "auto",
        transition: "all 0.2s ease",
        letterSpacing: 0.3,
      }}
    >
      {icon && <span style={{ fontSize: small ? 16 : 20 }}>{icon}</span>}
      {children}
    </button>
  );
}

// ─── INPUT COMPONENT ───
function Input({ label, placeholder, type = "text", value, onChange, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block", letterSpacing: 0.5 }}>{label}</label>}
      <div style={{
        display: "flex",
        alignItems: "center",
        background: COLORS.bgInput,
        border: `1px solid ${focused ? COLORS.red : COLORS.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        transition: "border 0.2s",
      }}>
        {icon && <span style={{ marginRight: 10, fontSize: 16, opacity: 0.5 }}>{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: COLORS.white,
            fontFamily: "DM Sans",
            fontSize: 15,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}

// ─── CARD COMPONENT ───
function Card({ children, onClick, style = {}, glow }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${hover && onClick ? COLORS.borderLight : COLORS.border}`,
        borderRadius: 16,
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        boxShadow: glow ? `0 0 30px ${COLORS.redGlow}` : hover && onClick ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── NAV BAR ───
function NavBar({ currentTab, setTab, isClient }) {
  const publicTabs = [
    { id: "help", icon: "🆘", label: "Help Now" },
    { id: "clinics", icon: "📍", label: "Clinics" },
    { id: "services", icon: "📋", label: "Services" },
    { id: "next", icon: "📖", label: "Next Steps" },
  ];
  const clientTabs = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "treatment", icon: "💊", label: "Treatment" },
    { id: "case", icon: "⚖️", label: "Case" },
    { id: "docs", icon: "📁", label: "Documents" },
    { id: "transport", icon: "🚗", label: "Rides" },
  ];
  const tabs = isClient ? clientTabs : publicTabs;
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(10,11,16,0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${COLORS.border}`,
      display: "flex",
      justifyContent: "space-around",
      padding: "8px 0 20px",
      zIndex: 100,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            opacity: currentTab === t.id ? 1 : 0.5,
            transition: "opacity 0.2s",
          }}
        >
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{
            fontFamily: "DM Sans",
            fontSize: 10,
            color: currentTab === t.id ? COLORS.red : COLORS.textMuted,
            fontWeight: currentTab === t.id ? 700 : 400,
            letterSpacing: 0.5,
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── STATUS BADGE ───
function Badge({ text, color = COLORS.green }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 20,
      padding: "4px 12px",
      fontFamily: "DM Sans",
      fontSize: 11,
      fontWeight: 600,
      color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {text}
    </span>
  );
}

// ═══════════════════════════════════════════
// SCREEN 1 — IMMEDIATE HELP (PUBLIC)
// ═══════════════════════════════════════════
function ScreenHelp({ setTab, setIsClient }) {
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="lg" />
      <div style={{ marginTop: 32 }}>
        <h1 style={{
          fontFamily: "Oswald, sans-serif",
          fontSize: "clamp(28px, 7vw, 40px)",
          fontWeight: 700,
          color: COLORS.white,
          lineHeight: 1.1,
          margin: 0,
        }}>
          Hurt in an accident?<br />
          <span style={{ color: COLORS.chrome, fontWeight: 400 }}>We help from this point on.</span>
        </h1>
        <p style={{ fontFamily: "DM Sans", fontSize: 14, color: COLORS.textMuted, marginTop: 12, lineHeight: 1.6 }}>
          Talk to a live team member, get connected to treatment, find a clinic near you, request transportation, and stay guided through every next step.
        </p>
      </div>

      {/* CALL ME NOW — Hero CTA */}
      <div style={{ marginTop: 28 }}>
        <Btn variant="primary" full icon="📞" onClick={() => window.open("tel:18004878911")}>
          Call Me Now
        </Btn>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        <Btn variant="secondary" onClick={() => setTab("clinics")} icon="❤️">I Need Treatment</Btn>
        <Btn variant="secondary" onClick={() => setTab("transport")} icon="🚗">I Need a Ride</Btn>
      </div>
      <div style={{ marginTop: 12 }}>
        <Btn variant="ghost" full onClick={() => {
          setIsClient(true);
          setTab("dashboard");
        }} icon="📊">
          Check My Case Status
        </Btn>
      </div>

      {/* Fast Intake Form */}
      <Card style={{ marginTop: 28 }}>
        <h3 style={{ fontFamily: "Oswald", fontSize: 18, color: COLORS.white, margin: "0 0 16px" }}>Get Help Now</h3>
        <Input label="Your Name" placeholder="Full name" icon="👤" />
        <Input label="Phone Number" placeholder="(___) ___-____" type="tel" icon="📱" />
        <Input label="Accident Date" placeholder="MM/DD/YYYY" type="date" icon="📅" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {["Need Attorney", "Need Treatment", "Need Transportation", "Not Sure"].map(opt => (
            <label key={opt} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: COLORS.bgInput,
              borderRadius: 8,
              padding: "10px 12px",
              cursor: "pointer",
              fontFamily: "DM Sans",
              fontSize: 12,
              color: COLORS.chrome,
            }}>
              <input type="checkbox" style={{ accentColor: COLORS.red }} />
              {opt}
            </label>
          ))}
        </div>
        <Btn variant="primary" full>Get Help Now</Btn>
      </Card>

      {/* Trust Indicators */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginTop: 24,
        padding: "16px 0",
      }}>
        {[
          { icon: "🟢", text: "Open 24/7" },
          { icon: "⚡", text: "Fast Response" },
          { icon: "👥", text: "Real Agents" },
        ].map(t => (
          <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted }}>
            <span>{t.icon}</span>{t.text}
          </div>
        ))}
      </div>

      {/* Someone I Know Got Hurt */}
      <div style={{ marginTop: 16 }}>
        <Btn variant="ghost" full icon="❤️‍🩹">Someone I Know Got Hurt</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 3 — CLINIC LOCATOR
// ═══════════════════════════════════════════
function ScreenClinics() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 24, color: COLORS.white, margin: "20px 0 8px" }}>Find a Clinic Near You</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>Georgia's largest accident treatment network</p>

      {/* Fake Map Area */}
      <div style={{
        background: `linear-gradient(135deg, #1A1B24, #0D0E14)`,
        borderRadius: 16,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${COLORS.border}`,
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 40% 50%, rgba(200,36,36,0.08) 0%, transparent 60%)" }} />
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <span style={{ fontSize: 36 }}>📍</span>
          <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
            {CLINICS.length} clinics near Atlanta, GA
          </p>
        </div>
      </div>

      {/* Clinic Cards */}
      {CLINICS.map(c => (
        <Card key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.white, margin: 0 }}>{c.name}</h3>
              <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.textMuted, margin: "4px 0" }}>{c.address}</p>
            </div>
            <Badge text={c.distance} color={COLORS.blue} />
          </div>
          {selected === c.id && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
              <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.chrome, margin: "0 0 4px" }}>📞 {c.phone}</p>
              <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.chrome, margin: "0 0 4px" }}>🕐 {c.hours}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {c.services.map(s => (
                  <span key={s} style={{
                    background: `${COLORS.red}15`,
                    color: COLORS.redLight,
                    fontFamily: "DM Sans",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 12,
                  }}>{s}</span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                <Btn variant="primary" small>Book Visit</Btn>
                <Btn variant="secondary" small icon="🚗">Get a Ride</Btn>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 4 — WHAT HAPPENS NEXT
// ═══════════════════════════════════════════
function ScreenNext() {
  const steps = [
    { icon: "📞", title: "We connect you with the right team", desc: "A Hurt 911 agent responds fast — no automated system, no runaround." },
    { icon: "📅", title: "We schedule your evaluation", desc: "Get seen at one of our Georgia clinics. We handle the appointment." },
    { icon: "💊", title: "We help you start treatment", desc: "Chiropractic, physical therapy, diagnostics — whatever you need." },
    { icon: "⚖️", title: "We coordinate with legal support", desc: "Attorney referral if needed. We connect the dots so you don't have to." },
    { icon: "✅", title: "We guide you through the process", desc: "From first call to final resolution. You're never left guessing." },
  ];
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 24, color: COLORS.white, margin: "20px 0 4px" }}>What Happens Next</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 24px" }}>Here's exactly what to expect when you reach out.</p>

      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative" }}>
          {i < steps.length - 1 && (
            <div style={{
              position: "absolute",
              left: 20,
              top: 44,
              bottom: -12,
              width: 1,
              background: `linear-gradient(to bottom, ${COLORS.red}40, transparent)`,
            }} />
          )}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${COLORS.red}15`,
            border: `1px solid ${COLORS.red}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}>{step.icon}</div>
          <div>
            <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: 0 }}>{step.title}</h3>
            <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0", lineHeight: 1.5 }}>{step.desc}</p>
          </div>
        </div>
      ))}

      <Btn variant="primary" full icon="📞" onClick={() => window.open("tel:18004878911")}>Call Me Now</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 5 — CLIENT DASHBOARD
// ═══════════════════════════════════════════
function ScreenDashboard({ setTab }) {
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <HurtLogo size="sm" />
        <Badge text="Active Client" color={COLORS.green} />
      </div>
      <h2 style={{ fontFamily: "Oswald", fontSize: 22, color: COLORS.white, margin: "20px 0 4px" }}>
        Welcome back, <span style={{ color: COLORS.chrome }}>Jessica</span>
      </h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>
        Your care is in progress and your case is moving forward.
      </p>

      {/* TALK TO MY AGENT — Signature Feature */}
      <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, #1A0808, #13141B)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${COLORS.red}, #8B1515)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            boxShadow: `0 0 24px ${COLORS.redGlow}`,
          }}>📞</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "Oswald", fontSize: 18, color: COLORS.white, margin: 0 }}>Talk to My Agent</h3>
            <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.textMuted, margin: "2px 0 0" }}>Tap once — we call you back fast.</p>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: COLORS.red,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            cursor: "pointer",
          }}>→</div>
        </div>
      </Card>

      {/* Next Appointment */}
      <Card onClick={() => setTab("treatment")} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>📅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: 0 }}>UPCOMING APPOINTMENT</p>
            <p style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.white, margin: "2px 0 0" }}>Tomorrow 10:00 AM</p>
            <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.chrome, margin: "2px 0 0" }}>Stonecrest Clinic</p>
          </div>
          <span style={{ color: COLORS.textDim, fontSize: 20 }}>›</span>
        </div>
      </Card>

      {/* Recovery Progress */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: 0 }}>🏠 My Recovery Plan</h3>
          <span style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.green, fontWeight: 600 }}>3 of 12 Visits</span>
        </div>
        <div style={{ background: COLORS.bgInput, borderRadius: 8, height: 8, overflow: "hidden" }}>
          <div style={{
            width: "25%",
            height: "100%",
            background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.redLight})`,
            borderRadius: 8,
            transition: "width 0.5s ease",
          }} />
        </div>
      </Card>

      {/* Quick Actions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        {[
          { icon: "💬", label: "I Have a Question", tab: "case" },
          { icon: "🚗", label: "I Need a Ride", tab: "transport" },
          { icon: "💊", label: "Treatment Help", tab: "treatment" },
          { icon: "📊", label: "Case Update", tab: "case" },
          { icon: "🔑", label: "Rental Help", tab: "transport" },
          { icon: "❤️‍🩹", label: "Someone Got Hurt", tab: "help" },
        ].map(a => (
          <Card key={a.label} onClick={() => setTab(a.tab)} style={{ padding: 16, textAlign: "center" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>{a.icon}</span>
            <span style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.chrome, fontWeight: 500 }}>{a.label}</span>
          </Card>
        ))}
      </div>

      {/* Footer Trust */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
        {["🟢 Open 24/7", "⚡ Fast Reply", "💰 Settlement", "🤝 Compassion"].map(t => (
          <span key={t} style={{ fontFamily: "DM Sans", fontSize: 10, color: COLORS.textDim }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 6 — TREATMENT HUB
// ═══════════════════════════════════════════
function ScreenTreatment() {
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 22, color: COLORS.white, margin: "20px 0 4px" }}>Stay on track with your care.</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>Your treatment plan and upcoming visits.</p>

      {/* Book First Visit / Upcoming */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: 0 }}>📅 Upcoming Appointment</h3>
          <span style={{ color: COLORS.textDim, fontSize: 20 }}>›</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            background: `${COLORS.red}15`,
            borderRadius: 10,
            padding: "8px 14px",
            textAlign: "center",
          }}>
            <p style={{ fontFamily: "Oswald", fontSize: 20, color: COLORS.red, margin: 0 }}>APR</p>
            <p style={{ fontFamily: "Oswald", fontSize: 28, color: COLORS.white, margin: 0 }}>03</p>
          </div>
          <div>
            <p style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.white, margin: 0 }}>10:00 AM</p>
            <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.chrome, margin: "2px 0" }}>Stonecrest Clinic</p>
            <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Chiropractic + Physical Therapy</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          <Btn variant="success" small>Confirm</Btn>
          <Btn variant="ghost" small>Reschedule</Btn>
        </div>
      </Card>

      {/* Treatment Progress */}
      <Card style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: "0 0 16px" }}>🏥 Treatment Progress</h3>
        {[
          { type: "Chiropractic", done: 3, total: 12, color: COLORS.red },
          { type: "Physical Therapy", done: 1, total: 8, color: COLORS.blue },
          { type: "MRI / Diagnostics", done: 1, total: 1, color: COLORS.green },
        ].map(t => (
          <div key={t.type} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.chrome }}>{t.type}</span>
              <span style={{ fontFamily: "DM Sans", fontSize: 12, color: t.color, fontWeight: 600 }}>{t.done}/{t.total}</span>
            </div>
            <div style={{ background: COLORS.bgInput, borderRadius: 6, height: 6, overflow: "hidden" }}>
              <div style={{
                width: `${(t.done / t.total) * 100}%`,
                height: "100%",
                background: t.color,
                borderRadius: 6,
              }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Reminders */}
      <Card style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: "0 0 12px" }}>⏰ Reminders</h3>
        {[
          { text: "Take prescribed medication", time: "8:00 AM daily", done: true },
          { text: "Ice therapy — 20 minutes", time: "After each session", done: false },
          { text: "Neck stretching exercises", time: "3x daily", done: false },
        ].map((r, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: i < 2 ? `1px solid ${COLORS.border}` : "none",
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              border: `2px solid ${r.done ? COLORS.green : COLORS.chromeDark}`,
              background: r.done ? COLORS.green : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#fff",
            }}>{r.done ? "✓" : ""}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "DM Sans", fontSize: 13, color: r.done ? COLORS.textMuted : COLORS.white, margin: 0, textDecoration: r.done ? "line-through" : "none" }}>{r.text}</p>
              <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textDim, margin: 0 }}>{r.time}</p>
            </div>
          </div>
        ))}
      </Card>

      <Btn variant="secondary" full icon="🚗">Request Transportation to Next Visit</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 7 — CASE / LEGAL SUPPORT
// ═══════════════════════════════════════════
function ScreenCase() {
  const currentPhase = 1; // In Treatment
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 22, color: COLORS.white, margin: "20px 0 4px" }}>See where your case stands.</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>Plain-English updates. No legal jargon.</p>

      {/* Case Status Banner */}
      <Card glow style={{ marginBottom: 16, background: `linear-gradient(135deg, #0D1A0D, #13141B)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div>
            <h3 style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.green, margin: 0 }}>Ongoing Treatment</h3>
            <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.chrome, margin: "2px 0 0" }}>Your care is in progress and your case is moving forward.</p>
          </div>
        </div>
      </Card>

      {/* Phase Timeline */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: "0 0 16px" }}>Case Progress</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          {CASE_PHASES.map((p, i) => (
            <div key={i} style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: i <= currentPhase
                ? i === currentPhase ? COLORS.green : COLORS.green
                : COLORS.bgInput,
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CASE_PHASES.map((p, i) => (
            <span key={i} style={{
              fontFamily: "DM Sans",
              fontSize: 10,
              color: i <= currentPhase ? (i === currentPhase ? COLORS.green : COLORS.chrome) : COLORS.textDim,
              fontWeight: i === currentPhase ? 700 : 400,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              {p.icon} {p.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Last Update */}
      <Card style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: "Oswald", fontSize: 14, color: COLORS.white, margin: "0 0 8px" }}>Last Update</h3>
        <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.chrome, margin: 0, lineHeight: 1.6 }}>
          Records are being reviewed. We'll contact you soon.
        </p>
        <div style={{ marginTop: 12, padding: "10px 14px", background: COLORS.bgInput, borderRadius: 8 }}>
          <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: 0 }}>
            <strong style={{ color: COLORS.orange }}>What's Next:</strong> Gathering documents for case review.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <Btn variant="secondary" icon="💬">Ask a Question</Btn>
        <Btn variant="secondary" icon="📄">Upload Document</Btn>
      </div>
      <div style={{ marginTop: 12 }}>
        <Btn variant="primary" full icon="📞">Talk to My Agent</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 8 — TRANSPORTATION / RENTAL
// ═══════════════════════════════════════════
function ScreenTransport() {
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 22, color: COLORS.white, margin: "20px 0 4px" }}>Need help getting there?</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>We coordinate rides to treatment and back.</p>

      {/* Main Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: "center", padding: 20 }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>🚗</span>
          <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: "0 0 4px" }}>Request a Ride</h3>
          <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: 0 }}>To your next appointment</p>
        </Card>
        <Card style={{ textAlign: "center", padding: 20 }}>
          <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>📍</span>
          <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: "0 0 4px" }}>Ride Status</h3>
          <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Track your current ride</p>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Btn variant="secondary" icon="📝">Update Pickup</Btn>
        <Btn variant="secondary" icon="🆘">I Need Help Now</Btn>
      </div>

      {/* Active Ride Card */}
      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, #13141B, #1A1B24)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Badge text="Ride Scheduled" color={COLORS.blue} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🚙</span>
          <div>
            <p style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: 0 }}>Today: 9:30 AM</p>
            <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.textMuted, margin: "2px 0 0" }}>Pickup → Stonecrest Clinic</p>
          </div>
        </div>
      </Card>

      {/* Rental Help */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "Oswald", fontSize: 15, color: COLORS.white, margin: "0 0 8px" }}>🔑 Rental Vehicle Help</h3>
        <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 12px", lineHeight: 1.5 }}>
          Need a rental while your car is being repaired? We can help coordinate with your insurance.
        </p>
        <Btn variant="ghost" full>Request Rental Assistance</Btn>
      </Card>

      {/* Referral CTA */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.red}15, transparent)`,
        border: `1px solid ${COLORS.red}20`,
        borderRadius: 16,
        padding: 20,
        textAlign: "center",
      }}>
        <span style={{ fontSize: 32 }}>❤️‍🩹</span>
        <h3 style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.white, margin: "8px 0 4px" }}>Someone I Know Got Hurt</h3>
        <p style={{ fontFamily: "DM Sans", fontSize: 12, color: COLORS.textMuted, margin: "0 0 12px" }}>Send them our way. We'll take care of them.</p>
        <Btn variant="primary" full>Refer Someone</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN 9 — DOCUMENT CENTER
// ═══════════════════════════════════════════
function ScreenDocs() {
  const [uploads, setUploads] = useState([
    { name: "Insurance Card (Front)", status: "uploaded", date: "Mar 28" },
    { name: "Driver's License", status: "uploaded", date: "Mar 28" },
    { name: "Police Report", status: "pending", date: null },
    { name: "Accident Photos", status: "uploaded", date: "Mar 29" },
    { name: "SR-13 Form", status: "pending", date: null },
  ]);
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 22, color: COLORS.white, margin: "20px 0 4px" }}>Your Documents</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>Upload, track, and manage case-related files.</p>

      {/* Upload Button */}
      <div style={{
        border: `2px dashed ${COLORS.border}`,
        borderRadius: 16,
        padding: 28,
        textAlign: "center",
        marginBottom: 20,
        cursor: "pointer",
      }}>
        <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>📤</span>
        <p style={{ fontFamily: "DM Sans", fontSize: 14, color: COLORS.chrome, margin: 0, fontWeight: 600 }}>Tap to Upload</p>
        <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: "4px 0 0" }}>Photos, PDFs, or scanned documents</p>
      </div>

      {/* Document List */}
      {uploads.map((doc, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>{doc.status === "uploaded" ? "✅" : "⏳"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "DM Sans", fontSize: 14, color: COLORS.white, margin: 0 }}>{doc.name}</p>
              {doc.date && <p style={{ fontFamily: "DM Sans", fontSize: 11, color: COLORS.textMuted, margin: "2px 0 0" }}>Uploaded {doc.date}</p>}
            </div>
            <Badge
              text={doc.status === "uploaded" ? "Received" : "Needed"}
              color={doc.status === "uploaded" ? COLORS.green : COLORS.orange}
            />
          </div>
        </Card>
      ))}

      {/* Required Documents */}
      <div style={{ marginTop: 20, padding: "16px 20px", background: COLORS.bgCard, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
        <h4 style={{ fontFamily: "Oswald", fontSize: 14, color: COLORS.chrome, margin: "0 0 8px" }}>📋 Required for Your Case</h4>
        {["Insurance Card (Front & Back)", "Driver's License / ID", "Police Report (if available)", "Accident Photos", "SR-13 Form", "Medical Records (prior if any)"].map((d, i) => (
          <p key={i} style={{
            fontFamily: "DM Sans",
            fontSize: 12,
            color: COLORS.textMuted,
            margin: "6px 0",
            paddingLeft: 12,
            borderLeft: `2px solid ${i < 4 ? COLORS.green : COLORS.red}30`,
          }}>
            {d}
          </p>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREEN — SERVICES (PUBLIC)
// ═══════════════════════════════════════════
function ScreenServices({ setTab }) {
  const services = [
    { icon: "⚖️", title: "Attorney Referral", desc: "We connect you with experienced personal injury attorneys who fight for your compensation." },
    { icon: "🏥", title: "Medical Treatment", desc: "Chiropractic care, physical therapy, diagnostics, MRI, and X-ray at Georgia clinics." },
    { icon: "🚗", title: "Transportation", desc: "Rides to and from treatment. No appointment missed because you couldn't get there." },
    { icon: "📍", title: "Clinic Access", desc: "Multi-location network across Georgia. We find the closest clinic to you." },
    { icon: "📄", title: "Case Management", desc: "Plain-English updates on your case progress. No legal jargon, no guessing." },
    { icon: "📞", title: "24/7 Live Support", desc: "Real agents, not automated systems. Call anytime, get a human response." },
  ];
  return (
    <div style={{ padding: "24px 20px 100px" }}>
      <HurtLogo size="sm" />
      <h2 style={{ fontFamily: "Oswald", fontSize: 22, color: COLORS.white, margin: "20px 0 4px" }}>How We Help</h2>
      <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px" }}>Everything you need after an accident — coordinated by one team.</p>

      {services.map((s, i) => (
        <Card key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${COLORS.red}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <h3 style={{ fontFamily: "Oswald", fontSize: 16, color: COLORS.white, margin: 0 }}>{s.title}</h3>
              <p style={{ fontFamily: "DM Sans", fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        </Card>
      ))}

      <Btn variant="primary" full icon="📞" onClick={() => window.open("tel:18004878911")}>Call Me Now</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function HurtApp() {
  const [tab, setTab] = useState("help");
  const [isClient, setIsClient] = useState(false);

  // Map tabs to screens
  const screens = {
    help: <ScreenHelp setTab={setTab} setIsClient={setIsClient} />,
    clinics: <ScreenClinics />,
    services: <ScreenServices setTab={setTab} />,
    next: <ScreenNext />,
    dashboard: <ScreenDashboard setTab={setTab} />,
    treatment: <ScreenTreatment />,
    case: <ScreenCase />,
    docs: <ScreenDocs />,
    transport: <ScreenTransport />,
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.bg}; }
        ::-webkit-scrollbar { width: 0; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>
      <div style={{
        maxWidth: 430,
        margin: "0 auto",
        background: COLORS.bg,
        minHeight: "100vh",
        position: "relative",
        fontFamily: "DM Sans, sans-serif",
        overflowX: "hidden",
      }}>
        {/* Top safe area bar */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 4,
          background: `linear-gradient(90deg, ${COLORS.red}, transparent)`,
        }} />

        {screens[tab]}

        {/* Mode Toggle */}
        <div style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 101,
        }}>
          <button
            onClick={() => {
              setIsClient(!isClient);
              setTab(isClient ? "help" : "dashboard");
            }}
            style={{
              background: isClient ? COLORS.green + "20" : COLORS.bgCard,
              border: `1px solid ${isClient ? COLORS.green + "40" : COLORS.border}`,
              color: isClient ? COLORS.green : COLORS.textMuted,
              fontFamily: "DM Sans",
              fontSize: 10,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            {isClient ? "✓ CLIENT" : "PUBLIC"}
          </button>
        </div>

        <NavBar currentTab={tab} setTab={setTab} isClient={isClient} />
      </div>
    </>
  );
}
