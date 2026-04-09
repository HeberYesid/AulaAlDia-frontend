import { useState, useEffect } from "react";
import { api } from "../../api/axios";
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import { unwrapListData } from '../../utils/pagination';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    grade_level: "",
    section: "",
    display_name: "",
    school_year: "",
    curriculum_id: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      const [coursesRes, gradesRes, sectionsRes, curriculumsRes, periodsRes] =
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
      setSchoolYears(unwrapListData(periodsRes.data));
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
        school_year: "",
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
        school_year: "",
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
      if (!payload.school_year) payload.school_year = null;
      if (!payload.curriculum_id) payload.curriculum_id = null;

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

  const getGradeName = (id) =>
    gradeLevels.find((g) => g.id === id)?.name || "Desconocido";
  const getSectionName = (id) =>
    sections.find((s) => s.id === id)?.name || "N/A";
  const getSchoolYearLabel = (id) => {
    const schoolYear = schoolYears.find((year) => year.id === id);
    if (!schoolYear) return "-";
    return schoolYear.label || `${schoolYear.start_date} - ${schoolYear.end_date}`;
  };

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
                <th>ID</th>
                <th>Nombre Mostrar</th>
                <th>Grado</th>
                <th>Sección</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="7" className="text-center">
                    Cargando...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="7" className="text-center">
                    No hay cursos registrados.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id}>
                    <td data-label="ID">{course.id}</td>
                    <td data-label="Nombre Mostrar">{course.display_name}</td>
                    <td data-label="Grado">{getGradeName(course.grade_level)}</td>
                    <td data-label="Sección">{course.section ? getSectionName(course.section) : "-"}</td>
                    <td data-label="Año">{getSchoolYearLabel(course.school_year)}</td>
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
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditModal(course)}
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
                <label>Grado Nivel</label>
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
              <div className="form-group">
                <label>Año Académico</label>
                <select
                  className="form-control"
                  value={formData.school_year}
                  onChange={(e) =>
                    setFormData({ ...formData, school_year: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccione un año</option>
                  {schoolYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.label || `${year.start_date} - ${year.end_date}`}
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
