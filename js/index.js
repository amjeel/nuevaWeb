// Comentario: Este script maneja la lógica de inicio de sesión y validación.

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('loginMessage');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    // Comentario: Usuario y contraseña por defecto para el administrador.
    const DEFAULT_ADMIN_EMAIL = "AdrianaMontoya@finder.com";
    const DEFAULT_ADMIN_PASSWORD = "12345";

    // Comentario: Función para manejar el envío del formulario de inicio de sesión.
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita el envío por defecto del formulario.

        const email = emailInput.value;
        const password = passwordInput.value;

        // Comentario: Validación de credenciales.
        if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
            // Comentario: Guardar el estado de autenticación en LocalStorage.
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', 'admin'); // Suponemos que solo hay administradores por ahora.

            loginMessage.textContent = '¡Inicio de sesión exitoso! Redireccionando...';
            loginMessage.style.color = 'green';
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Redirige al dashboard.
            }, 1000);
        } else {
            loginMessage.textContent = 'Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.';
            loginMessage.style.color = 'red';
        }
    });

    // Comentario: Manejador para el enlace de "Olvidaste la contraseña?".
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Se ha enviado un enlace de recuperación de contraseña a tu correo. (Funcionalidad ficticia)');
        // En una aplicación real, aquí se implementaría una llamada a un backend para enviar el correo.
    });
});