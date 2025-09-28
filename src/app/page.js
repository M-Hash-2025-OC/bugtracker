"use client";

import { useState, useEffect } from "react";

/**
 * GitHub Issues Dashboard Page
 *
 * Behavior:
 * - Persists valid/invalid/issueless lists to localStorage.
 * - Polls /api/issues with validIds & invalidIds so backend omits them.
 * - Adds only genuinely new issues and repos.
 * - If a previously-issueless repo gets an issue, it is removed from issueless and its new issue(s) are added.
 */

const LS_KEYS = {
  VALID: "gh_valid_issues_v1",
  INVALID: "gh_invalid_issues_v1",
  ISSUELESS: "gh_issueless_repos_v1",
};

export default function Page() {
  const [issues, setIssues] = useState([]); // Unmarked issues
  const [issuelessRepos, setIssuelessRepos] = useState([]);
  const [validIssues, setValidIssues] = useState([]);
  const [invalidIssues, setInvalidIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const POLL_INTERVAL = 15000; // 15s

  // Helpers
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

  // Load persisted state on mount, then do initial fetch (passing persisted arrays so first fetch excludes them)
  useEffect(() => {
    try {
      const pValid = JSON.parse(localStorage.getItem(LS_KEYS.VALID) || "[]");
      const pInvalid = JSON.parse(localStorage.getItem(LS_KEYS.INVALID) || "[]");
      const pIssueless = JSON.parse(localStorage.getItem(LS_KEYS.ISSUELESS) || "[]");

      if (Array.isArray(pValid) && pValid.length) setValidIssues(pValid);
      if (Array.isArray(pInvalid) && pInvalid.length) setInvalidIssues(pInvalid);
      if (Array.isArray(pIssueless) && pIssueless.length) setIssuelessRepos(pIssueless);

      // Call initial fetch with overrides (to ensure exclude lists are applied immediately)
      fetchIssues(pValid || [], pInvalid || []);
    } catch (err) {
      // If JSON parse fails, ignore and start fresh
      console.warn("Failed to load persisted lists:", err);
      fetchIssues();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Persist whenever valid/invalid/issueless change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.VALID, JSON.stringify(validIssues));
      localStorage.setItem(LS_KEYS.INVALID, JSON.stringify(invalidIssues));
      localStorage.setItem(LS_KEYS.ISSUELESS, JSON.stringify(issuelessRepos));
    } catch (err) {
      console.warn("Failed to persist lists:", err);
    }
  }, [validIssues, invalidIssues, issuelessRepos]);

  // Polling effect: recreates interval when valid/invalid sets change so excludeIds are up-to-date
  useEffect(() => {
    const interval = setInterval(() => fetchIssues(), POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validIssues, invalidIssues]); // re-create interval if validated/invalidated sets change

  /**
   * Fetch issues from backend, passing optional overrides for valid/invalid arrays (used on initial load).
   * - Merge only new issues into `issues` state.
   * - Keep `validIssues` and `invalidIssues` untouched.
   * - Update issuelessRepos: remove repos that now have issues; append only genuinely new issueless repos.
   */
  async function fetchIssues(validOverride = null, invalidOverride = null) {
    setError(""); // clear prior errors
    try {
      const validArr = Array.isArray(validOverride) ? validOverride : validIssues;
      const invalidArr = Array.isArray(invalidOverride) ? invalidOverride : invalidIssues;

      const validIds = idsFrom(validArr).join(",");
      const invalidIds = idsFrom(invalidArr).join(",");

      // Append query params only when non-empty to avoid trailing commas
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

      // repos that currently have issues (from this response)
      const reposWithIssuesSet = new Set((data.issues || []).map((i) => i.repo).filter(Boolean));

      // 1) Update issuelessRepos:
      //    - remove any previously-known issueless repo that now has issues
      //    - add only new repos from server that aren't already known (and are not in reposWithIssuesSet)
      setIssuelessRepos((prev) => {
        const prevMap = new Map(prev.map((r) => [r.name, r]));
        // remove repos that now have issues
        for (const name of reposWithIssuesSet) {
          if (prevMap.has(name)) prevMap.delete(name);
        }
        // add new server-provided issueless repos that are not present and not in reposWithIssuesSet
        for (const r of data.issuelessRepos || []) {
          if (!prevMap.has(r.name) && !reposWithIssuesSet.has(r.name)) {
            prevMap.set(r.name, r);
          }
        }
        return Array.from(prevMap.values());
      });

      // 2) Update issues:
      //    - avoid adding any issue that already exists in (issues, validIssues, invalidIssues)
      //    - keep existing order, append genuinely new ones
      setIssues((prev) => {
        const existingIdSet = new Set([
          ...prev.map((i) => i.id),
          ...validIssues.map((i) => i.id),
          ...invalidIssues.map((i) => i.id),
        ]);
        // new issues from server that are not in existingIdSet
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
    // append to valid, remove from issues; backend will be queried with this id excluded
    setValidIssues((prev) => uniqueById([...prev, issue]));
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
    // Also, if this was the only issue in a repo and repo is currently in issueless (unlikely),
    // we leave issueless alone — backend filtering handles not creating false issue-less entries.
  };

  const markInvalid = (issue) => {
    setInvalidIssues((prev) => uniqueById([...prev, issue]));
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
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
                {issue.title || "(No issues)"}{" "}
                {issue.repo ? ` / ${issue.repo}` : issue.name ? ` / ${issue.name}` : ""}
              </td>
              <td className="px-4 py-3 border">
                {issue.reporterTeam || ""} {issue.reporter ? `(${issue.reporter})` : ""}
              </td>
              {includeActions && (
                <td className="px-4 py-3 border space-x-2">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md shadow-md transition transform hover:scale-105"
                    onClick={() => markValid(issue)}
                  >
                    Mark Valid
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-md transition transform hover:scale-105"
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
