// sallen_key.js
const UI = {
    orderSwitch: document.getElementById('order_switch'),
    stage2Params: document.getElementById('stage2_params'),
    b1_1: document.getElementById('b1_1'), b0_1: document.getElementById('b0_1'),
    b1_2: document.getElementById('b1_2'), b0_2: document.getElementById('b0_2'),
    fixRadios: document.getElementsByName('fix_type'),
    fixLabel: document.getElementById('fix_label'),
    fixUnit: document.getElementById('fix_unit'),
    resultsSection: document.getElementById('results_section'),
    schemContainer: document.getElementById('schematics_container'),
    txtSummary: document.getElementById('txt_summary'),
    txtIdeal: document.getElementById('txt_ideal'),
    txtTl081: document.getElementById('txt_tl081'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane')
};

const UNITS_C = [['1e-6', 'µF'], ['1e-9', 'nF'], ['1e-12', 'pF']];
const UNITS_R = [['1', 'Ω'], ['1000', 'kΩ'], ['1000000', 'MΩ']];

// Event Listeners
UI.orderSwitch.addEventListener('change', (e) => {
    if(e.target.checked) UI.stage2Params.classList.remove('hidden');
    else UI.stage2Params.classList.add('hidden');
});

Array.from(UI.fixRadios).forEach(r => r.addEventListener('change', updateFixUnits));

UI.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        UI.tabBtns.forEach(b => b.classList.remove('active'));
        UI.tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

function updateFixUnits() {
    let type = document.querySelector('input[name="fix_type"]:checked').value;
    UI.fixUnit.innerHTML = '';
    let options = type === 'C' ? UNITS_C : UNITS_R;
    UI.fixLabel.innerText = type === 'C' ? 'Valor del Capacitor' : 'Valor de Resistencia';
    options.forEach(opt => {
        let el = document.createElement('option');
        el.value = opt[0]; el.innerText = opt[1];
        UI.fixUnit.appendChild(el);
    });
    if(type === 'C') UI.fixUnit.selectedIndex = 1;
}
updateFixUnits();

function loadTemplate(type) {
    const is4th = UI.orderSwitch.checked;
    if(!is4th) {
        if(type === 'butter') { UI.b1_1.value = "1.414214"; UI.b0_1.value = "1.000000"; }
        if(type === 'bessel') { UI.b1_1.value = "2.203203"; UI.b0_1.value = "1.618034"; }
        if(type === 'cheby')  { UI.b1_1.value = "1.097734"; UI.b0_1.value = "1.102510"; }
    } else {
        if(type === 'butter') {
            UI.b1_1.value = "0.765367"; UI.b0_1.value = "1.000000";
            UI.b1_2.value = "1.847759"; UI.b0_2.value = "1.000000";
        }
        if(type === 'bessel') {
            UI.b1_1.value = "1.990418"; UI.b0_1.value = "2.570755";
            UI.b1_2.value = "2.740136"; UI.b0_2.value = "2.045391";
        }
        if(type === 'cheby') {
            UI.b1_1.value = "0.279072"; UI.b0_1.value = "0.986505";
            UI.b1_2.value = "0.673739"; UI.b0_2.value = "0.279398";
        }
    }
}

function solveStage(b1, b0, fc, fix_type, fix_value, design) {
    const omega0 = Math.sqrt(b0);
    const Q = Math.sqrt(b0) / b1;
    let R1n, R2n, mu;
    
    if (design === 1) { 
        R1n = 1.0 / omega0; R2n = 1.0 / omega0;
        mu = 3.0 - 1.0 / Q;
        if(mu < 1.0 - 1e-12) throw "Diseño 1 no realizable: Q produce ganancia menor a 1.";
    } else {
        R1n = Q / omega0; R2n = 1.0 / (omega0 * Q);
        mu = 2.0;
    }
    
    let Req = R1n + R2n;
    let Ra_n = Infinity, Rb_n = 0.0;
    if (Math.abs(mu - 1.0) >= 1e-12) {
        Ra_n = Req * (mu / (mu - 1.0));
        Rb_n = Req * mu;
    }
    
    let Kf = 2.0 * Math.PI * fc / omega0;
    let Kz = fix_type === "C" ? (1.0 / (Kf * fix_value)) : (fix_value / R1n);
    
    return {
        R1: R1n * Kz, R2: R2n * Kz, C1: 1.0 / (Kf * Kz), C2: 1.0 / (Kf * Kz),
        Ra: Ra_n === Infinity ? Infinity : Ra_n * Kz,
        Rb: Rb_n * Kz,
        R1n, R2n, C1n: 1.0, C2n: 1.0, Ra_n, Rb_n,
        mu, fc, b1, b0, Kf, Kz, omega0, Q, design
    };
}

function fmtEng(val, unit) {
    if (val === Infinity || !isFinite(val)) return "Abierto";
    if (val === 0) return `0 ${unit}`;
    let abs_v = Math.abs(val);
    const table = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1.0, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
    for (let [scale, prefix] of table) {
        if (abs_v >= scale * 0.999) {
            let num = (val / scale).toFixed(3).replace(/\.?0+$/, '');
            return `${num} ${prefix}${unit}`;
        }
    }
    return `${val.toExponential(4)} ${unit}`;
}

function fmtSpice(val) {
    if (val === Infinity || !isFinite(val)) return "1G"; // Para netlist
    if (val === 0) return "1u";
    return val.toExponential(6);
}

function getSummary(stages, order) {
    let html = `<h2>Filtro de Orden ${order}</h2>`;
    stages.forEach((stg, idx) => {
        html += `<h3>Etapa ${idx+1}</h3>`;
        html += `<h4>Parámetros Teóricos</h4>`;
        html += `<ul>`;
        html += `<li>Polinomio: <span class="val">s² + ${stg.b1} s + ${stg.b0}</span></li>`;
        html += `<li>Diseño elegido: <span class="val">${stg.design} (${stg.design === 1 ? 'Componentes iguales' : 'Capacitores iguales, μ = 2'})</span></li>`;
        html += `<li>ω₀: <span class="val">${stg.omega0.toFixed(6)} rad/s</span></li>`;
        html += `<li>Factor Q: <span class="val">${stg.Q.toFixed(6)}</span></li>`;
        html += `<li>Ganancia μ: <span class="val">${stg.mu.toFixed(6)}</span></li>`;
        html += `<li>fc deseada: <span class="val">${stg.fc} Hz</span></li>`;
        html += `<li>Kf (freq): <span class="val">${stg.Kf.toExponential(4)}</span> | Kz (imp): <span class="val">${stg.Kz.toExponential(4)}</span></li>`;
        html += `</ul>`;
        
        html += `<h4>Componentes Normalizados (ω = 1 rad/s)</h4>`;
        html += `<ul>`;
        html += `<li>R1: <span class="val">${stg.R1n.toFixed(6)} Ω</span> | R2: <span class="val">${stg.R2n.toFixed(6)} Ω</span></li>`;
        html += `<li>C1: <span class="val">${stg.C1n.toFixed(6)} F</span> | C2: <span class="val">${stg.C2n.toFixed(6)} F</span></li>`;
        if (stg.Ra_n !== Infinity) {
            html += `<li>Ra: <span class="val">${stg.Ra_n.toFixed(6)} Ω</span> | Rb: <span class="val">${stg.Rb_n.toFixed(6)} Ω</span></li>`;
        } else {
            html += `<li>Ra: <span class="val">Abierto (Seguidor Unitario)</span> | Rb: <span class="val">0 Ω (Corto)</span></li>`;
        }
        html += `</ul>`;
        
        html += `<h4>Componentes Comerciales Escalados (fc = ${stg.fc} Hz)</h4>`;
        html += `<ul>`;
        html += `<li>R1: <span class="val">${fmtEng(stg.R1, 'Ω')}</span> | R2: <span class="val">${fmtEng(stg.R2, 'Ω')}</span></li>`;
        html += `<li>C1: <span class="val">${fmtEng(stg.C1, 'F')}</span> | C2: <span class="val">${fmtEng(stg.C2, 'F')}</span></li>`;
        if (stg.Ra !== Infinity) {
            html += `<li>Ra: <span class="val">${fmtEng(stg.Ra, 'Ω')}</span> | Rb: <span class="val">${fmtEng(stg.Rb, 'Ω')}</span></li>`;
        } else {
            html += `<li>Ra: <span class="val">Abierto</span> | Rb: <span class="val">Corto</span></li>`;
        }
        html += `</ul>`;
    });
    return html;
}

function getNetlistIdeal(stages) {
    let str = `* =====================================================\n`;
    str += `* Sallen-Key LPF NORMALIZADO - ${stages.length * 2}do Orden\n`;
    str += `* OpAmp ideal modelado como VCVS de muy alta ganancia\n`;
    str += `* =====================================================\n\n`;
    
    str += `Vin    Vin   0     AC 1\n\n`;
    
    let last_out = "Vin";
    stages.forEach((stg, idx) => {
        let i = idx + 1;
        let unity = stg.Ra_n === Infinity;
        let v_in = last_out;
        let v_out = `Vout${i}`;
        last_out = v_out;
        
        str += `*** ETAPA ${i} (mu = ${stg.mu.toFixed(6)}, Q = ${stg.Q.toFixed(6)}) ***\n`;
        str += `R1_${i}    ${v_in}   N1_${i}    ${fmtSpice(stg.R1n)}\n`;
        str += `R2_${i}    N1_${i}   N2_${i}    ${fmtSpice(stg.R2n)}\n`;
        str += `C1_${i}    N1_${i}   ${v_out}  ${fmtSpice(stg.C1n)}\n`;
        str += `C2_${i}    N2_${i}   0     ${fmtSpice(stg.C2n)}\n`;
        
        if (!unity) {
            str += `Ra_${i}    N3_${i}   0     ${fmtSpice(stg.Ra_n)}\n`;
            str += `Rb_${i}    ${v_out}  N3_${i}    ${fmtSpice(stg.Rb_n)}\n`;
            str += `E1_${i}    ${v_out}  0     N2_${i}    N3_${i}    1Meg\n`;
        } else {
            str += `E1_${i}    ${v_out}  0     N2_${i}    ${v_out}  1Meg\n`;
        }
        str += "\n";
    });
    
    str += `* --- Analisis AC: 4 decadas en torno a 1 rad/s (~0.16 Hz) ---\n`;
    str += `.AC DEC 200 0.001 100\n`;
    let out_node = `Vout${stages.length}`;
    str += `.PRINT AC VDB(${out_node}) VP(${out_node})\n`;
    str += `.PROBE V(${out_node})\n`;
    str += `.END\n`;
    
    return str;
}

function getNetlistTl081(stages) {
    let fc = stages[0].fc;
    let str = `* =====================================================\n`;
    str += `* Sallen-Key LPF - fc = ${fc} Hz - ${stages.length * 2}do Orden\n`;
    str += `* Implementacion con TL081 (alimentacion dual +/- 15V)\n`;
    str += `* =====================================================\n\n`;
    
    str += `* --- Modelo del OpAmp TL081 ---\n`;
    str += `.INCLUDE TL081.lib\n\n`;
    
    str += `* --- Alimentacion dual ---\n`;
    str += `VCC    VCC   0     DC 15\n`;
    str += `VEE    VEE   0     DC -15\n\n`;
    
    str += `* --- Estimulo ---\n`;
    str += `Vin    Vin   0     AC 1\n\n`;
    
    let last_out = "Vin";
    stages.forEach((stg, idx) => {
        let i = idx + 1;
        let unity = stg.Ra === Infinity;
        let v_in = last_out;
        let v_out = `Vout${i}`;
        last_out = v_out;
        
        str += `*** ETAPA ${i} ***\n`;
        str += `R1_${i}    ${v_in}   N1_${i}    ${fmtSpice(stg.R1)}\n`;
        str += `R2_${i}    N1_${i}   N2_${i}    ${fmtSpice(stg.R2)}\n`;
        str += `C1_${i}    N1_${i}   ${v_out}  ${fmtSpice(stg.C1)}\n`;
        str += `C2_${i}    N2_${i}   0     ${fmtSpice(stg.C2)}\n`;
        
        if (!unity) {
            str += `Ra_${i}    N3_${i}   0     ${fmtSpice(stg.Ra)}\n`;
            str += `Rb_${i}    ${v_out}  N3_${i}    ${fmtSpice(stg.Rb)}\n`;
            str += `X_OP_${i}  N2_${i}   N3_${i}   VCC VEE ${v_out} TL081\n`;
        } else {
            str += `X_OP_${i}  N2_${i}   ${v_out} VCC VEE ${v_out} TL081\n`;
        }
        str += "\n";
    });
    
    let f_start = Math.max(0.01 * fc, 0.001);
    let f_stop = 100.0 * fc;
    str += `* --- Analisis AC ---\n`;
    str += `.AC DEC 200 ${f_start.toExponential(3)} ${f_stop.toExponential(3)}\n`;
    let out_node = `Vout${stages.length}`;
    str += `.PRINT AC VDB(${out_node}) VP(${out_node})\n`;
    str += `.PROBE V(${out_node})\n`;
    str += `.END\n`;
    
    return str;
}

function drawSVG(stageData, index) {
    let rA = stageData.Ra === Infinity ? "Abierto" : fmtEng(stageData.Ra, 'Ω');
    let rB = stageData.Rb === 0 ? "Corto" : fmtEng(stageData.Rb, 'Ω');
    return `
    <div class="stage-schem">
        <h3>Etapa ${index}</h3>
        <svg viewBox="0 0 400 320" width="100%" height="auto" style="max-height: 400px;" xmlns="http://www.w3.org/2000/svg">
            <style>
                .line { stroke: #fff; stroke-width: 2; fill: none; }
                .txt { fill: #fff; font-family: Inter, sans-serif; font-size: 11px; }
                .lbl { fill: #60a5fa; font-weight: bold; font-family: Inter, sans-serif; font-size: 13px; }
                .cmp { stroke: #fff; stroke-width: 2; fill: #1c1c1c; }
                .dot { fill: #fff; }
            </style>
            
            <!-- Vin -->
            <line x1="10" y1="120" x2="40" y2="120" class="line"/>
            <text x="10" y="110" class="txt">Vin</text>

            <!-- R1 -->
            <rect x="40" y="110" width="40" height="20" class="cmp"/>
            <text x="60" y="100" class="lbl" text-anchor="middle">R1</text>
            <text x="60" y="145" class="txt" text-anchor="middle">${fmtEng(stageData.R1, 'Ω')}</text>

            <!-- Line R1 to R2 -->
            <line x1="80" y1="120" x2="120" y2="120" class="line"/>
            <circle cx="100" cy="120" r="3" class="dot"/> <!-- Node N1 -->

            <!-- R2 -->
            <rect x="120" y="110" width="40" height="20" class="cmp"/>
            <text x="140" y="100" class="lbl" text-anchor="middle">R2</text>
            <text x="140" y="145" class="txt" text-anchor="middle">${fmtEng(stageData.R2, 'Ω')}</text>

            <!-- Line R2 to OpAmp -->
            <line x1="160" y1="120" x2="240" y2="120" class="line"/>
            <circle cx="190" cy="120" r="3" class="dot"/> <!-- Node N2 -->

            <!-- C2 (GND) -->
            <line x1="190" y1="120" x2="190" y2="160" class="line"/>
            <line x1="180" y1="160" x2="200" y2="160" class="line"/>
            <line x1="180" y1="170" x2="200" y2="170" class="line"/>
            <text x="175" y="170" class="lbl" text-anchor="end">C2</text>
            <text x="205" y="170" class="txt" text-anchor="start">${fmtEng(stageData.C2, 'F')}</text>
            <line x1="190" y1="170" x2="190" y2="200" class="line"/>
            <!-- GND symbol C2 -->
            <line x1="180" y1="200" x2="200" y2="200" class="line"/>
            <line x1="185" y1="205" x2="195" y2="205" class="line"/>
            <line x1="188" y1="210" x2="192" y2="210" class="line"/>

            <!-- OpAmp -->
            <polygon points="240,90 240,190 320,140" class="cmp"/>
            <text x="250" y="125" class="txt" style="font-size: 14px;">+</text>
            <text x="250" y="165" class="txt" style="font-size: 14px;">-</text>

            <!-- Vout -->
            <line x1="320" y1="140" x2="380" y2="140" class="line"/>
            <text x="385" y="145" class="txt">Vout</text>
            <circle cx="340" cy="140" r="3" class="dot"/> <!-- Output node tap -->

            <!-- C1 Feedback (Top) -->
            <line x1="100" y1="120" x2="100" y2="40" class="line"/>
            <line x1="100" y1="40" x2="210" y2="40" class="line"/>
            
            <line x1="210" y1="30" x2="210" y2="50" class="line"/>
            <line x1="220" y1="30" x2="220" y2="50" class="line"/>
            <text x="215" y="20" class="lbl" text-anchor="middle">C1</text>
            <text x="215" y="65" class="txt" text-anchor="middle">${fmtEng(stageData.C1, 'F')}</text>
            
            <line x1="220" y1="40" x2="340" y2="40" class="line"/>
            <line x1="340" y1="40" x2="340" y2="140" class="line"/>

            <!-- Feedback Ra/Rb -->
            <line x1="240" y1="160" x2="220" y2="160" class="line"/>
            <line x1="220" y1="160" x2="220" y2="220" class="line"/>
            <circle cx="220" cy="220" r="3" class="dot"/> <!-- Node N3 -->

            <!-- Ra -->
            <line x1="220" y1="220" x2="220" y2="230" class="line"/>
            <rect x="210" y="230" width="20" height="40" class="cmp"/>
            <text x="200" y="255" class="lbl" text-anchor="end">Ra</text>
            <text x="240" y="255" class="txt" text-anchor="start">${rA}</text>
            <line x1="220" y1="270" x2="220" y2="290" class="line"/>
            <!-- GND symbol Ra -->
            <line x1="210" y1="290" x2="230" y2="290" class="line"/>
            <line x1="215" y1="295" x2="225" y2="295" class="line"/>
            <line x1="218" y1="300" x2="222" y2="300" class="line"/>

            <!-- Rb -->
            <line x1="220" y1="220" x2="260" y2="220" class="line"/>
            <rect x="260" y="210" width="40" height="20" class="cmp"/>
            <text x="280" y="200" class="lbl" text-anchor="middle">Rb</text>
            <text x="280" y="245" class="txt" text-anchor="middle">${rB}</text>
            <line x1="300" y1="220" x2="340" y2="220" class="line"/>
            <line x1="340" y1="220" x2="340" y2="140" class="line"/>

        </svg>
    </div>`;
}

let bodeChart = null;

function plotBode(stages, fc) {
    let fStart = Math.max(fc * 0.001, 0.001);
    let fStop = fc * 100.0;
    let dataPointsMag = [];
    let dataPointsPha = [];
    
    let logStart = Math.log10(fStart);
    let logStop = Math.log10(fStop);
    
    // Para desenrollar fase
    let prevPhase = null;
    let phaseOffset = 0;
    
    for (let i = 0; i <= 300; i++) {
        let f = Math.pow(10, logStart + (logStop - logStart) * (i / 300));
        let w = 2 * Math.PI * f;
        
        let H_real = 1.0, H_imag = 0.0;
        
        for (let stg of stages) {
            let num = stg.mu * stg.b0 * stg.Kf * stg.Kf;
            let den_real = stg.b0 * stg.Kf * stg.Kf - w * w;
            let den_imag = stg.b1 * stg.Kf * w;
            
            let den_mag2 = den_real*den_real + den_imag*den_imag;
            let stage_real = (num * den_real) / den_mag2;
            let stage_imag = (-num * den_imag) / den_mag2;
            
            let nr = H_real * stage_real - H_imag * stage_imag;
            let ni = H_real * stage_imag + H_imag * stage_real;
            H_real = nr; H_imag = ni;
        }
        
        let mag = Math.sqrt(H_real*H_real + H_imag*H_imag);
        let db = 10 * Math.log10(mag*mag + 1e-12);
        
        let pha = Math.atan2(H_imag, H_real) * (180 / Math.PI);
        if (prevPhase !== null) {
            let dPha = pha - prevPhase;
            if (dPha > 180) phaseOffset -= 360;
            else if (dPha < -180) phaseOffset += 360;
        }
        prevPhase = pha;
        let finalPha = pha + phaseOffset;
        
        dataPointsMag.push({x: f, y: Math.max(db, -80)});
        dataPointsPha.push({x: f, y: finalPha});
    }

    if(bodeChart) bodeChart.destroy();
    const ctx = document.getElementById('bodeChart').getContext('2d');
    
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    bodeChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Magnitud (dB)',
                    data: dataPointsMag,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Fase (°)',
                    data: dataPointsPha,
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: { 
                    type: 'logarithmic', 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'Frecuencia (Hz)' },
                    ticks: {
                        maxRotation: 0,
                        callback: function(value) {
                            let log10 = Math.log10(value);
                            if (Number.isInteger(log10)) {
                                if (value >= 1000000) return (value / 1000000) + 'M';
                                if (value >= 1000) return (value / 1000) + 'k';
                                return value;
                            }
                            return null;
                        }
                    }
                },
                y: { 
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: -80, max: 20, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'Magnitud (dB)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Fase (°)' }
                }
            },
            plugins: { 
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            let val = context[0].parsed.x;
                            return (val >= 1000 ? (val/1000).toFixed(2) + ' kHz' : val.toFixed(1) + ' Hz');
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                                if(label.includes('Fase')) label += ' °';
                                else label += ' dB';
                            }
                            return label;
                        }
                    }
                },
                zoom: {
                    pan: { enabled: true, mode: 'xy' },
                    zoom: {
                        wheel: { enabled: false }, // Desactivado para evitar zoom incontrolable
                        pinch: { enabled: true },
                        mode: 'xy'
                    }
                }
            }
        }
    });
}

