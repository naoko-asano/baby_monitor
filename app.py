from flask import Flask, Response, render_template, jsonify
import cv2
import board
import busio
import adafruit_sht31d
import subprocess

app = Flask(__name__)

# i2c = busio.I2C(board.SCL, board.SDA)
# sensor = adafruit_sht31d.SHT31D(i2c)

def stream_video_audio():
    command = [
        'ffmpeg',
        '-f', 'v4l2',
        '-i', '/dev/video0',
        '-f', 'alsa',
        '-ac', 1,
        '-i', 'hw:2,0',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        '-s', '640x480',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-hls_time', '2',  # セグメントの長さを短く設定
        '-hls_list_size', '5',  # プレイリストの保持するセグメント数を限定
        '-hls_flags', 'delete_segments+append_list',  # 古いセグメントを削除し、プレイリストを更新
        '-f', 'hls',
        '-'
    ]
    return subprocess.Popen(command, stdout=subprocess.PIPE, bufsize=-1)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stream.m3u8')
def stream():
    process = stream_video_audio()
    def generate():
        while True:
            chunk = process.stdout.read(1024)
            if not chunk:
                break
            yield chunk
    return Response(generate(), mimetype='application/vnd.apple.mpegurl')

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
