const dz = focuz({
  root: "#dynamic-list",
  id: "more-items",
  exit: {
    type: ["esc", "outlist", "tab-creek"],
  },
  list: ["#item1-content", "#list-more"],
  sub: {
    entry: {
      cover: "#item1-content",
    },
    exit: {
      type: ["esc", "outlist"],
    },
    list: ["#d-list-item1-content-b1", "#d-list-item1-content-b2"],
  },
});

const listMoreBtn = document.getElementById("list-more");
const listMoreWrap = document.getElementById("d-list-items-wrap");

listMoreBtn.addEventListener("click", loadMore);

function loadMore() {
  const nextSubLength = document.getElementById("d-list-items-wrap").children.length + 1;
  const itemContent = document.createElement("div");
  itemContent.tabIndex = 0;
  itemContent.id = "item" + nextSubLength + "-content";
  const contentBtn1 = document.createElement("button");
  contentBtn1.id = "d-list-item" + nextSubLength + "-content-b1";
  contentBtn1.innerText = "dlic" + nextSubLength + "btn1";
  const contentBtn2 = document.createElement("button");
  contentBtn2.id = "d-list-item" + nextSubLength + "-content-b2";
  contentBtn2.innerText = "dlic" + nextSubLength + "btn2";

  itemContent.appendChild(contentBtn1);
  itemContent.appendChild(contentBtn2);
  listMoreWrap.appendChild(itemContent);

  dz.update("more-items", oldConfig => ({
    ...oldConfig,
    list: oldConfig.list.toSpliced(-1, 0, `#item${nextSubLength}-content`),
    sub: [].concat(oldConfig.sub, {
      entry: {
        cover: `#item${nextSubLength}-content`,
      },
      exit: {
        esc: true,
        outlist: true,
      },
      list: [`#d-list-item${nextSubLength}-content-b1`, `#d-list-item${nextSubLength}-content-b2`],
    }),
  }))
}