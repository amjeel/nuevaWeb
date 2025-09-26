// js/Controller/ControllerReservas.js
import {
  getReservas,
  createReservas,   
  updateReservas,   
  deleteReservas    
} from "../Services/ServiceReservas.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.querySelector(".data-table tbody");
  const btnNueva     = document.querySelector(".back-button");
  const searchInput  = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const dateFilter   = document.querySelector(".date-filter");
  const btnExport    = document.querySelector(".btn-export");

  const API_URL          = "http://localhost:8080/api";
  const ENDPOINT_ESTADOS = `${API_URL}/consultarEstadosReserva`;

  let ESTADOS = [];
  let DATA    = [];

  // ---------- utils ----------
  const norm = (s) => (s ?? "").toString()
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const toast = (icon="success", title="") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1600, showConfirmButton:false, timerProgressBar:true });

  const normalizeList = (json) => {
    if (Array.isArray(json)) return json;
    if (json?.content) return json.content;
    if (json?.data)    return json.data;
    return [];
  };

  const toDisplayDate = (val) => {
    if (!val) return "-";
    const iso = String(val).slice(0,10);
    const [y,m,d] = iso.split("-");
    return y && m && d ? `${d}/${m}/${y}` : val;
  };

  const toIsoDate = (val) => {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const [d,m,y] = String(val).split("/");
    return d && m && y ? `${y}-${m}-${d}` : val;
  };

  const hex32 = (x) => String(x ?? "").toUpperCase().replace(/-/g,"").slice(0,32);

  // ---------- estados ----------
  async function loadEstados(){
    try{
      const res = await fetch(ENDPOINT_ESTADOS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      ESTADOS = normalizeList(raw);
    }catch(err){
      console.error("Error cargando estados:", err);
      ESTADOS = [];
    }
  }

  const estadoNombreById = (id) => {
    const e = ESTADOS.find(x => String(x.idEstadoReserva ?? x.id) === String(id));
    return e?.nombreEstadoReserva ?? e?.nombre ?? id ?? "-";
  };

  const statusBadge = (estadoTxt) => {
    const e = norm(estadoTxt);
    if (e.includes("conf")) return `<span class="status-badge available">Confirmada</span>`;
    if (e.includes("pend")) return `<span class="status-badge cleaning">Pendiente</span>`;
    if (e.includes("canc")) return `<span class="status-badge occupied">Cancelada</span>`;
    return `<span class="status-badge other">${estadoTxt || "-"}</span>`;
  };

  // ---------- render ----------
  const renderRow = (r) => {
    const id      = r.idReserva ?? r.id ?? "";
    const huesped = r.nombreHuesped ?? r.huesped ?? "-";
    const hab     = r.habitacion ?? r.numeroHabitacion ?? "-";
    const fIn     = toDisplayDate(r.fechaEntrada);
    const fOut    = toDisplayDate(r.fechaSalida);
    const estNom  = r.nombreEstadoReserva ?? r.estado ?? estadoNombreById(r.idEstadoReserva);

    const tr = document.createElement("tr");
    tr.dataset.idReserva = id;
    tr.innerHTML = `
      <td>#${id}</td>
      <td class="user-info"><img src="assets/images/user-avatar.jpg" alt="Guest" class="user-avatar-small"> ${huesped}</td>
      <td>${hab}</td>
      <td>${fIn}</td>
      <td>${fOut}</td>
      <td>${statusBadge(estNom)}</td>
      <td>
        <button class="btn-action"><i class="fas fa-info-circle"></i></button>
        <button class="btn-action edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    return tr;
  };

  const renderTabla = (lista) => {
    tbody.innerHTML = "";
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="7">No hay reservas</td></tr>`;
      return;
    }
    lista.forEach(r => tbody.appendChild(renderRow(r)));
  };

  // ---------- filtros ----------
  function applyFilters(){
    const q    = norm(searchInput?.value || "");
    const fVal = norm(filterSelect?.value || "");
    const date = dateFilter?.value || "";

    Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
      const tds = tr.querySelectorAll("td");
      const idTxt     = norm(tds[0]?.textContent || "");
      const huesped   = norm(tds[1]?.textContent || "");
      const estadoTxt = norm(tds[5]?.textContent || "");
      const fechaIn   = tds[3]?.textContent || "";

      const okQ = !q || idTxt.includes(q) || huesped.includes(q);
      let okF   = true;
      if (fVal) okF = estadoTxt.includes(fVal);
      const okD = !date || fechaIn === toDisplayDate(date);

      tr.style.display = (okQ && okF && okD) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);
  dateFilter?.addEventListener("change", applyFilters);

  // ---------- export ----------
  btnExport?.addEventListener("click", ()=>{
    const rows = Array.from(tbody.querySelectorAll("tr")).filter(tr=>tr.style.display!=="none");
    if (!rows.length) return toast("info","No hay datos para exportar");
    const headers = ["ID Reserva","Huésped","Habitación","Fecha Entrada","Fecha Salida","Estado"];
    const csv = [headers.join(",")];
    rows.forEach(tr=>{
      const t = tr.querySelectorAll("td");
      csv.push([
        t[0].textContent.trim(),
        `"${t[1].textContent.trim()}"`,
        t[2].textContent.trim(),
        t[3].textContent.trim(),
        t[4].textContent.trim(),
        t[5].textContent.trim()
      ].join(","));
    });
    const blob = new Blob([csv.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href:url, download:`reservas_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("success","CSV exportado");
  });

  // ---------- modal ----------
  const modalHtml = (vals = {}) => `
    <div class="swal2-grid compact" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">
      <div class="fg full">
        <label>Huésped / ID Cliente</label>
        <input id="r-cliente" class="input" type="text" placeholder="ID del cliente" value="${vals.idCliente ?? ""}">
        <small>Ingresa el <b>ID del cliente</b> (GUID). Si tu UI muestra nombre, mapea a ID antes de enviar.</small>
      </div>
      <div class="fg">
        <label>Habitación / ID Habitacion</label>
        <input id="r-habitacion" class="input" type="text" placeholder="ID Habitación" value="${vals.idHabitacion ?? ""}">
      </div>
      <div class="fg">
        <label>Fecha Entrada</label>
        <input id="r-fechaIn" class="input" type="date" value="${vals.fechaEntrada ? toIsoDate(vals.fechaEntrada) : ""}">
      </div>
      <div class="fg">
        <label>Fecha Salida</label>
        <input id="r-fechaOut" class="input" type="date" value="${vals.fechaSalida ? toIsoDate(vals.fechaSalida) : ""}">
      </div>
      <div class="fg">
        <label>Estado</label>
        <select id="r-estado" class="input">
          <option value="">Seleccione...</option>
          ${ESTADOS.map(e => {
            const id = e.idEstadoReserva ?? e.id ?? "";
            const name = e.nombreEstadoReserva ?? e.nombre ?? "";
            const sel = String(id) === String(vals.idEstadoReserva) ? "selected" : "";
            return `<option value="${id}" ${sel}>${name}</option>`;
          }).join("")}
        </select>
      </div>
      <div class="fg full">
        <label>Notas (opcional)</label>
        <textarea id="r-notas" class="textarea" rows="3" placeholder="Comentarios...">${vals.notas ?? ""}</textarea>
      </div>
    </div>
  `;

  const readModal = () => {
    const idCliente   = document.getElementById("r-cliente").value.trim();
    const idHabitacion= document.getElementById("r-habitacion").value.trim();
    const fechaInISO  = document.getElementById("r-fechaIn").value.trim();   // YYYY-MM-DD
    const fechaOutISO = document.getElementById("r-fechaOut").value.trim();  // YYYY-MM-DD
    const estado      = document.getElementById("r-estado").value;
    const notas       = (document.getElementById("r-notas")?.value || "").trim();

    if (!idCliente || !idHabitacion || !fechaInISO || !fechaOutISO || !estado) {
      Swal.showValidationMessage("Completa todos los campos obligatorios.");
      return false;
    }
    // devuelve un objeto "front" que luego mapeamos al DTO
    return {
      idCliente,
      idHabitacion,
      fechaEntrada: fechaInISO,
      fechaSalida:  fechaOutISO,
      idEstadoReserva: estado,
      notas:        notas || null
    };
  };

  // ---------- mapeo al DTO del backend ----------
  function buildReservaPayload(front){
    // Ajusta nombres EXACTOS a tu DTO si difieren:
    return {
      idCliente:       hex32(front.idCliente),
      idHabitacion:    hex32(front.idHabitacion),
      fechaEntrada:    toIsoDate(front.fechaEntrada),  // "YYYY-MM-DD"
      fechaSalida:     toIsoDate(front.fechaSalida),   // "YYYY-MM-DD"
      idEstadoReserva: hex32(front.idEstadoReserva),
      notas:           front.notas ?? null
    };
  }

  // ---------- diálogos ----------
  async function createDialog(){
    await loadEstados();
    const { value } = await Swal.fire({
      title:"Nueva Reserva",
      html: modalHtml(),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: readModal
    });
    return value || null;
  }

  async function editDialog(current){
    await loadEstados();
    // asumimos que en DATA vienen los ids reales; si no, adapta estas claves
    const vals = {
      idCliente:       current.idCliente ?? "",
      idHabitacion:    current.idHabitacion ?? "",
      fechaEntrada:    current.fechaEntrada ?? "",
      fechaSalida:     current.fechaSalida ?? "",
      idEstadoReserva: current.idEstadoReserva ?? "",
      notas:           current.notas ?? ""
    };
    const { value } = await Swal.fire({
      title:`Editar Reserva ${current.idReserva ?? ""}`,
      html: modalHtml(vals),
      focusConfirm:false, showCancelButton:true,
      confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
      customClass: { popup: "swal2-modern" },
      preConfirm: readModal
    });
    return value || null;
  }

  // ---------- carga inicial ----------
  async function loadReservas(){
    tbody.innerHTML = `<tr><td colspan="7">Cargando...</td></tr>`;
    try{
      const raw = await getReservas();
      DATA = normalizeList(raw);
      await loadEstados();
      renderTabla(DATA);
      applyFilters();
    }catch(e){
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="7">Error al cargar reservas</td></tr>`;
      toast("error","Error cargando reservas");
    }
  }

  // ---------- acciones ----------
  btnNueva?.addEventListener("click", async () => {
    try{
      const front = await createDialog();
      if (!front) return;
      const payload = buildReservaPayload(front);
      const resp = await createReservas(payload);  // ← usar la import plural
      console.log("[POST] payload", payload, "resp", resp);
      toast("success","Reserva creada");
      await loadReservas();
    }catch(e){
      console.error(e);
      toast("error","No se pudo crear");
    }
  });

  tbody.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if (!btn) return;

    const tr = e.target.closest("tr");
    const id = tr?.dataset.idReserva;
    if (!id) return;

    if (!btn.classList.contains("edit") && !btn.classList.contains("delete")) {
      const t = tr.querySelectorAll("td");
      await Swal.fire({
        title: `Reserva ${t[0].textContent.trim()}`,
        html: `
          <div style="text-align:left">
            <p><b>Huésped:</b> ${t[1].textContent.trim()}</p>
            <p><b>Habitación:</b> ${t[2].textContent.trim()}</p>
            <p><b>Entrada:</b> ${t[3].textContent.trim()}</p>
            <p><b>Salida:</b> ${t[4].textContent.trim()}</p>
            <p><b>Estado:</b> ${t[5].textContent.trim()}</p>
          </div>
        `,
        icon:"info"
      });
      return;
    }

    if (btn.classList.contains("edit")){
      try{
        const current = DATA.find(x => String(x.idReserva ?? x.id) === String(id));
        if (!current) return;
        const front = await editDialog(current);
        if (!front) return;
        const payload = buildReservaPayload(front);
        const resp = await updateReservas(id, payload); // ← plural
        console.log("[PUT] id", id, "payload", payload, "resp", resp);
        toast("success","Reserva actualizada");
        await loadReservas();
      }catch(e){
        console.error(e);
        toast("error","No se pudo actualizar");
      }
      return;
    }

    if (btn.classList.contains("delete")){
      const { isConfirmed } = await Swal.fire({
        title:"¿Eliminar reserva?",
        text:`Se eliminará la reserva #${id}. Esta acción no se puede deshacer.`,
        icon:"warning", showCancelButton:true,
        confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
      });
      if (!isConfirmed) return;

      try{
        const resp = await deleteReservas(id); // ← plural
        console.log("[DELETE] id", id, "resp", resp);
        toast("success","Reserva eliminada");
        await loadReservas();
      }catch(e){
        console.error(e);
        toast("error","No se pudo eliminar");
      }
    }
  });

  loadReservas();
});
