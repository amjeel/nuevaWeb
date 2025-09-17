// js/Controller/ControllerCheckInOut.js
import {
  getCheckIn,
  createCheckIn,
  updateCheckIn,
  deleteCheckIn
} from "../Services/ServicesCheckIn.js";

import {
  getCheckOut,
  CreateCheckOut,
  updateCheckOut,
  deleteCheckOut
} from "../Services/ServiceCheckOut.js";

// ---------- Helpers (Swal, estilos, utils) ----------
async function ensureSwal() {
  if (window.Swal) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
}
function injectSwalStyles(){
  if (document.getElementById("swal-modern-check")) return;
  const css = `
    .swal2-modern { border-radius: 16px !important; padding: 22px !important; }
    .swal2-modern .swal2-title { font-size: 20px !important; font-weight: 700; }
    .swal2-modern .swal2-html-container { margin: 0 !important; }
    .swal2-modern .form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:left; }
    .swal2-modern .form-grid .full{ grid-column:1/-1; }
    .swal2-modern label{ font-size:13px;font-weight:600;color:#333;display:block;margin-bottom:6px; }
    .swal2-modern .input,.swal2-modern .select,.swal2-modern .textarea{
      width:100%;box-sizing:border-box;border:1px solid #d9dce3;border-radius:10px;padding:8px 12px;font-size:14px;background:#fff;
    }
    .swal2-modern .input,.swal2-modern .select{ height:40px; }
    .swal2-modern .input:focus,.swal2-modern .select:focus,.swal2-modern .textarea:focus{
      border-color:#2a7bff;box-shadow:0 0 0 3px rgba(42,123,255,.12);outline:none;
    }
    .swal2-styled.swal2-confirm{ background:#16a34a !important;border-radius:10px !important;font-weight:600;padding:10px 18px !important; }
    .swal2-styled.swal2-cancel{ background:#e5e7eb !important;color:#111827 !important;border-radius:10px !important;font-weight:600;padding:10px 18px !important; }
  `;
  const st = document.createElement("style");
  st.id = "swal-modern-check"; st.textContent = css; document.head.appendChild(st);
}
const norm = s => (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const toast = (icon="success", title="") =>
  Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1500, showConfirmButton:false });
const normalizeList = (json) => {
  if (Array.isArray(json)) return json;
  if (json?.content) return json.content;
  if (json?.data)    return json.data;
  if (json?.items)   return json.items;
  if (json?.results) return json.results;
  return [];
};

