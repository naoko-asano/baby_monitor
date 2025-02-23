from flask import Flask, Response, render_template, jsonify, send_from_directory
import cv2
import subprocess
import atexit
import board
import busio
import adafruit_sht31d

FPS = 30
WIDTH = 640
HEIGHT = 480

i2c = busio.I2C(board.SCL, board.SDA)
sensor = adafruit_sht31d.SHT31D(i2c)

def create_app():
    app = Flask(__name__)

    start_live_stream()

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/stream/<path:filename>')
    def serve_hls_file(filename):
        return send_from_directory('stream', filename)

    @app.route('/room_conditions')
    def room_conditions():
        try:
            temperature = round(sensor.temperature, 1)
            humidity = round(sensor.relative_humidity, 1)
        except Exception:
            temperature = '???'
            humidity = '???'
        return jsonify({ 'temperature': temperature, 'humidity': humidity })

    return app

def start_live_stream():
    command = [
        'ffmpeg',
        '-f', 'v4l2',
        '-i', '/dev/video0',
        '-f', 'alsa',
        '-i', 'default',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-maxrate', '1000k',
        '-bufsize', '2000k',
        '-pix_fmt', 'yuv420p',
        '-g', '50',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'hls',
        '-hls_time', '4',
        '-hls_playlist_type', 'event',
        '-hls_list_size', '5',
        '-hls_flags', 'delete_segments+append_list',
        'stream/index.m3u8'
    ]
    try:
        process = subprocess.Popen(command)
        print("FFmpeg process started with PID:", process.pid)
    except Exception as e:
        print("Failed to start FFmpeg:", e)

    atexit.register(lambda: process.terminate() if process and process.poll() is None else None)

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
