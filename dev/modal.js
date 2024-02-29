focuz({
  root: "#modal",
  entry: {
    node: "#modal-g",
    on: genModal,
  },
  exit: {
    node: "#close-modal-btn",
    type: ["click", "keydown", "esc", "outlist"],
    on: removeModal,
  },
  list: ["#confirm-modal-btn", "#close-modal-btn"],
});

function removeModal() {
  document.getElementById("modal-wrap").remove();
}

function genModal() {
  const root = document.getElementById("modal-root");
  const wrap = document.createElement("div");
  wrap.id = "modal-wrap";
  wrap.tabIndex = -1;
  const style = {
    padding: "18px",
    background: "black",
    position: "fixed",
    left: "50%",
    transform: "translate(-50%, -50%)",
    top: "50%",
    display: "flex",
  };
  for (const prop in style) {
    wrap.style[prop] = style[prop];
  }
  const closeBtn = document.createElement("button");
  closeBtn.innerText = "close me";
  closeBtn.id = "close-modal-btn";
  const confirmBtn = document.createElement("button");
  confirmBtn.innerText = "yes";
  confirmBtn.id = "confirm-modal-btn";
  wrap.appendChild(confirmBtn);
  wrap.appendChild(closeBtn);
  root.appendChild(wrap);
}