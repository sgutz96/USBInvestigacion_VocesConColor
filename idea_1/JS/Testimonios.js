// ===== SWIPER RECURSOS CON FUNCIONALIDAD MEJORADA =====

// Configuración del Swiper mejorada
var swiper = new Swiper(".recursosSwiper", {
    // Configuración básica
    slidesPerView: 1,
    spaceBetween: 30,
    centeredSlides: true,
    loop: true,
    
    // Autoplay inteligente
    autoplay: {
        delay: 5000,                    // 5 segundos por slide
        disableOnInteraction: false,    // No se detiene al interactuar
        pauseOnMouseEnter: true,        // Se pausa al hacer hover
        reverseDirection: false,        // Dirección normal
    },
    
    // Efectos y transiciones
    effect: 'slide',                    // Puedes cambiar a 'fade', 'cube', 'coverflow'
    speed: 800,                         // Velocidad de transición más suave
    
    // Paginación mejorada
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: true,           // Bullets dinámicos
        dynamicMainBullets: 3,          // Máximo 3 bullets visibles
    },
    
    // Navegación
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    
    // Controles de teclado
    keyboard: {
        enabled: true,
        onlyInViewport: true,           // Solo funciona cuando está visible
    },
    
    // Control con mouse wheel
    mousewheel: {
        enabled: true,
        sensitivity: 1,
        forceToAxis: true,
    },
    
    // Responsive breakpoints
    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 20,
        },
        640: {
            slidesPerView: 1,
            spaceBetween: 25,
        },
        768: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 1,
            spaceBetween: 35,
        }
    },
    
    // Eventos para funcionalidades adicionales
    on: {
        init: function () {
            console.log('Swiper inicializado');
            updateSlideInfo();
            addProgressIndicator();
        },
        slideChange: function () {
            updateSlideInfo();
            updateProgressIndicator();
        },
        autoplayStart: function () {
            updateAutoplayStatus(true);
        },
        autoplayStop: function () {
            updateAutoplayStatus(false);
        }
    }
});

// ===== FUNCIONES ADICIONALES =====

// Actualizar información del slide actual
function updateSlideInfo() {
    const currentIndex = swiper.realIndex + 1;
    const totalSlides = swiper.slides.length - 2; // Restamos los slides duplicados del loop
    
    // Si tienes elementos para mostrar la info del slide
    const slideCounter = document.querySelector('.slide-counter');
    if (slideCounter) {
        slideCounter.textContent = `${currentIndex} de ${totalSlides}`;
    }
    
    console.log(`Slide actual: ${currentIndex} de ${totalSlides}`);
}

