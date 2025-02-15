from flask import Flask, Response, render_template, jsonify
import cv2
import board
import busio
import adafruit_sht31d
import subprocess

app = Flask(__name__)

# i2c = busio.I2C(board.SCL, board.SDA)
# sensor = adafruit_sht31d.SHT31D(i2c)

def stream_video():
    command = [
        'ffmpeg',
        '-f', 'v4l2'
        '-i', '/dev/video0'
        '-f', 'alsa'
        '-i', 'hw:2,0'
        '-c:v', 'libx264'
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        '-s', '640x480'
        '-c:a', 'aac'
        '-b:a', '128k'
        '-ar', '44100'
        '-f', 'mpegts'
        '-'
    ]
    ffmpeg = subprocess.Popen(command, stdout=subprocess.PIPE, bufsize=10**8)
    while True:
        data = ffmpeg.stdout.read(1024)
        if not data:
            break
        yield data


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    return Response(stream_video(), mimetype='video/mp2t')

# @app.route('/room_conditions')
# def room_conditions():
#     try:
#         temperature = round(sensor.temperature, 1)
#         humidity = round(sensor.relative_humidity, 1)
#     except Exception:
#         temperature = '???'
#         humidity = '???'
#     return jsonify({ 'temperature': temperature, 'humidity': humidity })

if __name__ == "__main__":
    app.run()
