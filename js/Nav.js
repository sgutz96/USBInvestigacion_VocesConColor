const menuToggle = document.getElementById("menu-toggle");
const menuPopup = document.getElementById("menu-popup");

menuToggle.addEventListener("click", () => {
  const isActive = menuPopup.classList.toggle("active");
  menuToggle.textContent = isActive ? "✕" : "☰";
});

// Cerrar al hacer clic fuera o en un enlace
document.addEventListener("click", (e) => {
  if (
    menuPopup.classList.contains("active") &&
    !menuPopup.contains(e.target) &&
    e.target !== menuToggle
  ) {
    menuPopup.classList.remove("active");
    menuToggle.textContent = "☰";
  }
});

// 🔹 Cerrar al hacer clic en un enlace dentro del popup
document.querySelectorAll(".menu-popup").forEach(link => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("open");
    menuPopup.classList.remove("active");
  });
});

menuPopup.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    menuPopup.classList.remove("active");
    menuToggle.textContent = "☰";
  });
});
