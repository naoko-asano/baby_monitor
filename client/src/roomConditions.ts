const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");

async function fetchRoomConditions() {
  if (!temperatureElement || !humidityElement) return;
  try {
    const response = await fetch("http://raspberrypi.local:5000", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const { temperature, humidity } = await response.json();

    temperatureElement.textContent = temperature;
    humidityElement.textContent = humidity;
  } catch (error) {
    console.error("Error fetching room conditions:", error);

    temperatureElement.textContent = "N/A";
    humidityElement.textContent = "N/A";
  }
}

fetchRoomConditions();
setInterval(fetchRoomConditions, 1000 * 60);
