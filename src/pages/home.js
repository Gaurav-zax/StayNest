// Home page logic — featured listings + search redirect.
import { isLoggedIn } from "../auth.js";

const sampleListings = [
  { id: 1, title: "2BHK in Knowledge Park V", locality: "Knowledge Park V", rent: 18000, bhk: "2 BHK", baths: 2, area: 980, img: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 2, title: "1BHK Studio near Pari Chowk", locality: "Pari Chowk", rent: 12000, bhk: "1 BHK", baths: 1, area: 540, img: "https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 3, title: "3BHK Family Flat, Sector Pi", locality: "Sector Pi", rent: 26000, bhk: "3 BHK", baths: 3, area: 1450, img: "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800" },
];

function renderFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;
  grid.innerHTML = sampleListings
    .map(
      (l) => `
    <div class="col-md-4">
      <a href="/property.html?id=${l.id}" class="listing-card">
        <div class="listing-img" style="background-image:url('${l.img}')">
          <span class="tag">${l.bhk}</span>
        </div>
        <div class="listing-body">
          <div class="price">₹${l.rent.toLocaleString("en-IN")} <span>/ month</span></div>
          <h3>${l.title}</h3>
          <div class="loc"><i class="bi bi-geo-alt"></i> ${l.locality}, Greater Noida</div>
          <div class="meta">
            <span><i class="bi bi-door-open"></i> ${l.bhk}</span>
            <span><i class="bi bi-droplet"></i> ${l.baths} bath</span>
            <span><i class="bi bi-bounding-box"></i> ${l.area} sq.ft</span>
          </div>
        </div>
      </a>
    </div>`
    )
    .join("");
}

window.staynest.search = function (e) {
  e.preventDefault();
  const q = document.getElementById("hero-search-input")?.value?.trim();
  window.location.href = `/listings.html${q ? "?q=" + encodeURIComponent(q) : ""}`;
  return false;
};

document.addEventListener("DOMContentLoaded", renderFeatured);
