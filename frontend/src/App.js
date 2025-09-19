import React, { useState, useEffect } from 'react';
import { Calendar, Save, Edit, Trash2, BookOpen, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DiarioPersonal = () => {
  const [entradas, setEntradas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [contenido, setContenido] = useState('');
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [conectado, setConectado] = useState(false);

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  // Verificar conexión con el backend
  const verificarConexion = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setConectado(true);
        return true;
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setConectado(false);
      return false;
    }
    return false;
  };

  // Cargar todas las entradas
  const cargarEntradas = async () => {
    try {
      const response = await fetch(`${API_URL}/entradas`);
      if (response.ok) {
        const data = await response.json();
        setEntradas(data);
      } else {
        mostrarMensaje('Error al cargar entradas', 'error');
      }
    } catch (error) {
      console.error('Error al cargar entradas:', error);
      mostrarMensaje('Error de conexión al cargar entradas', 'error');
    }
  };

  // Cargar entrada específica por fecha
  const cargarEntradaPorFecha = async (fecha) => {
    try {
      const response = await fetch(`${API_URL}/entradas/${fecha}`);
      if (response.ok) {
        const data = await response.json();
        setContenido(data.contenido);
        setEditando(true);
      } else {
        setContenido('');
        setEditando(false);
      }
    } catch (error) {
      console.error('Error al cargar entrada:', error);
      setContenido('');
      setEditando(false);
      mostrarMensaje('Error de conexión', 'error');
    }
  };

  // Guardar o actualizar entrada
  const guardarEntrada = async () => {
    if (!fechaSeleccionada || !contenido.trim()) {
      mostrarMensaje('Por favor, selecciona una fecha y escribe algo', 'error');
      return;
    }

    setCargando(true);
    
    try {
      const url = editando 
        ? `${API_URL}/entradas/${fechaSeleccionada}`
        : `${API_URL}/entradas`;
      
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: fechaSeleccionada,
          contenido: contenido.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarMensaje(
          editando ? 'Entrada actualizada' : 'Entrada guardada', 
          'success'
        );
        await cargarEntradas();
        setEditando(true);
      } else {
        mostrarMensaje(data.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error de conexión', 'error');
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  // Eliminar entrada
  const eliminarEntrada = async (fecha) => {
    if (!window.confirm('¿Estás seguro de eliminar esta entrada?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/entradas/${fecha}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mostrarMensaje('Entrada eliminada', 'success');
        await cargarEntradas();
        
        if (fecha === fechaSeleccionada) {
          setContenido('');
          setEditando(false);
        }
      } else {
        const data = await response.json();
        mostrarMensaje(data.error || 'Error al eliminar', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error de conexión', 'error');
      console.error('Error:', error);
    }
  };

  // Mostrar mensajes
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(''), 3000);
  };

  // Nueva entrada
  const nuevaEntrada = () => {
    setFechaSeleccionada(obtenerFechaHoy());
    setContenido('');
    setEditando(false);
  };

  // Seleccionar entrada existente
  const seleccionarEntrada = (entrada) => {
    setFechaSeleccionada(entrada.fecha);
    setContenido(entrada.contenido);
    setEditando(true);
  };

  // Manejar cambio de fecha
  const manejarCambioFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFechaSeleccionada(nuevaFecha);
    cargarEntradaPorFecha(nuevaFecha);
  };

  useEffect(() => {
    const inicializar = async () => {
      const conexionOk = await verificarConexion();
      if (conexionOk) {
        await cargarEntradas();
        setFechaSeleccionada(obtenerFechaHoy());
      }
    };
    
    inicializar();
  }, []);

  useEffect(() => {
    if (fechaSeleccionada && conectado) {
      cargarEntradaPorFecha(fechaSeleccionada);
    }
  }, [fechaSeleccionada, conectado]);

  if (!conectado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <BookOpen className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Error de Conexión
          </h2>
          <p className="text-gray-600 mb-6">
            No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.
          </p>
          <button
            onClick={verificarConexion}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Mi Diario Personal</h1>
          </div>
          <p className="text-gray-600">Escribe tus pensamientos y recuerdos día a día</p>
          <div className="text-sm text-green-600 mt-2">
           Conectado al servidor
          </div>
        </header>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-lg text-center font-medium ${
            mensaje.tipo === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel de escritura */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <Edit className="w-6 h-6 mr-2 text-indigo-600" />
                  {editando ? 'Editar Entrada' : 'Nueva Entrada'}
                </h2>
                <button
                  onClick={nuevaEntrada}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva
                </button>
              </div>

              {/* Selector de fecha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={manejarCambioFecha}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Área de texto */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe aquí tus pensamientos del día..."
                  rows={12}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Botón guardar */}
              <button
                onClick={guardarEntrada}
                disabled={cargando || !fechaSeleccionada || !contenido.trim()}
                className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                {cargando ? 'Guardando...' : editando ? 'Actualizar Entrada' : 'Guardar Entrada'}
              </button>
            </div>
          </div>

          {/* Panel de entradas anteriores */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Entradas Anteriores
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {entradas.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay entradas aún.<br />
                    ¡Escribe tu primera entrada!
                  </p>
                ) : (
                  entradas.map((entrada) => (
                    <div
                      key={entrada.id}
                      className={`p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        entrada.fecha === fechaSeleccionada ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                      }`}
                      onClick={() => seleccionarEntrada(entrada)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {new Date(entrada.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarEntrada(entrada.fecha);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {entrada.contenido.length > 100 
                          ? entrada.contenido.substring(0, 100) + '...'
                          : entrada.contenido}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiarioPersonal;