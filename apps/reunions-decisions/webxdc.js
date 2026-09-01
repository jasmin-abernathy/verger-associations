// Simulateur minimal pour le développement dans un navigateur.
// Le script est exclu du paquet .xdc : Delta Chat fournit alors l’API réelle.
(function () {
  "use strict";

  if (window.webxdc) return;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const key = "verger-reunions-decisions-updates-v1";
  let listener = function () {};

  function updates() {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (_error) {
      return [];
    }
  }

  window.addEventListener("storage", function (event) {
    if (event.key !== key || !event.newValue) return;
    const values = JSON.parse(event.newValue);
    const latest = values[values.length - 1];
    if (latest) listener({ ...latest, max_serial: values.length });
  });

  window.webxdc = {
    selfAddr: params.get("addr") || "alice@local.test",
    selfName: params.get("name") || "Alice",
    sendUpdateInterval: 1000,
    sendUpdateMaxSize: 128000,
    setUpdateListener: function (callback, serial) {
      listener = callback;
      const values = updates();
      values.forEach(function (update) {
        if (update.serial > (serial || 0)) {
          callback({ ...update, max_serial: values.length });
        }
      });
      return Promise.resolve();
    },
    sendUpdate: function (update) {
      const values = updates();
      const stored = { ...update, serial: values.length + 1 };
      values.push(stored);
      localStorage.setItem(key, JSON.stringify(values));
      listener({ ...stored, max_serial: stored.serial });
    },
    sendToChat: function (message) {
      if (!message.file || typeof message.file.plainText !== "string") {
        return Promise.reject(new Error("Le simulateur attend un fichier texte."));
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([message.file.plainText], { type: "text/plain;charset=utf-8" }));
      link.download = message.file.name;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      return Promise.resolve();
    },
  };
})();
