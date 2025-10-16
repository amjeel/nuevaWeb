// js/Controller/ControllerCheckInOut.js
import {
  getCheckIn,
  createCheckIn,
  updateCheckIn,
  deleteCheckIn
} from "../Services/ServicesCheckIn.js";

import {
  getCheckOut,
  createCheckOut,
  updateCheckOut,
  deleteCheckOut
} from "../Services/ServiceCheckOut.js";

/* ------------------------ Utils & SweetAlert ------------------------ */
function injectSwalStyles(){
  if (document.getElementById("swal-modern-check")) return;
  const st = document.createElement("style");
  st.id = "swal-modern-check";
  st.textContent = `
    .swal2-modern{border-radius:16px;padding:22px}
    .swal2-modern .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:left}
    .swal2-modern label{font-size:13px;font-weight:600;color:#333;margin:0 0 6px}
    .swal2-modern .input,.swal2-modern .select,.swal2-modern .textarea{
      width:100%;border:1px solid #d9dce3;border-radius:10px;padding:8px 12px;font-size:14px;background:#fff
    }
    .swal2-styled.swal2-confirm{background:#16a34a !important;border-radius:10px !important}
    .swal2-styled.swal2-cancel{background:#e5e7eb !important;color:#111827 !important;border-radius:10px !important}
    .swal2-container{z-index:10000 !important}
  `;
  document.head.appendChild(st);
}

const norm = (s) => (s ?? "").toString().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const toast = (icon="success", title="") =>
  Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1600, showConfirmButton:false, timerProgressBar:true });

const normalizeList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw?.content) return raw.content;
  if (raw?.data)    return raw.data;
  if (raw?.items)   return raw.items;
  if (raw?.results) return raw.results;
  return [];
};

/* ------------------ Funciones para cargar combos ------------------ */
const API_URL = "http://localhost:8080/api";
const ENDPOINT_EMPLEADOS = `${API_URL}/consultarEmpleados`;
const ENDPOINT_DETALLES  = `${API_URL}/consultarDetallesReserva`;

async function fetchEmpleados(){
  try{
    const r = await fetch(ENDPOINT_EMPLEADOS);
    const data = await r.json();
    return Array.isArray(data) ? data : (data.content || []);
  }catch{ return []; }
}

async function fetchDetalles(){
  try{
    const r = await fetch(ENDPOINT_DETALLES);
    const data = await r.json();
    return Array.isArray(data) ? data : (data.content || []);
  }catch{ return []; }
}

