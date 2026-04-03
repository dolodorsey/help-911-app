import React, { useState, useEffect, useCallback, useRef } from "react";
import { submitLead, submitAttorneyIntake, fetchLeads, fetchAppointments, fetchLeadStats } from "./api.js";

// Haptic feedback for native iOS
const tap=async(s='Medium')=>{try{const{Haptics,ImpactStyle}=await import('@capacitor/haptics');await Haptics.impact({style:ImpactStyle[s]||ImpactStyle.Medium});}catch{}};

/* ═══ ERROR BOUNDARY ═══ */
class H911ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={hasError:false};}
  static getDerivedStateFromError(){return{hasError:true};}
  render(){
    if(this.state.hasError)return React.createElement('div',{style:{minHeight:'100vh',background:'#07080C',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",color:'#fff',padding:24,textAlign:'center'}},
      React.createElement('div',{style:{fontSize:40,marginBottom:16}},'\u26A0\uFE0F'),
      React.createElement('h2',{style:{fontSize:20,fontWeight:700,marginBottom:8}},'Something went wrong'),
      React.createElement('button',{onClick:()=>{this.setState({hasError:false});window.location.reload()},style:{background:'#ef4444',color:'#fff',border:'none',borderRadius:14,padding:'14px 32px',fontSize:16,fontWeight:700,cursor:'pointer'}},'Reload App')
    );
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELP 911 — RECOVERY CONCIERGE APP
// Customer + Rep Portal | iOS 26 Ready | All Screens Functional
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#08090E", bgCard: "#0E1018", bgCardHover: "#151722",
  bgInput: "#1A1C28", bgSurface: "#1E2030",
  // HELP 911 = RED/WHITE/BLUE (matching the logo)
  accent: "#D42B2B", accentGlow: "rgba(212,43,43,0.25)", accentLight: "#EF4444", accentDark: "#991B1B",
  blue: "#1E40AF", blueGlow: "rgba(30,64,175,0.25)", blueLight: "#3B82F6", blueDark: "#1E3A5F",
  // Chrome
  chrome: "#C8CDD8", chromeDim: "#9BA0B8", steel: "#A8B0C4",
  white: "#F5F6FA",
  muted: "#B0B8CC", dim: "#7A82A0",
  // Service pillar colors
  legal: "#C9A84C", legalGlow: "rgba(201,168,76,0.2)",      // The Esquire — gold
  chiro: "#D42B2B", chiroGlow: "rgba(212,43,43,0.2)",        // Hurt 911 — red
  mental: "#7C3AED", mentalGlow: "rgba(124,58,237,0.2)",      // Mind Studio — purple
  // Utilities
  green: "#10B981", orange: "#F59E0B", purple: "#7C3AED", red: "#D42B2B",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.12)",
  // Aliases
  get redGlow() { return this.accentGlow; },
  get redLight() { return this.accentLight; }, get redDark() { return this.accentDark; },
};

const font = (f="DM Sans", s=14, w=400, c=C.white) => ({
  fontFamily: `${f}, sans-serif`, fontSize: s, fontWeight: w, color: c, margin: 0
});

// ─── DATA (from 1800hurt911ga.com) ───
const CLINICS = [
  { id:1, name:"Downtown Atlanta", addr:"147 North Avenue NE, Atlanta GA 30308", area:"Atlanta / Midtown / Buckhead / East Atlanta", phone:"(404) 998-4223", svc:["Chiro","Accident Doctor","Whiplash","PT","X-Ray","MRI","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"2.1 mi" },
  { id:2, name:"Westside Atlanta", addr:"1465 Westwood Ave, Atlanta GA 30310", area:"Atlanta / West End / Cascade", phone:"(404) 334-5833", svc:["Chiro","Accident Doctor","PT","Diagnostics","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"4.8 mi" },
  { id:3, name:"Lithonia - Stonecrest", addr:"5700 Hillandale Dr #190, Lithonia GA 30058", area:"Lithonia / Stonecrest", phone:"(770) 501-5916", svc:["Chiro","Accident Doctor","Whiplash","PT","X-Ray","MRI","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"15.2 mi" },
  { id:4, name:"South DeKalb", addr:"1336 Columbia Drive, Suite B, Decatur GA 30032", area:"Decatur", phone:"(404) 900-0443", svc:["Chiro","Accident Doctor","PT","Diagnostics","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"6.3 mi" },
  { id:5, name:"Henry - Spaulding", addr:"1515 Pennsylvania Ave, McDonough GA 30253", area:"McDonough / Griffin / Locust Grove", phone:"(678) 276-7429", svc:["Chiro","Accident Doctor","PT","X-Ray","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"28.1 mi" },
  { id:6, name:"Clayton County", addr:"7147 Jonesboro Rd, Suite J, Morrow GA 30260", area:"Morrow / Jonesboro / Riverdale / Stockbridge", phone:"(678) 562-6063", svc:["Chiro","Accident Doctor","PT","Diagnostics","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"12.7 mi" },
  { id:7, name:"Lawrenceville", addr:"359 W Pike St, Lawrenceville GA 30046", area:"Lawrenceville / Gwinnett", phone:"(678) 338-8417", svc:["Chiro","Accident Doctor","PT","X-Ray","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"30.4 mi" },
  { id:8, name:"Chamblee", addr:"5255 Peachtree Blvd, Atlanta GA 30341", area:"Chamblee / Brookhaven", phone:"(770) 790-4916", svc:["Chiro","Accident Doctor","PT","Diagnostics","Attorney Referrals"], hrs:"Mon-Fri 9AM-6PM", dist:"11.2 mi" },
];

const ACCIDENT_TYPES = [
  {icon:"🚗",t:"Car Accidents"},{icon:"🚛",t:"Big Truck Accidents"},{icon:"🏍️",t:"Motorcycle Accidents"},
  {icon:"🚌",t:"MARTA Accidents"},{icon:"🛴",t:"Scooter Accidents"},{icon:"🚕",t:"Uber & Lyft Accidents"},
  {icon:"🚶",t:"Pedestrian Accidents"},{icon:"💥",t:"Hit & Run Accidents"},
  {icon:"⚠️",t:"Slip & Fall Accidents"},{icon:"🚲",t:"Bicycle Accidents"},{icon:"🍺",t:"Drunk Driving Accidents"},
];

const SERVICES = [
  {icon:"🩺",t:"Car Accident Doctor",d:"Specialized physicians trained in diagnosing and treating auto accident injuries."},
  {icon:"🦴",t:"Whiplash Chiropractor",d:"Expert chiropractic care for whiplash, spinal misalignment, and neck injuries."},
  {icon:"💪",t:"Physical Therapy",d:"Rehabilitation programs to restore mobility, strength, and function after injury."},
  {icon:"⚖️",t:"Attorney Referrals",d:"Connected to top personal injury attorneys who fight for your compensation."},
  {icon:"🔬",t:"Diagnostics",d:"Comprehensive diagnostic services including on-site evaluation."},
  {icon:"📡",t:"MRI / X-Ray",d:"Advanced imaging to identify fractures, soft tissue damage, and internal injuries."},
  {icon:"🚗",t:"Free Transportation",d:"Complimentary rides to and from your appointments — no excuses to miss treatment."},
  {icon:"🔑",t:"Rental Car Assistance",d:"Help securing and covering the costs of a rental car through insurance."},
];

const TESTIMONIALS = [
  {name:"Antione Lewis",text:"I was in a car accident on the highway and immediately called. They made sure I was ok, scheduled treatment near me in Decatur, and had an attorney handle my legal case. They managed the entire process and helped me get a great settlement."},
  {name:"Pastor Troy",text:"I've had a few accidents over the years and always called. The doctor always got me squared away with professional care and attention. They got me back whole and the attorneys got me paid!"},
  {name:"Shay Mccray",text:"When my son was in an accident I called and they were there on the first ring. Finding a lawyer, going to the doctor, lost wages — they took care of everything for me. I made only one call and they started working on my behalf."},
];

const STATS = {label:"Voted Best of Georgia 2025",rating:"4.8",reviews:"816",cases:"Tens of Thousands",recovered:"Hundreds of Millions"};

const DEMO_LEADS = [
  { id:1, name:"Marcus Johnson", phone:"(404) 555-1234", date:"Apr 1", needs:["Treatment","Attorney"], status:"New", urgency:"high" },
  { id:2, name:"Tamika Williams", phone:"(770) 555-5678", date:"Mar 31", needs:["Transportation","Treatment"], status:"Callback Requested", urgency:"high" },
  { id:3, name:"David Chen", phone:"(678) 555-9012", date:"Mar 30", needs:["Treatment"], status:"In Treatment", urgency:"med" },
  { id:4, name:"Angela Brooks", phone:"(404) 555-3456", date:"Mar 29", needs:["Attorney","Transportation"], status:"Qualified", urgency:"med" },
  { id:5, name:"Robert Jackson", phone:"(770) 555-7890", date:"Mar 28", needs:["Treatment"], status:"Active Treatment", urgency:"low" },
  { id:6, name:"Keisha Davis", phone:"(678) 555-2345", date:"Mar 27", needs:["Treatment","Attorney"], status:"Records Review", urgency:"low" },
];

const DEMO_APPTS = [
  { id:1, client:"Marcus Johnson", time:"10:00 AM", clinic:"Stonecrest", type:"Initial Eval", transport:true },
  { id:2, client:"David Chen", time:"11:30 AM", clinic:"Midtown Care", type:"PT Session #4", transport:false },
  { id:3, client:"Keisha Davis", time:"2:00 PM", clinic:"Decatur Recovery", type:"Chiro Follow-up", transport:true },
  { id:4, client:"Robert Jackson", time:"3:30 PM", clinic:"South DeKalb", type:"MRI Review", transport:false },
];

// These get replaced by real Supabase data when the rep portal loads
let LEADS = DEMO_LEADS;
let APPTS = DEMO_APPTS;

const PHASES = ["Intake","In Treatment","Records","Case Build","Demand","Negotiation","Settlement"];

// ─── COMPONENTS ───
function Logo({ size="md" }) {
  const h = size==="sm"?28:size==="lg"?52:36;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <img src="/help911-logo.png" alt="HELP 911" style={{ height:h, width:h, objectFit:"contain", borderRadius:6 }}
        onError={(e)=>{e.target.style.display='none'}} />
      <div style={{ lineHeight:1.1 }}>
        <span style={{ fontFamily:"Oswald,sans-serif", fontWeight:700, fontSize:h*0.55, color:C.white, letterSpacing:1 }}>
          HELP <span style={{color:C.accent}}>911</span>
        </span>
        {size!=="sm" && <span style={{ display:"block", fontFamily:"DM Sans,sans-serif", fontSize:h*0.22, color:C.chromeDim, letterSpacing:2.5, textTransform:"uppercase" }}>
          Recovery Concierge
        </span>}
      </div>
    </div>
  );
}

// ─── SHIELD BUTTON (premium badge-style action buttons) ───
function ShieldBtn({ icon, label, sub, color, glow, onClick, size="lg" }) {
  const [hover, setHover] = useState(false);
  const sz = size==="lg"?{w:"100%",h:120,iconSz:36,labelSz:15,subSz:10}:{w:"100%",h:100,iconSz:28,labelSz:13,subSz:9};
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        width:sz.w, height:sz.h, borderRadius:16, cursor:"pointer",
        background:`linear-gradient(145deg, ${color}18, ${C.bgCard})`,
        border:`1.5px solid ${hover?`${color}50`:`${color}25`}`,
        boxShadow:hover?`0 8px 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)`:`0 2px 12px ${glow}`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
        transition:"all 0.25s ease", position:"relative", overflow:"hidden",
      }}>
      {/* Chrome edge highlight */}
      <div style={{position:"absolute",top:0,left:"20%",right:"20%",height:1,background:`linear-gradient(90deg,transparent,${C.chrome}30,transparent)`}} />
      <div style={{
        width:sz.iconSz+16, height:sz.iconSz+16, borderRadius:12,
        background:`linear-gradient(135deg, ${color}30, ${color}10)`,
        border:`1px solid ${color}40`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:sz.iconSz, boxShadow:`0 4px 16px ${glow}`,
      }}>{icon}</div>
      <span style={{fontFamily:"Oswald,sans-serif",fontWeight:700,fontSize:sz.labelSz,color:C.white,letterSpacing:1,textTransform:"uppercase"}}>{label}</span>
      {sub && <span style={{fontFamily:"DM Sans,sans-serif",fontSize:sz.subSz,color:C.muted,marginTop:-2}}>{sub}</span>}
    </div>
  );
}

function Btn({ children, v="primary", onClick, icon, full, small, disabled }) {
  const [h, setH] = useState(false);
  const styles = {
    primary: { bg: h?C.accentLight:`linear-gradient(135deg,${C.accent},${C.accentDark})`, c:"#fff", b:"none", sh:h?`0 6px 28px ${C.accentGlow}`:"0 2px 12px rgba(212,43,43,0.2)" },
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
      opacity:active?1:0.6, transition:"opacity 0.2s", WebkitTapHighlightColor:"transparent",
      padding:"4px 2px", minWidth:52 }}>
      <span style={{fontSize:18}}>{icon}</span>
      <span style={{...font("DM Sans",9,active?700:400,active?accent:C.muted), letterSpacing:0.4}}>{label}</span>
    </button>
  );
}

function NavBar({ tab, setTab, tabs, accent }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(4,5,10,0.96)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-around",
      padding:"8px 0 env(safe-area-inset-bottom, 22px)", zIndex:100, maxWidth:480, margin:"0 auto" }}>
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
  const [view, setView] = useState("hero"); // hero | form
  const [form, setForm] = useState({});
  const [checks, setChecks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toggleCheck = k => setChecks(p=>({...p,[k]:!p[k]}));

  const handleSubmit = async () => {
    tap('Heavy');
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      const names = (form.name || "").split(" ");
      await submitLead({
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        phone: form.phone,
        city: form.city || "Atlanta",
        accidentDate: form.date || null,
        needsAttorney: !!checks["Need Attorney"],
        needsTreatment: !!checks["Need Treatment"],
        needsTransportation: !!checks["Need Transportation"] || false,
        notSure: !!checks["Not Sure"],
        source: "app",
      });
    } catch(e) { console.error(e); }
    setLoading(false);
    setSubmitted(true);
  };

  // ─── SHARED: Full-bleed dark smoky background ───
  const BG = ({children, img="/help911-bg.jpg"}) => (
    <div style={{position:"relative",minHeight:"100vh",paddingBottom:110}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:0}}>
        <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, rgba(4,4,10,0.4) 0%, rgba(4,4,10,0.25) 25%, rgba(4,4,10,0.55) 55%, rgba(4,4,10,0.92) 75%, rgba(4,4,10,1) 100%)"}} />
      </div>
      <div style={{position:"relative",zIndex:1}}>{children}</div>
    </div>
  );

  // ═══ HERO SCREEN (Image 2 mockup) ═══
  if(view==="hero") return (
    <BG>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 24px",paddingTop:50}}>

        {/* ── HELP 911 Shield Logo ── */}
        <div style={{position:"relative",marginBottom:8}}>
          {/* Siren glow */}
          <div style={{position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",width:70,height:35,background:"radial-gradient(ellipse, rgba(212,43,43,0.6) 0%, rgba(30,64,175,0.4) 50%, transparent 80%)",filter:"blur(12px)",zIndex:2}} />
          {/* Siren icon */}
          <div style={{position:"relative",zIndex:3,textAlign:"center",marginBottom:-10}}>
            <span style={{fontSize:40}}>🚨</span>
          </div>
          {/* Shield background */}
          <div style={{
            position:"relative",zIndex:1,width:260,padding:"28px 20px 22px",textAlign:"center",
            background:"linear-gradient(170deg, rgba(30,64,175,0.35) 0%, rgba(15,18,32,0.9) 40%, rgba(212,43,43,0.2) 100%)",
            border:"2px solid rgba(200,210,230,0.2)",
            borderRadius:20,
            boxShadow:"0 0 60px rgba(212,43,43,0.15), 0 0 60px rgba(30,64,175,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}>
            {/* Chrome border top accent */}
            <div style={{position:"absolute",top:-1,left:"15%",right:"15%",height:2,background:"linear-gradient(90deg,transparent,rgba(200,210,230,0.5),transparent)",borderRadius:2}} />
            {/* Stars row */}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8}}>
              {[...Array(5)].map((_,i)=><span key={i} style={{color:"rgba(220,225,240,0.8)",fontSize:10}}>★</span>)}
            </div>
            {/* HELP 911 text */}
            <div style={{fontFamily:"Oswald,sans-serif",fontWeight:900,fontSize:52,lineHeight:0.95,letterSpacing:2,marginBottom:6}}>
              <span style={{color:"#E8E8EE",textShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>HELP</span><br/>
              <span style={{
                background:"linear-gradient(180deg, #D42B2B 30%, #8B1A1A 100%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                filter:"drop-shadow(0 2px 4px rgba(212,43,43,0.5))",
                fontSize:64, letterSpacing:4,
              }}>911</span>
            </div>
            {/* Red/blue bar */}
            <div style={{height:3,borderRadius:2,margin:"8px auto",width:"80%",background:"linear-gradient(90deg, #D42B2B, #1E40AF)"}} />
          </div>
        </div>

        {/* ── TAGLINE ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12,marginBottom:28}}>
          <div style={{height:1,width:30,background:"linear-gradient(90deg,transparent,rgba(200,210,230,0.3))"}} />
          <span style={{fontFamily:"DM Sans,sans-serif",fontSize:10,fontWeight:600,letterSpacing:3,color:"rgba(220,225,240,0.75)",textTransform:"uppercase"}}>Emergency Service Recovery Assistance</span>
          <div style={{height:1,width:30,background:"linear-gradient(90deg,rgba(200,210,230,0.3),transparent)"}} />
        </div>

        {/* ── 3 SERVICE SHIELDS ── */}
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:28,width:"100%",maxWidth:340}}>
          {[
            {icon:"📞",label:"CALL\n911",color:"#D42B2B",glow:"rgba(212,43,43,0.35)",action:()=>window.open("tel:18004878911")},
            {icon:"⚖️",label:"ATTORNEY",color:"#C9A84C",glow:"rgba(201,168,76,0.25)",action:()=>go("attorney")},
            {icon:"🧠",label:"MENTAL\nHEALTH",color:"#3B82F6",glow:"rgba(59,130,246,0.3)",action:()=>go("services")},
          ].map((s,i)=>(
            <button key={i} onClick={s.action} style={{
              flex:1,border:"none",cursor:"pointer",
              background:`linear-gradient(160deg, ${s.color}30, rgba(14,16,24,0.9))`,
              borderRadius:16,padding:"18px 8px",textAlign:"center",
              boxShadow:`0 4px 24px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              borderWidth:1.5,borderStyle:"solid",borderColor:`${s.color}40`,
              position:"relative",overflow:"hidden",
            }}>
              {/* Chrome highlight */}
              <div style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)`}} />
              <div style={{
                width:52,height:52,margin:"0 auto 8px",borderRadius:14,
                background:`linear-gradient(135deg, ${s.color}40, ${s.color}15)`,
                border:`1.5px solid ${s.color}50`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:26,boxShadow:`0 4px 16px ${s.glow}`,
              }}>{s.icon}</div>
              <div style={{fontFamily:"Oswald,sans-serif",fontSize:11,fontWeight:700,color:"#E8E8EE",letterSpacing:1.5,lineHeight:1.3,textTransform:"uppercase",whiteSpace:"pre-line"}}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* ── FIND A CLINIC button ── */}
        <button onClick={()=>go("clinics")} style={{
          width:"100%",maxWidth:340,padding:"16px 20px",borderRadius:14,border:"1px solid rgba(255,255,255,0.12)",
          background:"rgba(14,16,24,0.85)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,
          marginBottom:10,backdropFilter:"blur(8px)",
        }}>
          <span style={{fontSize:20}}>📍</span>
          <span style={{fontFamily:"Oswald,sans-serif",fontSize:15,fontWeight:600,color:"#E8E8EE",letterSpacing:1.5,textTransform:"uppercase"}}>Find a Clinic</span>
        </button>

        {/* ── MY CASE STATUS button ── */}
        <button onClick={()=>switchMode()} style={{
          width:"100%",maxWidth:340,padding:"16px 20px",borderRadius:14,border:"1px solid rgba(255,255,255,0.12)",
          background:"rgba(14,16,24,0.85)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,
          marginBottom:20,backdropFilter:"blur(8px)",
        }}>
          <span style={{fontSize:20}}>📊</span>
          <span style={{fontFamily:"Oswald,sans-serif",fontSize:15,fontWeight:600,color:"#E8E8EE",letterSpacing:1.5,textTransform:"uppercase"}}>My Case Status</span>
        </button>

        {/* ── GET HELP NOW CTA (goes to form) ── */}
        <button onClick={()=>setView("form")} style={{
          width:"100%",maxWidth:340,padding:"16px",borderRadius:14,border:"none",cursor:"pointer",
          background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,
          boxShadow:`0 6px 28px ${C.accentGlow}`,
          fontFamily:"Oswald,sans-serif",fontSize:16,fontWeight:700,color:"#fff",letterSpacing:1.5,textTransform:"uppercase",
        }}>🆘 Get Help Now</button>

      </div>
    </BG>
  );

  // ═══ FORM SCREEN (Image 1 mockup) ═══
  return (
    <BG>
      <div style={{padding:"0 20px",paddingTop:30}}>
        {/* Back arrow */}
        <button onClick={()=>{setView("hero");setSubmitted(false)}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,fontFamily:"DM Sans,sans-serif",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:18}}>←</span> Back
        </button>

        {/* Siren at top */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{position:"relative",display:"inline-block"}}>
            <div style={{position:"absolute",top:-5,left:"50%",transform:"translateX(-50%)",width:120,height:40,background:"radial-gradient(ellipse, rgba(212,43,43,0.5) 0%, rgba(30,64,175,0.3) 50%, transparent 80%)",filter:"blur(14px)"}} />
            <span style={{fontSize:50,position:"relative",zIndex:1}}>🚨</span>
          </div>
          {/* Red/blue light bar */}
          <div style={{height:2,borderRadius:1,margin:"6px auto 0",width:200,background:"linear-gradient(90deg, #D42B2B, rgba(30,64,175,0.8), #D42B2B)",opacity:0.7}} />
        </div>

        {/* Form Card */}
        <div style={{
          background:"rgba(14,16,24,0.88)",border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:18,padding:"24px 20px",backdropFilter:"blur(12px)",
          boxShadow:"0 8px 40px rgba(0,0,0,0.5)",
        }}>
          {submitted ? (
            <div style={{textAlign:"center",padding:20}}>
              <span style={{fontSize:52,display:"block",marginBottom:12}}>✅</span>
              <h3 style={{...font("Oswald",22,700,C.white),marginBottom:8}}>We Got You.</h3>
              <p style={{...font("DM Sans",14,400,C.muted),lineHeight:1.6}}>A Help 911 agent will call you back within minutes.</p>
              <button onClick={()=>{setSubmitted(false);setForm({});setChecks({})}} style={{
                marginTop:18,background:"none",border:`1px solid ${C.border}`,borderRadius:12,
                padding:"12px 24px",color:C.chrome,fontFamily:"DM Sans",fontSize:13,fontWeight:600,cursor:"pointer",
              }}>Submit Another</button>
            </div>
          ) : (<>
            <h2 style={{fontFamily:"Oswald,sans-serif",fontSize:24,fontWeight:700,color:C.white,textAlign:"center",marginBottom:4}}>Get Help Now</h2>
            <p style={{fontFamily:"DM Sans,sans-serif",fontSize:12,color:C.muted,textAlign:"center",marginBottom:20}}>Fill out and an agent calls you back fast.</p>

            <Inp label="Your Name" placeholder="Full name" icon="👤" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            <Inp label="Phone Number" placeholder="(___) ___-____" type="tel" icon="📱" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
            <Inp label="Accident Date" type="date" icon="📅" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
              {[{l:"Need Attorney",c:C.legal},{l:"Need Treatment",c:C.chiro},{l:"Need Mental Health",c:C.mental},{l:"Not Sure",c:C.accent}].map(opt=>(
                <label key={opt.l} onClick={()=>toggleCheck(opt.l)} style={{
                  display:"flex",alignItems:"center",gap:8,
                  background:checks[opt.l]?`${opt.c}15`:"rgba(26,28,40,0.8)",
                  border:`1px solid ${checks[opt.l]?`${opt.c}50`:"rgba(255,255,255,0.08)"}`,
                  borderRadius:10,padding:"11px 12px",cursor:"pointer",transition:"all 0.2s",
                  fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:500,color:checks[opt.l]?C.white:C.chrome,
                }}>
                  <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checks[opt.l]?opt.c:"rgba(107,112,133,0.5)"}`,
                    background:checks[opt.l]?opt.c:"transparent",display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:9,color:"#fff",transition:"all 0.2s",flexShrink:0}}>
                    {checks[opt.l]?"✓":""}
                  </div>
                  {opt.l}
                </label>
              ))}
            </div>

            {/* Red submit button */}
            <button onClick={handleSubmit} disabled={loading || !form.name || !form.phone} style={{
              width:"100%",padding:"16px",borderRadius:12,border:"none",cursor:loading||!form.name||!form.phone?"not-allowed":"pointer",
              background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,
              boxShadow:`0 6px 28px ${C.accentGlow}`,
              fontFamily:"Oswald,sans-serif",fontSize:17,fontWeight:700,color:"#fff",letterSpacing:1,
              opacity:loading||!form.name||!form.phone?0.5:1,transition:"all 0.2s",
            }}>{loading ? "Submitting..." : "Get Help Now"}</button>
          </>)}
        </div>

        {/* Someone I Know Got Hurt */}
        <button onClick={()=>{}} style={{
          width:"100%",marginTop:14,padding:"15px 20px",borderRadius:14,
          background:"rgba(14,16,24,0.8)",border:"1px solid rgba(255,255,255,0.1)",
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          fontFamily:"DM Sans,sans-serif",fontSize:14,fontWeight:600,color:C.chrome,
          backdropFilter:"blur(8px)",
        }}>
          <span>❤️</span> Someone I Know Got Hurt
        </button>
      </div>
    </BG>
  );
}

function CustClinics() {
  const [sel, setSel] = useState(null);
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <Section title="Find a Clinic Near You" sub="8 injury centers across Georgia. Free transportation available.">
        <div style={{background:`linear-gradient(135deg,${C.bgSurface},${C.bg})`,borderRadius:14,
          height:140,display:"flex",alignItems:"center",justifyContent:"center",
          border:`1px solid ${C.border}`,marginBottom:18,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 40% 50%,${C.redGlow},transparent 60%)`}}/>
          <div style={{textAlign:"center",zIndex:1}}>
            <span style={{fontSize:32}}>📍</span>
            <p style={{...font("Oswald",18,600,C.white),marginTop:6}}>8 Locations Across Georgia</p>
            <p style={{...font("DM Sans",11,400,C.muted),marginTop:2}}>Free transportation to every location</p>
          </div>
        </div>
        {CLINICS.map(c=>(
          <Card key={c.id} onClick={()=>setSel(sel===c.id?null:c.id)} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <h3 style={{...font("Oswald",15,600,C.white)}}>{c.name}</h3>
                <p style={{...font("DM Sans",11,400,C.muted),marginTop:2}}>{c.area||c.addr}</p>
              </div>
              <Badge text={c.dist} color={C.blue} sm />
            </div>
            {sel===c.id&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                <p style={{...font("DM Sans",12,400,C.chrome),marginBottom:3}}>📍 {c.addr}</p>
                <p style={{...font("DM Sans",12,400,C.chrome),marginBottom:3}}>📞 {c.phone}</p>
                <p style={{...font("DM Sans",12,400,C.chrome),marginBottom:8}}>🕐 {c.hrs}</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                  {c.svc.map(s=><span key={s} style={{background:`${C.red}12`,color:C.redLight,...font("DM Sans",9,600),padding:"3px 8px",borderRadius:10}}>{s}</span>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  <Btn v="primary" small onClick={(e)=>{e.stopPropagation();window.open(`tel:${c.phone.replace(/\D/g,'')}`)}}>📞 Call</Btn>
                  <Btn v="success" small onClick={(e)=>{e.stopPropagation()}}>Book Visit</Btn>
                  <Btn v="secondary" small icon="🚗" onClick={(e)=>{e.stopPropagation()}}>Ride</Btn>
                </div>
              </div>
            )}
          </Card>
        ))}
        <Card style={{marginTop:8,textAlign:"center",padding:16,background:`linear-gradient(135deg,${C.bgCard},${C.bgSurface})`}}>
          <p style={{...font("DM Sans",12,400,C.chrome)}}>🚗 Can't get to a clinic?</p>
          <p style={{...font("Oswald",15,600,C.white),marginTop:4}}>FREE TRANSPORTATION</p>
          <p style={{...font("DM Sans",11,400,C.muted),marginTop:4,marginBottom:10}}>If you're unable to drive due to injury or vehicle damage, we'll arrange your ride.</p>
          <Btn v="primary" full onClick={()=>window.open("tel:18004878911")}>Call for a Ride</Btn>
        </Card>
      </Section>
    </div>
  );
}

function CustServices({go}) {
  const [showAccidents, setShowAccidents] = useState(false);
  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />

      {/* Trust Badge */}
      <Card style={{marginTop:16,marginBottom:16,textAlign:"center",padding:14,background:`linear-gradient(135deg,#1A1408,${C.bgCard})`}}>
        <p style={{...font("Oswald",13,600,C.orange),letterSpacing:1}}>⭐ {STATS.label}</p>
        <p style={{...font("DM Sans",11,400,C.muted),marginTop:4}}>Rated {STATS.rating}/5 based on {STATS.reviews} reviews</p>
      </Card>

      <Section title="Our Services" sub="Georgia chiropractors, accident doctors, and attorney referrals. Zero out-of-pocket costs.">
        {SERVICES.map((s,i)=>(
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
      </Section>

      {/* Accident Types */}
      <Section title="Accidents We Help With" right={
        <button onClick={()=>setShowAccidents(!showAccidents)} style={{background:"none",border:"none",cursor:"pointer",...font("DM Sans",11,600,C.red)}}>{showAccidents?"Hide":"Show All"}</button>
      }>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {(showAccidents ? ACCIDENT_TYPES : ACCIDENT_TYPES.slice(0,6)).map((a,i)=>(
            <Card key={i} style={{padding:12,textAlign:"center"}}>
              <span style={{fontSize:22,display:"block",marginBottom:4}}>{a.icon}</span>
              <span style={{...font("DM Sans",10,500,C.chrome)}}>{a.t}</span>
            </Card>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section title="From Our Patients">
        {TESTIMONIALS.map((t,i)=>(
          <Card key={i} style={{marginBottom:10}}>
            <div style={{display:"flex",gap:4,marginBottom:8}}>
              {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:12,color:"#F59E0B"}}>★</span>)}
            </div>
            <p style={{...font("DM Sans",12,400,C.chrome),lineHeight:1.6,fontStyle:"italic"}}>"{t.text}"</p>
            <p style={{...font("Oswald",13,600,C.white),marginTop:8}}>— {t.name}</p>
          </Card>
        ))}
      </Section>

      {/* Key Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[{n:STATS.cases,l:"Cases Handled",icon:"📋"},{n:STATS.recovered,l:"Dollars Recovered",icon:"💰"},{n:"8",l:"Georgia Locations",icon:"📍"},{n:"24/7",l:"Support Available",icon:"📞"}].map(s=>(
          <Card key={s.l} style={{textAlign:"center",padding:14}}>
            <span style={{fontSize:20}}>{s.icon}</span>
            <p style={{...font("Oswald",16,700,C.red),marginTop:4}}>{s.n}</p>
            <p style={{...font("DM Sans",10,400,C.muted),marginTop:2}}>{s.l}</p>
          </Card>
        ))}
      </div>

      <Btn v="primary" full icon="📞" onClick={()=>window.open("tel:18004878911")}>Call 1-800-HELP-911</Btn>
      <div style={{marginTop:10}}>
        <Btn v="ghost" full icon="⚖️" onClick={()=>window.open("tel:18004878911")}>I Need an Attorney</Btn>
      </div>
    </div>
  );
}

function CustNext() {
  const steps = [
    {icon:"📞",t:"Call Help 911",d:"After your accident, one call sets everything in motion. We respond 24/7 with real agents, not automated systems."},
    {icon:"⚖️",t:"We set you up with an attorney",d:"We connect you with a personal injury attorney and schedule your medical evaluation immediately."},
    {icon:"🏥",t:"Get treated at zero cost",d:"Visit one of our 8 convenient Georgia locations. Zero out-of-pocket costs to you — we handle insurance."},
    {icon:"💊",t:"Continue your treatment plan",d:"Follow your doctor's recommended care — chiropractic, physical therapy, MRI, diagnostics — until you're recovered."},
    {icon:"💰",t:"Get the compensation you deserve",d:"We work with your lawyer so you get the money you deserve. Get better. Get paid."},
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
  const [realLeads, setRealLeads] = useState(null);
  const [realAppts, setRealAppts] = useState(null);
  useEffect(()=>{
    fetchLeads().then(d=>{if(d.length>0){LEADS=d;setRealLeads(d);}else setRealLeads(DEMO_LEADS);});
    fetchAppointments().then(d=>{if(d.length>0){APPTS=d;setRealAppts(d);}else setRealAppts(DEMO_APPTS);});
  },[]);
  const activeLeads = realLeads || LEADS;
  const activeAppts = realAppts || APPTS;
  const newLeads = activeLeads.filter(l=>l.status==="New"||l.status==="Callback Requested").length;
  const inTreatment = activeLeads.filter(l=>(l.status||'').includes("Treatment")).length;
  const todayAppts = activeAppts.length;
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
        {activeLeads.filter(l=>l.urgency==="high").map(l=>(
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
        {activeAppts.slice(0,3).map(a=>(
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

// ═══════════════════════════════════════════
// ATTORNEY INTAKE — MULTI-STEP SIGN UP
// ═══════════════════════════════════════════
function CustAttorney({ go }) {
  const [step, setStep] = useState(1);
  const [d, setD] = useState({});
  const [docs, setDocs] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const u = (k,v) => setD(p=>({...p,[k]:v}));
  const totalSteps = 6;

  const handleAttorneySubmit = async () => {
    if (!d.callbackDate || !d.callbackTime) return;
    tap('Heavy');
    setLoading(true);
    try {
      await submitAttorneyIntake(d);
    } catch(e) { console.error(e); }
    setLoading(false);
    setSubmitted(true);
  };

  const StepBar = () => (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <p style={{...font("DM Sans",11,600,C.muted)}}>Step {step} of {totalSteps}</p>
        {step > 1 && <button onClick={()=>setStep(step-1)} style={{background:"none",border:"none",cursor:"pointer",...font("DM Sans",11,600,C.red)}}>← Back</button>}
      </div>
      <div style={{display:"flex",gap:4}}>
        {Array.from({length:totalSteps}).map((_,i)=>(
          <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<step?C.red:i===step-1?C.redLight:C.bgInput,transition:"background 0.3s"}} />
        ))}
      </div>
    </div>
  );

  const Opt = ({label, val, field, icon}) => {
    const active = d[field] === val;
    return (
      <div onClick={()=>u(field,val)} style={{
        display:"flex",alignItems:"center",gap:10,background:active?`${C.red}12`:C.bgInput,
        border:`1px solid ${active?`${C.red}40`:C.border}`,borderRadius:10,padding:"12px 14px",
        cursor:"pointer",transition:"all 0.2s"
      }}>
        {icon && <span style={{fontSize:18}}>{icon}</span>}
        <span style={{...font("DM Sans",13,active?600:400,active?C.white:C.chrome)}}>{label}</span>
        <div style={{marginLeft:"auto",width:18,height:18,borderRadius:9,border:`2px solid ${active?C.red:C.chromeDim}`,background:active?C.red:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {active && <div style={{width:6,height:6,borderRadius:3,background:"#fff"}} />}
        </div>
      </div>
    );
  };

  if (submitted) return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />
      <div style={{textAlign:"center",paddingTop:40}}>
        <div style={{width:80,height:80,borderRadius:20,background:`${C.green}15`,border:`2px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 20px"}}>✅</div>
        <h2 style={{...font("Oswald",24,700,C.white)}}>You're All Set.</h2>
        <p style={{...font("DM Sans",14,400,C.chrome),marginTop:10,lineHeight:1.6}}>
          Your attorney consultation is scheduled for<br/>
          <strong style={{color:C.white}}>{d.callbackDate || "tomorrow"}</strong> — <strong style={{color:C.green}}>{d.callbackTime === "morning" ? "9:00 - 12:00 PM" : d.callbackTime === "afternoon" ? "12:00 - 4:00 PM" : "4:00 - 7:00 PM"}</strong>
        </p>
        <Card style={{marginTop:20,textAlign:"left"}}>
          <p style={{...font("DM Sans",11,500,C.muted),letterSpacing:0.5}}>YOUR INTAKE ID</p>
          <p style={{...font("Oswald",20,700,C.red),marginTop:4}}>H911-ATT-{String(Date.now()).slice(-6)}</p>
          <p style={{...font("DM Sans",12,400,C.muted),marginTop:8}}>Save this number. Your agent will reference it on your call.</p>
        </Card>
        <Card style={{marginTop:12,textAlign:"left"}}>
          <h4 style={{...font("Oswald",14,600,C.white),marginBottom:8}}>What Happens Next</h4>
          {["A Help 911 agent will call you at your scheduled time","They'll review your case details and uploaded documents","You'll be matched with the right personal injury attorney","Your attorney consultation is free — zero out of pocket"].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
              <span style={{color:C.green,fontSize:12,marginTop:2}}>✓</span>
              <p style={{...font("DM Sans",12,400,C.chrome),lineHeight:1.5}}>{s}</p>
            </div>
          ))}
        </Card>
        <div style={{marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn v="secondary" onClick={()=>go("help")}>Back to Home</Btn>
          <Btn v="primary" onClick={()=>window.open("tel:18004878911")}>📞 Call Now</Btn>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{padding:"20px 18px 110px"}}>
      <Logo size="sm" />

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:16,marginBottom:16}}>
        <div style={{width:40,height:40,borderRadius:12,background:`${C.red}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⚖️</div>
        <div>
          <h2 style={{...font("Oswald",20,600,C.white)}}>Attorney Sign-Up</h2>
          <p style={{...font("DM Sans",12,400,C.muted)}}>Free consultation. Zero out-of-pocket cost.</p>
        </div>
      </div>

      {/* Or call/text bar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <Btn v="ghost" small icon="📞" onClick={()=>window.open("tel:18004878911")}>Call Instead</Btn>
        <Btn v="ghost" small icon="💬" onClick={()=>window.open("sms:18004878911")}>Text Instead</Btn>
      </div>

      <StepBar />

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <Card>
          <h3 style={{...font("Oswald",16,600,C.white),marginBottom:4}}>Your Information</h3>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:16}}>We need a few basics to get started.</p>
          <Inp label="First Name *" placeholder="First name" icon="👤" value={d.firstName} onChange={e=>u("firstName",e.target.value)} />
          <Inp label="Last Name" placeholder="Last name" icon="👤" value={d.lastName} onChange={e=>u("lastName",e.target.value)} />
          <Inp label="Phone Number *" placeholder="(___) ___-____" type="tel" icon="📱" value={d.phone} onChange={e=>u("phone",e.target.value)} />
          <Inp label="Email" placeholder="email@example.com" type="email" icon="✉️" value={d.email} onChange={e=>u("email",e.target.value)} />
          <Inp label="City" placeholder="Atlanta, GA" icon="📍" value={d.city} onChange={e=>u("city",e.target.value)} />
          <Btn v="primary" full onClick={()=>d.firstName && d.phone ? setStep(2) : null} disabled={!d.firstName || !d.phone}>Continue →</Btn>
        </Card>
      )}

      {/* STEP 2: Accident Details */}
      {step === 2 && (
        <Card>
          <h3 style={{...font("Oswald",16,600,C.white),marginBottom:4}}>About the Accident</h3>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:16}}>Tell us what happened so we can match you with the right attorney.</p>
          <Inp label="Accident Date *" type="date" icon="📅" value={d.accidentDate} onChange={e=>u("accidentDate",e.target.value)} />
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Type of Accident *</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[{l:"Car Accident",v:"car",i:"🚗"},{l:"Big Truck",v:"truck",i:"🚛"},{l:"Motorcycle",v:"motorcycle",i:"🏍️"},{l:"Uber / Lyft",v:"uber_lyft",i:"🚕"},{l:"Slip & Fall",v:"slip_fall",i:"⚠️"},{l:"Pedestrian",v:"pedestrian",i:"🚶"},{l:"Hit & Run",v:"hit_run",i:"💥"},{l:"Other",v:"other",i:"📋"}].map(a=>(
              <Opt key={a.v} label={a.l} val={a.v} field="accidentType" icon={a.i} />
            ))}
          </div>
          <div style={{marginBottom:16}}>
            <p style={{...font("DM Sans",11,500,C.muted),marginBottom:6,letterSpacing:0.5}}>Brief Description</p>
            <textarea value={d.accidentDesc||""} onChange={e=>u("accidentDesc",e.target.value)}
              placeholder="What happened? (intersection, highway, parking lot, etc.)"
              style={{width:"100%",minHeight:80,background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",
                color:C.white,fontFamily:"DM Sans",fontSize:14,outline:"none",resize:"vertical"}} />
          </div>
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Who was at fault?</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[{l:"Other Driver",v:"other_driver"},{l:"Shared Fault",v:"shared"},{l:"Not at Fault",v:"not_at_fault"},{l:"Not Sure",v:"unsure"}].map(f=>(
              <Opt key={f.v} label={f.l} val={f.v} field="atFault" />
            ))}
          </div>
          <Btn v="primary" full onClick={()=>d.accidentType ? setStep(3) : null} disabled={!d.accidentType}>Continue →</Btn>
        </Card>
      )}

      {/* STEP 3: Injury Info */}
      {step === 3 && (
        <Card>
          <h3 style={{...font("Oswald",16,600,C.white),marginBottom:4}}>Your Injuries</h3>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:16}}>Help us understand your situation so we get you the right care.</p>
          <div style={{marginBottom:16}}>
            <p style={{...font("DM Sans",11,500,C.muted),marginBottom:6,letterSpacing:0.5}}>Describe your injuries</p>
            <textarea value={d.injuryDesc||""} onChange={e=>u("injuryDesc",e.target.value)}
              placeholder="Neck pain, back pain, headaches, limited mobility, etc."
              style={{width:"100%",minHeight:80,background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",
                color:C.white,fontFamily:"DM Sans",fontSize:14,outline:"none",resize:"vertical"}} />
          </div>
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Are you currently receiving treatment?</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <Opt label="Yes" val={true} field="currentlyTreating" icon="✅" />
            <Opt label="No" val={false} field="currentlyTreating" icon="❌" />
          </div>
          {d.currentlyTreating === true && (
            <Inp label="Where are you being treated?" placeholder="Clinic or doctor name" value={d.treatingProvider} onChange={e=>u("treatingProvider",e.target.value)} />
          )}
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Were you hospitalized?</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <Opt label="Yes" val={true} field="hospitalized" icon="🏥" />
            <Opt label="No" val={false} field="hospitalized" icon="🏠" />
          </div>
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Have you missed work?</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <Opt label="Yes" val={true} field="missedWork" icon="💼" />
            <Opt label="No" val={false} field="missedWork" icon="👍" />
          </div>
          {d.missedWork === true && (
            <Inp label="How many days?" placeholder="e.g. 5" type="number" value={d.missedDays} onChange={e=>u("missedDays",e.target.value)} />
          )}
          <Btn v="primary" full onClick={()=>setStep(4)}>Continue →</Btn>
        </Card>
      )}

      {/* STEP 4: Insurance Info */}
      {step === 4 && (
        <Card>
          <h3 style={{...font("Oswald",16,600,C.white),marginBottom:4}}>Insurance Information</h3>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:16}}>This helps your attorney build the strongest case.</p>
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Do you have auto insurance?</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <Opt label="Yes" val={true} field="hasInsurance" icon="✅" />
            <Opt label="No" val={false} field="hasInsurance" icon="❌" />
          </div>
          {d.hasInsurance === true && (<>
            <Inp label="Your Insurance Company" placeholder="e.g. State Farm, GEICO" value={d.insuranceCo} onChange={e=>u("insuranceCo",e.target.value)} />
            <Inp label="Policy Number (if available)" placeholder="Optional" value={d.policyNum} onChange={e=>u("policyNum",e.target.value)} />
          </>)}
          <Inp label="Other Driver's Insurance (if known)" placeholder="Optional" value={d.otherInsurance} onChange={e=>u("otherInsurance",e.target.value)} />
          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Was a police report filed?</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <Opt label="Yes" val={true} field="policeReport" icon="🚔" />
            <Opt label="No / Not Sure" val={false} field="policeReport" icon="❓" />
          </div>
          {d.policeReport === true && (
            <Inp label="Report Number" placeholder="Optional" value={d.reportNum} onChange={e=>u("reportNum",e.target.value)} />
          )}
          <Btn v="primary" full onClick={()=>setStep(5)}>Continue →</Btn>
        </Card>
      )}

      {/* STEP 5: Document Upload */}
      {step === 5 && (
        <Card>
          <h3 style={{...font("Oswald",16,600,C.white),marginBottom:4}}>Upload Documents</h3>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:16}}>Upload anything you have — photos, reports, insurance cards. The more info, the stronger your case.</p>
          {[
            {type:"accident_photos",label:"Accident Photos",icon:"📸",desc:"Photos of damage, scene, injuries"},
            {type:"police_report",label:"Police Report",icon:"🚔",desc:"SR-13 form or report number"},
            {type:"insurance_card",label:"Insurance Card",icon:"💳",desc:"Front and back of your card"},
            {type:"medical_records",label:"Medical Records",icon:"🏥",desc:"ER visit, doctor notes, X-rays"},
            {type:"drivers_license",label:"Driver's License / ID",icon:"🪪",desc:"For identity verification"},
            {type:"other",label:"Other Documents",icon:"📄",desc:"Anything else related to your case"},
          ].map(dt => {
            const uploaded = docs.includes(dt.type);
            return (
              <div key={dt.type} onClick={()=>!uploaded && setDocs(p=>[...p,dt.type])} style={{
                display:"flex",alignItems:"center",gap:12,padding:"12px 0",
                borderBottom:`1px solid ${C.border}`,cursor:uploaded?"default":"pointer"
              }}>
                <div style={{width:40,height:40,borderRadius:10,background:uploaded?`${C.green}15`:`${C.bgInput}`,border:`1px solid ${uploaded?`${C.green}30`:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                  {uploaded ? "✅" : dt.icon}
                </div>
                <div style={{flex:1}}>
                  <p style={{...font("DM Sans",13,500,uploaded?C.green:C.white)}}>{dt.label}</p>
                  <p style={{...font("DM Sans",11,400,C.dim)}}>{uploaded ? "Uploaded" : dt.desc}</p>
                </div>
                {!uploaded && <span style={{...font("DM Sans",10,600,C.red)}}>TAP TO UPLOAD</span>}
              </div>
            );
          })}
          <p style={{...font("DM Sans",11,400,C.muted),marginTop:12,marginBottom:16,lineHeight:1.5}}>
            Don't have documents right now? No problem — you can upload them later from the Documents tab after your agent call.
          </p>
          <Btn v="primary" full onClick={()=>setStep(6)}>Continue →</Btn>
          <div style={{marginTop:8}}>
            <Btn v="ghost" full onClick={()=>setStep(6)}>Skip for Now</Btn>
          </div>
        </Card>
      )}

      {/* STEP 6: Schedule Callback */}
      {step === 6 && (
        <Card>
          <h3 style={{...font("Oswald",16,600,C.white),marginBottom:4}}>Schedule Your Agent Call</h3>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:16}}>Pick a time and a Help 911 agent will call you to review your case and connect you with an attorney.</p>

          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Preferred Date</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {(() => {
              const dates = [];
              for (let i = 1; i <= 3; i++) {
                const dt = new Date();
                dt.setDate(dt.getDate() + i);
                const day = dt.toLocaleDateString("en-US", { weekday: "short" });
                const md = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const iso = dt.toISOString().split("T")[0];
                dates.push({ label: i === 1 ? "Tomorrow" : day, sub: md, val: iso });
              }
              return dates;
            })().map(dt => (
              <div key={dt.val} onClick={()=>u("callbackDate",dt.val)} style={{
                textAlign:"center",padding:"12px 8px",borderRadius:10,cursor:"pointer",
                background:d.callbackDate===dt.val?`${C.red}15`:C.bgInput,
                border:`1px solid ${d.callbackDate===dt.val?`${C.red}40`:C.border}`,transition:"all 0.2s"
              }}>
                <p style={{...font("Oswald",14,600,d.callbackDate===dt.val?C.white:C.chrome)}}>{dt.label}</p>
                <p style={{...font("DM Sans",11,400,C.muted),marginTop:2}}>{dt.sub}</p>
              </div>
            ))}
          </div>

          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Preferred Time</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[{l:"Morning",s:"9AM - 12PM",v:"morning",i:"🌅"},{l:"Afternoon",s:"12PM - 4PM",v:"afternoon",i:"☀️"},{l:"Evening",s:"4PM - 7PM",v:"evening",i:"🌆"}].map(t=>(
              <div key={t.v} onClick={()=>u("callbackTime",t.v)} style={{
                textAlign:"center",padding:"12px 8px",borderRadius:10,cursor:"pointer",
                background:d.callbackTime===t.v?`${C.red}15`:C.bgInput,
                border:`1px solid ${d.callbackTime===t.v?`${C.red}40`:C.border}`,transition:"all 0.2s"
              }}>
                <span style={{fontSize:20}}>{t.i}</span>
                <p style={{...font("Oswald",13,600,d.callbackTime===t.v?C.white:C.chrome),marginTop:4}}>{t.l}</p>
                <p style={{...font("DM Sans",10,400,C.muted),marginTop:2}}>{t.s}</p>
              </div>
            ))}
          </div>

          <p style={{...font("DM Sans",11,500,C.muted),marginBottom:8,letterSpacing:0.5}}>Preferred Language</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            <Opt label="English" val="English" field="language" icon="🇺🇸" />
            <Opt label="Español" val="Spanish" field="language" icon="🇲🇽" />
          </div>

          {/* Summary */}
          <div style={{background:C.bgInput,borderRadius:10,padding:14,marginBottom:16}}>
            <p style={{...font("DM Sans",11,600,C.muted),letterSpacing:0.5,marginBottom:8}}>YOUR CASE SUMMARY</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {l:"Name",v:`${d.firstName||""} ${d.lastName||""}`},
                {l:"Phone",v:d.phone||"—"},
                {l:"Accident",v:d.accidentType?.replace(/_/g," ")||"—"},
                {l:"Date",v:d.accidentDate||"—"},
                {l:"At Fault",v:d.atFault?.replace(/_/g," ")||"—"},
                {l:"Docs",v:`${docs.length} uploaded`},
              ].map(s=>(
                <div key={s.l}>
                  <p style={{...font("DM Sans",10,400,C.dim)}}>{s.l}</p>
                  <p style={{...font("DM Sans",12,500,C.chrome),marginTop:1,textTransform:"capitalize"}}>{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          <Btn v="primary" full onClick={handleAttorneySubmit} disabled={!d.callbackDate || !d.callbackTime || loading}>
            {loading ? "Submitting..." : "Schedule My Agent Call"}
          </Btn>
          <p style={{...font("DM Sans",10,400,C.dim),textAlign:"center",marginTop:10}}>By submitting, you agree to receive a call from a Help 911 agent at your scheduled time.</p>
        </Card>
      )}

      {/* Bottom CTA */}
      {!submitted && (
        <div style={{marginTop:16,textAlign:"center"}}>
          <p style={{...font("DM Sans",12,400,C.muted),marginBottom:8}}>Rather talk to someone right now?</p>
          <Btn v="primary" full icon="📞" onClick={()=>window.open("tel:18004878911")}>Call 1-800-HELP-911</Btn>
        </div>
      )}
    </div>
  );
}

const CUST_TABS = [
  {id:"help",icon:"🆘",label:"Help Now"},{id:"clinics",icon:"📍",label:"Clinics"},
  {id:"services",icon:"💼",label:"Services"},{id:"next",icon:"📋",label:"Next Steps"},
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

function Help911AppExport(){return React.createElement(H911ErrorBoundary,null,React.createElement(Help911App));}
export {Help911AppExport as default};
function Help911App() {
  const [mode, setMode] = useState("public"); // public | client | rep
  const [tab, setTab] = useState("help");
  const [authScreen, setAuthScreen] = useState(null); // null | 'client-login' | 'rep-login'
  const [authEmail, setAuthEmail] = useState('');
  const [authPw, setAuthPw] = useState('');
  const [authName, setAuthName] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // signin | signup
  const [repSession, setRepSession] = useState(null);
  const [clientSession, setClientSession] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [legalView, setLegalView] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(()=>{const on=()=>setIsOffline(false);const off=()=>setIsOffline(true);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)}},[]);

  // Auth constants (using MCP Gateway Supabase — help911 tables are here)
  const H_SB='https://dzlmtvodpyhetvektfuo.supabase.co';
  const H_SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bG10dm9kcHloZXR2ZWt0ZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODQ4NjQsImV4cCI6MjA4NTE2MDg2NH0.qmnWB4aWdb7U8Iod9Hv8PQAOJO3AG0vYEGnPS--kfAo';

  // Check stored sessions on mount
  useEffect(()=>{
    try{const rs=JSON.parse(localStorage.getItem('h911_rep'));if(rs?.access_token)setRepSession(rs);}catch{}
    try{const cs=JSON.parse(localStorage.getItem('h911_client'));if(cs?.access_token)setClientSession(cs);}catch{}
  },[]);

  const doAuth=async(targetMode)=>{
    if(authLoading)return;setAuthLoading(true);setAuthErr('');
    try{
      if(authMode==='signup'){
        const sr=await fetch(`${H_SB}/auth/v1/signup`,{method:'POST',headers:{'Content-Type':'application/json',apikey:H_SK},body:JSON.stringify({email:authEmail,password:authPw,data:{full_name:authName,role:targetMode}})});
        const sd=await sr.json();if(sd.error||sd.msg)throw new Error(sd.error_description||sd.msg||sd.error);
      }
      const r=await fetch(`${H_SB}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'Content-Type':'application/json',apikey:H_SK,Authorization:`Bearer ${H_SK}`},body:JSON.stringify({email:authEmail,password:authPw})});
      const d=await r.json();if(d.error||d.msg)throw new Error(d.error_description||d.msg||d.error);
      if(targetMode==='rep'){setRepSession(d);localStorage.setItem('h911_rep',JSON.stringify(d));setMode('rep');setTab('rep-dash');}
      else{setClientSession(d);localStorage.setItem('h911_client',JSON.stringify(d));setMode('client');setTab('dashboard');}
      setAuthScreen(null);setAuthEmail('');setAuthPw('');setAuthName('');
    }catch(e){let m=e.message;if(m.includes('Invalid login'))m='Wrong email or password';if(m.includes('already registered'))m='Already registered — try Sign In';setAuthErr(m);}
    finally{setAuthLoading(false);}
  };

  const doReset=async()=>{
    if(!authEmail){setAuthErr('Enter your email');return;}
    setAuthLoading(true);setAuthErr('');
    try{await fetch(`${H_SB}/auth/v1/recover`,{method:'POST',headers:{'Content-Type':'application/json',apikey:H_SK},body:JSON.stringify({email:authEmail})});setResetSent(true);}
    catch{setAuthErr('Failed to send reset email');}
    finally{setAuthLoading(false);}
  };

  const go = (t) => {
    if(["dashboard","treatment","case","docs","transport"].includes(t)){
      if(!clientSession){setAuthScreen('client-login');setAuthMode('signin');setAuthErr('');return;}
      if(mode==="public")setMode("client");
    }
    if(["rep-dash","leads","schedule","cases","notif"].includes(t)){
      if(!repSession){setAuthScreen('rep-login');setAuthMode('signin');setAuthErr('');return;}
      if(mode!=="rep")setMode("rep");
    }
    if(t==="help" && mode==="client") setMode("public");
    setTab(t);
  };

  const switchMode = () => {
    if(mode==="public"){
      if(clientSession){setMode("client");setTab("dashboard");}
      else{setAuthScreen('client-login');setAuthMode('signin');setAuthErr('');}
    }else if(mode==="client"){
      if(repSession){setMode("rep");setTab("rep-dash");}
      else{setAuthScreen('rep-login');setAuthMode('signin');setAuthErr('');}
    }else{setMode("public");setTab("help");}
  };

  const tabs = mode==="rep"?REP_TABS:mode==="client"?CLIENT_TABS:CUST_TABS;
  const accent = mode==="rep"?C.blue:C.accent;
  const authTarget = authScreen==='rep-login'?'rep':'client';
  const authColor = authTarget==='rep'?C.blue:C.green;
  const authLabel = authTarget==='rep'?'Agent Portal':'Client Portal';

  // AUTH OVERLAY
  const AuthOverlay = authScreen ? (
    <div style={{position:'fixed',inset:0,background:'rgba(7,8,12,0.97)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:12,letterSpacing:3,color:authColor,fontWeight:700,marginBottom:8}}>{authLabel.toUpperCase()}</div>
          <div style={{fontSize:22,fontWeight:800,color:C.white}}>Sign In Required</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>{authTarget==='rep'?'Authorized agents only':'Access your case details'}</div>
        </div>
        {/* Mode toggle */}
        <div style={{display:'flex',background:C.bgCard,borderRadius:12,padding:3,marginBottom:16}}>
          {['signin','signup'].map(m=><button key={m} onClick={()=>{setAuthMode(m);setAuthErr('');setResetSent(false)}} style={{flex:1,padding:'10px',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'DM Sans,sans-serif',background:authMode===m?C.bg:'transparent',color:authMode===m?C.white:C.dim}}>{m==='signin'?'Sign In':'Sign Up'}</button>)}
        </div>
        {authMode==='signup'&&<input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Full Name" style={{width:'100%',padding:'14px 16px',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,color:C.white,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'DM Sans,sans-serif',marginBottom:10}}/>}
        <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="Email" style={{width:'100%',padding:'14px 16px',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,color:C.white,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'DM Sans,sans-serif',marginBottom:10}}/>
        <input type="password" value={authPw} onChange={e=>setAuthPw(e.target.value)} placeholder="Password" style={{width:'100%',padding:'14px 16px',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,color:C.white,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'DM Sans,sans-serif',marginBottom:14}}/>
        {authErr&&<div style={{padding:'10px 14px',background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,marginBottom:12,fontSize:13,color:C.accent,fontWeight:600}}>{authErr}</div>}
        {resetSent&&<div style={{padding:'10px 14px',background:'rgba(16,185,129,.12)',borderRadius:12,marginBottom:12,fontSize:13,color:C.green,fontWeight:600}}>{'\u2709\uFE0F'} Reset email sent to {authEmail}</div>}
        <button onClick={()=>doAuth(authTarget)} disabled={authLoading} style={{width:'100%',padding:'16px',background:authColor,color:'#fff',border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>{authLoading?'...':(authMode==='signup'?'Create Account':'Sign In')}</button>
        {authMode==='signin'&&!resetSent&&<button onClick={doReset} style={{background:'none',border:'none',color:C.muted,fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginTop:10,width:'100%',textAlign:'center'}}>Forgot password?</button>}
        <button onClick={()=>{setAuthScreen(null);setAuthErr('');setResetSent(false)}} style={{background:'none',border:'none',color:C.dim,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginTop:12,width:'100%',textAlign:'center'}}>Cancel</button>
      </div>
    </div>
  ) : null;

  const screens = {
    help:<CustHelp go={go} switchMode={switchMode} />,
    attorney:<CustAttorney go={go} />,
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
      <div style={{maxWidth:480,margin:"0 auto",background:C.bg,minHeight:"100dvh",position:"relative",fontFamily:"DM Sans,sans-serif",overflowX:"hidden"}}>
        {/* Status bar accent */}
        <div className="safe-top" style={{position:"sticky",top:0,zIndex:50,height:3,background:`linear-gradient(90deg,${accent},transparent)`}}/>
        {isOffline&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:C.accent,color:"#fff",textAlign:"center",padding:"6px",fontSize:11,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>No internet connection</div>}

        {/* Mode Switcher — Rep and Client require authentication */}
        <div style={{position:"fixed",top:8,right:8,zIndex:101,display:"flex",gap:4}}>
          <button onClick={()=>{setMode("public");setTab("help")}}
            style={{background:mode==="public"?C.bgCard:C.bgCard,border:`1px solid ${mode==="public"?C.border:C.border}`,color:mode==="public"?C.muted:C.dim,...font("DM Sans",9,600),padding:"5px 10px",borderRadius:16,cursor:"pointer",letterSpacing:0.4,textTransform:"uppercase",transition:"all 0.2s"}}>Public</button>
          <button onClick={()=>{if(clientSession){setMode("client");setTab("dashboard");}else{setAuthScreen('client-login');setAuthMode('signin');setAuthErr('');setResetSent(false);}}}
            style={{background:mode==="client"?`${C.green}20`:C.bgCard,border:`1px solid ${mode==="client"?`${C.green}40`:C.border}`,color:mode==="client"?C.green:C.dim,...font("DM Sans",9,600),padding:"5px 10px",borderRadius:16,cursor:"pointer",letterSpacing:0.4,textTransform:"uppercase",transition:"all 0.2s"}}>{'\u{1F7E2}'} Client</button>
          <button onClick={()=>{if(repSession){setMode("rep");setTab("rep-dash");}else{setAuthScreen('rep-login');setAuthMode('signin');setAuthErr('');setResetSent(false);}}}
            style={{background:mode==="rep"?`${C.blue}20`:C.bgCard,border:`1px solid ${mode==="rep"?`${C.blue}40`:C.border}`,color:mode==="rep"?C.blueLight:C.dim,...font("DM Sans",9,600),padding:"5px 10px",borderRadius:16,cursor:"pointer",letterSpacing:0.4,textTransform:"uppercase",transition:"all 0.2s"}}>{'\u{1F535}'} Rep</button>
        </div>

        {AuthOverlay}
        {legalView&&<div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(7,8,12,0.97)',overflowY:'auto',padding:'50px 16px 40px'}} onClick={()=>setLegalView(null)}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:420,margin:'0 auto',background:C.bgCard,borderRadius:20,padding:'20px 16px',border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{...font('Oswald',17,700,C.white)}}>{legalView==='terms'?'Terms of Service':'Privacy Policy'}</div>
              <button onClick={()=>setLegalView(null)} style={{background:'none',border:'none',color:C.dim,fontSize:18,cursor:'pointer'}}>{'\u2715'}</button>
            </div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.8,whiteSpace:'pre-wrap'}}>{legalView==='terms'?'TERMS OF SERVICE \u2014 The Kollective Hospitality Group\nLast Updated: April 2, 2026\n\n1. ACCEPTANCE\nBy using Help 911, you agree to these Terms.\n\n2. ELIGIBILITY\nMust be 18+.\n\n3. SERVICES\nHelp 911 is a recovery concierge connecting accident victims with attorneys, treatment providers, and transportation.\n\n4. DISCLAIMER\nKHG facilitates connections. We are not a law firm, medical provider, or insurance company. We do not provide legal or medical advice.\n\n5. HEALTH INFORMATION\nAccident and injury information shared only with your authorized legal and medical providers.\n\n6. LIMITATION OF LIABILITY\nKHG shall not be liable for indirect or consequential damages.\n\n7. GOVERNING LAW\nGeorgia, United States.\n\n8. CONTACT\nthedoctordorsey@gmail.com':'PRIVACY POLICY \u2014 The Kollective Hospitality Group\nLast Updated: April 2, 2026\n\n1. WE COLLECT\nName, phone, email, accident details, injury info, insurance info, treatment history.\n\n2. HOW WE USE IT\nTo connect you with attorneys and treatment providers, coordinate transportation, and process your case.\n\n3. HEALTH DATA\nShared ONLY with your matched attorney and medical providers with your consent.\n\n4. SHARING\nDo not sell. Share with legal/medical partners for your case and law enforcement when required.\n\n5. SECURITY\nEncryption, HIPAA-aware practices, access controls.\n\n6. YOUR RIGHTS\nAccess, correct, delete your data.\n\n7. CONTACT\nthedoctordorsey@gmail.com'}</div>
          </div>
        </div>}
        {screens[tab] || screens.help}
        {/* Legal + Sign Out for authenticated portals */}
        {(mode==='rep'||mode==='client')&&(
          <div style={{padding:'12px 18px 90px',textAlign:'center'}}>
            <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:8}}>
              <button onClick={()=>setLegalView('terms')} style={{background:'none',border:'none',color:C.dim,fontSize:10,cursor:'pointer',fontFamily:'DM Sans,sans-serif',textDecoration:'underline'}}>Terms of Service</button>
              <button onClick={()=>setLegalView('privacy')} style={{background:'none',border:'none',color:C.dim,fontSize:10,cursor:'pointer',fontFamily:'DM Sans,sans-serif',textDecoration:'underline'}}>Privacy Policy</button>
            </div>
            <button onClick={()=>{if(mode==='rep'){setRepSession(null);localStorage.removeItem('h911_rep');}else{setClientSession(null);localStorage.removeItem('h911_client');}setMode('public');setTab('help');}} style={{background:'none',border:`1px solid ${C.accent}30`,color:C.accent,borderRadius:10,padding:'8px 20px',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:600}}>Sign Out</button>
          </div>
        )}
        <NavBar tab={tab} setTab={go} tabs={tabs} accent={accent} />
      </div>
    </>
  );
}
