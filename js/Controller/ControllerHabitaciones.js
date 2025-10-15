// js/Controller/ControllerHabitaciones.js
import {
  getHabitaciones,
  createHabitaciones,
  updateHabitaciones,
  deleteHabitaciones
} from "../Services/ServiceHabitaciones.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector(".data-table tbody");
  const btnNueva = document.querySelector(".back-button");
  const searchInput = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");

  const $countAvail = document.getElementById("countAvailable");
  const $countOcc = document.getElementById("countOccupied");
  const $countClean = document.getElementById("countCleaning");
  const $countMaint = document.getElementById("countMaintenance");

  let DATA = [];

  const toast = (icon = "success", title = "") =>
    Swal.fire({
      toast: true, position: "bottom-end", icon, title,
      timer: 1600, showConfirmButton: false, timerProgressBar: true
    });

  const norm = (s) => (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const estadoNombre = (val) => {
    const s = norm(val);
    if (s.includes("Disponible")) return "Disponible";
    if (s.includes("Ocupada")) return "Ocupada";
    if (s.includes("Reservada")) return "Reservada";
    if (s.includes("En mantenimiento")) return "En Mantenimiento";
    return val || "-";
  };

  const estadoClase = (val) => {
    const t = estadoNombre(val);
    return t === "Disponible" ? "available" :
           t === "Ocupada" ? "occupied" :
           t === "Reservada" ? "Reservada" :
           t === "En Mantenimiento" ? "maintenance" :
           "other";
  };

  const renderRow = (h) => {
    const tr = document.createElement("tr");
    tr.dataset.idHabitacion = h.idHabitacion;
    const imagen = h.imagenHabitacion && h.imagenHabitacion.trim() !== "" ? h.imagenHabitacion : "img/No disponible.png";
    tr.innerHTML = `
      <td>${h.numeroHabitacion}</td>
      <td>${h.nombreTipoHabitacion}</td>
      <td>${h.precioHabitacion}</td>
      <td><span class="status-badge ${estadoClase(h.NombreEstadoHabitacion)}">${estadoNombre(h.nombreEstadoHabitacion)}</span></td>
      <td><img src="${imagen}" alt="Imagen" style="width: 50px; height: auto; border-radius: 6px;"></td>
      <td>
        <button class="btn-action edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete"><i class="fas fa-trash"></i></button>
      </td>
    `;
    return tr;
  };

  const renderTabla = (lista) => {
    tbody.innerHTML = "";
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="7">No hay habitaciones registradas.</td></tr>`;
      return;
    }
    lista.forEach(h => tbody.appendChild(renderRow(h)));
  };

  const contarEstados = (lista) => {
    let d = 0, o = 0, l = 0, m = 0;
    for (const h of lista) {
      const e = estadoNombre(h.nombreEstadoHabitacion);
      if (e === "Disponible") d++;
      else if (e === "Ocupada") o++;
      else if (e === "Reservada") l++;
      else if (e === "En Mantenimiento") m++;
    }
    $countAvail.textContent = d;
    $countOcc.textContent = o;
    $countClean.textContent = l;
    $countMaint.textContent = m;
  };

  function applyFilters() {
    const q = norm(searchInput?.value || "");
    const f = norm(filterSelect?.value || "");

    Array.from(tbody.querySelectorAll("tr")).forEach(tr => {
      const tds = tr.querySelectorAll("td");
      const num = norm(tds[0]?.textContent || "");
      const tipo = norm(tds[1]?.textContent || "");
      const estado = norm(tds[3]?.textContent || "");
      const okQ = !q || num.includes(q) || tipo.includes(q);
      const okF = !f || estado.includes(f);
      tr.style.display = (okQ && okF) ? "" : "none";
    });
  }

  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);

  async function loadHabitaciones() {
    tbody.innerHTML = `<tr><td colspan="7">Cargando habitaciones...</td></tr>`;
    try {
      const raw = await getHabitaciones();
      DATA = Array.isArray(raw) ? raw : raw.content || [];
      renderTabla(DATA);
      contarEstados(DATA);
      applyFilters();
    } catch (e) {
      console.error("Error al cargar habitaciones:", e);
      tbody.innerHTML = `<tr><td colspan="7">Error al cargar datos.</td></tr>`;
      toast("error", "Error al cargar habitaciones");
    }
  }

  // MODAL ---------------------
  function modalHtml(vals = {}) {
    return `
      <div class="swal2-grid">
        <input id="h-numero" class="swal2-input" type="number" min="1" placeholder="Número" value="${vals.numeroHabitacion ?? ""}">
        <input id="h-tipo" class="swal2-input" placeholder="Tipo" value="${vals.tipoHabitacion ?? ""}">
        <input id="h-precio" class="swal2-input" type="number" placeholder="Precio" value="${vals.precioHabitacion ?? ""}">
        <input id="h-estado" class="swal2-input" placeholder="Estado" value="${vals.estadoHabitacion ?? ""}">
        <input id="h-imagen" class="swal2-input" placeholder="URL de Imagen" value="${vals.imagenHabitacion ?? ""}">
      </div>
    `;
  }

  function readModal() {
    const numeroHabitacion = document.getElementById("h-numero").value.trim();
    const tipoHabitacion = document.getElementById("h-tipo").value.trim();
    const precioHabitacion = document.getElementById("h-precio").value.trim();
    const estadoHabitacion = document.getElementById("h-estado").value.trim();
    const imagenHabitacion = document.getElementById("h-imagen").value.trim();

    if (!numeroHabitacion || !tipoHabitacion || !precioHabitacion || !estadoHabitacion || !imagenHabitacion) {
      Swal.showValidationMessage("Completa todos los campos");
      return false;
    }

    return {
      numeroHabitacion,
      tipoHabitacion,
      precioHabitacion,
      estadoHabitacion,
      imagenHabitacion,
      idHotel: null  // ← ← ← ESTE ES EL CAMPO QUE ME PEDISTE
    };
  }

  async function createDialog() {
    const { value } = await Swal.fire({
      title: "Nueva habitación",
      html: modalHtml(),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      preConfirm: readModal
    });
    return value || null;
  }

  async function editDialog(current) {
    const { value } = await Swal.fire({
      title: `Editar habitación ${current.numeroHabitacion}`,
      html: modalHtml(current),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      preConfirm: readModal
    });
    return value || null;
  }

  btnNueva?.addEventListener("click", async () => {
    const payload = await createDialog();
    if (!payload) return;
    try {
      await createHabitaciones(payload);
      toast("success", "Habitación creada");
      await loadHabitaciones();
    } catch (e) {
      console.error(e);
      toast("error", "Error al crear habitación");
    }
  });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const tr = e.target.closest("tr");
    const id = tr?.dataset.idHabitacion;
    if (!id) return;

    if (btn.classList.contains("edit")) {
      const current = DATA.find(x => String(x.idHabitacion) === id);
      if (!current) return;
      const payload = await editDialog(current);
      if (!payload) return;
      try {
        await updateHabitaciones(id, payload);
        toast("success", "Habitación actualizada");
        await loadHabitaciones();
      } catch (e) {
        console.error(e);
        toast("error", "Error al actualizar habitación");
      }
    }

    if (btn.classList.contains("delete")) {
      const { isConfirmed } = await Swal.fire({
        title: "¿Eliminar habitación?",
        text: `Se eliminará la habitación ${tr.querySelector("td")?.textContent}.`,
        icon: "warning", showCancelButton: true
      });
      if (!isConfirmed) return;
      try {
        await deleteHabitaciones(id);
        toast("success", "Habitación eliminada");
        await loadHabitaciones();
      } catch (e) {
        console.error(e);
        toast("error", "Error al eliminar");
      }
    }
  });

  loadHabitaciones();
});
