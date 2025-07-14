document.addEventListener('DOMContentLoaded', () => {
    const mallaContainer = document.getElementById('malla-container');
    const materiaDetalle = document.getElementById('materia-detalle');
    let materiasData = []; // Para almacenar los datos de las materias

    // --- Carga de datos de materias ---
    fetch('materias.json')
        .then(response => response.json())
        .then(data => {
            materiasData = data;
            loadMateriasState(); // Carga los estados guardados
            renderMalla(); // Renderiza la malla con los estados
            checkHabilitadasParaFinal(); // Chequea y resalta las habilitadas para final
        })
        .catch(error => console.error('Error al cargar las materias:', error));

    // --- Funciones de estado y guardado/carga ---

    function loadMateriasState() {
        const savedStates = localStorage.getItem('materiasState');
        if (savedStates) {
            const statesMap = new Map(JSON.parse(savedStates));
            materiasData.forEach(materia => {
                if (statesMap.has(materia.id)) {
                    materia.estado = statesMap.get(materia.id);
                }
            });
        } else {
            // Si no hay estados guardados, inicializa todas como 'pendiente'
            materiasData.forEach(materia => {
                materia.estado = 'pendiente';
            });
        }
    }

    function saveMateriasState() {
        const statesToSave = materiasData.map(materia => [materia.id, materia.estado]);
        localStorage.setItem('materiasState', JSON.stringify(statesToSave));
    }

    function toggleMateriaState(materiaId) {
        const materia = materiasData.find(m => m.id === materiaId);
        if (materia) {
            switch (materia.estado) {
                case 'pendiente':
                    materia.estado = 'cursando';
                    break;
                case 'cursando':
                    materia.estado = 'aprobada';
                    break;
                case 'aprobada':
                    materia.estado = 'pendiente'; // Vuelve a pendiente si ya está aprobada
                    break;
                default:
                    materia.estado = 'pendiente';
            }
            saveMateriasState(); // Guarda el nuevo estado
            renderMalla(); // Vuelve a renderizar la malla para aplicar los nuevos colores
            checkHabilitadasParaFinal(); // Re-chequea habilitadas para final
            updateMateriaDetalle(materia); // Actualiza el detalle si es la materia mostrada
        }
    }

    // --- Lógica para verificar materias habilitadas para final ---

    function checkHabilitadasParaFinal() {
        // Primero, limpia cualquier clase 'habilitada-final' existente
        document.querySelectorAll('.materia.habilitada-final').forEach(el => {
            el.classList.remove('habilitada-final');
        });

        const materiasAprobadasIds = new Set(
            materiasData.filter(materia => materia.estado === 'aprobada').map(materia => materia.id)
        );

        materiasData.forEach(materia => {
            if (materia.estado === 'aprobada') {
                return; // Si ya está aprobada, no necesita ser resaltada como 'habilitada-final'
            }

            // Verifica si todas las correlativas previas están aprobadas
            const todasCorrelativasAprobadas = materia.correlativas_previas.every(prevId =>
                materiasAprobadasIds.has(prevId)
            );

            // Si está habilitada y no está aprobada ni cursando, resáltala
            if (todasCorrelativasAprobadas && materia.estado === 'pendiente') {
                const materiaElement = document.querySelector(`.materia[data-id="${materia.id}"]`);
                if (materiaElement) {
                    materiaElement.classList.add('habilitada-final');
                }
            }
        });
    }

    // --- Funciones de renderizado (actualizadas) ---

        function renderMalla() {
    mallaContainer.innerHTML = ''; // Limpia el contenedor antes de renderizar
    const anios = {};

    // Agrupar materias por año
    materiasData.forEach(materia => {
        if (!anios[materia.anio]) {
            anios[materia.anio] = []; // Ahora es un array para las materias del año
        }
        anios[materia.anio].push(materia);
    });

    // Obtener los años en orden numérico
    const aniosOrdenados = Object.keys(anios).sort((a, b) => parseInt(a) - parseInt(b));

    // Renderizar cada columna de año
    aniosOrdenados.forEach(anioNum => {
        const anioColumna = document.createElement('div');
        anioColumna.classList.add('anio-columna');
        anioColumna.innerHTML = `<h2>Año ${anioNum}</h2>`;

        // Ordenar materias dentro del año por cuatrimestre y luego alfabéticamente
        const materiasDelAnio = anios[anioNum].sort((a, b) => {
            const ordenCuatrimestre = { "1er Cuatrimestre": 1, "2do Cuatrimestre": 2, "Anual": 3 };
            const cuatrimestreA = ordenCuatrimestre[a.cuatrimestre] || 99; // Fallback para si no tiene cuatrimestre o es desconocido
            const cuatrimestreB = ordenCuatrimestre[b.cuatrimestre] || 99;

            if (cuatrimestreA !== cuatrimestreB) {
                return cuatrimestreA - cuatrimestreB;
            }
            return a.nombre.localeCompare(b.nombre); // Orden alfabético si el cuatrimestre es el mismo
        });


        materiasDelAnio.forEach(materia => {
            const materiaDiv = document.createElement('div');
            materiaDiv.classList.add('materia');
            materiaDiv.classList.add(materia.estado); // Añade la clase de estado (pendiente, cursando, aprobada)
            materiaDiv.dataset.id = materia.id; // Guarda el ID de la materia
            materiaDiv.textContent = materia.nombre;
            materiaDiv.title = `Estado: ${materia.estado.charAt(0).toUpperCase() + materia.estado.slice(1)}\nCuatrimestre: ${materia.cuatrimestre}`; // Tooltip mejorado

            // Evento para mostrar detalles y cambiar estado
            materiaDiv.addEventListener('click', () => {
                selectMateria(materia.id);
            });
            materiaDiv.addEventListener('dblclick', (e) => { // Doble clic para cambiar estado
                e.stopPropagation(); // Evita que se dispare el click simple también
                toggleMateriaState(materia.id);
            });

            anioColumna.appendChild(materiaDiv);
        });
        mallaContainer.appendChild(anioColumna);
    });
}

    function selectMateria(id) {
        // Remueve resaltado de todas las materias
        document.querySelectorAll('.materia').forEach(el => {
            el.classList.remove('resaltada-previas', 'resaltada-posteriores', 'seleccionada');
        });

        const selectedMateria = materiasData.find(m => m.id === id);
        if (selectedMateria) {
            // Resalta la materia seleccionada
            const selectedElement = document.querySelector(`.materia[data-id="${id}"]`);
            if (selectedElement) {
                selectedElement.classList.add('seleccionada');
            }

            // Muestra detalle de la materia
            updateMateriaDetalle(selectedMateria);

            // Resalta previas
            selectedMateria.correlativas_previas.forEach(prevId => {
                const prevElement = document.querySelector(`.materia[data-id="${prevId}"]`);
                if (prevElement) {
                    prevElement.classList.add('resaltada-previas');
                }
            });

            // Resalta posteriores
            selectedMateria.correlativas_posteriores.forEach(postId => {
                const postElement = document.querySelector(`.materia[data-id="${postId}"]`);
                if (postElement) {
                    postElement.classList.add('resaltada-posteriores');
                }
            });
        }
    }

    function updateMateriaDetalle(materia) {
        materiaDetalle.innerHTML = `
            <h3>${materia.nombre}</h3>
            <p><strong>Año:</strong> ${materia.anio}</p>
            <p><strong>Cuatrimestre:</strong> ${materia.cuatrimestre}</p>
            <p><strong>Estado:</strong> <span id="detalle-estado">${materia.estado.charAt(0).toUpperCase() + materia.estado.slice(1)}</span></p>
            <p><strong>Correlativas Previas:</strong> ${materia.correlativas_previas.length > 0 ? materia.correlativas_previas.map(id => materiasData.find(m => m.id === id)?.nombre || id).join(', ') : 'Ninguna'}</p>
            <p><strong>Correlativas Posteriores:</strong> ${materia.correlativas_posteriores.length > 0 ? materia.correlativas_posteriores.map(id => materiasData.find(m => m.id === id)?.nombre || id).join(', ') : 'Ninguna'}</p>
            <button id="toggle-state-button">Cambiar Estado</button>
        `;

        document.getElementById('toggle-state-button').addEventListener('click', () => {
            toggleMateriaState(materia.id);
        });

        materiaDetalle.classList.remove('hidden');
    }

    // Ocultar el panel de detalle cuando se hace clic fuera
    document.addEventListener('click', (event) => {
        if (!mallaContainer.contains(event.target) && !materiaDetalle.contains(event.target) && !event.target.classList.contains('materia')) {
            materiaDetalle.classList.add('hidden');
        }
    });
});
