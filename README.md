# 하이랄 두더지 잡기 🗡️

🎮 플레이: https://test-alpha-nine-47.vercel.app/

젤다의 전설 분위기의 두더지 잡기 게임. 순수 HTML / CSS / JavaScript (npm 불필요).

## 로컬 실행

폴더에서 `index.html` 을 브라우저로 열거나, 간단한 정적 서버로 실행:

```powershell
python -m http.server 8080
# http://localhost:8080
```

Supabase 키가 비어 있으면 점수/리뷰는 브라우저 localStorage 에 저장됩니다.

## 게임 방법

- 30초 동안 구멍에서 튀어나오는 몬스터를 클릭해 루피를 모읍니다.
- 👹 10 / 🐙 15 / 🦇 20 / 🧚 30 루피
- 💣 폭탄을 누르면 하트 -1. 하트 3개 모두 잃으면 게임 종료.

## Supabase 연결

1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor 에 `supabase/schema.sql` 내용을 붙여넣고 실행
3. Project Settings > API 에서 `Project URL` 과 `anon public` 키 복사
4. `supabase-config.js` 에 값 입력

```js
window.SUPABASE_CONFIG = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJ...',
};
```

anon 키는 공개용 키이며, RLS 정책으로 읽기/추가만 허용됩니다.

## GitHub 저장

```powershell
git init
git add .
git commit -m "하이랄 두더지 잡기 초기 버전"
git branch -M main
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

## Vercel 배포

1. https://vercel.com 에서 GitHub 저장소 Import
2. Framework Preset: **Other**, Build Command 비움, Output Directory 비움
3. Deploy

정적 사이트이므로 추가 설정 없이 바로 배포됩니다.
