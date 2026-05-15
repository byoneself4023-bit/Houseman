# Setup_4 — 단계 1 Sub-4 (종합 검증 + Phase 1 첫 카드 dry run)

**Plan mode 필수**. Sub-1 + Sub-2 + Sub-3 산출물 완료 후 진행.

---

## 선행 자산 확인

- Sub-1: `AGENTS.md` / `docs/HAUT_Mapping.md` / `CLAUDE.md #20~#27`
- Sub-2: `.claude/agents/planner.md` / `implementer.md` / `reviewer.md`
- Sub-3: `.claude/settings.json` / `scripts/` 3 셸 / `plans/README.md`
- 미박힘 시 즉시 중단

## 입력 자산

Sub-1+2+3 산출물 전체 + `docs/*.md` 10개 + `CLAUDE.md`.

---

## 산출물 1개

### `plans/{YYYY-MM-DD}-agent-harness-setup.md` — **단계 1 자체가 plans/ 첫 카드** (메타 자기참조, CLAUDE.md #22)

`scripts/save-plan.sh` 형식 따름:

```markdown
# 카드: agent-harness-setup
date: {YYYY-MM-DD}

## 카드 정의
Houseman Agent Harness 구축 — Setup_1/2/3/4 분할 실행. 산출물 13개 (문서 3 + Subagent 3 + Hook+Script 5 + 첫 plan 1 + AGENTS.md/CLAUDE.md 갱신 2).

## planner 출력
(생략 — 단계 1은 운영자 직접 의사결정, planner 비호출. 4 sub-prompt가 plan을 대체)

## implementer 출력
### 변경 파일 목록
- AGENTS.md (신규)
- CLAUDE.md (+ #20~#27 카테고리)
- docs/HAUT_Mapping.md (신규)
- .claude/agents/planner.md (신규)
- .claude/agents/implementer.md (신규)
- .claude/agents/reviewer.md (신규)
- .claude/settings.json (신규)
- scripts/run-related-tests.sh (신규)
- scripts/critical-rules-check.sh (신규)
- scripts/save-plan.sh (신규)
- plans/README.md (신규)
- plans/{YYYY-MM-DD}-agent-harness-setup.md (이 파일, 신규)

### 자가 점검 결과
- [x] Simplicity (AGENTS.md 80줄 미만)
- [x] Surgical (CLAUDE.md 기존 영역 0 수정)
- [x] Goal-Driven (검증 5건 다 PASS)

## reviewer 결과
### 검증 1~5 결과
- 검증 1 (BE 테스트 자동): PASS / FAIL
- 검증 2 (alert exit 1): PASS / FAIL
- 검증 3 (docs 수정 차단, 검사 6): PASS / FAIL
- 검증 4 (AGENTS.md 자동 주입): PASS / FAIL
- 검증 5 (C1-a dry run): PASS / FAIL

### 다음 액션
PASS: Phase 1 첫 카드 (C1-a) 정식 분해 prompt 요청 — 운영자가 다음 세션에서 진행

## PR 링크
(없음 — 단계 1은 인프라 구축이라 PR 단위로 묶지 않음)
```

---

## 검증 5: Phase 1 첫 카드 (C1-a) dry run

운영자가 다음 프롬프트로 planner subagent 호출:

```
C1-a 카드 분해 (dry run, 실 코드 작성 X)

카드 정의:
- BillingService.markPaid() 신규 + PATCH /api/billing/{id}/paid + Flyway V12 status enum 확장 (SENT → PAID/PARTIAL) + TransactionService.create()에서 BillingRecord 자동 갱신 + 통합 테스트
- 도메인 의미 관계상 Transaction.pays_for(BillingRecord) 관계 첫 정식화 (Ontology.md §[2])
```

**확인 사항** (planner 6 섹션 출력 검사):

1. **§1 가정 섹션**:
   - [ ] HAUT 자산 4건 중 관련 자산 (BillingService 포팅 완료) 명시
   - [ ] `pays_for` 관계 기존 박힘 여부 확인 (Ontology.md §[2] 기준 미박힘)
   - [ ] `BillingRecord.status` enum 현재 상태 (DRAFT/CONFIRMED/SENT) 명시

2. **§2 트레이드오프 섹션**:
   - [ ] Flyway V12 enum 확장 vs status 컬럼 분리 등 비교
   - [ ] retro-fit 시점 (BE 배포 전 vs 후) 비교

3. **§3 선택지**:
   - [ ] 최소 2개 옵션 명시 + 추천 + 근거

4. **§4 단계별 plan**:
   - [ ] `BillingService.kt` 어디에 markPaid 신규
   - [ ] `TransactionService.kt:35-71` 어디에 BillingRecord 매칭 호출 추가
   - [ ] Flyway V12 SQL 위치 + 내용
   - [ ] `src/data/domainOntology.ts` `pays_for` 관계 박을 위치 명시 (Ontology 정식화 강제)

5. **§5 검증 방법** (Goal-Driven #27):
   - [ ] BE 단위 테스트: `BillingServiceTest` 어떤 케이스
   - [ ] BE 통합 테스트: `PaymentFlowTest` 회귀
   - [ ] 회귀: 105 @Test 중 BillingRecord 의존 N건 PASS 확인

6. **§6 위험 + 롤백**:
   - [ ] Flyway V12 down 스크립트
   - [ ] retro-fit 실패 시 audit_log 기반 복구

**6 섹션 다 PASS면 검증 5 통과**. 1개라도 미달 시 planner.md 보완 필요 → Sub-2 재진입.

---

## 최종 보고 (단계 1 종료)

- Sub-1+2+3+4 산출물 총 13개 (파일 경로 + 라인 수)
- 검증 1~5 결과 (PASS/FAIL)
- 발견한 이슈 (있으면)
- 단계 1 plans/ 첫 카드 파일 경로
- **다음 단계 안내**: 운영자가 Phase 1 첫 카드 정식 분해 prompt 작성 → 다음 세션에서 진행. dry run의 plan이 그대로 실 작업 plan으로 활용 가능.

---

## 절대 금지

- Sub-1, Sub-2, Sub-3 산출물 임의 수정 (검증만)
- C1-a 실 코드 작성 (dry run만)
- docs/*.md 수정 (HAUT_Mapping.md 제외)
- 검증 5 미달 상태로 단계 1 종료 보고
