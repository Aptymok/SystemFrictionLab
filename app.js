const phases = [
  {
    id: 'fase-1-core',
    name: 'Fase 1 · Core Documental',
    description: 'Repositorio de patrones con validación de overlay, microfractura y trazabilidad.',
    tags: ['overlay', 'microfractura', 'PCCI'],
    nodes: [
      { name: 'Core', C: 0.82, E: 0.68, L: 0.55, K: 0.76, R: 0.49, D: [0.59, 0.47, 0.63, 0.44] },
      { name: 'Serie', C: 0.90, E: 0.45, L: 0.30, K: 0.61, R: 0.56, D: [0.66, 0.41, 0.58, 0.52] },
      { name: 'AGS', C: 0.78, E: 0.92, L: 0.42, K: 0.88, R: 0.70, D: [0.74, 0.68, 0.82, 0.69] }
    ],
    nti: { LDI_norm: 0.45, ICC_norm: 0.80, CSR_sys: 0.30, IRCI_norm: 0.90, IIM_sys: 0.60 }
  },
  {
    id: 'fase-2-dashboard',
    name: 'Fase 2 · Dashboard Principal',
    description: 'Tarjetas globales con señales de criticidad, tendencias y penalización por NTI.',
    tags: ['IHG_corr', 'ICE', 'CRM', 'NTI'],
    nodes: [
      { name: 'Core', C: 0.84, E: 0.65, L: 0.48, K: 0.81, R: 0.51, D: [0.54, 0.49, 0.60, 0.46] },
      { name: 'Serie', C: 0.88, E: 0.48, L: 0.28, K: 0.64, R: 0.58, D: [0.62, 0.43, 0.56, 0.50] },
      { name: 'AGS', C: 0.76, E: 0.91, L: 0.40, K: 0.90, R: 0.72, D: [0.71, 0.67, 0.79, 0.66] }
    ],
    nti: { LDI_norm: 0.43, ICC_norm: 0.82, CSR_sys: 0.36, IRCI_norm: 0.88, IIM_sys: 0.63 }
  },
  {
    id: 'fase-3-automatizacion',
    name: 'Fase 3 · IA + Automatización',
    description: 'Actualización y auditoría automatizadas con narrativa IA y bitácora operativa.',
    tags: ['UCAP', 'IIM', 'auto-audit', 'cron'],
    nodes: [
      { name: 'Core', C: 0.86, E: 0.62, L: 0.43, K: 0.83, R: 0.57, D: [0.50, 0.44, 0.57, 0.42] },
      { name: 'Serie', C: 0.89, E: 0.44, L: 0.25, K: 0.69, R: 0.61, D: [0.57, 0.38, 0.52, 0.45] },
      { name: 'AGS', C: 0.79, E: 0.90, L: 0.36, K: 0.89, R: 0.76, D: [0.69, 0.60, 0.75, 0.64] }
    ],
    nti: { LDI_norm: 0.39, ICC_norm: 0.85, CSR_sys: 0.42, IRCI_norm: 0.86, IIM_sys: 0.69 }
  }
];

let activePhase = phases[0];
let activeNode = activePhase.nodes[0].name;
let ihgHistory = [];
let autoTimer = null;

const phaseSelect = document.getElementById('phaseSelect');
const phaseDescription = document.getElementById('phaseDescription');
const phaseTags = document.getElementById('phaseTags');
const globalCards = document.getElementById('globalCards');
const equationOutput = document.getElementById('equationOutput');
const nodeTabs = document.getElementById('nodeTabs');
const nodeContent = document.getElementById('nodeContent');
const narrative = document.getElementById('narrative');
const automationLog = document.getElementById('automationLog');
const spark = document.getElementById('ihgSparkline');

function avg(values) { return values.reduce((a, b) => a + b, 0) / values.length; }

function calcIHG(nodes) {
  return avg(nodes.map((n) => (n.C - n.E) * (1 - n.L)));
}

function calcICE(nodes) {
  const totalK = nodes.reduce((sum, n) => sum + n.K, 0);
  return nodes.reduce((sum, n) => {
    const f = n.K / totalK;
    return sum + (f ** 2) * n.K;
  }, 0);
}

function calcCRM(nodes) {
  return avg(nodes.map((n) => n.R * n.K));
}

function calcPsi(node) {
  const e = 1e-3;
  return (node.E * node.L) / (node.C * node.R + e);
}

function calcNTI(nti) {
  return avg([
    1 - nti.LDI_norm,
    nti.ICC_norm,
    nti.CSR_sys,
    nti.IRCI_norm,
    nti.IIM_sys
  ]);
}

