import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// HELP 911 — RECOVERY CONCIERGE APP
// Customer + Rep Portal | iOS 26 Ready | All Screens Functional
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#07080C", bgCard: "#0F1017", bgCardHover: "#14151E",
  bgInput: "#181924", bgSurface: "#1C1D28",
  red: "#C82424", redGlow: "rgba(200,36,36,0.25)", redLight: "#E04040", redDark: "#8B1818",
  blue: "#2563EB", blueGlow: "rgba(37,99,235,0.2)", blueLight: "#60A5FA",
  chrome: "#C0C4D0", chromeDim: "#6B7085", white: "#F2F3F7",
  muted: "#8890A4", dim: "#4A5068",
  green: "#10B981", greenDim: "#064E3B",
  orange: "#F59E0B", orangeDim: "#78350F",
  purple: "#8B5CF6",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.12)",
};

const font = (f="DM Sans", s=14, w=400, c=C.white) => ({
  fontFamily: `${f}, sans-serif`, fontSize: s, fontWeight: w, color: c, margin: 0
});

// ─── DATA ───
const CLINICS = [
  { id:1, name:"Stonecrest Clinic", addr:"5745 Hillandale Dr, Lithonia GA", phone:"(770) 808-1234", svc:["Chiro","PT","MRI"], hrs:"M-F 8A-6P", dist:"2.3 mi" },
  { id:2, name:"Decatur Recovery", addr:"2501 N Decatur Rd, Decatur GA", phone:"(404) 555-0911", svc:["Accident MD","X-Ray","Diagnostics"], hrs:"M-Sa 7A-7P", dist:"4.1 mi" },
  { id:3, name:"Midtown Care Center", addr:"1100 Peachtree St NE, Atlanta GA", phone:"(404) 555-1911", svc:["PT","Chiro","Pain Mgmt"], hrs:"M-F 9A-5P", dist:"7.8 mi" },
  { id:4, name:"South DeKalb Accident Care", addr:"2862 Candler Rd, Decatur GA", phone:"(470) 555-0911", svc:["Chiro","MRI","X-Ray"], hrs:"M-F 8A-6P, Sa 9A-2P", dist:"5.2 mi" },
];

const LEADS = [
  { id:1, name:"Marcus Johnson", phone:"(404) 555-1234", date:"Apr 1", needs:["Treatment","Attorney"], status:"New", urgency:"high" },
  { id:2, name:"Tamika Williams", phone:"(770) 555-5678", date:"Mar 31", needs:["Transportation","Treatment"], status:"Callback Requested", urgency:"high" },
  { id:3, name:"David Chen", phone:"(678) 555-9012", date:"Mar 30", needs:["Treatment"], status:"In Treatment", urgency:"med" },
  { id:4, name:"Angela Brooks", phone:"(404) 555-3456", date:"Mar 29", needs:["Attorney","Transportation"], status:"Qualified", urgency:"med" },
  { id:5, name:"Robert Jackson", phone:"(770) 555-7890", date:"Mar 28", needs:["Treatment"], status:"Active Treatment", urgency:"low" },
  { id:6, name:"Keisha Davis", phone:"(678) 555-2345", date:"Mar 27", needs:["Treatment","Attorney"], status:"Records Review", urgency:"low" },
];

const PHASES = ["Intake","In Treatment","Records","Case Build","Demand","Negotiation","Settlement"];

const APPTS = [
  { id:1, client:"Marcus Johnson", time:"10:00 AM", clinic:"Stonecrest", type:"Initial Eval", transport:true },
  { id:2, client:"David Chen", time:"11:30 AM", clinic:"Midtown Care", type:"PT Session #4", transport:false },
  { id:3, client:"Keisha Davis", time:"2:00 PM", clinic:"Decatur Recovery", type:"Chiro Follow-up", transport:true },
  { id:4, client:"Robert Jackson", time:"3:30 PM", clinic:"South DeKalb", type:"MRI Review", transport:false },
];

// ─── COMPONENTS ───
function Logo({ size="md" }) {
  const h = size==="sm"?28:size==="lg"?48:36;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <img src="/help911-logo.png" alt="HELP 911" style={{ height:h, width:h, objectFit:"contain", borderRadius:6 }}
        onError={(e)=>{e.target.style.display='none'}} />
      <div style={{ lineHeight:1.1 }}>
        <span style={{ fontFamily:"Oswald,sans-serif", fontWeight:700, fontSize:h*0.55, color:C.white, letterSpacing:1 }}>
          HELP <span style={{color:C.red}}>911</span>
        </span>
        {size!=="sm" && <span style={{ display:"block", fontFamily:"DM Sans,sans-serif", fontSize:h*0.22, color:C.chromeDim, letterSpacing:2.5, textTransform:"uppercase" }}>
          Personal Injury Care
        </span>}
      </div>
    </div>
  );
}

function Btn({ children, v="primary", onClick, icon, full, small, disabled }) {
  const [h, setH] = useState(false);
  const styles = {
    primary: { bg: h?C.redLight:`linear-gradient(135deg,${C.red},${C.redDark})`, c:"#fff", b:"none", sh:h?`0 6px 28px ${C.redGlow}`:"0 2px 12px rgba(200,36,36,0.15)" },
    secondary: { bg:h?C.bgCardHover:C.bgCard, c:C.white, b:`1px solid ${h?C.borderHover:C.border}`, sh:"none" },
    ghost: { bg:"transparent", c:h?C.white:C.chrome, b:`1px solid ${h?C.chromeDim:C.border}`, sh:"none" },
    success: { bg:h?"#059669":C.green, c:"#fff", b:"none", sh:h?"0 4px 16px rgba(16,185,129,0.3)":"none" },
    blue: { bg:h?C.blueLight:C.blue, c:"#fff", b:"none", sh:h?`0 4px 20px ${C.blueGlow}`:"none" },
    danger: { bg:h?"#DC2626":"#B91C1C", c:"#fff", b:"none", sh:"none" },
  };
  const s = styles[v]||styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:s.bg, color:s.c, border:s.b, boxShadow:s.sh,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        padding:small?"10px 14px":"14px 22px", borderRadius:12, fontFamily:"DM Sans,sans-serif",
        fontSize:small?12:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.4:1, width:full?"100%":"auto", transition:"all 0.2s",
        letterSpacing:0.3, WebkitTapHighlightColor:"transparent" }}>
      {icon&&<span style={{fontSize:small?14:18}}>{icon}</span>}{children}
    </button>
  );
}

