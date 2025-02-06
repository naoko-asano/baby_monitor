from flask import Flask, Response, render_template
import cv2
import board
import busio
import adafruit_sht31d

app = Flask(__name__)

FPS = 30
WIDTH = 640
HEIGHT = 480

i2c = busio.I2C(board.SCL, board.SDA)
sensor = adafruit_sht31d.SHT31D(i2c)

def init_camera():
    cap = cv2.VideoCapture('/dev/video0')
    cap.set(cv2.CAP_PROP_FPS, FPS)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    return cap

def generate_frames():
    cap = init_camera()
    try:
        while True:
            success, frame = cap.read()
            if not success:
                yield b'--frame\r\nContent-Type: text/plain\r\n\r\nError capturing frame.\r\n'
                break
            else:
                ret, buffer = cv2.imencode('.jpg', frame)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    finally:
        cap.release()

@app.route('/')
def index():
    try:
        temperature = round(sensor.temperature, 2)
        humidity = round(sensor.relative_humidity, 2)
    except Exception:
        temperature = '???'
        humidity = '???'
    return render_template('index.html', temperature = temperature, humidity = humidity)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run()
