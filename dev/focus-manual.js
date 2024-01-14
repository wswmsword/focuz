let exitLi6ByKeydown = false;
let exitLi6ByClick = false;

document.getElementById("en6").addEventListener("click", function(e) {
  z.entry(e);
});

document.getElementById("ex6").addEventListener("click", function(e) {
  exitLi6ByClick = true;
  z.exit(e);
});

document.getElementById("li6").addEventListener("keydown", function(e) {
  if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
    exitLi6ByKeydown = true;
    z.exit(e);
  }
});

const manualWrap = document.getElementById("li6");

manualWrap.addEventListener("focusout", function(e) {
  if (exitLi6ByKeydown || exitLi6ByClick) {
    exitLi6ByKeydown = false;
    exitLi6ByClick = false;
    return
  };
  setTimeout(() => {
    const active = document.activeElement;
    if (!manualWrap.contains(active)) {
      z.exit(e);
    }
  }, 30);
});