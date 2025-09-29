import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG = process.env.ORG;

// Fetch GitHub issues
async function fetchGithubIssues() {
  try {
    const reposRes = await fetch(`https://api.github.com/orgs/${ORG}/repos`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
      next: { revalidate: 0 },
    });

    if (!reposRes.ok) {
      console.error("Failed to fetch repos");
      return [];
    }

    const repos = await reposRes.json();
    let issues = [];

    // Fetch issues from all repos concurrently
    await Promise.all(
      repos.map(async (repo) => {
        try {
          const issuesRes = await fetch(
            `https://api.github.com/repos/${ORG}/${repo.name}/issues`,
            {
              headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
              next: { revalidate: 0 },
            }
          );

          if (!issuesRes.ok) return;

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
        } catch (err) {
          console.error(`Failed to fetch issues for ${repo.name}:`, err);
        }
      })
    );

    return issues;
  } catch (err) {
    console.error("Error fetching GitHub issues:", err);
    return [];
  }
}

// GET → fetch + sync with Firestore
export async function GET() {
  try {
    const githubIssues = await fetchGithubIssues();

    if (githubIssues.length > 0) {
      const batch = db.batch();

      for (const gi of githubIssues) {
        const issueRef = db.collection("issues").doc(gi.id);
        const doc = await issueRef.get();
        if (!doc.exists) batch.set(issueRef, gi);
      }

      await batch.commit();
    }

    const snapshot = await db.collection("issues").get();
    const allIssues = snapshot.docs.map((doc) => doc.data());

    return NextResponse.json({ issues: allIssues });
  } catch (err) {
    console.error("GET /issues failed:", err);
    // Always return an array, even on error
    return NextResponse.json({ issues: [] }, { status: 200 });
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
    console.error("PUT /issues failed:", err);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}
