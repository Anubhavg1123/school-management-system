import React, { useState, useEffect } from 'react';
import { aiInsightsApi, ExplainableInsight } from '../../api/aiInsights';

export const SmartInsightsHub: React.FC = () => {
  const [nlQuery, setNlQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const [insights, setInsights] = useState<ExplainableInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Drafting assistant state
  const [draftTopic, setDraftTopic] = useState('');
  const [draftAudience, setDraftAudience] = useState('Students and Parents');
  const [draftPoints, setDraftPoints] = useState('');
  const [draftResult, setDraftResult] = useState<any>(null);
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await aiInsightsApi.getAdministrativeInsights();
      if (res?.data?.insights) {
        setInsights(res.data.insights);
      }
    } catch (err: any) {
      console.error('Failed to load insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await aiInsightsApi.processQuery(nlQuery);
      setQueryResult(res.data);
    } catch (err: any) {
      setQueryError(err.response?.data?.error?.message || 'Failed to process natural query.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTopic.trim()) return;

    setDraftLoading(true);
    try {
      const points = draftPoints
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);
      const res = await aiInsightsApi.generateDraftNotice({
        topic: draftTopic,
        targetAudience: draftAudience,
        keyPoints: points.length > 0 ? points : ['Institutional schedule update', 'Refer to portal for specifics'],
      });
      setDraftResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to draft notice.');
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Smart Operations & Explainable Insights Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Safe read-only AI natural-language reporting, algorithmic institutional metrics, and communication assistant.
          </p>
        </div>
        <button
          onClick={loadInsights}
          className="mt-3 md:mt-0 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          🔄 Refresh Insights
        </button>
      </div>

      {/* Natural Language Query Box */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>🔍</span> Natural Language Institutional Search
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Ask questions in plain English (e.g. <em>"Show students with low attendance"</em>, <em>"How much fee is outstanding"</em>, <em>"Today's visitors"</em>).
        </p>

        <form onSubmit={handleQuerySubmit} className="flex gap-3">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={queryLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
          >
            {queryLoading ? 'Analyzing...' : 'Ask AI'}
          </button>
        </form>

        {queryError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            ❌ {queryError}
          </div>
        )}

        {queryResult && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded">
                Intent: {queryResult.intent}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {queryResult.count} matching records found
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
              {queryResult.interpretedQuery}
            </p>

            {queryResult.totalOutstandingFormatted && (
              <div className="mb-3 text-lg font-bold text-amber-600">
                Total Outstanding: {queryResult.totalOutstandingFormatted}
              </div>
            )}

            {/* Results Table */}
            {queryResult.results && queryResult.results.length > 0 ? (
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 uppercase">
                    <tr>
                      {Object.keys(queryResult.results[0]).map((key) => (
                        <th key={key} className="px-3 py-2">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.results.map((row: any, i: number) => (
                      <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-3 py-2">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No records matching query criteria.</p>
            )}
          </div>
        )}
      </div>

      {/* Explainable Insights Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>📊</span> Explainable Institutional Insights
        </h2>

        {insightsLoading ? (
          <div className="text-center py-8 text-gray-500">Evaluating institutional metrics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        insight.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : insight.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {insight.severity}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{insight.category}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">{insight.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">{insight.summary}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-xs space-y-1.5">
                  <div className="text-gray-500">
                    <strong className="text-gray-700 dark:text-gray-300">Rule:</strong> {insight.calculationRule}
                  </div>
                  <div className="text-gray-500">
                    <strong className="text-gray-700 dark:text-gray-300">Source:</strong> {insight.dataSource}
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded text-xs mt-2">
                    💡 <strong>Action:</strong> {insight.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Notice Drafting Assistant */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>✍️</span> AI Communication Drafting Assistant (Human-in-the-Loop)
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Draft official announcements or parent notices. All AI drafts require administrative verification before publication.
        </p>

        <form onSubmit={handleGenerateDraft} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Topic / Event</label>
            <input
              type="text"
              value={draftTopic}
              onChange={(e) => setDraftTopic(e.target.value)}
              placeholder="e.g. Science Fair Schedule Update"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
            <select
              value={draftAudience}
              onChange={(e) => setDraftAudience(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
            >
              <option value="Students and Parents">Students and Parents</option>
              <option value="Faculty and Staff">Faculty and Staff</option>
              <option value="All Institution Members">All Institution Members</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Key Points (one per line)
            </label>
            <textarea
              rows={3}
              value={draftPoints}
              onChange={(e) => setDraftPoints(e.target.value)}
              placeholder="e.g. Submission deadline Oct 15&#10;Held in Main Auditorium"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={draftLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
            >
              {draftLoading ? 'Generating Draft...' : 'Generate Draft Notice'}
            </button>
          </div>
        </form>

        {draftResult && (
          <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{draftResult.draftTitle}</h4>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">
                {draftResult.status}
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 font-sans p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              {draftResult.draftContent}
            </pre>
            <p className="text-xs text-gray-400 mt-2 italic">⚠️ {draftResult.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