/* ------------------ Modal único Check-in / Check-out ------------------ */
async function openCheckDialog(initialTipo="checkin", preset={}){
  let tipo = initialTipo;
  let vals = { ...preset };

  const empleados = await fetchEmpleados();
  const detalles  = await fetchDetalles();

  const comboEmpleados = (sel) =>
    empleados.map(e => `<option value="${e.nombreEmpleado}" ${e.nombreEmpleado===sel?"selected":""}>${e.nombreEmpleado}</option>`).join("");

  const comboDetalles = (sel) =>
    detalles.map(d => `<option value="${d.idDetalle}" ${d.idDetalle===sel?"selected":""}>${d.idDetalle} - Habitación ${d.numeroHabitacion ?? ""}</option>`).join("");

  const tpl = (v={}) => `
    <div class="form-grid">
      <div>
        <label>Tipo</label>
        <select id="op-tipo" class="select">
          <option value="checkin" ${tipo==="checkin"?"selected":""}>Check-in</option>
          <option value="checkout" ${tipo==="checkout"?"selected":""}>Check-out</option>
        </select>
      </div>
      <div>
        <label>Detalle de Reserva</label>
        <select id="op-detalle" class="select">
          <option value="">Seleccione...</option>
          ${comboDetalles(v.idDetalle)}
        </select>
      </div>
      <div>
        <label>Empleado</label>
        <select id="op-empleado" class="select">
          <option value="">Seleccione...</option>
          ${comboEmpleados(v.nombreEmpleado)}
        </select>
      </div>
      <div>
        <label>${tipo==="checkin" ? "Fecha y hora Check-in" : "Fecha y hora Check-out"}</label>
        <input id="op-fecha" class="input" type="datetime-local" value="${v.fecha ?? ""}">
      </div>
      <div style="grid-column:1/-1">
        <label>Observación</label>
        <textarea id="op-obs" class="textarea" rows="3" placeholder="Observaciones...">${v.observacion ?? ""}</textarea>
      </div>
    </div>`;

  const keep = () => ({
    idDetalle:  document.getElementById("op-detalle")?.value ?? "",
    nombreEmpleado: document.getElementById("op-empleado")?.value ?? "",
    fecha:      document.getElementById("op-fecha")?.value ?? "",
    observacion:document.getElementById("op-obs")?.value ?? ""
  });

  const read = (t) => {
    const idDetalle  = document.getElementById("op-detalle")?.value;
    const nombreEmpleado = document.getElementById("op-empleado")?.value;
    const fecha      = document.getElementById("op-fecha")?.value;
    const obs        = document.getElementById("op-obs")?.value;

    if (!idDetalle || !nombreEmpleado || !fecha) {
      Swal.showValidationMessage("Completa todos los campos obligatorios.");
      return false;
    }

    return {
      tipo: t,
      idDetalle,
      nombreEmpleado,
      ...(t==="checkin"
        ? { fechaYHoraCheckIn: fecha, observacionCheckIn: obs || null }
        : { fechaYHoraCheckOut: fecha, observacionCheckOut: obs || null })
    };
  };

  while (true) {
    let shouldRerender = false;
    const r = await Swal.fire({
      title: tipo==="checkin"?"Registrar Check-in":"Registrar Check-out",
      html: tpl(vals),
      width: 720,
      customClass: { popup:"swal2-modern" },
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        document.getElementById("op-tipo")?.addEventListener("change", () => {
          tipo = document.getElementById("op-tipo").value;
          vals = keep();
          shouldRerender = true;
          Swal.close();
        });
      },
      preConfirm: () => read(tipo),
    });

    if (shouldRerender) continue;        
    if (!r.isConfirmed) return null;     
    return r.value;                      
  }
}

