// Comentario: Este script maneja la lógica para la creación de nuevas cuentas.

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupMessage = document.getElementById('signupMessage');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita el envío por defecto del formulario.

        const fullName = fullNameInput.value;
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Comentario: Validaciones básicas en el lado del cliente.
        if (password !== confirmPassword) {
            signupMessage.textContent = 'Las contraseñas no coinciden. Por favor, verifica.';
            signupMessage.style.color = 'red';
            return;
        }

        if (password.length < 5) { // Ejemplo de validación de longitud mínima
            signupMessage.textContent = 'La contraseña debe tener al menos 5 caracteres.';
            signupMessage.style.color = 'red';
            return;
        }


        signupMessage.textContent = '¡Cuenta creada exitosamente! Redireccionando al inicio de sesión...';
        signupMessage.style.color = 'green';
        setTimeout(() => {
            window.location.href = 'index.html'; // Redirige al login después de crear la cuenta.
        }, 2000);

        // Limpiar campos del formulario
        signupForm.reset();
    });
});