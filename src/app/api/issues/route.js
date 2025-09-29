import { NextResponse } from "next/server";

export async function GET(req) {
  const token = process.env.GITHUB_TOKEN;
  const org = "M-Hash-2025-OC"; // replace with your org

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  // Read validIds and invalidIds from query string (comma-separated)
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
    // Step 1: Get all teams
    const teamsRes = await fetch(`https://api.github.com/orgs/${org}/teams?per_page=100`, { headers });
    if (!teamsRes.ok) {
      const error = await teamsRes.text();
      return NextResponse.json({ message: "Failed to fetch teams", error }, { status: teamsRes.status });
    }
    const teams = await teamsRes.json();

    // Step 2: Build username -> team map
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

    // Step 3: Fetch all repos
    const reposRes = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100`, { headers });
    if (!reposRes.ok) {
      const error = await reposRes.text();
      return NextResponse.json({ message: "Failed to fetch repos", error }, { status: reposRes.status });
    }
    const repos = await reposRes.json();

    // Step 4: Fetch issues from all repos (map + filter based on excludeIds)
    const issuesPromises = repos.map(async (repo) => {
      const issuesRes = await fetch(
        `https://api.github.com/repos/${org}/${repo.name}/issues?state=open&per_page=100`,
        { headers }
      );

      if (!issuesRes.ok) {
        // Keep behavior consistent: treat as no issues (don't crash whole flow)
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

    // Separate issues vs empty repos with special handling:
    // - If filteredIssues.length > 0 -> repo has visible issues (include filteredIssues)
    // - Else if fullIssues.length === 0 -> repo truly empty (include in issueless)
    // - Else (fullIssues.length > 0 && filteredIssues.length === 0) -> repo had only excluded issues -> SKIP (do not include in issueless)
    const issues = [];
    const issuelessRepos = [];

    allIssuesNested.forEach(({ repo, fullIssues, filteredIssues }) => {
      if (filteredIssues && filteredIssues.length > 0) {
        issues.push(...filteredIssues);
      } else {
        // filteredIssues is empty
        if (!fullIssues || fullIssues.length === 0) {
          // truly no open issues — include in issueless
          issuelessRepos.push({ name: repo.name });
        } else {
          // There were open issues but all are excluded (validated/invalidated).
          // Per requirement: do NOT mark this repo as issue-less, and do NOT return its issues.
          // So skip adding anything for this repo.
        }
      }
    });

    return NextResponse.json({ issues, issuelessRepos }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch issues:", err);
    return NextResponse.json({ message: "Failed to fetch issues" }, { status: 500 });
  }
}
