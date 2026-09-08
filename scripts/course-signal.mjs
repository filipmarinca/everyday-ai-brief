import { pathToFileURL } from "node:url";

const repository = "filipmarinca/everyday-ai-brief";
const courseId = 7257379;
const workflow = "course-signal.yml";
const stopAt = new Date("2026-09-16T00:00:00Z");
const issueTitle = "Course enrollment changed; paid revenue still needs verification";
const courseApi = `https://www.udemy.com/api-2.0/courses/${courseId}/?fields%5Bcourse%5D=title,url,is_paid,price,num_subscribers,num_reviews`;

export function parseCourse(data) {
  if (!data || data.id !== courseId || typeof data.is_paid !== "boolean" ||
      !Number.isSafeInteger(data.num_subscribers) || data.num_subscribers < 0 ||
      !Number.isSafeInteger(data.num_reviews) || data.num_reviews < 0) {
    throw new Error("The public course response is missing valid enrollment fields.");
  }
  return {
    courseId: data.id,
    paidListing: data.is_paid,
    publicEnrollments: data.num_subscribers,
    publicReviews: data.num_reviews,
    paidRevenueVerified: false
  };
}

export function needsNotice(observation, existingIssues) {
  return observation.publicEnrollments > 0 &&
    !existingIssues.some((issue) => issue.title === issueTitle);
}

async function github(path, method = "GET", body) {
  if (process.env.GITHUB_REPOSITORY !== repository || !process.env.GITHUB_TOKEN) {
    throw new Error("The monitor may only write to its own repository with its workflow token.");
  }
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) throw new Error(`GitHub ${method} ${path} failed with HTTP ${response.status}.`);
  return response.status === 204 ? null : response.json();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (new Date() >= stopAt && !dryRun) {
    await github(`actions/workflows/${workflow}/disable`, "PUT");
    console.log("The seven-day observation window is over. This workflow has disabled itself.");
    return;
  }
  const response = await fetch(courseApi, {
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Public course API returned HTTP ${response.status}; no revenue conclusion can be drawn.`);
  const observation = parseCourse(await response.json());
  console.log(JSON.stringify({ observedAt: new Date().toISOString(), ...observation }, null, 2));
  console.log("Public enrollments can include free access. They are not evidence of payment.");
  if (dryRun || observation.publicEnrollments === 0) return;

  const issues = [];
  for (let page = 1; ; page++) {
    const batch = await github(`issues?state=all&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("GitHub returned an invalid issue list.");
    issues.push(...batch);
    if (batch.length < 100) break;
  }
  if (!needsNotice(observation, issues)) return;
  await github("issues", "POST", {
    title: issueTitle,
    body: [
      `The public Udemy API reports **${observation.publicEnrollments} enrollment(s)**, versus the launch baseline of 0.`,
      "",
      "**This is not a confirmed sale or a dollar-earnings claim.** Enrollment can include free access, and the public API does not expose instructor revenue or payout evidence.",
      "",
      "The observation is a reason to inspect the authenticated Udemy revenue report when access is available. This notice is issued at most once.",
      "",
      `Public course: https://www.udemy.com/course/ai-productivity-for-beginners-safe-prompts-files-agents/`,
      `Observed: ${new Date().toISOString()}`
    ].join("\n")
  });
  console.log("Created one enrollment-signal notice, explicitly not a payment confirmation.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
