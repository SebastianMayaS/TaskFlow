'use strict';
class Tarea {
  constructor({ descripcion, prioridad = 'media', fechaLimite = null }) {


    this.id           = Date.now();         
    this.descripcion  = descripcion;        
    this.prioridad    = prioridad;          
    this.estado       = 'pendiente';        
    this.fechaLimite  = fechaLimite;        
    this.fechaCreacion = new Date().toLocaleString('es-CL');
  }


  cambiarEstado() {
    this.estado = this.estado === 'pendiente' ? 'completada' : 'pendiente';
  }

  estaCompletada() {
    return this.estado === 'completada';
  }


  toJSON() {

    return { ...this };
  }
}



class GestorTareas {
  constructor() {

    this.tareas = [];
    this.filtroActual = 'todas';
    this._intervalos = {};
  }


  agregar(datos) {
    const nuevaTarea = new Tarea(datos); 
    this.tareas.push(nuevaTarea);        


    const btnTexto = document.getElementById('btnTexto');
    const btnAgregar = document.getElementById('btnAgregar');
    btnAgregar.disabled = true;
    btnTexto.textContent = '⏳ Procesando...';

    setTimeout(() => {

      btnAgregar.disabled = false;
      btnTexto.textContent = '＋ Agregar Tarea';
      this.renderizar();
      this.actualizarContadores();

      this.mostrarNotificacion(`✓ Tarea "${nuevaTarea.descripcion.slice(0,30)}..." agregada`);

      if (nuevaTarea.fechaLimite) {
        this.iniciarCuentaRegresiva(nuevaTarea.id);
      }
    }, 2000);
  }

  obtenerFiltradas() {
    if (this.filtroActual === 'todas') return this.tareas;

    return this.tareas.filter(t => t.estado === this.filtroActual);
  }

  toggleEstado(id) {

    const tarea = this.tareas.find(t => t.id === id);
    if (!tarea) return;

    tarea.cambiarEstado(); 

    if (tarea.estaCompletada() && this._intervalos[id]) {
      clearInterval(this._intervalos[id]);
      delete this._intervalos[id];
    }

    this.renderizar();
    this.actualizarContadores();
  }

  eliminar(id) {

    if (this._intervalos[id]) {
      clearInterval(this._intervalos[id]);
      delete this._intervalos[id];
    }

    this.tareas = this.tareas.filter(t => t.id !== id);

    this.renderizar();
    this.actualizarContadores();
    this.mostrarNotificacion('🗑 Tarea eliminada');
  }

  // ── Filtrar vista ──────────────────────────────────────
  filtrar(tipo, boton) {
    this.filtroActual = tipo;

    document.querySelectorAll('.filtro-chip').forEach(btn => {
      btn.classList.remove('activo');
    });
    boton.classList.add('activo');

    this.renderizar();
  }


  renderizar() {
    const lista = document.getElementById('listaTareas');
    const estadoVacio = document.getElementById('estadoVacio');
    const tareasFiltradas = this.obtenerFiltradas();

    if (tareasFiltradas.length === 0) {
      lista.innerHTML = '';
      estadoVacio.classList.remove('hidden');
      return;
    }

    estadoVacio.classList.add('hidden');
    lista.innerHTML = tareasFiltradas.map(tarea => {
      const claseEstado    = tarea.estaCompletada() ? 'completada' : '';
      const claseCheck     = tarea.estaCompletada() ? 'marcado' : '';
      const iconoCheck     = tarea.estaCompletada() ? '✓' : '';
      const clasePrioridad = `prioridad-${tarea.prioridad}`;
      const etiquetaPrioridad = {
        alta: '🔴 Alta',
        media: '🟡 Media',
        baja: '🟢 Baja'
      }[tarea.prioridad];

      const badgeFecha = tarea.fechaLimite
        ? `<span class="badge badge-fecha" id="fecha-${tarea.id}">📅 ${tarea.fechaLimite}</span>`
        : '';

      const badgeCountdown = (tarea.fechaLimite && !tarea.estaCompletada())
        ? `<span class="badge badge-countdown" id="countdown-${tarea.id}">⏱ calculando...</span>`
        : '';

      return `
        <li class="tarea-card ${clasePrioridad} ${claseEstado}" id="card-${tarea.id}"
            data-id="${tarea.id}">

          
          <div class="tarea-check ${claseCheck}"
              onclick="gestorTareas.toggleEstado(${tarea.id})"
              title="${tarea.estaCompletada() ? 'Marcar pendiente' : 'Completar'}">
            ${iconoCheck}
          </div>


          <div class="tarea-contenido">
            <p class="tarea-desc">${tarea.descripcion}</p>
            <div class="tarea-meta">
              <span class="badge badge-prioridad-${tarea.prioridad}">${etiquetaPrioridad}</span>
              <span class="badge badge-id">#${tarea.id}</span>
              ${badgeFecha}
              ${badgeCountdown}
            </div>
            <p class="tarea-fecha-creacion">Creada: ${tarea.fechaCreacion}</p>
          </div>


          <div class="tarea-acciones">
            <button class="btn-accion eliminar"
                    onclick="gestorTareas.eliminar(${tarea.id})"
                    title="Eliminar">✕</button>
          </div>
        </li>
      `;
    }).join('');

    tareasFiltradas.forEach(tarea => {
      if (tarea.fechaLimite && !tarea.estaCompletada()) {
        this.iniciarCuentaRegresiva(tarea.id);
      }
    });
  }


