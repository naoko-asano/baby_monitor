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

### 開発環境で別のマシンから配信する場合

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

4. client/.env.developmentの`VITE_SERVER_URL`をローカルIPアドレスに変更

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

## その他

- [環境構成図](docs/architecture.md)
- [systemd を用いた自動起動設定手順](docs/autostart.md)