function Inp({ label, placeholder, type="text", value, onChange, icon }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label&&<label style={{...font("DM Sans",11,500,C.muted), display:"block", marginBottom:5, letterSpacing:0.5}}>{label}</label>}
      <div style={{ display:"flex", alignItems:"center", background:C.bgInput, border:`1px solid ${f?C.red+"60":C.border}`, borderRadius:10, padding:"11px 14px", transition:"border 0.2s" }}>
        {icon&&<span style={{marginRight:8,fontSize:14,opacity:0.5}}>{icon}</span>}
        <input type={type} placeholder={placeholder} value={value||""} onChange={onChange}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ background:"none", border:"none", outline:"none", color:C.white,
            fontFamily:"DM Sans", fontSize:14, width:"100%", WebkitAppearance:"none" }} />
      </div>
    </div>
  );
}

function Card({ children, onClick, style={}, glow, pad=18 }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:C.bgCard, border:`1px solid ${h&&onClick?C.borderHover:C.border}`,
        borderRadius:14, padding:pad, cursor:onClick?"pointer":"default",
        transition:"all 0.2s", boxShadow:glow?`0 0 30px ${C.redGlow}`:h&&onClick?"0 4px 20px rgba(0,0,0,0.4)":"none",
        ...style }}>
      {children}
    </div>
  );
}

function Badge({ text, color=C.green, sm }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      background:`${color}12`, border:`1px solid ${color}28`, borderRadius:16,
      padding:sm?"3px 8px":"4px 11px", ...font("DM Sans",sm?9:10,600,color) }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color}}/>{text}
    </span>
  );
}

function Tab({ active, icon, label, onClick, accent=C.red }) {
  return (
    <button onClick={onClick} style={{ background:"none", border:"none", display:"flex",
      flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer",
      opacity:active?1:0.45, transition:"opacity 0.2s", WebkitTapHighlightColor:"transparent",
      padding:"4px 2px", minWidth:52 }}>
      <span style={{fontSize:18}}>{icon}</span>
      <span style={{...font("DM Sans",9,active?700:400,active?accent:C.muted), letterSpacing:0.4}}>{label}</span>
    </button>
  );
}

function NavBar({ tab, setTab, tabs, accent }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,8,12,0.94)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-around",
      padding:"6px 0 env(safe-area-inset-bottom, 20px)", zIndex:100 }}>
      {tabs.map(t=><Tab key={t.id} active={tab===t.id} icon={t.icon} label={t.label} onClick={()=>setTab(t.id)} accent={accent} />)}
    </div>
  );
}

function Section({ title, sub, children, right }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sub?4:12}}>
        <h2 style={{...font("Oswald",20,600,C.white)}}>{title}</h2>
        {right}
      </div>
      {sub&&<p style={{...font("DM Sans",13,400,C.muted),marginBottom:16,lineHeight:1.5}}>{sub}</p>}
      {children}
    </div>
  );
}

function ProgressBar({ pct, color=C.red, h=6 }) {
  return (
    <div style={{background:C.bgInput,borderRadius:h,height:h,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:h,transition:"width 0.6s ease"}} />
    </div>
  );
}

// ═══════════════════════════════════════════
// CUSTOMER SCREENS
// ═══════════════════════════════════════════

