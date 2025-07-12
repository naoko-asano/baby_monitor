const otherViewersElement = document.getElementById("otherViewersCount");

const url = new URL(
  "/viewers-count",
  import.meta.env.VITE_SERVER_URL || window.location.origin,
);

export async function fetchViewersCount() {
  if (!otherViewersElement) return;
  try {
    const response = await fetch(url.href, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { viewersCount } = await response.json();

    otherViewersElement.textContent =
      otherViewersCount(viewersCount).toString();
  } catch (error) {
    console.error("Error fetching other viewers count:", error);
    otherViewersElement.textContent = "N/A";
  }
}

function otherViewersCount(viewersCount: number) {
  return Math.max(viewersCount - 1, 0);
}

fetchViewersCount();
setInterval(fetchViewersCount, 1000 * 60);
