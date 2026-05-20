// One Bite (한입) — All screens
// Each screen takes a `theme` prop ('light' | 'dark') and renders a
// 414×896 iPhone-14-sized composition. The screens are pure presentation
// and read tokens from a ThemeProvider-injected `T` object so the same
// markup serves both modes.

// ─────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────
const ONEBITE_TOKENS = {
  // Brand is BrandGreen (deep green). Semantic `success` lives on a sky
  // hue so it doesn't clash with the brand.
  brand: {
    green: '#16A34A',
    greenPressed: '#15803D',
    greenDarkAdj: '#22C55E',
    greenSurfaceLight: '#DCFCE7',
    greenSurfaceDark: '#14271A',
  },
  gray: {
    50:'#FAFAFA',100:'#F4F4F5',200:'#E4E4E7',300:'#D4D4D8',
    400:'#A1A1AA',500:'#71717A',600:'#52525B',700:'#3F3F46',
    800:'#27272A',900:'#18181B',950:'#09090B'
  },
};

function makeTheme(mode){
  const g = ONEBITE_TOKENS.gray;
  const b = ONEBITE_TOKENS.brand;
  const light = {
    mode:'light',
    bg:'#FFFFFF', surface:'#FFFFFF', surfaceMuted:g[50],
    onSurface:g[900], onSurfaceVariant:g[500], onSurfaceMuted:g[400],
    outline:g[200], outlineStrong:g[300],
    brand:b.green, brandPressed:b.greenPressed, brandSurface:b.greenSurfaceLight,
    success:'#0EA5E9', successSoft:'rgba(14,165,233,0.12)',
    warning:'#F59E0B', error:'#DC2626',
    cardShadow:'0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
    raisedShadow:'0 4px 12px rgba(0,0,0,0.08)',
    overlayShadow:'0 8px 24px rgba(0,0,0,0.12)',
    statusBarTint:'#18181B',
    placeholderBg:g[100], placeholderFg:g[400],
    dividerSoft:g[100],
  };
  const dark = {
    mode:'dark',
    bg:g[950], surface:g[900], surfaceMuted:g[800],
    onSurface:g[50], onSurfaceVariant:g[400], onSurfaceMuted:g[500],
    outline:g[700], outlineStrong:g[600],
    brand:b.greenDarkAdj, brandPressed:b.green, brandSurface:b.greenSurfaceDark,
    success:'#38BDF8', successSoft:'rgba(56,189,248,0.16)',
    warning:'#FBBF24', error:'#EF4444',
    cardShadow:'none', raisedShadow:'0 6px 18px rgba(0,0,0,0.45)',
    overlayShadow:'0 10px 28px rgba(0,0,0,0.55)',
    statusBarTint:'#FAFAFA',
    placeholderBg:g[800], placeholderFg:g[600],
    dividerSoft:g[800],
  };
  return mode === 'dark' ? dark : light;
}

// Typography helper
const ob = {
  display:{fontSize:28, lineHeight:'36px', fontWeight:700, letterSpacing:'-0.02em'},
  h1:{fontSize:22, lineHeight:'30px', fontWeight:700, letterSpacing:'-0.01em'},
  h2:{fontSize:18, lineHeight:'26px', fontWeight:600, letterSpacing:'-0.01em'},
  body:{fontSize:15, lineHeight:'22px', fontWeight:400},
  bodyEmph:{fontSize:15, lineHeight:'22px', fontWeight:600},
  caption:{fontSize:13, lineHeight:'18px', fontWeight:400},
  meta:{fontSize:12, lineHeight:'16px', fontWeight:500, letterSpacing:'0.01em'},
};

// ─────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────

