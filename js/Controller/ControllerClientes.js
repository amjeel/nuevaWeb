
// js/Controller/ControllerClientes.js
import {
  getClientes,
  createClientes,
  updateClientes,
  deleteClientes,
} from "../Services/ServiceClientes.js";

/* ------------------------ SweetAlert ------------------------ */
async function ensureSwal() {
  if (window.Swal) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
}
function injectSwalStyles() {
  if (document.getElementById("swal-modern-clients")) return;
  const css = `
    .swal2-modern { border-radius: 16px !important; padding: 22px !important; }
    .swal2-modern .form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:left; }
    .swal2-modern .form-grid .full{ grid-column:1/-1; }
    .swal2-modern label{ font-size:13px;font-weight:600;color:#333;margin-bottom:6px; }
    .swal2-modern .input,.swal2-modern .select{
      width:100%;box-sizing:border-box;border:1px solid #d9dce3;border-radius:10px;padding:8px 12px;font-size:14px;background:#fff;
    }
    .swal2-styled.swal2-confirm{ background:#16a34a !important;border-radius:10px !important;font-weight:600;padding:10px 18px !important; }
    .swal2-styled.swal2-cancel{ background:#e5e7eb !important;color:#111827 !important;border-radius:10px !important;font-weight:600;padding:10px 18px !important; }
  `;
  const st = document.createElement("style");
  st.id = "swal-modern-clients"; st.textContent = css; document.head.appendChild(st);
}
const norm = s => (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const toast = (icon="success", title="") =>
  Swal.fire({ toast:true, position:"bottom-end", icon, title, timer:1600, showConfirmButton:false });
const normalizeList = (json) => {
  if (Array.isArray(json)) return json;
  if (json?.content) return json.content;
  if (json?.data)    return json.data;
  return [];
};

/* --------- 'Tipo de cliente' solo LOCAL (localStorage) --------- */
const TKEY = "clientes_tipos_v1";
let TIPOS = {};
function loadTipos(){ try{ TIPOS = JSON.parse(localStorage.getItem(TKEY) || "{}") || {}; }catch{ TIPOS = {}; } }
function saveTipos(){ try{ localStorage.setItem(TKEY, JSON.stringify(TIPOS)); }catch{} }
function getTipoLocal(id){ return TIPOS?.[id] ?? "-"; }
function setTipoLocal(id, tipo){ if(!id) return; TIPOS[id] = tipo; saveTipos(); }
function removeTipoLocal(id){ if (id in TIPOS){ delete TIPOS[id]; saveTipos(); } }

/* ------------------ helpers de validación ------------------ */
// DUI a ########-#
function toDUICanonical(s) {
  const digits = String(s || "").replace(/\D/g, "");
  if (digits.length !== 9) return null;
  return `${digits.slice(0, 8)}-${digits[8]}`;
}
function isISODateYYYYMMDD(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}
function notFuture(s) {
  const today = new Date().toISOString().slice(0,10);
  return String(s) <= today;
}

/* --------------------------- Modal (crear/editar) -------------------------- */
// OJO: ya NO pedimos idUsuario
async function openClienteDialog(preset = null) {
  const v = preset || {};
  const esc = x => String(x ?? "").replaceAll('"','&quot;');

  const html = `
    <div class="form-grid">
      <div>
        <label>Nombre(s) *</label>
        <input id="c-nombres" class="input" placeholder="Ana María"
               value="${esc(v.nombreCliente ?? v.nombre)}">
      </div>
      <div>
        <label>Apellido(s) *</label>
        <input id="c-apellidos" class="input" placeholder="Pérez"
               value="${esc(v.apellidoCliente ?? v.apellido)}">
      </div>
      <div>
        <label>DUI *</label>
        <input id="c-dui" class="input" placeholder="########-#" maxlength="10"
               value="${esc(v.duiCliente ?? v.dui)}">
      </div>
      <div>
        <label>Nacimiento *</label>
        <input id="c-nac" class="input" type="date"
               value="${esc(v.nacimientoCliente ?? v.fechaNacimiento)}">
      </div>
      <div>
        <label>Nombre de usuario (opcional)</label>
        <input id="c-user" class="input" placeholder="alias"
               value="${esc(v.nombreUsuario)}">
      </div>

      <div class="full">
        <label>Tipo de cliente (solo local)</label>
        <select id="c-tipo" class="select">
          <option value="">Seleccione...</option>
          <option value="Regular" ${norm(v.tipoLocal)==="regular"?"selected":""}>Regular</option>
          <option value="VIP"     ${norm(v.tipoLocal)==="vip"?"selected":""}>VIP</option>
          <option value="Empresa" ${norm(v.tipoLocal)==="empresa"?"selected":""}>Empresa</option>
        </select>
      </div>
    </div>
  `;

  const { value } = await Swal.fire({
    title: v.idCliente ? "Editar Cliente" : "Nuevo Cliente",
    html, width: 720,
    customClass: { popup: "swal2-modern" },
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const nombres   = document.getElementById("c-nombres").value.trim();
      const apellidos = document.getElementById("c-apellidos").value.trim();
      const duiRaw    = document.getElementById("c-dui").value.trim();
      const nac       = document.getElementById("c-nac").value;    // yyyy-MM-dd
      const nomUser   = document.getElementById("c-user").value.trim() || null;
      const tipoLocal = document.getElementById("c-tipo").value;

      if (!nombres || !apellidos || !duiRaw || !nac) {
        Swal.showValidationMessage("Todos los campos con * son obligatorios.");
        return false;
      }
      const duiCanon = toDUICanonical(duiRaw);
      if (!duiCanon) {
        Swal.showValidationMessage("DUI inválido. Usa ########-# (8 dígitos, guion, 1 dígito).");
        return false;
      }
      if (!isISODateYYYYMMDD(nac) || !notFuture(nac)) {
        Swal.showValidationMessage("Fecha inválida. Usa YYYY-MM-DD y no futura.");
        return false;
      }
      if (!tipoLocal) {
        Swal.showValidationMessage("Selecciona el tipo (local).");
        return false;
      }

      // Payload para la API (sin idUsuario)
      return {
        nombreCliente:     nombres,
        apellidoCliente:   apellidos,
        duiCliente:        duiCanon,
        nacimientoCliente: nac,
        nombreUsuario:     nomUser,
        tipoLocal, // solo local
      };
    }
  });

  return value || null;
}

