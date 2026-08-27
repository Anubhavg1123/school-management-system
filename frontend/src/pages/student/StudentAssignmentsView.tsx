import React, { useState } from 'react';
import { BookOpen, FileText, CheckCircle2, Clock, Upload } from 'lucide-react';

export const StudentAssignmentsView: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          Student Assignments & Submissions
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View assigned coursework, due dates, submission deadlines, and submit completed files.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm text-center space-y-2">
        <BookOpen className="w-10 h-10 text-indigo-600 mx-auto opacity-80" />
        <h3 className="text-base font-bold text-gray-900">Personalized Assignment Feed</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Assignments assigned to your class section appear automatically in your feed with real-time deadline validation.
        </p>
      </div>
    </div>
  );
};
