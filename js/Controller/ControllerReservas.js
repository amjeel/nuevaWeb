import {
  getReservas,
  createReservas,
  updateReservas,
  deleteReservas
} from "../Services/ServicesReservas.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.querySelector(".data-table tbody");
  const btnNueva     = document.querySelector(".back-button");
  const searchInput  = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const btnExport    = document.querySelector(".btn-export");

  const $countAvail  = document.getElementById("countAvailable");
  const $countOcc    = document.getElementById("countOccupied");
  const $countClean  = document.getElementById("countCleaning");


  // --- Config API ---
  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_ESTADOS = `${API_URL}/consultarEstadosReserva`;
  const ENDPOINT_CLIENTES = `${API_URL}/consultarClientes`;
  const ENDPOINT_METODOPAGO = `${API_URL}/consultarMetodosPago`;


  // Catálogos
  let ESTADOS = []; 
  let CLIENTES = [];
  let PAGOS = [];

  // Estado local
  let DATA = [];

  // ------- Utils -------
  const norm = (s) => (s ?? "").toString()
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const money = (v) => { const n = Number(String(v ?? "").replace
    (/[^\d.,-]/g, "").replace(",", ".")); return isNaN(n) ? "0.00" : n.toFixed(2); };

  const toast = (icon="success", title="") =>
    Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1600, showConfirmButton:false, timerProgressBar:true });

  const normalizeList = (json) => {
    if (Array.isArray(json)) return json;
    if (json?.content) return json.content;
    if (json?.data)    return json.data;
    if (json?.items)   return json.items;
    if (json?.results) return json.results;
    return [];
  };

  const estadoKey = (val) => {
  const s = norm(val);
  if (s.includes("conf") || s === "1") return "Confirmada";
  if (s.includes("pend") || s === "2") return "Pendiente";
  if (s.includes("canc") || s === "3") return "Cancelada";
  return val || "-";
};

