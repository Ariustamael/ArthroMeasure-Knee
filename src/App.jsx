import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  PlusCircle, RotateCcw, CheckCircle2, Maximize, 
  MousePointer2, Move, Target, Copy, ClipboardCheck,
  Monitor, Clipboard
} from 'lucide-react';

// --- Clinical Landmark Schema ---
const LANDMARK_SCHEMA = [
  { id: 'p1', label: 'Center of Femoral Head (P1)', hint: 'Geometric center of the best-fit circle for the femoral head.' },
  { id: 'p2', label: 'Proximal Femoral Shaft (P2)', hint: 'Center of medullary canal at level of lesser trochanter.' },
  { id: 'p3', label: 'Distal Femoral Shaft (P3)', hint: 'Center of medullary canal ~10cm proximal to joint.' },
  { id: 'p4', label: 'Femoral Knee Center (P4)', hint: 'Apex of the intercondylar notch.' },
  { id: 'mfc', label: 'Medial Femoral Condyle (MFC)', hint: 'Most distal point of the medial condyle.' },
  { id: 'lfc', label: 'Lateral Femoral Condyle (LFC)', hint: 'Most distal point of the lateral condyle.' },
  { id: 'p5', label: 'Tibial Knee Center (P5)', hint: 'Midpoint between the tibial spines.' },
  { id: 'mtp', label: 'Medial Tibial Plateau (MTP)', hint: 'Center of the medial articular surface.' },
  { id: 'ltp', label: 'Lateral Tibial Plateau (LTP)', hint: 'Center of the lateral articular surface.' },
  { id: 'p6', label: 'Ankle Center (P6)', hint: 'Midpoint of the talar dome.' },
];

const CPAK_MATRIX = [
  ['Type I: Varus / Apex Distal', 'Type IV: Neutral / Apex Distal', 'Type VII: Valgus / Apex Distal'],
  ['Type II: Varus / Neutral', 'Type V: Neutral / Neutral', 'Type VIII: Valgus / Neutral'],
  ['Type III: Varus / Apex Proximal', 'Type VI: Neutral / Apex Proximal', 'Type IX: Valgus / Apex Proximal']
];

