import {randomUUID} from "node:crypto";
import {expect, test, type Page} from "@playwright/test";

const password = "password123";

async function registerUser(page: Page, label: string) {
    const email = `${label}-${randomUUID()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL(/\/workouts$/);

    return email;
}

test("user completes a workout and sees it after signing in again", async ({page}) => {
    const email = await registerUser(page, "workout-flow");
    const mainNavigation = page.getByRole("navigation", {name: "Main navigation"});

    await mainNavigation.getByRole("link", {name: "Exercises"}).click();
    await page.getByRole("button", {name: "Add exercise"}).click();

    const exerciseDialog = page.getByRole("dialog", {name: "Add exercise"});
    await exerciseDialog.getByLabel("Name").fill("Bench press");
    await exerciseDialog.getByLabel("Muscle group").fill("Chest");
    await exerciseDialog.getByRole("button", {name: "Create exercise"}).click();
    await expect(page.getByRole("heading", {name: "Bench press"})).toBeVisible();

    await mainNavigation.getByRole("link", {name: "Workouts"}).click();
    await page.getByRole("button", {name: "Create workout"}).click();

    const workoutDialog = page.getByRole("dialog", {name: "Create workout"});
    await workoutDialog.getByLabel("Name").fill("Push day");
    await workoutDialog.getByRole("button", {name: "Create workout"}).click();

    const workoutCard = page.getByRole("article").filter({hasText: "Push day"});
    await expect(workoutCard).toBeVisible();
    await workoutCard.getByRole("link", {name: "Start workout"}).click();

    await page.getByLabel("Exercise").selectOption({label: "Bench press"});
    await page.getByRole("button", {name: "Add exercise"}).click();

    const exerciseCard = page.getByRole("article").filter({hasText: "Bench press"});
    await expect(exerciseCard.getByText("No previous performance")).toBeVisible();
    await exerciseCard.getByLabel("Weight (kg)").fill("80");
    await exerciseCard.getByLabel("Reps").fill("8");
    await exerciseCard.getByRole("button", {name: "Add"}).click();
    await exerciseCard.getByRole("button", {name: "Complete"}).click();

    await expect(exerciseCard.getByText("1/1 done")).toBeVisible();
    const finishWorkout = page.getByRole("button", {name: "Finish workout"});
    await expect(finishWorkout).toBeEnabled();
    await finishWorkout.click();
    await expect(page.getByText("Completed workout")).toBeVisible();

    await page.locator("header").getByRole("button", {name: "Log out"}).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", {name: "Log In"}).click();

    const completedWorkout = page.getByRole("article").filter({hasText: "Push day"});
    await expect(completedWorkout.getByText("COMPLETED", {exact: true})).toBeVisible();
});

test("expired session returns the user to sign in", async ({page, context}) => {
    await registerUser(page, "expired-session");
    await context.clearCookies({name: "token"});
    await page.goto("/exercises");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", {name: "Sign in"})).toBeVisible();
});
