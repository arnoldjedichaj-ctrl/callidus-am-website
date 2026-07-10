from __future__ import annotations

import http.server
import socketserver
import sys
from pathlib import Path


class ConsentAwareHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self) -> None:
        if self.path.startswith("/set-consent"):
            html = """<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>Consent gesetzt</title></head>
<body>
<script>
localStorage.setItem("callidus-cookie-consent", "necessary");
document.body.textContent = "OK";
</script>
</body>
</html>"""
            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: site_screenshot_server.py <directory> <port>")

    directory = str(Path(sys.argv[1]).resolve())
    port = int(sys.argv[2])

    handler = lambda *args, **kwargs: ConsentAwareHandler(
        *args,
        directory=directory,
        **kwargs,
    )

    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
