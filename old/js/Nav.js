/* =============================================================
   GLOBAL.JS
   Comportamiento reutilizable en CUALQUIER página del sitio:
   menú hamburguesa, animaciones de aparición al hacer scroll
   (.fade-in) y sombra del nav al hacer scroll.
   ============================================================= */

// ===== MENÚ HAMBURGUESA (mobile) =====
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (links.style.display === 'flex') {
    links.style.display = '';
  } else {
    links.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:72px;left:0;right:0;background:var(--white);padding:1rem 8%;border-bottom:3px solid var(--green);gap:1rem;z-index:999;';
  }
}

// ===== ANIMACIONES AL HACER SCROLL (.fade-in) =====
const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach((el) => fadeInObserver.observe(el));

// ===== SOMBRA DEL NAV AL HACER SCROLL =====
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.12)';
  } else {
    nav.style.boxShadow = '0 4px 20px rgba(163,192,55,0.15)';
  }
});