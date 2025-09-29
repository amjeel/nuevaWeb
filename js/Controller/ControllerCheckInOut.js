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

/* ------------------ Modal único Check-in / Check-out ------------------ */
async function openCheckDialog(initialTipo="checkin", preset={}){
  let tipo = initialTipo;
  let vals = { ...preset };

  const bodyCheckIn  = (v={}) => `
    <div><label>Fecha/Hora llegada</label>
      <input id="op-fecha" class="input" type="datetime-local" value="${v.fechaHora ?? ""}">
    </div>
    <div><label>Documento verificado</label>
      <select id="op-doc" class="select">
        <option value="si" ${v.docOk==="si"?"selected":""}>Sí</option>
        <option value="no" ${v.docOk==="no"?"selected":""}>No</option>
      </select>
    </div>`;

  const bodyCheckOut = (v={}) => `
    <div><label>Fecha/Hora salida</label>
      <input id="op-fecha" class="input" type="datetime-local" value="${v.fechaHora ?? ""}">
    </div>
    <div><label>Cargos adicionales</label>
      <input id="op-cargos" class="input" type="number" step="0.01" min="0" placeholder="0.00" value="${v.cargos ?? ""}">
    </div>
    <div><label>Método de pago</label>
      <select id="op-pago" class="select">
        <option value="efectivo" ${v.pago==="efectivo"?"selected":""}>Efectivo</option>
        <option value="tarjeta"  ${v.pago==="tarjeta"?"selected":""}>Tarjeta</option>
        <option value="transferencia" ${v.pago==="transferencia"?"selected":""}>Transferencia</option>
      </select>
    </div>`;

  const tpl = (v={}) => `
    <div class="form-grid">
      <div><label>Tipo</label>
        <select id="op-tipo" class="select">
          <option value="checkin"  ${tipo==="checkin"?"selected":""}>Check-in</option>
          <option value="checkout" ${tipo==="checkout"?"selected":""}>Check-out</option>
        </select>
      </div>
      <div><label>ID Reserva</label>
        <input id="op-reserva" class="input" placeholder="ID de la reserva" value="${v.reservaId ?? ""}">
      </div>
      <div><label>Huésped</label>
        <input id="op-huesped" class="input" placeholder="Nombre del huésped" value="${v.huesped ?? ""}">
      </div>
      <div><label>Habitación</label>
        <input id="op-hab" class="input" placeholder="Ej. 203" value="${v.habitacion ?? ""}">
      </div>
      ${tipo==="checkin" ? bodyCheckIn(v) : bodyCheckOut(v)}
      <div style="grid-column:1/-1"><label>Notas (opcional)</label>
        <textarea id="op-notas" class="textarea" rows="3" placeholder="Observaciones...">${v.notas ?? ""}</textarea>
      </div>
    </div>`;

  const keep = () => {
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

  const read = (t) => {
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
      tipo: t,
      idReserva: reservaId,
      nombreHuesped: huesped,
      numeroHabitacion: habitacion,
      fechaHora,
      notas: notas || null,
    };

    if (t==="checkin") {
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

  while (true) {
    let shouldRerender = false;
    const r = await Swal.fire({
      title: "Registrar operación",
      html: tpl(vals),
      width: 720,
      customClass: { popup: "swal2-modern" },
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

    if (shouldRerender) continue;        // reabre con el otro tipo
    if (!r.isConfirmed) return null;     // cancelado
    return r.value;                      // confirmado
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
  const filterSelect = histCard?.querySelector(".filter-select"); // valores: "", "check-in", "check-out" en minúsculas
  const dateFilter   = histCard?.querySelector(".date-filter");

  // Estado local
  let IN = [], OUT = [], HIST = [];

  // Normalizadores (map) flexibles
  const asCheckIn  = (r) => ({
    id:      r.idCheckIn ?? r.id ?? r.checkinId ?? "",
    reserva: r.idReserva ?? r.reservaId ?? r.reserva ?? "",
    huesped: r.huesped ?? r.nombreHuesped ?? r.cliente ?? "-",
    hab:     r.habitacion ?? r.numeroHabitacion ?? r.hab ?? "-",
    hora:    r.horaPrevista ?? r.fechaHora ?? r.hora ?? "-",
  });
  const asCheckOut = (r) => ({
    id:      r.idCheckOut ?? r.id ?? r.checkoutId ?? "",
    reserva: r.idReserva ?? r.reservaId ?? r.reserva ?? "",
    huesped: r.huesped ?? r.nombreHuesped ?? r.cliente ?? "-",
    hab:     r.habitacion ?? r.numeroHabitacion ?? r.hab ?? "-",
    hora:    r.horaPrevista ?? r.fechaHora ?? r.hora ?? "-",
  });

  /* ------------------------------- Render ------------------------------- */
  const renderPendientes = (data, tbody, isIn) => {
    tbody.innerHTML = data.length
      ? data.map(x => `
        <tr data-id="${x.id}">
          <td>${x.reserva}</td>
          <td>${x.huesped}</td>
          <td>${x.hab}</td>
          <td>${x.hora}</td>
          <td class="actions">
            <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
            <button class="btn-action edit"     title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete"   title="Eliminar"><i class="fas fa-trash"></i></button>
            <button class="btn-action primary do" title="${isIn?'Hacer check-in':'Hacer check-out'}">
              <i class="fas fa-check"></i>
            </button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="5">Sin pendientes</td></tr>`;
  };

  const renderHist = (data) => {
    if (!tbodyHist) return;
    tbodyHist.innerHTML = data.length
      ? data.map(h => `
        <tr>
          <td>${h.huesped}</td>
          <td>${h.hab}</td>
          <td>${h.tipo}</td>
          <td>${h.fecha}</td>
          <td>${h.asist}</td>
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
    // Si tu backend tiene historial real, reemplaza esta construcción local
    const h1 = IN.map(x => ({ tipo:"check-in",  huesped:x.huesped, hab:x.hab, fecha:x.hora, asist:"-" }));
    const h2 = OUT.map(x => ({ tipo:"check-out", huesped:x.huesped, hab:x.hab, fecha:x.hora, asist:"-" }));
    HIST = [...h1, ...h2].sort((a,b)=> String(b.fecha||"").localeCompare(String(a.fecha||"")));
    renderHist(HIST);
  }

  /* ---------------------------- Filtros Hist ---------------------------- */
  function applyHistFilters(){
    const q = norm(searchInput?.value || "");
    const t = (filterSelect?.value || "");      // "" | "check-in" | "check-out"
    const d = (dateFilter?.value || "");        // YYYY-MM-DD

    const filtered = HIST.filter(h=>{
      const okQ = !q || norm(h.huesped).includes(q) || norm(h.hab).includes(q);
      const okT = !t || (h.tipo.toLowerCase() === t);
      const okD = !d || (h.fecha && String(h.fecha).slice(0,10) === d);
      return okQ && okT && okD;
    });
    renderHist(filtered);
  }
  searchInput?.addEventListener("input", applyHistFilters);
  filterSelect?.addEventListener("change", applyHistFilters);
  dateFilter?.addEventListener("change", applyHistFilters);

  /* -------------------------- Acciones por fila -------------------------- */
  function attachRowActions(tbody, isIn){
    if (!tbody) return;
    tbody.addEventListener("click", async (e)=>{
      const btn = e.target.closest("button"); if (!btn) return;
      const tr = btn.closest("tr"); const id = tr?.dataset.id; if (!id) return;
      const list = isIn ? IN : OUT;

      if (btn.classList.contains("btn-view")){
        const [reserva,huesped,hab,hora] = Array.from(tr.querySelectorAll("td")).map(td=>td.textContent);
        await Swal.fire({
          title: isIn ? "Pendiente Check-in" : "Pendiente Check-out",
          html: `<div style="text-align:left">
                   <p><b>Reserva:</b> ${reserva}</p>
                   <p><b>Huésped:</b> ${huesped}</p>
                   <p><b>Habitación:</b> ${hab}</p>
                   <p><b>Hora prevista:</b> ${hora}</p>
                 </div>`,
          icon:"info"
        });
        return;
      }

      if (btn.classList.contains("edit")){
        const current = list.find(x => String(x.id) === String(id)); if (!current) return;
        const preset = { reservaId: current.reserva, huesped: current.huesped, habitacion: current.hab, fechaHora: current.hora };
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
        return;
      }

      if (btn.classList.contains("do")){
        try {
          if (isIn){ await updateCheckIn(id, { accion:"confirmar" });  await loadIn(); }
          else     { await updateCheckOut(id, { accion:"confirmar" }); await loadOut(); }
          await loadHist(); toast("success", isIn ? "Check-in realizado" : "Check-out realizado");
        }catch(err){ console.error(err); toast("error","Operación no realizada"); }
      }
    });
  }

  /* --------------------------- Botón principal --------------------------- */
  const btnAbrir = document.getElementById("ModalOn") || document.querySelector(".back-button");
  btnAbrir?.addEventListener("click", async (e)=>{
    e.preventDefault();
    const payload = await openCheckDialog("checkin"); // el usuario puede cambiar a "Check-out"
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
