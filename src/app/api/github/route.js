import { NextResponse } from "next/server";

export async function GET(req) {
  const token = process.env.GITHUB_TOKEN;
  const org = "M-Hash-2025-OC";

  if (!token) {
    return NextResponse.json({ message: "GitHub token is not configured" }, { status: 500 });
  }
  
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const { searchParams } = new URL(req.url);
  const validIdsParam = searchParams.get("validIds") || "";
  const invalidIdsParam = searchParams.get("invalidIds") || "";

  const parseIds = (s) =>
    (s || "")
      .split(",")
      .map((v) => parseInt(v, 10))
      .filter((n) => Number.isFinite(n));

  const excludeIdsSet = new Set([...parseIds(validIdsParam), ...parseIds(invalidIdsParam)]);

  try {
    const teamsRes = await fetch(`https://api.github.com/orgs/${org}/teams?per_page=100`, { headers });
    if (!teamsRes.ok) {
      const error = await teamsRes.text();
      return NextResponse.json({ message: "Failed to fetch teams", error }, { status: teamsRes.status });
    }
    const teams = await teamsRes.json();

    const userTeamMap = {};
    for (const team of teams) {
      const membersRes = await fetch(
        `https://api.github.com/orgs/${org}/teams/${team.slug}/members?per_page=100`,
        { headers }
      );
      if (!membersRes.ok) continue;
      const members = await membersRes.json();
      if (Array.isArray(members)) {
        members.forEach((member) => {
          userTeamMap[member.login] = team.name;
        });
      }
    }

    const reposRes = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100`, { headers });
    if (!reposRes.ok) {
      const error = await reposRes.text();
      return NextResponse.json({ message: "Failed to fetch repos", error }, { status: reposRes.status });
    }
    const repos = await reposRes.json();

    const issuesPromises = repos.map(async (repo) => {
      const issuesRes = await fetch(
        `https://api.github.com/repos/${org}/${repo.name}/issues?state=open&per_page=100`,
        { headers }
      );

      if (!issuesRes.ok) {
        return { repo, fullIssues: [], filteredIssues: [] };
      }

      const issuesData = await issuesRes.json();
      const fullIssues = Array.isArray(issuesData)
        ? issuesData.map((issue) => ({
            id: issue.id,
            title: issue.title,
            body: issue.body,
            reporter: issue.user?.login || "Unknown",
            reporterTeam: userTeamMap[issue.user?.login] || "Unknown Team",
            repo: repo.name,
            url: issue.html_url,
            state: issue.state,
            createdAt: issue.created_at,
          }))
        : [];

      const filteredIssues = fullIssues.filter((issue) => !excludeIdsSet.has(issue.id));

      return { repo, fullIssues, filteredIssues };
    });

    const allIssuesNested = await Promise.all(issuesPromises);

    const issues = [];
    const issuelessRepos = [];

    allIssuesNested.forEach(({ repo, fullIssues, filteredIssues }) => {
      if (filteredIssues && filteredIssues.length > 0) {
        issues.push(...filteredIssues);
      } else {
        if (!fullIssues || fullIssues.length === 0) {
          issuelessRepos.push({ name: repo.name });
        }
      }
    });

    return NextResponse.json({ issues, issuelessRepos }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch issues:", err);
    return NextResponse.json({ message: "Failed to fetch issues" }, { status: 500 });
  }
}