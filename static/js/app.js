function fetchRoomConditions() {
  fetch("/room_conditions")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("temperature").textContent = data.temperature;
      document.getElementById("humidity").textContent = data.humidity;
    })
    .catch((error) => console.error("Error fetching data:", error));
}

document.addEventListener("DOMContentLoaded", function () {
  // fetchRoomConditions();
  // setInterval(fetchRoomConditions, 1000 * 60);
});
