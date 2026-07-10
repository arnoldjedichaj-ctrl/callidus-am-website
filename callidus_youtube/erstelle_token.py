#!/usr/bin/env python3
"""
EINMALIG auf dem PC ausführen - Version 3 (manueller Code-Flow)
Funktioniert mit allen Versionen von google-auth-oauthlib!
"""

from google_auth_oauthlib.flow import Flow
import json, os

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
CLIENT_SECRETS = "client_secrets.json"
REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob"

def main():
    if not os.path.exists(CLIENT_SECRETS):
        print("❌ client_secrets.json nicht gefunden!")
        return

    print("🔑 Starte OAuth Authentifizierung...")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )

    print("\n👉 Öffne diese URL im Browser:\n")
    print(auth_url)
    print("\n Nach dem Login zeigt Google einen Code an.")
    code = input("\n✏️  Code hier einfügen und Enter drücken: ").strip()

    flow.fetch_token(code=code)
    creds = flow.credentials

    with open("token.json", "w") as f:
        f.write(creds.to_json())

    print("\n✅ token.json erfolgreich erstellt!")
    print("   Auf die Synology kopieren nach:")
    print("   /volume1/callidus_youtube/token.json")

if __name__ == "__main__":
    main()