// Indicador de progreso del autoplay
function addProgressIndicator() {
    // Crear indicador de progreso si no existe
    let progressIndicator = document.querySelector('.autoplay-progress');
    if (!progressIndicator) {
        progressIndicator = document.createElement('div');
        progressIndicator.className = 'autoplay-progress';
        progressIndicator.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--verde-suave);
            transition: width 0.1s ease;
            z-index: 10;
            width: 0%;
        `;
        document.querySelector('.recursosSwiper').appendChild(progressIndicator);
    }
}

// Actualizar indicador de progreso
function updateProgressIndicator() {
    const progressBar = document.querySelector('.autoplay-progress');
    if (progressBar && swiper.autoplay.running) {
        progressBar.style.width = '0%';
        progressBar.style.transition = 'width 5s linear';
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 50);
    }
}

// Actualizar estado del autoplay
function updateAutoplayStatus(isPlaying) {
    const progressBar = document.querySelector('.autoplay-progress');
    if (progressBar) {
        if (!isPlaying) {
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';
        } else {
            updateProgressIndicator();
        }
    }
}

// ===== CONTROLES ADICIONALES =====

// Función para pausar/reanudar autoplay
function toggleAutoplay() {
    if (swiper.autoplay.running) {
        swiper.autoplay.stop();
        console.log('Autoplay pausado');
    } else {
        swiper.autoplay.start();
        console.log('Autoplay reanudado');
    }
}

// Ir a un slide específico
function goToSlide(slideIndex) {
    swiper.slideTo(slideIndex);
}

// Ir a slide anterior/siguiente
function previousSlide() {
    swiper.slidePrev();
}

function nextSlide() {
    swiper.slideNext();
}

// Función para redirigir a la sección recursos
function scrollToRecursos() {
    document.getElementById('recursos').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ===== EVENT LISTENERS ADICIONALES =====

// Pausar autoplay al hacer hover en las tarjetas
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.recurso-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (swiper.autoplay.running) {
                swiper.autoplay.stop();
            }
        });
        
        card.addEventListener('mouseleave', () => {
            swiper.autoplay.start();
        });
    });
    
    // Control con teclas
    document.addEventListener('keydown', (e) => {
        // Solo funciona si el swiper está visible en pantalla
        const swiperElement = document.querySelector('.recursosSwiper');
        const rect = swiperElement.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    swiper.slidePrev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    swiper.slideNext();
                    break;
                case ' ':
                    e.preventDefault();
                    toggleAutoplay();
                    break;
                case 'Home':
                    e.preventDefault();
                    swiper.slideTo(0);
                    break;
                case 'End':
                    e.preventDefault();
                    swiper.slideTo(swiper.slides.length - 1);
                    break;
            }
        }
    });
});

// ===== FUNCIONES PARA USAR DESDE OTROS ELEMENTOS =====

// Para botones en tu navegación o hero
function navegarARecursos() {
    // Primero navega a la sección
    scrollToRecursos();
    
    // Opcional: activar autoplay cuando llegue
    setTimeout(() => {
        if (!swiper.autoplay.running) {
            swiper.autoplay.start();
        }
    }, 1000);
}

// Para mostrar un recurso específico
function mostrarRecurso(nombre) {
    const testimonios = [
        'Cameron Rogers',
        'Cardarion Hart', 
        'Gladys Kanyinda',
        'Katayama Fumiki'
    ];
    
    const index = testimonios.findIndex(t => t.toLowerCase().includes(nombre.toLowerCase()));
    if (index !== -1) {
        scrollToRecursos();
        setTimeout(() => {
            swiper.slideTo(index);
        }, 1000);
    }
}

// ===== CONFIGURACIÓN AVANZADA (OPCIONAL) =====

// Auto-detección de velocidad de navegación del usuario
let userInteractionCount = 0;
let fastNavigation = false;

swiper.on('slideChangeTransitionStart', function() {
    userInteractionCount++;
    
    // Si el usuario navega rápido, acelerar transiciones
    if (userInteractionCount > 3) {
        fastNavigation = true;
        swiper.params.speed = 400;
        swiper.params.autoplay.delay = 3000;
    }
});

// Reset después de inactividad
let inactivityTimer;
function resetUserBehavior() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        userInteractionCount = 0;
        fastNavigation = false;
        swiper.params.speed = 800;
        swiper.params.autoplay.delay = 5000;
    }, 10000); // 10 segundos de inactividad
}

// Llamar reset en cada interacción
swiper.on('slideChange', resetUserBehavior);

// ===== EJEMPLOS DE USO =====

/*
// Desde un botón en tu hero:
<button onclick="navegarARecursos()" class="btn-primary">
    Ver Testimonios
</button>

// Desde tu navegación:
<a href="#recursos" onclick="scrollToRecursos()">Recursos</a>

// Para mostrar un testimonio específico:
<button onclick="mostrarRecurso('Gladys')">Ver testimonio de Gladys</button>

// Control manual:
<button onclick="toggleAutoplay()">Pausar/Reanudar</button>
<button onclick="previousSlide()">Anterior</button>
<button onclick="nextSlide()">Siguiente</button>
*/