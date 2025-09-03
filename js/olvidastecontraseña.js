// Comentario: Este script maneja la lógica para la recuperación de contraseña.

document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    const recoveryMessage = document.getElementById('recoveryMessage');

    forgotPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita el envío por defecto del formulario.

        const email = recoveryEmailInput.value;

        // Comentario: En una aplicación real, aquí se haría una llamada a un backend.
        // El backend verificaría si el correo existe y enviaría un correo con un enlace único de restablecimiento.
        // Para este ejemplo, solo simulamos el envío.

        if (email) {
            recoveryMessage.textContent = `Si tu correo (${email}) está registrado, recibirás un enlace de restablecimiento.`;
            recoveryMessage.style.color = 'green';
            // Simular un retardo para la "acción" de envío
            setTimeout(() => {
                // Opcional: Redirigir de vuelta al login después de un tiempo
                // window.location.href = 'index.html';
            }, 3000);
        } else {
            recoveryMessage.textContent = 'Por favor, ingresa tu correo electrónico.';
            recoveryMessage.style.color = 'red';
        }
    });
});