function CustHelp({ go, switchMode }) {
  const [form, setForm] = useState({});
  const [checks, setChecks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const toggleCheck = k => setChecks(p=>({...p,[k]:!p[k]}));

  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="lg" />

      <div style={{marginTop:28}}>
        <h1 style={{...font("Oswald","clamp(26px,7vw,38px)",700,C.white),lineHeight:1.1}}>
          Hurt in an accident?<br/>
          <span style={{color:C.chrome,fontWeight:400}}>Get help right now.</span>
        </h1>
        <p style={{...font("DM Sans",13,400,C.muted),marginTop:10,lineHeight:1.6}}>
          Talk to a live team member. Get connected to treatment. Find a clinic. Request a ride. We guide you through every step.
        </p>
      </div>

      <div style={{marginTop:24}}>
        <Btn v="primary" full icon="📞" onClick={()=>window.open("tel:18004878911")}>Call Me Now</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
        <Btn v="secondary" onClick={()=>go("clinics")} icon="❤️">I Need Treatment</Btn>
        <Btn v="secondary" onClick={()=>go("transport")} icon="🚗">I Need a Ride</Btn>
      </div>
      <div style={{marginTop:10}}>
        <Btn v="ghost" full onClick={()=>switchMode()} icon="📊">Check My Case Status</Btn>
      </div>

      {/* Intake Form */}
      <Card style={{marginTop:24}}>
        {submitted ? (
          <div style={{textAlign:"center",padding:20}}>
            <span style={{fontSize:48,display:"block",marginBottom:12}}>✅</span>
            <h3 style={{...font("Oswald",20,600,C.white),marginBottom:8}}>We Got You.</h3>
            <p style={{...font("DM Sans",13,400,C.muted),lineHeight:1.5}}>A Help 911 agent will call you back within minutes. Stay by your phone.</p>
            <Btn v="ghost" full onClick={()=>setSubmitted(false)} style={{marginTop:16}}>Submit Another</Btn>
          </div>
        ) : (<>
          <h3 style={{...font("Oswald",17,600,C.white),marginBottom:16}}>Get Help Now</h3>
          <Inp label="Your Name" placeholder="Full name" icon="👤" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
          <Inp label="Phone Number" placeholder="(___) ___-____" type="tel" icon="📱" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
          <Inp label="Accident Date" placeholder="MM/DD/YYYY" type="date" icon="📅" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
          <Inp label="City" placeholder="Atlanta, GA" icon="📍" value={form.city} onChange={e=>setForm(p=>({...p,city:e.target.value}))} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {["Need Attorney","Need Treatment","Need Transportation","Not Sure"].map(opt=>(
              <label key={opt} onClick={()=>toggleCheck(opt)} style={{
                display:"flex",alignItems:"center",gap:7,background:checks[opt]?`${C.red}15`:C.bgInput,
                border:`1px solid ${checks[opt]?`${C.red}40`:C.border}`,
                borderRadius:8,padding:"9px 10px",cursor:"pointer",transition:"all 0.2s",
                ...font("DM Sans",11,500,checks[opt]?C.redLight:C.chrome) }}>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checks[opt]?C.red:C.chromeDim}`,
                  background:checks[opt]?C.red:"transparent",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:9,color:"#fff",transition:"all 0.2s",flexShrink:0}}>
                  {checks[opt]?"✓":""}
                </div>
                {opt}
              </label>
            ))}
          </div>
          <Btn v="primary" full onClick={()=>setSubmitted(true)}>Get Help Now</Btn>
        </>)}
      </Card>

      <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:20,padding:"14px 0"}}>
        {["🟢 Open 24/7","⚡ Fast Response","👥 Real Agents"].map(t=>(
          <span key={t} style={{...font("DM Sans",10,400,C.dim)}}>{t}</span>
        ))}
      </div>

      <Btn v="ghost" full icon="❤️‍🩹" onClick={()=>go("refer")}>Someone I Know Got Hurt</Btn>
    </div>
  );
}

function CustClinics() {
  const [sel, setSel] = useState(null);
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Find a Clinic Near You" sub="Georgia's largest accident treatment network.">
        <div style={{background:`linear-gradient(135deg,${C.bgSurface},${C.bg})`,borderRadius:14,
          height:160,display:"flex",alignItems:"center",justifyContent:"center",
          border:`1px solid ${C.border}`,marginBottom:18,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 40% 50%,${C.redGlow},transparent 60%)`}}/>
          <div style={{textAlign:"center",zIndex:1}}>
            <span style={{fontSize:32}}>📍</span>
            <p style={{...font("DM Sans",12,400,C.muted),marginTop:6}}>{CLINICS.length} clinics near Atlanta, GA</p>
          </div>
        </div>
        {CLINICS.map(c=>(
          <Card key={c.id} onClick={()=>setSel(sel===c.id?null:c.id)} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h3 style={{...font("Oswald",15,600,C.white)}}>{c.name}</h3>
                <p style={{...font("DM Sans",11,400,C.muted),marginTop:3}}>{c.addr}</p>
              </div>
              <Badge text={c.dist} color={C.blue} sm />
            </div>
            {sel===c.id&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                <p style={{...font("DM Sans",12,400,C.chrome),marginBottom:3}}>📞 {c.phone}</p>
                <p style={{...font("DM Sans",12,400,C.chrome),marginBottom:8}}>🕐 {c.hrs}</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                  {c.svc.map(s=><span key={s} style={{background:`${C.red}12`,color:C.redLight,...font("DM Sans",9,600),padding:"3px 8px",borderRadius:10}}>{s}</span>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Btn v="primary" small>Book Visit</Btn>
                  <Btn v="secondary" small icon="🚗">Get a Ride</Btn>
                </div>
              </div>
            )}
          </Card>
        ))}
      </Section>
    </div>
  );
}

function CustServices({go}) {
  const svc = [
    {icon:"⚖️",t:"Attorney Referral",d:"Experienced personal injury attorneys who fight for your compensation."},
    {icon:"🏥",t:"Medical Treatment",d:"Chiropractic, PT, diagnostics, MRI, and X-ray at Georgia clinics."},
    {icon:"🚗",t:"Transportation",d:"Rides to and from treatment. Never miss an appointment."},
    {icon:"📍",t:"Clinic Access",d:"Multi-location network across Georgia — closest clinic to you."},
    {icon:"📄",t:"Case Management",d:"Plain-English updates. No legal jargon, no guessing."},
    {icon:"📞",t:"24/7 Live Support",d:"Real agents, not automated systems. Call anytime."},
  ];
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="How We Help" sub="Everything you need after an accident — one team.">
        {svc.map((s,i)=>(
          <Card key={i} style={{marginBottom:10}}>
            <div style={{display:"flex",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:`${C.red}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{s.icon}</div>
              <div>
                <h3 style={{...font("Oswald",15,600,C.white)}}>{s.t}</h3>
                <p style={{...font("DM Sans",12,400,C.muted),marginTop:3,lineHeight:1.5}}>{s.d}</p>
              </div>
            </div>
          </Card>
        ))}
        <Btn v="primary" full icon="📞" onClick={()=>window.open("tel:18004878911")}>Call Me Now</Btn>
      </Section>
    </div>
  );
}

function CustNext() {
  const steps = [
    {icon:"📞",t:"We connect you with the right team",d:"A Help 911 agent responds fast — no automated system."},
    {icon:"📅",t:"We schedule your evaluation",d:"Get seen at a Georgia clinic. We handle the appointment."},
    {icon:"💊",t:"We help you start treatment",d:"Chiropractic, PT, diagnostics — whatever you need."},
    {icon:"⚖️",t:"We coordinate legal support",d:"Attorney referral if needed. We connect the dots."},
    {icon:"✅",t:"We guide you through the process",d:"First call to final resolution. Never left guessing."},
  ];
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="What Happens Next" sub="Here's exactly what to expect.">
        {steps.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:14,marginBottom:22,position:"relative"}}>
            {i<steps.length-1&&<div style={{position:"absolute",left:18,top:42,bottom:-10,width:1,background:`linear-gradient(to bottom,${C.red}35,transparent)`}}/>}
            <div style={{width:36,height:36,borderRadius:10,background:`${C.red}12`,border:`1px solid ${C.red}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{s.icon}</div>
            <div>
              <h3 style={{...font("Oswald",14,600,C.white)}}>{s.t}</h3>
              <p style={{...font("DM Sans",12,400,C.muted),marginTop:3,lineHeight:1.5}}>{s.d}</p>
            </div>
          </div>
        ))}
        <Btn v="primary" full icon="📞" onClick={()=>window.open("tel:18004878911")}>Call Me Now</Btn>
      </Section>
    </div>
  );
}

function CustDash({go}) {
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo size="sm" />
        <Badge text="Active Client" color={C.green} />
      </div>
      <h2 style={{...font("Oswald",21,600,C.white),marginTop:18}}>Welcome back, <span style={{color:C.chrome}}>Jessica</span></h2>
      <p style={{...font("DM Sans",13,400,C.muted),marginTop:4,marginBottom:18}}>Your care is in progress. Case moving forward.</p>

      {/* TALK TO MY AGENT */}
      <Card glow style={{marginBottom:14,background:`linear-gradient(135deg,#180808,${C.bgCard})`}} onClick={()=>window.open("tel:18004878911")}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${C.red},${C.redDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 0 24px ${C.redGlow}`}}>📞</div>
          <div style={{flex:1}}>
            <h3 style={{...font("Oswald",17,600,C.white)}}>Talk to My Agent</h3>
            <p style={{...font("DM Sans",11,400,C.muted),marginTop:2}}>Tap once — we call you back fast.</p>
          </div>
          <div style={{width:36,height:36,borderRadius:10,background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff"}}>→</div>
        </div>
      </Card>

      {/* Appointment */}
      <Card onClick={()=>go("treatment")} style={{marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>📅</span>
          <div style={{flex:1}}>
            <p style={{...font("DM Sans",10,500,C.muted),letterSpacing:0.5}}>UPCOMING APPOINTMENT</p>
            <p style={{...font("Oswald",15,600,C.white),marginTop:2}}>Tomorrow 10:00 AM</p>
            <p style={{...font("DM Sans",12,400,C.chrome),marginTop:1}}>Stonecrest Clinic</p>
          </div>
          <span style={{color:C.dim,fontSize:18}}>›</span>
        </div>
      </Card>

      {/* Recovery Progress */}
      <Card style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{...font("Oswald",14,600,C.white)}}>🏠 My Recovery Plan</h3>
          <span style={{...font("DM Sans",11,600,C.green)}}>3 of 12 Visits</span>
        </div>
        <ProgressBar pct={25} />
      </Card>

      {/* Quick Actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:14}}>
        {[
          {icon:"💬",label:"Question",tab:"case"},{icon:"🚗",label:"Ride",tab:"transport"},
          {icon:"💊",label:"Treatment",tab:"treatment"},{icon:"📊",label:"Case",tab:"case"},
          {icon:"📁",label:"Documents",tab:"docs"},{icon:"❤️‍🩹",label:"Refer",tab:"help"},
        ].map(a=>(
          <Card key={a.label} onClick={()=>go(a.tab)} style={{padding:14,textAlign:"center"}}>
            <span style={{fontSize:24,display:"block",marginBottom:6}}>{a.icon}</span>
            <span style={{...font("DM Sans",10,500,C.chrome)}}>{a.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CustTreatment() {
  const [confirms, setConfirms] = useState({});
  const [reminders, setReminders] = useState({0:true});
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Stay on track with your care." sub="Treatment plan and upcoming visits.">
        <Card style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{...font("Oswald",14,600,C.white)}}>📅 Upcoming Appointment</h3>
            <span style={{color:C.dim,fontSize:16}}>›</span>
          </div>
          <div style={{marginTop:12,display:"flex",gap:12}}>
            <div style={{background:`${C.red}12`,borderRadius:10,padding:"8px 14px",textAlign:"center"}}>
              <p style={{...font("Oswald",18,600,C.red)}}>APR</p>
              <p style={{...font("Oswald",26,700,C.white)}}>03</p>
            </div>
            <div>
              <p style={{...font("Oswald",15,600,C.white)}}>10:00 AM</p>
              <p style={{...font("DM Sans",12,400,C.chrome),marginTop:2}}>Stonecrest Clinic</p>
              <p style={{...font("DM Sans",11,400,C.muted),marginTop:1}}>Chiropractic + Physical Therapy</p>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
            <Btn v={confirms.apt?"ghost":"success"} small onClick={()=>setConfirms(p=>({...p,apt:!p.apt}))}>{confirms.apt?"✓ Confirmed":"Confirm"}</Btn>
            <Btn v="ghost" small>Reschedule</Btn>
          </div>
        </Card>

        <Card style={{marginBottom:10}}>
          <h3 style={{...font("Oswald",14,600,C.white),marginBottom:14}}>🏥 Treatment Progress</h3>
          {[{t:"Chiropractic",done:3,total:12,c:C.red},{t:"Physical Therapy",done:1,total:8,c:C.blue},{t:"MRI / Diagnostics",done:1,total:1,c:C.green}].map(tr=>(
            <div key={tr.t} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{...font("DM Sans",12,400,C.chrome)}}>{tr.t}</span>
                <span style={{...font("DM Sans",11,600,tr.c)}}>{tr.done}/{tr.total}</span>
              </div>
              <ProgressBar pct={(tr.done/tr.total)*100} color={tr.c} />
            </div>
          ))}
        </Card>

        <Card style={{marginBottom:10}}>
          <h3 style={{...font("Oswald",14,600,C.white),marginBottom:10}}>⏰ Reminders</h3>
          {[{t:"Take prescribed medication",tm:"8:00 AM daily"},{t:"Ice therapy — 20 minutes",tm:"After each session"},{t:"Neck stretching exercises",tm:"3x daily"}].map((r,i)=>(
            <div key={i} onClick={()=>setReminders(p=>({...p,[i]:!p[i]}))} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<2?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
              <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${reminders[i]?C.green:C.chromeDim}`,background:reminders[i]?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",transition:"all 0.2s",flexShrink:0}}>{reminders[i]?"✓":""}</div>
              <div style={{flex:1}}>
                <p style={{...font("DM Sans",13,400,reminders[i]?C.muted:C.white),textDecoration:reminders[i]?"line-through":"none"}}>{r.t}</p>
                <p style={{...font("DM Sans",10,400,C.dim)}}>{r.tm}</p>
              </div>
            </div>
          ))}
        </Card>
        <Btn v="secondary" full icon="🚗">Request Ride to Next Visit</Btn>
      </Section>
    </div>
  );
}

function CustCase() {
  const phase = 1;
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="See where your case stands." sub="Plain-English updates. No legal jargon.">
        <Card glow style={{marginBottom:14,background:`linear-gradient(135deg,#0D160D,${C.bgCard})`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:26}}>✅</span>
            <div>
              <h3 style={{...font("Oswald",15,600,C.green)}}>Ongoing Treatment</h3>
              <p style={{...font("DM Sans",12,400,C.chrome),marginTop:2}}>Your care is in progress and your case is moving forward.</p>
            </div>
          </div>
        </Card>

        <Card style={{marginBottom:14}}>
          <h3 style={{...font("Oswald",14,600,C.white),marginBottom:14}}>Case Progress</h3>
          <div style={{display:"flex",gap:3,marginBottom:14}}>
            {PHASES.map((_,i)=><div key={i} style={{flex:1,height:5,borderRadius:3,background:i<=phase?C.green:C.bgInput}}/>)}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {PHASES.map((p,i)=><span key={i} style={{...font("DM Sans",9,i===phase?700:400,i<=phase?(i===phase?C.green:C.chrome):C.dim)}}>{["📋","🏥","📄","⚖️","📨","🤝","💰"][i]} {p}</span>)}
          </div>
        </Card>

        <Card style={{marginBottom:10}}>
          <h3 style={{...font("Oswald",13,600,C.white),marginBottom:6}}>Last Update</h3>
          <p style={{...font("DM Sans",13,400,C.chrome),lineHeight:1.6}}>Records are being reviewed. We'll contact you soon.</p>
          <div style={{marginTop:10,padding:"8px 12px",background:C.bgInput,borderRadius:8}}>
            <p style={{...font("DM Sans",11,400,C.muted)}}><strong style={{color:C.orange}}>What's Next:</strong> Gathering documents for case review.</p>
          </div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
          <Btn v="secondary" icon="💬">Ask Question</Btn>
          <Btn v="secondary" icon="📄">Upload Doc</Btn>
        </div>
        <div style={{marginTop:10}}><Btn v="primary" full icon="📞">Talk to My Agent</Btn></div>
      </Section>
    </div>
  );
}

