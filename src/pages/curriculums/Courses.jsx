import { useState, useEffect } from "react";
import { api } from "../../api/axios";
import ConfirmDialog from '../../components/ConfirmDialog';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import { unwrapListData } from '../../utils/pagination';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [activeSchoolYearId, setActiveSchoolYearId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    grade_level: "",
    section: "",
    display_name: "",
    curriculum_id: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, gradesRes, sectionsRes, curriculumsRes, schoolYearsRes] =
        await Promise.all([
          api.get("/api/v1/courses/courses/"),
          api.get("/api/v1/courses/grade-levels/"),
          api.get("/api/v1/courses/course-sections/"),
          api.get("/api/v1/courses/curriculums/"),
          api.get("/api/v1/courses/school-years/"),
        ]);
      setCourses(unwrapListData(coursesRes.data));
      setGradeLevels(unwrapListData(gradesRes.data));
      setSections(unwrapListData(sectionsRes.data));
      setCurriculums(unwrapListData(curriculumsRes.data));
      const schoolYears = unwrapListData(schoolYearsRes.data);
      const activeSchoolYear = schoolYears.find((schoolYear) => schoolYear.is_active) || null;
      setActiveSchoolYearId(activeSchoolYear?.id ?? null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, {
        action: 'cargar los cursos',
        fallback: 'No se pudieron cargar los cursos. Verifica tu institucion activa e intentalo nuevamente.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
      setFormData({
        grade_level: "",
        section: "",
        display_name: "",
        curriculum_id: "",
        is_active: true,
      });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
      setFormData({
        grade_level: course.grade_level || "",
        section: course.section || "",
        display_name: course.display_name || "",
        school_year: course.school_year || "",
        curriculum_id: "",
        is_active: course.is_active,
      });
    setEditingId(course.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
      setFormData({
        grade_level: "",
        section: "",
        display_name: "",
        curriculum_id: "",
        is_active: true,
      });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...formData };
      if (!payload.section) payload.section = null;
      if (!payload.curriculum_id) payload.curriculum_id = null;

      if (editingId) {
        if (!payload.school_year) payload.school_year = null;
      } else {
        if (!activeSchoolYearId) {
          setError('No se pudo crear el curso porque no hay un año académico activo. Actívalo primero en Configuración Académica.');
          return;
        }
        payload.school_year = activeSchoolYearId;
      }

      if (editingId) {
        await api.patch(`/api/v1/courses/courses/${editingId}/`, payload);
      } else {
        await api.post("/api/v1/courses/courses/", payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, {
        action: editingId ? 'actualizar el curso' : 'crear el curso',
        fallback: editingId
          ? 'No se pudo actualizar el curso. Verifica grado, seccion y nombre para mostrar.'
          : 'No se pudo crear el curso. Verifica grado, seccion y nombre para mostrar.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (course) => {
    setError(null);
    setConfirmDelete(course);
  };

  const handleConfirmDelete = async () => {
    const course = confirmDelete;
    setConfirmDelete(null);

    if (!course) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/api/v1/courses/courses/${course.id}/`);
      await fetchData();
    } catch (err) {
      console.error(err);
      const detail = String(err?.response?.data?.detail || '').toLowerCase();
      const status = err?.response?.status;
      const hasDependencies =
        detail.includes('materias asociadas') ||
        detail.includes('dependent') ||
        detail.includes('protected');

      if (status === 403) {
        setError('No tienes permisos para eliminar cursos. Esta acción solo la puede realizar un administrador.');
      } else if (status === 409 && hasDependencies) {
        setError('No se puede eliminar el curso porque tiene materias o registros asociados.');
      } else if (status === 409) {
        setError('No se pudo eliminar el curso porque no hay un año académico activo o existe un conflicto de datos.');
      } else {
        setError(getApiErrorMessage(err, {
          action: 'eliminar el curso',
          fallback: 'No se pudo eliminar el curso. Puede tener registros asociados o permisos restringidos.',
        }));
      }
    } finally {
      setDeleting(false);
    }
  };

  const getGradeName = (id) =>
    gradeLevels.find((g) => g.id === id)?.name || "Desconocido";
  const getSectionName = (id) =>
    sections.find((s) => s.id === id)?.name || "N/A";

  const availableCurriculums = curriculums
    .filter((curriculum) => curriculum.is_active)
    .filter((curriculum) => curriculum.scope_type !== 'COURSE')
    .filter((curriculum) => {
      if (!formData.grade_level) return curriculum.scope_type !== 'GRADE';
      if (curriculum.scope_type !== 'GRADE') return true;
      return String(curriculum.grade_level) === String(formData.grade_level);
    });

  useEffect(() => {
    if (editingId) return;
    if (!formData.curriculum_id) return;

    const selectedExists = availableCurriculums.some(
      (curriculum) => String(curriculum.id) === String(formData.curriculum_id)
    );

    if (!selectedExists) {
      setFormData((prev) => ({ ...prev, curriculum_id: '' }));
    }
  }, [availableCurriculums, editingId, formData.curriculum_id]);

  return (
    <div className="admin-page sections-page courses-page">
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar curso?"
          message={`¿Estás seguro de que deseas eliminar el curso "${confirmDelete.display_name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="sections-page__header">
        <h1>Gestión de Cursos</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Nuevo Curso
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card sections-page__list-card">
        <div className="sections-page__list-header">
          <h2>Listado</h2>
        </div>

        <div className="table-container sections-table-container">
          <table className="table mobile-card-view sections-table courses-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Grado</th>
                <th>Sección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="5" className="text-center">
                    Cargando...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="5" className="text-center">
                    No hay cursos registrados.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td data-label="Nombre">{course.display_name}</td>
                    <td data-label="Grado">{getGradeName(course.grade_level)}</td>
                    <td data-label="Sección">{course.section ? getSectionName(course.section) : "-"}</td>
                    <td data-label="Estado">
                      <span
                        className={`badge ${
                          course.is_active ? "badge-success" : "badge-secondary"
                        }`}
                      >
                        {course.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="curriculums-table__actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openEditModal(course)}
                          disabled={submitting || deleting}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteClick(course)}
                          disabled={submitting || deleting}
                        >
                          Eliminar
                        </button>
                      </div>
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
            aria-labelledby="courses-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="courses-modal-title">{editingId ? "Editar Curso" : "Nuevo Curso"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre para Mostrar (ej. 6A)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Grado</label>
                <select
                  className="form-control"
                  value={formData.grade_level}
                  onChange={(e) =>
                    setFormData({ ...formData, grade_level: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccione un grado</option>
                  {gradeLevels.map((gl) => (
                    <option key={gl.id} value={gl.id}>
                      {gl.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Sección (Opcional)</label>
                <select
                  className="form-control"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                >
                  <option value="">Ninguna</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
              {!editingId && (
                <div className="form-group">
                  <label>Malla Curricular (Opcional)</label>
                  <select
                    className="form-control"
                    value={formData.curriculum_id}
                    onChange={(e) =>
                      setFormData({ ...formData, curriculum_id: e.target.value })
                    }
                  >
                    <option value="">Sin malla</option>
                    {availableCurriculums.map((curriculum) => (
                      <option key={curriculum.id} value={curriculum.id}>
                        {curriculum.name}
                      </option>
                    ))}
                  </select>
                  <p className="curriculum-subjects-form-group__hint" style={{ marginTop: '0.4rem' }}>
                    Si seleccionas una malla, el curso se crea con sus materias automáticamente.
                  </p>
                </div>
              )}
              <div className="form-group sections-modal__checkbox-group">
                <label className="sections-modal__checkbox" htmlFor="course-active-checkbox">
                  <span>Activo</span>
                  <input
                    id="course-active-checkbox"
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
