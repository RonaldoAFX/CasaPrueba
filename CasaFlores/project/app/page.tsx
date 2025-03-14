"use client";
import { FaTrashAlt } from "react-icons/fa";
import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa39OQfS6y1dlwUcWGI6mHUgwFHT3matI",
  authDomain: "casaflores-e8331.firebaseapp.com",
  projectId: "casaflores-e8331",
  storageBucket: "casaflores-e8331.firebasestorage.app",
  messagingSenderId: "168763187526",
  appId: "1:168763187526:web:bcba9993132628efa2c547",
  measurementId: "G-3E7H93ZZ11",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

interface Contenedor {
  id: string;
  nombre: string;
  elementos: string[];
}

export default function Home() {
  const [contenedores, setContenedores] = useState<Contenedor[]>([]);
  const [selectedContenedor, setSelectedContenedor] = useState<Contenedor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContenedor, setNewContenedor] = useState("");
  const [isElementoModalOpen, setIsElementoModalOpen] = useState(false);
  const [newElemento, setNewElemento] = useState("");

  // Modal controls
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openElementoModal = () => setIsElementoModalOpen(true);
  const closeElementoModal = () => setIsElementoModalOpen(false);

  // Agregar estado para la confirmación de borrado
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<Contenedor | null>(null);
  const [confirmName, setConfirmName] = useState("");

  // Abrir el modal de confirmación de borrado
  const openConfirmDeleteModal = (contenedor: Contenedor) => {
    setContainerToDelete(contenedor);
    setIsConfirmDeleteModalOpen(true);
  };

  // Cerrar el modal de confirmación
  const closeConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setConfirmName("");
  };

  // Función para agregar un contenedor
  const agregarContenedor = async () => {
    if (newContenedor) {
      const nuevoContenedor = { nombre: newContenedor, elementos: [] };
      try {
        const docRef = await addDoc(collection(db, "contenedores"), nuevoContenedor);
        setContenedores([...contenedores, { ...nuevoContenedor, id: docRef.id }]);
        closeModal();
        setNewContenedor("");
      } catch (error) {
        console.error("Error agregando contenedor: ", error);
      }
    }
  };

  // Función para agregar un elemento a un contenedor
  const agregarElemento = async (contenedor: Contenedor) => {
    if (newElemento) {
      const updatedElementos = [...(contenedor.elementos || []), newElemento];
      try {
        await updateDoc(doc(db, "contenedores", contenedor.id), {
          elementos: updatedElementos
        });

        const updatedContenedor = { ...contenedor, elementos: updatedElementos };
        setContenedores(
          contenedores.map((c) => (c.id === contenedor.id ? updatedContenedor : c))
        );
        closeElementoModal();
        setNewElemento("");
      } catch (error) {
        console.error("Error actualizando contenedor: ", error);
      }
    }
  };

  // Función para eliminar un elemento
  const eliminarElemento = async (contenedor: Contenedor, index: number) => {
    const updatedElementos = contenedor.elementos.filter((_, i) => i !== index);
    try {
      await updateDoc(doc(db, "contenedores", contenedor.id), {
        elementos: updatedElementos,
      });
      const updatedContenedor = { ...contenedor, elementos: updatedElementos };
      setContenedores(
        contenedores.map((c) => (c.id === contenedor.id ? updatedContenedor : c))
      );
    } catch (error) {
      console.error("Error eliminando elemento:", error);
    }
  };

  // Función para eliminar el contenedor
  const eliminarContenedor = async () => {
    if (confirmName === containerToDelete?.nombre) {
      try {
        // Eliminar el contenedor de la base de datos
        await deleteDoc(doc(db, "contenedores", containerToDelete.id));

        // Actualizar el estado de los contenedores
        setContenedores(contenedores.filter(c => c.id !== containerToDelete.id));

        closeConfirmDeleteModal();
      } catch (error) {
        console.error("Error eliminando contenedor:", error);
      }
    } else {
      console.log("El nombre no coincide");
    }
  };

  useEffect(() => {
    const fetchContenedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "contenedores"));
        const contenedoresData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Contenedor[];
        setContenedores(contenedoresData);
      } catch (error) {
        console.error("Error fetching contenedores:", error);
      }
    };

    fetchContenedores();
  }, []);

  // Lógica para desplegar o repliegue de contenedor
  const toggleContenedor = (contenedor: Contenedor) => {
    setSelectedContenedor(prev => (prev?.id === contenedor.id ? null : contenedor));
  };

  // Registro del Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.ts') // Asegúrate de que la ruta sea la correcta
        .then((registration) => {
          console.log('Service Worker registrado con éxito:', registration);
        })
        .catch((error) => {
          console.log('Error al registrar el Service Worker:', error);
        });
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-blue-500 p-4">
      <h1 className="text-white text-3xl font-bold mb-4">Mis Contenedores</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {contenedores.map((cont) => (
          <div
            key={cont.id}
            className="bg-white p-6 rounded-lg shadow-lg text-blue-500 font-bold"
          >
            <button
              onClick={() => toggleContenedor(cont)} // Agregar lógica de repliegue
              className="text-xl font-semibold mb-2"
            >
              {cont.nombre}
            </button>
            {selectedContenedor?.id === cont.id && ( // Mostrar detalles solo si el contenedor está seleccionado
              <div>
                {cont.elementos.length > 0 ? (
                  <ul>
                    {cont.elementos.map((elem, index) => (
                      <li key={index} className="flex justify-between items-center text-blue-700 py-1 border-b border-gray-200">
                        {elem}
                        <button
                          onClick={() => eliminarElemento(cont, index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <FaTrashAlt />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay elementos aún</p>
                )}
                <button
                  onClick={openElementoModal}
                  className="bg-blue-500 text-white p-2 mt-2 rounded-lg"
                >
                  Agregar Elemento
                </button>
                {/* Botón para eliminar contenedor */}
                <button
                  onClick={() => openConfirmDeleteModal(cont)}
                  className="bg-red-500 text-white p-2 mt-2 rounded-lg"
                >
                  Eliminar Contenedor
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 bg-black text-white p-3 rounded-full text-3xl shadow-lg"
      >
        +
      </button>

      {/* Modal para agregar contenedor */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-72">
            <h2 className="text-xl font-semibold">Agregar Contenedor</h2>
            <input
              type="text"
              value={newContenedor}
              onChange={(e) => setNewContenedor(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              placeholder="Nombre del contenedor"
            />
            <div className="flex justify-between mt-4">
              <button onClick={closeModal} className="text-gray-500">Cancelar</button>
              <button onClick={agregarContenedor} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar elemento */}
      {isElementoModalOpen && selectedContenedor && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-72">
            <h2 className="text-xl font-semibold">Agregar Elemento</h2>
            <input
              type="text"
              value={newElemento}
              onChange={(e) => setNewElemento(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              placeholder="Nombre del elemento"
            />
            <div className="flex justify-between mt-4">
              <button onClick={closeElementoModal} className="text-gray-500">Cancelar</button>
              <button
                onClick={() => agregarElemento(selectedContenedor)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar contenedor */}
      {isConfirmDeleteModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-72">
            <h2 className="text-xl font-semibold text-red-500">Confirmar eliminación</h2>
            <p className="mt-2">Escribe el nombre del contenedor para confirmar:</p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              placeholder="Nombre del contenedor"
            />
            <div className="flex justify-between mt-4">
              <button onClick={closeConfirmDeleteModal} className="text-gray-500">Cancelar</button>
              <button
                onClick={eliminarContenedor}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
