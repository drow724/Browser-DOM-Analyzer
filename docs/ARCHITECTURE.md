# Architecture / Schema / Next Phase

## 구현 계획과 결과

초기 작업 폴더에는 repository나 package가 없었습니다. 참고 repository의 실제 source/license 조사 후 TypeScript schema·privacy → traversal/filter/features/style registry → 실제 브라우저 fixture → benchmark/doc 순서로 독립 구현했습니다. 복잡한 추상화, observer, backend 또는 AI runtime은 추가하지 않았습니다.

```text
document (live browser)
  → iterative composed traversal (open shadow / slots)
  → privacy & visibility gates
  → semantic + interaction + geometry extraction
  → replaceable wrapper/noise policy
  → bounded text / computed-style normalization
  → exact canonical style registry
  → SiteDOMModel (nodes + scopes + styles + coverage + stats)
```

DOM 읽기는 synchronous snapshot입니다. 요소마다 필요한 computed style과 rect를 읽고 style은 포함 노드에 대해서만 저장합니다. text-owner/accessible-name은 별도의 제한된 text walk를 사용합니다. DOM write와 read를 섞지 않습니다. 매번 브라우저 state를 새로 읽어 전역 캐시의 stale-data 문제를 피합니다.

## 모듈

| 경로 | 책임 |
|---|---|
| `src/analyzer/analyzeDOM.ts` | 옵션·privacy gate·snapshot 조립·통계 |
| `src/traversal/traverseDOM.ts` | stack DFS·open shadow·slot 배치 |
| `src/filtering/` | CSS visibility 및 교체 가능한 wrapper 정책 |
| `src/features/` | role/name/text, interaction evidence, viewport geometry |
| `src/privacy/sanitize.ts` | value-free 정책·text/URL 정제·private 영역 |
| `src/styles/` | CSS allowlist·canonical serialization·exact dedup |
| `src/model/SiteDOMModel.ts` | 공개 schema |

## Schema 결정

전체 TypeScript interface는 `src/model/SiteDOMModel.ts`가 유일한 원본입니다.

- **SiteDOMModel:** version, safe url, viewport, coordinateSpace, nodes/rootId, styles, scopes, coverage, stats. node map은 원형 참조 없이 JSON.stringify할 수 있습니다. `scanDurationMs`만 비결정적 측정 metadata입니다.
- **SiteNode.identity:** tag 기본, DOM id/classes는 명시적 opt-in. model ID와 실제 DOM id는 다릅니다.
- **SiteNode.semantic:** role과 explicit/implicit 출처, name과 `aria-labelledby/aria-label/label/alt/text/title` 출처, bounded text/title/alt 및 inherited ariaHidden. 원래 제안의 ariaLabel 단일 필드를 이름·출처로 일반화했습니다. ARIA state 중 사용자 선택/입력 상태는 이번 버전에 포함하지 않습니다.
- **SiteNode.interaction:** interactive는 신호가 있는 control/candidate, clickable/focusable은 disabled/inert를 반영한 추정입니다. editable은 control/editing capability입니다. 실행 가능성이나 hit test 보증이 아닙니다. evidence로 native/role/editable/tabindex/onclick/cursor 근거를 구분합니다.
- **SiteNode.layout:** visible와 inViewport를 구별합니다. rect는 viewport CSS px. position과 numeric zIndex를 저장하며 auto는 생략합니다.
- **SiteNode.structure:** 포함된 가장 가까운 부모, 순서 보존 childrenIds, composed scopeId. collapsed wrapper를 경유해도 양방향 연결을 유지합니다.
- **scopes:** document 및 open-shadow host 경계를 기록합니다. slot에 배치된 light node는 **composed 위치의 shadow scope**를 사용합니다. 이는 원래 DOM 소유권 표가 아닙니다. slot 요소를 유지하여 삽입 위치를 해석할 수 있게 합니다.
- **boundary:** open shadow 표시와 iframe의 not-traversed 상태. closed shadow의 존재를 일반 script에서 검출할 수 없으므로 존재를 추측하여 표시하지 않습니다.
- **StyleDescriptor:** CSS property 이름 → normalized computed string. side별 margin/padding/border/radius, typography, colors, shadow, cursor, stacking, flex alignment를 보존합니다. shorthand만 저장할 때 생기는 비대칭 정보 손실을 피합니다. URL/content/custom properties를 수집하지 않습니다. browser computed serialization만 정규화하고 색상을 임의로 반올림·군집화하지 않습니다.

모델은 후속 semantic 처리의 입력이지 바로 LLM prompt로 전송할 최종 token format은 아닙니다. JSON key 반복 비용이 있으므로 element 수 감소가 byte/token 수의 동일 비율 감소를 보장하지 않습니다.

## Filtering / 안전성의 구체적 선택

display:none·opacity:0·script/style/head/template/noscript·private 영역은 subtree 특징 추출을 막습니다. visibility:hidden은 자식의 visible override를 보존하기 위해 자식 탐색을 이어갑니다. zero box 및 display:contents 부모에서도 자식은 보존합니다. 아래쪽 offscreen 요소는 현재 문서의 일부이므로 남깁니다. 1px clipped helper는 독립 노드에서 제외하되 explicit label 참조에는 사용할 수 있습니다.

svg root의 의미/box/style은 남기고 내부 primitive는 축약합니다. 아이콘 class 이름, framework hash class, 광고/트래킹 추정 이름만으로 subtree를 제거하지 않습니다. 그렇지 않으면 정상 UI가 사라질 수 있습니다. 고객별 tracking/widget 정책은 selector/filter로 추가할 수 있습니다.

same-origin iframe를 지금 병합하면 별도 viewport, frame border/transform, loading lifecycle, origin 변경을 처리해야 합니다. 정확성 범위를 명확히 하기 위해 모든 iframe를 boundary-only로 통일했습니다. iframe document를 읽지 않아 cross-origin 예외가 분석 전체를 중단하지 않습니다.

## 다음 단계 제안 — 구현하지 않음

1. **Design tokens:** style frequency를 실제 text/paint/area와 연결하여 colors, type ramp, spacing/radius scale 후보를 산출. 측정 값과 inferred token을 분리하고 근거 node/style ID를 유지합니다.
2. **Semantic regions:** landmark/heading/tree/layout/반복 패턴으로 navigation, product details, purchase actions, reviews, form 영역을 결정적으로 그룹화합니다. confidence와 근거를 기록합니다.
3. **Site Semantic Map:** region → components → node IDs와 geometry anchors를 연결. raw DOM 대신 task-relevant bounded view를 생성하며 token budget, 중복 제거, privacy boundary를 적용합니다.
4. **정확성 확장:** AccName/role edge cases, clipping/occlusion, same-origin frame별 좌표, writing modes, browser 차이를 fixture로 확대합니다.
5. **성능:** 측정 결과에 따라 resumable traversal와 requestIdleCallback 기반 비동기 API를 추가. async snapshot 도중 문서 변경을 감지하고 partial/stale 상태를 명시합니다. 이후 MutationObserver 변경 집합·증분 style invalidation을 검토합니다.
6. **ID 안정성:** 영구 DOM identity와 snapshot ordinal을 구분하는 resolver를 설계합니다. 현재 model ID를 미래 DOM mutation target으로 직접 사용하지 않습니다.

행동 관찰·intent·LLM planner·UI Action AST·safe mutation runtime은 그 이후 별도 단계입니다.