function CustTransport() {
  const [requested, setRequested] = useState(false);
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Need help getting there?" sub="We coordinate rides to treatment and back.">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <Card onClick={()=>setRequested(true)} style={{textAlign:"center",padding:18}}>
            <span style={{fontSize:32,display:"block",marginBottom:6}}>🚗</span>
            <h3 style={{...font("Oswald",14,600,C.white)}}>Request a Ride</h3>
            <p style={{...font("DM Sans",10,400,C.muted),marginTop:2}}>To your next appointment</p>
          </Card>
          <Card style={{textAlign:"center",padding:18}}>
            <span style={{fontSize:32,display:"block",marginBottom:6}}>📍</span>
            <h3 style={{...font("Oswald",14,600,C.white)}}>Ride Status</h3>
            <p style={{...font("DM Sans",10,400,C.muted),marginTop:2}}>Track your current ride</p>
          </Card>
        </div>

        {requested && (
          <Card style={{marginBottom:14,background:`linear-gradient(135deg,${C.bgCard},${C.bgSurface})`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <Badge text="✓ Ride Requested" color={C.green} />
            </div>
            <p style={{...font("DM Sans",13,400,C.chrome),lineHeight:1.5}}>A Help 911 coordinator will confirm your pickup within 30 minutes.</p>
          </Card>
        )}

        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <Badge text="Ride Scheduled" color={C.blue} />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🚙</span>
            <div>
              <p style={{...font("Oswald",14,600,C.white)}}>Today: 9:30 AM</p>
              <p style={{...font("DM Sans",12,400,C.muted),marginTop:2}}>Pickup → Stonecrest Clinic</p>
            </div>
          </div>
        </Card>

        <Card style={{marginBottom:14}}>
          <h3 style={{...font("Oswald",14,600,C.white),marginBottom:6}}>🔑 Rental Vehicle Help</h3>
          <p style={{...font("DM Sans",12,400,C.muted),lineHeight:1.5,marginBottom:10}}>Need a rental while your car is being repaired? We coordinate with your insurance.</p>
          <Btn v="ghost" full>Request Rental Assistance</Btn>
        </Card>

        <div style={{background:`linear-gradient(135deg,${C.red}10,transparent)`,border:`1px solid ${C.red}18`,borderRadius:14,padding:18,textAlign:"center"}}>
          <span style={{fontSize:28}}>❤️‍🩹</span>
          <h3 style={{...font("Oswald",15,600,C.white),marginTop:6}}>Someone I Know Got Hurt</h3>
          <p style={{...font("DM Sans",11,400,C.muted),marginTop:4,marginBottom:10}}>Send them our way.</p>
          <Btn v="primary" full>Refer Someone</Btn>
        </div>
      </Section>
    </div>
  );
}

function CustDocs() {
  const [docs, setDocs] = useState([
    {name:"Insurance Card (Front)",s:"uploaded",d:"Mar 28"},{name:"Driver's License",s:"uploaded",d:"Mar 28"},
    {name:"Police Report",s:"pending",d:null},{name:"Accident Photos",s:"uploaded",d:"Mar 29"},
    {name:"SR-13 Form",s:"pending",d:null},{name:"Medical Records",s:"pending",d:null},
  ]);
  const upload = i => setDocs(p=>p.map((d,j)=>j===i?{...d,s:"uploaded",d:"Apr 2"}:d));
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Your Documents" sub="Upload, track, and manage case files.">
        <div style={{border:`2px dashed ${C.border}`,borderRadius:14,padding:24,textAlign:"center",marginBottom:18,cursor:"pointer"}}>
          <span style={{fontSize:28,display:"block",marginBottom:6}}>📤</span>
          <p style={{...font("DM Sans",13,600,C.chrome)}}>Tap to Upload</p>
          <p style={{...font("DM Sans",10,400,C.dim),marginTop:3}}>Photos, PDFs, or scanned documents</p>
        </div>
        {docs.map((doc,i)=>(
          <Card key={i} onClick={doc.s==="pending"?()=>upload(i):undefined} style={{marginBottom:8,padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>{doc.s==="uploaded"?"✅":"⏳"}</span>
              <div style={{flex:1}}>
                <p style={{...font("DM Sans",13,400,C.white)}}>{doc.name}</p>
                {doc.d&&<p style={{...font("DM Sans",10,400,C.dim),marginTop:1}}>Uploaded {doc.d}</p>}
              </div>
              <Badge text={doc.s==="uploaded"?"Received":"Tap to Upload"} color={doc.s==="uploaded"?C.green:C.orange} sm />
            </div>
          </Card>
        ))}
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════
// REP / AGENT PORTAL
// ═══════════════════════════════════════════

function RepDash({go}) {
  const newLeads = LEADS.filter(l=>l.status==="New"||l.status==="Callback Requested").length;
  const inTreatment = LEADS.filter(l=>l.status.includes("Treatment")).length;
  const todayAppts = APPTS.length;
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo size="sm" />
        <Badge text="Agent Portal" color={C.blue} />
      </div>
      <h2 style={{...font("Oswald",21,600,C.white),marginTop:16}}>Good morning, <span style={{color:C.blueLight}}>Agent</span></h2>
      <p style={{...font("DM Sans",12,400,C.muted),marginTop:3,marginBottom:16}}>Thursday, April 2, 2026</p>

      {/* Stats Row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[
          {n:newLeads,l:"New Leads",c:C.red,icon:"🔴"},
          {n:todayAppts,l:"Today's Appts",c:C.blue,icon:"📅"},
          {n:inTreatment,l:"In Treatment",c:C.green,icon:"💊"},
        ].map(s=>(
          <Card key={s.l} style={{textAlign:"center",padding:14}}>
            <span style={{fontSize:20}}>{s.icon}</span>
            <p style={{...font("Oswald",26,700,s.c),marginTop:4}}>{s.n}</p>
            <p style={{...font("DM Sans",9,500,C.muted),marginTop:2,letterSpacing:0.3}}>{s.l}</p>
          </Card>
        ))}
      </div>

      {/* Urgent Actions */}
      <Card style={{marginBottom:14,background:`linear-gradient(135deg,#180808,${C.bgCard})`,borderColor:`${C.red}20`}}>
        <h3 style={{...font("Oswald",14,600,C.redLight),marginBottom:10}}>🚨 Requires Attention</h3>
        {LEADS.filter(l=>l.urgency==="high").map(l=>(
          <div key={l.id} onClick={()=>go("leads")} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
            <div style={{width:32,height:32,borderRadius:8,background:`${C.red}15`,display:"flex",alignItems:"center",justifyContent:"center",...font("Oswald",12,600,C.red)}}>{l.name[0]}</div>
            <div style={{flex:1}}>
              <p style={{...font("DM Sans",13,500,C.white)}}>{l.name}</p>
              <p style={{...font("DM Sans",10,400,C.muted)}}>{l.status} · {l.date}</p>
            </div>
            <Badge text={l.status} color={l.status==="New"?C.red:C.orange} sm />
          </div>
        ))}
      </Card>

      {/* Today's Schedule */}
      <Card style={{marginBottom:14}}>
        <h3 style={{...font("Oswald",14,600,C.white),marginBottom:12}}>📅 Today's Appointments</h3>
        {APPTS.slice(0,3).map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{...font("Oswald",13,600,C.blue),minWidth:65}}>{a.time}</div>
            <div style={{flex:1}}>
              <p style={{...font("DM Sans",13,500,C.white)}}>{a.client}</p>
              <p style={{...font("DM Sans",10,400,C.muted)}}>{a.type} · {a.clinic}</p>
            </div>
            {a.transport&&<Badge text="🚗 Ride" color={C.orange} sm />}
          </div>
        ))}
        <Btn v="ghost" full small onClick={()=>go("schedule")} style={{marginTop:10}}>View Full Schedule →</Btn>
      </Card>

      {/* Quick Actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Btn v="blue" full icon="📞" onClick={()=>go("leads")}>Call Next Lead</Btn>
        <Btn v="secondary" full icon="📋" onClick={()=>go("cases")}>View Cases</Btn>
      </div>
    </div>
  );
}

function RepLeads({go}) {
  const [filter, setFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadStatuses, setLeadStatuses] = useState(
    Object.fromEntries(LEADS.map(l=>[l.id, l.status]))
  );

  const filtered = filter==="all"?LEADS:LEADS.filter(l=>{
    if(filter==="new") return leadStatuses[l.id]==="New"||leadStatuses[l.id]==="Callback Requested";
    if(filter==="active") return leadStatuses[l.id].includes("Treatment")||leadStatuses[l.id]==="Qualified";
    return true;
  });

  const advanceLead = (id) => {
    const order = ["New","Callback Requested","Contacted","Qualified","Treatment Setup","Active Treatment","Records Review","Settlement Pending"];
    setLeadStatuses(p => {
      const cur = p[id];
      const idx = order.indexOf(cur);
      const next = idx < order.length-1 ? order[idx+1] : cur;
      return {...p, [id]: next};
    });
  };

  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Lead Pipeline" sub={`${LEADS.length} total leads across all stages.`}>
        {/* Filter Pills */}
        <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto"}}>
          {[{k:"all",l:"All"},{k:"new",l:"🔴 New"},{k:"active",l:"Active"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{
              background:filter===f.k?C.blue+"20":C.bgCard, border:`1px solid ${filter===f.k?C.blue+"40":C.border}`,
              borderRadius:20, padding:"6px 14px", cursor:"pointer", whiteSpace:"nowrap",
              ...font("DM Sans",11,600,filter===f.k?C.blueLight:C.muted), transition:"all 0.2s"
            }}>{f.l}</button>
          ))}
        </div>

        {filtered.map(l=>(
          <Card key={l.id} onClick={()=>setSelectedLead(selectedLead===l.id?null:l.id)} style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:l.urgency==="high"?`${C.red}15`:C.bgInput,display:"flex",alignItems:"center",justifyContent:"center",...font("Oswald",14,700,l.urgency==="high"?C.red:C.chrome)}}>{l.name[0]}</div>
              <div style={{flex:1}}>
                <p style={{...font("DM Sans",14,500,C.white)}}>{l.name}</p>
                <p style={{...font("DM Sans",11,400,C.muted)}}>{l.phone} · {l.date}</p>
              </div>
              <Badge text={leadStatuses[l.id]} color={leadStatuses[l.id]==="New"?C.red:leadStatuses[l.id].includes("Treatment")?C.green:C.orange} sm />
            </div>
            {selectedLead===l.id && (
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                  {l.needs.map(n=><span key={n} style={{background:`${C.blue}12`,color:C.blueLight,...font("DM Sans",10,600),padding:"3px 8px",borderRadius:8}}>{n}</span>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  <Btn v="primary" small onClick={(e)=>{e.stopPropagation();window.open(`tel:${l.phone}`)}}>📞 Call</Btn>
                  <Btn v="secondary" small onClick={(e)=>{e.stopPropagation()}}>💬 SMS</Btn>
                  <Btn v="success" small onClick={(e)=>{e.stopPropagation();advanceLead(l.id)}}>Advance →</Btn>
                </div>
              </div>
            )}
          </Card>
        ))}
      </Section>
    </div>
  );
}

