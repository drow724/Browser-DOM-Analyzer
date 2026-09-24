# Validation / Benchmark

검증일: 2026-09-24. 원시 결과는 `test-results.json`에 있습니다.

## 통과한 검증

- `npm test`: TypeScript strict build + Node 기본 test runner의 순수 함수 단위 테스트 **5/5 통과**. DOM emulator를 사용하지 않습니다.
- `tests/browser.html`: 실제 embedded Chromium 152에서 **13/13 통과**. fixture를 실제 same-origin iframe로 로드하고 라이브러리를 그 Document에 실행했습니다. browser API를 모의 처리하지 않았습니다.
- `benchmark/`: 실제 버튼 클릭 후 지표 표시와 JSON 다운로드 버튼 활성화를 확인했습니다.

브라우저 검증은 product/form/nested/hidden/shadow/iframe fixture, bidirectional tree·도달 가능성·style/scope reference, hidden descendants, value getter 비접근, contenteditable·private shadow·IDREF privacy, style dedup, 동일 snapshot, 분석 중 DOM mutation 0건, custom policy, origin-only URL, options/budget를 포함합니다.

기본 노드 관계는 단순 snapshot 문자열 비교 대신 실제 expected heading/label/button 내용과 부모 관계, 금지 문자열 부재 및 graph invariant로 확인합니다. 추가 privacy fixture에서 nested clipped helper의 자식과 content-visibility:hidden 직접 텍스트가 제외되는 것도 검증합니다.

## 1,000개 card fixture 측정

조건: macOS 호스트의 실제 embedded Chromium 152, fixture viewport 1000×700 CSS px, style 추출 활성화, 한 번 warm-up 후 연속 5회, LLM/네트워크 없이 동기 분석. `performance.now()`로 분석 호출 내부를 측정하며 fixture 생성·JSON 출력·직렬화는 시간에 포함하지 않습니다.

| 지표 | 결과 |
|---|---:|
| 실제 light-DOM 요소 | 5,014 |
| Scanned Elements | 5,014 |
| Included Nodes | 2,009 |
| Ignored Elements | 3,005 |
| Unique Styles | 7 |
| 5회 시간 (ms) | 149.8 / 205.5 / 161.8 / 168.7 / 165.7 |
| 중앙값 | 165.7 ms |
| min–max | 149.8–205.5 ms |
| JSON UTF-8 크기 | 1,039,784 bytes |

노드 수 약 60%를 축약했지만 의미·geometry·property key를 추가하므로 raw HTML보다 byte 수가 항상 작지는 않습니다. 이것은 구조 압축 지표이며 token 압축률 주장이 아닙니다. 후속 Semantic Map 단계의 budgeted view가 필요합니다.

별도 시각적 benchmark 페이지의 1,000개 styled card는 7,031개 스캔 → 5,007개 포함 / 2,024개 제외 / 12개 스타일 / **297.1ms**였습니다. 이 페이지는 heading/price/category/button와 장식된 article을 유지하기 때문에 wrapper 위주의 성능 fixture와 포함 비율이 다릅니다.

초기 11-case 실행의 같은 5,014개 fixture 측정은 131.5–153.1ms였습니다. 최종 회귀 테스트 후 위 13-case 기록을 기준 결과로 보존했습니다. 브라우저 부하·캐시·CPU에 따라 달라지며 production SLA는 아닙니다. 150ms 이상의 동기 main-thread 점유가 가능하므로 사용자 입력 중 반복 호출하기보다 idle 시점에서 한 번 실행하는 것이 적절합니다. Phase 1에 async/chunked API는 구현하지 않았습니다.

## 자동 CLI 경로의 한계

별도 설치된 Google Chrome 153을 새 테스트 profile의 `--headless --dump-dom`으로 실행했으나 이 호스트에서는 90초 startup/test timeout이 두 번 발생했습니다. 원인을 확정하지 않았으며 CLI 경로 통과로 보고하지 않습니다. 테스트 코드는 embedded Chromium에서 실제로 실행되어 전체 통과했습니다. CLI runner는 이제 60초 제한과 process-group 정리를 포함합니다.

재현 방법:

```sh
npm ci
npm test
npm run serve
# 실제 브라우저에서 http://127.0.0.1:4173/tests/browser.html 열기
# Chrome CLI 실행 가능한 환경에서는:
npm run test:browser
```

Firefox/Safari, multi-frame 병합, full accessibility name compliance, 모든 clipping/occlusion 경우는 검증하지 않았습니다.
