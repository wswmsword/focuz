
export function tab(page) {
  return page.keyboard.press("Tab");
}

export function sTab(page) {
  return page.keyboard.press("Shift+Tab");
}

export function enter(page) {
  return page.keyboard.press("Enter");
}

export function esc(page) {
  return page.keyboard.press("Escape");
}

export function btn(page, name) {
  return page.getByRole("button", { name, exact: true });
}