function RepSchedule() {
  const [confirms, setConfirms] = useState({});
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Today's Schedule" sub={`${APPTS.length} appointments scheduled for Thursday, April 2.`}>
        {APPTS.map(a=>(
          <Card key={a.id} style={{marginBottom:10}}>
            <div style={{display:"flex",gap:12}}>
              <div style={{textAlign:"center",minWidth:56}}>
                <p style={{...font("Oswald",16,700,C.blue)}}>{a.time.split(" ")[0]}</p>
                <p style={{...font("DM Sans",10,400,C.muted)}}>{a.time.split(" ")[1]}</p>
              </div>
              <div style={{flex:1}}>
                <p style={{...font("DM Sans",14,500,C.white)}}>{a.client}</p>
                <p style={{...font("DM Sans",12,400,C.chrome),marginTop:2}}>{a.type}</p>
                <p style={{...font("DM Sans",11,400,C.muted),marginTop:1}}>📍 {a.clinic}</p>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  {a.transport&&<Badge text="🚗 Transport Needed" color={C.orange} sm />}
                  {confirms[a.id]&&<Badge text="✓ Confirmed" color={C.green} sm />}
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:12}}>
              <Btn v={confirms[a.id]?"ghost":"success"} small onClick={()=>setConfirms(p=>({...p,[a.id]:!p[a.id]}))}>
                {confirms[a.id]?"Undo":"Confirm"}
              </Btn>
              <Btn v="secondary" small>Reschedule</Btn>
              <Btn v="secondary" small onClick={()=>window.open(`tel:`)}>📞 Call</Btn>
            </div>
          </Card>
        ))}
      </Section>
    </div>
  );
}

