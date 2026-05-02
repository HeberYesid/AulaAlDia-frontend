import { useState, useEffect } from "react";
import { api } from "../../api/axios";
import ConfirmDialog from "../../components/ConfirmDialog";
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import { unwrapListData } from '../../utils/pagination';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !submitting) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, submitting]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/courses/course-sections/");
      setSections(unwrapListData(res.data));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, {
        action: 'cargar las secciones',
        fallback: 'No se pudieron cargar las secciones. Verifica tu institucion activa e intentalo nuevamente.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setError(null);
    setSuccess('');
    setFormData({ name: "", is_active: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (section) => {
    setError(null);
    setSuccess('');
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
    const wasEditing = Boolean(editingId);
    try {
      setSubmitting(true);
      if (editingId) {
        await api.patch(`/api/v1/courses/course-sections/${editingId}/`, formData);
      } else {
        await api.post("/api/v1/courses/course-sections/", formData);
      }
      closeModal();
      await fetchSections();
      setSuccess(wasEditing ? 'Seccion actualizada correctamente.' : 'Seccion creada correctamente.');
      window.setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, {
        action: editingId ? 'actualizar la seccion' : 'crear la seccion',
        fallback: editingId
          ? 'No se pudo actualizar la seccion. Verifica el nombre e intentalo nuevamente.'
          : 'No se pudo crear la seccion. Verifica el nombre e intentalo nuevamente.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (section) => {
    setError(null);
    setSuccess('');
    setConfirmDelete(section);
  };

  const handleConfirmDelete = async () => {
    const section = confirmDelete;
    setConfirmDelete(null);

    if (!section) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/api/v1/courses/course-sections/${section.id}/`);
      await fetchSections();
      setSuccess('Seccion eliminada correctamente.');
      window.setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, {
        action: 'eliminar la seccion',
        fallback: 'No se pudo eliminar la seccion. Puede tener cursos asociados o permisos restringidos.',
      }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page sections-page">
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar sección?"
          message={`¿Estás seguro de que deseas eliminar la sección "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="sections-page__header">
        <h1>Gestión de Secciones</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Nueva Sección
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card sections-page__list-card">
        <div className="sections-page__list-header">
          <h2>Listado</h2>
        </div>

        <div className="table-container sections-table-container">
          <table className="table mobile-card-view sections-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="3" className="text-center">Cargando...</td>
                </tr>
              ) : sections.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="3" className="text-center">
                    No hay secciones registradas.
                  </td>
                </tr>
              ) : (
                sections.map((sec) => (
                  <tr key={sec.id}>
                    <td data-label="Nombre">{sec.name}</td>
                    <td data-label="Estado">
                      <span
                        className={`badge ${
                          sec.is_active ? "badge-success" : "badge-secondary"
                        }`}
                      >
                        {sec.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditModal(sec)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteClick(sec)}
                        disabled={deleting}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="sections-modal-backdrop" onClick={!submitting ? closeModal : undefined}>
          <div
            className="sections-modal modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sections-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="sections-modal-title">{editingId ? "Editar Sección" : "Nueva Sección"}</h2>
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
              <div className="form-group sections-modal__checkbox-group">
                <label className="sections-modal__checkbox" htmlFor="section-active-checkbox">
                  <span>Activo</span>
                  <input
                    id="section-active-checkbox"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                </label>
              </div>
              <div className="sections-modal__actions">
                <button
                  type="submit"
                  className="btn sections-modal__save"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  className="btn sections-modal__cancel"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
