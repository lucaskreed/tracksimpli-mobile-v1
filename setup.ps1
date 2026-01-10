Write-Host "Setting up TrackSimpli project structure..."

# Helper: create file if it doesn't exist
function Touch($path) {
    if (!(Test-Path $path)) {
        New-Item -ItemType File -Path $path | Out-Null
    }
}

# Root folders
New-Item -ItemType Directory -Force -Path backend, frontend, scripts | Out-Null

# -------------------------
# Backend structure
# -------------------------
New-Item -ItemType Directory -Force -Path `
backend/app, `
backend/app/routes, `
backend/app/services, `
backend/app/domain, `
backend/app/domain/models, `
backend/app/domain/tests, `
backend/app/domain/scoring, `
backend/app/capture, `
backend/app/storage, `
backend/app/utils | Out-Null

# Backend files
Touch backend/app/main.py
Touch backend/app/config.py

Touch backend/app/routes/web.py
Touch backend/app/routes/api.py
Touch backend/app/routes/coach.py
Touch backend/app/routes/auth.py

Touch backend/app/services/capture_service.py
Touch backend/app/services/scoring_service.py
Touch backend/app/services/report_service.py
Touch backend/app/services/notification_service.py

Touch backend/app/domain/models/attempt.py
Touch backend/app/domain/models/metrics.py
Touch backend/app/domain/models/report.py
Touch backend/app/domain/models/user.py

Touch backend/app/domain/tests/squat.py
Touch backend/app/domain/tests/plank.py
Touch backend/app/domain/tests/pushup.py

Touch backend/app/domain/scoring/base.py
Touch backend/app/domain/scoring/squat_score.py
Touch backend/app/domain/scoring/plank_score.py

Touch backend/app/capture/engine.py
Touch backend/app/capture/pose.py
Touch backend/app/capture/metrics.py
Touch backend/app/capture/utils.py

Touch backend/app/storage/filesystem.py
Touch backend/app/storage/cloud.py

Touch backend/app/utils/ids.py
Touch backend/app/utils/time.py

# -------------------------
# Templates (HTML)
# -------------------------
New-Item -ItemType Directory -Force -Path `
backend/templates, `
backend/templates/public, `
backend/templates/user, `
backend/templates/coach, `
backend/templates/shared | Out-Null

Touch backend/templates/public/landing.html
Touch backend/templates/public/login.html
Touch backend/templates/public/signup.html

Touch backend/templates/user/dashboard.html
Touch backend/templates/user/test.html
Touch backend/templates/user/progress.html
Touch backend/templates/user/report.html

Touch backend/templates/coach/dashboard.html
Touch backend/templates/coach/client.html
Touch backend/templates/coach/reports.html

Touch backend/templates/shared/base.html
Touch backend/templates/shared/nav.html
Touch backend/templates/shared/footer.html

# -------------------------
# Static files
# -------------------------
New-Item -ItemType Directory -Force -Path `
backend/static, `
backend/static/css, `
backend/static/js, `
backend/static/images | Out-Null

Touch backend/static/css/base.css
Touch backend/static/css/dashboard.css
Touch backend/static/css/coach.css

Touch backend/static/js/capture.js
Touch backend/static/js/dashboard.js
Touch backend/static/js/charts.js

# -------------------------
# Data + output
# -------------------------
New-Item -ItemType Directory -Force -Path `
backend/data, `
backend/data/fixtures, `
backend/output, `
backend/output/reports, `
backend/output/runs | Out-Null

Touch backend/data/fixtures/raw_test.json

# -------------------------
# Misc
# -------------------------
Touch backend/requirements.txt
Touch README.md
Touch .gitignore

# -------------------------
# Vercel frontend (static app)
# -------------------------
New-Item -ItemType Directory -Force -Path frontend | Out-Null
Touch frontend/index.html
Touch frontend/vercel.json

# -------------------------
# Scripts
# -------------------------
Touch scripts/seed_data.py
Touch scripts/dev_reset.py

Write-Host "TrackSimpli setup complete."
