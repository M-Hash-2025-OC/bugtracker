"use client";

import { useEffect, useState } from "react";

export default function GithubIssuesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true);
        const response = await fetch("/api/github"); 
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to fetch data from API");
        }
        
        const result = await response.json();
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchIssues();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading GitHub issues...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>GitHub Issues for M-Hash-2025-OC</h1>
      <p>This page fetches open issues from all repos in the organization and displays them by team.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Issues ({data.issues.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.issues.map((issue) => (
            <li key={issue.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <h3>{issue.title}</h3>
              <p><strong>Repo:</strong> {issue.repo}</p>
              <p><strong>Reporter:</strong> {issue.reporter} ({issue.reporterTeam})</p>
              <p><strong>Created At:</strong> {new Date(issue.createdAt).toLocaleDateString()}</p>
              <a href={issue.url} target="_blank" rel="noopener noreferrer">View on GitHub</a>
            </li>
          ))}
        </ul>
      </div>
      <hr style={{ margin: '2rem 0' }} />
      <div style={{ marginTop: '2rem' }}>
        <h2>Repos with No Open Issues ({data.issuelessRepos.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.issuelessRepos.map((repo) => (
            <li key={repo.name} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '0.5rem' }}>
              {repo.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}