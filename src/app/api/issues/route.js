import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG = process.env.ORG;

// Fetch GitHub issues
async function fetchGithubIssues() {
  const reposRes = await fetch(`https://api.github.com/orgs/${ORG}/repos`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    next: { revalidate: 0 },
  });

  if (!reposRes.ok) throw new Error("Failed to fetch repos");
  const repos = await reposRes.json();

  let issues = [];
  for (const repo of repos) {
    const issuesRes = await fetch(`https://api.github.com/repos/${ORG}/${repo.name}/issues`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
      next: { revalidate: 0 },
    });

    if (issuesRes.ok) {
      const repoIssues = await issuesRes.json();
      repoIssues.forEach((i) => {
        issues.push({
          id: i.id.toString(),
          title: i.title,
          repo: repo.name,
          reporter: i.user?.login,
          createdAt: i.created_at,
          status: "UNMARKED",
        });
      });
    }
  }
  return issues;
}

// GET → fetch + sync with Firestore
export async function GET() {
  try {
    const githubIssues = await fetchGithubIssues();

    const batch = db.batch();

    for (const gi of githubIssues) {
      const issueRef = db.collection("issues").doc(gi.id);
      const doc = await issueRef.get();
      if (!doc.exists) batch.set(issueRef, gi);
    }

    await batch.commit();

    const snapshot = await db.collection("issues").get();
    const allIssues = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ issues: allIssues });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

// PUT → update issue status
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const issueRef = db.collection("issues").doc(id);
    await issueRef.update({ status });

    const updated = await issueRef.get();
    return NextResponse.json(updated.data());
  } catch (err) {
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}
