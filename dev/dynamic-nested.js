const dz = focuz({
  root: "#dynamic-list",
  id: "more-items",
  entry: "#d-l-entry",
  exit: {
    esc: true,
    outlist: true,
  },
  list: ["#d-list-item1-entry", "#list-more"],
  sub: {
    entry: "#d-list-item1-entry",
    exit: {
      esc: true,
      outlist: true,
    },
    list: ["#d-list-item1-content-b1", "#d-list-item1-content-b2"],
  },
});

const listMoreBtn = document.getElementById("list-more");
const listMoreWrap = document.getElementById("d-list-items-wrap");

listMoreBtn.addEventListener("click", loadMore);

function loadMore() {
  const nextSubLength = document.getElementById("d-list-items-wrap").children.length + 1;
  const listItem = document.createElement("div");
  listItem.classList.add("d-list-item");
  listItem.id = "d-list-item" + nextSubLength;
  const entry = document.createElement("button");
  entry.id = "d-list-item" + nextSubLength + "-entry";
  entry.innerText = "d-list" + nextSubLength + " item entry";
  const itemContent = document.createElement("div");
  itemContent.tabIndex = -1;
  itemContent.id = "item" + nextSubLength + "-content";
  const contentBtn1 = document.createElement("button");
  contentBtn1.id = "d-list-item" + nextSubLength + "-content-b1";
  contentBtn1.innerText = "dlic" + nextSubLength + "btn1";
  const contentBtn2 = document.createElement("button");
  contentBtn2.id = "d-list-item" + nextSubLength + "-content-b2";
  contentBtn2.innerText = "dlic" + nextSubLength + "btn2";

  itemContent.appendChild(contentBtn1);
  itemContent.appendChild(contentBtn2);
  listItem.appendChild(entry);
  listItem.appendChild(itemContent);
  listMoreWrap.appendChild(listItem);

  dz.update("more-items", oldConfig => ({
    ...oldConfig,
    list: oldConfig.list.toSpliced(-1, 0, `#d-list-item${nextSubLength}-entry`),
    sub: [].concat(oldConfig.sub, {
      entry: `#d-list-item${nextSubLength}-entry`,
      exit: {
        esc: true,
        outlist: true,
      },
      list: [`#d-list-item${nextSubLength}-content-b1`, `#d-list-item${nextSubLength}-content-b2`],
    }),
  }))
}