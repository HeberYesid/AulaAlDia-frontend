import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { getApiErrorMessage } from "../utils/apiErrorMessage";

export default function HierarchicalSelector({ onSelectSubject }) {
  const [gradeLevels, setGradeLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [gradesRes, subjectsRes] = await Promise.all([
        api.get("/api/v1/courses/grade-levels/"),
        api.get("/api/v1/courses/subjects/")
      ]);
      setGradeLevels(gradesRes.data);
      // We store all subjects. We will filter them based on selections.
      setSubjects(subjectsRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        getApiErrorMessage(err, {
          action: 'cargar grados y materias',
          fallback: 'No se pudieron cargar los grados y materias. Revisa tu acceso a la institucion e intentalo nuevamente.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesForGrade = async (gradeId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/courses/courses/?grade_level=${gradeId}`);
      // Usually would be filtered by query param if backend supported it,
      // or we can filter locally. Assuming the endpoint returns all for now, filter locally:
      const filtered = res.data.filter(c => c.grade_level === parseInt(gradeId, 10));
      setCourses(filtered);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        getApiErrorMessage(err, {
          action: 'cargar los cursos del grado seleccionado',
          fallback: 'No se pudieron cargar los cursos del grado seleccionado. Intentalo nuevamente.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (e) => {
    const gradeId = e.target.value;
    setSelectedGrade(gradeId);
    setSelectedCourse("");
    setSelectedSubject("");
    setCourses([]);
    if (gradeId) {
      fetchCoursesForGrade(gradeId);
    }
    if (onSelectSubject) onSelectSubject(null);
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedSubject("");
    if (onSelectSubject) onSelectSubject(null);
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    const subject = subjects.find(s => s.id === parseInt(subjectId, 10));
    if (onSelectSubject) onSelectSubject(subject);
  };

  // Filter subjects based on selection
  // In phase 3/4, subjects have `course_context`.
  const availableSubjects = subjects.filter(sub => {
    // If no grade selected, don't show any, OR show all?
    // According to hierarchical logic, we only show if matching.
    if (!selectedGrade) return true; // fallback to showing all if no hierarchy selected, or modify as needed.

    const ctx = sub.course_context;
    if (!ctx) return false; // Not part of the new hierarchy

    if (selectedCourse) {
      return ctx.course_id === parseInt(selectedCourse, 10);
    } else {
      // If grade is selected but course is not, maybe show all subjects for that grade
      // We would need grade_id in context, but we only have grade_level (name).
      // For now, if they select a grade, we wait for course selection.
      return false;
    }
  });


  return (
    <div className="hierarchical-selector card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Navegación Académica</h3>
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="grid cols-3" style={{ gap: "1rem" }}>
        <div>
          <label>Grado</label>
          <select 
            className="form-control" 
            value={selectedGrade} 
            onChange={handleGradeChange}
            disabled={loading}
          >
            <option value="">-- Todos --</option>
            {gradeLevels.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Curso / Sección</label>
          <select 
            className="form-control" 
            value={selectedCourse} 
            onChange={handleCourseChange}
            disabled={!selectedGrade || loading}
          >
            <option value="">-- Seleccione --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Materia</label>
          <select 
            className="form-control" 
            value={selectedSubject} 
            onChange={handleSubjectChange}
            disabled={!selectedCourse || loading}
          >
            <option value="">-- Seleccione --</option>
            {availableSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