function RepCases() {
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Case Management" sub="All active cases and their current phase.">
        {LEADS.filter(l=>!["New","Callback Requested"].includes(l.status)).map(l=>{
          const phaseIdx = l.status==="In Treatment"||l.status==="Active Treatment"?1:l.status==="Qualified"?0:l.status==="Records Review"?2:1;
          return (
            <Card key={l.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <h3 style={{...font("Oswald",15,600,C.white)}}>{l.name}</h3>
                  <p style={{...font("DM Sans",11,400,C.muted),marginTop:2}}>{l.phone} · Since {l.date}</p>
                </div>
                <Badge text={PHASES[phaseIdx]} color={phaseIdx===0?C.orange:phaseIdx<=2?C.green:C.blue} />
              </div>
              <div style={{display:"flex",gap:2,marginBottom:10}}>
                {PHASES.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=phaseIdx?C.green:C.bgInput}}/>)}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                {l.needs.map(n=><span key={n} style={{background:`${C.blue}10`,color:C.blueLight,...font("DM Sans",9,600),padding:"2px 7px",borderRadius:6}}>{n}</span>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <Btn v="secondary" small>📄 Notes</Btn>
                <Btn v="secondary" small>📞 Call</Btn>
                <Btn v="blue" small>Update →</Btn>
              </div>
            </Card>
          );
        })}
      </Section>
    </div>
  );
}

