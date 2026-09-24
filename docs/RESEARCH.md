# Repository 조사 및 라이선스

확인일: 2026-09-24. 접근 가능한 네 저장소의 기본 branch HEAD를 shallow clone하여 source와 license 파일을 직접 읽었습니다. 구현 코드는 복사/이식하지 않았으며 의존성에도 추가하지 않았습니다. 아래 링크는 가능한 경우 조사한 commit으로 고정했습니다.

## 라이선스 확인 표

| Project | 확인한 license | 상업적 이용 | 코드 재사용 | 고지 의무 |
|---|---|---|---|---|
| UI-drop | 현재 원본 확인 불가. 검색 캐시 README는 MIT 표기 | 현재 조건 미확인 | 재사용하지 않음 | 원본 확인 전 확정 불가 |
| StyleLift | 조사 revision에 LICENSE/COPYING/NOTICE 없음, package.json에도 license 없음 | 저장소 공개만으로 허용 추정 불가 | 별도 허락 없이 재사용하지 않음 | 라이선스 부재로 조건 미확인 |
| Dembrandt | MIT | 허용 | 사용·수정·배포 가능 | 복사 또는 상당 부분에 copyright와 permission notice 유지 |
| browser-use | MIT | 허용 | 사용·수정·배포 가능 | 복사 또는 상당 부분에 copyright와 permission notice 유지 |
| Lattice | MIT | 허용 | 사용·수정·배포 가능 | 복사 또는 상당 부분에 copyright와 permission notice 유지 |

MIT의 무보증/책임 제한을 포함한 원문은 `docs/research-licenses/`에 조사 자료로 보관했습니다. 제품 UI에 별도 credit을 표시해야 한다는 조항은 없지만 복사본/상당 부분에 원문 고지를 보존해야 합니다. 별도 asset·하위 의존성 license는 해당 코드/asset 재사용 전에 별도로 확인해야 합니다. 이번 산출물에는 해당 프로젝트의 구현 코드·asset이 포함되지 않습니다. TypeScript는 개발 의존성이며 package-lock으로 고정합니다.

## UI-drop

