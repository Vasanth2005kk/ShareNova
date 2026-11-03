"""Development entry point: `python main.py`.

For production run the WSGI app with a single worker process (session tokens and
rate-limit counters are kept in memory), e.g.:
    gunicorn -w 1 --threads 8 -b 0.0.0.0:8000 "app:create_app()"
"""

import os

from app import create_app
from app.config import Config
from terminaUi import show_server_status

if __name__ == "__main__":
    debug = Config.ENV != "production"
    # With the debug reloader, this module runs in a watcher process and a child
    # process; only the child (WERKZEUG_RUN_MAIN=true) serves requests, so only it
    # should start the cleanup worker.
    is_serving_process = not debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"

    app = create_app(start_background_jobs=is_serving_process)
    if is_serving_process:
        show_server_status(app.config["APPNAME"])

    # Auto-reload in development, but never expose the interactive Werkzeug debugger.
    app.run(host=Config.HOST, port=Config.PORT, debug=debug, use_debugger=False, threaded=True)
