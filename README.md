# TNGReach
TNGReach is a wallet prototype with AI + eKYC capabilities.
## What it does
- Wallet flows: top-up, transfer, bill payment
- Transaction history
- AI assistant chat + voice
- eKYC IC scan
- Simple Mode
- Family Linkage
- Crowdfunding
## Stack
- Frontend: React + Vite
- Backend: Hono + Drizzle + MySQL
- Cloud:
  - AWS: Bedrock, Polly, Transcribe(+S3), Textract
  - Alibaba: OSS
## Quick Start
### 1) Install
```bash
npm install
2) Configure env
Root .env.local:

VITE_API_BASE_URL=http://localhost:3000
Backend server/.env.local (minimum):

NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://<user>:<pass>@<host>:3306/<db>
AWS_REGION=ap-southeast-1
AWS_BEDROCK_MODEL_ID=<model-id>
AWS_S3_MEDIA_BUCKET=<bucket>
ALIBABA_OSS_REGION=<region>
ALIBABA_OSS_BUCKET=<bucket>
ALIBABA_OSS_ACCESS_KEY_ID=<key>
ALIBABA_OSS_ACCESS_KEY_SECRET=<secret>
3) Database
npm run db:generate
npm run db:migrate
npm run db:seed
4) Run
Backend:

npm run server:dev
Frontend (new terminal):

npm run dev
