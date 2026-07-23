import React, { useState, useMemo } from "react";
import { Plus, Trash2, Droplets, Sun, Snowflake, AlertTriangle, CheckCircle2 } from "lucide-react";

// --- physics helpers ---
function psat(tempC) {
  // Magnus formula, Pa
  return 611.2 * Math.exp((17.62 * tempC) / (243.12 + tempC));
}

const defaultLayers = [
  { id: 1, name: "Barro-paja (revoque grueso, 20% fibra)", e: 0.20, lambda: 0.35, mu: 7, side: "core" },
  { id: 2, name: "Pintura aceite + cera de abeja", e: 0.0002, lambda: 0.20, mu: 500, side: "core" },
];

export default function GlaserCalculator() {
  const [layers, setLayers] = useState(defaultLayers);
  const [tInt, setTInt] = useState(20);
  const [hrInt, setHrInt] = useState(50);
  const [tExt, setTExt] = useState(0);
  const [hrExt, setHrExt] = useState(85);
  const [rsi] = useState(0.13);
  const [rse] = useState(0.04);

  const addLayer = () => {
    setLayers([...layers, { id: Date.now(), name: "Nueva capa", e: 0.01, lambda: 0.5, mu: 10, side: "core" }]);
  };
  const removeLayer = (id) => setLayers(layers.filter((l) => l.id !== id));
  const updateLayer = (id, field, value) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const result = useMemo(() => {
    const rLayers = layers.map((l) => l.e / l.lambda);
    const rTotal = rsi + rLayers.reduce((a, b) => a + b, 0) + rse;
    const q = (tInt - tExt) / rTotal;

    // temperature at each interface, starting interior surface
    let rAcc = rsi;
    const tempPoints = [tInt - q * rAcc]; // interior surface temp
    layers.forEach((l) => {
      rAcc += l.e / l.lambda;
      tempPoints.push(tInt - q * rAcc);
    });

    const sdLayers = layers.map((l) => l.mu * l.e);
    const sdTotal = sdLayers.reduce((a, b) => a + b, 0);

    const pvInt = psat(tInt) * (hrInt / 100);
    const pvExt = psat(tExt) * (hrExt / 100);

    let sdAcc = 0;
    const vaporPoints = [pvInt];
    layers.forEach((l) => {
      sdAcc += l.mu * l.e;
      const frac = sdTotal > 0 ? sdAcc / sdTotal : 1;
      vaporPoints.push(pvInt - (pvInt - pvExt) * frac);
    });

    const satPoints = tempPoints.map((t) => psat(t));

    const margins = tempPoints.map((t, i) => satPoints[i] - vaporPoints[i]);
    const minMarginIdx = margins.reduce((best, m, i) => (m < margins[best] ? i : best), 0);
    const condenses = margins[minMarginIdx] < 0;

    return {
      q,
      rTotal,
      u: 1 / rTotal,
      tempPoints,
      satPoints,
      vaporPoints,
      margins,
      minMarginIdx,
      condenses,
      minMargin: margins[minMarginIdx],
    };
  }, [layers, tInt, hrInt, tExt, hrExt, rsi, rse]);

  const totalThickness = layers.reduce((a, l) => a + l.e, 0);

  // layout geometry for wall cross-section
  const wallW = 640;
  const wallStartX = 40;
  let cum = 0;
  const layerRects = layers.map((l) => {
    const x = wallStartX + (cum / totalThickness) * wallW;
    const w = (l.e / totalThickness) * wallW;
    cum += l.e;
    return { ...l, x, w };
  });
  const pointXs = [wallStartX, ...layerRects.map((l) => l.x + l.w)];

  // graph scales
  const allTemps = [...result.tempPoints, tInt, tExt];
  const tMin = Math.min(...allTemps) - 3;
  const tMax = Math.max(...allTemps) + 3;
  const allPress = [...result.satPoints, ...result.vaporPoints];
  const pMin = 0;
  const pMax = Math.max(...allPress) * 1.15;

  const graphH = 260;
  const graphTop = 20;
  const yForP = (p) => graphTop + graphH - ((p - pMin) / (pMax - pMin)) * graphH;

  const satPath = pointXs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${yForP(result.satPoints[i])}`).join(" ");
  const vapPath = pointXs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${yForP(result.vaporPoints[i])}`).join(" ");

  return (
    <div className="min-h-screen w-full" style={{ background: "#E9E2D3", fontFamily: "'Spectral', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=Spectral+SC:wght@500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .mono { font-family: 'JetBrains Mono', monospace; }
        .sc { font-family: 'Spectral SC', serif; letter-spacing: 0.04em; }
        input[type=range] { -webkit-appearance: none; height: 4px; background: #B08968; border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #7A4E2D; border: 2px solid #E9E2D3; cursor: pointer; box-shadow: 0 0 0 1px #7A4E2D; }
        .drip { animation: dripfall 1.8s ease-in infinite; }
        @keyframes dripfall { 0% { transform: translateY(0); opacity: 0.9;} 80% { opacity: 0.9;} 100% { transform: translateY(10px); opacity: 0;} }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 border-b-2 pb-6" style={{ borderColor: "#7A4E2D" }}>
          <div className="sc text-xs tracking-widest mb-2" style={{ color: "#8B6F47" }}>MÉTODO GLASER · ISO 13788</div>
          <h1 className="text-4xl font-semibold" style={{ color: "#3D2B1F" }}>
            Condensación intersticial en muros de tierra
          </h1>
          <p className="mt-2 text-base" style={{ color: "#6B5744" }}>
            Corte capa por capa. Perfil de temperatura, presión de saturación y presión de vapor real.
          </p>
        </div>

        {/* Formula */}
        <div className="mb-8 p-6 rounded-sm border" style={{ background: "#F3EDE0", borderColor: "#C9B896" }}>
          <div className="sc text-sm mb-4" style={{ color: "#3D2B1F" }}>FÓRMULA — MÉTODO GLASER (RÉGIMEN ESTACIONARIO)</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mono text-sm" style={{ color: "#3D2B1F" }}>
            <div>
              <div className="text-xs mb-1" style={{ color: "#8B6F47" }}>Resistencia térmica y flujo de calor</div>
              <div>R = e / λ &nbsp;&nbsp;[m²K/W]</div>
              <div>R_total = R_si + ΣR_capas + R_se</div>
              <div>q = ΔT / R_total &nbsp;&nbsp;[W/m²]</div>
              <div className="mt-2">T_x = T_int − q·(R_si + ΣR_hasta_x)</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "#8B6F47" }}>Difusión de vapor y presión de saturación</div>
              <div>Sd = μ · e &nbsp;&nbsp;[m] — espesor de aire equivalente</div>
              <div>Psat(T) = 611.2 · e^(17.62·T / (243.12+T)) &nbsp;[Pa]</div>
              <div className="mt-2">Pv_x = Pv_int − (Pv_int−Pv_ext)·(Sd_hasta_x / Sd_total)</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t text-xs" style={{ borderColor: "#C9B896", color: "#6B5744" }}>
            Condensa en el punto x donde <span className="mono">Pv_x &gt; Psat(T_x)</span> — la presión de vapor real supera a la de saturación posible a esa temperatura.
          </div>
        </div>

        {/* Reference table */}
        <div className="mb-10 p-6 rounded-sm border" style={{ background: "#F3EDE0", borderColor: "#C9B896" }}>
          <div className="sc text-sm mb-4" style={{ color: "#3D2B1F" }}>VALORES TÍPICOS — MATERIALES DE CONSTRUCCIÓN</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mono" style={{ color: "#3D2B1F" }}>
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "#8B6F47" }}>
                  <th className="py-2 pr-4 font-normal" style={{ color: "#8B6F47" }}>Material</th>
                  <th className="py-2 pr-4 font-normal text-right" style={{ color: "#8B6F47" }}>λ (W/m·K)</th>
                  <th className="py-2 font-normal text-right" style={{ color: "#8B6F47" }}>μ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Adobe / tierra apisonada", "0.30 – 0.60", "5 – 10"],
                  ["Barro-paja (revoque, fibra vegetal)", "0.25 – 0.45", "5 – 8"],
                  ["Fardo de paja (compactado)", "0.045 – 0.06", "2 – 3"],
                  ["Revoque de cal aérea", "0.70 – 0.90", "5 – 15"],
                  ["Revoque de cal hidráulica", "0.80 – 1.00", "10 – 20"],
                  ["Revoque / mortero de cemento", "1.00 – 1.40", "70 – 150"],
                  ["Ladrillo cerámico macizo", "0.60 – 0.85", "8 – 16"],
                  ["Hormigón armado", "1.60 – 2.30", "80 – 130"],
                  ["Madera (pino, perpendicular a fibra)", "0.12 – 0.18", "20 – 50"],
                  ["Lana mineral / fibra de vidrio", "0.035 – 0.045", "1 – 2"],
                  ["Poliestireno expandido (EPS)", "0.030 – 0.040", "20 – 70"],
                  ["Membrana asfáltica", "0.17 – 0.23", "~50 000"],
                  ["Pintura al aceite / esmalte", "—", "300 – 1000"],
                  ["Pintura a la cal / silicato (transpirable)", "—", "10 – 30"],
                  ["Barrera de vapor (polietileno)", "—", "~100 000"],
                ].map(([name, lam, mu], i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "#E0D5BE" }}>
                    <td className="py-1.5 pr-4">{name}</td>
                    <td className="py-1.5 pr-4 text-right">{lam}</td>
                    <td className="py-1.5 text-right">{mu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs" style={{ color: "#8B6F47" }}>
            Valores de referencia (bibliografía general / normas EN ISO 10456 y EN 12524). Varían según densidad, humedad y fabricante — verificar con ensayo o ficha técnica cuando el caso lo amerite.
          </div>
        </div>

        {/* Boundary conditions */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="p-5 rounded-sm border" style={{ background: "#F3EDE0", borderColor: "#C9B896" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sun size={18} color="#B5651D" />
              <span className="sc text-sm" style={{ color: "#3D2B1F" }}>INTERIOR</span>
            </div>
            <label className="block text-xs mono mb-1" style={{ color: "#8B6F47" }}>Temperatura: {tInt}°C</label>
            <input type="range" min="15" max="26" step="0.5" value={tInt} onChange={(e) => setTInt(+e.target.value)} className="w-full mb-4" />
            <label className="block text-xs mono mb-1" style={{ color: "#8B6F47" }}>Humedad relativa: {hrInt}%</label>
            <input type="range" min="30" max="70" step="1" value={hrInt} onChange={(e) => setHrInt(+e.target.value)} className="w-full" />
          </div>

          <div className="p-5 rounded-sm border" style={{ background: "#F3EDE0", borderColor: "#C9B896" }}>
            <div className="flex items-center gap-2 mb-4">
              <Snowflake size={18} color="#5B7A8C" />
              <span className="sc text-sm" style={{ color: "#3D2B1F" }}>EXTERIOR</span>
            </div>
            <label className="block text-xs mono mb-1" style={{ color: "#8B6F47" }}>Temperatura: {tExt}°C</label>
            <input type="range" min="-8" max="10" step="0.5" value={tExt} onChange={(e) => setTExt(+e.target.value)} className="w-full mb-4" />
            <label className="block text-xs mono mb-1" style={{ color: "#8B6F47" }}>Humedad relativa: {hrExt}%</label>
            <input type="range" min="60" max="98" step="1" value={hrExt} onChange={(e) => setHrExt(+e.target.value)} className="w-full" />
          </div>
        </div>

        {/* Layers editor */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="sc text-sm" style={{ color: "#3D2B1F" }}>CAPAS DEL MURO — interior → exterior</span>
            <button onClick={addLayer} className="flex items-center gap-1 text-xs mono px-3 py-1.5 rounded-sm" style={{ background: "#7A4E2D", color: "#F3EDE0" }}>
              <Plus size={13} /> capa
            </button>
          </div>
          <div className="space-y-3">
            {layers.map((l, i) => (
              <div key={l.id} className="p-3 rounded-sm border" style={{ background: "#F3EDE0", borderColor: "#C9B896" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center rounded-full border mono shrink-0" style={{ width: 22, height: 22, borderColor: "#3D2B1F", fontSize: 11, background: "#F3EDE0", color: "#3D2B1F" }}>{i + 1}</span>
                  <input value={l.name} onChange={(e) => updateLayer(l.id, "name", e.target.value)} className="mono text-sm bg-transparent border-b outline-none flex-1" style={{ borderColor: "#C9B896", color: "#3D2B1F" }} />
                  <button onClick={() => removeLayer(l.id)} className="p-1.5 shrink-0"><Trash2 size={14} color="#A85C42" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 pl-9">
                  <div>
                    <label className="block text-[10px] mono" style={{ color: "#8B6F47" }}>e (m)</label>
                    <input type="number" step="0.001" value={l.e} onChange={(e) => updateLayer(l.id, "e", +e.target.value)} className="mono text-sm w-full bg-transparent border-b outline-none" style={{ borderColor: "#C9B896", color: "#3D2B1F" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] mono" style={{ color: "#8B6F47" }}>λ (W/m·K)</label>
                    <input type="number" step="0.01" value={l.lambda} onChange={(e) => updateLayer(l.id, "lambda", +e.target.value)} className="mono text-sm w-full bg-transparent border-b outline-none" style={{ borderColor: "#C9B896", color: "#3D2B1F" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] mono" style={{ color: "#8B6F47" }}>μ</label>
                    <input type="number" step="1" value={l.mu} onChange={(e) => updateLayer(l.id, "mu", +e.target.value)} className="mono text-sm w-full bg-transparent border-b outline-none" style={{ borderColor: "#C9B896", color: "#3D2B1F" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wall cross-section */}
        <div className="mb-2 sc text-sm" style={{ color: "#3D2B1F" }}>CORTE DEL MURO</div>
        <div className="relative mb-1 rounded-sm overflow-hidden border" style={{ borderColor: "#C9B896", background: "#DCD0B8" }}>
          <svg width="100%" viewBox="0 0 720 90" style={{ display: "block" }}>
            <text x="10" y="20" className="mono" fontSize="10" fill="#6B5744">INT</text>
            <text x="695" y="20" className="mono" fontSize="10" fill="#6B5744">EXT</text>
            {layerRects.map((l, i) => (
              <g key={l.id}>
                <rect x={l.x} y={30} width={l.w} height={45}
                  fill={i % 2 === 0 ? "#A67C52" : "#8B6F47"}
                  stroke="#3D2B1F" strokeWidth="0.5" />
                <circle cx={l.x + l.w / 2} cy={52.5} r="9" fill="#F3EDE0" stroke="#3D2B1F" strokeWidth="0.75" />
                <text x={l.x + l.w / 2} y={56} textAnchor="middle" className="mono" fontSize="11" fontWeight="600" fill="#3D2B1F">{i + 1}</text>
              </g>
            ))}
            {result.condenses && (
              <g transform={`translate(${pointXs[result.minMarginIdx]}, 30)`}>
                <circle cx="0" cy="-6" r="3.5" fill="#5B7A8C" className="drip" />
                <circle cx="0" cy="-14" r="2.5" fill="#5B7A8C" className="drip" style={{ animationDelay: "0.6s" }} />
              </g>
            )}
          </svg>
        </div>

        {/* dimension line with thicknesses */}
        <div className="relative mb-8" style={{ height: "34px" }}>
          <svg width="100%" viewBox="0 0 720 34" style={{ display: "block", overflow: "visible" }}>
            <line x1={wallStartX} y1="6" x2={wallStartX + wallW} y2="6" stroke="#8B6F47" strokeWidth="0.75" />
            {pointXs.map((x, i) => (
              <line key={i} x1={x} y1="2" x2={x} y2="10" stroke="#8B6F47" strokeWidth="0.75" />
            ))}
            {layerRects.map((l) => (
              <text key={l.id} x={l.x + l.w / 2} y="22" textAnchor="middle" className="mono" fontSize="10" fill="#6B5744">
                {l.e >= 0.001 ? `${(l.e * 100).toFixed(1)} cm` : `${(l.e * 1000).toFixed(2)} mm`}
              </text>
            ))}
          </svg>
        </div>

        {/* legend: number -> layer name */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-8">
          {layers.map((l, i) => (
            <div key={l.id} className="flex items-center gap-1.5 text-xs mono" style={{ color: "#6B5744" }}>
              <span className="flex items-center justify-center rounded-full border" style={{ width: 16, height: 16, borderColor: "#3D2B1F", fontSize: 9, background: "#F3EDE0" }}>{i + 1}</span>
              {l.name}
            </div>
          ))}
        </div>

        {/* Graph */}
        <div className="mb-2 sc text-sm" style={{ color: "#3D2B1F" }}>PRESIÓN DE VAPOR — saturación vs. real</div>
        <div className="p-4 rounded-sm border mb-8" style={{ borderColor: "#C9B896", background: "#F3EDE0" }}>
          <svg width="100%" viewBox={`0 0 720 ${graphH + graphTop + 30}`}>
            {/* gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <line key={f} x1={wallStartX} x2={wallStartX + wallW} y1={graphTop + graphH * f} y2={graphTop + graphH * f} stroke="#C9B896" strokeWidth="0.5" />
            ))}
            {/* saturation curve */}
            <path d={satPath} fill="none" stroke="#B5651D" strokeWidth="2.5" />
            {/* real vapor pressure */}
            <path d={vapPath} fill="none" stroke="#5B7A8C" strokeWidth="2.5" strokeDasharray="6,3" />
            {result.tempPoints.map((t, i) => (
              <circle key={i} cx={pointXs[i]} cy={yForP(result.satPoints[i])} r="3" fill="#B5651D" />
            ))}
            {result.tempPoints.map((t, i) => (
              <circle key={i} cx={pointXs[i]} cy={yForP(result.vaporPoints[i])} r="3" fill="#5B7A8C" />
            ))}
            {result.condenses && (
              <circle cx={pointXs[result.minMarginIdx]} cy={yForP(result.satPoints[result.minMarginIdx])} r="7" fill="none" stroke="#A85C42" strokeWidth="2" />
            )}
            {pointXs.map((x, i) => (
              <text key={i} x={x} y={graphTop + graphH + 20} textAnchor="middle" className="mono" fontSize="9" fill="#8B6F47">
                {i === 0 ? "int" : i === pointXs.length - 1 ? "ext" : i}
              </text>
            ))}
            {/* legend */}
            <g transform="translate(500, 20)">
              <line x1="0" y1="0" x2="20" y2="0" stroke="#B5651D" strokeWidth="2.5" />
              <text x="26" y="4" className="mono" fontSize="10" fill="#3D2B1F">P saturación</text>
              <line x1="0" y1="16" x2="20" y2="16" stroke="#5B7A8C" strokeWidth="2.5" strokeDasharray="6,3" />
              <text x="26" y="20" className="mono" fontSize="10" fill="#3D2B1F">P vapor real</text>
            </g>
          </svg>
        </div>

        {/* Result */}
        <div className="p-6 rounded-sm border-2" style={{
          borderColor: result.condenses ? "#A85C42" : "#5C7A5C",
          background: result.condenses ? "#F0DFD4" : "#DEE8DA"
        }}>
          <div className="flex items-start gap-3">
            {result.condenses ? <AlertTriangle size={24} color="#A85C42" /> : <CheckCircle2 size={24} color="#5C7A5C" />}
            <div className="flex-1">
              <div className="sc text-base mb-1" style={{ color: result.condenses ? "#7A3524" : "#33502F" }}>
                {result.condenses ? "CONDENSA — la presión real supera a la de saturación" : "NO condensa bajo estas condiciones"}
              </div>
              <div className="text-sm mono" style={{ color: "#5A4A3A" }}>
                Punto crítico: interfaz {result.minMarginIdx === 0 ? "superficie interior" : layers[result.minMarginIdx - 1]?.name || "superficie exterior"} ·
                margen = {result.minMargin.toFixed(1)} Pa · U = {result.u.toFixed(2)} W/m²K · flujo q = {result.q.toFixed(1)} W/m²
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs mono flex items-start gap-2" style={{ color: "#8B6F47" }}>
          <Droplets size={14} className="mt-0.5 shrink-0" />
          <span>Método simplificado en estado estacionario. No captura el buffering higroscópico del barro (sorción/desorción dinámica) — un margen pequeño no descarta riesgo real. Para verificación rigurosa en clima húmedo sostenido, complementar con simulación higrotérmica dinámica (WUFI / DELPHIN).</span>
        </div>
      </div>
    </div>
  );
}
