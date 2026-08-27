import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">404 - Page Not Found</h2>
        <p className="text-xs text-slate-600">
          The requested page does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