function RepNotif() {
  const notifs = [
    {type:"urgent",icon:"🔴",msg:"New lead: Marcus Johnson needs callback",time:"2 min ago"},
    {type:"transport",icon:"🚗",msg:"Tamika Williams needs ride to Stonecrest at 10AM",time:"15 min ago"},
    {type:"appt",icon:"📅",msg:"David Chen confirmed PT Session #4 at Midtown",time:"30 min ago"},
    {type:"docs",icon:"📄",msg:"Angela Brooks uploaded police report",time:"1 hr ago"},
    {type:"case",icon:"⚖️",msg:"Keisha Davis case moved to Records Review",time:"2 hrs ago"},
    {type:"system",icon:"✅",msg:"Daily treatment reminders sent to all active clients",time:"6:00 AM"},
  ];
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Notifications" sub="Activity feed and alerts.">
        {notifs.map((n,i)=>(
          <Card key={i} style={{marginBottom:8,padding:14,borderLeft:n.type==="urgent"?`3px solid ${C.red}`:undefined}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,marginTop:2}}>{n.icon}</span>
              <div style={{flex:1}}>
                <p style={{...font("DM Sans",13,n.type==="urgent"?600:400,n.type==="urgent"?C.white:C.chrome),lineHeight:1.4}}>{n.msg}</p>
                <p style={{...font("DM Sans",10,400,C.dim),marginTop:3}}>{n.time}</p>
              </div>
            </div>
          </Card>
        ))}
      </Section>
    </div>
  );
}


