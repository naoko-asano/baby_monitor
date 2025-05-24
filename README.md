# Baby Monitor

## 概要

WebRTCを使って、カメラで撮影した動画と音声を配信/視聴できるアプリケーションです。  
配信側は`/broadcaster`にアクセスしてください。  
視聴側は`/`にアクセスしてください。

## 起動方法

### 開発環境

```sh
pnpm install
pnpm dev
```

### 本番環境

```sh
pnpm install
pnpm build
pnpm start
```

## systemd を用いた自動起動

1. 以下のコマンドでサービスファイルを作成します。

```sh
sudo vi /etc/systemd/system/baby_monitoring.service
```

2. サービスファイルに以下の内容をコピーします。`your_username` は適宜実際のユーザー名に変更してください。

```ini
[Unit]
Description=Baby Monitoring Service
After=network.target room_conditions_api.service

[Service]
User=your_username
WorkingDirectory=/home/your_username/baby_monitor
Environment=NODE_ENV=production
Environment=PATH=/home/your_username/.nvm/versions/node/v22.14.0/bin:/usr/bin:/bin
ExecStart=/home/your_username/baby_monitor/start.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

3. サービスを有効化し、起動します。

```sh
sudo systemctl enable baby_monitoring.service
sudo systemctl start baby_monitoring.service
```