// ---------- Modal único Check-in / Check-out ----------
async function openCheckDialog(initialTipo = "checkin", preset = {}) {
  let tipo = initialTipo;

  const bodyCheckIn = (v={}) => `
    <div>
      <label>Fecha/Hora llegada</label>
      <input id="op-fecha" class="input" type="datetime-local" value="${v.fechaHora ?? ""}">
    </div>
    <div>
      <label>Documento verificado</label>
      <select id="op-doc" class="select">
        <option value="si" ${v.docOk==="si"?"selected":""}>Sí</option>
        <option value="no" ${v.docOk==="no"?"selected":""}>No</option>
      </select>
    </div>
  `;
  const bodyCheckOut = (v={}) => `
    <div>
      <label>Fecha/Hora salida</label>
      <input id="op-fecha" class="input" type="datetime-local" value="${v.fechaHora ?? ""}">
    </div>
    <div>
      <label>Cargos adicionales</label>
      <input id="op-cargos" class="input" type="number" step="0.01" min="0" placeholder="0.00" value="${v.cargos ?? ""}">
    </div>
    <div>
      <label>Método de pago</label>
      <select id="op-pago" class="select">
        <option value="efectivo" ${v.pago==="efectivo"?"selected":""}>Efectivo</option>
        <option value="tarjeta"  ${v.pago==="tarjeta"?"selected":""}>Tarjeta</option>
        <option value="transferencia" ${v.pago==="transferencia"?"selected":""}>Transferencia</option>
      </select>
    </div>
  `;
  const baseHtml = (vals={}) => `
    <div class="form-grid">
      <div>
        <label>Tipo</label>
        <select id="op-tipo" class="select">
          <option value="checkin" ${tipo==="checkin"?"selected":""}>Check-in</option>
          <option value="checkout" ${tipo==="checkout"?"selected":""}>Check-out</option>
        </select>
      </div>
      <div>
        <label>ID Reserva</label>
        <input id="op-reserva" class="input" placeholder="ID de la reserva" value="${vals.reservaId ?? ""}">
      </div>
      <div>
        <label>Huésped</label>
        <input id="op-huesped" class="input" placeholder="Nombre del huésped" value="${vals.huesped ?? ""}">
      </div>
      <div>
        <label>Habitación</label>
        <input id="op-hab" class="input" placeholder="Ej. 203" value="${vals.habitacion ?? ""}">
      </div>

      ${tipo === "checkin" ? bodyCheckIn(vals) : bodyCheckOut(vals)}

      <div class="full">
        <label>Notas (opcional)</label>
        <textarea id="op-notas" class="textarea" rows="3" placeholder="Observaciones...">${vals.notas ?? ""}</textarea>
      </div>
    </div>
  `;
  const keepValues = () => {
    const g = id => document.getElementById(id)?.value ?? "";
    return {
      reservaId: g("op-reserva"),
      huesped:   g("op-huesped"),
      habitacion:g("op-hab"),
      fechaHora: g("op-fecha"),
      docOk:     document.getElementById("op-doc")?.value ?? "",
      cargos:    g("op-cargos"),
      pago:      document.getElementById("op-pago")?.value ?? "",
      notas:     g("op-notas"),
    };
  };
  const readAndValidate = (t) => {
    const g = id => document.getElementById(id)?.value?.trim() ?? "";
    const reservaId = g("op-reserva");
    const huesped   = g("op-huesped");
    const habitacion= g("op-hab");
    const fechaHora = g("op-fecha");
    const notas     = g("op-notas");

    if (!reservaId || !huesped || !habitacion || !fechaHora) {
      Swal.showValidationMessage("Completa ID Reserva, Huésped, Habitación y Fecha/Hora.");
      return false;
    }
    const payload = {
      tipo: t,   // "checkin" | "checkout"
      idReserva: reservaId,
      nombreHuesped: huesped,
      numeroHabitacion: habitacion,
      fechaHora,
      notas: notas || null,
    };
    if (t === "checkin") {
      payload.documentoVerificado = (document.getElementById("op-doc")?.value ?? "no") === "si";
    } else {
      const cargos = parseFloat(document.getElementById("op-cargos")?.value || "0");
      if (Number.isNaN(cargos) || cargos < 0) {
        Swal.showValidationMessage("Los cargos adicionales no son válidos.");
        return false;
      }
      payload.cargosAdicionales = cargos;
      payload.metodoPago = document.getElementById("op-pago")?.value || "efectivo";
    }
    return payload;
  };

  // Primer render
  let html = baseHtml(preset);
  let result = await Swal.fire({
    title: "Registrar operación",
    html, width: 720,
    customClass: { popup: "swal2-modern" },
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    didOpen: () => {
      const sel = document.getElementById("op-tipo");
      sel?.addEventListener("change", () => {
        tipo = sel.value;
        Swal.close({ isConfirmed:false, value:"__RERENDER__" });
      });
    },
    preConfirm: () => readAndValidate(tipo),
  });

  // Si se cambió el tipo, re-render conservando valores
  while (result.isDismissed === false && result.value === "__RERENDER__") {
    const keep = keepValues();
    html = baseHtml(keep);
    result = await Swal.fire({
      title: "Registrar operación",
      html, width: 720,
      customClass: { popup: "swal2-modern" },
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const sel = document.getElementById("op-tipo");
        sel?.addEventListener("change", () => {
          tipo = sel.value;
          Swal.close({ isConfirmed:false, value:"__RERENDER__" });
        });
      },
      preConfirm: () => readAndValidate(tipo),
    });
  }
  return result.isConfirmed ? result.value : null;
}

