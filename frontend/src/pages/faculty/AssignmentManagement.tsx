import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Send,
  Calendar,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Bell,
  Loader2,
  Megaphone,
} from 'lucide-react';
import {
  facultyPortalApi,
  AssignmentItem,
  ClassAnnouncement,
  AssignedClass,
} from '../../api/facultyPortal';

export const AssignmentManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);
  const [activeTab, setActiveTab] = useState<'ASSIGNMENTS' | 'ANNOUNCEMENTS'>('ASSIGNMENTS');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Assignment Form State
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    sectionId: '',
    title: '',
    description: '',
    dueDate: '',
    attachmentTitle: '',
    attachmentUrl: '',
  });

  // New Announcement Form State
  const [showAnnounceModal, setShowAnnounceModal] = useState<boolean>(false);
  const [announceData, setAnnounceData] = useState({
    sectionId: '',
    title: '',
    content: '',
    category: 'ACADEMIC',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const classesData = await facultyPortalApi.getAssignedClasses();
      const loadedClasses = classesData.subjectAssignments || [];
      setAssignedClasses(loadedClasses);

      if (loadedClasses.length > 0) {
        setFormData((prev) => ({ ...prev, sectionId: loadedClasses[0].sectionId }));
        setAnnounceData((prev) => ({ ...prev, sectionId: loadedClasses[0].sectionId }));
      }

      const [assignList, announceList] = await Promise.all([
        facultyPortalApi.getAssignments(),
        facultyPortalApi.getAnnouncements(),
      ]);

      setAssignments(assignList);
      setAnnouncements(announceList);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const targetClass = assignedClasses.find((c) => c.sectionId === formData.sectionId);
      if (!targetClass) {
        throw new Error('Selected class section not found.');
      }

      const attachments = formData.attachmentUrl
        ? [{ title: formData.attachmentTitle || 'Attachment File', fileUrl: formData.attachmentUrl }]
        : undefined;

      await facultyPortalApi.createAssignment({
        classId: targetClass.classId,
        sectionId: targetClass.sectionId,
        subjectId: targetClass.subjectId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        attachments,
      });

      setSuccessMsg('Draft assignment created successfully!');
      setShowAssignModal(false);
      setFormData({
        sectionId: assignedClasses[0]?.sectionId || '',
        title: '',
        description: '',
        dueDate: '',
        attachmentTitle: '',
        attachmentUrl: '',
      });

      const updated = await facultyPortalApi.getAssignments();
      setAssignments(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishAssignment = async (id: string) => {
    try {
      setLoading(true);
      await facultyPortalApi.publishAssignment(id);
      setSuccessMsg('Assignment published! Enrolled students have been notified.');
      const updated = await facultyPortalApi.getAssignments();
      setAssignments(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to publish assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const targetClass = assignedClasses.find((c) => c.sectionId === announceData.sectionId);
      if (!targetClass) {
        throw new Error('Selected class section not found.');
      }

      await facultyPortalApi.createAnnouncement({
        classId: targetClass.classId,
        sectionId: targetClass.sectionId,
        title: announceData.title,
        content: announceData.content,
        category: announceData.category,
      });

      setSuccessMsg('Class announcement published!');
      setShowAnnounceModal(false);
      setAnnounceData({
        sectionId: assignedClasses[0]?.sectionId || '',
        title: '',
        content: '',
        category: 'ACADEMIC',
      });

      const updated = await facultyPortalApi.getAnnouncements();
      setAnnouncements(updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading faculty assignments & announcements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Assignment & Announcement Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create course tasks, publish homework assignments, and broadcast class announcements to assigned sections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnnounceModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-sm rounded-lg border border-amber-200 transition-colors"
          >
            <Megaphone className="w-4 h-4" /> Post Notice
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Assignment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell className="w-4 h-4" /> Class Announcements ({announcements.length})
        </button>
      </div>

      {/* Assignments Tab */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 text-base">No assignments created yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                Click "Create Assignment" to assign coursework to your students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                        {item.subject?.code} — {item.class?.name} ({item.section?.name})
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    </div>

                    {item.attachments && item.attachments.length > 0 && (
                      <span className="flex items-center gap-1 font-medium text-indigo-600">
                        <Paperclip className="w-3.5 h-3.5" /> {item.attachments.length} file(s)
                      </span>
                    )}

                    {item.status === 'DRAFT' ? (
                      <button
                        onClick={() => handlePublishAssignment(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                      >
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    ) : (
                      <span className="font-semibold text-gray-600">
                        Targets: {item._count?.targets || 0} students
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 text-base">No announcements posted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-xs rounded">
                        {ann.category}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {ann.class?.name} — {ann.section?.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{ann.title}</h3>
                  <p className="text-sm text-gray-700">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Create New Assignment
            </h2>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Class Section</label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {assignedClasses.map((ac) => (
                    <option key={ac.id} value={ac.sectionId}>
                      {ac.className} — {ac.sectionName} ({ac.subjectName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures Problem Set 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide clear guidelines for students..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Attachment Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Reference Doc"
                    value={formData.attachmentTitle}
                    onChange={(e) => setFormData({ ...formData, attachmentTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">File URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://gcs.../doc.pdf"
                    value={formData.attachmentUrl}
                    onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-600" />
              Post Class Announcement
            </h2>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Section</label>
                <select
                  value={announceData.sectionId}
                  onChange={(e) => setAnnounceData({ ...announceData, sectionId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  {assignedClasses.map((ac) => (
                    <option key={ac.id} value={ac.sectionId}>
                      {ac.className} — {ac.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={announceData.category}
                  onChange={(e) => setAnnounceData({ ...announceData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                >
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="EXAM_REMINDER">EXAM REMINDER</option>
                  <option value="ROOM_CHANGE">ROOM CHANGE</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="Notice Headline"
                  value={announceData.title}
                  onChange={(e) => setAnnounceData({ ...announceData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notice Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write message content for students..."
                  value={announceData.content}
                  onChange={(e) => setAnnounceData({ ...announceData, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
