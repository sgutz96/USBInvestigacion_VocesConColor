document.addEventListener('DOMContentLoaded', () => {

    const teamMembers = [
        {
            name: "John Doe",
            role: "Líder de Proyecto",
            bio: "John es un experto en gestión de proyectos con una pasión por la tecnología y la innovación social.",
            image: "./assets/img/team-member-1.jpg" // Reemplaza con la ruta de tu imagen
        },
        {
            name: "Jane Smith",
            role: "Diseñadora de UX/UI",
            bio: "Jane se especializa en crear experiencias de usuario intuitivas y visualmente atractivas.",
            image: "./assets/img/team-member-2.jpg" // Reemplaza con la ruta de tu imagen
        },
        {
            name: "Peter Jones",
            role: "Desarrollador Front-end",
            bio: "Peter es un talentoso desarrollador que da vida a las ideas con código limpio y eficiente.",
            image: "./assets/img/team-member-3.jpg" // Reemplaza con la ruta de tu imagen
        },
        {
            name: "Mary Williams",
            role: "Especialista en Contenido",
            bio: "Mary crea contenido valioso y relevante que conecta con nuestra audiencia.",
            image: "./assets/img/team-member-4.jpg" // Reemplaza con la ruta de tu imagen
        }
    ];

    const teamContainer = document.getElementById('team-container');

    function createTeamCard(member) {
        // Crea el elemento de la tarjeta
        const card = document.createElement('div');
        card.classList.add('team-card');

        // Crea el contenido de la tarjeta
        card.innerHTML = `
            <img src="${member.image}" alt="Foto de ${member.name}" class="team-card-img">
            <h3>${member.name}</h3>
            <p class="role">${member.role}</p>
            <p>${member.bio}</p>
        `;

        return card;
    }

    // Recorre el arreglo de miembros y añade cada tarjeta al contenedor
    teamMembers.forEach(member => {
        const card = createTeamCard(member);
        teamContainer.appendChild(card);
    });

});