# Baby Monitor

## 概要

- Raspberry Pi で動作する赤ちゃん監視モニターシステムです。
- カメラからのライブストリーミング映像、温度および湿度を表示します。

## 準備

```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

## 起動方法

```sh
gunicorn -w 4 -k gevent -b 0.0.0.0:5000 "app:app"
```
