import("./main.js").catch((error) => {
  console.error("Démarrage de Verger impossible", error);
  const content = document.getElementById("content");
  if (content) {
    content.replaceChildren();
    const heading = document.createElement("h1");
    heading.textContent = "Impossible d’ouvrir cet espace";
    const message = document.createElement("p");
    message.textContent = error?.message || "Vérifiez le lien et réessayez.";
    content.append(heading, message);
  }
  document.getElementById("org-name-header").textContent = "Ouverture interrompue";
});
