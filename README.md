# Baby Monitor

## 概要

- 赤ちゃん監視モニターです。Raspberry Pi での使用を想定しています。

## 起動方法

### 開発環境

```sh
docker compose build
docker compose up
```

### 本番環境

```sh
docker compose build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```
