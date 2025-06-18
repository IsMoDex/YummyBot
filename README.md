# 🧠🍽️ YummyBot Monorepo
[![License: MIT](https://img.shields.io/github/license/IsMoDex/YummyBot)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/IsMoDex/YummyBot?include_prereleases)](https://github.com/IsMoDex/YummyBot/releases)
[![Code Size](https://img.shields.io/github/languages/code-size/IsMoDex/YummyBot.svg)](https://github.com/IsMoDex/YummyBot)
[![Repo Stars](https://img.shields.io/github/stars/IsMoDex/YummyBot?style=social)](https://github.com/IsMoDex/YummyBot/stargazers)


Это корневой репозиторий для проекта **YummyBot**, объединяющий два микросервиса:
- **fridge-detector** — сервис распознавания продуктов на фото (Python + FastAPI)
- **yummybot-service** — Telegram-бот (Node.js + TypeScript)

## 📁 Структура проекта

```text
YummyBot/
├── services/
│   ├── fridge-detector/       # FastAPI сервис распознавания
│   └── yummybot-service/      # Telegram-бот на Node.js/TypeScript
├── docker-compose.yml         # Оркестровка сервисов
├── .env                       # Глобальные переменные окружения
├── README.md                  # Этот файл
└── .gitignore                 # Игнорируем файлы/папки во всех сервисах
```

## 🔧 Установка и запуск

**Перед началом убедитесь, что склонировали оба микросервиса в папку `services/`:**
```bash
cd ./services
# Клонируйте сервис бота
git clone https://github.com/IsMoDex/yummybot-service.git
# Клонируйте сервис распознавания
git clone https://github.com/IsMoDex/fridge-detector.git
cd ..
```

1. Склонировать репозиторий и перейти в корень:
   ```bash
   git clone <repo-url>
   cd YummyBot
   ```

2. Создать глобальный `.env` в корне (ПОКА В РАЗРАБОТКЕ, ПРОПУСТИТЕ ЭТОТ ПУНКТ):
   ```dotenv
   ## для yummybot-service
   BOT_TOKEN=your_telegram_bot_token
   DATABASE_URL="file:./services/yummybot-service/prisma/dev.db"
   DETECTOR_URL=http://detector:8000

   ## для fridge-detector
   ROBOFLOW_SERVER_URL=https://serverless.roboflow.com
   ROBOFLOW_MODEL_ID=smarterchef/5
   ROBOFLOW_API_KEY=D3WKPPwWPxm1RYuewbnX
   ```

3. Запустить всё через Docker Compose:
   ```bash
   docker-compose up -d --build
   docker-compose ps
   docker-compose logs -f detector bot
   ```

Сервисы:
- `detector` → обслуживается по порту 8000
- `bot` (yummybot-service) → работает внутри сети Docker, общается с `detector`

## 📚 Разработка

### fridge-detector

```bash
cd services/fridge-detector
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --env-file ../../.env
```

### yummybot-service

```bash
cd services/yummybot-service
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm run seed
pnpm run dev
```

## 🤝 Вклад и лицензия

PR и issue приветствуются!  
Лицензия — MIT © [IsMoDex](https://github.com/IsMoDex)