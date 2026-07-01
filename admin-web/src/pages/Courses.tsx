import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import { BookOpen, Plus, Trash2, Play, FileText, LayoutList } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  durationMin: number;
  sortOrder: number;
  attachmentUrl: string;
  attachmentName: string;
}

interface Module {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  coverImage: string;
  isActive: boolean;
  modules: Module[];
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Forms states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    price: '99',
    category: 'defense',
    coverImage: '',
  });

  const [moduleForm, setModuleForm] = useState({
    title: '',
    sortOrder: '1',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    durationMin: '5',
    sortOrder: '1',
    attachmentUrl: '',
    attachmentName: '',
  });

  // UI state
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/courses/admin/create', {
        ...courseForm,
        price: parseFloat(courseForm.price),
      });
      alert('✅ Curso creado con éxito.');
      setShowAddCourse(false);
      setCourseForm({ title: '', description: '', price: '99', category: 'defense', coverImage: '' });
      fetchCourses();
    } catch (err) {
      alert('Error al crear el curso.');
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.post('/courses/admin/module', {
        courseId: selectedCourse.id,
        title: moduleForm.title,
        sortOrder: parseInt(moduleForm.sortOrder),
      });
      alert('✅ Módulo agregado.');
      setShowAddModule(false);
      setModuleForm({ title: '', sortOrder: '1' });
      // Refresh details
      const detail = await api.get(`/courses/${selectedCourse.id}`);
      setSelectedCourse(detail.data.course);
      fetchCourses();
    } catch (err) {
      alert('Error al agregar el módulo.');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedModuleId) return;
    try {
      await api.post('/courses/admin/lesson', {
        moduleId: selectedModuleId,
        ...lessonForm,
        durationMin: parseInt(lessonForm.durationMin),
        sortOrder: parseInt(lessonForm.sortOrder),
      });
      alert('✅ Lección agregada con éxito.');
      setShowAddLesson(false);
      setLessonForm({ title: '', content: '', videoUrl: '', durationMin: '5', sortOrder: '1', attachmentUrl: '', attachmentName: '' });
      // Refresh details
      const detail = await api.get(`/courses/${selectedCourse.id}`);
      setSelectedCourse(detail.data.course);
      fetchCourses();
    } catch (err) {
      alert('Error al agregar la lección.');
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el curso "${title}" y todas sus lecciones asociadas?`)) {
      try {
        await api.delete(`/courses/admin/delete/${id}`);
        alert('✅ Curso eliminado.');
        setSelectedCourse(null);
        fetchCourses();
      } catch (err) {
        alert('Error al eliminar curso.');
      }
    }
  };

  const handleSelectCourse = async (course: Course) => {
    try {
      const detail = await api.get(`/courses/${course.id}`);
      setSelectedCourse(detail.data.course);
    } catch (err) {
      console.error('Error fetching course details:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
          Módulo de Cursos y Capacitación
        </h1>
        <button
          onClick={() => setShowAddCourse(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 min-h-0">
          {/* List Section */}
          <div className="w-1/3 bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-700 mb-4">Cursos Disponibles</h2>
            {courses.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay cursos registrados en el sistema.</p>
            ) : (
              <div className="space-y-3">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCourse(c)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCourse?.id === c.id
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-sm">{c.title}</h3>
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        ${c.price} MXN
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {c.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(c.id, c.title);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto">
            {selectedCourse ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedCourse.title}</h2>
                      <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full mt-2 inline-block">
                        Categoría: {selectedCourse.category}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddModule(true)}
                        className="flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar Módulo
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-4 leading-relaxed">{selectedCourse.description}</p>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                    <LayoutList className="w-5 h-5 mr-2 text-slate-500" />
                    Temario y Módulos
                  </h3>

                  {selectedCourse.modules?.length === 0 ? (
                    <p className="text-slate-500 text-sm">Este curso aún no tiene módulos agregados.</p>
                  ) : (
                    <div className="space-y-6">
                      {selectedCourse.modules?.map((m) => (
                        <div key={m.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50/30">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-slate-800">{m.title}</h4>
                            <button
                              onClick={() => {
                                setSelectedModuleId(m.id);
                                setShowAddLesson(true);
                              }}
                              className="text-xs flex items-center px-2 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Nueva Lección
                            </button>
                          </div>

                          {m.lessons?.length === 0 ? (
                            <p className="text-xs text-slate-400">No hay lecciones en este módulo.</p>
                          ) : (
                            <div className="space-y-2">
                              {m.lessons?.map((l) => (
                                <div key={l.id} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                      {l.videoUrl ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-slate-800 text-sm">{l.title}</h5>
                                      <p className="text-[10px] text-slate-400">⏱️ {l.durationMin} min | Orden: {l.sortOrder}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <BookOpen className="w-12 h-12 text-slate-300" />
                <p>Selecciona un curso de la lista para gestionar sus módulos y lecciones.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* modal create course */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleCreateCourse} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Crear Nuevo Curso</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Título del Curso</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                  placeholder="Ej. Domina la Modalidad 40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Descripción</label>
                <textarea
                  required
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                  placeholder="Detalles del curso..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Precio (MXN)</label>
                  <input
                    type="number"
                    required
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Categoría</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="retirement">Pensiones y Retiro</option>
                    <option value="defense">Defensa Laboral</option>
                    <option value="freelancer">Freelancers</option>
                    <option value="bureaucracy">Hacks Trámites</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">URL Portada Imagen</label>
                <input
                  type="text"
                  value={courseForm.coverImage}
                  onChange={(e) => setCourseForm({ ...courseForm, coverImage: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Crear Curso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* modal create module */}
      {showAddModule && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleCreateModule} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Agregar Módulo</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Título del Módulo</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                  placeholder="Ej. Módulo 1: Fundamentos"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Orden de Visualización</label>
                <input
                  type="number"
                  required
                  value={moduleForm.sortOrder}
                  onChange={(e) => setModuleForm({ ...moduleForm, sortOrder: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddModule(false)}
                className="px-3.5 py-1.5 border rounded-lg text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                Agregar Módulo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* modal create lesson */}
      {showAddLesson && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleCreateLesson} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800">Agregar Lección</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Título de la Lección</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                  placeholder="Ej. Lección 1: Introducción"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Contenido Escrito (Markdown)</label>
                <textarea
                  rows={4}
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm font-mono"
                  placeholder="Puedes usar formato markdown..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">URL del Video (opcional)</label>
                  <input
                    type="text"
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="Vimeo / YouTube link"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Duración (min)</label>
                    <input
                      type="number"
                      required
                      value={lessonForm.durationMin}
                      onChange={(e) => setLessonForm({ ...lessonForm, durationMin: e.target.value })}
                      className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Orden</label>
                    <input
                      type="number"
                      required
                      value={lessonForm.sortOrder}
                      onChange={(e) => setLessonForm({ ...lessonForm, sortOrder: e.target.value })}
                      className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">URL Herramienta Adjunta (PDF/XLSX)</label>
                  <input
                    type="text"
                    value={lessonForm.attachmentUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, attachmentUrl: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Nombre de la Herramienta</label>
                  <input
                    type="text"
                    value={lessonForm.attachmentName}
                    onChange={(e) => setLessonForm({ ...lessonForm, attachmentName: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="Checklist.pdf"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddLesson(false)}
                className="px-3.5 py-1.5 border rounded-lg text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                Agregar Lección
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