function statusClass(value, metric) {
  if (metric === 'IHG' || metric === 'IHG_corr') {
    if (value <= 0.2) return 'status-crit';
    if (value <= 0.5) return 'status-warn';
    return 'status-ok';
  }
  if (metric === 'NTI') return value < 0.5 ? 'status-crit' : 'status-ok';
  if (metric === 'Psi') return value > 1 ? 'status-crit' : value > 0.7 ? 'status-warn' : 'status-ok';
  return 'status-ok';
}

function renderPhaseOptions() {
  phases.forEach((phase) => {
    const option = document.createElement('option');
    option.value = phase.id;
    option.textContent = phase.name;
    phaseSelect.appendChild(option);
  });
}

function renderTags(tags) {
  phaseTags.innerHTML = '';
  tags.forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    phaseTags.appendChild(span);
  });
}

function appendHistory(ihgCorr) {
  ihgHistory.push(ihgCorr);
  if (ihgHistory.length > 20) ihgHistory.shift();
}

function drawSparkline() {
  const ctx = spark.getContext('2d');
  ctx.clearRect(0, 0, spark.width, spark.height);
  ctx.strokeStyle = '#243552';
  ctx.strokeRect(0, 0, spark.width, spark.height);
  if (ihgHistory.length < 2) return;

  const max = Math.max(...ihgHistory, 1);
  const min = Math.min(...ihgHistory, -1);
  const range = max - min || 1;

  ctx.beginPath();
  ctx.strokeStyle = '#61c0ff';
  ihgHistory.forEach((val, idx) => {
    const x = (idx / (ihgHistory.length - 1)) * (spark.width - 12) + 6;
    const y = ((max - val) / range) * (spark.height - 12) + 6;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderNodeTabs() {
  nodeTabs.innerHTML = '';
  activePhase.nodes.forEach((node) => {
    const btn = document.createElement('button');
    btn.className = `tab ${node.name === activeNode ? 'active' : ''}`;
    btn.textContent = node.name;
    btn.onclick = () => {
      activeNode = node.name;
      renderNodeTabs();
      renderNodeContent();
    };
    nodeTabs.appendChild(btn);
  });
}

function renderNodeContent() {
  const node = activePhase.nodes.find((n) => n.name === activeNode);
  const psi = calcPsi(node);
  const dAvg = avg(node.D);
  nodeContent.innerHTML = `
    <table>
      <tr><th>Variable</th><th>Valor</th></tr>
      <tr><td>C (Installed Capacity)</td><td>${node.C.toFixed(2)}</td></tr>
      <tr><td>E (Entropic Load)</td><td>${node.E.toFixed(2)}</td></tr>
      <tr><td>L (Node Latency)</td><td>${node.L.toFixed(2)}</td></tr>
      <tr><td>K (Connectivity)</td><td>${node.K.toFixed(2)}</td></tr>
      <tr><td>R (Redistribution)</td><td>${node.R.toFixed(2)}</td></tr>
      <tr><td>D1-D4 promedio</td><td>${dAvg.toFixed(2)}</td></tr>
      <tr><td>Ψ_i</td><td class="${statusClass(psi, 'Psi')}">${psi.toFixed(3)}</td></tr>
    </table>
  `;
}

function getMetrics() {
  const ihg = calcIHG(activePhase.nodes);
  const nti = calcNTI(activePhase.nti);
  const ihgCorr = ihg * nti;
  const ice = calcICE(activePhase.nodes);
  const crm = calcCRM(activePhase.nodes);
  const psiMedia = avg(activePhase.nodes.map(calcPsi));
  return { ihg, nti, ihgCorr, ice, crm, psiMedia };
}

function renderGlobal() {
  const m = getMetrics();
  appendHistory(m.ihgCorr);
  drawSparkline();

  globalCards.innerHTML = `
    <div class="card"><h3>IHG</h3><p class="${statusClass(m.ihg, 'IHG')}">${m.ihg.toFixed(3)}</p></div>
    <div class="card"><h3>NTI</h3><p class="${statusClass(m.nti, 'NTI')}">${m.nti.toFixed(3)}</p></div>
    <div class="card"><h3>IHG_corr</h3><p class="${statusClass(m.ihgCorr, 'IHG_corr')}">${m.ihgCorr.toFixed(3)}</p></div>
    <div class="card"><h3>ICE</h3><p>${m.ice.toFixed(3)}</p></div>
    <div class="card"><h3>CRM</h3><p>${m.crm.toFixed(3)}</p></div>
    <div class="card"><h3>Ψ media</h3><p>${m.psiMedia.toFixed(3)}</p></div>
  `;

  equationOutput.textContent = [
    `IHG = (1/N) Σ[(C_i - E_i) * (1 - L_i)] = ${m.ihg.toFixed(4)}`,
    `NTI = (1/5)[(1-LDI_norm)+ICC_norm+CSR_sys+IRCI_norm+IIM_sys] = ${m.nti.toFixed(4)}`,
    `IHG_corr = IHG * NTI = ${m.ihgCorr.toFixed(4)}`,
    `ICE = Σ(f_j² * d_j) = ${m.ice.toFixed(4)}`,
    `CRM = (Σ R_i * K_i)/N = ${m.crm.toFixed(4)}`
  ].join('\n');
}

function renderNarrative() {
  const m = getMetrics();
  const dominantNode = activePhase.nodes.slice().sort((a, b) => calcPsi(b) - calcPsi(a))[0];
  const risk = m.ihgCorr <= 0.2 ? 'crítico' : m.ihgCorr <= 0.5 ? 'en riesgo' : 'estable';

  narrative.textContent = `Fase activa: ${activePhase.name}. El sistema se encuentra ${risk} con IHG_corr=${m.ihgCorr.toFixed(3)} y NTI=${m.nti.toFixed(3)}. El nodo con mayor presión de criticidad es ${dominantNode.name} (Ψ_i=${calcPsi(dominantNode).toFixed(3)}), lo que sugiere priorizar reducción de latencia y carga entrópica antes de escalar conectividad. ICE=${m.ice.toFixed(3)} y CRM=${m.crm.toFixed(3)} indican ${m.ice > 0.7 ? 'fragilidad centralizada' : 'centralización contenida'} y ${m.crm > 0.6 ? 'redistribución funcional' : 'redistribución insuficiente'}.`;
}

function logAction(message) {
  const item = document.createElement('li');
  item.textContent = `[${new Date().toLocaleTimeString('es-MX')}] ${message}`;
  automationLog.prepend(item);
}

function mutateNode(node) {
  const drift = () => (Math.random() - 0.5) * 0.04;
  node.C = clamp(node.C + drift());
  node.E = clamp(node.E + drift());
  node.L = clamp(node.L + drift());
  node.K = clamp(node.K + drift());
  node.R = clamp(node.R + drift());
}

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

function runUpdate() {
  activePhase.nodes.forEach(mutateNode);
  renderGlobal();
  renderNodeContent();
  logAction('Actualización de datos completada (simulación de ingesta y recálculo).');
}

function runAudit() {
  renderNarrative();
  const m = getMetrics();
  if (m.ihgCorr <= 0.2 || m.nti < 0.5) {
    logAction('AUDITORÍA: UCAP sugerido por umbral crítico (IHG_corr<=0.2 o NTI<0.5).');
  } else {
    logAction('AUDITORÍA: sistema dentro de rango operativo monitoreado.');
  }
}

function toggleAuto() {
  const btn = document.getElementById('toggleAutoBtn');
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btn.textContent = 'Iniciar auto-proceso';
    logAction('Auto-proceso detenido.');
    return;
  }

  let tick = 0;
  autoTimer = setInterval(() => {
    tick += 1;
    runUpdate();
    if (tick % 2 === 0) runAudit();
  }, 15000);

  btn.textContent = 'Detener auto-proceso';
  logAction('Auto-proceso iniciado.');
}

function init() {
  renderPhaseOptions();
  phaseSelect.value = activePhase.id;

  phaseSelect.addEventListener('change', (event) => {
    activePhase = phases.find((phase) => phase.id === event.target.value);
    activeNode = activePhase.nodes[0].name;
    phaseDescription.textContent = activePhase.description;
    renderTags(activePhase.tags);
    renderNodeTabs();
    renderNodeContent();
    renderGlobal();
    renderNarrative();
    logAction(`Cambio de fase: ${activePhase.name}`);
  });

  document.getElementById('recomputeBtn').onclick = () => {
    renderGlobal();
    logAction('Recomputación manual completada.');
  };
  document.getElementById('generateNarrativeBtn').onclick = () => {
    renderNarrative();
    logAction('Narrativa IA regenerada.');
  };
  document.getElementById('runUpdateBtn').onclick = runUpdate;
  document.getElementById('runAuditBtn').onclick = runAudit;
  document.getElementById('toggleAutoBtn').onclick = toggleAuto;

  phaseDescription.textContent = activePhase.description;
  renderTags(activePhase.tags);
  renderNodeTabs();
  renderNodeContent();
  renderGlobal();
  renderNarrative();
  logAction('Sistema cargado: MIHM v2.0 operativo por fase.');
}

init();
