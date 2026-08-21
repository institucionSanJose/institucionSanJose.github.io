// ============================================================
// fab-redes.js — Botón flotante de redes sociales (expandible)
// En computador, con :hover en el CSS ya se expande solo. Esto es lo
// que hace falta para cuando alguien lo TOCA (celular, o clic en
// computador): abre/cierra, y si tocas afuera, se cierra solo.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("fab-redes");
  if (!fab) return;
  const boton = fab.querySelector(".fab-trigger");

  boton.addEventListener("click", (evento) => {
    evento.preventDefault();
    const abierto = fab.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
  });

  document.addEventListener("click", (evento) => {
    if (!fab.contains(evento.target)) {
      fab.classList.remove("abierto");
      boton.setAttribute("aria-expanded", "false");
    }
  });
});