export default function ArthroMeasureKnee() {
  const [image, setImage] = useState(null);
  const [side, setSide] = useState('Right');
  const [points, setPoints] = useState({}); // { id: {x, y, r, angle} }
  const [activeStep, setActiveStep] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [copying, setCopying] = useState(false);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // --- 1. Interaction & Bypass Logic ---
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => setImage(event.target.result);
          reader.readAsDataURL(blob);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      video.onloadedmetadata = () => {
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          setImage(canvas.toDataURL('image/png'));
          stream.getTracks().forEach(t => t.stop());
        }, 500);
      };
    } catch (err) { console.error(err); }
  };

  // --- 2. Geometry Engine ---
  const results = useMemo(() => {
    if (Object.keys(points).length < 10) return null;

    const getAngle = (pA, pB, pC, pD) => {
      const v1 = { x: pB.x - pA.x, y: pB.y - pA.y };
      const v2 = { x: pD.x - pC.x, y: pD.y - pC.y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
      return (Math.acos(cosTheta) * 180) / Math.PI;
    };

    const mldfa = getAngle(points.p1, points.p4, points.mfc, points.lfc);
    const mmpta = getAngle(points.p5, points.p6, points.mtp, points.ltp);
    const hka = 180 - getAngle(points.p1, points.p4, points.p5, points.p6);
    const ama = getAngle(points.p1, points.p4, points.p2, points.p3);
    const jlca = getAngle(points.mfc, points.lfc, points.mtp, points.ltp);
    const ahka = side === 'Right' ? (mmpta - mldfa) : (mldfa - mmpta);
    const jlo = mmpta + mldfa;

    const ahIdx = ahka < -2 ? 0 : ahka > 2 ? 2 : 1;
    const jlIdx = jlo < 174 ? 0 : jlo > 180 ? 2 : 1;
    
    return {
      rows: [
        { l: 'HKA Angle', v: `${hka.toFixed(1)}°` },
        { l: 'AMA Angle', v: `${ama.toFixed(1)}°` },
        { l: 'mLDFA', v: `${mldfa.toFixed(1)}°` },
        { l: 'mMPTA', v: `${mmpta.toFixed(1)}°` },
        { l: 'JLCA', v: `${jlca.toFixed(1)}°` },
        { l: 'aHKA', v: `${ahka.toFixed(1)}°` },
        { l: 'JLO', v: `${jlo.toFixed(1)}°` },
      ],
      phenotype: CPAK_MATRIX[jlIdx][ahIdx]
    };
  }, [points, side]);

  // --- 3. Transformation Utilities ---
  const getRelativeCoords = (clientX, clientY) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning) {
      setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (draggingId) {
      setPoints(p => ({ ...p, [draggingId]: { ...p[draggingId], x: coords.x, y: coords.y } }));
    } else if (resizingId) {
      const p = points[resizingId];
      const dx = (coords.x - p.x);
      const dy = (coords.y - p.y) * (imageRef.current.clientHeight / imageRef.current.clientWidth);
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      setPoints(prev => ({ ...prev, [resizingId]: { ...prev[resizingId], r: Math.max(0.4, dist), angle: angle } }));
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F5F2ED] font-sans text-[#4A4A4A] overflow-hidden select-none" 
         onMouseMove={handleMouseMove} onContextMenu={(e) => e.preventDefault()}>
      
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-[#E5DED1] flex flex-col shadow-sm z-30">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-light tracking-tighter text-[#2D2D2D] mb-6">ArthroMeasure - Knee</h1>
          <div className="flex bg-[#FAF8F5] p-1 rounded-lg border border-[#E5DED1]">
            {['Left', 'Right'].map(s => (
              <button key={s} onClick={() => setSide(s)} className={`flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-md ${side === s ? 'bg-white shadow-sm text-[#8B7E66]' : 'text-[#C2B9AC] hover:text-[#A59D90]'}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-2 space-y-1">
          {LANDMARK_SCHEMA.map((step, index) => (
            <div key={step.id} 
              onMouseEnter={() => setHoveredId(step.id)} onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center gap-3 p-2.5 rounded-lg border text-[10px] transition-all relative ${hoveredId === step.id ? 'bg-[#FDFBF7] border-[#8B7E66] shadow-sm' : index === activeStep ? 'bg-[#FAF8F5] border-[#E5DED1]' : index < activeStep ? 'bg-white border-green-100 opacity-80' : 'bg-white border-transparent opacity-30'}`}>
              {index < activeStep ? <CheckCircle2 size={12} className="text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[7px]">{index + 1}</div>}
              <span className="font-semibold">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Measurement Table */}
        <div className="p-6 bg-[#FAF8F5] border-t border-[#E5DED1] space-y-4">
          {results ? (
            <>
              <div className="w-full border border-[#E5DED1] rounded-lg overflow-hidden bg-white shadow-sm">
                {results.rows.map((row) => (
                  <div key={row.l} className="flex border-b border-[#F5F2ED] last:border-0 h-8 items-center font-sans">
                    <div className="w-1/2 px-3 text-[10px] font-bold text-[#A59D90] uppercase tracking-wider border-r border-[#F5F2ED] truncate">{row.l}</div>
                    <div className="w-1/2 px-3 text-[10px] font-bold text-[#2D2D2D] font-mono text-right">{row.v}</div>
                  </div>
                ))}
              </div>
              <div className="px-1">
                <p className="text-[8px] font-bold text-[#A59D90] uppercase tracking-widest mb-1">CPAK Phenotype</p>
                <p className="text-[10px] font-bold text-[#8B7E66] leading-tight uppercase">{results.phenotype}</p>
              </div>
              <button onClick={() => {
                const text = `ArthroMeasure - Knee Result (${side} Side)\n---\n` + results.rows.map(r => `${r.l}: ${r.v}`).join('\n') + `\nCPAK: ${results.phenotype}`;
                navigator.clipboard.writeText(text); setCopying(true); setTimeout(() => setCopying(false), 2000);
              }} className="w-full bg-[#8B7E66] text-white py-3 rounded-xl text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-[#2D2D2D] transition-all">
                {copying ? <ClipboardCheck size={14}/> : <Copy size={14}/>} {copying ? "Copied" : "Export Study"}
              </button>
            </>
          ) : ( <p className="text-[10px] text-[#C2B9AC] text-center py-4 italic">Complete landmarks to initiate analysis.</p> )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 bg-[#050505] flex items-center justify-center relative overflow-hidden" ref={containerRef}>
        
        {/* Navigation HUD */}
        <div className="absolute top-8 left-8 z-40 bg-black/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col gap-3 pointer-events-none text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-3"><MousePointer2 size={12} className="text-[#8B7E66]" /> SCROLL: ZOOM</div>
          <div className="flex items-center gap-3"><Move size={12} className="text-[#8B7E66]" /> RIGHT CLICK + DRAG: PAN</div>
          <div className="flex items-center gap-3"><Clipboard size={12} className="text-[#8B7E66]" /> CTRL + V: PASTE</div>
          {image && activeStep < LANDMARK_SCHEMA.length && (
             <div className="mt-1 pt-3 border-t border-white/10 text-white text-[10px] italic">Indicate: {LANDMARK_SCHEMA[activeStep].label}</div>
          )}
        </div>

        {/* Global Reset Button */}
        <button 
          onClick={() => { setImage(null); setPoints({}); setActiveStep(0); setScale(1); setOffset({x:0,y:0}); }}
          className="absolute top-8 right-8 z-40 p-3 bg-white/5 hover:bg-white/20 rounded-full border border-white/10 text-white shadow-2xl transition-all"
        >
          <RotateCcw size={20} />
        </button>

        {!image ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-[#222] rounded-[40px] flex flex-col items-center justify-center text-[#444] hover:border-[#8B7E66] transition-all bg-[#0A0A0A] relative group">
              <input type="file" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const r = new FileReader(); r.onload = (f) => setImage(f.target.result); r.readAsDataURL(file);
                }
              }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <PlusCircle size={32} className="mb-4 text-[#8B7E66] opacity-30" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em]">LOAD STUDY</p>
            </div>
            <button onClick={handleScreenCapture} className="flex items-center gap-2 px-6 py-3 bg-[#111] border border-white/5 rounded-full text-white/50 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">
              <Monitor size={14} className="text-[#8B7E66]"/> Capture Window
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center cursor-crosshair"
            onMouseDown={(e) => {
              if (e.button === 2 || e.shiftKey) { setIsPanning(true); return; }
              if (activeStep < LANDMARK_SCHEMA.length) {
                setPoints(p => ({ ...p, [LANDMARK_SCHEMA[activeStep].id]: { ...getRelativeCoords(e.clientX, e.clientY), r: 1.5, angle: 0.8 } }));
                setActiveStep(s => s + 1);
              }
            }}
            onMouseUp={() => { setDraggingId(null); setResizingId(null); setIsPanning(false); }}
            onWheel={(e) => setScale(s => Math.min(Math.max(s * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 15))}
          >
            <div ref={imageRef} className="relative transition-transform duration-75 ease-out select-none"
              style={{ height: '94vh', aspectRatio: '9/16', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center' }}>
              <img src={image} className="w-full h-full object-contain opacity-50 pointer-events-none select-none shadow-2xl" alt="Study" />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {points.p1 && points.p4 && <line x1={`${points.p1.x}%`} y1={`${points.p1.y}%`} x2={`${points.p4.x}%`} y2={`${points.p4.y}%`} stroke="#B4C6A6" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.p2 && points.p3 && <line x1={`${points.p2.x}%`} y1={`${points.p2.y}%`} x2={`${points.p3.x}%`} y2={`${points.p3.y}%`} stroke="#8E9AAF" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray="5,5" />}
                {points.p5 && points.p6 && <line x1={`${points.p5.x}%`} y1={`${points.p5.y}%`} x2={`${points.p6.x}%`} y2={`${points.p6.y}%`} stroke="#E29578" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.mfc && points.lfc && <line x1={`${points.mfc.x}%`} y1={`${points.mfc.y}%`} x2={`${points.lfc.x}%`} y2={`${points.lfc.y}%`} stroke="white" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.mtp && points.ltp && <line x1={`${points.mtp.x}%`} y1={`${points.mtp.y}%`} x2={`${points.ltp.x}%`} y2={`${points.ltp.y}%`} stroke="white" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.p1 && points.p6 && <line x1={`${points.p1.x}%`} y1={`${points.p1.y}%`} x2={`${points.p6.x}%`} y2={`${points.p6.y}%`} stroke="#00F2FF" strokeWidth="0.5" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" opacity="0.3" />}
              </svg>

              {Object.entries(points).map(([id, p]) => {
                const handlePx = Math.min(10, Math.max(5, (p.r * 12))); 
                return (
                  <div key={id} 
                    onMouseEnter={() => setHoveredId(id)} onMouseLeave={() => setHoveredId(null)}
                    onMouseDown={(e) => { e.stopPropagation(); setDraggingId(id); }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-auto flex items-center justify-center group ${draggingId === id || hoveredId === id ? 'border-[#fbbf24] bg-white/10 z-50 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-white bg-transparent z-40'}`}
                    style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.r * 2}%`, height: `${p.r * 2 * (imageRef.current.clientWidth / imageRef.current.clientHeight)}%`, overflow: 'visible' }}
                  >
                    <div className="w-[1.5px] h-[1.5px] bg-white rounded-full shadow-sm" />
                    
                    {/* Ghost Handle: Radial Clamped orbit */}
                    <div 
                      onMouseDown={(e) => { e.stopPropagation(); setResizingId(id); }} 
                      className="absolute bg-white rounded-full cursor-nwse-resize border border-black/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-[60]" 
                      style={{ 
                        width: `${handlePx}px`, 
                        height: `${handlePx}px`,
                        left: `${50 + 50 * Math.cos(p.angle || 0)}%`,
                        top: `${50 + 50 * Math.sin(p.angle || 0)}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: resizingId === id ? 0.4 : undefined
                      }} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Sidebar Hint (Sidebar Hover Only) */}
            {hoveredId && !imageRef.current?.contains(document.elementFromPoint(mousePos.x, mousePos.y)) && (
              <div className="fixed pointer-events-none z-50 shadow-2xl" style={{ left: mousePos.x + 20, top: mousePos.y - 10 }}>
                <div className="bg-[#2D2D2D] border border-white/10 p-4 rounded-2xl max-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 text-[#8B7E66] uppercase font-bold text-[8px] tracking-widest"><Target size={14} /> Surgical Guide</div>
                  <p className="text-[10px] text-white/70 italic leading-relaxed">{LANDMARK_SCHEMA.find(s => s.id === hoveredId)?.hint}</p>
                </div>
              </div>
            )}
            <button onClick={() => {setScale(1); setOffset({x:0,y:0});}} className="absolute bottom-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white backdrop-blur-md transition-all"><Maximize size={20} /></button>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Visual Helpers ---
const ResultRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1 border-b border-[#F5F2ED] last:border-0 h-8 items-center">
    <div className="w-1/2 px-3 text-[10px] font-bold text-[#A59D90] uppercase tracking-wider border-r border-[#F5F2ED] truncate">{label}</div>
    <div className="w-1/2 px-3 text-[10px] font-bold text-[#2D2D2D] font-mono text-right">{value}</div>
  </div>
);