const statusBadge = (estadoTxt) => {
  const t = estadoKey(estadoTxt);
  const cls = t === "Confirmada" ? "available"
           : t === "Pendiente"  ? "occupied"
           : t === "Cancelada"  ? "cleaning"
           : "other";
  return `<span class="status-badge ${cls}">${t}</span>`;
};

  // ------- Catálogos -------
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

  async function loadClientes() {
    try{
      const res = await fetch (ENDPOINT_CLIENTES);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      CLIENTES = normalizeList(raw);
    }catch(err){
      console.error("Error cargando Clientes:", err);
      CLIENTES = [];
    }
  }

  async function loadPagos() {
    try{
      const res = await fetch (ENDPOINT_METODOPAGO);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      PAGOS = normalizeList(raw);
    }catch(err){
      console.error("Error cargando Pagos:", err);
      PAGOS = [];
    }
  }

  const optionsEstados = (selectedId=null) =>
    ESTADOS.map(x => {
      const id   = x.idEstadoReserva ?? x.id ?? "";
      const name = x.nombreEstadoReserva ?? x.nombre ?? "";
      const sel  = String(id) === String(selectedId) ? "selected" : "";
      return `<option value="${id}" ${sel}>${name}</option>`;
    }).join("");

  const optionsClientes = (selectedId=null) =>
    CLIENTES.map(x => {
      const id   = x.idCliente ?? x.id ?? "";
      const name = x.nombreCliente ?? x.nombre ?? "";
      const sel  = String(id) === String(selectedId) ? "selected" : "";
      return `<option value="${id}" ${sel}>${name}</option>`;
    }).join("");

    const optionsPagos = (selectedId=null) =>
    PAGOS.map(x => {
      const id   = x.idMetodoPago ?? x.id ?? "";
      const name = x.nombreMetodoPago ?? x.nombre ?? "";
      const sel  = String(id) === String(selectedId) ? "selected" : "";
      return `<option value="${id}" ${sel}>${name}</option>`;
    }).join("");

  const ClienteById = (id) => {
    const t = CLIENTES.find(x => String(x.idCliente ?? x.id) === String(id));
    return t?.nombreCliente ?? t?.nombre ?? "-";
  };

  const estadoNombreById = (id) => {
    const e = ESTADOS.find(x => String(x.idEstadoReserva ?? x.id) === String(id));
    return e?.nombreEstadoReserva ?? e?.nombre ?? id ?? "-";
  };

   const PagosbyId = (id) => {
    const e = PAGOS.find(x => String(x.idMetodoPago ?? x.id) === String(id));
    return e?.nombreMetodoPago ?? e?.nombre ?? id ?? "-";
  };

  // ------- Render -------
  const renderRow = (h) => {
  const id      = h.idReserva ?? h.id ?? "";
  const fechRe  = h.fechaReserva ?? h.fecha ?? "";

  const idCli   = h.idCliente ?? h.cliente ?? "";
  const nomCl   = h.nombreCliente ?? h.clienteNombre ?? (idCli ? ClienteById(idCli) : "-");

  const prec    = h.precioTotalReserva ?? h.precio ?? 0;

  const est     = h.nombreEstadoReserva ?? h.estadoNombre ?? h.estado ?? h.idEstadoReserva ?? "";

  const idPago  = h.idMetodoPago ?? h.metodoPago ?? "";
  const nomPag  = h.nombreMetodoPago ?? h.metodoPagoNombre ?? (idPago ? PagosbyId(idPago) : "-");


    const tr = document.createElement("tr");
    tr.dataset.idReserva = id;
    tr.innerHTML = `
      <td class="room-number">${nomCl}</td>
      <td>${fechRe}</td>
      <td>$${money(prec)}</td>
      <td>${nomPag}</td>
      <td>${statusBadge(est)}</td>
      <td>
        <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
        <button class="btn-action edit" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
    return tr;
  };

  const renderTabla = (lista) => {
    tbody.innerHTML = "";
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="7">Actualmente no hay Reservas</td></tr>`;
      return;
    }
    lista.forEach(h => tbody.appendChild(renderRow(h)));
  };

  const contarEstados = (lista) => {
  let conf=0, pend=0, canc=0;
  for (const h of lista) {
    const key = estadoKey(h.nombreEstadoReserva ?? h.estadoNombre ?? h.estado ?? h.idEstadoReserva);
    if (key === "Confirmada") conf++;
    else if (key === "Pendiente") pend++;
    else if (key === "Cancelada") canc++;
  }
  if ($countAvail) $countAvail.textContent = conf;
  if ($countOcc)   $countOcc.textContent   = pend;
  if ($countClean) $countClean.textContent = canc;
};

  // ------- Filtros / búsqueda -------
 function applyFilters(){
  const q = norm(searchInput?.value || "");
  const f = norm(filterSelect?.value || ""); // por ESTADO

  Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
    const t = tr.querySelectorAll("td");
    const cliente = norm(t[0]?.textContent || "");
    const fecha   = norm(t[1]?.textContent || "");
    const precio  = norm(t[2]?.textContent || "");
    const pago    = norm(t[3]?.textContent || "");
    const estado  = norm(t[4]?.textContent || "");

    const okQ = !q || cliente.includes(q) || fecha.includes(q) || precio.includes(q) || pago.includes(q) || estado.includes(q);
    const okF = !f || estado.includes(f);

    tr.style.display = (okQ && okF) ? "" : "none";
  });
}
// ------- Exportar CSV (RESERVAS) -------
btnExport?.addEventListener("click", ()=>{
  const rows = Array.from(tbody.querySelectorAll("tr")).filter(tr => tr.style.display !== "none");
  if (!rows.length) return toast("info","No hay datos para exportar");

  const headers = ["Cliente","Fecha","Precio","Método de pago","Estado"];
  const csv = [headers.join(",")];

  rows.forEach(tr=>{
    const t = tr.querySelectorAll("td");
    const cliente = (t[0]?.textContent.trim() || "");
    const fecha   = (t[1]?.textContent.trim() || "");
    const precio  = (t[2]?.textContent.trim() || "").replace("$","");
    const pago    = (t[3]?.textContent.trim() || "");
    const estado  = (t[4]?.textContent.trim() || "");

    csv.push([cliente, fecha, precio, pago, estado]
      .map(v => (/,|"/.test(v) ? `"${v.replaceAll(`"`,`""`)}"` : v)).join(","));
  });

  const blob = new Blob([csv.join("\n")], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `reservas_${new Date().toISOString().slice(0,10)}.csv`
  });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast("success","CSV exportado");
});

  // ------- Modal (SweetAlert2) -------
  const modalHtml = (vals = {}) => `
     <div class="swal2-grid compact" style="
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    text-align: left;
    font-size: 15px;
    padding: 5px 0;
  ">

    <div class="fg" style="display: flex; flex-direction: column;">
      <label for="r-fecha"><strong>Fecha de reserva</strong></label>
      <input id="r-fecha" class="input" type="date"
             value="${vals.fechaReserva ?? vals.fecha ?? ""}"
             style="padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
    </div>

    <div class="fg" style="display: flex; flex-direction: column;">
      <label for="r-cliente"><strong>Cliente</strong></label>
      <select id="r-cliente" class="input"
              style="padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
        <option value="">Seleccione...</option>
        ${typeof optionsClientes === "function" ? optionsClientes(vals.idCliente ?? vals.cliente ?? "") : ""}
      </select>
    </div>

    <div class="fg" style="display: flex; flex-direction: column;">
      <label for="r-precio"><strong>Precio total</strong></label>
      <input id="r-precio" class="input" type="number" step="0.01" min="0" placeholder="0.00"
             value="${vals.precioTotalReserva ?? vals.precio ?? ""}"
             style="padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
    </div>

    <div class="fg" style="display: flex; flex-direction: column;">
      <label for="r-estado"><strong>Estado</strong></label>
      <select id="r-estado" class="input"
              style="padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
        <option value="">Seleccione...</option>
        ${typeof optionsEstados === "function" ? optionsEstados(vals.idEstadoReserva ?? vals.estado ?? "") : ""}
      </select>
    </div>

    <div class="fg" style="grid-column: span 2; display: flex; flex-direction: column;">
      <label for="r-pago"><strong>Método de pago</strong></label>
      <select id="r-pago" class="input"
              style="padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
        <option value="">Seleccione...</option>
        ${typeof optionsPagos === "function" ? optionsPagos(vals.idMetodoPago ?? vals.metodoPago ?? "") : ""}
      </select>
    </div>

  </div>
  `;

  const readModal = () => {
  const fechaReserva = document.getElementById("r-fecha").value.trim();
  const idCliente    = document.getElementById("r-cliente").value.trim();
  const precio       = document.getElementById("r-precio").value.trim();
  const idEstado     = document.getElementById("r-estado").value.trim();
  const idMetodoPago = document.getElementById("r-pago").value.trim();

  if (!fechaReserva || !idCliente || !precio || !idEstado || !idMetodoPago) {
    Swal.showValidationMessage("Completa todos los campos obligatorios.");
    return false;
  }

  return {
    fechaReserva,
    idCliente,
    precioTotalReserva: parseFloat(precio),
    idEstadoReserva: idEstado,
    idMetodoPago
  };
  };

  async function createDialog(){
    const { value } = await Swal.fire({
    title:"Nueva Reserva",
    html: modalHtml(),
    focusConfirm:false, showCancelButton:true,
    confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
    customClass: { popup: "swal2-modern" },
    preConfirm: readModal,
    didOpen: async () => {
      // asegura catálogos cargados para los combos
      if (!CLIENTES?.length) await loadClientes();
      if (!ESTADOS?.length) await loadEstados();
      if (!PAGOS?.length)    await loadPagos();

      // repintar combos tras cargar catálogos
      const cliSel = document.getElementById("r-cliente");
      const estSel = document.getElementById("r-estado");
      const pagSel = document.getElementById("r-pago");

      if (cliSel) cliSel.innerHTML = `<option value="">Seleccione...</option>${optionsClientes()}`;
      if (estSel) estSel.innerHTML = `<option value="">Seleccione...</option>${optionsEstados()}`;
      if (pagSel) pagSel.innerHTML = `<option value="">Seleccione...</option>${optionsPagos()}`;
    }
  });
  return value || null;
  }

  async function editDialog(current){
    // asegura catálogos cargados para los combos
  await Promise.all([loadClientes(), loadEstados(), loadPagos()]);

  const vals = {
    fechaReserva:      current.fechaReserva ?? current.fecha ?? "",
    idCliente:         current.idCliente ?? current.cliente ?? "",
    precioTotalReserva: current.precioTotalReserva ?? current.precio ?? "",
    idEstadoReserva:   current.idEstadoReserva ?? current.estado ?? "",
    idMetodoPago:      current.idMetodoPago ?? current.metodoPago ?? ""
  };

  const { value } = await Swal.fire({
    title: `Editar Reserva ${vals.fechaReserva || ""}`,
    html: modalHtml(vals),
    focusConfirm: false, showCancelButton: true,
    confirmButtonText: "Guardar", cancelButtonText: "Cancelar",
    customClass: { popup: "swal2-modern" },
    preConfirm: readModal,
    didOpen: () => {
      // repintar combos con la opción seleccionada
      const cliSel = document.getElementById("r-cliente");
      const estSel = document.getElementById("r-estado");
      const pagSel = document.getElementById("r-pago");
      if (cliSel) cliSel.innerHTML = `<option value="">Seleccione...</option>${optionsClientes(vals.idCliente)}`;
      if (estSel) estSel.innerHTML = `<option value="">Seleccione...</option>${optionsEstados(vals.idEstadoReserva)}`;
      if (pagSel) pagSel.innerHTML = `<option value="">Seleccione...</option>${optionsPagos(vals.idMetodoPago)}`;
    }
  });

  return value || null;
  }

  // ------- CRUD -------
  async function loadReservas(){
    tbody.innerHTML = `<tr><td colspan="7">Cargando . . .</td></tr>`;
    try{
      const raw = await getReservas();
      DATA = normalizeList(raw);

      // asegúrate de tener catálogos para pintar nombres
      await Promise.all([loadClientes(), loadEstados(), loadPagos()]);

      renderTabla(DATA);
      contarEstados(DATA);
      applyFilters();
    }catch(e){
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="7">Error al cargar Reservas</td></tr>`;
      toast("error","Error cargando Reservas");
    }
  }

  btnNueva?.addEventListener("click", async () => {
    try{
      const payload = await createDialog();
      if (!payload) return;
      await createReservas(payload);
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

     if (btn.classList.contains("btn-view")){
    const t = tr.querySelectorAll("td");
    const fecha   = t[0]?.textContent.trim() || "";
    const cliente = t[1]?.textContent.trim() || "";
    const precio  = t[2]?.textContent.trim() || "";
    const estado  = t[3]?.textContent.trim() || "";
    const pago    = t[4]?.textContent.trim() || "";

    await Swal.fire({
      title: `Reserva ${id}`,
      html: `
        <div style="text-align:left">
          <p><b>Fecha de reserva:</b> ${fecha}</p>
          <p><b>Huésped principal:</b> ${cliente}</p>
          <p><b>Precio total:</b> ${precio}</p>
          <p><b>Estado:</b> ${estado}</p>
          <p><b>Método de pago:</b> ${pago}</p>
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
        const payload = await editDialog(current);
        if (!payload) return;

        await updateReservas(id, payload);
        toast("success","Reserva actualizada");
        await loadReservas();
      }catch(e){
        console.error(e);
        toast("error","No se pudo actualizar");
      }
      return;
    }

    if (btn.classList.contains("delete")){
      const numTxt = tr.querySelector("td")?.textContent.trim() || "la Reserva";
      const { isConfirmed } = await Swal.fire({
        title:"¿Eliminar Reserva?",
        text:`Se eliminará ${numTxt}. Esta acción no se puede deshacer.`,
        icon:"warning", showCancelButton:true,
        confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
      });
      if (!isConfirmed) return;

      try{
        await deleteReservas(id);
        toast("success","Reserva eliminada");
        await loadReservas();
      }catch(e){
        console.error(e);
        toast("error","No se pudo eliminar");
      }
    }
  });

  // ------- Init -------
  loadReservas();
});