[요청 저장소](https://github.com/tudorp06/UI-drop), [원본 LICENSE 경로](https://raw.githubusercontent.com/tudorp06/UI-drop/main/LICENSE).

Git clone, repository API, raw LICENSE/content.js 접근 모두 404였습니다. 공개 검색 캐시 README에는 Chrome extension의 browser-side token 추출, popup의 palette/component heuristics, background의 screenshot/AI 전달, MIT 표기가 남아 있습니다. 이 자료는 현재 소스·LICENSE를 대체하지 않습니다. DOM traversal, getComputedStyle 및 noise filter의 실제 구현은 확인하지 못했으므로 이를 확인된 설계 근거로 사용하지 않았습니다. AI 전달, screenshot, 확장 프로그램 구조는 채택하지 않았습니다. 접근 가능한 원본이나 새 URL이 제공되면 후속 확인이 필요합니다.

## StyleLift

Revision: `7c976f86cb6a037dfc3d37fb17da1640488d97b4`.

[extract-core.ts](https://github.com/sreenathmmenon/stylelift/blob/7c976f86cb6a037dfc3d37fb17da1640488d97b4/lib/extract-core.ts)에서 TreeWalker, visible geometry/computed-style sampling, open shadow roots, own text, 요소 상한 및 idle chunk 처리를 확인했습니다. [analysis 모듈](https://github.com/sreenathmmenon/stylelift/tree/7c976f86cb6a037dfc3d37fb17da1640488d97b4/lib/analyze)은 색상/spacing/component 군집화를 분리합니다.

참고한 원칙은 추출과 추론의 분리, 제한된 style property, shadow 지원입니다. visibility는 상속된 hidden 자식의 복원 등 본 라이브러리의 독립 정책으로 구현했습니다. CSSOM/deep scan, Chrome extension API, OKLCH·token scoring, 원본 denylist와 소스 코드는 사용하지 않았습니다. `git ls-tree` 및 root/package 파일에서 license를 찾지 못했고 GitHub license API도 404였습니다. 따라서 MIT로 단정하지 않습니다.

## Dembrandt

Revision: `29d54ba1b96232cc48c31470db7f78f6f2317d82`. 요청 URL은 [dembrandt/dembrandt](https://github.com/dembrandt/dembrandt)로 이동합니다.

[typography](https://github.com/dembrandt/dembrandt/blob/29d54ba1b96232cc48c31470db7f78f6f2317d82/lib/extractors/typography.ts), [spacing](https://github.com/dembrandt/dembrandt/blob/29d54ba1b96232cc48c31470db7f78f6f2317d82/lib/extractors/spacing.ts), [colors](https://github.com/dembrandt/dembrandt/blob/29d54ba1b96232cc48c31470db7f78f6f2317d82/lib/extractors/colors.ts), [components](https://github.com/dembrandt/dembrandt/blob/29d54ba1b96232cc48c31470db7f78f6f2317d82/lib/extractors/components.ts)를 확인했습니다. computed 값의 빈도, 글꼴·크기·굵기 조합, spacing 분포, 실제 paint 여부, component visual fingerprint를 활용합니다.

여기서는 제한된 computed descriptor와 exact dedup이라는 원칙만 참고했습니다. 유사 색상 군집화·scale 추론·component scoring은 구현하지 않았습니다. Playwright `page.evaluate`, consent click, screenshot 및 Node 실행 구조도 사용하지 않았습니다.

[LICENSE](https://github.com/dembrandt/dembrandt/blob/29d54ba1b96232cc48c31470db7f78f6f2317d82/LICENSE): MIT, Copyright (c) 2025 thevangelist.

## browser-use

Revision: `d8110c5ff87ccba887aaa726cdb780f2f84bef8d`.

[serializer](https://github.com/browser-use/browser-use/blob/d8110c5ff87ccba887aaa726cdb780f2f84bef8d/browser_use/dom/serializer/serializer.py), [clickable detector](https://github.com/browser-use/browser-use/blob/d8110c5ff87ccba887aaa726cdb780f2f84bef8d/browser_use/dom/serializer/clickable_elements.py), [DOM service](https://github.com/browser-use/browser-use/blob/d8110c5ff87ccba887aaa726cdb780f2f84bef8d/browser_use/dom/service.py)를 확인했습니다. 정리된 트리·visibility·geometry·interactive index를 통해 agent 입력을 축약합니다. native tag 외 ARIA, focus/editability, event listener 신호를 활용합니다.

상호작용과 visibility를 독립 특징으로 두고 evidence를 기록하는 원칙을 채택했습니다. privileged CDP listener 탐색, AX tree 수집, framework 내부 event handler 탐색, class/data 기반 광범위 추정, agent/LLM/action 실행은 채택하지 않았습니다. 일반 페이지 JavaScript로 확인 가능한 role/tabindex/onclick/cursor만 사용합니다.

[LICENSE](https://github.com/browser-use/browser-use/blob/d8110c5ff87ccba887aaa726cdb780f2f84bef8d/LICENSE): MIT, Copyright (c) 2024 Gregor Zunic.

## Lattice

Revision: `84f815b8c0261912fd2b887b2cccabbde01be262`.

[capture](https://github.com/apatureai/lattice/blob/84f815b8c0261912fd2b887b2cccabbde01be262/packages/capture/src/capture.ts), [schema](https://github.com/apatureai/lattice/blob/84f815b8c0261912fd2b887b2cccabbde01be262/packages/schema/src/types.ts), [canonicalization](https://github.com/apatureai/lattice/blob/84f815b8c0261912fd2b887b2cccabbde01be262/packages/schema/src/canonical.ts), [geometry](https://github.com/apatureai/lattice/blob/84f815b8c0261912fd2b887b2cccabbde01be262/packages/schema/src/pipeline/geometry.ts)를 확인했습니다.

DOM snapshot·AX·computed style를 합친 scene graph, 정규 직렬화, 명시적인 frame 좌표, budgeted model view라는 분리를 참고했습니다. 본 구현은 scope·좌표·coverage와 근사 name 출처를 명시합니다. full AX fusion, content-addressed graph, Node crypto, CDP frame capture, 충돌하는 evidence 판정, prompt view renderer는 구현하지 않았습니다. exact style serialization에는 hash 자체가 필요하지 않습니다.

[LICENSE](https://github.com/apatureai/lattice/blob/84f815b8c0261912fd2b887b2cccabbde01be262/LICENSE): MIT, Copyright (c) 2026 Aditya Prathapa.

## 재사용 기록

| 종류 | source | license/copyright | 수정 여부 |
|---|---|---|---|
| 연구용 라이선스 원문 3개 | 위 pinned LICENSE | 각 MIT/copyright 원문 유지 | 수정 없음 |
| 구현 코드/테스트/fixture | 본 작업에서 독립 작성 | 위 프로젝트 코드 재사용 없음 | 해당 없음 |
