# AGENTS.md — Agent Harness 진입점

SessionStart Hook이 매 세션 자동 주입. 80줄 미만 유지 (Harness.md §3.1 "컨텍스트는 예산").

## §1 프로젝트
- 8명 운영 부동산 관리 SaaS. BE 63 API / 105 @Test / FE 59 E2E (Source: Review.md §7).
- 기능 동결 + 기반 재구축 중 (Phase 0~3d 완료, Phase 5 대기). 상세: `CLAUDE.md`.

## §2 시스템 구조
→ `docs/Inventory.md` (16 services, 14 포팅 자산, BE/FE 폴더 트리).

## §3 도메인
→ `docs/Domain_Analysis.md` (정산/연체/청구/매칭 계산 식 + 7대 갭).

## §4 카파시 9원칙 (Macro — 운영자)
→ `docs/Karpathy.md §[2]` + `docs/Apply.md §[2]` (실 자산 1:1 매핑).

## §5 4원칙 (Micro — AI 호출당)
→ `docs/Karpathy.md §[3]` + `docs/Apply.md §[3]`. 상세 `CLAUDE.md #24~#27`.

## §6 Rails 매트릭스
→ `docs/Apply.md §[2] 원칙 7 표` (Rails 안 = 검증가능 / Rails 밖 = C1·C2·C3).

## §7 Subagents 3종
→ `.claude/agents/{planner,implementer,reviewer}.md` (Sub-2). 운영 매뉴얼: `docs/Subagents.md`. orchestrator 직접 코드 작성 금지.

## §8 Hooks 4종
→ `.claude/settings.json` (Sub-3). SessionStart / PostToolUse×2 / Stop.

## §9 Critical 3건 (C1/C2/C3)
→ `docs/Apply.md §[1]`. C1 = 입금↔청구 paid 단절 (Ontology `pays_for` 관계 부재 = 본질).

## §10 자동화 영역
→ `docs/Automation.md` (5종 도구 + 13 카테고리, 카드 A~G).

## §11 도메인 온톨로지
→ `docs/Ontology.md` (16 노드 + 11 관계 + 6 룰). **`pays_for` = C1 본질**.

## §12 포팅 자산
→ `docs/Mapping.md` (CLAUDE.md Phase 3 14자산 × Inventory 대조, Sub-1 산출물).

## §13 Source of Truth
→ `docs/Review.md §7 정정 표` (수치 단일 진실 공급원).

## §14 Roadmap
→ `docs/Apply.md §[4]` Phase 1~3. **#1 매칭 + #8 인사이트 Phase 1 병렬**.

## §15 4원칙 한 줄
Think → Simplicity → Surgical → Goal-Driven. 상세: `CLAUDE.md #24~#27`.

## §16 인덱스
- 메인: `CLAUDE.md` / `AGENTS.md` (this)
- 문서: `docs/{Karpathy,Apply,Harness,Agent,Roadmap,Review,Domain_Analysis,Inventory,Automation,Ontology,Subagents,Mapping}.md`
- 카드 plans: `plans/YYYY-MM-DD-카드명.md` (Sub-3 자동 저장)
- 에이전트: `.claude/agents/*.md` (Sub-2)
