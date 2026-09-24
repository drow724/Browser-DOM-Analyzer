# Site DOM Model — Phase 1.1

브라우저의 현재 문서를 읽어 의미·상호작용·레이아웃·스타일을 구조화하는 TypeScript 라이브러리입니다. 런타임 의존성 없이 DOM API만 사용합니다. LLM, 네트워크 요청, 행동 수집, storage 접근, DOM 변경, observer 설치는 없습니다.

```ts
import { analyzeDOM } from './dist/index.js';
const model = analyzeDOM(document);
```

## 실행

Node.js 18+와 Python 3는 **개발 도구**에만 필요합니다. 배포된 `dist/`는 브라우저 ES module입니다.

```sh
npm ci
npm run build
npm test                 # typecheck/build + pure unit tests
npm run test:browser     # optional standalone Chrome CLI runner
npm run serve
```

- 벤치마크: <http://127.0.0.1:4173/benchmark/>
- 브라우저 테스트: <http://127.0.0.1:4173/tests/browser.html>
- 브라우저 검증은 `tests/browser.html`에서 자체 실행됩니다. 선택적인 CLI 러너는 실제 Chrome/Chromium을 사용합니다. Playwright/Puppeteer/jsdom은 사용하지 않습니다. Chrome 경로를 찾지 못하면 `CHROME_BIN`을 설정합니다.
- 벤치마크에서 fixture 생성 → `analyzeDOM(document)` → 지표·JSON 확인·다운로드가 가능합니다. 도구 UI 자체는 분석에서 제외됩니다.
- 이번 환경에서는 embedded Chromium에서 13개 브라우저 테스트를 통과했습니다. 별도 Google Chrome CLI는 시작 timeout이 발생했습니다. 그 경우 위 브라우저 테스트 URL을 직접 열어 같은 검증을 실행할 수 있습니다.
- `dist/`와 선언 파일을 포함하여 별도 빌드 없이 정적 HTTP 서버로 사용 가능합니다.

```html
<script type="module">
  import { analyzeDOM } from './dist/index.js';
  const model = analyzeDOM(document);
  console.log(model);
</script>
```

## API

기존 serialized API는 그대로 유지됩니다. 실제 DOM mutation target과 연결해야 할 때만 runtime snapshot을 사용합니다.

```ts
import { createDOMSnapshot } from './dist/index.js';

const snapshot = createDOMSnapshot(document);
const model = snapshot.model;
const element = snapshot.resolve('n143');
const nodeId = element ? snapshot.getNodeId(element) : undefined;

snapshot.isConnected(nodeId ?? '');
snapshot.isStale();
snapshot.dispose();
```

`SiteDOMModel`에는 live Element가 포함되지 않습니다. `parentId`는 wrapper collapse 이후의 logical parent이고 실제 physical parent는 `snapshot.resolve(nodeId)?.parentElement`로 확인합니다. NodeId는 snapshot-local이며 다른 snapshot의 같은 ID와 동일한 DOM identity를 뜻하지 않습니다.

```ts
const model = analyzeDOM(document, {
  styles: true,
  maxTextLength: 240,
  maxElements: 100_000,
  privacy: {
    urlMode: 'origin', // 'path'는 명시적 선택, 'omit'도 가능
    includeIdentity: false,
    excludeSelectors: ['.account-details'],
    redact: (text, kind) => text.replace(/고객번호\s*\d+/g, '[고객번호]'),
  },
});
```

`data-private` 또는 `data-dom-analyzer-ignore`가 있는 영역은 기본적으로 제외합니다. `filter(context)`는 `include`, `collapse`, `exclude-subtree`를 반환합니다. `defaultFilter`를 호출하여 일부 규칙만 변경할 수 있습니다. 기본 개인정보/비표시 보호 규칙은 사용자 filter보다 먼저 적용됩니다. 잘못된 selector나 옵션은 예외로 보고합니다. live `Document`가 없는 서버/DOMParser 문서는 지원하지 않습니다.

```ts
import { analyzeDOM, defaultFilter } from './dist/index.js';
const model = analyzeDOM(document, {
  filter: context => context.element.localName === 'footer'
    ? 'exclude-subtree'
    : defaultFilter(context),
});
```

## 설계와 범위

