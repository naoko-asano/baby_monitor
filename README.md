# Baby Monitor

## 概要

WebRTCを使って、カメラで撮影した動画と音声を配信/視聴できるアプリケーションです。  
配信側は`/broadcaster`にアクセスしてください。  
視聴側は`/`にアクセスしてください。

## 環境構築

1. .envファイルを作成

   ```
   cp .env.sample .env
   ```

2. .envファイルに適切な値を設定

## 開発環境で別のマシンから配信する場合

1. 自己署名証明書作成のための設定ファイルを作成

   ```
   cp openssl.cnf.example openssl.cnf
   ```

2. openssl.cnfの`192.168.x.x`を適切な値に変更
3. 自己署名証明書を作成

   ```
   openssl req -x509 -nodes -days 365 \
     -newkey rsa:2048 \
     -keyout server.key \
     -out server.crt \
     -config openssl.cnf
   ```

4. .env.developmentの`VITE_SERVER_URL`をローカルIPアドレスに変更

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
