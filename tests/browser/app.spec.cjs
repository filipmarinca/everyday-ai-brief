const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

test("the three examples, editing and safe clearing work", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#brief-output")).toContainText("No budget decision was made.");
  await page.getByRole("button", { name: "Expense summary", exact: true }).click();
  await expect(page.locator("#brief-output")).toContainText("Keep currencies separate");
  await page.getByRole("button", { name: "Project update", exact: true }).click();
  await expect(page.locator("#brief-output")).toContainText("Only mark an item complete");
  await page.getByLabel("What needs doing?").fill("Summarize only the supplied facts.");
  await expect(page.locator("#brief-output")).toContainText("Summarize only the supplied facts.");
  await page.getByRole("button", { name: "Clear all fields" }).click();
  await expect(page.getByRole("button", { name: "Copy prompt", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert").filter({ hasText: "Describe the task" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("literal markup is not executed or sent over the network", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.locator("#materials").fill('<img src="https://example.invalid/track" onerror="window.unwanted=true">');
  await expect(page.locator("#brief-output")).toContainText("<img");
  expect(await page.evaluate(() => window.unwanted)).toBeUndefined();
  expect(await page.locator("#brief-output img").count()).toBe(0);
  expect(requests.every((url) => url.startsWith("http://127.0.0.1:4173/"))).toBe(true);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("copy is explicit and a possible secret blocks it", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("TASK");
  await page.locator("#materials").fill("password: fictional-example-only");
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Remove the flagged");
});

test("text download is local and contains the generated brief", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .txt", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("my-ai-task-brief.txt");
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toContain("CHECK BEFORE RETURNING");
});

test("the standalone release runs without a server or network", async ({ page }) => {
  await page.context().setOffline(true);
  await page.goto(pathToFileURL(path.resolve(__dirname, "../../dist/everyday-ai-brief.html")).href);
  await expect(page.locator("#brief-output")).toContainText("TASK");
  await page.getByRole("button", { name: "Expense summary", exact: true }).click();
  await expect(page.locator("#brief-output")).toContainText("Keep currencies separate");
});

for (const width of [375, 768, 1024, 1440]) {
  test(`layout stays within a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator("#brief-output")).toContainText("TASK");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: "Copy prompt", exact: true })).toBeVisible();
    await page.screenshot({ path: `test-results/viewport-${width}.png`, fullPage: true });
  });
}
test("dark mode remains functional", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#brief-output")).toContainText("TASK");
  await page.screenshot({ path: "test-results/dark.png", fullPage: true });
});

test("further learning uses the existing disclosed referral link, not a payment form", async ({ page }) => {
  await page.goto("/");
  const course = page.getByRole("link", { name: "See course on Udemy" });
  await expect(course).toHaveAttribute("href", "https://www.udemy.com/course/ai-productivity-for-beginners-safe-prompts-files-agents/?referralCode=24C06640F153438479E2");
  await expect(course).toHaveAttribute("rel", /sponsored/);
  await expect(page.locator(".disclosure")).toContainText("instructor's share");
  await page.getByRole("link", { name: "Everyday AI Brief home" }).click();
  await expect(page).toHaveURL(/#title$/);
});
