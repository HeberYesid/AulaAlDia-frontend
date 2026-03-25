import { useState, useEffect } from "react";
import { api } from "../../api/axios";

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/courses/course-sections/");
      setSections(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las secciones. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "", is_active: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (section) => {
    setFormData({ name: section.name, is_active: section.is_active });
    setEditingId(section.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", is_active: true });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await api.patch(`/api/v1/courses/course-sections/${editingId}/`, formData);
      } else {
        await api.post("/api/v1/courses/course-sections/", formData);
      }
      closeModal();
      fetchSections();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail ||
          "Ocurrió un error al guardar la sección."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Gestión de Secciones</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Nueva Sección
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center">Cargando...</td>
              </tr>
            ) : sections.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No hay secciones registradas.
                </td>
              </tr>
            ) : (
              sections.map((sec) => (
                <tr key={sec.id}>
                  <td>{sec.id}</td>
                  <td>{sec.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        sec.is_active ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {sec.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEditModal(sec)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingId ? "Editar Sección" : "Nueva Sección"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre (ej. A, B, C)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Activo
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
