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
  const video = document.getElementById("video");
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(video.src);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      video.play();
    });
  }
  // setInterval(fetchRoomConditions, 1000 * 60);
});
