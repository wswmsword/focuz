const z = focuz({
  root: "#app",
  entry: {
    type: "toggle",
    node: "#en1",
  },
  exit: {
    node: "#ex1",
    type: ["esc", "outlist"],
  },
  list: {
    nodes: ["#i1_1", "#ex1", "#en2"],
    initActive: 1,
  },
  sub: {
    entry: {
      node: "#en2",
      delay: 386,
    },
    exit: {
      node: "#ex2",
      delay: 386,
      type: ["esc", "outlist"],
    },
    list: {
      nodes: ["#i2_1", "#en3_2"],
      range: true,
    },
    sub: {
      entry: ["#en3", "#en3_2"],
      exit: {
        node: ["#ex3", "#ex3_2"],
        type: "esc",
      },
      list: {
        nodes: ["#en4", "#ex3", "#en5", "#ex3_2"],
        initActive: 2,
      },
      sub: [{
        entry: "#en4",
        exit: {
          node: "#ex4",
          type: ["esc", "outlist"],
        },
        list: {
          nodes: ["#i4_1", "#i4_4"],
          range: true,
        },
        sub: {
          id: "dynamic",
          entry: "#en7",
          exit: {
            node: "#dli1",
            type: ["esc", "outlist"],
          },
          list: ["#dli1", "#dli2", "#dli3", '#more'],
        }
      }, {
        entry: "#en5",
        exit: {
          node: "#ex5",
          type: ["esc", "outlist"],
        },
        list: ["#i5_1", "#ex5", "#en6"],
        sub: {
          entry: {
            node: "#en6",
            type: "manual",
          },
          exit: {
            node: "#ex6",
            type: "manual",
          },
          list: ["#i6_1", "#i6_2", "#ex6"],
        }
      }]
    }
  }
});