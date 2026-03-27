# 백엔드 기본 인프라 — 실행 결과 분석

---

## 실행 환경

- Phase 0~2 완료 상태 (프론트엔드 VITE_USE_API=false 유지)
- HAUT 백엔드 코드 참조: /Users/kuka/Haut/backend (WebFlux 기반)
- 프로토타입 데이터: staff.ts 9명, buildings.ts 21개, roomMasterData.ts 200호실
- 절대 원칙: 프론트엔드 코드 미수정. 도메인 로직/워크플로우 변경 없음. 데이터 필드 추가/삭제 없음.

---

## Part 1: 프로젝트 생성 + global 인프라 + Flyway

### Step 1: Spring Boot 프로젝트 생성

houseman-server/ 디렉토리에 Spring Boot 3.4.3 + Kotlin 2.1.10 프로젝트 생성. build.gradle.kts는 HAUT 기반으로 작성하되 불필요한 의존성(Redis, n8n, WebSocket, QueryDSL, POI, OpenPDF, Jasypt, coroutines) 제거. jjwt(io.jsonwebtoken) 0.12.6 추가.

Gradle Wrapper 8.12 설치. gradlew, gradle-wrapper.jar, gradle-wrapper.properties를 GitHub에서 직접 다운로드.

### Step 2: global/ 패키지 — HAUT → Houseman MVC 변환

HAUT가 WebFlux(리액티브) 기반이라 단순 패키지명 변경이 아닌 Servlet API로의 전면 변환이 필요했다.

| 파일 | HAUT (WebFlux) | Houseman (MVC) |
|------|---------------|---------------|
| SecurityConfig.kt | @EnableWebFluxSecurity + ServerHttpSecurity | @EnableWebSecurity + HttpSecurity + SessionCreationPolicy.STATELESS |
| GlobalExceptionHandler.kt | WebExchangeBindException | MethodArgumentNotValidException + HttpMessageNotReadableException |
| CorsConfig.kt | WebFluxConfigurer | WebMvcConfigurer |
| JacksonConfig.kt | WebFluxConfigurer + ServerCodecConfigurer | ObjectMapper @Bean |
| RequestLoggingFilter.kt | WebFlux WebFilter + Reactor Context | Servlet OncePerRequestFilter + MDC (ThreadLocal) |

HAUT에서 그대로 복사(패키지명만 변경)한 파일: BaseEntity.kt, ApiResponse.kt, BusinessException.kt.

HAUT에 없어서 신규 작성한 파일: JwtProvider.kt(jjwt 기반), JwtAuthFilter.kt(OncePerRequestFilter), UserPrincipal.kt.

HAUT에서 제거한 파일: MdcContextLifter.kt(Reactor 전용), RedisConfig.kt, BankdaConfig.kt, NaverWorksConfig.kt.

ErrorCode.kt는 HAUT에서 축소: STAFF_NOT_FOUND, BUILDING_NOT_FOUND, ROOM_NOT_FOUND, INVALID_CREDENTIALS, TOKEN_EXPIRED, ACCESS_DENIED, INVALID_INPUT, INTERNAL_ERROR, CONCURRENT_MODIFICATION — 9개만 유지.

### Step 3: Docker + Flyway

docker-compose.yml을 프로젝트 루트에 생성. PostgreSQL 16-alpine, port 5434(HAUT의 5433과 충돌 방지).

**V1__init_staff_building_room.sql** — staff, buildings, rooms 3개 테이블 DDL. 프로토타입 데이터 파일(staff.ts, buildings.ts, buildingFloors.ts, roomMasterData.ts)의 모든 필드를 빠짐없이 반영. buildings 테이블에 floors 컬럼은 JSONB 타입. staff 테이블에 roles, assigned_buildings는 TEXT[] 타입.

**V2__seed.sql** — staff 9명(비밀번호 BCrypt 해시), buildings 21개(buildingFloors 데이터 merge), rooms 200개(roomMasterData + buildingFloors 호실 전체). 모든 시드 데이터가 프로토타입과 정확히 일치.

---

## Part 2: 도메인 코드 + 테스트

### 엔티티 (3개)

**Staff.kt** — PostgreSQL TEXT[] ↔ Hibernate 6 `@JdbcTypeCode(SqlTypes.ARRAY)` + `Array<String>` 매핑. roles와 assignedBuildings 두 필드에 적용.

**Building.kt** — JSONB floors ↔ Hibernate 6 `@JdbcTypeCode(SqlTypes.JSON)` + `Map<String, List<String>>?` 매핑. buildings.ts + buildingFloors.ts의 모든 필드 반영: name, roomCount, occupiedCount, buildingType, feeType, fee, fixedFee, special, parkingTotal, ownerName, ownerPhone, ownerFee, ownerAccount, mgmtStart, address, floors.

**Room.kt** — `@ManyToOne(fetch = FetchType.LAZY)` Building 관계. roomMasterData.ts의 모든 필드 반영. waterFee, internetFee는 VARCHAR('포함' 가능).

### 서비스 (3개)

**StaffService.kt** — findAll, findById, create(BCrypt 해시), update(부분 업데이트 `?.let` 패턴).

**BuildingService.kt** — findAll(staffId)에서 staff.assignedBuildings가 비어있으면 전체 반환(총괄), 아니면 해당 건물만 반환. findById, update.

**RoomService.kt** — findByBuildingId, findById, update.

### 컨트롤러 (4개)

**AuthController.kt** — POST /api/auth/login(JWT 발급), POST /api/auth/refresh(토큰 갱신), GET /api/auth/me(현재 사용자).

**StaffController.kt** — GET /api/staff, POST /api/staff, PUT /api/staff/{id}.

