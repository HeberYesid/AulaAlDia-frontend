import { useState, useEffect } from "react";
import { api } from "../../api/axios";
import { getApiErrorMessage } from '../../utils/apiErrorMessage';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicPeriods, setAcademicPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    grade_level: "",
    section: "",
    display_name: "",
    academic_period: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, gradesRes, sectionsRes, periodsRes] =
        await Promise.all([
          api.get("/api/v1/courses/courses/"),
          api.get("/api/v1/courses/grade-levels/"),
          api.get("/api/v1/courses/course-sections/"),
          api.get("/api/v1/courses/academic-settings/"), // Assuming periods are part of settings or similar, keeping it simple for now or fetch if separate endpoint
        ]);
      setCourses(coursesRes.data);
      setGradeLevels(gradesRes.data);
      setSections(sectionsRes.data);
      // setAcademicPeriods(periodsRes.data.results || periodsRes.data); // Adjust based on actual API
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
      academic_period: "",
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
      academic_period: course.academic_period || "",
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
      academic_period: "",
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
      if (!payload.academic_period) payload.academic_period = null;

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

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Gestión de Cursos</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Nuevo Curso
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="table mobile-card-view">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Mostrar</th>
              <th>Grado</th>
              <th>Sección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td data-label="Estado" colSpan="6" className="text-center">
                  Cargando...
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td data-label="Estado" colSpan="6" className="text-center">
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

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingId ? "Editar Curso" : "Nuevo Curso"}</h2>
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
