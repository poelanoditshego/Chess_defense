self.onmessage = function (event) {
  const message = event.data;

  if (message.startsWith("go")) {
    setTimeout(() => {
      self.postMessage("bestmove e2e4");
    }, 500);
  }
};