**BuildingController.kt** — GET /api/buildings(역할별 필터), GET /api/buildings/{id}, PUT /api/buildings/{id}. SecurityContext에서 staffId 추출하는 헬퍼 함수.

**RoomController.kt** — GET /api/buildings/{buildingId}/rooms, GET /api/rooms/{id}, PUT /api/rooms/{id}.

### 테스트 (14개)

IntegrationTestSupport.kt — @SpringBootTest + @AutoConfigureMockMvc + @ActiveProfiles("test") + @Transactional(테스트 격리). Testcontainers PostgreSQL로 테스트 DB 자동 생성. createToken 헬퍼로 JWT 토큰 생성.

| 테스트 파일 | 테스트 수 | 내용 |
|-----------|---------|------|
| AuthControllerTest.kt | 5 | 로그인 성공, 로그인 실패, 토큰 갱신, /api/auth/me, 인증 없이 401 |
| StaffControllerTest.kt | 3 | 목록 9명, 등록, 수정 |
| BuildingControllerTest.kt | 3 | 목록 21개, 상세(floors 포함), 수정 |
| RoomControllerTest.kt | 3 | 건물별 호실, 상세, 수정 |

---

## 발생 문제 및 해결 (4건)

### 1. JDK 25 자동 선택 → 빌드 실패

시스템에 JDK 17, 21, 25가 설치되어 있고, Gradle이 가장 높은 JDK 25를 자동 선택. Spring Boot 3.4 + Kotlin 2.1은 JDK 17을 요구.

**해결:** gradle.properties에 `org.gradle.java.home` 경로를 JDK 17(temurin-17.0.16)으로 고정.

### 2. Docker 포트 충돌 (5432)

HAUT PostgreSQL 컨테이너가 5432 또는 5433을 점유하고 있어서 Houseman PostgreSQL 컨테이너 시작 실패.

**해결:** docker-compose.yml 포트를 5434:5432로 변경. application.yml의 datasource URL도 5434로 업데이트.

### 3. 인증 없는 요청에 403 반환 (401 기대)

Spring Security 기본 동작이 인증 없는 요청에 403(Forbidden)을 반환. JWT 기반 API에서는 401(Unauthorized)이 올바른 응답.

**해결:** SecurityConfig에 AuthenticationEntryPoint 추가. 401 상태 + JSON 에러 응답 반환.

### 4. 테스트 격리 실패 — 직원 수 불일치

StaffControllerTest의 직원 등록 테스트가 DB에 데이터를 추가한 뒤, 직원 목록 테스트에서 9명이 아닌 10명 반환. 테스트 간 DB 상태가 공유됨.

**해결:** IntegrationTestSupport에 @Transactional 추가. 각 테스트 후 자동 롤백되어 DB 상태 격리.

---

## 최종 검증 결과

| 항목 | 결과 |
|------|------|
| ./gradlew compileKotlin | ✅ BUILD SUCCESSFUL |
| ./gradlew test | ✅ 14개 테스트 통과 |
| ./gradlew bootRun + Flyway | ✅ V1, V2 마이그레이션 성공, 8080 기동 |
| SELECT count(*) FROM staff | ✅ 9 |
| SELECT count(*) FROM buildings | ✅ 21 |
| SELECT count(*) FROM rooms | ✅ 200 |
| Swagger UI | ✅ HTTP 200 |

### curl 검증 결과

| 엔드포인트 | 결과 |
|-----------|------|
| POST /api/auth/login | ✅ 200, accessToken + 박종호 대표 |
| GET /api/buildings | ✅ 21개 건물 |
| GET /api/buildings/1 | ✅ 제이앤제이, floors 포함 |
| GET /api/buildings/2/rooms | ✅ 16개 (스타빌) |
| GET /api/staff | ✅ 9명 |
| GET /api/auth/me | ✅ ID:1, 박종호 대표 |
| GET /api/buildings (토큰 없이) | ✅ 401 |
| POST /api/auth/refresh | ✅ 새 토큰 발급 |

---

## 산출물 요약

### Part 1 — 프로젝트 + 인프라 (20개 파일)

| 카테고리 | 파일 |
|---------|------|
| 프로젝트 | build.gradle.kts, settings.gradle.kts, gradle.properties, gradlew, .gitignore |
| 앱 | HousemanApplication.kt |
| config | SecurityConfig.kt, JacksonConfig.kt, JpaConfig.kt, CorsConfig.kt |
| global | ApiResponse.kt, ErrorCode.kt, BusinessException.kt, GlobalExceptionHandler.kt, RequestLoggingFilter.kt |
| security | JwtProvider.kt, JwtAuthFilter.kt, UserPrincipal.kt |
| domain | BaseEntity.kt |
| resources | application.yml, application-test.yml, logback-spring.xml |
| Flyway | V1__init_staff_building_room.sql, V2__seed.sql |
| Docker | docker-compose.yml |

### Part 2 — 도메인 코드 (17개 파일)

| 카테고리 | 파일 |
|---------|------|
| 엔티티 | Staff.kt, Building.kt, Room.kt |
| DTO | StaffDto.kt, BuildingDto.kt, RoomDto.kt, AuthDto.kt |
| Repository | StaffRepository.kt, BuildingRepository.kt, RoomRepository.kt |
| Service | StaffService.kt, BuildingService.kt, RoomService.kt |
| Controller | AuthController.kt, StaffController.kt, BuildingController.kt, RoomController.kt |
| 테스트 | IntegrationTestSupport.kt, AuthControllerTest.kt, StaffControllerTest.kt, BuildingControllerTest.kt, RoomControllerTest.kt |

### 미수정

- 프론트엔드 코드 전부 미수정 (VITE_USE_API=false 유지)
- 프로토타입 데이터 구조 변경 없음
