
import { test, expect } from "@playwright/test";
import exp from "node:constants";
import {enter, esc, sTab, tab} from "./utils.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("Clicking Stair Buttons", () => {

  test("should focus second element of list by clicking entry after setting `initActive: 1`", async ({ page }) => {
    await page.getByRole('button', { name: 'entry', exact: true }).click();
    const item1_2 = page.getByRole('button', { name: 'li1.2(exit)', exact: true });
    await expect(item1_2).toBeFocused();
  });

  test("should click and focus on element that are not entry or exit", async ({ page }) => {
    await page.getByRole('button', { name: 'entry', exact: true }).click();
    const item1_1 = page.getByText("li1.1", { exact: true });
    await item1_1.click();
    await expect(item1_1).toBeFocused();
  });

  test("should focus back entry by clicking exit", async ({ page }) => {
    await page.getByRole('button', { name: 'entry', exact: true }).click();
    await page.getByRole('button', { name: 'li1.2(exit)', exact: true }).click();
    const entryBtn = page.getByRole("button", { name: "entry", exact: true });
    await expect(entryBtn).toBeFocused();
  });

  test("should focus last focused list item by clicking entry", async ({ page }) => {
    const entryBtn = page.getByRole('button', { name: "entry", exact: true });
    const exitBtn = page.getByRole('button', { name: 'li1.2(exit)', exact: true });
    await entryBtn.click();
    await exitBtn.click();
    await entryBtn.click();
    await expect(exitBtn).toBeFocused();
  });

  test("should delay to focus list item by clicking entry", async ({ page }) => {
    await page.getByRole('button', { name: 'entry', exact: true }).click();
    const entry = page.getByRole('button', { name: 'li1.3(entry)', exact: true });
    await entry.click();
    await expect(entry).toBeFocused();
    const item = page.getByRole('button', { name: 'li2.1', exact: true });
    await expect(item).toBeFocused(); // to wait 386ms
  });

  test("should have multiple entries", async ({ page }) => {
    await page.getByRole('button', { name: 'entry', exact: true }).click();
    await page.getByRole('button', { name: 'li1.3(entry)', exact: true }).click();
    const waitedItem = page.getByRole('button', { name: 'li2.1', exact: true });
    await expect(waitedItem).toBeFocused(); // to wait 386ms
    await page.getByRole('button', { name: 'li2.3(entry)', exact: true }).click();
    const leftEntry = page.getByRole('button', { name: 'li3.1(left entry)', exact: true });
    const rightEntry = page.getByRole('button', { name: 'li3.3(right entry)', exact: true });
    await expect(rightEntry).toBeFocused();
    await rightEntry.click();
    const item5_1 = page.getByRole("button", { name: "li5.1", exact: true });
    await expect(item5_1).toBeFocused();
    await page.getByRole("button", { name: "li5.2(exit)", exact: true }).click();
    await expect(rightEntry).toBeFocused();
    await leftEntry.click();
    const item4_1 = page.getByRole("button", { name: "li4.1", exact: true });
    await expect(item4_1).toBeFocused();
  });

  test("should not focus last list item in range-mode list", async ({ page }) => {
    const entry1_3 = page.getByRole('button', { name: 'li1.3(entry)', exact: true });
    await page.getByRole('button', { name: 'entry', exact: true }).click();
    await entry1_3.click();
    const item2_1 = page.getByRole("button", { name: "li2.1", exact: true });
    await expect(item2_1).toBeFocused();
    const exit2_2 = page.getByRole("button", { name: "li2.2(exit)", exact: true });
    await exit2_2.click();
    await expect(entry1_3).toBeFocused();
    await entry1_3.click();
    await expect(item2_1).toBeFocused();
    await expect(exit2_2).not.toBeFocused();
  });

  test("should use dynamic list by clicking 'more' button", async ({ page }) => {
    const moreBtn = page.getByRole("button", { name: "dli4(more)", exact: true });
    const newItem4 = page.getByRole("button", { name: "dli4", exact: true });
    const newItem5 = page.getByRole("button", { name: "dli5", exact: true });
    await expect(newItem4).not.toBeVisible();
    await moreBtn.click();
    await expect(moreBtn).not.toBeFocused();
    const dynamicListWrap = page.locator("#li7");
    await expect(dynamicListWrap).toBeFocused();
    await expect(newItem4).toBeVisible();
    await expect(newItem5).not.toBeVisible();
    await moreBtn.click();
    await expect(moreBtn).not.toBeFocused();
    await expect(dynamicListWrap).toBeFocused();
    await expect(newItem5).toBeVisible();
  });

  test("should back to entry by clicking exit in dynamic list", async ({ page }) => {
    const moreBtn = page.getByRole("button", { name: "dli4(more)", exact: true });
    const exit = page.getByRole("button", { name: "dli1(exit)", exact: true });
    const entry = page.getByRole("button", { name: "li4.3(entry)", exact: true });
    await moreBtn.click();
    await exit.click();
    await expect(entry).toBeFocused();
  });

  test("should use manual entry and exit", async ({ page }) => {
    const manualEntry = page.getByRole("button", { name: "li5.3(manual entry)", exact: true });
    const manualExit = page.getByRole("button", { name: "li6.3(manual exit)", exact: true });
    await manualEntry.click();
    await expect(page.getByRole("button", { name: "li6.1", exact: true })).toBeFocused();
    await manualExit.click();
    await expect(manualEntry).toBeFocused();
    await manualEntry.click();
    await expect(manualExit).toBeFocused();
  });

  test("should exit by clicking empty area", async ({ page }) => {
    const entry = page.getByRole("button", { name: "entry", exact: true });
    const exit1_2 = page.getByRole("button", { name: "li1.2(exit)", exact: true });
    await entry.click();
    await expect(exit1_2).toBeFocused();
    await page.locator("html").click();
    await expect(entry).toBeFocused();

    const aboveOcean = page.getByTestId('above-ocean');
    const dynamicItem2 = page.getByRole("button", { name: "dli2", exact: true });
    await dynamicItem2.click();
    await expect(dynamicItem2).toBeFocused();
    await aboveOcean.click();
    await expect(page.getByRole("button", { name: "li4.3(entry)", exact: true })).toBeFocused();
    await aboveOcean.click();
    await expect(page.getByRole("button", { name: "li3.1(left entry)", exact: true })).toBeFocused();
    await aboveOcean.click();
    await expect(aboveOcean).toBeFocused();
  });

});

