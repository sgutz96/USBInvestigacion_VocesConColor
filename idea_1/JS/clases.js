document.addEventListener('DOMContentLoaded', () => {

    const classesContainer = document.getElementById('classes-container');
    const jsonPath = './data/clases.json'; // Define la ruta del JSON aquí

    // Función para crear una fila de clase
    function createClassRow(clase) {
        const classRow = document.createElement('a');
        classRow.classList.add('class-row');
        classRow.href = clase.link;

        const tagsHtml = clase.tags.map(tag => `<span class="class-tag">${tag}</span>`).join('');

        classRow.innerHTML = `
            <div class="class-info-left">
                <div class="class-icon-container">
                    <img src="${clase.icon}" alt="Icono de ${clase.title}">
                </div>
                <div class="class-text-content">
                    <h3>${clase.title}</h3>
                    <p>${clase.description}</p>
                    <div class="class-tags">${tagsHtml}</div>
                </div>
            </div>
            <div class="class-actions">
                <button aria-label="Añadir a favoritos"><img src="./assets/icons/star.svg" alt="Favorito"></button>
                <button aria-label="Compartir"><img src="./assets/icons/share.svg" alt="Compartir"></button>
                <button aria-label="Más opciones"><img src="./assets/icons/more.svg" alt="Más"></button>
            </div>
        `;

        return classRow;
    }

    // Usamos fetch() para cargar los datos del JSON
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo encontrar el archivo JSON.');
            }
            return response.json();
        })
        .then(classesData => {
            if (classesData && classesData.length > 0) {
                classesData.forEach(clase => {
                    const row = createClassRow(clase);
                    classesContainer.appendChild(row);
                });
            } else {
                classesContainer.innerHTML = '<p>No hay clases disponibles en este momento.</p>';
            }
        })
        .catch(error => {
            console.error('Error al cargar el archivo JSON:', error);
            classesContainer.innerHTML = '<p>Error al cargar las clases. Por favor, verifica la ruta del archivo JSON.</p>';
        });

});