// ═══════════════════════════════════════════
// MAIN APP SHELL
// ═══════════════════════════════════════════

const CUST_TABS = [
  {id:"help",icon:"🆘",label:"Help Now"},{id:"clinics",icon:"📍",label:"Clinics"},
  {id:"services",icon:"📋",label:"Services"},{id:"next",icon:"📖",label:"Next Steps"},
];
const CLIENT_TABS = [
  {id:"dashboard",icon:"🏠",label:"Home"},{id:"treatment",icon:"💊",label:"Treatment"},
  {id:"case",icon:"⚖️",label:"Case"},{id:"docs",icon:"📁",label:"Docs"},
  {id:"transport",icon:"🚗",label:"Rides"},
];
const REP_TABS = [
  {id:"rep-dash",icon:"📊",label:"Dashboard"},{id:"leads",icon:"🎯",label:"Leads"},
  {id:"schedule",icon:"📅",label:"Schedule"},{id:"cases",icon:"⚖️",label:"Cases"},
  {id:"notif",icon:"🔔",label:"Alerts"},
];

export default function Help911App() {
  const [mode, setMode] = useState("public"); // public | client | rep
  const [tab, setTab] = useState("help");

  const go = (t) => {
    // auto-switch mode if needed
    if(["dashboard","treatment","case","docs","transport"].includes(t) && mode==="public") setMode("client");
    if(["rep-dash","leads","schedule","cases","notif"].includes(t) && mode!=="rep") setMode("rep");
    if(t==="help" && mode==="client") setMode("public");
    setTab(t);
  };

  const switchMode = () => {
    if(mode==="public"){ setMode("client"); setTab("dashboard"); }
    else if(mode==="client"){ setMode("rep"); setTab("rep-dash"); }
    else { setMode("public"); setTab("help"); }
  };

  const tabs = mode==="rep"?REP_TABS:mode==="client"?CLIENT_TABS:CUST_TABS;
  const accent = mode==="rep"?C.blue:C.red;

  const screens = {
    help:<CustHelp go={go} switchMode={switchMode} />,
    clinics:<CustClinics />, services:<CustServices go={go} />, next:<CustNext />,
    dashboard:<CustDash go={go} />, treatment:<CustTreatment />,
    case:<CustCase />, docs:<CustDocs />, transport:<CustTransport />,
    "rep-dash":<RepDash go={go} />, leads:<RepLeads go={go} />,
    schedule:<RepSchedule />, cases:<RepCases />, notif:<RepNotif />,
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg}}
        ::-webkit-scrollbar{width:0}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1)}
        @supports(padding:env(safe-area-inset-top)){
          .safe-top{padding-top:env(safe-area-inset-top)}
        }
      `}</style>
      <div style={{maxWidth:430,margin:"0 auto",background:C.bg,minHeight:"100vh",position:"relative",fontFamily:"DM Sans,sans-serif",overflowX:"hidden"}}>
        {/* Status bar accent */}
        <div className="safe-top" style={{position:"sticky",top:0,zIndex:50,height:3,background:`linear-gradient(90deg,${accent},transparent)`}}/>

        {/* Mode Switcher */}
        <div style={{position:"fixed",top:8,right:8,zIndex:101,display:"flex",gap:4}}>
          {["public","client","rep"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setTab(m==="public"?"help":m==="client"?"dashboard":"rep-dash")}}
              style={{
                background:mode===m?(m==="rep"?`${C.blue}20`:m==="client"?`${C.green}20`:C.bgCard):C.bgCard,
                border:`1px solid ${mode===m?(m==="rep"?`${C.blue}40`:m==="client"?`${C.green}40`:C.border):C.border}`,
                color:mode===m?(m==="rep"?C.blueLight:m==="client"?C.green:C.muted):C.dim,
                ...font("DM Sans",9,600), padding:"5px 10px", borderRadius:16, cursor:"pointer",
                letterSpacing:0.4, textTransform:"uppercase", transition:"all 0.2s"
              }}>{m==="rep"?"🔵 Rep":m==="client"?"🟢 Client":"Public"}</button>
          ))}
        </div>

        {screens[tab] || screens.help}
        <NavBar tab={tab} setTab={go} tabs={tabs} accent={accent} />
      </div>
    </>
  );
}
