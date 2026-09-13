# 🚀 Sprint 0 Development Plan - XIO App Infrastructure

## CONTEXT

**Why this sprint matters:** Sprint 0 is the foundation for all subsequent sprints. Without proper infrastructure, CI/CD, and development tooling in place, the team cannot effectively build features. This sprint establishes the development environment, database layer, API server, and deployment pipeline.

**Target outcome:** By end of Sprint 0, developers can:
- Run `npm run dev` and `./gradlew build` without issues
- Create and push code with automatic CI/CD validation
- Write code against a fully functional local stack (PostgreSQL, Redis, API)
- Deploy to staging environment with one command
- Monitor API health in real-time

**Duration:** 2 weeks | **Story Points:** 67 (30 Backend + 23 Android + 14 DevOps)

---

## PHASE 1: TEAM & DEPENDENCIES

### Team Allocation (Sprint 0)
- **Backend Lead** (1.0 FTE): 0.1, 0.2, 0.6, 0.7
- **Backend Dev** (1.0 FTE): 0.3, 0.4, 0.5, 0.8, 0.9
- **Android Lead** (1.0 FTE): 0.10, 0.11, 0.12
- **Android Dev** (1.0 FTE): 0.13, 0.14, 0.15, 0.16
- **DevOps Engineer** (1.0 FTE): 0.6, 0.7, 0.17, 0.18, 0.19, 0.20

### Critical Prerequisites
- GitHub repositories already created: `xio-backend` and `xio-android`
- Team members have git, Node.js 18+, Java 17, Android Studio installed
- AWS account provisioned (EC2, RDS, S3 access)
- GitHub Actions enabled on both repositories
- Firebase & Stripe accounts created and credentials available

---

## PHASE 2: BACKEND INFRASTRUCTURE (0.1 - 0.9)

### Task 0.1: Setup Node.js/Express Project Structure (3 pts)
**Responsible:** Backend Lead  
**Dependencies:** GitHub repo created

**Acceptance Criteria:**
- ✅ Project structure matches MANUAL-REPO-SETUP.md template
- ✅ `npm run dev` launches server without errors
- ✅ Health check endpoint `/health` responds with 200 OK
- ✅ TypeScript compilation successful (`npm run build`)
- ✅ All 40+ dependencies installed

**Implementation Steps:**
1. Verify starter code in `xio-backend` repository (created by automation script)
2. Review `/src/app.ts` and `/src/server.ts` for proper middleware stack
3. Test locally: `npm install && npm run dev`
4. Verify health endpoint: `curl http://localhost:3000/health`

**Key Files:**
- `src/server.ts` - Server entry point with graceful shutdown
- `src/app.ts` - Express configuration, middleware setup, error handling
- `package.json` - Dependencies (Express, TypeScript, Helmet, CORS, compression)
- `tsconfig.json` - TypeScript strict mode configuration

---

### Task 0.2: Configure PostgreSQL Database & Migrations (5 pts)
**Responsible:** Backend Lead  
**Dependencies:** 0.1

**Acceptance Criteria:**
- ✅ PostgreSQL 16 running in Docker on port 5432
- ✅ All 15 database tables created from schema
- ✅ Database schema includes users, transactions, audits, investments, subscriptions, news, sessions, otp_codes, rate_limits
- ✅ 40+ indexes created for performance
- ✅ Stored procedures for tax calculation functional
- ✅ Migration tool (e.g., TypeORM or node-pg-migrate) set up
- ✅ Database connection pooling configured (pg library)

**Implementation Steps:**
1. Docker-compose includes postgres:16-alpine service
2. Create/run migrations from `XIO-DB-MIGRATIONS.sql`
3. Verify all 15 tables exist: `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
4. Test connection pooling configuration in `src/config/database.ts`
5. Verify indexes created: `SELECT * FROM pg_indexes WHERE tablename LIKE 'xio_%'`

**Key Files:**
- `docker-compose.yml` - PostgreSQL service (16-alpine, volume for persistence)
- `migrations/` - SQL migration files (or TypeORM migration classes)
- `src/config/database.ts` - Connection pool, retry logic, error handling
- `XIO-DB-MIGRATIONS.sql` - Complete schema from documentation

---

### Task 0.3: Setup Redis Cache Layer (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** 0.1

**Acceptance Criteria:**
- ✅ Redis 7 running in Docker on port 6379
- ✅ Redis client library configured (redis v4.6.12)
- ✅ Connection pooling & retry logic implemented
- ✅ Cache service utility created (`src/service/cache.service.ts`)
- ✅ TTL policies defined (auth tokens: 30min, data: 1hour, dashboards: 5min)

**Implementation Steps:**
1. Add redis:7-alpine to docker-compose.yml
2. Create `src/config/redis.ts` with connection pool
3. Implement `src/service/cache.service.ts` with:
   - `get(key)` / `set(key, value, ttl)` / `del(key)` / `flush()`
   - Key naming convention: `xio:{entity}:{id}`
4. Test: `docker-compose up -d redis && npm run dev` then verify cache hits

**Key Files:**
- `docker-compose.yml` - Redis service
- `src/config/redis.ts` - Connection & pooling
- `src/service/cache.service.ts` - Cache wrapper with TTL

---

### Task 0.4: Configure Firebase Admin SDK (2 pts)
**Responsible:** Backend Dev  
**Dependencies:** 0.1

**Acceptance Criteria:**
- ✅ Firebase service account JSON configured in `.env`
- ✅ Firebase Admin SDK initialized (`src/config/firebase.ts`)
- ✅ User creation & verification endpoints ready for Sprint 1
- ✅ Token verification middleware configured

**Implementation Steps:**
1. Add Firebase credentials to `.env.example` and `.env`
2. Create `src/config/firebase.ts` with admin initialization
3. Create `src/middleware/firebaseVerify.ts` for token verification
4. Test Firebase connectivity in app startup

**Key Files:**
- `src/config/firebase.ts` - Admin SDK initialization
- `.env.example` - FIREBASE_* variables template

---

### Task 0.5: Setup Logging (Winston + ELK stack) (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** 0.1

**Acceptance Criteria:**
- ✅ Winston logger configured (`src/config/logger.ts`)
- ✅ Logs written to files (rotated daily)
- ✅ Console logs in development with colors
- ✅ Structured logging (JSON format) for ELK stack
- ✅ Request logging middleware (`src/middleware/requestLogger.ts`)
- ✅ Log levels: DEBUG, INFO, WARN, ERROR

**Implementation Steps:**
1. Install winston v3.11.0
2. Create `src/config/logger.ts` with file & console transports
3. Configure log rotation (daily, max 14 days)
4. Create `src/middleware/requestLogger.ts` for HTTP request logging
5. Test logging: `npm run dev` and check logs/ directory

**Key Files:**
- `src/config/logger.ts` - Winston configuration
- `src/middleware/requestLogger.ts` - Express middleware for logs

---

### Task 0.6: Configure Docker & docker-compose (4 pts)
**Responsible:** Backend Lead / DevOps  
**Dependencies:** 0.2, 0.3

**Acceptance Criteria:**
- ✅ `docker-compose up -d` starts all services (postgres, redis, backend optional)
- ✅ Health check endpoints built into compose file
- ✅ Services have volume persistence (postgres data)
- ✅ Network isolation between services
- ✅ .dockerignore excludes node_modules, build artifacts
- ✅ `docker-compose down` cleans up all containers

**Implementation Steps:**
1. Create Dockerfile in xio-backend root with multi-stage build
2. Update docker-compose.yml:
   - postgres:16-alpine service with volumes
   - redis:7-alpine service
   - Optional backend service for testing
3. Create .dockerignore file
4. Test: `docker-compose up -d && npm run dev && curl http://localhost:3000/health`

**Key Files:**
- `docker-compose.yml` - postgres, redis, volumes, networks
- `Dockerfile` - Multi-stage build (base → build → runtime)
- `.dockerignore` - node_modules, .git, .env

---

### Task 0.7: Setup GitHub Actions CI/CD Pipeline (5 pts)
**Responsible:** Backend Lead / DevOps  
**Dependencies:** 0.1, 0.2

**Acceptance Criteria:**
- ✅ CI workflow triggers on push to main/develop branches
- ✅ Pipeline runs: npm ci → lint → build → test
- ✅ Build artifacts generated (dist/ folder)
- ✅ Test coverage reports generated
- ✅ Notifications on build failure (Slack/email)
- ✅ Docker image built and pushed to registry on success (optional for Sprint 0)

**Implementation Steps:**
1. Create `.github/workflows/ci.yml` with:
   - Checkout code
   - Setup Node.js 18
   - Run `npm ci` (clean install)
   - Run `npm run lint` (if linter configured)
   - Run `npm run build`
   - Run `npm test` (when tests added in future sprints)
2. Add build status badge to README.md
3. Test by pushing code to repository

**Key Files:**
- `.github/workflows/ci.yml` - CI/CD workflow definition
- `.github/workflows/deploy.yml` - Optional: deployment to staging (for 0.18)

---

### Task 0.8: Configure Error Handling Middleware (2 pts)
**Responsible:** Backend Dev  
**Dependencies:** 0.1

**Acceptance Criteria:**
- ✅ Global error handler middleware catches all errors (`src/middleware/errorHandler.ts`)
- ✅ Error responses follow standard format: `{ success: false, error: { code, message } }`
- ✅ Stack traces hidden in production, visible in development
- ✅ HTTP status codes correctly mapped (400, 401, 403, 404, 429, 500)
- ✅ Validation errors include field names and reasons

**Implementation Steps:**
1. Create `src/middleware/errorHandler.ts` that:
   - Catches synchronous & async errors
   - Maps error types to HTTP codes
   - Logs errors via Winston
   - Returns consistent error response format
2. Register in `src/app.ts` as final middleware
3. Create custom error classes in `src/utils/errors.ts`:
   - ValidationError, AuthenticationError, AuthorizationError, NotFoundError

**Key Files:**
- `src/middleware/errorHandler.ts` - Global error handler
- `src/utils/errors.ts` - Custom error classes

---

### Task 0.9: Setup API Documentation (Swagger) (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** 0.1

**Acceptance Criteria:**
- ✅ Swagger/OpenAPI UI accessible at `/api/docs`
- ✅ All endpoints documented (or template created for future)
- ✅ Request/response schemas defined
- ✅ Authentication schemes documented (JWT Bearer)
- ✅ Error responses documented (40x, 50x)

**Implementation Steps:**
1. Install `swagger-ui-express` and `swagger-jsdoc`
2. Create `src/config/swagger.ts` with OpenAPI 3.0 spec
3. Reference existing `XIO-APP-OPENAPI.yaml` from documentation
4. Register Swagger UI at `/api/docs`
5. Test: `npm run dev` then visit `http://localhost:3000/api/docs`

**Key Files:**
- `src/config/swagger.ts` - Swagger configuration
- `XIO-APP-OPENAPI.yaml` - Full API specification (reference)

---

## PHASE 3: ANDROID INFRASTRUCTURE (0.10 - 0.16)

### Task 0.10: Setup Android Studio Project (Kotlin + Compose) (3 pts)
**Responsible:** Android Lead  
**Dependencies:** GitHub repo created

**Acceptance Criteria:**
- ✅ Project structure matches starter template
- ✅ `./gradlew build` succeeds without errors
- ✅ Kotlin version 1.9.22, Compose 1.6.2
- ✅ API 26-34 (minSdk 26, targetSdk 34)
- ✅ MainActivity renders splash screen with app name

**Implementation Steps:**
1. Verify starter code from `xio-android` repository
2. Review `build.gradle.kts` (project and app level)
3. Review `settings.gradle.kts` for module configuration
4. Test: `./gradlew clean build` locally
5. Create emulator (API 31 minimum) and run `./gradlew installDebug`

**Key Files:**
- `build.gradle.kts` (root) - Plugins, versions, repositories
- `app/build.gradle.kts` - App dependencies, SDK versions, Compose config
- `settings.gradle.kts` - Module configuration
- `app/src/main/java/ec/xio/app/MainActivity.kt`
- `app/src/main/AndroidManifest.xml`

---

### Task 0.11: Configure Gradle, Dependencies & Build Variants (4 pts)
**Responsible:** Android Lead  
**Dependencies:** 0.10