/* -------------------------------- Controller -------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await ensureSwal(); injectSwalStyles(); loadTipos();

  // DOM
  const card       = document.querySelector(".section-card");
  const theadCells = card?.querySelectorAll(".data-table thead th");
  // Renombrar cabeceras si tu HTML tenía otras
  if (theadCells && theadCells.length >= 4) {
    theadCells[1].textContent = "DUI";
    theadCells[2].textContent = "Nacimiento";
    theadCells[3].textContent = "Tipo de Cliente (local)";
  }

  const tbody        = document.querySelector(".data-table tbody");
  const btnNueva     = document.querySelector(".btn-abrir")
                    || document.getElementById("btn-abrir")
                    || document.querySelector(".back-button");
  const searchInput  = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const btnExport    = document.querySelector(".btn-export");

  // Estado
  let DATA = [];

  // Map API -> UI (inyectando tipo local)
  const mapCliente = (r) => {
    const id = r.idCliente ?? r.id ?? r.clienteId ?? "";
    const nombre = r.nombreCliente ?? r.nombre ?? "";
    const apellido = r.apellidoCliente ?? r.apellido ?? "";
    const full = [nombre, apellido].filter(Boolean).join(" ");
    return {
      id,
      nombreCompleto: full || "-",
      dui:  r.duiCliente ?? r.dui ?? "-",
      nac:  r.nacimientoCliente ?? r.fechaNacimiento ?? "-",
      tipo: getTipoLocal(id), // local
      raw:  r
    };
  };

  function renderTabla(list) {
    tbody.innerHTML = "";
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5">Actualmente no hay clientes</td></tr>`;
      return;
    }
    list.forEach(c => {
      const tr = document.createElement("tr");
      tr.dataset.idCliente = c.id;
      tr.innerHTML = `
        <td>${c.nombreCompleto}</td>
        <td>${c.dui}</td>
        <td>${c.nac}</td>
        <td>${c.tipo}</td>
        <td>
          <button class="btn-action btn-view" title="Ver"><i class="fas fa-eye"></i></button>
          <button class="btn-action edit"     title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-action delete"   title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function loadClientes() {
    tbody.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
    try {
      const raw = await getClientes({ page: 0, size: 100 });
      DATA = normalizeList(raw).map(mapCliente);
      renderTabla(DATA);
      applyFilters();
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="5">Error al cargar clientes</td></tr>`;
      toast("error", String(e.message || e));
    }
  }

  function applyFilters() {
    const q = norm(searchInput?.value || "");
    const t = norm(filterSelect?.value || ""); // tipo local
    Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const nombre = norm(tds[0]?.textContent || "");
      const dui    = norm(tds[1]?.textContent || "");
      const tipo   = norm(tds[3]?.textContent || "");
      const okQ = !q || nombre.includes(q) || dui.includes(q);
      const okT = !t || tipo.includes(t);
      tr.style.display = (okQ && okT) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  btnExport?.addEventListener("click", () => {
    const rows = Array.from(tbody.querySelectorAll("tr")).filter(tr => tr.style.display !== "none");
    if (!rows.length) return toast("info", "No hay datos para exportar");
    const headers = ["Nombre completo","DUI","Nacimiento","Tipo (local)"];
    const csv = [headers.join(",")];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    rows.forEach(tr => {
      const t = tr.querySelectorAll("td");
      csv.push([esc(t[0].textContent.trim()), t[1].textContent.trim(), t[2].textContent.trim(), t[3].textContent.trim()].join(","));
    });
    const blob = new Blob([csv.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href:url, download:`clientes_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("success","CSV exportado");
  });

  // Crear
  btnNueva?.addEventListener("click", async (e) => {
    e?.preventDefault?.();
    const form = await openClienteDialog(null);
    if (!form) return;

    const { tipoLocal, ...dto } = form; // API sin tipoLocal
    try {
      const created = await createClientes(dto);
      const newId = created?.idCliente ?? created?.id ?? created?.clienteId;
      if (newId) setTipoLocal(newId, tipoLocal);
      await loadClientes();
      toast("success","Cliente creado");
    } catch (err) {
      console.error(err);
      toast("error", String(err.message || err));
    }
  });

  // Acciones por fila
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const tr = btn.closest("tr"); const id = tr?.dataset.idCliente;
    if (!id) return;

    if (btn.classList.contains("btn-view")) {
      const t = tr.querySelectorAll("td");
      await Swal.fire({
        title: t[0].textContent.trim(),
        html: `<div style="text-align:left">
                <p><b>DUI:</b> ${t[1].textContent}</p>
                <p><b>Nacimiento:</b> ${t[2].textContent}</p>
                <p><b>Tipo (local):</b> ${t[3].textContent}</p>
               </div>`,
        icon: "info"
      });
      return;
    }

    if (btn.classList.contains("edit")) {
      try {
        const raw = DATA.find(x => String(x.id) === String(id))?.raw;
        if (!raw) return;
        const payload = await openClienteDialog({
          idCliente: id,
          nombreCliente: raw.nombreCliente,
          apellidoCliente: raw.apellidoCliente,
          duiCliente: raw.duiCliente,
          nacimientoCliente: raw.nacimientoCliente, // yyyy-MM-dd
          nombreUsuario: raw.nombreUsuario,
          tipoLocal: getTipoLocal(id),
        });
        if (!payload) return;

        const { tipoLocal, ...dto } = payload;
        await updateClientes(id, dto); // API
        setTipoLocal(id, tipoLocal);   // LOCAL
        await loadClientes();
        toast("success","Cliente actualizado");
      } catch (err) {
        console.error(err);
        toast("error", String(err.message || err));
      }
      return;
    }

    if (btn.classList.contains("delete")) {
      const nameTxt = tr.querySelector("td")?.textContent.trim() || "el cliente";
      const { isConfirmed } = await Swal.fire({
        title: "¿Eliminar cliente?",
        text: `Se eliminará ${nameTxt}. Esta acción no se puede deshacer.`,
        icon: "warning", showCancelButton: true,
        confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar"
      });
      if (!isConfirmed) return;

      try {
        await deleteClientes(id);
        removeTipoLocal(id);
        await loadClientes();
        toast("success","Cliente eliminado");
      } catch (err) {
        console.error(err);
        toast("error", String(err.message || err));
      }
    }
  });

  await loadClientes();
});
