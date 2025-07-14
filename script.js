document.addEventListener('DOMContentLoaded', () => {
    const mallaContainer = document.getElementById('malla-container');
    const materiaDetalle = document.getElementById('materia-detalle');
    const cerrarDetalleBtn = document.getElementById('cerrar-detalle');

    let materiasData = []; // Variable para almacenar los datos de las materias

    // Función para cargar los datos de materias.json
    async function cargarMaterias() {
        try {
            const response = await fetch('materias.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            materiasData = await response.json();
            renderizarMalla();
        } catch (error) {
            console.error('Error al cargar las materias:', error);
            mallaContainer.innerHTML = '<p>Error al cargar las materias. Por favor, asegúrate de que el archivo materias.json esté en la misma carpeta.</p>';
        }
    }

    // Función para agrupar materias por año y cuatrimestre
    function agruparMateriasPorAnioYCuatrimestre(data) {
        const agrupado = {};
        data.forEach(materia => {
            const clave = `Año ${materia.anio} - ${materia.cuatrimestre}`;
            if (!agrupado[clave]) {
                agrupado[clave] = [];
            }
            agrupado[clave].push(materia);
        });
        return agrupado;
    }

    // Función para renderizar las tarjetas de las materias
    function renderizarMalla() {
        mallaContainer.innerHTML = ''; // Limpia el contenedor
        const materiasAgrupadas = agruparMateriasPorAnioYCuatrimestre(materiasData);

        // Obtener y ordenar las claves (ej. "Año 1 - 1er Cuatrimestre", "Año 1 - Anual", etc.)
        const clavesOrdenadas = Object.keys(materiasAgrupadas).sort((a, b) => {
            const getOrder = (clave) => {
                const anioMatch = clave.match(/Año (\d+)/);
                const anio = anioMatch ? parseInt(anioMatch[1]) : 0;
                let cuatrimestreOrder = 0; // 0 for Anual, 1 for 1er Cuatrimestre, 2 for 2do Cuatrimestre

                if (clave.includes('1er Cuatrimestre')) {
                    cuatrimestreOrder = 1;
                } else if (clave.includes('2do Cuatrimestre')) {
                    cuatrimestreOrder = 2;
                }
                return anio * 10 + cuatrimestreOrder;
            };
            return getOrder(a) - getOrder(b);
        });


        clavesOrdenadas.forEach(clave => {
            const anioCuatrimestreDiv = document.createElement('div');
            anioCuatrimestreDiv.classList.add('anio-cuatrimestre-container');
            anioCuatrimestreDiv.innerHTML = `<h2>${clave}</h2><div class="materias-list"></div>`;

            const materiasListDiv = anioCuatrimestreDiv.querySelector('.materias-list');

            // Ordenar materias alfabéticamente dentro de cada grupo
            const materiasEnClave = materiasAgrupadas[clave].sort((a, b) => a.nombre.localeCompare(b.nombre));

            materiasEnClave.forEach(materia => {
                const card = document.createElement('div');
                card.classList.add('materia'); // Clase general para todas las materias
                card.dataset.id = materia.id; // Guarda el ID para fácil acceso
                card.innerHTML = `
                    <h3>${materia.nombre}</h3>
                `;
                // Inicialmente, puedes asignarles un estado genérico o dejar sin color hasta que se haga clic
                // card.classList.add('pendiente'); // Ejemplo, se puede quitar

                card.addEventListener('click', () => mostrarDetalleMateria(materia.id));
                materiasListDiv.appendChild(card);
            });
            mallaContainer.appendChild(anioCuatrimestreDiv);
        });
    }

    // Función para mostrar los detalles de una materia
    function mostrarDetalleMateria(idMateria) {
        const materia = materiasData.find(m => m.id === idMateria);
        if (materia) {
            document.getElementById('detalle-nombre').textContent = materia.nombre;
            document.getElementById('detalle-creditos').textContent = materia.creditos ? `${materia.creditos} créditos` : 'N/A'; // Si tienes créditos
            document.getElementById('detalle-anio').textContent = materia.anio;
            document.getElementById('detalle-cuatrimestre').textContent = materia.cuatrimestre;
            document.getElementById('detalle-descripcion').textContent = materia.descripcion || 'Sin descripción disponible.';

            // Muestra las correlativas previas con sus nombres
            const correlativasPreviasNombres = materia.correlativas_previas
                .map(corrId => materiasData.find(m => m.id === corrId)?.nombre || corrId) // Busca el nombre, si no lo encuentra, usa el ID
                .join(', ') || 'Ninguna';
            document.getElementById('detalle-correlativas-previas').textContent = correlativasPreviasNombres;

            // Muestra las correlativas posteriores con sus nombres
            const correlativasPosterioresNombres = materia.correlativas_posteriores
                .map(corrId => materiasData.find(m => m.id === corrId)?.nombre || corrId) // Busca el nombre, si no lo encuentra, usa el ID
                .join(', ') || 'Ninguna';
            document.getElementById('detalle-correlativas-posteriores').textContent = correlativasPosterioresNombres;

            materiaDetalle.classList.remove('hidden');

            // Resalta la materia seleccionada y sus correlativas
            document.querySelectorAll('.materia').forEach(card => {
                card.classList.remove('resaltada-previas', 'resaltada-posteriores');
                // Opcional: remover cualquier otra clase de estado de resaltado si existe
            });
            // No hay necesidad de resaltar la propia materia seleccionada con una clase especial, ya se está viendo su detalle.
            // Si quisieras, podrías añadir: document.querySelector(`.materia[data-id="${idMateria}"]`).classList.add('seleccionada');

            materia.correlativas_previas.forEach(corrId => {
                const card = document.querySelector(`.materia[data-id="${corrId}"]`);
                if (card) card.classList.add('resaltada-previas');
            });
            materia.correlativas_posteriores.forEach(corrId => {
                const card = document.querySelector(`.materia[data-id="${corrId}"]`);
                if (card) card.classList.add('resaltada-posteriores');
            });

            // Puedes hacer scroll a la vista de detalles si es necesario
            materiaDetalle.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } else {
            console.warn(`Materia con ID ${idMateria} no encontrada.`);
        }
    }

    // Función para ocultar los detalles
    cerrarDetalleBtn.addEventListener('click', () => {
        materiaDetalle.classList.add('hidden');
        // Quita el resaltado de todas las materias
        document.querySelectorAll('.materia').forEach(card => {
            card.classList.remove('resaltada-previas', 'resaltada-posteriores');
        });
    });

    // Iniciar la carga de materias cuando el DOM esté listo
    cargarMaterias();
});