// ---------- Controller principal ----------
document.addEventListener("DOMContentLoaded", async () => {
  await ensureSwal();
  injectSwalStyles();

  // TBODYs (en el orden visual de tu HTML)
  const tbodys = Array.from(document.querySelectorAll(".section-card .data-table tbody"));
  const tbodyIn   = tbodys[0];
  const tbodyOut  = tbodys[1];
  const tbodyHist = tbodys[2];

  const btnAbrir = document.getElementById("ModalOn") || document.querySelector(".back-button");


  // Selectores del bloque "Historial Reciente"
  const histSection = Array.from(document.querySelectorAll(".section-card"))
    .find(sec => sec.querySelector(".table-actions"));
  const searchInput  = histSection?.querySelector(".search-input");
  const filterSelect = histSection?.querySelector(".filter-select");
  const dateFilter   = histSection?.querySelector(".date-filter");

  // Estado local
  let IN = [];   // pendientes check-in hoy
  let OUT = [];  // pendientes check-out hoy
  let HIST = []; // historial combinado

  // Mapeo flexible
  const asCheckIn = (r) => ({
    id:       r.idCheckIn ?? r.id ?? r.checkinId ?? "",
    reserva:  r.idReserva ?? r.reservaId ?? r.reserva ?? "",
    huesped:  r.huesped ?? r.nombreHuesped ?? r.cliente ?? "-",
    hab:      r.habitacion ?? r.numeroHabitacion ?? r.hab ?? "-",
    hora:     r.horaPrevista ?? r.fechaHora ?? r.hora ?? "-",
    raw: r
  });
  const asCheckOut = (r) => ({
    id:       r.idCheckOut ?? r.id ?? r.checkoutId ?? "",
    reserva:  r.idReserva ?? r.reservaId ?? r.reserva ?? "",
    huesped:  r.huesped ?? r.nombreHuesped ?? r.cliente ?? "-",
    hab:      r.habitacion ?? r.numeroHabitacion ?? r.hab ?? "-",
    hora:     r.horaPrevista ?? r.fechaHora ?? r.hora ?? "-",
    raw: r
  });
  const asHist = (r, tipo) => ({
    tipo, // "checkin" | "checkout"
    huesped: r.huesped ?? r.nombreHuesped ?? "-",
    hab:    r.habitacion ?? r.numeroHabitacion ?? "-",
    fecha:  r.fechaHora ?? r.hora ?? r.fecha ?? "-",
    asist:  r.asistente ?? r.usuario ?? r.user ?? "-",
  });

  // Render pendientes
  const renderPendientes = (data, tbody, isIn=true) => {
    tbody.innerHTML = "";
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5">Sin pendientes</td></tr>`;
      return;
    }
    data.forEach(x => {
      const tr = document.createElement("tr");
      tr.dataset.id = x.id;
      tr.innerHTML = `
        <td>${x.reserva}</td>
        <td>${x.huesped}</td>
        <td>${x.hab}</td>
        <td>${x.hora}</td>
        <td>
          <button class="btn-action btn-view"   title="Ver"><i class="fas fa-eye"></i></button>
          <button class="btn-action edit"       title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-action delete"     title="Eliminar"><i class="fas fa-trash"></i></button>
          <button class="btn-action primary do" title="${isIn?'Hacer check-in':'Hacer check-out'}">
            <i class="fas fa-check"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };
  // Render historial
  const renderHist = (data) => {
    tbodyHist.innerHTML = "";
    if (!data.length) {
      tbodyHist.innerHTML = `<tr><td colspan="5">Sin movimientos</td></tr>`;
      return;
    }
    data.forEach(h => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${h.huesped}</td>
        <td>${h.hab}</td>
        <td>${h.tipo === "checkin" ? "Check-in" : "Check-out"}</td>
        <td>${h.fecha}</td>
        <td>${h.asist}</td>
      `;
      tbodyHist.appendChild(tr);
    });
  };

  // Cargas
  async function loadIn(){
    tbodyIn.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
    try{
      const raw = await getCheckIn();
      IN = normalizeList(raw).map(asCheckIn);
      renderPendientes(IN, tbodyIn, true);
    }catch(e){
      console.error(e);
      tbodyIn.innerHTML = `<tr><td colspan="5">Error al cargar check-ins</td></tr>`;
    }
  }
  async function loadOut(){
    tbodyOut.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
    try{
      const raw = await getCheckOut();
      OUT = normalizeList(raw).map(asCheckOut);
      renderPendientes(OUT, tbodyOut, false);
    }catch(e){
      console.error(e);
      tbodyOut.innerHTML = `<tr><td colspan="5">Error al cargar check-outs</td></tr>`;
    }
  }
  async function loadHist(){
    // Si tienes endpoint real de historial, úsalo aquí.
    const h1 = IN.map(x => asHist({
      nombreHuesped: x.huesped, numeroHabitacion: x.hab, fechaHora: x.hora, asistente: "-"
    },"checkin"));
    const h2 = OUT.map(x => asHist({
      nombreHuesped: x.huesped, numeroHabitacion: x.hab, fechaHora: x.hora, asistente: "-"
    },"checkout"));
    const toKey = d => (d || "");
    HIST = [...h1, ...h2].sort((a,b)=> String(toKey(b.fecha)).localeCompare(String(toKey(a.fecha))));
    renderHist(HIST);
  }

  // Filtros historial
  function applyHistFilters(){
    const q = norm(searchInput?.value || "");
    const t = norm(filterSelect?.value || "");       // "" | "checkin" | "checkout"
    const d = (dateFilter?.value || "");            // yyyy-mm-dd
    const filtered = HIST.filter(h=>{
      const okQ = !q || norm(h.huesped).includes(q) || norm(h.hab).includes(q);
      const okT = !t || norm(h.tipo).includes(t);
      const okD = !d || (h.fecha && String(h.fecha).slice(0,10) === d);
      return okQ && okT && okD;
    });
    renderHist(filtered);
  }
  searchInput?.addEventListener("input", applyHistFilters);
  filterSelect?.addEventListener("change", applyHistFilters);
  dateFilter?.addEventListener("change", applyHistFilters);

  // Botón superior: abrir modal y crear
  btnAbrir?.addEventListener("click", async ()=>{
    const payload = await openCheckDialog("checkin");
    if (!payload) return;
    try{
      if (payload.tipo === "checkin") {
        await createCheckIn(payload);
        toast("success","Check-in registrado");
        await loadIn(); await loadHist();
      } else {
        await createCheckOut(payload);
        toast("success","Check-out registrado");
        await loadOut(); await loadHist();
      }
    }catch(e){
      console.error(e);
      toast("error","No se pudo registrar");
    }
  });

  // Acciones por fila (pendientes)
  function attachTableActions(tbody, isIn){
    tbody.addEventListener("click", async (e)=>{
      const btn = e.target.closest("button"); if (!btn) return;
      const tr = btn.closest("tr"); const id = tr?.dataset.id;
      if (!id) return;

      // Ver
      if (btn.classList.contains("btn-view")){
        const tds = tr.querySelectorAll("td");
        await Swal.fire({
          title: `${isIn?"Pendiente Check-in":"Pendiente Check-out"}`,
          html: `
            <div style="text-align:left">
              <p><b>Reserva:</b> ${tds[0].textContent}</p>
              <p><b>Huésped:</b> ${tds[1].textContent}</p>
              <p><b>Habitación:</b> ${tds[2].textContent}</p>
              <p><b>Hora prevista:</b> ${tds[3].textContent}</p>
            </div>
          `,
          icon:"info"
        });
        return;
      }

      // Editar
      if (btn.classList.contains("edit")){
        try{
          const list = isIn ? IN : OUT;
          const current = list.find(x => String(x.id) === String(id));
          if (!current) return;

          const preset = {
            reservaId: current.reserva,
            huesped: current.huesped,
            habitacion: current.hab,
            fechaHora: current.hora
          };
          const payload = await openCheckDialog(isIn ? "checkin" : "checkout", preset);
          if (!payload) return;

          if (isIn){
            await updateCheckIn(id, payload);
            toast("success","Check-in actualizado");
            await loadIn(); await loadHist();
          }else{
            await updateCheckOut(id, payload);
            toast("success","Check-out actualizado");
            await loadOut(); await loadHist();
          }
        }catch(e){
          console.error(e);
          toast("error","No se pudo actualizar");
        }
        return;
      }

      // Eliminar
      if (btn.classList.contains("delete")){
        const { isConfirmed } = await Swal.fire({
          title: "¿Eliminar registro?",
          text: "Esta acción no se puede deshacer.",
          icon: "warning", showCancelButton:true,
          confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
        });
        if (!isConfirmed) return;

        try{
          if (isIn){
            await deleteCheckIn(id);
            toast("success","Eliminado");
            await loadIn(); await loadHist();
          }else{
            await deleteCheckOut(id);
            toast("success","Eliminado");
            await loadOut(); await loadHist();
          }
        }catch(e){
          console.error(e);
          toast("error","No se pudo eliminar");
        }
        return;
      }

      // Ejecutar (hacer check-in/out)
      if (btn.classList.contains("do")){
        try{
          if (isIn){
            await updateCheckIn(id, { accion:"confirmar" }); // adapta a tu backend
            toast("success","Check-in realizado");
            await loadIn(); await loadHist();
          }else{
            await updateCheckOut(id, { accion:"confirmar" });
            toast("success","Check-out realizado");
            await loadOut(); await loadHist();
          }
        }catch(e){
          console.error(e);
          toast("error","Operación no realizada");
        }
      }
    });
  }
  attachTableActions(tbodyIn,  true);
  attachTableActions(tbodyOut, false);

  // Init
  try{
    await Promise.all([loadIn(), loadOut()]);
    await loadHist();
  }catch(e){
    console.error(e);
  }
});