**Acceptance Criteria:**
- ✅ All 40+ dependencies installed and resolved
- ✅ Build variants configured: debug, release
- ✅ Build types: debug (debuggable), release (minified)
- ✅ ProGuard/R8 rules configured for release
- ✅ Signing configuration ready for production
- ✅ Dependencies lock file (Gradle dependency lock) enabled

**Implementation Steps:**
1. Review `app/build.gradle.kts` dependencies:
   - Core: androidx.core, appcompat
   - Compose: ui, material3, activity-compose
   - Network: retrofit2, okhttp, gson
   - Storage: room, datastore
   - DI: hilt
   - Testing: junit, mockk
2. Configure build variants with product flavors (optional)
3. Configure ProGuard rules in `app/proguard-rules.pro`
4. Test: `./gradlew assembleDebug && ./gradlew assembleRelease`

**Key Files:**
- `app/build.gradle.kts` - Full configuration
- `app/proguard-rules.pro` - Minification rules
- `gradle.properties` - Global Gradle settings

---

### Task 0.12: Setup Jetpack Compose Theme & Design System (5 pts)
**Responsible:** Android Lead  
**Dependencies:** 0.10

**Acceptance Criteria:**
- ✅ Theme colors defined: orange/teal primary, white background
- ✅ Typography configured (Roboto font)
- ✅ Shape system defined (rounded corners)
- ✅ Custom Composables created for common UI elements:
   - XioButton, XioTextField, XioCard, etc.
- ✅ Light/dark mode support
- ✅ Theme accessible throughout app via `XioTheme {}`

**Implementation Steps:**
1. Create `ui/theme/` directory structure:
   - `Color.kt` - XioOrange, XioTeal, XioWhite, etc.
   - `Typography.kt` - Text styles (HeadingLarge, BodyMedium, etc.)
   - `Shape.kt` - Rounded corner definitions
   - `Theme.kt` - CompositionLocal setup
2. Create reusable Composables in `ui/components/`:
   - `XioButton.kt`, `XioTextField.kt`, `XioCard.kt`
3. Test theme: Create preview Composable and view in preview pane

**Key Files:**
- `app/src/main/java/ec/xio/app/ui/theme/Color.kt`
- `app/src/main/java/ec/xio/app/ui/theme/Typography.kt`
- `app/src/main/java/ec/xio/app/ui/theme/Shape.kt`
- `app/src/main/java/ec/xio/app/ui/theme/Theme.kt`
- `app/src/main/java/ec/xio/app/ui/components/` - Reusable components

---

### Task 0.13: Configure Room Database (Local Storage) (3 pts)
**Responsible:** Android Dev  
**Dependencies:** 0.10

**Acceptance Criteria:**
- ✅ Room database initialized with SQLite
- ✅ All data entities defined (User, Transaction, Audit, Investment, News)
- ✅ DAOs created for CRUD operations
- ✅ Database migrations planned (versioning)
- ✅ Type converters for complex types (Date, Enum, etc.)

**Implementation Steps:**
1. Create entity classes in `data/local/entity/`:
   - `UserEntity.kt`, `TransactionEntity.kt`, `AuditEntity.kt`, etc.
2. Create DAOs in `data/local/dao/`:
   - UserDao, TransactionDao, AuditDao, etc.
3. Create `XioDatabase.kt` (Room.databaseBuilder)
4. Create `TypeConverters.kt` for Date/Enum serialization
5. Test: Verify database file created at app startup

**Key Files:**
- `data/local/entity/` - Entity definitions
- `data/local/dao/` - Data access objects
- `data/local/database/XioDatabase.kt` - Database builder
- `data/local/database/TypeConverters.kt` - Type converters

---

### Task 0.14: Setup Retrofit HTTP Client & Interceptors (3 pts)
**Responsible:** Android Dev  
**Dependencies:** 0.10