test.describe("Pressing Keyboard On Stair Buttons", () => {
  test("should focus list item by pressing Enter key on entry", async ({ page }) => {
    const entry = page.getByRole("button", { name: "entry", exact: true });
    const exit1_2 = page.getByRole("button", { name: "li1.2(exit)", exact: true });
    await tab(page);
    await expect(entry).toBeFocused();
    await enter(page);
    await expect(exit1_2).toBeFocused();
    await enter(page);
    await expect(entry).toBeFocused();
  });

  test("should focus back to entry by pressing Esc", async ({ page }) => {
    const entry = page.getByRole("button", { name: "entry", exact: true });
    const exit1_2 = page.getByRole("button", { name: "li1.2(exit)", exact: true });
    await tab(page);
    await enter(page);
    await expect(exit1_2).toBeFocused();
    await esc(page);
    await expect(entry).toBeFocused();
  });

  test("should focus last focused list item by pressing Enter on entry", async ({ page }) => {
    const entry = page.getByRole("button", { name: "entry", exact: true });
    const exit1_2 = page.getByRole("button", { name: "li1.2(exit)", exact: true });
    await tab(page);
    await enter(page);
    await tab(page); // li1.3(entry)
    await esc(page);
    await expect(entry).toBeFocused();
    await enter(page);
    await expect(page.getByRole("button", { name: "li1.3(entry)", exact: true })).toBeFocused();
  });

  test("should delay focus list item by pressing Enter on entry", async ({ page }) => {
    await tab(page); // entry
    await enter(page); // li1.2(exit)
    await tab(page); // li1.3(entry)
    await enter(page); // delay to focus li2.1
    const item2_1 = page.getByRole("button", { name: "li2.1", exact: true });
    await expect(item2_1).not.toBeFocused();
    await expect(page.getByRole("button", { name: "li1.3(entry)", exact: true })).not.toBeFocused();
    await expect(item2_1).toBeFocused();
  });

  test("should update focused list item during delays", async ({ page }) => {
    await tab(page); // entry
    await enter(page); // li1.2(exit)
    await tab(page); // li1.3(entry)
    await enter(page); // delay to focus li2.1
    await sTab(page); // update to li1.2(exit)
    await expect(page.getByRole("button", { name: "li2.1", exact: true })).toBeFocused();
    await esc(page);
    await expect(page.getByRole("button", { name: "li1.2(exit)", exact: true })).toBeFocused();
  });

  test("should blur after pressing Enter on 'more' button", async ({ page }) => {
    const blurListWrap = page.locator("#li7");
    await tab(page); // entry
    await enter(page); // li1.2(exit)
    await tab(page); // li1.3(entry)
    await enter(page); // li2.1
    await expect(page.getByRole("button", { name: "li2.1", exact: true })).toBeFocused();
    await sTab(page); // li2.3(entry)
    await enter(page); // li3.3(right entry)
    await tab(page); // li3.1(left entry)
    await enter(page); // li4.1
    await tab(page); // li4.2(exit)
    await tab(page); // li4.3(entry)
    await enter(page); // lli1(exit)
    await sTab(page); // (more)
    const dynamicItem4 = page.getByRole("button", { name: "dli4", exact: true });
    await expect(dynamicItem4).not.toBeVisible();
    await enter(page); // add new dli4
    await expect(dynamicItem4).toBeVisible();
    await expect(blurListWrap).toBeFocused();
    await tab(page); // dli4
    await tab(page); // (more)
    await enter(page); // add new dli5
    await expect(blurListWrap).toBeFocused();
    await sTab(page); // dli5
    expect(page.getByRole("button", { name: "dli5", exact: true }));
  });

  test("should use manual entry and exit without conflicts", async ({ page }) => {
    await page.getByRole("button", { name: "li5.1", exact: true }).click();
    await sTab(page);
    await enter(page);
    await expect(page.getByRole("button", { name: "li6.1", exact: true })).toBeFocused();
    await sTab(page);
    await expect(page.getByRole("button", { name: "li6.3(manual exit)", exact: true })).toBeFocused();
    await enter(page);
    await expect(page.getByRole("button", { name: "li5.3(manual entry)", exact: true })).toBeFocused();
  });

  test("should raise focus by pressing Escape", async ({ page }) => {
    await page.locator("#li7").click(); // underwater pineapple 🍍🏠
    await esc(page); // up
    await expect(page.getByRole("button", { name: "li4.3(entry)", exact: true })).toBeFocused();
    await esc(page); // up
    await expect(page.getByRole("button", { name: "li3.1(left entry)", exact: true })).toBeFocused();
    await esc(page); // up
    await expect(page.getByRole("button", { name: "li2.3(entry)", exact: true })).toBeFocused();
    await esc(page); // up
    await expect(page.getByRole("button", { name: "li1.3(entry)", exact: true })).toBeFocused();
    await esc(page); // up
    await expect(page.getByRole("button", { name: "entry", exact: true })).toBeFocused();
    await esc(page); // sky
    await expect(page.getByRole("button", { name: "entry", exact: true })).toBeFocused();
  });
});

test.describe("Mixing Click And Press Stair Buttons", () => {

});

