# Easy FX

20대를 위한 FX(외환) 모의투자 휴대폰 웹앱.

- **실시간**: 지금 시세(Kraken, Coinbase)로 가상 1,000만 원 계좌를 굴려봐요. 레버리지, 증거금, 강제청산까지 실제 FX처럼.
- **연습**: 엔화 대폭락, 브렉시트 같은 실제 과거 한 달을 5분에 재생해요.
- **기록**: 거래 내역과 연습 결과.

모의투자 앱이며 투자 권유가 아닙니다.

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # 테스트
npm run build    # dist/ 에 빌드
```

연습 모드 데이터: [HistData](https://www.histdata.com/download-free-forex-historical-data/?/ascii/1-minute-bar-quotes)의 1분봉 CSV를 한 폴더에 풀고 `npm run convert-data -- <폴더>` → `public/scenarios/*.json` 생성.

`main`에 push하면 GitHub Actions가 테스트, 빌드 후 GitHub Pages에 배포해요.
