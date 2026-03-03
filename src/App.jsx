import React, { useState, useRef, useMemo } from 'react';
import { 
  PlusCircle, RotateCcw, CheckCircle2, Maximize, 
  MousePointer2, Move, Target, Copy, ClipboardCheck
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
  const [points, setPoints] = useState({});
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

  // --- Geometry Engine ---
  const results = useMemo(() => {
    if (Object.keys(points).length < 10) return null;

    const getAngle = (pA, pB, pC, pD) => {
      try {
        const v1 = { x: pB.x - pA.x, y: pB.y - pA.y };
        const v2 = { x: pD.x - pC.x, y: pD.y - pC.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const cosTheta = dot / (mag1 * mag2);
        return (Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI;
      } catch (e) { return 0; }
    };

    const mldfa = getAngle(points.p1, points.p4, points.mfc, points.lfc);
    const mmpta = getAngle(points.p5, points.p6, points.mtp, points.ltp);
    const hka = 180 - getAngle(points.p1, points.p4, points.p5, points.p6);
    const ama = getAngle(points.p1, points.p4, points.p2, points.p3);
    const jlca = getAngle(points.mfc, points.lfc, points.mtp, points.ltp);
    
    const ahka = side === 'Right' ? (mmpta - mldfa) : (mldfa - mmpta);
    const jlo = mmpta + mldfa;

    const ahkaIdx = ahka < -2 ? 0 : ahka > 2 ? 2 : 1;
    const jloIdx = jlo < 174 ? 0 : jlo > 180 ? 2 : 1;
    
    return {
      rows: [
        { label: 'HKA Angle', value: `${hka.toFixed(1)}°` },
        { label: 'AMA Angle', value: `${ama.toFixed(1)}°` },
        { label: 'mLDFA', value: `${mldfa.toFixed(1)}°` },
        { label: 'mMPTA', value: `${mmpta.toFixed(1)}°` },
        { label: 'JLCA', value: `${jlca.toFixed(1)}°` },
        { label: 'aHKA', value: `${ahka.toFixed(1)}°` },
        { label: 'JLO', value: `${jlo.toFixed(1)}°` },
      ],
      phenotype: CPAK_MATRIX[jloIdx][ahkaIdx]
    };
  }, [points, side]);

  // --- Interaction Handlers ---
  const handleCopy = () => {
    if (!results) return;
    const data = `ArthroMeasure - Knee Result (${side} Side)\n---\n` + 
      results.rows.map(r => `${r.label}: ${r.value}`).join('\n') + 
      `\nCPAK: ${results.phenotype}`;
    navigator.clipboard.writeText(data);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const getRelativeCoords = (clientX, clientY) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning) {
      setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (draggingId) {
      setPoints(prev => ({ ...prev, [draggingId]: { ...prev[draggingId], x: coords.x, y: coords.y } }));
    } else if (resizingId) {
      const p = points[resizingId];
      const dx = coords.x - p.x;
      const dy = (coords.y - p.y) * (imageRef.current.clientHeight / imageRef.current.clientWidth);
      const newR = Math.sqrt(dx * dx + dy * dy);
      setPoints(prev => ({ ...prev, [resizingId]: { ...prev[resizingId], r: Math.max(0.5, newR) } }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (f) => setImage(f.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F5F2ED] font-sans text-[#4A4A4A] overflow-hidden select-none" 
         onMouseMove={handleMouseMove} onContextMenu={(e) => e.preventDefault()}>
      
      {/* Sidebar Control Panel */}
      <aside className="w-80 bg-white border-r border-[#E5DED1] flex flex-col shadow-sm z-30">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-light tracking-tighter text-[#2D2D2D] mb-6">ArthroMeasure - Knee</h1>
          <div className="flex bg-[#FAF8F5] p-1 rounded-lg border border-[#E5DED1]">
            {['Left', 'Right'].map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-md ${
                  side === s ? 'bg-white shadow-sm text-[#8B7E66]' : 'text-[#C2B9AC] hover:text-[#A59D90]'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-2 space-y-1">
          {LANDMARK_SCHEMA.map((step, index) => (
            <div key={step.id} 
              onMouseEnter={() => setHoveredId(step.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center gap-3 p-2 rounded-lg border text-[10px] transition-all relative cursor-help ${
                hoveredId === step.id ? 'bg-[#FDFBF7] border-[#D7C4A3] shadow-sm' : 
                index === activeStep ? 'bg-[#FAF8F5] border-[#E5DED1]' :
                index < activeStep ? 'bg-white border-green-100 opacity-80' : 'bg-white border-transparent opacity-30'
            }`}>
              {index < activeStep ? <CheckCircle2 size={12} className="text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300 flex items-center justify-center text-[7px]">{index + 1}</div>}
              <span className="font-semibold">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Dynamic Hints Tooltip */}
        {hoveredId && !imageRef.current?.contains(document.elementFromPoint(mousePos.x, mousePos.y)) && (
          <div className="fixed pointer-events-none z-50" style={{ left: mousePos.x + 20, top: mousePos.y - 10 }}>
            <div className="bg-[#2D2D2D] border border-white/10 p-4 rounded-2xl shadow-2xl max-w-[200px]">
              <div className="flex items-center gap-2 mb-2 text-[#8B7E66]">
                <Target size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Guide</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed italic">{LANDMARK_SCHEMA.find(s => s.id === hoveredId)?.hint}</p>
            </div>
          </div>
        )}

        {/* Clinical Measurement Dashboard */}
        <div className="p-6 bg-[#FAF8F5] border-t border-[#E5DED1] space-y-4">
          {results ? (
            <>
              <div className="w-full border border-[#E5DED1] rounded-lg overflow-hidden bg-white shadow-sm">
                {results.rows.map((row) => (
                  <div key={row.label} className="flex border-b border-[#F5F2ED] last:border-0">
                    <div className="w-1/2 p-2 px-3 text-[10px] font-bold text-[#A59D90] uppercase tracking-wider border-r border-[#F5F2ED]">
                      {row.label}
                    </div>
                    <div className="w-1/2 p-2 px-3 text-[10px] font-bold text-[#2D2D2D] font-mono text-right">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[8px] font-bold text-[#A59D90] uppercase tracking-widest mb-1 px-1">CPAK Phenotype</p>
                <p className="text-[10px] font-bold text-[#8B7E66] px-1 uppercase leading-tight">{results.phenotype}</p>
              </div>
              <button onClick={handleCopy} className="w-full bg-[#8B7E66] text-white py-3 rounded-xl text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 mt-1 hover:bg-[#2D2D2D] transition-all">
                {copying ? <ClipboardCheck size={14}/> : <Copy size={14}/>} {copying ? "Copied" : "Export Study"}
              </button>
            </>
          ) : (
            <p className="text-[10px] text-[#C2B9AC] text-center py-4 italic font-medium">Place landmarks to view analysis.</p>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 bg-[#050505] flex items-center justify-center relative overflow-hidden" ref={containerRef}>
        
        {/* Navigation HUD (Top Left) */}
        <div className="absolute top-8 left-8 z-40 bg-black/50 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-2 pointer-events-none">
          <div className="flex gap-6 text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">
            <span className="flex items-center gap-2.5">
              <MousePointer2 size={12} className="text-[#8B7E66]" /> 
              Scroll: Zoom
            </span>
            <div className="w-px h-3 bg-white/10 self-center" />
            <span className="flex items-center gap-2.5">
              <Move size={12} className="text-[#8B7E66]" /> 
              Right-Click + Drag: Pan image
            </span>
          </div>
          {image && activeStep < LANDMARK_SCHEMA.length && (
             <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-white tracking-wide uppercase font-bold italic opacity-90">
               {side} / {LANDMARK_SCHEMA[activeStep].label}
             </div>
          )}
        </div>

        {/* Global Reset (Top Right) */}
        <button 
          onClick={() => { setPoints({}); setActiveStep(0); setScale(1); setOffset({x:0,y:0}); }}
          className="absolute top-8 right-8 z-40 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white shadow-2xl transition-all"
        >
          <RotateCcw size={20} />
        </button>

        {!image ? (
          <div className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-[#222] rounded-[40px] flex flex-col items-center justify-center text-[#444] hover:border-[#8B7E66] transition-all cursor-pointer bg-[#0A0A0A]">
            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <PlusCircle size={32} className="mb-4 text-[#8B7E66] opacity-30" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Load Study</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center cursor-crosshair"
            onMouseDown={(e) => {
              if (e.button === 2 || e.shiftKey) { setIsPanning(true); return; }
              if (activeStep < LANDMARK_SCHEMA.length) {
                setPoints(prev => ({ ...prev, [LANDMARK_SCHEMA[activeStep].id]: { ...getRelativeCoords(e.clientX, e.clientY), r: 2.5 } }));
                setActiveStep(prev => prev + 1);
              }
            }}
            onMouseUp={() => { setDraggingId(null); setResizingId(null); setIsPanning(false); }}
            onWheel={(e) => setScale(prev => Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 15))}
          >
            <div ref={imageRef} className="relative transition-transform duration-75 ease-out"
              style={{ height: '94vh', aspectRatio: '9/16', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center' }}>
              <img src={image} className="w-full h-full object-contain opacity-50 pointer-events-none select-none shadow-2xl" alt="Radiograph" />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {points.p1 && points.p4 && <line x1={`${points.p1.x}%`} y1={`${points.p1.y}%`} x2={`${points.p4.x}%`} y2={`${points.p4.y}%`} stroke="#B4C6A6" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.p2 && points.p3 && <line x1={`${points.p2.x}%`} y1={`${points.p2.y}%`} x2={`${points.p3.x}%`} y2={`${points.p3.y}%`} stroke="#8E9AAF" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray="5,5" />}
                {points.p5 && points.p6 && <line x1={`${points.p5.x}%`} y1={`${points.p5.y}%`} x2={`${points.p6.x}%`} y2={`${points.p6.y}%`} stroke="#E29578" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.mfc && points.lfc && <line x1={`${points.mfc.x}%`} y1={`${points.mfc.y}%`} x2={`${points.lfc.x}%`} y2={`${points.lfc.y}%`} stroke="white" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.mtp && points.ltp && <line x1={`${points.mtp.x}%`} y1={`${points.mtp.y}%`} x2={`${points.ltp.x}%`} y2={`${points.ltp.y}%`} stroke="white" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
                {points.p1 && points.p6 && <line x1={`${points.p1.x}%`} y1={`${points.p1.y}%`} x2={`${points.p6.x}%`} y2={`${points.p6.y}%`} stroke="#00F2FF" strokeWidth="0.5" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" opacity="0.3" />}
              </svg>

              {Object.entries(points).map(([id, p]) => (
                <div key={id} 
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onMouseDown={(e) => { e.stopPropagation(); setDraggingId(id); }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-auto transition-colors flex items-center justify-center group ${
                    draggingId === id || hoveredId === id ? 'border-[#fbbf24] bg-white/10 z-50' : 'border-white bg-transparent z-40'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.r * 2}%`, height: `${p.r * 2 * (9/16)}%` }}
                >
                  <div className="w-[1px] h-[1px] bg-white rounded-full shadow-sm" />
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); setResizingId(id); }}
                    className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full cursor-nwse-resize border-2 border-[#050505] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ transform: 'translate(50%, 50%)' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={() => {setScale(1); setOffset({x:0,y:0});}} className="absolute bottom-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-all backdrop-blur-md">
               <Maximize size={20} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}