document.addEventListener("DOMContentLoaded", () => {
    const tablaUsuarios = document.querySelector(".data-table tbody");
    const btnNuevoUsuario = document.querySelector(".back-button");

    // --- Modal ---
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3 id="modal-title">Nuevo Usuario</h3>
            <form id="usuarioForm">
                <input type="hidden" id="idUsuario">
                
                <label>Nombre:</label>
                <input type="text" id="nombre" required>

                <label>Email:</label>
                <input type="email" id="email" required>

                <label>Rol:</label>
                <select id="rol" required>
                    <option value="administrador">Administrador</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="limpieza">Limpieza</option>
                    <option value="mantenimiento">Mantenimiento</option>
                </select>

                <label>Estado:</label>
                <select id="estado" required>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>

                <button type="submit" class="btn-save">Guardar</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    const usuarioForm = modal.querySelector("#usuarioForm");
    const closeModalBtn = modal.querySelector(".close");

    // --- Abrir modal ---
    btnNuevoUsuario.addEventListener("click", () => {
        document.getElementById("modal-title").innerText = "Nuevo Usuario";
        usuarioForm.reset();
        document.getElementById("idUsuario").value = "";
        modal.style.display = "block";
    });

    // --- Cerrar modal ---
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // --- Cargar usuarios ---
    async function cargarUsuarios() {
        try {
            const usuarios = await getUsuarios();
            tablaUsuarios.innerHTML = "";

            if (!usuarios || usuarios.length === 0) {
                tablaUsuarios.innerHTML = '<tr><td colspan="6">Actualmente no hay usuarios</td></tr>';
                return;
            }

            usuarios.forEach(u => {
                const estadoBadge = u.estado === "activo"
                    ? `<span class="status-badge available">Activo</span>`
                    : `<span class="status-badge occupied">Inactivo</span>`;

                const fila = `
                    <tr>
                        <td class="user-info"><img src="img/default.png" class="user-avatar-small"> ${u.nombre}</td>
                        <td>${u.email}</td>
                        <td>${u.rol}</td>
                        <td>${estadoBadge}</td>
                        <td>${u.ultimoAcceso || "N/A"}</td>
                        <td>
                            <button class="btn-action btn-view" data-id="${u.idUsuario}"><i class="fas fa-eye"></i></button>
                            <button class="btn-action edit" data-id="${u.idUsuario}"><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete" data-id="${u.idUsuario}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
                tablaUsuarios.insertAdjacentHTML("beforeend", fila);
            });
        } catch (error) {
            console.error("Error cargando usuarios:", error);
            tablaUsuarios.innerHTML = '<tr><td colspan="6">Error al cargar los usuarios</td></tr>';
        }
    }

    // --- Guardar Usuario ---
    usuarioForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usuario = {
            nombre: document.getElementById("nombre").value,
            email: document.getElementById("email").value,
            rol: document.getElementById("rol").value,
            estado: document.getElementById("estado").value
        };

        const idUsuario = document.getElementById("idUsuario").value;

        try {
            if (idUsuario) {
                await updateUsuario(idUsuario, usuario);
            } else {
                await createUsuario(usuario);
            }
            modal.style.display = "none";
            cargarUsuarios();
        } catch (error) {
            console.error("Error guardando usuario:", error);
        }
    });

    // --- Editar y eliminar usuarios ---
    tablaUsuarios.addEventListener("click", async (e) => {
        const idUsuario = e.target.closest("button")?.dataset.idUsuario;
        if (!idUsuario) return;

        if (e.target.closest(".edit")) {
            const usuarios = await getUsuarios();
            const usuario = usuarios.find(u => u.idUsuario == idUsuario);
            if (!usuario) return;

            document.getElementById("modal-title").innerText = "Editar Usuario";
            document.getElementById("idUsuario").value = usuario.idUsuario;
            document.getElementById("nombre").value = usuario.nombre;
            document.getElementById("email").value = usuario.email;
            document.getElementById("rol").value = usuario.rol;
            document.getElementById("estado").value = usuario.estado;

            modal.style.display = "block";
        }

        if (e.target.closest(".delete")) {
            if (confirm("¿Seguro que deseas eliminar este usuario?")) {
                try {
                    await deleteUsuario(idUsuario);
                    cargarUsuarios();
                } catch (error) {
                    console.error("Error eliminando usuario:", error);
                }
            }
        }
    });

    // Inicializar carga
    cargarUsuarios();
});