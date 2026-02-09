const menuToggle = document.getElementById("menu-toggle");
const menuPopup = document.getElementById("menu-popup");

menuToggle.addEventListener("click", () => {
  const isActive = menuPopup.classList.toggle("active");
  
  // Actualizar aria-expanded para accesibilidad
  menuToggle.setAttribute("aria-expanded", isActive);
  menuToggle.textContent = isActive ? "✕" : "☰";
  
  // Actualizar aria-label
  menuToggle.setAttribute("aria-label", isActive ? "Cerrar menú de navegación" : "Abrir menú de navegación");
  
  // Gestionar foco para accesibilidad
  if (isActive) {
    // Enfocar el primer enlace del menú cuando se abre
    const firstLink = menuPopup.querySelector("a");
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }
});

// Cerrar al hacer clic fuera o en un enlace
document.addEventListener("click", (e) => {
  if (
    menuPopup.classList.contains("active") &&
    !menuPopup.contains(e.target) &&
    e.target !== menuToggle
  ) {
    menuPopup.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
    menuToggle.textContent = "☰";
  }
});

// Cerrar al hacer clic en un enlace dentro del popup
menuPopup.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    menuPopup.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
    menuToggle.textContent = "☰";
  });
});

// Soporte de teclado: cerrar con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuPopup.classList.contains("active")) {
    menuPopup.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
    menuToggle.textContent = "☰";
    menuToggle.focus(); // Devolver foco al botón
  }
});

// Trap focus dentro del menú cuando está abierto
menuPopup.addEventListener("keydown", (e) => {
  if (!menuPopup.classList.contains("active")) return;
  
  const focusableElements = menuPopup.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (e.key === "Tab") {
    if (e.shiftKey) {
      // Tab + Shift: ir hacia atrás
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: ir hacia adelante
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
});
