import { expect, test } from "@playwright/test";

const ADMIN = { email: "admin@detech.school", password: "Admin@123" };
const STUDENT = { email: "student@detech.school", password: "Password@123" };

async function signIn(
  page: import("@playwright/test").Page,
  user: { email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("School email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("Landing page", () => {
  test("renders the marketing page with a sign-in call to action", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Run your entire school/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/i }).first()).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("rejects bad credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("School email").fill("admin@detech.school");
    await page.getByLabel("Password").fill("totally-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText(/Incorrect email or password/i);
  });

  test("signs an administrator in and shows the institutional dashboard", async ({ page }) => {
    await signIn(page, ADMIN);
    await expect(page.getByText("Active students")).toBeVisible();
    await expect(page.getByText("Fees collected")).toBeVisible();
  });

  test("redirects an anonymous visitor away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard/students");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/next=%2Fdashboard%2Fstudents/);
  });
});

test.describe("Role-based access control", () => {
  test("a student cannot open the teachers module", async ({ page }) => {
    await signIn(page, STUDENT);
    await page.goto("/dashboard/teachers");
    await page.waitForURL(/\/dashboard\?denied=1/);
    await expect(page.getByText(/does not have access/i)).toBeVisible();
  });

  test("a student sees their own dashboard, not the admin one", async ({ page }) => {
    await signIn(page, STUDENT);
    await expect(page.getByText("Average score")).toBeVisible();
    await expect(page.getByText("Active students")).toHaveCount(0);
  });
});

test.describe("Modules", () => {
  test("the student register lists students and supports search", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/dashboard/students");
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("the timetable grid renders weekdays", async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto("/dashboard/timetable");
    await expect(page.getByRole("columnheader", { name: /Monday/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Friday/ })).toBeVisible();
  });

  test("the health endpoint reports a connected database", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.status).toBe("healthy");
    expect(body.data.database).toBe("connected");
  });
});