/* --------------------------- Controller --------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.Swal) { console.error("SweetAlert2 no cargó."); return; }
  injectSwalStyles();

  // 3 tablas en tu HTML: 0=IN, 1=OUT, 2=HIST
  const tbodys = Array.from(document.querySelectorAll(".section-card .data-table tbody"));
  const [tbodyIn, tbodyOut, tbodyHist] = tbodys;

  const histCard = tbodyHist?.closest(".section-card");
  const searchInput  = histCard?.querySelector(".search-input");
  const filterSelect = histCard?.querySelector(".filter-select"); 
  const dateFilter   = histCard?.querySelector(".date-filter");

  // Estado local
  let IN = [], OUT = [], HIST = [];

  // Normalizadores
  const asCheckIn  = (r) => ({
    id:      r.idCheckIn ?? r.id ?? "",
    detalle: r.idDetalle ?? "-",
    empleado:r.nombreEmpleado ?? "-",
    fecha:   r.fechaYHoraCheckIn ?? "-",
    obs:     r.observacionCheckIn ?? "-"
  });
  const asCheckOut = (r) => ({
    id:      r.idCheckOut ?? r.id ?? "",
    detalle: r.idDetalle ?? "-",
    empleado:r.nombreEmpleado ?? "-",
    fecha:   r.fechaYHoraCheckOut ?? "-",
    obs:     r.observacionCheckOut ?? "-"
  });

  /* ------------------------------- Render ------------------------------- */
  const renderPendientes = (data, tbody, isIn) => {
    tbody.innerHTML = data.length
      ? data.map(x => `
        <tr data-id="${x.id}">
          <td>${x.detalle}</td>
          <td>${x.empleado}</td>
          <td>${x.fecha}</td>
          <td>${x.obs}</td>
          <td class="actions">
            <button class="btn-action edit"     title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete"   title="Eliminar"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="5">Sin registros</td></tr>`;
  };

  const renderHist = (data) => {
    if (!tbodyHist) return;
    tbodyHist.innerHTML = data.length
      ? data.map(h => `
        <tr>
          <td>${h.detalle}</td>
          <td>${h.empleado}</td>
          <td>${h.tipo}</td>
          <td>${h.fecha}</td>
          <td>${h.obs}</td>
        </tr>`).join("")
      : `<tr><td colspan="5">Sin movimientos</td></tr>`;
  };

  /* ------------------------------- Loads ------------------------------- */
  async function loadIn(){
    if (!tbodyIn) return;
    tbodyIn.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
    try{
      const raw  = await getCheckIn();
      const json = (raw && typeof raw.json === "function") ? await raw.json() : raw;
      IN = normalizeList(json).map(asCheckIn);
      renderPendientes(IN, tbodyIn, true);
    }catch(e){
      console.error(e);
      tbodyIn.innerHTML = `<tr><td colspan="5">Error al cargar check-ins</td></tr>`;
    }
  }
  async function loadOut(){
    if (!tbodyOut) return;
    tbodyOut.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
    try{
      const raw  = await getCheckOut();
      const json = (raw && typeof raw.json === "function") ? await raw.json() : raw;
      OUT = normalizeList(json).map(asCheckOut);
      renderPendientes(OUT, tbodyOut, false);
    }catch(e){
      console.error(e);
      tbodyOut.innerHTML = `<tr><td colspan="5">Error al cargar check-outs</td></tr>`;
    }
  }
  async function loadHist(){
    const h1 = IN.map(x => ({ tipo:"check-in",  ...x }));
    const h2 = OUT.map(x => ({ tipo:"check-out", ...x }));
    HIST = [...h1, ...h2].sort((a,b)=> String(b.fecha||"").localeCompare(String(a.fecha||"")));
    renderHist(HIST);
  }

  /* -------------------------- Acciones por fila -------------------------- */
  function attachRowActions(tbody, isIn){
    if (!tbody) return;
    tbody.addEventListener("click", async (e)=>{
      const btn = e.target.closest("button"); if (!btn) return;
      const tr = btn.closest("tr"); const id = tr?.dataset.id; if (!id) return;
      const list = isIn ? IN : OUT;

      if (btn.classList.contains("edit")){
        const current = list.find(x => String(x.id) === String(id)); if (!current) return;
        const preset = {
          idDetalle: current.detalle,
          nombreEmpleado: current.empleado,
          fecha: current.fecha,
          observacion: current.obs
        };
        const payload = await openCheckDialog(isIn ? "checkin" : "checkout", preset);
        if (!payload) return;
        try {
          if (isIn){ await updateCheckIn(id, payload);  await loadIn(); }
          else     { await updateCheckOut(id, payload); await loadOut(); }
          await loadHist(); toast("success","Actualizado");
        }catch(err){ console.error(err); toast("error","No se pudo actualizar"); }
        return;
      }

      if (btn.classList.contains("delete")){
        const { isConfirmed } = await Swal.fire({
          title:"¿Eliminar registro?",
          text:"Esta acción no se puede deshacer.",
          icon:"warning", showCancelButton:true,
          confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
        });
        if (!isConfirmed) return;
        try {
          if (isIn){ await deleteCheckIn(id);  await loadIn(); }
          else     { await deleteCheckOut(id); await loadOut(); }
          await loadHist(); toast("success","Eliminado");
        }catch(err){ console.error(err); toast("error","No se pudo eliminar"); }
      }
    });
  }

  /* --------------------------- Botón principal --------------------------- */
  const btnAbrir = document.getElementById("ModalOn") || document.querySelector(".back-button");
  btnAbrir?.addEventListener("click", async (e)=>{
    e.preventDefault();
    const payload = await openCheckDialog("checkin");
    if (!payload) return;
    try{
      if (payload.tipo === "checkin") {
        await createCheckIn(payload);  await loadIn();
      } else {
        await createCheckOut(payload); await loadOut();
      }
      await loadHist();
      toast("success","Registro creado");
    }catch(err){
      console.error(err);
      toast("error","No se pudo registrar");
    }
  });

  /* -------------------------------- Init -------------------------------- */
  attachRowActions(tbodyIn,  true);
  attachRowActions(tbodyOut, false);
  await Promise.all([loadIn(), loadOut()]);
  await loadHist();
});
