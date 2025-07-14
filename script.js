document.addEventListener('DOMContentLoaded', () => {
    const mallaContainer = document.getElementById('malla-container');
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
                materia.estado = 'pendiente'; // Vuelve a pendiente
                break;
            default:
                materia.estado = 'pendiente';
        }
        saveMateriasState(); // Guarda el nuevo estado
        renderMalla(); // Vuelve a renderizar la malla para aplicar los nuevos colores
        checkHabilitadasParaFinal(); // Re-chequea habilitadas para final
        // No actualizamos el detalle aquí, ya que el clic ahora es para el estado
        // Si el detalle se muestra, se actualizará en selectMateria si el usuario hace click simple.
       
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

        // Ordenar materias dentro del año por cuatrimestre (Anual, 1er, 2do) y luego alfabéticamente
const materiasDelAnio = anios[anioNum].sort((a, b) => {
    const ordenCuatrimestre = { "Anual": 1, "1er Cuatrimestre": 2, "2do Cuatrimestre": 3 };
    const cuatrimestreA = ordenCuatrimestre[a.cuatrimestre] || 99;
    const cuatrimestreB = ordenCuatrimestre[b.cuatrimestre] || 99;

    if (cuatrimestreA !== cuatrimestreB) {
        return cuatrimestreA - cuatrimestreB;
    }
    return a.nombre.localeCompare(b.nombre);
});

        materiasDelAnio.forEach(materia => {
            const materiaDiv = document.createElement('div');
            materiaDiv.classList.add('materia');
            materiaDiv.classList.add(materia.estado); // Añade la clase de estado (pendiente, cursando, aprobada)
            materiaDiv.dataset.id = materia.id; // Guarda el ID de la materia
            materiaDiv.textContent = materia.nombre;
            materiaDiv.title = `Estado: ${materia.estado.charAt(0).toUpperCase() + materia.estado.slice(1)}\nCuatrimestre: ${materia.cuatrimestre}`; // Tooltip mejorado

// Evento para cambiar estado (un solo clic)
materiaDiv.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que el clic se propague si hay otros listeners
    toggleMateriaState(materia.id);
});
// Si aún quieres un clic para ver detalles, lo haremos con un botón en el detalle
// o un clic secundario/derecho si es necesario, pero el clic principal es para el estado.

            anioColumna.appendChild(materiaDiv);
        });
        mallaContainer.appendChild(anioColumna);
    });
}

   
