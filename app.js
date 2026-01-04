/* ===============================
   ARSLAN PRO SUITE — Shell
   - Un solo PIN
   - Navegación por rutas
   - Backup/Import JSON
=============================== */

const $ = (s)=>document.querySelector(s);

const lock = $("#lock");
const app = $("#app");
const pinInput = $("#pinInput");
const pinBtn = $("#pinBtn");
const pinMsg = $("#pinMsg");

const view = $("#view");
const pageTitle = $("#pageTitle");
const navBtns = Array.from(document.querySelectorAll(".nav-btn[data-route]"));

const burger = $("#burger");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = $("#logoutBtn");

const backupBtn = $("#backupBtn");
const importFile = $("#importFile");

const cloudPill = $("#cloudPill");

/* ====== PIN (sin mostrarlo) ====== */
const PIN_HASH_KEY = "ARSLAN_SUITE_PINHASH";
const SESSION_KEY = "ARSLAN_SUITE_SESSION";

/* Hash simple (mejorable). Para máxima seguridad: WebCrypto + salt. */
function simpleHash(str){
  let h = 2166136261;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ("00000000"+(h>>>0).toString(16)).slice(-8);
}

function ensurePin(){
  if(!localStorage.getItem(PIN_HASH_KEY)){
    // PIN inicial: lo configuras tú una vez y queda guardado hasheado
    // Cambia este valor en tu copia local, NO lo publiques.
    const initialPin = "8410";
    localStorage.setItem(PIN_HASH_KEY, simpleHash(initialPin));
  }
}
ensurePin();

function setSession(on){
  localStorage.setItem(SESSION_KEY, on ? "1" : "0");
}
function isSessionOn(){
  return localStorage.getItem(SESSION_KEY) === "1";
}

function unlock(){
  lock.classList.add("hidden");
  app.classList.remove("hidden");
  routeTo("home");
}
function lockApp(){
  setSession(false);
  app.classList.add("hidden");
  lock.classList.remove("hidden");
  pinInput.value="";
  pinMsg.textContent="";
}

function tryPin(){
  const pin = (pinInput.value||"").trim();
  const ok = simpleHash(pin) === localStorage.getItem(PIN_HASH_KEY);
  if(!ok){
    pinMsg.textContent = "PIN incorrecto.";
    return;
  }
  pinMsg.textContent = "";
  setSession(true);
  unlock();
}

pinBtn.addEventListener("click", tryPin);
pinInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") tryPin(); });

if(isSessionOn()) unlock();

/* ====== Navegación ====== */
function setActive(route){
  navBtns.forEach(b=>{
    b.classList.toggle("active", b.dataset.route===route);
  });
}

burger?.addEventListener("click", ()=>{
  sidebar.classList.toggle("open");
});

navBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    routeTo(btn.dataset.route);
    sidebar.classList.remove("open");
  });
});

logoutBtn.addEventListener("click", lockApp);

function routeTo(route){
  setActive(route);
  const titleMap = {
    home:"Inicio",
    facturacion:"Facturación",
    listas:"Listas / Pedidos",
    gestion:"Gestión",
    reportes:"Reportes",
    nube:"Nube"
  };
  pageTitle.textContent = titleMap[route] || "ARSLAN PRO";
  renderRoute(route);
}

/* ====== Data Store Unificado ======
   Aquí unificamos todo: clientes, productos, facturas, listas, etc.
*/
const STORE_KEY = "ARSLAN_SUITE_STORE_V1";

