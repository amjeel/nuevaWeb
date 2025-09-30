// js/Controller/ControllerClientes.js
import {
  getClientes,
  createClientes,
  updateClientes,
  deleteClientes,
} from "../Services/ServiceClientes.js";

document.addEventListener("DOMContentLoaded", () => {
  const tbody        = document.querySelector(".data-table tbody");
  const btnNueva     = document.querySelector(".back-button");
  const searchInput  = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const btnExport    = document.querySelector(".btn-export");

  // --- Config API ---
  const API_URL = "http://localhost:8080/api";
  const ENDPOINT_USUARIOS = `${API_URL}/consultarUsuarios`;
  
  let USUARIOS = []; // [{idUsuarios}]


  //Estado Local
  let DATA = [];

    // ------- Utils -------
    const norm = (s) => (s ?? "").toString()
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");


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

  async function loadUsuarios(){
  try{
    const res = await fetch(ENDPOINT_USUARIOS);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    USUARIOS = normalizeList(await res.json());
  }catch(e){
    console.error("Error cargando usuarios:", e);
    USUARIOS = [];
  }
}

  const optionsUsuarios = (selectedId=null) =>
  USUARIOS.map(x => {
    const id   = x.idUsuario ?? x.id ?? "";
    const name = x.nombreUsuario ?? x.nameUser ?? "";
    const sel  = String(id) === String(selectedId) ? "selected" : "";
    return `<option value="${id}" ${sel}>${name}</option>`;
  }).join("");


const userNameById = (id) => {
  const u = USUARIOS.find(x => String(x.idUsuario ?? x.id) === String(id));
  return u?.nombreUsuario ?? u?.nameUser ?? "-";
};

  // ------- Render -------
  const renderRow = (h) => {
    const id    = h.idCliente ?? h.id ?? "";
    const nom   = h.nombreCliente ?? h.nombre ?? "";
    const apell  = h.apellidoCliente ?? h.apellido ?? "";
    const dui   = h.duiCliente ?? h.duiC ?? "";
    const fechaNa   = h.nacimientoCliente ?? h.nacimiento ?? "";
    const idUsuario = h.idUsuario ?? h.userId ?? "";
    const userName  = h.nombreUsuario ?? h.nameUser ?? (idUsuario ? userNameById(idUsuario) : "-");

    const tr = document.createElement("tr");
    tr.dataset.idCliente = id;
    tr.innerHTML = `
      <td class="customer-name">${nom}</td>
      <td>${apell}</td>
      <td>${dui}</td>
      <td>${fechaNa}</td>
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
      tbody.innerHTML = `<tr><td colspan="7">Actualmente no hay Cliente</td></tr>`;
      return;
    }
    lista.forEach(h => tbody.appendChild(renderRow(h)));
  };


  // ------- Filtros / búsqueda -------
  function applyFilters(){
    const q = norm(searchInput?.value || "");
    const f = norm(filterSelect?.value || "all");
  
    Array.from(tbody.querySelectorAll("tr")).forEach(tr=>{
      const tds = tr.querySelectorAll("td");
      const nombre     = norm(tds[0]?.textContent || "");
      const apellido   = norm(tds[1]?.textContent || "");
      const dui        = norm(tds[2]?.textContent || "");
      const nacimiento = norm(tds[3]?.textContent || "");
  
      const campos = (f === "nombre")     ? [nombre]
                   : (f === "apellido")   ? [apellido]
                   : (f === "dui")        ? [dui]
                   : (f === "nacimiento") ? [nacimiento]
                   : [nombre, apellido, dui, nacimiento];
  
      const okQ = !q || campos.some(txt => txt.includes(q));
      const okF = true; // no hay filtro extra aparte del campo elegido
  
      tr.style.display = (okQ && okF) ? "" : "none";
    });
  }
  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);



   // ------- Modal (SweetAlert2) -------
   const modalHtml = (vals = {}) => `
   <div class="swal2-grid compact" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">
     <div class="fg">
       <label>Nombre del Cliente</label>
       <input id="Name-cliente" class="input" value="${vals.nombre ?? ""}">
     </div>

     <div class="fg">
       <label>Apellido</label>
       <input id="lastName-cliente" class="input" value="${vals.apellido ?? ""}">
     </div>

     <div class="fg">
     <label>DUI</label>
     <input id="c-dui" 
         class="input" 
         type="text" 
         placeholder="12345678-9" 
         pattern="^\d{8}-\d{1}$" 
         title="El DUI debe tener el formato ########-#"
         value="${vals.dui ?? ""}" 
                     required>
                     </div>
      
      <div class="fg">
  <label>Fecha de nacimiento</label>
  <input id="c-fechaNac" 
         class="input" 
         type="date" 
         max="2007-12-31" 
         min="1925-01-01" 
         value="${vals.nacimiento ?? ""}" 
         required
         title="Debe ser una fecha válida y mayor de 18 años">

         <div class="fg">
  <label>Usuario</label>
  <select id="c-usuario" class="input">
    <option value="">Seleccione...</option>
    ${optionsUsuarios(vals.idUsuario)}
  </select>
</div>
</div>
   </div>
 `;

 const readModal = () => {
  const nom   = document.getElementById("Name-cliente").value.trim();
  const apell  = document.getElementById("lastName-cliente").value.trim();
  const dui   = document.getElementById("c-dui").value.trim();
  const fechaNa  = document.getElementById("c-fechaNac").value.trim();
  const idUsuarioSel = document.getElementById("c-usuario")?.value || "";
  if (!idUsuarioSel) { Swal.showValidationMessage("Selecciona un usuario."); return false; }


  if (!nom || !apell || !dui || !fechaNa) {
    Swal.showValidationMessage("Completa todos los campos obligatorios.");
    return false;
  }
  return {
    nombreCliente: nom,
    apellidoCliente: apell,
    duiCliente: dui,
    nacimientoCliente: fechaNa,
    idUsuario: idUsuarioSel
  };
};

async function createDialog(){
  const { value } = await Swal.fire({
    title:"Nuevo Cliente",
    html: modalHtml(),
    focusConfirm:false, showCancelButton:true,
    confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
    customClass: { popup: "swal2-modern" },
    preConfirm: readModal,
    didOpen: async () => {
      if (!USUARIOS.length) await loadUsuarios();
      const uSel = document.getElementById("c-usuario");
      if (uSel) {
        uSel.innerHTML = `<option value="">Seleccione...</option>${optionsUsuarios()}`;
      }
    }
  });
  return value || null;
}

async function editDialog(current){
  const vals = {
    nombre:     current.nombreCliente ?? "",
    apellido:   current.apellidoCliente ?? "",
    dui:        current.duiCliente ?? "",
    nacimiento: current.nacimientoCliente ?? "",
    idUsuario:  current.idUsuario ?? ""
  };

  const { value } = await Swal.fire({
    title:`Editar Cliente ${vals.nombre || ""}`,
    html: modalHtml(vals),
    focusConfirm:false, showCancelButton:true,
    confirmButtonText:"Guardar", cancelButtonText:"Cancelar",
    customClass: { popup: "swal2-modern" },
    preConfirm: readModal,
    didOpen: async () => {
      if (!USUARIOS.length) await loadUsuarios();
      const uSel = document.getElementById("c-usuario");
      if (uSel) {
        uSel.innerHTML = `<option value="">Seleccione...</option>${optionsUsuarios(vals.idUsuario)}`;
      }
    }
  });

  return value || null;
}



 // ------- CRUD -------
 async function loadClientes(){
  tbody.innerHTML = `<tr><td colspan="5">Cargando . . .</td></tr>`;
  try{
    const raw = await getClientes();
    DATA = normalizeList(raw);

    renderTabla(DATA);
    applyFilters();
  }catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="5">Error al cargar Los Clientes</td></tr>`;
    toast("error","Error cargando Clientes");
  }
}

btnNueva?.addEventListener("click", async () => {
  try{
    const payload = await createDialog();
    if (!payload) return;
    await createClientes(payload);
    toast("success","Cliente creada");
    await loadClientes();
  }catch(e){
    console.error(e);
    toast("error","No se pudo crear");
  }
});

tbody.addEventListener("click", async (e)=>{
  const btn = e.target.closest("button");
  if (!btn) return;

  const tr = e.target.closest("tr");
  const id = tr?.dataset.idCliente;
  if (!id) return;

  if (btn.classList.contains("btn-view")){
    const t = tr.querySelectorAll("td");
    await Swal.fire({
      title: `Cli. ${t[0].textContent.trim()} • ${t[1].textContent.trim()}`,
      html: `
        <div style="text-align:left">
          <p><b>Nombre:</b> ${t[2].textContent}</p>
          <p><b>Apellido:</b> ${t[3].textContent}</p>
          <p><b>Dui:</b> ${t[4].textContent}</p>
          <p><b>Fecha de nacimiento:</b> ${t[5].textContent}</p>
        </div>
      `,
      icon:"info"
    });
    return;
  }

  if (btn.classList.contains("edit")){
    try{
      const current = DATA.find(x => String(x.idCliente ?? x.id) === String(id));
      if (!current) return;
      const payload = await editDialog(current);
      if (!payload) return;

      await updateClientes(id, payload);
      toast("success","Cliente actualizado");
      await loadClientes();
    }catch(e){
      console.error(e);
      toast("error","No se pudo actualizar");
    }
    return;
  }

  if (btn.classList.contains("delete")){
    const numTxt = tr.querySelector("td")?.textContent.trim() || "el Cliente";
    const { isConfirmed } = await Swal.fire({
      title:"¿Eliminar cliente?",
      text:`Se eliminará ${numTxt}. Esta acción no se puede deshacer.`,
      icon:"warning", showCancelButton:true,
      confirmButtonText:"Sí, eliminar", cancelButtonText:"Cancelar"
    });
    if (!isConfirmed) return;

    try{
      await deleteClientes(id);
      toast("success","Cliente eliminada");
      await loadClientes();
    }catch(e){
      console.error(e);
      toast("error","No se pudo eliminar");
    }
  }
});

// ------- Init -------
Promise.all([loadUsuarios(), loadClientes()]);



});