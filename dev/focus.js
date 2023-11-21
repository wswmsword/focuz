const sky = focusky({
  root: "#app",
  entry: "#en1",
  exit: "#ex1",
  outlistExit: true,
  escapeExit: true,
  toggleEntry: true,
  list: ["#i1", "#ex1", {
    entry: "#en2",
    exit: "#ex2",
    list: ["#i2", {
      entry: "#en3",
      exit: "#ex3",
      list: [{
        entry: "#en4",
        exit: "#ex4",
        list: ["#i3", "#ex4"],
        listWrap: "#li4",
        range: true,
        escapeExit: true,
        outlistExit: true,
      }, "#ex3", {
        entry: "#en5",
        exit: "#ex5",
        list: ["#i4", "#ex5", {
          entry: "#en6",
          exit: "#ex6",
          list: ["#i5", "#i6", "#ex6"],
          listWrap: "#li6",
          disableAutoEntry: true,
          disableAutoExit: true,
        }],
        listWrap: "#li5",
        escapeExit: true,
        outlistExit: true,
        initActive: 2,
      }],
      listWrap: "#li3",
      escapeExit: true,
    }],
    listWrap: "#li2",
    range: true,
    escapeExit: true,
    delayEntry: 386,
    delayExit: 386,
    outlistExit: true,
  }],
  listWrap: "#li1",
  initActive: 1,
});