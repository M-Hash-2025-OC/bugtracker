"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/issues");
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(); 
    const interval = setInterval(fetchIssues, 15000);
    return () => clearInterval(interval);
  }, []);
	
  const updateStatus = async (issue, status) => {
    await fetch("/api/issues", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: issue.id, status }),
    });
    fetchIssues();
  };

  const renderTable = (data, includeActions = false) => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr className="bg-gray-200">
          <th className="px-4 py-2 border">Title / Repo</th>
          <th className="px-4 py-2 border">Reporter</th>
          {includeActions && <th className="px-4 py-2 border">Actions</th>}
          <th className="px-4 py-2 border">Created At</th>
          <th className="px-4 py-2 border">Status</th>
        </tr>
      </thead>
      <tbody>
        {(!data || data.length === 0) ? (
          <tr>
            <td colSpan={includeActions ? 5 : 4} className="px-4 py-3 text-center text-gray-500">
              No issues
            </td>
          </tr>
        ) : (
          data.map((issue) => (
            <tr key={issue.id}>
              <td className="px-4 py-3 border">{issue.title} / {issue.repo}</td>
              <td className="px-4 py-3 border">{issue.reporter}</td>
              {includeActions && (
                <td className="px-4 py-3 border space-x-2">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    onClick={() => updateStatus(issue, "VALID")}
                  >
                    Mark Valid
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => updateStatus(issue, "INVALID")}
                  >
                    Mark Invalid
                  </button>
                </td>
              )}
              <td className="px-4 py-3 border">{new Date(issue.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 border">{issue.status}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  if (loading) return <div className="p-8 text-center">Loading issues...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">GitHub Issues Dashboard</h1>
      <section>
        {renderTable(issues, true)}
      </section>
    </div>
  );
}
