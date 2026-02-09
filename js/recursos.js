// Inicialización de Swiper para Recursos
const recursosSwiper = new Swiper('.recursosSwiper', {
  loop: true,
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 1,
  spaceBetween: 30,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    // Mejorar accesibilidad de la paginación
    bulletClass: 'swiper-pagination-bullet',
    bulletActiveClass: 'swiper-pagination-bullet-active',
    renderBullet: function (index, className) {
      return '<span class="' + className + '" role="button" aria-label="Ir al testimonio ' + (index + 1) + '" tabindex="0"></span>';
    },
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  breakpoints: {
    768: {
      slidesPerView: 2,
    },
  },
  // Configuración de accesibilidad
  a11y: {
    enabled: true,
    prevSlideMessage: 'Diapositiva anterior',
    nextSlideMessage: 'Siguiente diapositiva',
    firstSlideMessage: 'Esta es la primera diapositiva',
    lastSlideMessage: 'Esta es la última diapositiva',
    paginationBulletMessage: 'Ir a la diapositiva {{index}}',
    notificationClass: 'swiper-notification',
  },
  keyboard: {
    enabled: true,
    onlyInViewport: true,
  },
  // Anunciar cambios para lectores de pantalla
  on: {
    slideChange: function () {
      const activeSlide = this.slides[this.activeIndex];
      if (activeSlide) {
        // Actualizar aria-label del contenedor
        const container = document.querySelector('.recursosSwiper');
        if (container) {
          container.setAttribute('aria-label', 
            `Carrusel de testimonios, mostrando testimonio ${this.realIndex + 1} de ${this.slides.length}`
          );
        }
      }
    },
  },
});

// Mejorar accesibilidad de los botones de navegación
document.addEventListener('DOMContentLoaded', () => {
  const prevButton = document.querySelector('.swiper-button-prev');
  const nextButton = document.querySelector('.swiper-button-next');
  
  if (prevButton) {
    prevButton.setAttribute('tabindex', '0');
    prevButton.setAttribute('role', 'button');
    prevButton.setAttribute('aria-label', 'Testimonio anterior');
    
    // Soporte de teclado
    prevButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        recursosSwiper.slidePrev();
      }
    });
  }
  
  if (nextButton) {
    nextButton.setAttribute('tabindex', '0');
    nextButton.setAttribute('role', 'button');
    nextButton.setAttribute('aria-label', 'Siguiente testimonio');
    
    // Soporte de teclado
    nextButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        recursosSwiper.slideNext();
      }
    });
  }
});
