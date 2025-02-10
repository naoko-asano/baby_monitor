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
. venv/bin/activate # 必要に応じて実行
gunicorn -w 4 -k gevent -b 0.0.0.0:5000 "app:app"
```

## systemd を用いた自動起動

1. 以下のコマンドでサービスファイルを作成します。`xxx` はサービスの名前に応じて適宜変更してください。

```sh
sudo vi /etc/systemd/system/xxx.service
```

2. サービスファイルに以下の内容をコピーします。`your_username` は適宜実際のユーザー名に変更してください。

```ini
[Unit]
Description=Baby Monitoring Service
After=network.target

[Service]
User=your_username
WorkingDirectory=/home/your_username/baby_monitor
Environment="PATH=/home/your_username/baby_monitor/venv/bin"
ExecStart=/home/your_username/baby_monitor/venv/bin/gunicorn -w 4 -k gevent -b 0.0.0.0:5000 "app:app"

[Install]
WantedBy=multi-user.target
```

3. サービスを有効化し、起動します。`xxx` は適宜 1 で作成したサービスファイル名に適宜変更してください。

```sh
sudo systemctl enable xxx.service
sudo systemctl start xxx.service
```