  actualizarContadores() {

    const completadas = this.tareas.filter(t => t.estaCompletada()).length;
    const pendientes  = this.tareas.filter(t => !t.estaCompletada()).length;

    document.getElementById('statTotal').textContent       = this.tareas.length;
    document.getElementById('statCompletadas').textContent = completadas;
    document.getElementById('statPendientes').textContent  = pendientes;
  }


  iniciarCuentaRegresiva(tareaId) {
    if (this._intervalos[tareaId]) {
      clearInterval(this._intervalos[tareaId]);
    }

    const tarea = this.tareas.find(t => t.id === tareaId);
    if (!tarea || !tarea.fechaLimite) return;

    this._intervalos[tareaId] = setInterval(() => {
      const badge = document.getElementById(`countdown-${tareaId}`);
      if (!badge) {
        clearInterval(this._intervalos[tareaId]);
        return;
      }

      const ahora      = new Date();
      const limite     = new Date(tarea.fechaLimite + 'T23:59:59');
      const diferencia = limite - ahora;

      if (diferencia <= 0) {
        badge.textContent = '⚠ VENCIDA';
        clearInterval(this._intervalos[tareaId]);
        return;
      }

      const dias   = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas  = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins   = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

      badge.textContent = `⏱ ${dias}d ${horas}h ${mins}m`;
    }, 1000);
  }

  mostrarNotificacion(mensaje) {
    const notif = document.getElementById('notificacion');
    const texto = document.getElementById('notificacionTexto');

    texto.textContent = mensaje;
    notif.classList.remove('hidden');

    setTimeout(() => {
      notif.classList.add('hidden');
    }, 3000);
  }


  async cargarDesdeAPI() {
    const btn = document.getElementById('btnCargarAPI');
    btn.disabled = true;
    btn.textContent = '↓ Cargando...';

    try {
      const respuesta = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      const nuevasTareas = datos.map(({ title, completed }) => {
        const t = new Tarea({ descripcion: title, prioridad: 'baja' });
        if (completed) t.cambiarEstado();
        return t;
      });

      this.tareas = [...this.tareas, ...nuevasTareas];

      this.renderizar();
      this.actualizarContadores();
      this.mostrarNotificacion(`✓ ${nuevasTareas.length} tareas cargadas desde la API`);

    } catch (error) {

      this.mostrarNotificacion(`✕ Error al cargar API: ${error.message}`);
      console.error('Error en cargarDesdeAPI:', error);

    } finally {

      btn.disabled = false;
      btn.textContent = '↓ Cargar desde API';
    }
  }


  guardarEnStorage() {
    // JSON.stringify convierte el array de objetos a string
    const datos = JSON.stringify(this.tareas.map(t => t.toJSON()));
    localStorage.setItem('taskflow_tareas', datos);
    this.mostrarNotificacion(`💾 ${this.tareas.length} tareas guardadas en Storage`);
  }


  cargarDesdeStorage() {
    const datos = localStorage.getItem('taskflow_tareas');

    if (!datos) {
      this.mostrarNotificacion('📂 No hay datos en Storage');
      return;
    }


    const objetos = JSON.parse(datos);

    this.tareas = objetos.map(obj => {
      const t = new Tarea({ descripcion: obj.descripcion, prioridad: obj.prioridad, fechaLimite: obj.fechaLimite });
      t.id            = obj.id;
      t.estado        = obj.estado;
      t.fechaCreacion = obj.fechaCreacion;
      return t;
    });

    this.renderizar();
    this.actualizarContadores();
    this.mostrarNotificacion(`📂 ${this.tareas.length} tareas recuperadas de Storage`);
  }

  limpiarTodo() {
    if (this.tareas.length === 0) return;
    Object.keys(this._intervalos).forEach(id => clearInterval(this._intervalos[id]));
    this._intervalos = {};
    this.tareas = [];
    this.renderizar();
    this.actualizarContadores();
    this.mostrarNotificacion('🗑 Todas las tareas eliminadas');
  }
}

const gestorTareas = new GestorTareas();

document.addEventListener('DOMContentLoaded', () => {


  const formTarea = document.getElementById('formTarea');
  formTarea.addEventListener('submit', (evento) => {

    evento.preventDefault();


    const descripcion = document.getElementById('inputDescripcion').value.trim();
    const prioridad   = document.getElementById('selectPrioridad').value;
    const fechaLimite = document.getElementById('inputFecha').value || null;

    if (!descripcion) {
      document.getElementById('inputDescripcion').focus();
      return;
    }

    gestorTareas.agregar({ descripcion, prioridad, fechaLimite });

    formTarea.reset();
    document.getElementById('charCounter').textContent = '0 / 120';
  });

  const inputDesc = document.getElementById('inputDescripcion');
  inputDesc.addEventListener('keyup', () => {
    const longitud = inputDesc.value.length;
    const contador = document.getElementById('charCounter');
    contador.textContent = `${longitud} / 120`;


    if (longitud > 100) {
      contador.classList.add('alerta');
    } else {
      contador.classList.remove('alerta');
    }

    if (longitud > 120) {
      inputDesc.value = inputDesc.value.slice(0, 120);
    }
  });


  const listaTareas = document.getElementById('listaTareas');
  listaTareas.addEventListener('mouseover', (evento) => {
    const card = evento.target.closest('.tarea-card');
    if (card) {
      card.style.cursor = 'default';
    }
  });


  const relojEl = document.getElementById('reloj');
  setInterval(() => {
    const ahora = new Date();
    relojEl.textContent = ahora.toLocaleTimeString('es-CL');
  }, 1000);

  gestorTareas.renderizar();
  gestorTareas.actualizarContadores();

  const hayStorage = localStorage.getItem('taskflow_tareas');
  if (hayStorage) {
    gestorTareas.cargarDesdeStorage();
  }
});