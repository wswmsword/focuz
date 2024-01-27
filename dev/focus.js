const z = focuz({
  root: "#app",
  entry: {
    node: "#en1",
    toggle: true,
  },
  exit: {
    node: "#ex1",
    outlist: true,
    esc: true,
  },
  list: {
    nodes: ["#i1_1", "#ex1", "#en2"],
    wrap: "#li1",
    initActive: 1,
  },
  sub: {
    entry: {
      node: "#en2",
      delay: 386,
    },
    exit: {
      node: "#ex2",
      outlist: true,
      delay: 386,
      esc: true,
    },
    list: {
      nodes: ["#i2_1", "#en3_2"],
      wrap: "#li2",
      range: true,
    },
    sub: {
      entry: ["#en3", "#en3_2"],
      exit: {
        node: ["#ex3", "#ex3_2"],
        esc: true,
      },
      list: {
        nodes: ["#en4", "#ex3", "#en5", "#ex3_2"],
        wrap: "#li3",
        initActive: 2,
      },
      sub: [{
        entry: "#en4",
        exit: {
          node: "#ex4",
          esc: true,
          outlist: true,
        },
        list: {
          nodes: ["#i4_1", "#i4_4"],
          wrap: "#li4",
          range: true,
        },
        sub: {
          id: "dynamic",
          entry: "#en7",
          exit: {
            node: "#dli1",
            esc: true,
            outlist: true,
          },
          list: {
            nodes: ["#dli1", "#dli2", "#dli3", '#more'],
            wrap: "#li7",
          },
        }
      }, {
        entry: "#en5",
        exit: {
          node: "#ex5",
          esc: true,
          outlist: true,
        },
        list: {
          nodes: ["#i5_1", "#ex5", "#en6"],
          wrap: "#li5",
        },
        sub: {
          entry: {
            node: "#en6",
            manual: true,
          },
          exit: ["#ex6", { manual: true }],
          list: {
            nodes: ["#i6_1", "#i6_2", "#ex6"],
            wrap: "#li6",
          },
        }
      }]
    }
  }
});