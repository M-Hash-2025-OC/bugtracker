"use client";

import { useState, useEffect } from "react";

const LS_KEYS = {
  VALID: "gh_valid_issues_v1",
  INVALID: "gh_invalid_issues_v1",
  ISSUELESS: "gh_issueless_repos_v1",
};

export default function Page() {
  const [issues, setIssues] = useState([]);
  const [issuelessRepos, setIssuelessRepos] = useState([]);
  const [validIssues, setValidIssues] = useState([]);
  const [invalidIssues, setInvalidIssues] = useState([]);
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const POLL_INTERVAL = 15000;

  const idsFrom = (arr) => (arr && arr.length ? arr.map((i) => i.id) : []);

  const uniqueById = (arr) => {
    const seen = new Set();
    const out = [];
    for (const it of arr) {
      if (!it || typeof it.id === "undefined") continue;
      if (!seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  };

  useEffect(() => {
    try {
      const pValid = JSON.parse(localStorage.getItem(LS_KEYS.VALID) || "[]");
      const pInvalid = JSON.parse(localStorage.getItem(LS_KEYS.INVALID) || "[]");
      const pIssueless = JSON.parse(localStorage.getItem(LS_KEYS.ISSUELESS) || "[]");

      if (Array.isArray(pValid) && pValid.length) setValidIssues(pValid);
      if (Array.isArray(pInvalid) && pInvalid.length) setInvalidIssues(pInvalid);
      if (Array.isArray(pIssueless) && pIssueless.length) setIssuelessRepos(pIssueless);

      fetchIssues(pValid || [], pInvalid || []);
    } catch (err) {
      console.warn("Failed to load persisted lists:", err);
      fetchIssues();
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.VALID, JSON.stringify(validIssues));
      localStorage.setItem(LS_KEYS.INVALID, JSON.stringify(invalidIssues));
      localStorage.setItem(LS_KEYS.ISSUELESS, JSON.stringify(issuelessRepos));
    } catch (err) {
      console.warn("Failed to persist lists:", err);
    }
  }, [validIssues, invalidIssues, issuelessRepos]);

  useEffect(() => {
    const interval = setInterval(() => fetchIssues(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [validIssues, invalidIssues]);

  async function fetchIssues(validOverride = null, invalidOverride = null) {
    setError("");
    try {
      const validArr = Array.isArray(validOverride) ? validOverride : validIssues;
      const invalidArr = Array.isArray(invalidOverride) ? invalidOverride : invalidIssues;

      const validIds = idsFrom(validArr).join(",");
      const invalidIds = idsFrom(invalidArr).join(",");

      const q = new URLSearchParams();
      if (validIds) q.set("validIds", validIds);
      if (invalidIds) q.set("invalidIds", invalidIds);

      const res = await fetch(`/api/issues${q.toString() ? `?${q.toString()}` : ""}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status} ${text}`);
      }

      const data = await res.json();
      if (!data || !("issues" in data) || !("issuelessRepos" in data)) {
        setError("Invalid data received from server");
        setLoading(false);
        return;
      }

      const reposWithIssuesSet = new Set((data.issues || []).map((i) => i.repo).filter(Boolean));

      setIssuelessRepos((prev) => {
        const prevMap = new Map(prev.map((r) => [r.name, r]));
        for (const name of reposWithIssuesSet) {
          if (prevMap.has(name)) prevMap.delete(name);
        }
        for (const r of data.issuelessRepos || []) {
          if (!prevMap.has(r.name) && !reposWithIssuesSet.has(r.name)) {
            prevMap.set(r.name, r);
          }
        }
        return Array.from(prevMap.values());
      });

      setIssues((prev) => {
        const existingIdSet = new Set([
          ...prev.map((i) => i.id),
          ...validIssues.map((i) => i.id),
          ...invalidIssues.map((i) => i.id),
        ]);
        const newIssues = (data.issues || []).filter((i) => !existingIdSet.has(i.id));
        if (!newIssues.length) return prev;
        const merged = [...prev, ...newIssues];
        return uniqueById(merged);
      });
    } catch (err) {
      console.error("fetchIssues error:", err);
      setError(typeof err === "string" ? err : err.message || "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }

  const markValid = (issue) => {
    setValidIssues((prev) => uniqueById([...prev, issue]));
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
  };

  const markInvalid = (issue) => {
    setInvalidIssues((prev) => uniqueById([...prev, issue]));
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
  };

  const toggleExpand = (id) => {
    setExpandedIssueId((prev) => (prev === id ? null : id));
  };

  const exportCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const rows = [headers.join(",")];
    for (const row of data) {
      const vals = headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`);
      rows.push(vals.join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const parseBody = (body) => {
    if (!body) return null;
    const elements = [];
    let lastIndex = 0;
    // match ![alt](url)
    const regex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = regex.exec(body)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        elements.push(body.substring(lastIndex, index));
      }
      elements.push(
        <img
          key={index}
          src={match[1]}
          alt=""
          className="max-w-full rounded-md shadow-sm my-2"
        />
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < body.length) {
      elements.push(body.substring(lastIndex));
    }
    return elements;
  };

  const renderTable = (data, includeActions = false) => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-200">
          <th className="px-4 py-2 border">Title / Repo</th>
          <th className="px-4 py-2 border">Reporter (Team/User)</th>
          {includeActions && <th className="px-4 py-2 border">Actions</th>}
          <th className="px-4 py-2 border">Created At</th>
        </tr>
      </thead>
      <tbody>
        {(!data || data.length === 0) ? (
          <tr>
            <td colSpan={includeActions ? 4 : 3} className="px-4 py-3 text-center text-gray-500">
              No issues / repos
            </td>
          </tr>
        ) : (
          data.map((issue) => (
            <tr
              key={issue.id ?? issue.name}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition transform hover:-translate-y-1 hover:shadow-lg duration-200 rounded-lg"
            >
              <td className="px-4 py-3 border">
                <div className="font-medium">
                  {issue.title || "(No issues)"}{" "}
                  {issue.repo ? ` / ${issue.repo}` : issue.name ? ` / ${issue.name}` : ""}
                </div>
                {issue.body && (
                  <div className="mt-2">
                    {expandedIssueId === issue.id ? (
                      <div className="max-w-full">
                        {parseBody(issue.body)}
                        <button
                          onClick={() => toggleExpand(issue.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm mt-2"
                        >
                          Show less
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleExpand(issue.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm mt-1"
                      >
                        Show more
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 border">
                {issue.reporterTeam || ""} {issue.reporter ? `(${issue.reporter})` : ""}
              </td>
              {includeActions && (
                <td className="px-4 py-3 border space-x-2">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md shadow-md"
                    onClick={() => markValid(issue)}
                  >
                    Mark Valid
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-md"
                    onClick={() => markInvalid(issue)}
                  >
                    Mark Invalid
                  </button>
                </td>
              )}
              <td className="px-4 py-3 border">
                {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  if (loading) return <div className="p-8 text-center text-gray-700">Loading issues...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">GitHub Issues Dashboard</h1>

      <section className="mb-6 flex justify-end space-x-2">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md shadow-md"
          onClick={() => exportCSV(validIssues, "valid_issues.csv")}
        >
          Export Valid CSV
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md shadow-md"
          onClick={() => exportCSV(invalidIssues, "invalid_issues.csv")}
        >
          Export Invalid CSV
        </button>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Unmarked Issues</h2>
        {renderTable(issues, true)}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-green-700 dark:text-green-400">Valid Issues</h2>
        {renderTable(validIssues)}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-red-700 dark:text-red-400">Invalid Issues</h2>
        {renderTable(invalidIssues)}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">Repositories with No Issues</h2>
        {renderTable(issuelessRepos)}
      </section>
    </div>
  );
}
