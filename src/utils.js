export function showOverlay(x, y, object, overlay) {
     overlay.style.display = "block";

     // Example: position overlay near cursor
     //overlay.style.left = `${x + 10}px`;
     //overlay.style.top = `${y + 10}px`;

     //overlay.textContent = `You clicked the ${object.name}`;
}

export function hideOverlay(overlay) {
     overlay.style.display = "none";
}