function Frame({T, children, statusBarOverlay=false, statusBarTintOverride}){
  return (
    <div style={{
      width:414, height:896, background:T.bg, color:T.onSurface,
      position:'relative', overflow:'hidden',
      fontFamily:'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    }}>
      <StatusBar T={T} overlay={statusBarOverlay} tintOverride={statusBarTintOverride}/>
      {children}
    </div>
  );
}

function StatusBar({T, overlay, tintOverride}){
  const tint = tintOverride || T.statusBarTint;
  return (
    <div style={{
      position:'absolute', top:0, left:0, right:0, height:44, zIndex:50,
      display:'flex', alignItems:'flex-end', justifyContent:'space-between',
      padding:'0 22px 8px', color:tint,
      background: overlay ? 'transparent' : T.bg,
      pointerEvents:'none',
    }}>
      <div style={{...ob.bodyEmph, fontSize:15, color:tint}}>9:41</div>
      <div style={{display:'flex', alignItems:'center', gap:6}}>
        {/* signal */}
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="1" fill={tint}/>
          <rect x="5" y="5" width="3" height="6" rx="1" fill={tint}/>
          <rect x="10" y="2.5" width="3" height="8.5" rx="1" fill={tint}/>
          <rect x="15" y="0" width="3" height="11" rx="1" fill={tint}/>
        </svg>
        {/* wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 11 L10.4 8.4 A3.4 3.4 0 0 0 5.6 8.4 Z" fill={tint}/>
          <path d="M3 6 A7 7 0 0 1 13 6" stroke={tint} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M.5 3.2 A11 11 0 0 1 15.5 3.2" stroke={tint} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke={tint} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill={tint}/>
          <rect x="24" y="4" width="1.5" height="4" rx="0.75" fill={tint} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function HomeIndicator({T}){
  return (
    <div style={{
      position:'absolute', bottom:8, left:0, right:0,
      display:'flex', justifyContent:'center', pointerEvents:'none', zIndex:60,
    }}>
      <div style={{width:134, height:5, borderRadius:3, background:T.onSurface, opacity:0.9}}/>
    </div>
  );
}

function AppBar({T, title, leading, trailing, centered=false, transparent=false}){
  return (
    <div style={{
      height:56, marginTop:44, padding:'0 8px 0 8px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      background: transparent ? 'transparent' : T.surface,
      position: transparent ? 'absolute' : 'relative',
      top: transparent ? 44 : 'auto',
      left: transparent ? 0 : 'auto',
      right: transparent ? 0 : 'auto',
      zIndex: transparent ? 40 : 'auto',
    }}>
      <div style={{minWidth:48, display:'flex', alignItems:'center'}}>{leading}</div>
      {centered ? (
        <div style={{...ob.h1, color:T.onSurface, flex:1, textAlign:'center'}}>{title}</div>
      ) : (
        <div style={{...ob.h1, color:T.onSurface, flex:1, paddingLeft:8, display:'flex', alignItems:'center', gap:8}}>{title}</div>
      )}
      <div style={{minWidth:48, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4}}>{trailing}</div>
    </div>
  );
}

function IconBtn({children, onClick, T}){
  return (
    <button onClick={onClick} style={{
      width:44, height:44, display:'inline-flex', alignItems:'center', justifyContent:'center',
      background:'transparent', border:'none', color:T.onSurface, cursor:'pointer',
    }}>{children}</button>
  );
}

// ── Icons (24px stroke) ─────────────────────────────────────────────
const Ic = {
  chevL: (c='currentColor')=>(<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 6 L9 12 L15 18" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  chevR: (c='currentColor')=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6 L15 12 L9 18" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  chevDown: (c='currentColor')=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9 L12 15 L18 9" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  bell: (c='currentColor')=>(<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 18a2 2 0 0 0 4 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  share: (c='currentColor')=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M12 4l-4 4M12 4l4 4M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  settings: (c='currentColor')=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  plus: (c='currentColor', s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.2" strokeLinecap="round"/></svg>),
  home: (c='currentColor', filled=false)=>filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 11 L12 4 L20 11 V20 a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" fill={c}/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 11 L12 4 L20 11 V20 a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  map: (c='currentColor', filled=false)=>filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" fill={c}/><path d="M9 4 V18 M15 6 V20" stroke={c==='#fff'?'#fff':T_TOK_lineForFill(c)} strokeWidth="1" opacity="0.5"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 4 V18 M15 6 V20" stroke={c} strokeWidth="1.6"/></svg>,
  person: (c='currentColor', filled=false)=>filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill={c}/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill={c}/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search: (c='currentColor')=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke={c} strokeWidth="1.8"/><path d="M16 16 L20 20" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  pinFill: (c='currentColor')=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" fill={c}/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>),
  crosshair: (c='currentColor')=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="12" r="2.5" fill={c}/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  camera: (c='currentColor')=>(<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke={c} strokeWidth="1.6"/><circle cx="12" cy="13" r="4" stroke={c} strokeWidth="1.6"/></svg>),
  imagePh: (c='currentColor')=>(<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke={c} strokeWidth="1.5"/><circle cx="8.5" cy="10.5" r="1.5" fill={c}/><path d="M3 17 L9 12 L13 15 L17 11 L21 14" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill="none"/></svg>),
  gps: (c='currentColor')=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill={c}/><circle cx="12" cy="12" r="7" stroke={c} strokeWidth="1.8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  alertExc: (c='currentColor')=>(<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/><path d="M12 7v6M12 16.5v.5" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>),
  burger: (c='currentColor')=>(<svg width="36" height="36" viewBox="0 0 64 64" fill="none"><path d="M14 38 Q32 22 50 38" fill={c} opacity="0.95"/><rect x="12" y="38" width="40" height="6" rx="3" fill={c}/><rect x="12" y="46" width="40" height="6" rx="3" fill={c} opacity="0.55"/></svg>),
};
function T_TOK_lineForFill(c){ return c; }

// ── Buttons ─────────────────────────────────────────────────────────
function PrimaryButton({T, children, full=true, compact=false, disabled=false, danger=false, style}){
  const h = compact?44:52;
  const bg = disabled ? `${T.brand}4D` : (danger ? T.error : T.brand);
  return (
    <button disabled={disabled} style={{
      height:h, width: full ? '100%' : 'auto',
      padding:'0 20px', borderRadius:10, border:'none',
      background:bg, color:'#FFFFFF', ...ob.bodyEmph,
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
      cursor: disabled?'default':'pointer', ...style,
    }}>{children}</button>
  );
}

function SecondaryButton({T, children, full=true, compact=false, danger=false, style}){
  const h = compact?44:52;
  const color = danger ? T.error : T.onSurface;
  const border = danger ? T.error : T.outline;
  return (
    <button style={{
      height:h, width: full?'100%':'auto', padding:'0 20px',
      borderRadius:10, border:`1px solid ${border}`,
      background:'transparent', color, ...ob.bodyEmph,
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
      cursor:'pointer', ...style,
    }}>{children}</button>
  );
}

function TextButton({T, children, danger=false, style, color}){
  return (
    <button style={{
      background:'transparent', border:'none', padding:'10px 8px',
      color: color || (danger?T.error:T.onSurfaceVariant), ...ob.body,
      cursor:'pointer', ...style,
    }}>{children}</button>
  );
}

// ── Status Badge ────────────────────────────────────────────────────
function StatusBadge({T, status}){
  const styles = {
    WAITING: { bg:T.brandSurface, fg:T.brand, label:'모집중' },
    URGENT:  { bg:T.brandSurface, fg:T.brand, label:'마감임박' },
    // MATCHED reads as a quiet acknowledgement, not a celebratory accent —
    // keeps the brand green as the single attention-pulling color.
    MATCHED: { bg:T.surfaceMuted, fg:T.onSurface, label:'매칭됨' },
    COMPLETED:{ bg:T.surfaceMuted, fg:T.onSurfaceVariant, label:'완료' },
    CANCELLED:{ bg:T.surfaceMuted, fg:T.onSurfaceVariant, label:'취소됨' },
  }[status] || {bg:T.surfaceMuted, fg:T.onSurfaceVariant, label:status};
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding:'4px 8px', borderRadius:999,
      background:styles.bg, color:styles.fg, ...ob.meta,
    }}>{styles.label}</span>
  );
}

// ── Filter Chip ─────────────────────────────────────────────────────
function FilterChip({T, active, children}){
  return (
    <button style={{
      height:34, padding:'0 14px', borderRadius:999,
      border: active ? `1px solid ${T.brand}` : `1px solid ${T.outline}`,
      background: active ? T.brand : 'transparent',
      color: active ? '#FFFFFF' : T.onSurface,
      ...ob.bodyEmph, fontSize:13,
      display:'inline-flex', alignItems:'center', gap:4,
      whiteSpace:'nowrap', cursor:'pointer',
    }}>{children}</button>
  );
}

// ── TextField ──────────────────────────────────────────────────────
function TextField({T, label, value, placeholder, suffix, trailing, focused=false, supporting, error=false}){
  const borderColor = error ? T.error : (focused ? T.brand : T.outline);
  const labelColor = error ? T.error : (focused ? T.brand : T.onSurfaceVariant);
  return (
    <div>
      <div style={{
        position:'relative', height:52, borderRadius:8,
        border: `${focused||error?1.5:1}px solid ${borderColor}`,
        background: T.surface,
        display:'flex', alignItems:'center',
        padding:'0 14px',
      }}>
        <span style={{
          position:'absolute', top: -8, left: 10, padding:'0 6px',
          background: T.surface, color: labelColor, ...ob.meta,
        }}>{label}</span>
        <div style={{flex:1, display:'flex', alignItems:'baseline', gap:6, minWidth:0}}>
          <span style={{
            ...ob.body, color: value ? T.onSurface : T.onSurfaceMuted,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{value || placeholder}</span>
          {suffix && value && <span style={{...ob.body, color:T.onSurfaceVariant}}>{suffix}</span>}
        </div>
        {trailing}
      </div>
      {supporting && (
        <div style={{...ob.meta, color: error?T.error:T.onSurfaceVariant, padding:'6px 4px 0'}}>{supporting}</div>
      )}
    </div>
  );
}

// ── Image Placeholder (striped) ─────────────────────────────────────
function ImgPh({T, w='100%', h, radius=12, label, ratio, dark}){
  // a stripe-based placeholder so it reads as "image goes here"
  const bg = T.placeholderBg;
  const stripe = T.mode==='dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const fg = T.placeholderFg;
  const style = {
    width:w, height:h, borderRadius:radius,
    background: `repeating-linear-gradient(135deg, ${bg} 0 12px, ${stripe} 12px 24px)`,
    display:'flex', alignItems:'center', justifyContent:'center',
    color: fg, position:'relative', overflow:'hidden',
  };
  if(ratio) { style.aspectRatio = ratio; delete style.height; }
  return (
    <div style={style}>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
        {Ic.imagePh(fg)}
        {label && <span style={{...ob.meta, fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', color:fg}}>{label}</span>}
      </div>
    </div>
  );
}

// ── Bottom Navigation ───────────────────────────────────────────────
function BottomNav({T, active='home'}){
  const items = [
    {id:'home', label:'홈', icon:Ic.home},
    {id:'map',  label:'지도', icon:Ic.map},
    {id:'me',   label:'나', icon:Ic.person},
  ];
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0,
      height: 64 + 24, paddingBottom: 24,
      background: T.surface, borderTop:`1px solid ${T.outline}`,
      display:'flex', alignItems:'center', justifyContent:'space-around',
      zIndex:30,
    }}>
      {items.map(it=>{
        const on = it.id===active;
        const c = on ? T.brand : T.onSurfaceMuted;
        return (
          <div key={it.id} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            flex:1, height:'100%', justifyContent:'center', paddingTop:6,
          }}>
            {it.icon(c, on)}
            <span style={{fontSize:11, lineHeight:'14px', fontWeight: on?600:500, color:c}}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── SplitCard ────────────────────────────────────────────────────────
function SplitCard({T, title, location, distance, time, perPerson, recruiting, status='WAITING', imgLabel, dim=false}){
  return (
    <div style={{
      background: T.surface, borderRadius:12,
      boxShadow: T.mode==='dark' ? 'none' : T.cardShadow,
      border: T.mode==='dark' ? `1px solid ${T.outline}` : 'none',
      overflow:'hidden',
      opacity: dim?0.6:1,
    }}>
      <ImgPh T={T} ratio="16/9" radius={0} label={imgLabel}/>
      <div style={{padding:16, display:'flex', flexDirection:'column', gap:8}}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8}}>
          <div style={{...ob.h2, color:T.onSurface, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{title}</div>
          <StatusBadge T={T} status={status}/>
        </div>
        <div style={{...ob.caption, color:T.onSurfaceVariant}}>
          {location} · {distance} · {time}
        </div>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:2}}>
          <span style={{color:T.brand, ...ob.bodyEmph}}>1인당 ₩{perPerson}</span>
          <span style={{...ob.caption, color:T.onSurfaceVariant}}>{recruiting}명 모집</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.1 LoginScreen
// ═══════════════════════════════════════════════════════════════════
function LoginScreen({mode}){
  const T = makeTheme(mode);
  // OAuth visual style: brand-recognizable colors + Korean labels with
  // simple geometric mark stand-ins (no trademarked logos).
  const providers = [
    {bg:'#FEE500', fg:'rgba(0,0,0,0.85)', label:'카카오로 시작하기', mark:(
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="9" rx="8" ry="6" fill="rgba(0,0,0,0.85)"/>
        <path d="M7 14 L8 17 L11 14.5" fill="rgba(0,0,0,0.85)"/>
      </svg>
    )},
    {bg:'#03C75A', fg:'#FFFFFF', label:'네이버로 시작하기', mark:(
      <div style={{width:20, height:20, borderRadius:4, background:'#FFFFFF', color:'#03C75A', ...ob.bodyEmph, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14}}>N</div>
    )},
    {bg:'#FFFFFF', fg:'#1F1F1F', border:'#747775', label:'Google로 시작하기', mark:(
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#747775" strokeWidth="1.5" fill="none"/>
        <path d="M10 10 L17 10 A7 7 0 0 1 13.5 16.1 Z" fill="#34A853"/>
        <path d="M10 10 L13.5 16.1 A7 7 0 0 1 4.4 13.5 Z" fill="#FBBC04"/>
        <path d="M10 10 L4.4 13.5 A7 7 0 0 1 4.4 6.5 Z" fill="#EA4335"/>
        <path d="M10 10 L4.4 6.5 A7 7 0 0 1 17 10 Z" fill="#4285F4"/>
      </svg>
    )},
    {bg:'#000000', fg:'#FFFFFF', label:'Apple로 시작하기', mark:(
      <svg width="18" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M16.5 1c.1 1.4-.5 2.7-1.3 3.6-.9 1-2.3 1.7-3.6 1.6-.2-1.3.5-2.7 1.3-3.6.9-1 2.4-1.7 3.6-1.6Zm4 17c-.6 1.4-1 2-1.7 3.2-1 1.6-2.5 3.6-4.4 3.7-1.7 0-2.1-1.1-4.4-1.1-2.3 0-2.8 1.1-4.4 1.1-1.9-.1-3.3-2-4.3-3.6C.7 18.7-.2 14.5 1.5 11.5c1.2-2 3.1-3.3 4.9-3.3 1.7 0 2.7 1.1 4.1 1.1 1.4 0 2.2-1.1 4.2-1.1 1.5 0 3 .8 4.1 2.2-3.6 2-3 7.2 1.7 7.6Z"/></svg>
    )},
  ];
  return (
    <Frame T={T}>
      <div style={{
        position:'absolute', top: 44 + 896/3 - 44, left:24, right:24,
      }}>
        <div style={{fontSize:48, lineHeight:'56px', fontWeight:800, color:T.brand, letterSpacing:'-0.04em'}}>한입</div>
        <div style={{...ob.body, color:T.onSurfaceVariant, marginTop:10}}>동네에서 한 입씩 나눠요</div>
      </div>
      <div style={{position:'absolute', left:24, right:24, bottom: 64 + 24, display:'flex', flexDirection:'column', gap:10}}>
        {providers.map((p,i)=>(
          <button key={i} style={{
            height:52, borderRadius:10, border: p.border ? `1px solid ${p.border}` : 'none',
            background:p.bg, color:p.fg, ...ob.bodyEmph,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            position:'relative', padding:'0 20px', cursor:'pointer',
          }}>
            <span style={{position:'absolute', left:18, display:'flex'}}>{p.mark}</span>
            <span>{p.label}</span>
          </button>
        ))}
        <div style={{textAlign:'center', marginTop:6}}>
          <TextButton T={T} color={T.onSurfaceVariant}>둘러보기</TextButton>
        </div>
      </div>
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.2 HomeTab
// ═══════════════════════════════════════════════════════════════════
function HomeTab({mode}){
  const T = makeTheme(mode);
  const cards = [
    {title:'두쫀쿠 4개입', location:'역삼동 GS25', distance:'320m', time:'5분 전', perPerson:'10,000', recruiting:2, status:'WAITING', imgLabel:'product shot'},
    {title:'코스트코 휴지 30롤', location:'양재동 코스트코', distance:'1.2km', time:'12분 전', perPerson:'7,500', recruiting:3, status:'URGENT', imgLabel:'bulk pack'},
    {title:'스벅 원두 1kg', location:'역삼 스타벅스', distance:'480m', time:'30분 전', perPerson:'14,000', recruiting:2, status:'WAITING', imgLabel:'coffee bag'},
    {title:'딸기 2팩', location:'역삼 이마트', distance:'700m', time:'1시간 전', perPerson:'6,000', recruiting:2, status:'MATCHED', imgLabel:'strawberries'},
  ];
  return (
    <Frame T={T}>
      <AppBar T={T}
        title={
          <>
            <span>근처 한입</span>
            <span style={{
              ...ob.meta, padding:'4px 10px', borderRadius:999,
              background:T.surfaceMuted, color:T.onSurface,
              display:'inline-flex', alignItems:'center', gap:4,
              border:`1px solid ${T.outline}`,
            }}>역삼동 {Ic.chevDown(T.onSurfaceVariant)}</span>
          </>
        }
        trailing={
          <IconBtn T={T}>
            <span style={{position:'relative', display:'inline-flex'}}>
              {Ic.bell(T.onSurface)}
              <span style={{position:'absolute', top:2, right:2, width:8, height:8, borderRadius:999, background:T.error, border:`2px solid ${T.surface}`}}/>
            </span>
          </IconBtn>
        }
      />
      {/* Filter chips */}
      <div style={{
        display:'flex', gap:8, padding:'4px 16px 12px',
        overflowX:'auto',
      }}>
        <FilterChip T={T} active>전체</FilterChip>
        <FilterChip T={T}>모집중</FilterChip>
        <FilterChip T={T}>음식</FilterChip>
        <FilterChip T={T}>생필품</FilterChip>
        <FilterChip T={T}>마감임박</FilterChip>
      </div>
      {/* Feed */}
      <div style={{
        position:'absolute', top: 44+56+50, left:0, right:0, bottom: 64+24,
        overflow:'hidden', padding:'0 16px',
      }}>
        <div style={{display:'flex', flexDirection:'column', gap:12, paddingBottom:80}}>
          {cards.map((c,i)=>(<SplitCard key={i} T={T} {...c}/>))}
        </div>
      </div>
      {/* FAB */}
      <button style={{
        position:'absolute', right:16, bottom: 64+24+16, width:56, height:56,
        borderRadius:'50%', background:T.brand, border:'none', color:'#FFFFFF',
        boxShadow: T.mode==='light' ? '0 6px 16px rgba(22,163,74,0.32)' : '0 6px 16px rgba(0,0,0,0.5)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', zIndex:35,
      }}>{Ic.plus('#FFFFFF', 26)}</button>
      <BottomNav T={T} active="home"/>
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.3 MapTab
// ═══════════════════════════════════════════════════════════════════
function MapTab({mode}){
  const T = makeTheme(mode);
  const mapBg = T.mode==='dark' ? '#1B1F25' : '#E8EEF0';
  const road = T.mode==='dark' ? '#2B313A' : '#FFFFFF';
  const roadDim = T.mode==='dark' ? '#252A33' : '#F3F6F7';
  const park = T.mode==='dark' ? '#1F2A24' : '#DBE9DC';
  const water = T.mode==='dark' ? '#162028' : '#CFE0EA';
  const pins = [
    {x:120, y:230, selected:false},
    {x:220, y:340, selected:true},
    {x:300, y:280, selected:false},
    {x:170, y:480, selected:false},
    {x:330, y:520, selected:false},
    {x:90,  y:560, selected:false},
  ];
  return (
    <Frame T={T} statusBarOverlay statusBarTintOverride={T.mode==='dark'?'#FAFAFA':'#18181B'}>
      {/* Map "image" — schematic SVG */}
      <svg width="414" height="896" viewBox="0 0 414 896" style={{position:'absolute', inset:0}}>
        <rect width="414" height="896" fill={mapBg}/>
        {/* Park */}
        <path d="M0 80 Q120 60 200 110 T414 90 L414 220 Q280 240 180 200 T0 230 Z" fill={park}/>
        {/* Water */}
        <path d="M260 600 Q330 580 414 620 L414 720 Q360 740 280 720 Q220 700 260 600Z" fill={water}/>
        {/* Roads (rectangular grid stylized) */}
        <path d="M-20 300 L500 280" stroke={road} strokeWidth="18" />
        <path d="M-20 460 L500 440" stroke={road} strokeWidth="14" />
        <path d="M-20 620 L500 600" stroke={road} strokeWidth="20" />
        <path d="M-20 780 L500 770" stroke={road} strokeWidth="12" />
        <path d="M80 100 L100 900" stroke={road} strokeWidth="16" />
        <path d="M220 100 L240 900" stroke={road} strokeWidth="22" />
        <path d="M340 100 L360 900" stroke={road} strokeWidth="14" />
        {/* Minor roads */}
        <path d="M-20 380 L500 360" stroke={roadDim} strokeWidth="6" />
        <path d="M-20 540 L500 520" stroke={roadDim} strokeWidth="6" />
        <path d="M150 100 L170 900" stroke={roadDim} strokeWidth="6" />
        <path d="M280 100 L300 900" stroke={roadDim} strokeWidth="6" />
        {/* Blocks (subtle) */}
        {[[40,330],[120,330],[260,330],[380,330],
          [40,490],[120,490],[260,490],[380,490],
          [40,650],[120,650],[260,650],[380,650]].map(([x,y],i)=>(
            <rect key={i} x={x} y={y} width="50" height="40" rx="4" fill={T.mode==='dark'?'#222831':'#F4F4F5'} opacity="0.8"/>
          ))}
      </svg>

      {/* Top floating search */}
      <div style={{
        position:'absolute', top: 44+16, left:16, right: 16+16+40,
        height:48, borderRadius:12, background:T.surface,
        boxShadow: T.raisedShadow,
        border: T.mode==='dark'?`1px solid ${T.outline}`:'none',
        display:'flex', alignItems:'center', gap:10, padding:'0 14px',
        zIndex:40,
      }}>
        {Ic.search(T.onSurfaceVariant)}
        <span style={{...ob.body, color:T.onSurfaceVariant}}>장소 검색</span>
      </div>
      <button style={{
        position:'absolute', top:44+16+4, right:16, width:40, height:40,
        borderRadius:'50%', background:T.brand, border:'none', color:'#FFFFFF',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:T.raisedShadow, zIndex:40,
      }}>{Ic.crosshair('#FFFFFF')}</button>

      {/* Pins */}
      {pins.map((p,i)=>(
        <div key={i} style={{
          position:'absolute', left: p.x-16, top: p.y-16, width:32, height:32,
          borderRadius:'50%', background:T.brand,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: p.selected ? '0 0 0 6px rgba(22,163,74,0.22), 0 4px 10px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.25)',
          border: p.selected ? '3px solid #FFFFFF' : 'none',
          transform: p.selected?'scale(1.15)':'none',
        }}>
          <div style={{width:8, height:8, borderRadius:'50%', background:'#FFFFFF'}}/>
        </div>
      ))}

      {/* Bottom slide-up card */}
      <div style={{
        position:'absolute', left:0, right:0, bottom: 64+24,
        background:T.surface,
        borderTopLeftRadius:16, borderTopRightRadius:16,
        boxShadow:T.overlayShadow,
        border: T.mode==='dark'?`1px solid ${T.outline}`:'none',
        borderBottom:'none',
        padding:'12px 16px 16px',
        zIndex:30,
      }}>
        <div style={{
          width:36, height:4, borderRadius:2,
          background:T.outline, margin:'0 auto 14px',
        }}/>
        <div style={{display:'flex', gap:12}}>
          <ImgPh T={T} w={80} h={80} radius={10} label=""/>
          <div style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:4}}>
            <div style={{...ob.h2, color:T.onSurface, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>두쫀쿠 4개입</div>
            <div style={{...ob.caption, color:T.onSurfaceVariant}}>역삼동 GS25 · 320m · 5분 전</div>
            <div style={{color:T.brand, ...ob.bodyEmph}}>1인당 ₩10,000</div>
          </div>
          <div style={{alignSelf:'center'}}>
            <PrimaryButton T={T} full={false} compact>한 입 할게요</PrimaryButton>
          </div>
        </div>
      </div>

      <BottomNav T={T} active="map"/>
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.4 ProfileTab — two variants stacked vertically? No — render one;
// we use design canvas to show both. Add a `variant` prop.
// ═══════════════════════════════════════════════════════════════════
function ProfileTab({mode, variant='loggedIn'}){
  const T = makeTheme(mode);
  if(variant==='guest'){
    return (
      <Frame T={T}>
        <AppBar T={T} title="" />
        <div style={{padding:'16px 24px 0', textAlign:'center'}}>
          <div style={{height:64}}/>
          <div style={{
            width:80, height:80, borderRadius:'50%', background:T.placeholderBg,
            margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center',
          }}>{Ic.person(T.placeholderFg)}</div>
          <div style={{height:16}}/>
          <div style={{...ob.h2, color:T.onSurface}}>로그인하면 더 많은 기능을</div>
          <div style={{height:6}}/>
          <div style={{...ob.body, color:T.onSurfaceVariant}}>한 입씩 나누고 받은<br/>알림도 확인하세요</div>
          <div style={{height:24}}/>
          <div style={{display:'flex', justifyContent:'center'}}>
            <div style={{width:240}}><PrimaryButton T={T}>로그인하기</PrimaryButton></div>
          </div>
        </div>
        <BottomNav T={T} active="me"/>
        <HomeIndicator T={T}/>
      </Frame>
    );
  }
  // Logged in
  const menu = [
    {label:'내 나눠사기', kind:'chev'},
    {label:'참여한 나눠사기', kind:'chev'},
    {label:'알림 설정', kind:'toggle', on:true},
    {label:'약관 / 개인정보', kind:'chev'},
  ];
  return (
    <Frame T={T}>
      <AppBar T={T} title="나의 한입" trailing={
        <IconBtn T={T}>{Ic.settings(T.onSurface)}</IconBtn>
      }/>
      <div style={{padding:'0 16px'}}>
        {/* profile card */}
        <div style={{
          background:T.surface, borderRadius:12, padding:16,
          boxShadow: T.mode==='dark' ? 'none' : T.cardShadow,
          border: T.mode==='dark'? `1px solid ${T.outline}`:'none',
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{
            width:64, height:64, borderRadius:'50%',
            background:T.brandSurface,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:T.brand, ...ob.h1, fontSize:24,
          }}>지</div>
          <div style={{flex:1}}>
            <div style={{...ob.h1, color:T.onSurface}}>지영</div>
            <div style={{marginTop:2}}>
              <TextButton T={T} style={{padding:'2px 0', fontSize:13}}>닉네임 변경</TextButton>
            </div>
          </div>
        </div>
        {/* stats row */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0,
          marginTop:16, background:T.surface, borderRadius:12,
          border:`1px solid ${T.outline}`,
          overflow:'hidden',
        }}>
          {[['올린 한입','12'],['참여한','7'],['진행 중','2']].map(([l,v],i)=>(
            <div key={i} style={{
              padding:'14px 0', textAlign:'center',
              borderRight: i<2 ? `1px solid ${T.outline}`:'none',
            }}>
              <div style={{...ob.h1, color:T.onSurface}}>{v}</div>
              <div style={{...ob.caption, color:T.onSurfaceVariant, marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{height:24}}/>
        {/* menu */}
        <div style={{background:T.surface, borderRadius:12, border: T.mode==='dark'?`1px solid ${T.outline}`:`1px solid ${T.dividerSoft}`, overflow:'hidden'}}>
          {menu.map((m,i)=>(
            <div key={i} style={{
              height:56, padding:'0 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              borderBottom: i<menu.length-1 ? `1px solid ${T.dividerSoft}` : 'none',
            }}>
              <span style={{...ob.body, color:T.onSurface}}>{m.label}</span>
              {m.kind==='chev' ? Ic.chevR(T.onSurfaceMuted)
               : (
                 <div style={{
                   width:46, height:28, borderRadius:999,
                   background: m.on ? T.brand : T.surfaceMuted,
                   border: m.on ? 'none' : `1px solid ${T.outline}`,
                   position:'relative',
                 }}>
                   <div style={{
                     position:'absolute', top:2, left: m.on ? 20 : 2,
                     width:22, height:22, borderRadius:'50%', background:'#FFFFFF',
                     boxShadow:'0 1px 2px rgba(0,0,0,0.2)',
                   }}/>
                 </div>
               )}
            </div>
          ))}
        </div>
        <div style={{height:32}}/>
        <div style={{textAlign:'center'}}>
          <TextButton T={T} color={T.onSurfaceVariant}>로그아웃</TextButton>
        </div>
      </div>
      <BottomNav T={T} active="me"/>
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.5 CreateSplitScreen
// ═══════════════════════════════════════════════════════════════════
function CreateSplitScreen({mode}){
  const T = makeTheme(mode);
  return (
    <Frame T={T}>
      <AppBar T={T}
        title="내 한입 올리기"
        leading={<IconBtn T={T}>{Ic.chevL(T.onSurface)}</IconBtn>}
      />
      <div style={{
        position:'absolute', top: 44+56, left:0, right:0, bottom: 24+52+16+16,
        overflow:'hidden', padding:'8px 24px 24px',
      }}>
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* Photo slot */}
          <div style={{
            width:'100%', height:180, borderRadius:12,
            background: T.placeholderBg,
            border: `1px dashed ${T.outlineStrong}`,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10,
            color:T.onSurfaceVariant,
          }}>
            {Ic.camera(T.onSurfaceVariant)}
            <div style={{...ob.bodyEmph, color:T.onSurface}}>+ 사진 추가</div>
            <div style={{...ob.caption, color:T.onSurfaceVariant}}>탭하여 카메라/갤러리</div>
          </div>

          <TextField T={T} label="상품명" value="두쫀쿠 4개입" placeholder="예: 두쫀쿠 4개입"/>
          <TextField T={T} label="전체 가격" value="20,000" suffix="원" placeholder="20000"/>
          <TextField T={T} label="전체 수량" value="4" suffix="개" placeholder="4"/>
          <TextField T={T} label="나눌 인원" value="2" suffix="명 (최소 2명)" placeholder="2" focused/>
          <TextField T={T}
            label="주소" value="역삼동 123-45 GS25"
            supporting="GPS: 37.5024, 127.0344"
            trailing={
              <div style={{
                width:32, height:32, borderRadius:8, background:T.brandSurface,
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                color:T.brand,
              }}>{Ic.gps(T.brand)}</div>
            }
          />

          {/* Preview card */}
          <div style={{
            background: T.brandSurface, borderRadius:12, padding:16,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <div style={{...ob.body, color:T.brand, opacity:0.9}}>1인당 예상 가격</div>
              <div style={{...ob.caption, color:T.brand, opacity:0.75, marginTop:2}}>20,000원 ÷ 2명</div>
            </div>
            <div style={{...ob.h1, fontSize:28, color:T.brand, fontWeight:700}}>₩10,000</div>
          </div>
        </div>
      </div>
      {/* Bottom CTA */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:24,
        padding:'16px', background:T.surface,
        borderTop:`1px solid ${T.outline}`,
      }}>
        <PrimaryButton T={T}>내 한입 올리기</PrimaryButton>
      </div>
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.6 SplitDetailScreen
// ═══════════════════════════════════════════════════════════════════
function SplitDetailScreen({mode, ownership='other'}){
  const T = makeTheme(mode);
  // ownership: 'other' | 'self' | 'closed'
  let cta;
  if(ownership==='self') cta = <SecondaryButton T={T} danger>취소하기</SecondaryButton>;
  else if(ownership==='closed') cta = <PrimaryButton T={T} disabled>마감된 한입</PrimaryButton>;
  else cta = <PrimaryButton T={T}>한 입 할게요</PrimaryButton>;

  return (
    <Frame T={T} statusBarOverlay statusBarTintOverride={'#FAFAFA'}>
      {/* product image full bleed at top */}
      <div style={{position:'absolute', top:0, left:0, right:0, height: 414*9/16 + 44}}>
        <ImgPh T={T} radius={0} h="100%" label="product hero"/>
        {/* gradient for status bar legibility */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%)',
        }}/>
      </div>
      {/* Floating appbar */}
      <div style={{position:'absolute', top:44, left:0, right:0, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 8px', zIndex:40}}>
        <button style={{
          width:40, height:40, borderRadius:'50%', background:'rgba(0,0,0,0.4)',
          border:'none', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(8px)',
        }}>{Ic.chevL('#FFFFFF')}</button>
        <button style={{
          width:40, height:40, borderRadius:'50%', background:'rgba(0,0,0,0.4)',
          border:'none', color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(8px)',
        }}>{Ic.share('#FFFFFF')}</button>
      </div>

      {/* Scroll content */}
      <div style={{
        position:'absolute', top: 44 + 414*9/16, left:0, right:0, bottom: 24+52+16+16,
        overflow:'hidden', padding:'24px 24px 24px',
      }}>
        <div style={{display:'flex', flexDirection:'column', gap:24}}>
          {/* title row */}
          <div>
            <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12}}>
              <div style={{...ob.display, color:T.onSurface, flex:1}}>두쫀쿠 4개입</div>
              <div style={{paddingTop:4}}>
                <StatusBadge T={T} status={ownership==='closed'?'COMPLETED':'WAITING'}/>
              </div>
            </div>
            {/* author */}
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
              <div style={{
                width:32, height:32, borderRadius:'50%', background:T.brandSurface, color:T.brand,
                display:'flex', alignItems:'center', justifyContent:'center', ...ob.bodyEmph, fontSize:13,
              }}>지</div>
              <span style={{...ob.body, color:T.onSurface}}>지영</span>
              <span style={{...ob.caption, color:T.onSurfaceVariant}}>·</span>
              <span style={{...ob.caption, color:T.onSurfaceVariant}}>1km</span>
              <span style={{...ob.caption, color:T.onSurfaceVariant}}>·</span>
              <span style={{...ob.caption, color:T.onSurfaceVariant}}>5분 전</span>
            </div>
          </div>

          <div style={{height:1, background:T.outline}}/>

          {/* price box */}
          <div>
            <div style={{...ob.caption, color:T.onSurfaceVariant}}>1인당</div>
            <div style={{...ob.display, fontSize:32, color:T.brand, marginTop:4}}>₩10,000</div>
            <div style={{height:14}}/>
            {[['전체 가격','₩20,000'],['전체 수량','4개'],['나눌 인원','2명']].map(([k,v],i)=>(
              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0'}}>
                <span style={{...ob.body, color:T.onSurfaceVariant}}>{k}</span>
                <span style={{...ob.bodyEmph, color:T.onSurface}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{height:1, background:T.outline}}/>

          {/* location */}
          <div>
            <div style={{...ob.h2, color:T.onSurface}}>위치</div>
            <div style={{height:12}}/>
            <div style={{
              height:160, borderRadius:12, overflow:'hidden', position:'relative',
              border:`1px solid ${T.outline}`,
            }}>
              <svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice">
                <rect width="360" height="160" fill={T.mode==='dark'?'#1B1F25':'#E8EEF0'}/>
                <path d="M-20 60 L380 50" stroke={T.mode==='dark'?'#2B313A':'#FFFFFF'} strokeWidth="14"/>
                <path d="M-20 110 L380 120" stroke={T.mode==='dark'?'#2B313A':'#FFFFFF'} strokeWidth="10"/>
                <path d="M120 -10 L130 180" stroke={T.mode==='dark'?'#2B313A':'#FFFFFF'} strokeWidth="14"/>
                <path d="M240 -10 L250 180" stroke={T.mode==='dark'?'#2B313A':'#FFFFFF'} strokeWidth="10"/>
              </svg>
              <div style={{
                position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -100%)',
              }}>
                <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
                  <path d="M18 1 a16 16 0 0 1 16 16 c0 12 -16 26 -16 26 S2 29 2 17 A16 16 0 0 1 18 1 Z" fill={ONEBITE_TOKENS.brand.green} stroke="#FFFFFF" strokeWidth="2"/>
                  <circle cx="18" cy="17" r="5" fill="#FFFFFF"/>
                </svg>
              </div>
            </div>
            <div style={{...ob.body, color:T.onSurface, marginTop:12}}>역삼동 123-45 GS25 앞</div>
          </div>

          <div style={{...ob.caption, color:T.onSurfaceVariant}}>2026년 5월 18일 등록 · 모집중</div>
        </div>
      </div>

      <div style={{
        position:'absolute', left:0, right:0, bottom:24,
        padding:'16px', background:T.surface,
        borderTop:`1px solid ${T.outline}`,
      }}>{cta}</div>
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5.7 SplitListScreen
// ═══════════════════════════════════════════════════════════════════
function SplitListScreen({mode, empty=false}){
  const T = makeTheme(mode);
  const cards = [
    {title:'두쫀쿠 4개입', location:'역삼동 GS25', distance:'320m', time:'5분 전', perPerson:'10,000', recruiting:2, status:'WAITING'},
    {title:'코스트코 휴지 30롤', location:'양재동', distance:'1.2km', time:'12분 전', perPerson:'7,500', recruiting:3, status:'MATCHED'},
    {title:'딸기 2팩', location:'역삼 이마트', distance:'700m', time:'1시간 전', perPerson:'6,000', recruiting:2, status:'WAITING'},
  ];
  return (
    <Frame T={T}>
      <AppBar T={T}
        title="내 나눠사기"
        leading={<IconBtn T={T}>{Ic.chevL(T.onSurface)}</IconBtn>}
      />
      {/* Segment control */}
      <div style={{padding:'8px 16px 12px'}}>
        <div style={{
          height:40, borderRadius:999, background:T.surfaceMuted,
          padding:4, display:'flex',
        }}>
          {[
            {label:'진행중', active:true},
            {label:'완료', active:false},
          ].map((t,i)=>(
            <div key={i} style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:999,
              background: t.active ? T.surface : 'transparent',
              boxShadow: t.active && T.mode==='light' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              border: t.active && T.mode==='dark' ? `1px solid ${T.outline}` : 'none',
              ...ob.bodyEmph, fontSize:14,
              color: t.active ? T.onSurface : T.onSurfaceVariant,
            }}>{t.label}</div>
          ))}
        </div>
      </div>
      {empty ? (
        <div style={{
          position:'absolute', top:44+56+60, left:0, right:0, bottom:24,
          display:'flex', flexDirection:'column', alignItems:'center',
          padding:'0 24px',
        }}>
          <div style={{
            width:240, height:240, borderRadius:24,
            background:T.placeholderBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:T.placeholderFg,
          }}>{Ic.burger(T.placeholderFg)}</div>
          <div style={{height:24}}/>
          <div style={{...ob.h2, color:T.onSurface}}>아직 한입이 없어요</div>
          <div style={{height:4}}/>
          <div style={{...ob.body, color:T.onSurfaceVariant}}>첫 한입을 올려보세요</div>
          <div style={{height:24}}/>
          <div style={{width:240}}><PrimaryButton T={T}>내 한입 올리기</PrimaryButton></div>
        </div>
      ) : (
        <div style={{
          position:'absolute', top: 44+56+60, left:0, right:0, bottom:24,
          overflow:'hidden', padding:'0 16px',
        }}>
          <div style={{display:'flex', flexDirection:'column', gap:12, paddingBottom:24}}>
            {cards.map((c,i)=>(<SplitCard key={i} T={T} {...c} imgLabel="product"/>))}
          </div>
        </div>
      )}
      <HomeIndicator T={T}/>
    </Frame>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Canvas layout
// ═══════════════════════════════════════════════════════════════════
function App(){
  const screens = [
    {id:'login', title:'5.1  LoginScreen', subtitle:'첫 진입 · OAuth 4종 + 둘러보기', render:(m)=><LoginScreen mode={m}/>},
    {id:'home', title:'5.2  HomeTab', subtitle:'근처 나눠사기 피드 · 필터 · FAB', render:(m)=><HomeTab mode={m}/>},
    {id:'map',  title:'5.3  MapTab', subtitle:'지도 + 핀 + 선택 카드', render:(m)=><MapTab mode={m}/>},
    {id:'profile-guest', title:'5.4a  ProfileTab — Guest', subtitle:'비로그인 상태', render:(m)=><ProfileTab mode={m} variant="guest"/>},
    {id:'profile', title:'5.4b  ProfileTab — Logged In', subtitle:'프로필 + 메뉴', render:(m)=><ProfileTab mode={m} variant="loggedIn"/>},
    {id:'create',  title:'5.5  CreateSplitScreen', subtitle:'사진 + 폼 + 인당가격 미리보기', render:(m)=><CreateSplitScreen mode={m}/>},
    {id:'detail',  title:'5.6  SplitDetailScreen', subtitle:'상세 + 참여/취소 CTA', render:(m)=><SplitDetailScreen mode={m}/>},
    {id:'list',    title:'5.7a  SplitListScreen', subtitle:'리스트 + 세그먼트', render:(m)=><SplitListScreen mode={m}/>},
    {id:'list-empty', title:'5.7b  SplitListScreen — Empty', subtitle:'빈 상태', render:(m)=><SplitListScreen mode={m} empty/>},
  ];

  return (
    <DesignCanvas>
      <DCSection id="cover" title="한입 (One Bite)" subtitle="iPhone 14 · 414×896 · Pretendard · 9 컴포지션 × Light/Dark = 18 프레임">
      </DCSection>
      {screens.map(s=>(
        <DCSection key={s.id} id={s.id} title={s.title} subtitle={s.subtitle}>
          <DCArtboard id={`${s.id}-light`} label="Light" width={414} height={896}>
            {s.render('light')}
          </DCArtboard>
          <DCArtboard id={`${s.id}-dark`} label="Dark" width={414} height={896}>
            {s.render('dark')}
          </DCArtboard>
        </DCSection>
      ))}
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
