(function () {
  if (!window.chatbase || window.chatbase("getState") !== "initialized") {
    window.chatbase = function () {
      if (!window.chatbase.q) {
        window.chatbase.q = [];
      }
      window.chatbase.q.push(arguments);
    };

    window.chatbase = new Proxy(window.chatbase, {
      get: function (target, prop) {
        if (prop === "q") {
          return target.q;
        }
        return function () {
          var args = [prop].concat(Array.prototype.slice.call(arguments));
          return target.apply(null, args);
        };
      },
    });
  }

  var onLoad = function () {
    var script = document.createElement("script");
    script.src = "https://www.chatbase.co/embed.min.js";
    script.id = "4Mw7MbnOpjKpPVMP-qNMs";
    script.domain = "www.chatbase.co";
    document.body.appendChild(script);
  };

  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad);
  }
})();