- **순회:** 반복형 DFS, open Shadow DOM과 slot 배치 반영. 접근 불가능한 closed root는 탐색하지 않습니다.
- **축약:** 의미 없는 div/span을 접고 가장 가까운 포함 부모에 연결합니다. 버튼/제목/label의 텍스트는 소유 요소에 모으며 중복 하위 텍스트를 줄입니다. grid/flex/장식/위치 정보가 있는 wrapper는 유지합니다.
- **의미:** native/ARIA role, ARIA IDREF·label·alt·text·title 기반의 근사 이름과 출처를 기록합니다. 브라우저의 완전한 접근성 트리나 전체 AccName 구현은 아닙니다.
- **좌표:** 해당 Document viewport 기준 CSS px, 소수점 두 자리. `scrollX/Y`를 별도 저장합니다. offscreen은 유지하고 `inViewport`로 구분합니다. `visible`은 CSS와 box 기반 추정이며 가림/전체 clipping/실제 클릭 성공을 보장하지 않습니다.
- **스타일:** 40여 개 allowlist property의 computed string을 추출합니다. key 정렬 canonical JSON을 Map key로 사용하여 정확히 중복 제거합니다. 손실 해시를 쓰지 않아 해시 충돌이 없습니다. 디자인 토큰 추론·색상 군집화는 다음 단계입니다.
- **ID:** `n<순회번호>`, `s<처음 등장 순서>`는 동일 DOM·스타일·viewport·옵션에서 안정적입니다. DOM 편집 전후의 영구 ID는 아닙니다. 실행시간을 제외한 snapshot은 결정적입니다. 애니메이션·폰트 로딩·반응형 변화는 실제 입력 상태를 바꿉니다.
- **iframe:** same-origin/cross-origin 모두 경계 노드만 기록합니다. `contentDocument`를 읽지 않아 SecurityError가 발생하는 경로를 만들지 않았습니다. same-origin 분석이 필요하면 호출자가 접근 가능한 document를 별도 `analyzeDOM(frameDocument)`로 분석할 수 있으나, 좌표·트리 병합은 지원하지 않습니다.
- **측정:** `scannedElements = includedElements + ignoredElements`. composed tree에서 방문한 요소 수이며 숨긴 subtree도 개수 산정을 위해 요소만 순회합니다. unassigned light DOM, closed shadow, template contents, iframe 내부는 포함하지 않습니다. `maxElements` 도달 시 `coverage.truncated=true`입니다. 텍스트 이름 추출의 별도 bounded walk가 있으므로 전체 DOM API 호출 횟수 제한을 의미하지 않습니다.

## 개인정보 경계

입력값·textarea 본문·select 옵션/선택값·contenteditable 하위 텍스트·script state를 수집하지 않습니다. `value` getter도 읽지 않습니다. cookie/localStorage/sessionStorage 및 arbitrary attribute/event handler 본문은 접근하지 않습니다. URL은 기본 origin만, id/class는 기본 제외입니다. 명시적 `path`/identity 옵션은 페이지 데이터가 포함될 수 있습니다.

보이는 일반 문구나 `aria-label/title/alt`에 사이트가 직접 개인정보를 렌더링한 경우, DOM만으로 사용자 작성 여부를 완전히 구분할 수 없습니다. email/Bearer/JWT 정제는 보조 수단입니다. 민감 영역은 `data-private`/`excludeSelectors`로 제외하고 서비스별 `redact`를 적용해야 합니다. 이 모델은 자동 익명화나 외부 전송 안전성의 보증이 아닙니다. 수집한 문자열은 신뢰할 수 없는 데이터이며, 뷰어에서는 `textContent`로 출력해야 합니다.

## 문서

- [조사·라이선스와 확인한 source revision](docs/RESEARCH.md)
- [아키텍처·schema·다음 단계](docs/ARCHITECTURE.md)
- [검증 및 성능 측정](docs/VALIDATION.md)
- [실제 테스트 결과 JSON](docs/test-results.json)

최종 TypeScript schema는 `src/model/SiteDOMModel.ts`, 진입점은 `src/index.ts`입니다. 테스트/벤치마크 페이지는 fixture와 결과 표시를 위해 DOM을 변경하지만 **라이브러리 분석 함수는 읽기 전용**입니다.


## Package / license status

현재 이 repository 자체의 배포 라이선스는 선택되지 않았고 `package.json`의 `private: true`도 유지합니다. `docs/research-licenses/`는 참고 프로젝트의 라이선스 사본이지 이 프로젝트의 라이선스가 아닙니다. 공개 npm/오픈소스 배포 전에 repository owner가 라이선스와 package 공개 정책을 명시적으로 선택해야 합니다.
