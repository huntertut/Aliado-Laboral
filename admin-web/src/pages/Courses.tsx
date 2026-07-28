import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import { BookOpen, Plus, Trash2, Edit2, Save, X, Play, FileText, LayoutList, ChevronDown, ChevronRight } from 'lucide-react';

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

const EMPTY_LESSON = { title: '', content: '', videoUrl: '', durationMin: '5', sortOrder: '1', attachmentUrl: '', attachmentName: '' };
const EMPTY_MODULE = { title: '', sortOrder: '1' };
const CATEGORY_LABELS: Record<string, string> = {
  defense: '⚖️ Defensa Laboral',
  retirement: '🏖️ Jubilación y Pensiones',
  freelancer: '💼 Freelancer e Independiente',
  bureaucracy: '🏛️ Trámites y Burocracia',
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '99', category: 'defense', coverImage: '' });
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);

  // Edit states
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonForm, setEditLessonForm] = useState(EMPTY_LESSON);

  // UI visibility
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [saving, setSaving] = useState(false);

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

  const refreshSelected = async (id: string) => {
    try {
      const detail = await api.get(`/courses/${id}`);
      setSelectedCourse(detail.data.course);
    } catch (err) {
      console.error('Error refreshing course:', err);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  // ── COURSE CRUD ────────────────────────────────────
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/courses/admin/create', { ...courseForm, price: parseFloat(courseForm.price) });
      setShowAddCourse(false);
      setCourseForm({ title: '', description: '', price: '99', category: 'defense', coverImage: '' });
      fetchCourses();
    } catch { alert('Error al crear el curso.'); }
    finally { setSaving(false); }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar permanentemente el curso "${title}" y todas sus lecciones?`)) return;
    try {
      await api.delete(`/courses/admin/delete/${id}`);
      setSelectedCourse(null);
      fetchCourses();
    } catch { alert('Error al eliminar curso.'); }
  };

  const handleSelectCourse = async (course: Course) => {
    try {
      const detail = await api.get(`/courses/${course.id}`);
      setSelectedCourse(detail.data.course);
      setExpandedModules(new Set());
    } catch (err) {
      console.error('Error fetching course details:', err);
    }
  };

  // ── MODULE CRUD ────────────────────────────────────
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSaving(true);
    try {
      await api.post('/courses/admin/module', {
        courseId: selectedCourse.id,
        title: moduleForm.title,
        sortOrder: parseInt(moduleForm.sortOrder),
      });
      setShowAddModule(false);
      setModuleForm(EMPTY_MODULE);
      await refreshSelected(selectedCourse.id);
      fetchCourses();
    } catch { alert('Error al agregar el módulo.'); }
    finally { setSaving(false); }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!selectedCourse) return;
    if (!window.confirm(`¿Eliminar el módulo "${moduleTitle}" y todas sus lecciones?`)) return;
    try {
      await api.delete(`/courses/admin/module/${moduleId}`);
      await refreshSelected(selectedCourse.id);
      fetchCourses();
    } catch { alert('Error al eliminar el módulo.'); }
  };

  // ── LESSON CRUD ────────────────────────────────────
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedModuleId) return;
    setSaving(true);
    try {
      await api.post('/courses/admin/lesson', {
        moduleId: selectedModuleId,
        ...lessonForm,
        durationMin: parseInt(lessonForm.durationMin),
        sortOrder: parseInt(lessonForm.sortOrder),
      });
      setShowAddLesson(false);
      setLessonForm(EMPTY_LESSON);
      await refreshSelected(selectedCourse.id);
      fetchCourses();
    } catch { alert('Error al agregar la lección.'); }
    finally { setSaving(false); }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      durationMin: String(lesson.durationMin || 5),
      sortOrder: String(lesson.sortOrder || 1),
      attachmentUrl: lesson.attachmentUrl || '',
      attachmentName: lesson.attachmentName || '',
    });
  };

  const handleSaveLesson = async () => {
    if (!editingLesson || !selectedCourse) return;
    setSaving(true);
    try {
      await api.put(`/courses/admin/lesson/${editingLesson.id}`, {
        ...editLessonForm,
        durationMin: parseInt(editLessonForm.durationMin),
        sortOrder: parseInt(editLessonForm.sortOrder),
      });
      setEditingLesson(null);
      await refreshSelected(selectedCourse.id);
    } catch { alert('Error al guardar la lección.'); }
    finally { setSaving(false); }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!selectedCourse) return;
    if (!window.confirm(`¿Eliminar la lección "${lessonTitle}"?`)) return;
    try {
      await api.delete(`/courses/admin/lesson/${lessonId}`);
      await refreshSelected(selectedCourse.id);
      fetchCourses();
    } catch { alert('Error al eliminar la lección.'); }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
      {/* Header */}
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

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Nuevo Curso</h3>
              <button onClick={() => setShowAddCourse(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título del Curso *</label>
                <input required value={courseForm.title} onChange={e => setCourseForm(f => ({...f, title: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Cómo reclamar tu liquidación" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
                <textarea required rows={3} value={courseForm.description} onChange={e => setCourseForm(f => ({...f, description: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Descripción del curso..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select value={courseForm.category} onChange={e => setCourseForm(f => ({...f, category: e.target.value}))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio (MXN)</label>
                  <input type="number" value={courseForm.price} onChange={e => setCourseForm(f => ({...f, price: e.target.value}))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL de Portada (imagen)</label>
                <input value={courseForm.coverImage} onChange={e => setCourseForm(f => ({...f, coverImage: e.target.value}))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddCourse(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Creando...' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 min-h-0">
          {/* Course List */}
          <div className="w-1/3 bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Cursos ({courses.length})</h2>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No hay cursos aún.</p>
                <p className="text-slate-400 text-xs mt-1">Crea el primero con el botón de arriba.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCourse(c)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCourse?.id === c.id
                        ? 'bg-blue-50 border-blue-400 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{c.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{CATEGORY_LABELS[c.category] || c.category} · ${Number(c.price).toFixed(0)} MXN</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteCourse(c.id, c.title); }}
                        className="text-red-400 hover:text-red-600 p-1 rounded flex-shrink-0"
                        title="Eliminar curso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Detail */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-y-auto">
            {!selectedCourse ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <LayoutList className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-medium">Selecciona un curso de la lista</p>
                <p className="text-sm mt-1">para ver y editar su contenido</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Course header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedCourse.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{selectedCourse.description}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{CATEGORY_LABELS[selectedCourse.category] || selectedCourse.category}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">${Number(selectedCourse.price).toFixed(0)} MXN</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedCourse.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {selectedCourse.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowAddModule(true); setShowAddLesson(false); }}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Módulo
                  </button>
                </div>

                {/* Add Module Form */}
                {showAddModule && (
                  <div className="mb-5 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3">Agregar Módulo</h4>
                    <form onSubmit={handleCreateModule} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del Módulo</label>
                        <input required value={moduleForm.title} onChange={e => setModuleForm(f => ({...f, title: e.target.value}))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: Módulo 1 - Fundamentos" />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Orden</label>
                        <input type="number" value={moduleForm.sortOrder} onChange={e => setModuleForm(f => ({...f, sortOrder: e.target.value}))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? '...' : 'Agregar'}
                      </button>
                      <button type="button" onClick={() => setShowAddModule(false)} className="px-3 py-2 text-slate-500 hover:text-slate-700">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* Modules & Lessons */}
                {selectedCourse.modules.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Este curso no tiene módulos aún. Agrega el primero.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCourse.modules.map((mod) => (
                      <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* Module header */}
                        <div
                          className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => toggleModule(mod.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedModules.has(mod.id) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                            <span className="font-semibold text-slate-700 text-sm">{mod.title}</span>
                            <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{mod.lessons.length} lecciones</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedModuleId(mod.id); setShowAddLesson(true); setShowAddModule(false); }}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Lección
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteModule(mod.id, mod.title); }}
                              className="text-red-400 hover:text-red-600 p-1 rounded"
                              title="Eliminar módulo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Lessons list */}
                        {expandedModules.has(mod.id) && (
                          <div className="divide-y divide-slate-100">
                            {/* Add Lesson Form */}
                            {showAddLesson && selectedModuleId === mod.id && (
                              <div className="p-4 bg-blue-50">
                                <h4 className="text-sm font-bold text-blue-800 mb-3">Nueva Lección en "{mod.title}"</h4>
                                <form onSubmit={handleCreateLesson} className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
                                      <input required value={lessonForm.title} onChange={e => setLessonForm(f => ({...f, title: e.target.value}))}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Título de la lección" />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">URL de Video</label>
                                      <input value={lessonForm.videoUrl} onChange={e => setLessonForm(f => ({...f, videoUrl: e.target.value}))}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="https://..." />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Contenido (Markdown)</label>
                                    <textarea rows={4} value={lessonForm.content} onChange={e => setLessonForm(f => ({...f, content: e.target.value}))}
                                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" placeholder="# Título&#10;## Subtítulo&#10;Contenido en markdown..." />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">URL Adjunto (PDF/archivo)</label>
                                      <input value={lessonForm.attachmentUrl} onChange={e => setLessonForm(f => ({...f, attachmentUrl: e.target.value}))}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="https://...checklist.pdf" />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del Adjunto</label>
                                      <input value={lessonForm.attachmentName} onChange={e => setLessonForm(f => ({...f, attachmentName: e.target.value}))}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="checklist-derechos.pdf" />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowAddLesson(false)} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                    <button type="submit" disabled={saving} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                                      {saving ? 'Guardando...' : 'Agregar Lección'}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}

                            {mod.lessons.length === 0 ? (
                              <p className="text-xs text-slate-400 p-4 text-center">Sin lecciones. Usa "+ Lección" para agregar.</p>
                            ) : (
                              mod.lessons.map((les) => (
                                <div key={les.id} className="p-3">
                                  {editingLesson?.id === les.id ? (
                                    /* Edit Lesson Form */
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                      <h5 className="text-sm font-bold text-amber-800 mb-3">Editando: {les.title}</h5>
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Título</label>
                                            <input value={editLessonForm.title} onChange={e => setEditLessonForm(f => ({...f, title: e.target.value}))}
                                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">URL de Video</label>
                                            <input value={editLessonForm.videoUrl} onChange={e => setEditLessonForm(f => ({...f, videoUrl: e.target.value}))}
                                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-mono" placeholder="https://..." />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-slate-600 mb-1">Contenido (Markdown)</label>
                                          <textarea rows={5} value={editLessonForm.content} onChange={e => setEditLessonForm(f => ({...f, content: e.target.value}))}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none font-mono" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">URL Adjunto (PDF)</label>
                                            <input value={editLessonForm.attachmentUrl} onChange={e => setEditLessonForm(f => ({...f, attachmentUrl: e.target.value}))}
                                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-mono" placeholder="https://...archivo.pdf" />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del Adjunto</label>
                                            <input value={editLessonForm.attachmentName} onChange={e => setEditLessonForm(f => ({...f, attachmentName: e.target.value}))}
                                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="checklist.pdf" />
                                          </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <button onClick={() => setEditingLesson(null)} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                          <button onClick={handleSaveLesson} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60">
                                            <Save className="w-3 h-3" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Lesson row */
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2 min-w-0">
                                        {les.videoUrl
                                          ? <Play className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                          : <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        }
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-slate-700 truncate">{les.title}</p>
                                          <div className="flex gap-2 mt-0.5">
                                            <span className="text-xs text-slate-400">{les.durationMin} min</span>
                                            {les.attachmentUrl && (
                                              <span className="text-xs text-green-600 bg-green-50 px-1.5 rounded">📎 {les.attachmentName || 'adjunto'}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleEditLesson(les)} className="text-amber-500 hover:text-amber-700 p-1 rounded" title="Editar lección">
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteLesson(les.id, les.title)} className="text-red-400 hover:text-red-600 p-1 rounded" title="Eliminar lección">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
