// Filterfunktion
function FilterFunction() {
  // Wert aus den Dropdown-Menüs auslesen
  var selectedRegion = document.getElementById("RegionSelect").value;
  var selectedTaste = document.getElementById("TasteSelect").value;
  var selectedBotanical = document.getElementById("BotanicalSelect").value;

  // Alle Gin-Container auswählen
  var ginContainers = document.getElementsByClassName("GinContainer");

  // Schleife über alle Gin-Container
  for (var i = 0; i < ginContainers.length; i++) {
    // Attribute des aktuellen Gin-Containers auslesen
    var currentRegion = ginContainers[i].querySelector(".Region").textContent.trim();
    var currentTaste = ginContainers[i].querySelector(".Taste").textContent.trim();
    var currentBotanicals = ginContainers[i].querySelector(".Botanicals").textContent.trim();

    // Überprüfen, ob der Gin-Container angezeigt werden soll
    var showGinContainer = true;
    if (selectedRegion != "keine Präferenz" && !currentRegion.includes(selectedRegion)) {
      showGinContainer = false;
    }
    if (selectedTaste != "keine Präferenz" && currentTaste != selectedTaste) {
      showGinContainer = false;
    }
    if (selectedBotanical != "keine Präferenz" && !currentBotanicals.includes(selectedBotanical)) {
      showGinContainer = false;
    }

    // Gin-Container ein- oder ausblenden
    if (showGinContainer) {
      ginContainers[i].style.display = "flex";
    } else {
      ginContainers[i].style.display = "none";
    }
  }
}

// Alle Gin-Container anzeigen
function showAllGinContainers() {
  var ginContainers = document.getElementsByClassName("GinContainer");
  for (var i = 0; i < ginContainers.length; i++) {
    ginContainers[i].style.display = "flex";
  }
}

// Sterne Bewertung initialisieren
function initializeStarRatings() {
  const starContainers = document.querySelectorAll(".stars");

  starContainers.forEach((container) => {
    const rating = parseInt(container.dataset.rating);
    const stars = container.querySelectorAll(".star");

    stars.forEach((star) => {
      const value = parseInt(star.dataset.value);
      if (value <= rating) {
        star.textContent = "★";
      } else {
        star.textContent = "☆";
      }
    
      star.addEventListener("click", () => {
        const form = container.closest(".rating-form");
    
        if (form) {
          const ratingInput = form.querySelector("input[name='rating']");
    
          container.querySelectorAll(".star").forEach((s) => {
            if (parseInt(s.dataset.value) <= value) {
              s.textContent = "★";
            } else {
              s.textContent = "☆";
            }
          });
    
          ratingInput.value = value;
        } else {
          console.log("Form element not found");
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Funktion für die Rücksetzung der Filter
  function NofilterFunction() {
    // Wert der Dropdown-Menüs auf "keine Präferenz" setzen
    document.getElementById("RegionSelect").value = "keine Präferenz";
    document.getElementById("TasteSelect").value = "keine Präferenz";
    document.getElementById("BotanicalSelect").value = "keine Präferenz";
  }



  // Funktion für den "Akzeptieren"-Button des Cookie-Banners
  document.getElementById("accept-cookies").addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById("cookie-banner").style.display = "none";
  });

  // Funktion für den "Ablehnen"-Button des Cookie-Banners
  document.getElementById("decline-cookies").addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById("cookie-banner").style.display = "none";
  });

// Sterne Bewertung initialisieren
initializeStarRatings();

// Bewertung absenden
const ratingButtons = document.querySelectorAll(".button-rating");
ratingButtons.forEach(button => {
  button.addEventListener("click", function (event) {
    const form = button.closest(".rating-form");
    const ginName = form.querySelector('input[name="gin_name"]').value;
    const ratingInput = form.querySelector('input[name="rating"]');
    const starsContainer = form.parentNode.querySelector(".stars");
    const currentRating = starsContainer.dataset.rating;

    ratingInput.value = currentRating;
    form.submit();
  });
});
 
});