**Acceptance Criteria:**
- ✅ Retrofit client configured with base URL (https://api.xio.ec/v1)
- ✅ OkHttp interceptors for:
   - Authorization header injection (Bearer token)
   - Request/response logging
   - Error handling & retry logic
   - Rate limit handling (429 responses)
- ✅ JSON serialization (Gson converter)
- ✅ Connection timeout: 30s, read timeout: 30s

**Implementation Steps:**
1. Create `data/remote/api/XioApiService.kt` with Retrofit interface
2. Create interceptors in `data/remote/interceptor/`:
   - `AuthInterceptor.kt` - Adds Authorization header
   - `LoggingInterceptor.kt` - Logs requests/responses
   - `ErrorInterceptor.kt` - Handles error responses
3. Configure Retrofit client in `data/remote/RetrofitClient.kt`
4. Test: Create simple API call and verify in Logcat

**Key Files:**
- `data/remote/api/XioApiService.kt` - API endpoints (initial)
- `data/remote/interceptor/` - Interceptors
- `data/remote/RetrofitClient.kt` - Retrofit configuration
- `data/remote/model/request/` - Request DTOs
- `data/remote/model/response/` - Response DTOs

---

### Task 0.15: Configure Hilt Dependency Injection (3 pts)
**Responsible:** Android Dev  
**Dependencies:** 0.10

**Acceptance Criteria:**
- ✅ Hilt configured in `app/build.gradle.kts`
- ✅ @HiltAndroidApp applied to Application class
- ✅ AppModule created with common dependencies:
   - Retrofit client, Room database, SharedPreferences
- ✅ ViewModels use @HiltViewModel
- ✅ Scopes defined: @Singleton, @ActivityScoped, @ViewModelScoped

**Implementation Steps:**
1. Add Hilt plugin to `app/build.gradle.kts`
2. Create `XioApplication` class annotated with @HiltAndroidApp
3. Create `di/AppModule.kt` with @Provides/@Binds methods:
   - `provideRetrofitClient()`
   - `provideOkHttpClient()`
   - `provideDatabase()`
   - `provideUserPreferences()`
4. Test: Run app and verify no Hilt compilation errors

**Key Files:**
- `di/AppModule.kt` - Hilt module with common bindings
- `XioApplication.kt` - Application class with @HiltAndroidApp
- `ui/viewmodel/` - ViewModels using @HiltViewModel

---

### Task 0.16: Setup Testing Framework (Jest + Mockk) (2 pts)
**Responsible:** QA Engineer  
**Dependencies:** 0.10

**Acceptance Criteria:**
- ✅ JUnit 4 configured for unit tests
- ✅ Mockk configured for mocking Android components
- ✅ Test directory structure: `app/src/test/` and `app/src/androidTest/`
- ✅ Test runner configured in Gradle
- ✅ Sample test created and passing

**Implementation Steps:**
1. Add test dependencies to `app/build.gradle.kts`:
   - junit v4.13.2
   - mockk v1.13.7
   - androidx.test v1.5
2. Create sample unit test in `app/src/test/java/ec/xio/app/`
3. Create sample instrumentation test in `app/src/androidTest/java/ec/xio/app/`
4. Test: `./gradlew test` and `./gradlew connectedAndroidTest`

**Key Files:**
- `app/src/test/` - Unit tests (local JVM)
- `app/src/androidTest/` - Instrumentation tests (device/emulator)

---

## PHASE 4: DEVOPS INFRASTRUCTURE (0.17 - 0.20)

### Task 0.17: Setup AWS Infrastructure (EC2, RDS, S3) (5 pts)
**Responsible:** DevOps Engineer  
**Dependencies:** GitHub repos created

**Acceptance Criteria:**
- ✅ AWS account with IAM roles configured
- ✅ EC2 instance for backend (t3.small, Ubuntu 22.04)
- ✅ RDS PostgreSQL 16 instance (db.t3.micro, encrypted, automated backups)
- ✅ S3 bucket for receipt uploads (versioning enabled, lifecycle rules)
- ✅ Security groups configured (restrict access)
- ✅ Terraform/CloudFormation (IaC) for infrastructure

**Implementation Steps:**
1. Create AWS resources (manual or IaC):
   - EC2: t3.small, Ubuntu 22.04 AMI, public IP, SSH key pair
   - RDS: PostgreSQL 16, db.t3.micro, multi-AZ backup enabled
   - S3: xio-receipts-{env} bucket with versioning
2. Configure security groups:
   - EC2: inbound port 22 (SSH), 3000 (API), 443 (HTTPS)
   - RDS: inbound port 5432 from EC2 security group only
3. Create IAM user for CI/CD with least-privilege permissions
4. Document AWS resource IDs in `.env.example`

**Key Files:**
- `terraform/` (optional) - IaC for AWS resources
- `.env.example` - AWS credentials template
- AWS configuration in deployment scripts

---

### Task 0.18: Configure Staging Environment (3 pts)
**Responsible:** DevOps Engineer  
**Dependencies:** 0.17

**Acceptance Criteria:**
- ✅ Staging environment mirrors production
- ✅ GitHub Actions workflow deploys to staging on every push to `develop`
- ✅ Staging API accessible at https://staging-api.xio.ec/
- ✅ Staging database separate from production
- ✅ Environment variables managed securely (.env for staging)
- ✅ Monitoring/alerts configured for staging

**Implementation Steps:**
1. Create staging RDS instance (separate from production)
2. Create staging EC2 instance or reuse with environment variable switching
3. Create `.github/workflows/deploy-staging.yml`:
   - Trigger: push to develop branch
   - Build Docker image
   - Push to ECR (if using Docker registry)
   - Deploy to staging EC2
4. Configure DNS subdomain: staging-api.xio.ec
5. Test: Push to develop and verify deployment

**Key Files:**
- `.github/workflows/deploy-staging.yml` - Staging deployment
- `scripts/deploy.sh` - Deployment script (called by workflow)
- `config/staging.env` - Staging-specific configuration

---

### Task 0.19: Setup Monitoring (Prometheus + Grafana) (4 pts)
**Responsible:** DevOps Engineer  
**Dependencies:** 0.17

**Acceptance Criteria:**
- ✅ Prometheus scrapes metrics from backend (port 9090)
- ✅ Grafana dashboards created (port 3000 dev, custom port prod):
   - Request latency, throughput, error rates
   - Database query performance
   - Redis cache hit rates
   - System CPU/memory usage
- ✅ Alerts configured for critical metrics (95th latency, error rate >1%)
- ✅ Logs aggregated (ELK stack optional for Sprint 0)

**Implementation Steps:**
1. Add Prometheus client library to backend (`prom-client` npm package)
2. Create `/metrics` endpoint that exports Prometheus metrics
3. Create docker-compose service for Prometheus + Grafana (dev):
   - Prometheus scrapes http://backend:3000/metrics
   - Grafana queries Prometheus datasource
4. Create Grafana dashboards (JSON export)
5. Configure alerts in Prometheus alertmanager
6. Test: `npm run dev` and verify http://localhost:3000/metrics responds

**Key Files:**
- `docker-compose.yml` - Prometheus + Grafana services
- `prometheus.yml` - Prometheus configuration
- `src/config/metrics.ts` - Prometheus client initialization
- `src/middleware/metricsCollector.ts` - Middleware to collect metrics
- `grafana/dashboards/` - Dashboard definitions (JSON)

---

### Task 0.20: Configure SSL/TLS Certificates (2 pts)
**Responsible:** DevOps Engineer  
**Dependencies:** 0.17

**Acceptance Criteria:**
- ✅ SSL certificate obtained (Let's Encrypt or AWS ACM)
- ✅ HTTPS enabled on staging and production endpoints
- ✅ Certificate auto-renewal configured (Let's Encrypt)
- ✅ HSTS headers enabled (force HTTPS)
- ✅ TLS 1.2+ only (no SSL 3.0, TLS 1.0, 1.1)

**Implementation Steps:**
1. For AWS ACM: Request certificate for *.xio.ec
2. For Let's Encrypt: Configure Certbot on EC2
3. Update backend to use HTTPS:
   - Load certificate in Node.js (or reverse proxy with Nginx)
   - Add Helmet for security headers (HSTS)
4. Configure DNS records to point to HTTPS endpoint
5. Test: `curl https://api.xio.ec/health` returns 200

**Key Files:**
- `src/app.ts` - Helmet configuration for HSTS headers
- Nginx/reverse proxy config (if using)
- `.github/workflows/` - SSL cert renewal automation

---

## IMPLEMENTATION TIMELINE

**Week 1:**
- Day 1-2: Tasks 0.1, 0.2, 0.3 (backend foundation)
- Day 2-3: Tasks 0.10, 0.11, 0.12 (Android foundation)
- Day 3-4: Tasks 0.4, 0.5, 0.6 (backend config)
- Day 4-5: Tasks 0.13, 0.14, 0.15 (Android config)

**Week 2:**
- Day 1-2: Tasks 0.7, 0.8, 0.9 (backend CI/CD & docs)
- Day 2-3: Tasks 0.16 (Android testing)
- Day 3-5: Tasks 0.17, 0.18, 0.19, 0.20 (DevOps infrastructure)

**Daily Standup:** 10:00 AM - blockers and progress

---

## VERIFICATION CHECKLIST

### Backend Ready
- [ ] `npm run dev` starts server on http://localhost:3000
- [ ] `curl http://localhost:3000/health` returns `{"status":"ok"}`
- [ ] PostgreSQL running with all 15 tables created
- [ ] Redis running and caching works
- [ ] `npm run build` produces `/dist` folder
- [ ] GitHub Actions CI passes on push
- [ ] Swagger UI accessible at `/api/docs`
- [ ] Logs written to `logs/` directory

### Android Ready
- [ ] `./gradlew clean build` succeeds
- [ ] Emulator starts and app loads with splash screen
- [ ] Room database file created in app storage
- [ ] Retrofit client can make HTTP requests (mock for now)
- [ ] Hilt DI initializes without errors
- [ ] Unit tests run: `./gradlew test`
- [ ] GitHub Actions CI passes on push

### DevOps Ready
- [ ] AWS EC2 instance running and accessible via SSH
- [ ] RDS PostgreSQL accessible from EC2
- [ ] S3 bucket created with correct policies
- [ ] Staging environment deploys on `develop` push
- [ ] Prometheus metrics endpoint responding
- [ ] Grafana dashboards showing data
- [ ] SSL certificate installed and HTTPS working

---

## SUCCESS CRITERIA (End of Sprint 0)

✅ **Developers can code immediately** without environment setup friction  
✅ **CI/CD pipeline works** - every push triggers tests and builds  
✅ **Infrastructure is production-ready** - monitoring, logging, backups all configured  
✅ **Team can deploy** - one command deploys to staging or production  
✅ **Database & caching working** - performance optimizations ready for data layers  
✅ **67 story points completed** - no technical debt carried to Sprint 1

---

## SPRINT 0 → SPRINT 1 DEPENDENCIES

Sprint 1 (Authentication) depends on Sprint 0 completing:
- Database schema (users, sessions, otp_codes tables) ← Task 0.2
- Cache layer for token storage ← Task 0.3
- API documentation template ← Task 0.9
- Android navigation framework (Jetpack Compose) ← Tasks 0.10-0.12
- Retrofit HTTP client for API calls ← Task 0.14
- Hilt DI for ViewModels ← Task 0.15

**No Sprint 1 work starts until all Sprint 0 tasks pass acceptance criteria.**

---

**Plan Created:** 2026-09-12  
**Lead Architect:** Claude Haiku 4.5  
**Status:** Ready for team review & approval

---

# 💰 Sprint 2 Development Plan - Transactions & Real-Time Tax Calculation

## CONTEXT

**Why this sprint matters:** Sprint 2 implements the core financial tracking feature - allowing users to record income/expense transactions with **automatic real-time tax calculation**. This is the heart of the XIO value proposition:
- Users see instant tax implications (17% IVA + 2-5% retentions)
- Transactions categorized (SERVICIOS, BIENES, OTRO) for different tax rates
- Receipt upload enables audit trails
- Caching optimizes performance for large transaction histories

**Target outcome:** By end of Sprint 2:
- Users can create income/expense transactions (mobile & API)
- Taxes auto-calculated in real-time (17% IVA + retention by category)
- Users see transaction history with filtering/sorting
- Receipt images stored in S3 with transaction
- Transactions stored in PostgreSQL with full indexing
- Transaction data cached in Redis for performance
- Full transaction CRUD API endpoints
- All transaction flows end-to-end tested

**Duration:** 2 weeks | **Story Points:** 67 (36 Backend + 31 Android)

**Dependencies:** Sprint 0 (infrastructure) + Sprint 1 (authentication) must be complete

---

## PHASE 1: TEAM & DEPENDENCIES

### Team Allocation (Sprint 2)
- **Backend Lead** (1.0 FTE): 2.1, 2.2, 2.7, 2.9
- **Backend Dev** (1.0 FTE): 2.3, 2.4, 2.5, 2.6, 2.8
- **Android Lead** (1.0 FTE): 2.10, 2.11, 2.12, 2.16
- **Android Dev** (1.0 FTE): 2.13, 2.14, 2.15, 2.17, 2.18
- **QA/Testing** (0.5 FTE): Tax calculation edge cases, filtering tests

### Critical Prerequisites (from Sprint 0 & 1)
- ✅ PostgreSQL running with indexed tables
- ✅ Redis running for caching
- ✅ S3 bucket configured for receipt uploads
- ✅ Authenticated API endpoints working
- ✅ JWT tokens being sent in requests
- ✅ Jetpack Compose with theme system ready
- ✅ CurrencyInputField, DatePickerField components available
- ✅ Retrofit HTTP client with token injection

### Key Architectural Decisions
- **Tax Calculation:** Real-time, calculated on client AND server (trust but verify)
- **Categories:** 3 types (SERVICIOS, BIENES, OTRO) with different retention rates
- **Caching:** Transaction list in Redis (5-min TTL), user totals (hourly)
- **Receipts:** Stored in S3 with presigned URLs, referenced in transaction
- **Filters:** Date range, category, type (income/expense), status
- **Offline:** Transactions queued locally, synced when online

---

## PHASE 2: BACKEND TRANSACTIONS (2.1 - 2.9)

### Task 2.1: Create Transaction Entity & Repository (4 pts)
**Responsible:** Backend Lead  
**Dependencies:** Sprint 0 complete (0.2)

**Acceptance Criteria:**
- ✅ Transaction entity with all required fields
- ✅ Repository with CRUD operations
- ✅ Database indexes on userId, date, category, status
- ✅ Soft delete support (deletedAt)
- ✅ Timestamps and full audit trail
- ✅ Type-safe TypeScript interfaces

**Implementation Steps:**
1. Create `src/model/transaction.model.ts` with interface:
   - id (UUID), userId, type (INCOME/EXPENSE), amount, category (SERVICIOS/BIENES/OTRO)
   - description, date, client, receiptUrl, status (PENDING/VERIFIED/REJECTED)
   - taxes (nested: iva, ivaRate, retention, retentionRate, total, net)
   - createdAt, updatedAt, deletedAt

2. Create `src/repository/transaction.repository.ts` with:
   - `create(transaction)`, `findById(id)`, `findByUserId(userId, pagination)`
   - `update(id, updates)`, `delete(id)` (soft delete)
   - `listByDateRange(userId, startDate, endDate)`
   - `listByCategory(userId, category)`
   - `getByStatus(userId, status)` (for filtering)

3. Create database indexes:
   - CREATE INDEX ON transactions(userId, createdAt DESC)
   - CREATE INDEX ON transactions(category, date)
   - CREATE INDEX ON transactions(status)

**Key Files:**
- `src/model/transaction.model.ts`
- `src/repository/transaction.repository.ts`

**Testing:**
- CRUD operations work
- Indexes improve query performance

---

### Task 2.2: Implement Transaction Creation API (5 pts)
**Responsible:** Backend Lead  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ POST `/transactions` accepts type, amount, category, description, date, client, receiptUrl
- ✅ Amount validation: 0.01 to 999,999.99 USD
- ✅ Category validation: SERVICIOS, BIENES, or OTRO
- ✅ Date validation: not in future, within last 2 years
- ✅ Creates transaction record in database
- ✅ Returns 201 Created with full transaction object (including calculated taxes)
- ✅ Validation errors return 400 with field-level messages

**Implementation Steps:**
1. Create `src/controller/transaction.controller.ts` with POST route
2. Add input validation:
   - Amount between 0.01 and 999,999.99
   - Category in enum (SERVICIOS, BIENES, OTRO)
   - Date not future, within 2 years
   - Description max 500 chars
3. Call transaction service to create + calculate taxes
4. Save to database
5. Return transaction with calculated taxes

**Key Files:**
- `src/controller/transaction.controller.ts`
- `src/service/transaction.service.ts` (create method)

**Testing:**
- Valid transaction created
- Invalid amounts rejected
- Invalid categories rejected
- Validation errors clear

---

### Task 2.3: Implement Real-Time Tax Calculation (IVA + Retention) (8 pts)
**Responsible:** Backend Dev  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ IVA calculation: 17% on all transactions (fixed)
- ✅ Retention calculation by category:
   - SERVICIOS: 3% retention
   - BIENES: 2% retention
   - OTRO: 2% retention (or configurable)
- ✅ Formulas implemented correctly:
   - Gross amount = amount
   - IVA = amount * 0.17
   - Retention = amount * retentionRate
   - Net = amount - IVA - Retention (or Net = amount + IVA - Retention for income?)
- ✅ Results include: iva, ivaRate, retention, retentionRate, total, net
- ✅ Calculated on transaction creation
- ✅ Results cached (Redis)

**Implementation Steps:**
1. Create `src/utils/taxCalculator.ts` with tax logic:
   ```typescript
   interface TaxCalculation {
     iva: number;
     ivaRate: number; // 0.17
     retention: number;
     retentionRate: number;
     total: number; // iva + retention
     net: number; // amount - taxes
   }
   
   function calculateTaxes(amount: number, category: string): TaxCalculation {
     const ivaRate = 0.17;
     const retentionRate = getRetentionRate(category);
     const iva = amount * ivaRate;
     const retention = amount * retentionRate;
     return {
       iva,
       ivaRate,
       retention,
       retentionRate,
       total: iva + retention,
       net: amount - iva - retention
     };
   }
   
   function getRetentionRate(category: string): number {
     switch(category) {
       case 'SERVICIOS': return 0.03;
       case 'BIENES': return 0.02;
       case 'OTRO': return 0.02;
       default: return 0;
     }
   }
   ```

2. Call this function when creating transaction
3. Store taxes in database with transaction
4. Cache results: `tax_calculation:{userId}:{transactionId}` (Redis, 1-day TTL)
5. Return taxes in transaction response

**Key Files:**
- `src/utils/taxCalculator.ts` - Tax logic
- `src/service/transaction.service.ts` - Integration

**Testing:**
- IVA correctly 17%
- Retentions correct by category
- Total = IVA + retention
- Net = amount - total
- Edge cases: $0.01, $999,999.99

---

### Task 2.4: Implement Transaction Listing API with Filters (4 pts)
**Responsible:** Backend Dev  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ GET `/transactions` lists user's transactions
- ✅ Pagination: limit (default 20), offset/cursor
- ✅ Filter by date range: startDate, endDate
- ✅ Filter by category: SERVICIOS, BIENES, OTRO
- ✅ Filter by type: INCOME, EXPENSE
- ✅ Sort by: date (default DESC), amount, category
- ✅ Returns transaction list with taxes
- ✅ Response includes total count, hasMore flag
- ✅ Performance: < 200ms p95 latency

**Implementation Steps:**
1. Create `src/controller/transaction.controller.ts` GET route with query params:
   - limit, offset
   - startDate, endDate (filters)
   - category, type (filters)
   - sortBy, sortOrder
2. Validate params
3. Query database with filters + pagination
4. Use indexes for performance
5. Optional: cache paginated results (Redis)
6. Return paginated list

**Key Files:**
- `src/controller/transaction.controller.ts`
- `src/repository/transaction.repository.ts` - listWithFilters method

**Testing:**
- All filters work independently + combined
- Pagination works correctly
- Performance target < 200ms

---

### Task 2.5: Implement Transaction Update/Delete API (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ PUT `/transactions/{id}` updates transaction
- ✅ Updatable fields: description, receiptUrl, status (PENDING/VERIFIED/REJECTED)
- ✅ Immutable fields: amount, category, date, type (no changes)
- ✅ DELETE `/transactions/{id}` soft-deletes transaction
- ✅ Returns 200 OK with updated transaction
- ✅ Returns 404 if transaction not found
- ✅ User can only modify their own transactions

**Implementation Steps:**
1. Create PUT `/transactions/{id}` endpoint
2. Validate user ownership (userId matches JWT)
3. Allow updates to: description, receiptUrl, status
4. Prevent updates to: amount, category, date, type, taxes
5. Create DELETE `/transactions/{id}` endpoint
6. Soft delete (set deletedAt)
7. Return updated transaction or success response

**Key Files:**
- `src/controller/transaction.controller.ts`
- `src/repository/transaction.repository.ts`

**Testing:**
- Update allowed fields
- Update immutable fields rejected
- Delete soft-deletes
- User ownership enforced

---

### Task 2.6: Implement Receipt Upload to S3 (4 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (0.17 - AWS setup)

**Acceptance Criteria:**
- ✅ POST `/transactions/{id}/receipt` uploads receipt image
- ✅ Accepts image files (JPG, PNG, WebP, max 5MB)
- ✅ Uploads to S3 bucket: `xio-receipts-{env}`
- ✅ Stores presigned URL in transaction.receiptUrl
- ✅ URL valid for 7 days (presigned)
- ✅ Returns presigned URL and transaction
- ✅ File named: `{userId}/{transactionId}/{timestamp}.{ext}`

**Implementation Steps:**
1. Create AWS S3 client in `src/config/aws.ts` (if not done)
2. Create `src/service/receipt.service.ts`:
   - `uploadReceipt(userId, transactionId, file)` - uploads to S3
   - Returns presigned URL
3. Create POST `/transactions/{id}/receipt` endpoint:
   - Validate file type (image only)
   - Validate file size (max 5MB)
   - Call receipt service
   - Update transaction receiptUrl
   - Return transaction
4. Error handling: invalid file, upload failure, S3 error

**Key Files:**
- `src/config/aws.ts` - S3 client
- `src/service/receipt.service.ts` - Upload logic
- `src/controller/transaction.controller.ts` - Receipt endpoint

**Testing:**
- Valid image uploaded
- Presigned URL returned
- URL valid for 7 days
- Invalid file types rejected
- Oversized files rejected

---

### Task 2.7: Implement Category Validation (2 pts)
**Responsible:** Backend Lead  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ Validates category is one of: SERVICIOS, BIENES, OTRO
- ✅ Returns 400 Bad Request for invalid category
- ✅ Used in transaction creation + update
- ✅ Error message: "Invalid category. Must be SERVICIOS, BIENES, or OTRO"

**Implementation Steps:**
1. Create enum or constant in `src/utils/constants.ts`:
   ```typescript
   const TRANSACTION_CATEGORIES = {
     SERVICIOS: { name: 'Services', retentionRate: 0.03 },
     BIENES: { name: 'Goods', retentionRate: 0.02 },
     OTRO: { name: 'Other', retentionRate: 0.02 }
   };
   ```
2. Add validation middleware/util:
   ```typescript
   function validateCategory(category: string): boolean {
     return Object.keys(TRANSACTION_CATEGORIES).includes(category);
   }
   ```
3. Use in transaction creation validator
4. Consistent error message

**Key Files:**
- `src/utils/constants.ts`
- `src/utils/validators.ts`

**Testing:**
- Valid categories accepted
- Invalid categories rejected
- Error message clear

---

### Task 2.8: Cache Frequently Used Data (Redis) (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (0.3)

**Acceptance Criteria:**
- ✅ User's transaction list cached (5-min TTL)
- ✅ User's monthly totals cached (1-hour TTL)
- ✅ Tax calculation results cached (1-day TTL)
- ✅ Cache key pattern: `transactions:{userId}:*`
- ✅ Cache invalidated on transaction create/update/delete
- ✅ Monitor cache hit rate (target > 70%)

**Implementation Steps:**
1. Update `src/service/transaction.service.ts`:
   - On `listTransactions()`: check Redis first `transactions:{userId}:{hash(filters)}`
   - On `getTotals()`: check Redis `totals:{userId}:{month}`
   - On `calculateTaxes()`: check Redis `taxes:{userId}:{transactionId}`
2. On create/update/delete: invalidate related cache keys
3. Use cache service `get()`, `set(key, value, ttl)`, `delete(key)`
4. Monitor cache hit rate

**Key Files:**
- `src/service/transaction.service.ts`
- `src/service/cache.service.ts` (from Sprint 0)

**Testing:**
- Cache hit on repeated queries
- Cache invalidated on create/update
- TTLs respected

---

### Task 2.9: Integration Tests for Transaction Endpoints (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (0.9)

**Acceptance Criteria:**
- ✅ End-to-end tests for all transaction endpoints
- ✅ Create transaction → verify taxes calculated
- ✅ List with filters → verify correct results
- ✅ Update transaction → verify immutable fields protected
- ✅ Delete transaction → verify soft delete
- ✅ Receipt upload → verify S3 storage
- ✅ All tests pass in CI/CD
- ✅ Coverage > 80%

**Implementation Steps:**
1. Create `src/__tests__/transaction.integration.test.ts`
2. Setup: Create test user, authenticate
3. Test create transaction:
   - Valid transaction created
   - Taxes calculated correctly
   - Response includes all fields
4. Test list with filters:
   - All filters work
   - Pagination works
   - Sorting works
5. Test update/delete:
   - Updates work
   - Immutable fields protected
   - Soft delete
6. Test receipt upload:
   - Image uploaded
   - Presigned URL returned
7. Run `npm test` and verify coverage

**Key Files:**
- `src/__tests__/transaction.integration.test.ts`

**Testing:**
- Run `npm test -- transaction.integration` and verify all pass
- Coverage > 80%

---

## PHASE 3: ANDROID TRANSACTIONS UI (2.10 - 2.18)

**Summary:** 9 Android tasks creating transaction form screen, CurrencyInputField component, real-time tax display, transaction history with filtering, receipt camera integration, and comprehensive testing. All tasks leverage Jetpack Compose, Retrofit for API integration, and TransactionViewModel for state management.

---

## SUCCESS CRITERIA (End of Sprint 2)

✅ **Users can record transactions** (income/expense)  
✅ **Taxes calculated automatically** (17% IVA + 2-5% retentions)  
✅ **Real-time tax display** on mobile  
✅ **Receipt images captured & stored** in S3  
✅ **Transaction history** with filtering/sorting  
✅ **67 story points completed** on time  
✅ **End-to-end tested** (mobile-to-backend)  
✅ **Performance targets met** (< 200ms API, cache > 70% hit rate)  

---

**Plan Created:** 2026-09-12  
**Lead Architect:** Claude Haiku 4.5  
**Status:** Ready for team review & approval

---

# 🔐 Sprint 1 Development Plan - Authentication & User Onboarding

## CONTEXT

**Why this sprint matters:** Sprint 1 implements the core authentication and user onboarding flows. This is critical because:
- Users cannot access the app without registration & login
- Authentication is the foundation for all subsequent features (data isolation, permissions)
- User data security depends on proper JWT handling and Firebase integration
- The onboarding experience determines user retention and first impressions

**Target outcome:** By end of Sprint 1:
- Users can register with email, password, and Cédula (Ecuador ID)
- Users can login and receive JWT tokens
- 2FA with OTP works end-to-end
- Token refresh works without re-login
- Password reset email flow functions
- App has beautiful onboarding carousel
- User tokens stored encrypted locally on mobile
- All auth endpoints fully tested
- Email notifications send on registration/password reset

**Duration:** 2 weeks | **Story Points:** 62 (32 Backend + 30 Android)

**Dependencies:** Sprint 0 must be completed

---

## PHASE 1: TEAM & DEPENDENCIES

### Team Allocation (Sprint 1)
- **Backend Lead** (1.0 FTE): 1.1, 1.2, 1.3, 1.8
- **Backend Dev** (1.0 FTE): 1.4, 1.5, 1.6, 1.7, 1.9
- **Android Lead** (1.0 FTE): 1.10, 1.11, 1.12, 1.17
- **Android Dev** (1.0 FTE): 1.13, 1.14, 1.15, 1.16, 1.18
- **QA/Testing** (0.5 FTE): Test planning, auth edge cases

### Critical Prerequisites (from Sprint 0)
- ✅ PostgreSQL running with users, sessions, otp_codes tables
- ✅ Redis running for token caching/blacklisting
- ✅ Firebase Admin SDK configured
- ✅ Email service configured (SendGrid or similar)
- ✅ Base API structure with error handling middleware
- ✅ Jetpack Compose theme & navigation framework ready
- ✅ Retrofit HTTP client & interceptors working
- ✅ Hilt DI initialized
- ✅ GitHub Actions CI/CD passing

### Key Architectural Decisions
- **Authentication:** JWT with 7-day access token + 30-day refresh token
- **Password Security:** bcrypt hashing (cost factor 12)
- **2FA:** OTP via email (6-digit, 10-minute expiry)
- **Token Storage (Mobile):** Android Keystore encrypted
- **Email Notifications:** Async queue (optional: Bull, RabbitMQ)
- **Rate Limiting:** Redis-backed (5 login attempts/15min)

---

## PHASE 2: BACKEND AUTHENTICATION (1.1 - 1.9)

### Task 1.1: Implement User Registration API (5 pts)
**Responsible:** Backend Lead  
**Dependencies:** Sprint 0 (tasks 0.1, 0.2)

**Acceptance Criteria:**
- ✅ POST `/auth/register` endpoint accepts email, password, firstName, lastName, cédula, phone
- ✅ Email validation: valid format, unique in database
- ✅ Password validation: min 8 chars, uppercase, lowercase, number, special char
- ✅ Cédula validation: Ecuador national ID format
- ✅ Returns 201 Created with user object (no password)
- ✅ Duplicate email returns 409 Conflict
- ✅ Validation errors return 400 with field-level messages
- ✅ User created with FREE plan by default
- ✅ Password hashed with bcrypt (cost 12)

**Implementation Steps:**
1. Create `src/model/user.model.ts`:
   - id (UUID), email (unique), passwordHash, firstName, lastName, cédula, phone, plan (FREE/PREMIUM), createdAt, updatedAt, deletedAt

2. Create `src/repository/user.repository.ts`:
   - `create(user)`, `findByEmail(email)`, `update(id, user)`, `delete(id)`
   - Connection pooling with pg library

3. Create `src/service/auth.service.ts`:
   - `register(email, password, firstName, lastName, cédula, phone)`
   - Input validation helpers
   - Password hashing: `bcrypt.hash(password, 12)`
   - Check duplicate email before insert

4. Create `src/controller/auth.controller.ts`:
   - Route: `POST /auth/register`
   - Request validation middleware
   - Response formatting: `{ success: true, data: { user }, message: "Registration successful" }`

5. Add email notification:
   - Send "Welcome to XIO" email after successful registration
   - Use async queue or direct email service

**Key Files:**
- `src/model/user.model.ts` - User entity
- `src/repository/user.repository.ts` - Database access
- `src/service/auth.service.ts` - Business logic
- `src/controller/auth.controller.ts` - API endpoint
- `src/middleware/validation.ts` - Input validation
- `src/utils/validators.ts` - Cédula, email, password validators

**Testing:**
- Unit tests: Valid input, duplicate email, validation failures
- Integration test: Full registration flow end-to-end

---

### Task 1.2: Implement Login API with JWT (5 pts)
**Responsible:** Backend Lead  
**Dependencies:** Sprint 0 (tasks 0.1, 0.2)

**Acceptance Criteria:**
- ✅ POST `/auth/login` accepts email, password
- ✅ Verifies password against stored hash (bcrypt.compare)
- ✅ Returns accessToken (7-day expiry) + refreshToken (30-day expiry)
- ✅ Invalid credentials return 401 Unauthorized (no field hints for security)
- ✅ Rate limiting: max 5 failed login attempts per IP/email (15 min window)
- ✅ JWT payload includes: userId, email, plan, iat, exp
- ✅ Tokens signed with HS256 algorithm (or RS256 for higher security)
- ✅ Return also includes user object (email, firstName, plan, etc.)

**Implementation Steps:**
1. Add JWT signing utilities in `src/utils/jwt.utils.ts`:
   - `generateAccessToken(userId, email, plan)` → 7-day expiry
   - `generateRefreshToken(userId)` → 30-day expiry
   - `verifyToken(token)` → decode and validate

2. Update `src/service/auth.service.ts`:
   - Add `login(email, password)` method
   - Fetch user from DB
   - Validate password: `bcrypt.compare(password, user.passwordHash)`
   - If invalid, log attempt to rate limit table
   - If valid, generate tokens and return

3. Add rate limiting to `src/service/auth.service.ts`:
   - Track failed login attempts in Redis: `login_attempts:{email}:{ip}`
   - Increment on failure, TTL 15 minutes
   - Return 429 Too Many Requests if limit exceeded

4. Create `src/controller/auth.controller.ts`:
   - Route: `POST /auth/login`
   - Validate email format, password provided
   - Call auth service, return tokens + user

5. Create login session record in database:
   - Store session info (userId, refreshToken, IP, userAgent, expiresAt)
   - Optional: revoke old sessions on new login

**Key Files:**
- `src/utils/jwt.utils.ts` - JWT utilities
- `src/service/auth.service.ts` - Login logic
- `src/controller/auth.controller.ts` - API endpoint
- `src/model/session.model.ts` - Session entity
- Rate limiting logic (Redis or DB)

**Testing:**
- Valid credentials → tokens returned
- Invalid password → 401
- 5 failed attempts → 429
- Decode token → correct payload

---

### Task 1.3: Implement Token Refresh Endpoint (3 pts)
**Responsible:** Backend Lead  
**Dependencies:** Sprint 0 (tasks 0.1, 0.2)

**Acceptance Criteria:**
- ✅ POST `/auth/refresh` accepts refreshToken
- ✅ Validates refresh token (not expired, valid signature)
- ✅ Returns new accessToken (7-day expiry) + new refreshToken (30-day expiry)
- ✅ Invalid/expired refresh token returns 401
- ✅ Session still valid in database
- ✅ Old session record updated with new refreshToken

**Implementation Steps:**
1. Add to `src/utils/jwt.utils.ts`:
   - `verifyRefreshToken(token)` - decode and validate, check in DB

2. Add to `src/service/auth.service.ts`:
   - `refreshToken(refreshTokenString)` method
   - Verify token signature
   - Check session in database (not expired, not revoked)
   - Generate new access + refresh tokens
   - Update session record with new refresh token

3. Create endpoint in `src/controller/auth.controller.ts`:
   - Route: `POST /auth/refresh`
   - Request: `{ refreshToken: "..." }`
   - Response: `{ accessToken, refreshToken, expiresIn }`

**Key Files:**
- `src/utils/jwt.utils.ts` - Token verification
- `src/service/auth.service.ts` - Refresh logic
- `src/controller/auth.controller.ts` - API endpoint

**Testing:**
- Valid refresh token → new tokens
- Expired refresh token → 401
- Revoked session → 401

---

### Task 1.4: Implement OTP 2FA Verification (4 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (tasks 0.1, 0.2)

**Acceptance Criteria:**
- ✅ POST `/auth/login/otp-request` - sends 6-digit OTP to email
- ✅ OTP valid for 10 minutes only
- ✅ POST `/auth/login/otp-verify` - verifies OTP and completes login
- ✅ Invalid OTP returns 401
- ✅ Expired OTP returns 410 Gone
- ✅ Max 3 OTP attempts per request (prevent brute force)
- ✅ OTP stored hashed in database (not plaintext)
- ✅ Email contains: OTP code, expiry time, "if not you, ignore"

**Implementation Steps:**
1. Create `src/model/otp_code.model.ts`:
   - userId, codeHash, type (LOGIN or PASSWORD_RESET), attempts, expiresAt, createdAt

2. Add to `src/service/auth.service.ts`:
   - `requestOtp(userId, email)` - generates random 6-digit code, hashes it, stores in DB with 10-min TTL
   - `verifyOtp(userId, code)` - hashes input code, compares with DB, marks as used

3. Update login flow:
   - After password validation, return `{ requiresOtp: true, temporaryToken: "..." }`
   - Mobile uses temporaryToken to verify OTP
   - After OTP verified, issue real accessToken

4. Create endpoints:
   - POST `/auth/login/otp-request` → sends OTP email
   - POST `/auth/login/otp-verify` → completes login

5. Email service:
   - Send OTP via SendGrid or similar
   - Template: "Your XIO login code: 123456 (valid for 10 minutes)"

**Key Files:**
- `src/model/otp_code.model.ts`
- `src/repository/otp.repository.ts`
- `src/service/auth.service.ts` - OTP logic
- `src/controller/auth.controller.ts` - OTP endpoints
- `src/service/email.service.ts` - OTP email sending

**Testing:**
- Request OTP → email received
- Valid OTP → login completes
- Invalid OTP → 401
- Expired OTP → 410
- 3 failed attempts → rate limit

---

### Task 1.5: Implement Password Reset Flow (4 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (tasks 0.1, 0.2)

**Acceptance Criteria:**
- ✅ POST `/auth/forgot-password` - sends reset email with token
- ✅ Reset token valid for 1 hour only
- ✅ POST `/auth/reset-password` - accepts reset token + new password
- ✅ Password updated, all sessions invalidated
- ✅ Invalid/expired reset token returns 401
- ✅ Email contains: reset link with token, "if not you, ignore"
- ✅ Rate limit: max 3 reset emails per IP per hour

**Implementation Steps:**
1. Create `src/model/password_reset_token.model.ts`:
   - userId, tokenHash, expiresAt, usedAt

2. Add to `src/service/auth.service.ts`:
   - `requestPasswordReset(email)` - finds user, generates token, hashes it, stores in DB with 1-hour TTL
   - `resetPassword(resetToken, newPassword)` - verifies token, updates password, invalidates all sessions

3. Create endpoints:
   - POST `/auth/forgot-password` → sends reset email
   - POST `/auth/reset-password` → validates token, updates password

4. Email service:
   - Send reset link: `https://app.xio.ec/reset-password?token=...`
   - Template: "Reset your password by clicking link below (valid 1 hour)"

5. Session invalidation:
   - After password reset, mark all user sessions as revoked
   - Force mobile app to re-login

**Key Files:**
- `src/model/password_reset_token.model.ts`
- `src/service/auth.service.ts` - Password reset logic
- `src/controller/auth.controller.ts` - Reset endpoints
- `src/service/email.service.ts` - Reset email

**Testing:**
- Request reset → email received
- Valid token + new password → password updated, sessions revoked
- Invalid token → 401
- Expired token → 401

---

### Task 1.6: Implement Firebase Authentication (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (task 0.4)

**Acceptance Criteria:**
- ✅ Firebase user created alongside DB user on registration
- ✅ Firebase token accepted as alternative authentication method
- ✅ POST `/auth/firebase-verify` - verifies Firebase ID token, returns JWT
- ✅ Mobile can authenticate with Firebase token instead of email/password
- ✅ User synchronized between Firebase and PostgreSQL

**Implementation Steps:**
1. Update registration flow:
   - After user created in DB, create Firebase user with email/password
   - Store Firebase UID in users table

2. Create `src/middleware/firebaseAuth.ts`:
   - Extract Firebase ID token from Authorization header
   - Verify with Firebase Admin SDK
   - Attach user info to request

3. Create endpoint:
   - POST `/auth/firebase-verify` - accepts Firebase ID token
   - Verifies with Firebase Admin SDK
   - Finds/creates XIO user matching Firebase UID
   - Returns XIO JWT tokens

4. Update login flow:
   - Optional: allow Firebase sign-in as alternative
   - Get Firebase ID token → exchange for XIO JWT

**Key Files:**
- `src/config/firebase.ts` - Firebase Admin SDK
- `src/middleware/firebaseAuth.ts` - Firebase verification
- `src/controller/auth.controller.ts` - Firebase endpoint
- `src/service/auth.service.ts` - Firebase user sync

**Testing:**
- Firebase user created on registration
- Firebase token exchanged for XIO JWT
- User synced between systems

---

### Task 1.7: Implement Rate Limiting (5 login attempts) (2 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (task 0.3)

**Acceptance Criteria:**
- ✅ Max 5 failed login attempts per email/IP per 15-minute window
- ✅ After 5 failures, return 429 Too Many Requests
- ✅ Rate limit stored in Redis (fast lookups)
- ✅ Successful login resets attempt counter
- ✅ Response includes `Retry-After` header

**Implementation Steps:**
1. Add rate limiting middleware:
   - Create `src/middleware/rateLimiter.ts`
   - Use `express-rate-limit` or custom Redis logic

2. Add to login handler:
   - On failed login attempt:
     - Increment `login_attempts:{email}:{ip}` in Redis
     - Set TTL to 15 minutes
     - If count ≥ 5, return 429
   - On successful login:
     - Delete `login_attempts:{email}:{ip}` key

3. Global rate limiting (optional):
   - Implement global limit: 100 requests/15 min per user
   - Per endpoint limits: higher for reads, lower for writes

**Key Files:**
- `src/middleware/rateLimiter.ts` - Rate limiting middleware
- `src/config/redis.ts` - Redis connection

**Testing:**
- First 4 failed attempts → 401
- 5th failed attempt → 429
- Successful login → reset counter

---

### Task 1.8: Create User Repository & Entity (3 pts)
**Responsible:** Backend Lead  
**Dependencies:** Sprint 0 (task 0.2)

**Acceptance Criteria:**
- ✅ User entity with all required fields
- ✅ User repository with CRUD operations
- ✅ Database indexes on email, cédula
- ✅ Soft delete support (deletedAt column)
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Type-safe TypeScript interfaces

**Implementation Steps:**
1. Create `src/model/user.model.ts`:
   ```typescript
   interface User {
     id: string; // UUID
     email: string;
     passwordHash: string;
     firstName: string;
     lastName: string;
     cedula: string;
     phone: string;
     firebaseUid?: string;
     plan: 'FREE' | 'PREMIUM';
     verified: boolean;
     verifiedAt?: Date;
     deletedAt?: Date;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. Create `src/repository/user.repository.ts`:
   - `create(user)` - insert new user
   - `findById(id)` - get by UUID
   - `findByEmail(email)` - get by email (unique)
   - `findByFirebaseUid(uid)` - get by Firebase UID
   - `update(id, updates)` - update fields
   - `delete(id)` - soft delete (set deletedAt)
   - `list()` - all non-deleted users (pagination)

3. Create database indexes:
   - CREATE UNIQUE INDEX ON users(email) WHERE deletedAt IS NULL
   - CREATE INDEX ON users(cedula)
   - CREATE INDEX ON users(firebaseUid)

**Key Files:**
- `src/model/user.model.ts` - User interface/type
- `src/repository/user.repository.ts` - Database access
- Migrations: Add indexes to users table

**Testing:**
- Create user, retrieve by email
- Update user fields
- Soft delete user
- Duplicate email rejected

---

### Task 1.9: Unit Tests for Auth Service (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (task 0.8)

**Acceptance Criteria:**
- ✅ 85%+ code coverage for auth service
- ✅ Tests for registration: valid input, duplicate email, validation failures
- ✅ Tests for login: valid credentials, invalid password, rate limiting
- ✅ Tests for token refresh: valid token, expired token
- ✅ Tests for OTP: generation, verification, expiry
- ✅ Tests for password reset: token generation, reset, invalid token
- ✅ All tests pass in CI/CD pipeline

**Implementation Steps:**
1. Create `src/service/__tests__/auth.service.test.ts`:
   - Setup: Mock user repository, email service
   - Test registration with valid/invalid inputs
   - Test login with various credentials
   - Test token generation/verification
   - Test OTP flow
   - Test password reset

2. Use testing framework (Jest):
   - Mock database calls
   - Test password hashing
   - Test rate limiting logic

3. Run tests:
   - `npm test` - runs all tests
   - `npm test -- --coverage` - generates coverage report

**Key Files:**
- `src/service/__tests__/auth.service.test.ts` - Test suite
- `jest.config.js` - Jest configuration

**Testing:**
- Run `npm test` and verify 85%+ coverage
- All auth scenarios covered

---

## PHASE 3: ANDROID AUTHENTICATION UI (1.10 - 1.18)

### Task 1.10: Create Splash Screen with Logo Animation (3 pts)
**Responsible:** Android Lead  
**Dependencies:** Sprint 0 (task 0.12)

**Acceptance Criteria:**
- ✅ Full-screen splash with XIO logo (orange/teal colors)
- ✅ Logo animates in: fade-in + scale animation (300ms)
- ✅ Splash displays for 2 seconds minimum
- ✅ Transitions to onboarding or home based on auth status
- ✅ Works on API 26+
- ✅ WCAG 2.1 AA accessible

**Implementation Steps:**
1. Create `ui/screen/SplashScreen.kt`:
   - Full-screen Compose with logo
   - Launch animation: fade-in + scale
   - Duration 300ms with spring physics
   - Delay 2 seconds before navigation

2. Create Lottie animation (optional):
   - Use Lottie for more complex animation
   - Or use Compose AnimatedVisibility + scale

3. Navigation logic:
   - Check if user logged in (SharedPreferences/encrypted storage)
   - Navigate to Onboarding if new user
   - Navigate to Home if logged in

4. Add to MainActivity:
   - Launch SplashScreen first
   - Auto-navigate after animation

**Key Files:**
- `ui/screen/SplashScreen.kt` - Splash screen Composable
- `ui/theme/Theme.kt` - Colors (orange #FF6B35, teal #004E89)
- Add Lottie dependency (optional): `com.airbnb.android:lottie-compose`

**Testing:**
- Launch app → see splash animation
- Animation completes → navigate based on auth state
- Works on multiple devices

---

### Task 1.11: Create Onboarding Carousel (5 screens) (5 pts)
**Responsible:** Android Lead  
**Dependencies:** Sprint 0 (task 0.12)

**Acceptance Criteria:**
- ✅ 5-screen onboarding carousel
- ✅ Swipe or dot navigation between screens
- ✅ Screen 1: Welcome to XIO (problem → solution)
- ✅ Screen 2: Tax Calculation (17% IVA feature)
- ✅ Screen 3: Dashboard & Analytics
- ✅ Screen 4: Compliance Audits (SRI integration)
- ✅ Screen 5: Security & Privacy
- ✅ "Get Started" button on final screen
- ✅ Smooth transitions with 300ms animations
- ✅ Skip button on each screen
- ✅ WCAG accessible

**Implementation Steps:**
1. Create `ui/screen/OnboardingScreen.kt`:
   - Use Pager component (LazyRow or HorizontalPager)
   - 5 screens with PageIndicator (dots)

2. Create individual screens:
   - `OnboardingPage1.kt` - Welcome
   - `OnboardingPage2.kt` - Tax features
   - `OnboardingPage3.kt` - Dashboard
   - `OnboardingPage4.kt` - Audit
   - `OnboardingPage5.kt` - Security

3. Navigation:
   - Swipe left/right to change pages
   - Tap dots to jump to page
   - Skip button → go to login
   - Get Started button → go to login

4. Animations:
   - Page transition: 300ms with ease animation
   - Icons fade-in with scale on each page
   - Text animates from bottom

**Key Files:**
- `ui/screen/OnboardingScreen.kt` - Carousel container
- `ui/screen/onboarding/OnboardingPage*.kt` - Individual screens
- `ui/component/PageIndicator.kt` - Dot indicator

**Testing:**
- Launch app → see onboarding
- Swipe between pages
- Tap dots to navigate
- Skip → go to login
- Get Started → go to login

---

### Task 1.12: Create Login Screen with Email/Password (4 pts)
**Responsible:** Android Lead  
**Dependencies:** Sprint 0 (task 0.12)

**Acceptance Criteria:**
- ✅ Email input field with validation
- ✅ Password input field (masked) with show/hide toggle
- ✅ "Forgot Password?" link
- ✅ Login button (disabled if fields empty)
- ✅ "Create Account" link to registration
- ✅ Error display for failed login
- ✅ Loading spinner during API call
- ✅ OTP screen triggered after password validation
- ✅ WCAG accessible (touch targets 48x48dp)

**Implementation Steps:**
1. Create `ui/screen/LoginScreen.kt`:
   - Email input with validation (format check)
   - Password input with visibility toggle
   - Login button
   - Links to forgot password + register

2. Create ViewModel `ui/viewmodel/LoginViewModel.kt`:
   - State: email, password, isLoading, error, requiresOtp
   - Actions: onEmailChange, onPasswordChange, login, navigateToRegister, navigateToForgotPassword
   - Use Retrofit to call backend `/auth/login`

3. Handle OTP:
   - After password validation, show OTP screen
   - Store temporary token for OTP verification

4. Add error handling:
   - Display error messages (invalid email, wrong password, rate limited)
   - Clear error on retry

5. Accessibility:
   - Touch targets 48x48dp
   - Proper label-input associations
   - Error announcements for screen readers

**Key Files:**
- `ui/screen/LoginScreen.kt` - UI Composables
- `ui/viewmodel/LoginViewModel.kt` - Business logic
- `ui/component/EmailInputField.kt` - Reusable component
- `ui/component/PasswordInputField.kt` - Reusable with visibility toggle

**Testing:**
- Valid credentials → OTP screen
- Invalid email → error message
- Empty fields → button disabled
- "Forgot Password?" → navigate
- "Create Account" → navigate

---

### Task 1.13: Create Registration Screen with Cédula Validation (5 pts)
**Responsible:** Android Dev  
**Dependencies:** Sprint 0 (task 0.12)

**Acceptance Criteria:**
- ✅ Email input with validation
- ✅ Password input with strength indicator
- ✅ First Name input
- ✅ Last Name input
- ✅ Cédula input with Ecuador format validation (10 digits)
- ✅ Phone input with Ecuador format (+593...)
- ✅ Terms & Conditions checkbox
- ✅ Register button
- ✅ Link to login screen
- ✅ Error display for validation failures
- ✅ Loading state during registration
- ✅ Success message + auto-navigate to login

**Implementation Steps:**
1. Create `ui/screen/RegisterScreen.kt`:
   - Email field with format validation
   - Password field with strength indicator (visual bar)
   - First/Last name fields
   - Cédula field (format: 10 digits, Ecuador validation)
   - Phone field (format: +593...)
   - T&C checkbox (required)
   - Register button

2. Create ViewModel `ui/viewmodel/RegisterViewModel.kt`:
   - State: all form fields, isLoading, error, passwordStrength
   - Actions: onChange methods, onRegister, navigateToLogin
   - Validation: email format, password strength (8+ chars, upper, lower, digit, special)
   - Call backend `/auth/register`

3. Password strength indicator:
   - Show visual bar (red → yellow → green)
   - Provide feedback: "Weak", "Good", "Strong"
   - Requirements: 8+ chars, uppercase, lowercase, digit, special char

4. Cédula validation:
   - Ecuador format: 10 digits (not just any 10 digits)
   - Optional: Validate against Ecuador checksum algorithm

5. Handle registration response:
   - Success → show message "Check your email to verify"
   - Auto-navigate to login after 2 seconds
   - Errors → display inline messages

6. Accessibility:
   - Touch targets 48x48dp
   - Password strength announced
   - Required fields marked

**Key Files:**
- `ui/screen/RegisterScreen.kt` - UI
- `ui/viewmodel/RegisterViewModel.kt` - Logic
- `ui/component/PasswordStrengthIndicator.kt` - Strength bar
- `utils/validators/CedulaValidator.kt` - Cédula validation
- `utils/validators/PhoneValidator.kt` - Phone validation

**Testing:**
- Valid registration → success message
- Duplicate email → error
- Weak password → feedback
- Invalid Cédula → error
- T&C unchecked → button disabled

---

### Task 1.14: Create OTP Verification Screen (3 pts)
**Responsible:** Android Dev  
**Dependencies:** Sprint 0 (task 0.12)

**Acceptance Criteria:**
- ✅ 6-digit OTP input (digit-only keyboard)
- ✅ Auto-focus on each digit
- ✅ Visual feedback as digits entered
- ✅ Verify button enables after 6 digits
- ✅ "Resend OTP" button (disabled for 60 seconds, then countdown)
- ✅ Error display for invalid OTP
- ✅ Loading state during verification
- ✅ Success → auto-navigate to home
- ✅ Back button to re-enter email/password
- ✅ WCAG accessible

**Implementation Steps:**
1. Create `ui/screen/OtpScreen.kt`:
   - 6 digit input boxes
   - Auto-focus between digits
   - Resend OTP button with 60-second cooldown

2. Create ViewModel `ui/viewmodel/OtpViewModel.kt`:
   - State: otpCode, isLoading, error, resendCooldown
   - Actions: onDigitChange, verifyOtp, resendOtp
   - Call backend `/auth/login/otp-verify`

3. Handle OTP input:
   - Accept only digits
   - Move focus to next field on digit entry
   - Move focus back on backspace
   - Full code entered → enable verify button

4. Resend logic:
   - First resend available after 60 seconds
   - Show countdown timer
   - Call `/auth/login/otp-request` to resend

5. Error handling:
   - Invalid OTP → "Incorrect code"
   - Expired OTP → "Code expired, request new one"
   - Max attempts → "Too many attempts, try again later"

6. Success:
   - Store JWT tokens (encrypted)
   - Auto-navigate to home

**Key Files:**
- `ui/screen/OtpScreen.kt` - OTP input UI
- `ui/viewmodel/OtpViewModel.kt` - OTP logic
- `ui/component/OtpInputField.kt` - Reusable OTP input component
- Local storage for temporary token during OTP flow

**Testing:**
- Enter 6 digits → verify button enabled
- Valid OTP → navigate to home
- Invalid OTP → error message
- Resend after 60 seconds
- Expired OTP → request new one

---

### Task 1.15: Integrate Firebase Authentication (3 pts)
**Responsible:** Android Dev  
**Dependencies:** Sprint 0 (task 0.15 - Hilt)

**Acceptance Criteria:**
- ✅ Firebase SDK initialized in app
- ✅ Firebase sign-in option available (email/password)
- ✅ Firebase ID token exchanged for XIO JWT
- ✅ User synced between Firebase and XIO backend
- ✅ Works alongside email/password login
- ✅ Handle Firebase authentication errors

**Implementation Steps:**
1. Add Firebase Auth dependencies:
   - `com.google.firebase:firebase-auth-ktx`

2. Create `data/repository/FirebaseAuthRepository.kt`:
   - Initialize Firebase Auth
   - `signUp(email, password)` - Firebase + XIO backend
   - `signIn(email, password)` - Firebase → XIO
   - `getIdToken()` - Get Firebase ID token
   - `signOut()` - Sign out from Firebase

3. Integrate with auth flow:
   - After password validation, call Firebase
   - Get Firebase ID token
   - Exchange for XIO JWT via `/auth/firebase-verify`
   - Store tokens locally

4. Optional: Add social auth (Google sign-in):
   - `com.google.android.gms:play-services-auth`
   - Allow Google sign-in button
   - Exchange Google token for XIO JWT

**Key Files:**
- `data/repository/FirebaseAuthRepository.kt`
- Firebase configuration in `google-services.json`
- Update `ui/viewmodel/LoginViewModel.kt` to support Firebase

**Testing:**
- Sign up with Firebase → user created in XIO
- Sign in with Firebase → receive XIO JWT
- ID token exchanged successfully

---

### Task 1.16: Implement Token Storage (Encrypted) (3 pts)
**Responsible:** Android Dev  
**Dependencies:** Sprint 0 (task 0.13, 0.15)

**Acceptance Criteria:**
- ✅ Access token stored encrypted locally
- ✅ Refresh token stored encrypted locally
- ✅ User email/ID stored encrypted
- ✅ Tokens automatically sent in API requests
- ✅ Refresh token used to get new access token when expired
- ✅ Tokens cleared on logout
- ✅ Use Android Keystore for encryption
- ✅ Never store tokens in SharedPreferences (unencrypted)

**Implementation Steps:**
1. Create `data/local/preference/UserPreferences.kt`:
   - Use EncryptedSharedPreferences (from androidx.security.crypto)
   - Store: accessToken, refreshToken, userId, email, expiresAt

2. Create `data/repository/TokenRepository.kt`:
   - `saveTokens(accessToken, refreshToken, expiresIn)`
   - `getAccessToken()` - returns token or null
   - `getRefreshToken()` - returns token or null
   - `isTokenExpired()` - check expiry
   - `clearTokens()` - delete on logout

3. Integrate with Retrofit interceptor:
   - Create `data/remote/interceptor/AuthInterceptor.kt`
   - Get accessToken from TokenRepository
   - Add to Authorization header: `Bearer {token}`
   - Handle 401 response → refresh token → retry request

4. Token refresh logic:
   - When token expired, call `/auth/refresh`
   - Store new tokens
   - Retry original request

5. Encryption setup:
   - Use EncryptedSharedPreferences with Android Keystore
   - No plaintext tokens stored
   - Automatic encryption/decryption

**Key Files:**
- `data/local/preference/UserPreferences.kt` - Encrypted storage
- `data/repository/TokenRepository.kt` - Token management
- `data/remote/interceptor/AuthInterceptor.kt` - Token injection + refresh
- Add dependency: `androidx.security:security-crypto:1.1.0-alpha06`

**Testing:**
- Login → tokens stored encrypted
- Access API → Authorization header included
- Token expired → refresh automatically
- Logout → tokens cleared

---

### Task 1.17: Create Auth Navigation Flow (2 pts)
**Responsible:** Android Lead  
**Dependencies:** Sprint 0 (task 0.12)

**Acceptance Criteria:**
- ✅ Navigation handles: Splash → Onboarding → Login/Register → OTP → Home
- ✅ Logged-in users bypass splash/onboarding → go to Home
- ✅ New users see: Splash → Onboarding → Login/Register
- ✅ Existing logged-in users: Splash → Home (instant)
- ✅ Back button behavior correct (no going back after login)
- ✅ Deep linking handled (if launched with intent)

**Implementation Steps:**
1. Create `navigation/NavGraph.kt`:
   - Define all navigation routes and destinations
   - Routes: splash, onboarding, login, register, otp, home, forgot-password, reset-password

2. Create `navigation/AuthFlow.kt`:
   - Determine initial route:
     - Check if user logged in (TokenRepository)
     - If yes and token valid → Home
     - If yes but token expired → try refresh
     - If no → Splash
   - Handle token refresh errors → back to login

3. Handle back navigation:
   - After login, clear back stack (no back to login)
   - Use `popUpTo` to remove previous destinations

4. Optional deep linking:
   - Handle password reset link from email
   - Extract token from URL → navigate to reset-password screen

**Key Files:**
- `navigation/NavGraph.kt` - Navigation graph definition
- `navigation/AuthFlow.kt` - Auth state logic
- `MainActivity.kt` - Set up nav controller

**Testing:**
- New user launch → Splash → Onboarding → Login
- Logged-in user launch → Splash → Home
- Login successful → Home (no back)
- Expired token → refresh automatically
- Password reset link → navigate to reset screen

---

### Task 1.18: Unit Tests for AuthViewModel (2 pts)
**Responsible:** Android Dev  
**Dependencies:** Sprint 0 (task 0.16)

**Acceptance Criteria:**
- ✅ 80%+ code coverage for AuthViewModel
- ✅ Tests for login: valid/invalid credentials, OTP trigger
- ✅ Tests for registration: validation, success, errors
- ✅ Tests for password reset: token generation, reset
- ✅ Tests for token refresh: expired token handled
- ✅ All tests pass in CI/CD
- ✅ Instrumentation tests for API calls (using mock server)

**Implementation Steps:**
1. Create `ui/viewmodel/__tests__/LoginViewModelTest.kt`:
   - Setup: Mock repository, auth service
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test OTP triggered
   - Test rate limiting (too many attempts)

2. Create `ui/viewmodel/__tests__/RegisterViewModelTest.kt`:
   - Test registration with valid input
   - Test duplicate email error
   - Test password validation
   - Test Cédula validation

3. Create `ui/viewmodel/__tests__/OtpViewModelTest.kt`:
   - Test OTP verification
   - Test OTP expiry
   - Test resend OTP
   - Test max attempts

4. Setup test dependencies:
   - Mockk for mocking
   - Coroutine test rules
   - ViewModel test utilities

5. Run tests:
   - `./gradlew test` - unit tests
   - `./gradlew connectedAndroidTest` - instrumentation tests

**Key Files:**
- `ui/viewmodel/__tests__/LoginViewModelTest.kt`
- `ui/viewmodel/__tests__/RegisterViewModelTest.kt`
- `ui/viewmodel/__tests__/OtpViewModelTest.kt`

**Testing:**
- Run `./gradlew test` and verify 80%+ coverage
- All auth scenarios covered

---

## IMPLEMENTATION TIMELINE

**Week 1:**
- Day 1-2: Tasks 1.1, 1.2, 1.3 (backend auth core)
- Day 1-2: Tasks 1.10, 1.11, 1.12 (Android UI)
- Day 2-3: Tasks 1.4, 1.5, 1.6 (backend OTP, password reset, Firebase)
- Day 3-4: Tasks 1.13, 1.14, 1.15 (Android registration, OTP, Firebase)

**Week 2:**
- Day 1-2: Tasks 1.7, 1.8, 1.9 (backend rate limiting, repository, tests)
- Day 1-2: Tasks 1.16, 1.17, 1.18 (Android token storage, nav, tests)
- Day 3-5: Sprint 1 testing, bug fixes, optimization

---

## VERIFICATION CHECKLIST

### Backend Auth Ready
- [ ] POST `/auth/register` working (create user, send welcome email)
- [ ] POST `/auth/login` working (password validation, JWT tokens)
- [ ] POST `/auth/refresh` working (token refresh)
- [ ] POST `/auth/login/otp-request` sending OTP emails
- [ ] POST `/auth/login/otp-verify` completing login with OTP
- [ ] POST `/auth/forgot-password` sending reset emails
- [ ] POST `/auth/reset-password` updating password
- [ ] Rate limiting: max 5 login attempts (returns 429)
- [ ] User repository CRUD working
- [ ] All auth service tests passing (85%+ coverage)
- [ ] Swagger docs show all auth endpoints

### Android Auth Ready
- [ ] Splash screen animates (2 seconds)
- [ ] Onboarding carousel (5 screens, swipe navigation)
- [ ] Login screen: email, password, forgot password link
- [ ] Registration screen: all fields, validation, strength indicator
- [ ] OTP screen: 6-digit input, resend timer
- [ ] Login flow → OTP → Home
- [ ] Tokens stored encrypted (not accessible in plaintext)
- [ ] API calls include Authorization header
- [ ] Token refresh on expiry (automatic)
- [ ] AuthViewModel tests passing (80%+ coverage)
- [ ] Navigation working: splash → onboarding → login → home

### Integration Ready
- [ ] Mobile-to-backend: email/password login works
- [ ] Mobile-to-backend: OTP verification works
- [ ] Mobile-to-backend: token refresh works
- [ ] Mobile-to-backend: logout clears tokens
- [ ] Email notifications: registration, password reset, OTP
- [ ] End-to-end: New user → register → verify email → login → home

---

## SUCCESS CRITERIA (End of Sprint 1)

✅ **Users can register** with email, password, and Cédula  
✅ **Users can login** with email/password or Firebase  
✅ **2FA works** - OTP verification completes login  
✅ **Token refresh** happens automatically when expired  
✅ **Password reset** works end-to-end  
✅ **Beautiful onboarding** - 5-screen carousel introduces app  
✅ **Secure token storage** - encrypted locally on mobile  
✅ **62 story points completed** - on time, no tech debt  
✅ **All tests passing** - 85%+ backend, 80%+ Android coverage  
✅ **Production-ready** - email notifications, error handling, rate limiting  

---

## SPRINT 1 → SPRINT 2 DEPENDENCIES

Sprint 2 (Transactions) depends on Sprint 1 completing:
- User registration & authentication ← Task 1.1-1.6
- JWT token handling ← Task 1.2-1.3
- Encrypted token storage ← Task 1.16
- User navigation framework ← Task 1.17
- API interceptors for auth header ← Task 1.16
- AuthViewModel established ← Task 1.18

**No Sprint 2 work starts until all Sprint 1 tasks pass acceptance criteria.**

---

**Plan Created:** 2026-09-12  
**Lead Architect:** Claude Haiku 4.5  
**Status:** Ready for team review & approval

---

# 💰 Sprint 2 Development Plan - Transactions & Real-Time Tax Calculation

## CONTEXT

**Why this sprint matters:** Sprint 2 implements the core financial tracking feature - allowing users to record income/expense transactions with **automatic real-time tax calculation**. This is the heart of the XIO value proposition:
- Users see instant tax implications (17% IVA + 2-5% retentions)
- Transactions categorized (SERVICIOS, BIENES, OTRO) for different tax rates
- Receipt upload enables audit trails
- Caching optimizes performance for large transaction histories

**Target outcome:** By end of Sprint 2:
- Users can create income/expense transactions (mobile & API)
- Taxes auto-calculated in real-time (17% IVA + retention by category)
- Users see transaction history with filtering/sorting
- Receipt images stored in S3 with transaction
- Transactions stored in PostgreSQL with full indexing
- Transaction data cached in Redis for performance
- Full transaction CRUD API endpoints
- All transaction flows end-to-end tested

**Duration:** 2 weeks | **Story Points:** 67 (36 Backend + 31 Android)

**Dependencies:** Sprint 0 (infrastructure) + Sprint 1 (authentication) must be complete

---

## PHASE 1: TEAM & DEPENDENCIES

### Team Allocation (Sprint 2)
- **Backend Lead** (1.0 FTE): 2.1, 2.2, 2.7, 2.9
- **Backend Dev** (1.0 FTE): 2.3, 2.4, 2.5, 2.6, 2.8
- **Android Lead** (1.0 FTE): 2.10, 2.11, 2.12, 2.16
- **Android Dev** (1.0 FTE): 2.13, 2.14, 2.15, 2.17, 2.18
- **QA/Testing** (0.5 FTE): Tax calculation edge cases, filtering tests

### Critical Prerequisites (from Sprint 0 & 1)
- ✅ PostgreSQL running with indexed tables
- ✅ Redis running for caching
- ✅ S3 bucket configured for receipt uploads
- ✅ Authenticated API endpoints working
- ✅ JWT tokens being sent in requests
- ✅ Jetpack Compose with theme system ready
- ✅ CurrencyInputField, DatePickerField components available
- ✅ Retrofit HTTP client with token injection

### Key Architectural Decisions
- **Tax Calculation:** Real-time, calculated on client AND server (trust but verify)
- **Categories:** 3 types (SERVICIOS, BIENES, OTRO) with different retention rates
- **Caching:** Transaction list in Redis (5-min TTL), user totals (hourly)
- **Receipts:** Stored in S3 with presigned URLs, referenced in transaction
- **Filters:** Date range, category, type (income/expense), status
- **Offline:** Transactions queued locally, synced when online

---

## PHASE 2: BACKEND TRANSACTIONS (2.1 - 2.9)

### Task 2.1: Create Transaction Entity & Repository (4 pts)
**Responsible:** Backend Lead  
**Dependencies:** Sprint 0 complete (0.2)

**Acceptance Criteria:**
- ✅ Transaction entity with all required fields
- ✅ Repository with CRUD operations
- ✅ Database indexes on userId, date, category, status
- ✅ Soft delete support (deletedAt)
- ✅ Timestamps and full audit trail
- ✅ Type-safe TypeScript interfaces

**Implementation Steps:**
1. Create `src/model/transaction.model.ts` with interface:
   - id (UUID), userId, type (INCOME/EXPENSE), amount, category (SERVICIOS/BIENES/OTRO)
   - description, date, client, receiptUrl, status (PENDING/VERIFIED/REJECTED)
   - taxes (nested: iva, ivaRate, retention, retentionRate, total, net)
   - createdAt, updatedAt, deletedAt

2. Create `src/repository/transaction.repository.ts` with:
   - `create(transaction)`, `findById(id)`, `findByUserId(userId, pagination)`
   - `update(id, updates)`, `delete(id)` (soft delete)
   - `listByDateRange(userId, startDate, endDate)`
   - `listByCategory(userId, category)`
   - `getByStatus(userId, status)` (for filtering)

3. Create database indexes:
   - CREATE INDEX ON transactions(userId, createdAt DESC)
   - CREATE INDEX ON transactions(category, date)
   - CREATE INDEX ON transactions(status)

**Key Files:**
- `src/model/transaction.model.ts`
- `src/repository/transaction.repository.ts`

**Testing:**
- CRUD operations work
- Indexes improve query performance

---

### Task 2.2: Implement Transaction Creation API (5 pts)
**Responsible:** Backend Lead  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ POST `/transactions` accepts type, amount, category, description, date, client, receiptUrl
- ✅ Amount validation: 0.01 to 999,999.99 USD
- ✅ Category validation: SERVICIOS, BIENES, or OTRO
- ✅ Date validation: not in future, within last 2 years
- ✅ Creates transaction record in database
- ✅ Returns 201 Created with full transaction object (including calculated taxes)
- ✅ Validation errors return 400 with field-level messages

**Implementation Steps:**
1. Create `src/controller/transaction.controller.ts` with POST route
2. Add input validation:
   - Amount between 0.01 and 999,999.99
   - Category in enum (SERVICIOS, BIENES, OTRO)
   - Date not future, within 2 years
   - Description max 500 chars
3. Call transaction service to create + calculate taxes
4. Save to database
5. Return transaction with calculated taxes

**Key Files:**
- `src/controller/transaction.controller.ts`
- `src/service/transaction.service.ts` (create method)

**Testing:**
- Valid transaction created
- Invalid amounts rejected
- Invalid categories rejected
- Validation errors clear

---

### Task 2.3: Implement Real-Time Tax Calculation (IVA + Retention) (8 pts)
**Responsible:** Backend Dev  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ IVA calculation: 17% on all transactions (fixed)
- ✅ Retention calculation by category:
   - SERVICIOS: 3% retention
   - BIENES: 2% retention
   - OTRO: 2% retention (or configurable)
- ✅ Formulas implemented correctly:
   - Gross amount = amount
   - IVA = amount * 0.17
   - Retention = amount * retentionRate
   - Net = amount - IVA - Retention (or Net = amount + IVA - Retention for income?)
- ✅ Results include: iva, ivaRate, retention, retentionRate, total, net
- ✅ Calculated on transaction creation
- ✅ Results cached (Redis)

**Implementation Steps:**
1. Create `src/utils/taxCalculator.ts` with tax logic:
   ```typescript
   interface TaxCalculation {
     iva: number;
     ivaRate: number; // 0.17
     retention: number;
     retentionRate: number;
     total: number; // iva + retention
     net: number; // amount - taxes
   }
   
   function calculateTaxes(amount: number, category: string): TaxCalculation {
     const ivaRate = 0.17;
     const retentionRate = getRetentionRate(category);
     const iva = amount * ivaRate;
     const retention = amount * retentionRate;
     return {
       iva,
       ivaRate,
       retention,
       retentionRate,
       total: iva + retention,
       net: amount - iva - retention
     };
   }
   
   function getRetentionRate(category: string): number {
     switch(category) {
       case 'SERVICIOS': return 0.03;
       case 'BIENES': return 0.02;
       case 'OTRO': return 0.02;
       default: return 0;
     }
   }
   ```

2. Call this function when creating transaction
3. Store taxes in database with transaction
4. Cache results: `tax_calculation:{userId}:{transactionId}` (Redis, 1-day TTL)
5. Return taxes in transaction response

**Key Files:**
- `src/utils/taxCalculator.ts` - Tax logic
- `src/service/transaction.service.ts` - Integration

**Testing:**
- IVA correctly 17%
- Retentions correct by category
- Total = IVA + retention
- Net = amount - total
- Edge cases: $0.01, $999,999.99

---

### Task 2.4: Implement Transaction Listing API with Filters (4 pts)
**Responsible:** Backend Dev  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ GET `/transactions` lists user's transactions
- ✅ Pagination: limit (default 20), offset/cursor
- ✅ Filter by date range: startDate, endDate
- ✅ Filter by category: SERVICIOS, BIENES, OTRO
- ✅ Filter by type: INCOME, EXPENSE
- ✅ Sort by: date (default DESC), amount, category
- ✅ Returns transaction list with taxes
- ✅ Response includes total count, hasMore flag
- ✅ Performance: < 200ms p95 latency

**Implementation Steps:**
1. Create `src/controller/transaction.controller.ts` GET route with query params:
   - limit, offset
   - startDate, endDate (filters)
   - category, type (filters)
   - sortBy, sortOrder
2. Validate params
3. Query database with filters + pagination
4. Use indexes for performance
5. Optional: cache paginated results (Redis)
6. Return paginated list

**Key Files:**
- `src/controller/transaction.controller.ts`
- `src/repository/transaction.repository.ts` - listWithFilters method

**Testing:**
- All filters work independently + combined
- Pagination works correctly
- Performance target < 200ms

---

### Task 2.5: Implement Transaction Update/Delete API (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ PUT `/transactions/{id}` updates transaction
- ✅ Updatable fields: description, receiptUrl, status (PENDING/VERIFIED/REJECTED)
- ✅ Immutable fields: amount, category, date, type (no changes)
- ✅ DELETE `/transactions/{id}` soft-deletes transaction
- ✅ Returns 200 OK with updated transaction
- ✅ Returns 404 if transaction not found
- ✅ User can only modify their own transactions

**Implementation Steps:**
1. Create PUT `/transactions/{id}` endpoint
2. Validate user ownership (userId matches JWT)
3. Allow updates to: description, receiptUrl, status
4. Prevent updates to: amount, category, date, type, taxes
5. Create DELETE `/transactions/{id}` endpoint
6. Soft delete (set deletedAt)
7. Return updated transaction or success response

**Key Files:**
- `src/controller/transaction.controller.ts`
- `src/repository/transaction.repository.ts`

**Testing:**
- Update allowed fields
- Update immutable fields rejected
- Delete soft-deletes
- User ownership enforced

---

### Task 2.6: Implement Receipt Upload to S3 (4 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (0.17 - AWS setup)

**Acceptance Criteria:**
- ✅ POST `/transactions/{id}/receipt` uploads receipt image
- ✅ Accepts image files (JPG, PNG, WebP, max 5MB)
- ✅ Uploads to S3 bucket: `xio-receipts-{env}`
- ✅ Stores presigned URL in transaction.receiptUrl
- ✅ URL valid for 7 days (presigned)
- ✅ Returns presigned URL and transaction
- ✅ File named: `{userId}/{transactionId}/{timestamp}.{ext}`

**Implementation Steps:**
1. Create AWS S3 client in `src/config/aws.ts` (if not done)
2. Create `src/service/receipt.service.ts`:
   - `uploadReceipt(userId, transactionId, file)` - uploads to S3
   - Returns presigned URL
3. Create POST `/transactions/{id}/receipt` endpoint:
   - Validate file type (image only)
   - Validate file size (max 5MB)
   - Call receipt service
   - Update transaction receiptUrl
   - Return transaction
4. Error handling: invalid file, upload failure, S3 error

**Key Files:**
- `src/config/aws.ts` - S3 client
- `src/service/receipt.service.ts` - Upload logic
- `src/controller/transaction.controller.ts` - Receipt endpoint

**Testing:**
- Valid image uploaded
- Presigned URL returned
- URL valid for 7 days
- Invalid file types rejected
- Oversized files rejected

---

### Task 2.7: Implement Category Validation (2 pts)
**Responsible:** Backend Lead  
**Dependencies:** 2.1

**Acceptance Criteria:**
- ✅ Validates category is one of: SERVICIOS, BIENES, OTRO
- ✅ Returns 400 Bad Request for invalid category
- ✅ Used in transaction creation + update
- ✅ Error message: "Invalid category. Must be SERVICIOS, BIENES, or OTRO"

**Implementation Steps:**
1. Create enum or constant in `src/utils/constants.ts`:
   ```typescript
   const TRANSACTION_CATEGORIES = {
     SERVICIOS: { name: 'Services', retentionRate: 0.03 },
     BIENES: { name: 'Goods', retentionRate: 0.02 },
     OTRO: { name: 'Other', retentionRate: 0.02 }
   };
   ```
2. Add validation middleware/util:
   ```typescript
   function validateCategory(category: string): boolean {
     return Object.keys(TRANSACTION_CATEGORIES).includes(category);
   }
   ```
3. Use in transaction creation validator
4. Consistent error message

**Key Files:**
- `src/utils/constants.ts`
- `src/utils/validators.ts`

**Testing:**
- Valid categories accepted
- Invalid categories rejected
- Error message clear

---

### Task 2.8: Cache Frequently Used Data (Redis) (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (0.3)

**Acceptance Criteria:**
- ✅ User's transaction list cached (5-min TTL)
- ✅ User's monthly totals cached (1-hour TTL)
- ✅ Tax calculation results cached (1-day TTL)
- ✅ Cache key pattern: `transactions:{userId}:*`
- ✅ Cache invalidated on transaction create/update/delete
- ✅ Monitor cache hit rate (target > 70%)

**Implementation Steps:**
1. Update `src/service/transaction.service.ts`:
   - On `listTransactions()`: check Redis first `transactions:{userId}:{hash(filters)}`
   - On `getTotals()`: check Redis `totals:{userId}:{month}`
   - On `calculateTaxes()`: check Redis `taxes:{userId}:{transactionId}`
2. On create/update/delete: invalidate related cache keys
3. Use cache service `get()`, `set(key, value, ttl)`, `delete(key)`
4. Monitor cache hit rate

**Key Files:**
- `src/service/transaction.service.ts`
- `src/service/cache.service.ts` (from Sprint 0)

**Testing:**
- Cache hit on repeated queries
- Cache invalidated on create/update
- TTLs respected

---

### Task 2.9: Integration Tests for Transaction Endpoints (3 pts)
**Responsible:** Backend Dev  
**Dependencies:** Sprint 0 (0.9)

**Acceptance Criteria:**
- ✅ End-to-end tests for all transaction endpoints
- ✅ Create transaction → verify taxes calculated
- ✅ List with filters → verify correct results
- ✅ Update transaction → verify immutable fields protected
- ✅ Delete transaction → verify soft delete
- ✅ Receipt upload → verify S3 storage
- ✅ All tests pass in CI/CD
- ✅ Coverage > 80%

**Implementation Steps:**
1. Create `src/__tests__/transaction.integration.test.ts`
2. Setup: Create test user, authenticate
3. Test create transaction:
   - Valid transaction created
   - Taxes calculated correctly
   - Response includes all fields
4. Test list with filters:
   - All filters work
   - Pagination works
   - Sorting works
5. Test update/delete:
   - Updates work
   - Immutable fields protected
   - Soft delete
6. Test receipt upload:
   - Image uploaded
   - Presigned URL returned
7. Run `npm test` and verify coverage

**Key Files:**
- `src/__tests__/transaction.integration.test.ts`

**Testing:**
- Run `npm test -- transaction.integration` and verify all pass
- Coverage > 80%

---

## PHASE 3: ANDROID TRANSACTIONS UI (2.10 - 2.18)

**Summary:** 9 Android tasks creating transaction form screen, CurrencyInputField component, real-time tax display, transaction history with filtering, receipt camera integration, and comprehensive testing. All tasks leverage Jetpack Compose, Retrofit for API integration, and TransactionViewModel for state management.

---

## SUCCESS CRITERIA (End of Sprint 2)

✅ **Users can record transactions** (income/expense)  
✅ **Taxes calculated automatically** (17% IVA + 2-5% retentions)  
✅ **Real-time tax display** on mobile  
✅ **Receipt images captured & stored** in S3  
✅ **Transaction history** with filtering/sorting  
✅ **67 story points completed** on time  
✅ **End-to-end tested** (mobile-to-backend)  
✅ **Performance targets met** (< 200ms API, cache > 70% hit rate)  

---

**Plan Created:** 2026-09-12  
**Lead Architect:** Claude Haiku 4.5  
**Status:** Ready for team review & approval
