This is my logs on dashboard.render.com
==> Build successful 🎉
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
==> Running 'gunicorn main:app'
[2026-07-29 09:05:36 +0000] [57] [INFO] Starting gunicorn 23.0.0
[2026-07-29 09:05:36 +0000] [57] [INFO] Listening at: http://0.0.0.0:10000 (57)
[2026-07-29 09:05:36 +0000] [57] [INFO] Using worker: sync
[2026-07-29 09:05:36 +0000] [58] [INFO] Booting worker with pid: 58
127.0.0.1 - - [29/Jul/2026:09:05:36 +0000] "HEAD / HTTP/1.1" 404 0 "-" "Go-http-client/1.1"
==> Your service is live 🎉
127.0.0.1 - - [29/Jul/2026:09:05:41 +0000] "GET / HTTP/1.1" 404 207 "-" "Go-http-client/2.0"
==> 
==> ///////////////////////////////////////////////////////////
==> 
==> Available at your primary URL https://e-hatid-backend.onrender.com
==> 
==> ///////////////////////////////////////////////////////////

and on my https://e-hatid.vercel.app/verify-otp is im getting this

Cannot connect to verification service. Make sure the backend is running.
Failed to load resource: net::ERR_CONNECTION_REFUSED  