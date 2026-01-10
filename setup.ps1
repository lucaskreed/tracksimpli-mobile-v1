Write-Host "Setting up TrackSimpli frontend structure..."

function Touch($path) {
    if (!(Test-Path $path)) {
        New-Item -ItemType File -Path $path | Out-Null
    }
}

# Root frontend folder
New-Item -ItemType Directory -Force -Path frontend | Out-Null

# Core files
Touch frontend/index.html
Touch frontend/vercel.json

# Assets
New-Item -ItemType Directory -Force -Path `
frontend/assets, `
frontend/assets/images, `
frontend/assets/icons | Out-Null

# CSS
New-Item -ItemType Directory -Force -Path frontend/css | Out-Null
Touch frontend/css/base.css
Touch frontend/css/layout.css
Touch frontend/css/components.css
Touch frontend/css/screens.css

# JS structure
New-Item -ItemType Directory -Force -Path `
frontend/js, `
frontend/js/screens, `
frontend/js/components, `
frontend/js/services, `
frontend/js/utils | Out-Null

Touch frontend/js/app.js
Touch frontend/js/router.js

# Screen logic
Touch frontend/js/screens/test.js
Touch frontend/js/screens/dashboard.js
Touch frontend/js/screens/history.js
Touch frontend/js/screens/login.js
Touch frontend/js/screens/settings.js

# Components
Touch frontend/js/components/navbar.js
Touch frontend/js/components/modal.js
Touch frontend/js/components/toast.js

# Services
Touch frontend/js/services/api.js
Touch frontend/js/services/storage.js
Touch frontend/js/services/share.js

# Utils
Touch frontend/js/utils/time.js
Touch frontend/js/utils/math.js
Touch frontend/js/utils/ids.js

# HTML screen templates
New-Item -ItemType Directory -Force -Path frontend/screens | Out-Null
Touch frontend/screens/test.html
Touch frontend/screens/dashboard.html
Touch frontend/screens/history.html
Touch frontend/screens/login.html
Touch frontend/screens/settings.html

Write-Host "Frontend setup complete."