function getStore(){
  try{
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {
      meta:{ createdAt: Date.now(), version:"v1" },
      clients: [],
      products: [],
      invoices: [],
      lists: [],
      settings: { shops:["San Pablo","San Lesmes","Santiago"] }
    };
  }catch{
    return {
      meta:{ createdAt: Date.now(), version:"v1" },
      clients: [],
      products: [],
      invoices: [],
      lists: [],
      settings: { shops:["San Pablo","San Lesmes","Santiago"] }
    };
  }
}
function saveStore(store){
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

/* ====== Backup / Import ====== */
backupBtn.addEventListener("click", ()=>{
  const data = getStore();
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `arslan-suite-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

importFile.addEventListener("change", async ()=>{
  const file = importFile.files?.[0];
  if(!file) return;
  const txt = await file.text();
  try{
    const parsed = JSON.parse(txt);
    // mínima validación
    if(!parsed || typeof parsed !== "object") throw new Error("invalid");
    localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    renderRoute(getActiveRoute() || "home");
    alert("Importación OK ✅");
  }catch(e){
    alert("JSON inválido ❌");
  }finally{
    importFile.value="";
  }
});

function getActiveRoute(){
  const a = navBtns.find(b=>b.classList.contains("active"));
  return a?.dataset.route || null;
}

/* ===============================
   RENDER ROUTES (MÓDULOS)
   Aquí pegas tus sistemas existentes:
   - Facturación diaria (tu app)
   - Listas (tu app)
   - Gestión (tu app)
=============================== */

function renderRoute(route){
  if(route==="home") return renderHome();
  if(route==="facturacion") return renderFacturacion();
  if(route==="listas") return renderListas();
  if(route==="gestion") return renderGestion();
  if(route==="reportes") return renderReportes();
  if(route==="nube") return renderNube();
  view.innerHTML = `<div class="card">Ruta no encontrada</div>`;
}

/* ===== HOME ===== */
function renderHome(){
  view.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px">Panel principal</h2>
      <div style="color:var(--muted);font-weight:700;margin-bottom:12px">
        Todo en una sola web: Listas + Gestión + Facturación + Reportes.
      </div>

      <div style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
        ${homeTile("🧾 Facturación", "Ventas diarias por tienda, tickets, diferencias, facturas.", "facturacion")}
        ${homeTile("📝 Listas / Pedidos", "Generar pedidos por proveedor, cantidades, totales.", "listas")}
        ${homeTile("🗂️ Gestión", "Clientes, productos, proveedores, historial, ajustes.", "gestion")}
        ${homeTile("📊 Reportes", "Diario/semanal/mensual + gráficos por tienda y global.", "reportes")}
        ${homeTile("☁️ Nube", "Sincronización Firebase/Supabase + export/import.", "nube")}
      </div>
    </div>
  `;
}

function homeTile(title, desc, route){
  return `
    <button class="card" style="text-align:left;cursor:pointer" onclick="window.__routeTo('${route}')">
      <div style="font-size:16px;font-weight:900">${title}</div>
      <div style="margin-top:6px;color:var(--muted);font-weight:700">${desc}</div>
    </button>
  `;
}
window.__routeTo = routeTo;

/* ===== FACTURACIÓN (placeholder para pegar tu sistema) ===== */
function renderFacturacion(){
  view.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px">Facturación</h2>
      <div style="color:var(--muted);font-weight:700">
        Aquí va tu módulo de facturación diaria (San Pablo / San Lesmes / Santiago) + ticket + diferencia.
      </div>
      <hr style="border:0;border-top:1px solid var(--line);margin:12px 0">
      <div style="color:var(--muted)">
        ✅ Siguiente paso: pegamos tu código actual y lo adaptamos para usar <b>getStore()/saveStore()</b>.
      </div>
    </div>
  `;
}

/* ===== LISTAS (placeholder para pegar tu sistema) ===== */
function renderListas(){
  view.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px">Listas / Pedidos</h2>
      <div style="color:var(--muted);font-weight:700">
        Aquí va tu módulo de listas: proveedores, cantidades, normalización de nombres, export TXT.
      </div>
    </div>
  `;
}

/* ===== GESTIÓN (placeholder para pegar tu sistema) ===== */
function renderGestion(){
  const store = getStore();
  view.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px">Gestión</h2>
      <div style="color:var(--muted);font-weight:700;margin-bottom:12px">
        Clientes, productos, proveedores, y configuración global.
      </div>

      <div style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">
        <div class="card">
          <div style="font-weight:900">Clientes</div>
          <div style="color:var(--muted);font-weight:700;margin-top:6px">${store.clients.length} registrados</div>
          <button class="btn" style="margin-top:10px" onclick="alert('Pegamos aquí tu gestor de clientes')">Abrir</button>
        </div>
        <div class="card">
          <div style="font-weight:900">Productos</div>
          <div style="color:var(--muted);font-weight:700;margin-top:6px">${store.products.length} registrados</div>
          <button class="btn" style="margin-top:10px" onclick="alert('Pegamos aquí tu gestor de productos')">Abrir</button>
        </div>
        <div class="card">
          <div style="font-weight:900">Facturas/Ventas</div>
          <div style="color:var(--muted);font-weight:700;margin-top:6px">${store.invoices.length} registros</div>
          <button class="btn" style="margin-top:10px" onclick="routeTo('reportes')">Ver reportes</button>
        </div>
      </div>
    </div>
  `;
}

/* ===== REPORTES (placeholder) ===== */
function renderReportes(){
  view.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px">Reportes</h2>
      <div style="color:var(--muted);font-weight:700">
        Aquí conectamos tus gráficos por día/semana/mes, por tienda y global.
      </div>
      <div style="margin-top:10px;color:var(--muted)">
        ✅ Siguiente paso: definimos estructura única de “venta diaria” y tu cálculo de KPIs.
      </div>
    </div>
  `;
}

/* ===== NUBE (placeholder) ===== */
function renderNube(){
  view.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px">Nube</h2>
      <div style="color:var(--muted);font-weight:700">
        Aquí se integra Firebase/Supabase para sincronizar STORE_KEY en la nube.
      </div>
      <div style="margin-top:10px">
        <button class="btn" onclick="setCloud('warn','☁️ Nube: pendiente')">Simular</button>
      </div>
    </div>
  `;
}

function setCloud(type,text){
  cloudPill.className = "pill " + type;
  cloudPill.textContent = text;
}
