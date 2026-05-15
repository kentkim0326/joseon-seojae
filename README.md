# 조선서재 朝鮮書齋

> AI × 문화재청 공공데이터 기반 역사 웹소설 고증 어시스턴트  
> 제4회 문화체육관광 인공지능·데이터 활용 공모전 출품작

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 아래 두 값 입력:
# ANTHROPIC_API_KEY=sk-ant-...
# HERITAGE_API_KEY=발급받은키...

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

---

## Vercel 배포

```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 배포
vercel

# 환경변수는 Vercel 대시보드에서 설정:
# Settings → Environment Variables
# ANTHROPIC_API_KEY / HERITAGE_API_KEY
```

또는 GitHub에 push 후 Vercel 대시보드에서 Import Project.

---

## API 키 발급

### Claude API (Anthropic)
1. https://console.anthropic.com 접속
2. API Keys → Create Key
3. 생성된 키를 `ANTHROPIC_API_KEY`에 입력

### 문화재청 공공데이터 API
1. https://www.data.go.kr 접속
2. 검색창에 "문화재청 문화재 검색" 입력
3. 활용신청 → 승인 후 인증키 발급 (즉시 또는 1~2일)
4. 발급된 키를 `HERITAGE_API_KEY`에 입력

> API 키 없이도 Claude AI 고증 기능은 정상 작동합니다.  
> 문화재청 키가 있으면 관련 문화재 실시간 데이터가 추가됩니다.

---

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **AI**: Claude Sonnet (Anthropic API)
- **공공데이터**: 문화재청 문화재 검색 서비스 API
- **배포**: Vercel

---

## 활용 데이터 출처

| 데이터 | 출처 | 라이선스 |
|--------|------|----------|
| 문화재 검색 서비스 | 문화재청 (data.go.kr) | 공공누리 1유형 |
| 전통문양 DB | 문화공공데이터광장 | 공공누리 1유형 |
| AI 언어모델 | Anthropic Claude | 상업적 이용 가능 |