function calcular() {
    try {
        let fc = parseFloat(document.getElementById('fc_val').value) * parseFloat(document.getElementById('fc_unit').value);
        let fix_type = document.querySelector('input[name="fix_type"]:checked').value;
        let fix_val = parseFloat(document.getElementById('fix_val').value) * parseFloat(document.getElementById('fix_unit').value);
        let design = parseInt(document.getElementById('design_rule').value);
        
        let is4th = UI.orderSwitch.checked;
        let order = is4th ? 4 : 2;
        let stages = [];
        
        let b1_1 = parseFloat(UI.b1_1.value);
        let b0_1 = parseFloat(UI.b0_1.value);
        stages.push(solveStage(b1_1, b0_1, fc, fix_type, fix_val, design));
        
        if(is4th) {
            let b1_2 = parseFloat(UI.b1_2.value);
            let b0_2 = parseFloat(UI.b0_2.value);
            stages.push(solveStage(b1_2, b0_2, fc, fix_type, fix_val, design));
        }

        // Render SVGs
        UI.schemContainer.innerHTML = '';
        stages.forEach((stg, i) => {
            UI.schemContainer.innerHTML += drawSVG(stg, i+1);
        });

        // Bode Plot
        plotBode(stages, fc);

        // Texts
        UI.txtSummary.innerHTML = getSummary(stages, order);
        UI.txtIdeal.value = getNetlistIdeal(stages);
        UI.txtTl081.value = getNetlistTl081(stages);

        UI.resultsSection.classList.remove('hidden');
        UI.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (e) {
        alert("Error en el cálculo: " + e);
    }
}
