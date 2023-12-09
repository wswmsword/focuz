
const moreBtn = document.getElementById("more");
const listWrap = document.getElementById("li7");

moreBtn.addEventListener("click", moreItems);

function moreItems() {
  const btns = document.getElementsByClassName("dynamic_btn");
  const btnIds = [...btns].map(btn => `#${btn.id}`);
  const length = btns.length;
  const newBtn = document.createElement("button");
  newBtn.className = "dynamic_btn";
  newBtn.id = `dli${length}`;
  newBtn.innerHTML = newBtn.id;
  listWrap.insertBefore(newBtn, moreBtn);
  btnIds.splice(-1, 0, `#${newBtn.id}`);
  sky.update("dynamic", {
    id: "dynamic",
    entry: "#en7",
    exit: "#dli1",
    list: btnIds,
    escapeExit: true,
    outlistExit: true,
    listWrap: "#li7",
  });
}