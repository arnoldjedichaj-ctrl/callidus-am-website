#!/usr/bin/env python3
"""
Fal.ai KI-Funktionen – geteilt von instagram_bot_v2.py und main_v2.py

Neu in v2:
  generate_ai_image_flux()  – Fal.ai FLUX.1 [dev] (~$0.025/Bild, 4× besser als Pollinations)
  generate_ai_video_wan()   – Fal.ai WAN v2.1 Text-to-Video (~$0.08/5-Sek-Clip)

Voraussetzungen:
  pip3.9 install requests
  FAL_API_KEY in Konfiguration gesetzt
"""
import os, requests, logging, time, base64, mimetypes

log = logging.getLogger(__name__)

# ─── FAL.AI KEY ────────────────────────────────────────────────────
FAL_API_KEY = "2a668e17-e2d5-4623-a78b-b88e10cb9186:b9930c36a3037688090788fea7ae845a"


def generate_ai_image_flux(prompt, output_path, width=1080, height=1920):
    """
    Generiert KI-Bild via Fal.ai FLUX.1 [dev] (hohe Qualitaet).
    Kosten: ~$0.025 pro Bild.
    Bevorzugt als primäre KI-Bildquelle vor Pollinations.ai.
    """
    if not FAL_API_KEY:
        return None
    try:
        headers = {
            "Authorization": f"Key {FAL_API_KEY}",
            "Content-Type":  "application/json"
        }
        # WICHTIG: FLUX/dev akzeptiert max ~1440px. Bei 1920 wird das Bild VERZERRT.
        # Loesung: aspect-korrektes Preset nutzen (FLUX erzeugt sauberes Seitenverhaeltnis),
        # die exakte Zielgroesse macht danach der scale+crop-Schritt im Bot (ohne Verzerrung).
        if width > height:
            image_size = "landscape_16_9"
        elif height > width:
            image_size = "portrait_16_9"
        else:
            image_size = "square_hd"
        payload = {
            "prompt":         prompt,
            "image_size":     image_size,
            "num_images":     1,
            "enable_safety_checker": True,
            "guidance_scale": 3.5,
            "num_inference_steps": 28
        }
        r = requests.post(
            "https://fal.run/fal-ai/flux/dev",
            json=payload,
            headers=headers,
            timeout=(15, 120)
        )
        if not r.ok:
            log.warning(f"FLUX HTTP {r.status_code}: {r.text[:200]}")
            return None

        data    = r.json()
        img_url = data.get("images", [{}])[0].get("url", "")
        if not img_url:
            log.warning(f"FLUX: kein Bild-URL in Antwort: {data}")
            return None

        img_r = requests.get(img_url, timeout=60)
        if img_r.status_code == 200 and len(img_r.content) > 5000:
            with open(output_path, "wb") as f:
                f.write(img_r.content)
            log.info(f"FLUX Bild OK: {prompt[:50]}")
            return output_path
        else:
            log.warning(f"FLUX Bild Download fehlgeschlagen: {img_r.status_code}")

    except requests.exceptions.Timeout:
        log.warning("FLUX Timeout nach 120s")
    except Exception as e:
        log.warning(f"FLUX Fehler: {e}")
    return None


def generate_ai_video_wan(prompt, output_path, aspect_ratio="9:16"):
    """
    Generiert KI-Video via Fal.ai WAN v2.1 (Text-to-Video).
    Kosten: ~$0.08 pro 5-Sekunden-Clip.
    Generierungszeit: 2-5 Minuten (Queue-basiert).

    aspect_ratio: "9:16" fuer Portrait (Instagram/Shorts), "16:9" fuer Landscape (YouTube)
    """
    if not FAL_API_KEY:
        return None
    try:
        headers = {
            "Authorization": f"Key {FAL_API_KEY}",
            "Content-Type":  "application/json"
        }
        payload = {
            "prompt":       prompt,
            "aspect_ratio": aspect_ratio,
        }

        # ── Schritt 1: Job einreichen (Queue) ────────────────────────
        r = requests.post(
            "https://queue.fal.run/fal-ai/wan/v2.1/1.3b/text-to-video",
            json=payload,
            headers=headers,
            timeout=(15, 30)
        )
        if not r.ok:
            log.warning(f"WAN Submit HTTP {r.status_code}: {r.text[:200]}")
            return None

        queue_data = r.json()
        request_id = queue_data.get("request_id")
        if not request_id:
            log.warning(f"WAN: kein request_id: {queue_data}")
            return None

        log.info(f"WAN Job eingereicht: {request_id}")

        # ── Schritt 2: Status pollen (max 10 Minuten = 60 × 10s) ─────
        # WICHTIG: Die von Fal zurueckgegebenen URLs verwenden, NICHT manuell bauen
        # (manueller Aufbau scheitert bei verschachtelten Modellpfaden -> stilles Timeout)
        status_url   = queue_data.get("status_url") or (
            f"https://queue.fal.run/fal-ai/wan/requests/{request_id}/status")
        # Ergebnis-URL IMMER aus der (funktionierenden) Status-URL ableiten:
        # die von Fal gelieferte response_url zeigt teils auf einen 404-Pfad.
        response_url = status_url.rsplit("/status", 1)[0] if status_url.endswith("/status") else (
            queue_data.get("response_url") or f"https://queue.fal.run/fal-ai/wan/requests/{request_id}")
        completed = False
        for attempt in range(60):
            time.sleep(10)
            try:
                s_r = requests.get(
                    status_url,
                    headers={"Authorization": f"Key {FAL_API_KEY}"},
                    timeout=30
                )
            except Exception as _se:
                log.warning(f"WAN Status-Abfrage Fehler ({attempt+1}/60): {_se}")
                continue
            if not s_r.ok:
                log.warning(f"WAN Status HTTP {s_r.status_code} ({attempt+1}/60): {s_r.text[:150]}")
                continue
            status = s_r.json().get("status", "")
            log.info(f"WAN Status ({attempt+1}/60): {status}")
            if status == "COMPLETED":
                completed = True
                break
            if status in ("FAILED", "CANCELLED", "ERROR"):
                log.warning(f"WAN fehlgeschlagen: {s_r.json()}")
                return None
        if not completed:
            log.warning("WAN Timeout nach 10 Minuten")
            return None

        # ── Schritt 3: Ergebnis abrufen ───────────────────────────────
        res_r = requests.get(
            response_url,
            headers={"Authorization": f"Key {FAL_API_KEY}"},
            timeout=30
        )
        if not res_r.ok:
            log.warning(f"WAN Ergebnis HTTP {res_r.status_code}: {res_r.text[:150]}")
            return None

        video_url = _extract_video_url(res_r.json())
        if not video_url:
            log.warning(f"WAN: kein Video-URL: {str(res_r.json())[:200]}")
            return None

        # ── Schritt 4: Video herunterladen ────────────────────────────
        v_r = requests.get(video_url, timeout=120)
        if v_r.status_code == 200 and len(v_r.content) > 10000:
            with open(output_path, "wb") as f:
                f.write(v_r.content)
            log.info(f"WAN Video OK: {os.path.basename(output_path)}")
            return output_path
        else:
            log.warning(f"WAN Video Download fehlgeschlagen: {v_r.status_code}")

    except requests.exceptions.Timeout:
        log.warning("WAN Timeout")
    except Exception as e:
        log.warning(f"WAN Fehler: {e}")
    return None


def generate_ai_video_seedance(prompt, output_path, aspect_ratio="9:16", duration=5):
    """
    Generiert High-Quality-Video via ByteDance Seedance 1.5 Pro (Text-to-Video, fal.ai).
    Commercial-Qualitaet, 720p. Kosten: ~$0.26 pro 5-Sekunden-Clip.
    """
    if not FAL_API_KEY:
        return None
    try:
        headers = {
            "Authorization": f"Key {FAL_API_KEY}",
            "Content-Type":  "application/json"
        }
        payload = {
            "prompt":       prompt,
            "aspect_ratio": aspect_ratio,
            "resolution":   "720p",
            "duration":     str(duration),
        }

        r = requests.post(
            "https://queue.fal.run/fal-ai/bytedance/seedance/v1.5/pro/text-to-video",
            json=payload,
            headers=headers,
            timeout=(15, 30)
        )
        if not r.ok:
            log.warning(f"Seedance Submit HTTP {r.status_code}: {r.text[:200]}")
            return None

        queue_data = r.json()
        request_id = queue_data.get("request_id")
        if not request_id:
            log.warning(f"Seedance: kein request_id: {queue_data}")
            return None
        log.info(f"Seedance Job eingereicht: {request_id}")

        # Von Fal gelieferte Status-URL nutzen; Ergebnis-URL daraus ableiten (/status entfernen)
        status_url   = queue_data.get("status_url") or (
            f"https://queue.fal.run/fal-ai/bytedance/requests/{request_id}/status")
        response_url = status_url.rsplit("/status", 1)[0] if status_url.endswith("/status") else (
            queue_data.get("response_url") or
            f"https://queue.fal.run/fal-ai/bytedance/requests/{request_id}")

        completed = False
        for attempt in range(60):   # max 10 Minuten
            time.sleep(10)
            try:
                s_r = requests.get(status_url,
                                   headers={"Authorization": f"Key {FAL_API_KEY}"},
                                   timeout=30)
            except Exception as _se:
                log.warning(f"Seedance Status-Abfrage Fehler ({attempt+1}/60): {_se}")
                continue
            if not s_r.ok:
                log.warning(f"Seedance Status HTTP {s_r.status_code} ({attempt+1}/60): {s_r.text[:150]}")
                continue
            status = s_r.json().get("status", "")
            log.info(f"Seedance Status ({attempt+1}/60): {status}")
            if status == "COMPLETED":
                completed = True
                break
            if status in ("FAILED", "CANCELLED", "ERROR"):
                log.warning(f"Seedance fehlgeschlagen: {s_r.json()}")
                return None
        if not completed:
            log.warning("Seedance Timeout nach 10 Minuten")
            return None

        res_r = requests.get(response_url,
                             headers={"Authorization": f"Key {FAL_API_KEY}"},
                             timeout=30)
        if not res_r.ok:
            log.warning(f"Seedance Ergebnis HTTP {res_r.status_code}: {res_r.text[:150]}")
            return None

        video_url = _extract_video_url(res_r.json())
        if not video_url:
            log.warning(f"Seedance: kein Video-URL: {str(res_r.json())[:200]}")
            return None

        v_r = requests.get(video_url, timeout=180)
        if v_r.status_code == 200 and len(v_r.content) > 10000:
            with open(output_path, "wb") as f:
                f.write(v_r.content)
            log.info(f"Seedance Video OK: {os.path.basename(output_path)}")
            return output_path
        log.warning(f"Seedance Video Download fehlgeschlagen: {v_r.status_code}")

    except requests.exceptions.Timeout:
        log.warning("Seedance Timeout")
    except Exception as e:
        log.warning(f"Seedance Fehler: {e}")
    return None


def _upload_image_to_catbox(image_path):
    with open(image_path, "rb") as f:
        r = requests.post(
            "https://catbox.moe/user/api.php",
            data={"reqtype": "fileupload"},
            files={"fileToUpload": ("image.jpg", f, "image/jpeg")},
            timeout=60
        )
    image_url = r.text.strip()
    return image_url if image_url.startswith("https://") else ""


def _extract_video_url(data):
    """Holt die Video-URL aus verschiedenen Fal-Antwortstrukturen."""
    if not isinstance(data, dict):
        return ""
    v = data.get("video")
    if isinstance(v, dict) and v.get("url"):
        return v["url"]
    if isinstance(v, str) and v.startswith("http"):
        return v
    if data.get("video_url"):
        return data["video_url"]
    vids = data.get("videos")
    if isinstance(vids, list) and vids and isinstance(vids[0], dict) and vids[0].get("url"):
        return vids[0]["url"]
    out = data.get("output")
    if isinstance(out, dict):
        return _extract_video_url(out)
    return ""


def _image_to_data_uri(image_path):
    """Wandelt ein lokales Bild in eine Base64-Data-URI um.
    Fal kann diese direkt dekodieren -> kein externer Host (catbox) noetig,
    der von Fal evtl. nicht erreichbar ist (Ursache fuer HTTP 422)."""
    mime = mimetypes.guess_type(image_path)[0] or "image/jpeg"
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def generate_ai_video_kling_i2v(image_path, prompt, output_path, aspect_ratio="9:16", duration="5"):
    """
    Generiert ein professionelleres Image-to-Video via Kling 2.1 Pro.
    Nutzt ein Szenen-Keyframe als Startbild plus Prompt fuer Bewegung/Kamera.
    """
    if not FAL_API_KEY:
        return None
    try:
        # Bild als Base64-Data-URI einbetten (catbox war fuer Fal nicht erreichbar -> 422)
        try:
            image_url = _image_to_data_uri(image_path)
        except Exception as _ie:
            log.warning(f"Kling I2V: Data-URI fehlgeschlagen ({_ie}), versuche catbox")
            image_url = _upload_image_to_catbox(image_path)
        if not image_url:
            log.warning("Kling I2V: Bild-Vorbereitung fehlgeschlagen")
            return None

        endpoint = "fal-ai/kling-video/v2.1/pro/image-to-video"
        headers = {
            "Authorization": f"Key {FAL_API_KEY}",
            "Content-Type":  "application/json"
        }
        payload = {
            "image_url": image_url,
            "prompt": prompt,
            "duration": str(duration),
            "aspect_ratio": aspect_ratio,
            "negative_prompt": "blur, distort, low quality, deformed face, warped body, squeezed body, stretched face, text, watermark",
            "cfg_scale": 0.5,
        }

        r = requests.post(
            f"https://queue.fal.run/{endpoint}",
            json=payload,
            headers=headers,
            timeout=(15, 30)
        )
        if not r.ok:
            log.warning(f"Kling I2V Submit HTTP {r.status_code}: {r.text[:200]}")
            return None

        queue_data = r.json()
        request_id = queue_data.get("request_id")
        if not request_id:
            log.warning(f"Kling I2V: keine request_id: {queue_data}")
            return None

        # Von Fal zurueckgegebene Status-URL verwenden; Ergebnis-URL daraus ableiten (/status entfernen)
        status_url   = queue_data.get("status_url") or f"https://queue.fal.run/{endpoint}/requests/{request_id}/status"
        response_url = status_url.rsplit("/status", 1)[0] if status_url.endswith("/status") else (
            queue_data.get("response_url") or f"https://queue.fal.run/{endpoint}/requests/{request_id}")
        completed = False
        for attempt in range(72):
            time.sleep(10)
            try:
                s_r = requests.get(status_url, headers={"Authorization": f"Key {FAL_API_KEY}"}, timeout=30)
            except Exception as _se:
                log.warning(f"Kling I2V Status-Abfrage Fehler ({attempt+1}/72): {_se}")
                continue
            if not s_r.ok:
                log.warning(f"Kling I2V Status HTTP {s_r.status_code} ({attempt+1}/72): {s_r.text[:150]}")
                continue
            status = s_r.json().get("status", "")
            log.info(f"Kling I2V Status ({attempt+1}/72): {status}")
            if status == "COMPLETED":
                completed = True
                break
            if status in ("FAILED", "CANCELLED", "ERROR"):
                log.warning(f"Kling I2V fehlgeschlagen: {s_r.json()}")
                return None
        if not completed:
            log.warning("Kling I2V Timeout nach 12 Minuten")
            return None

        res_r = requests.get(response_url, headers={"Authorization": f"Key {FAL_API_KEY}"}, timeout=30)
        if not res_r.ok:
            log.warning(f"Kling I2V Ergebnis HTTP {res_r.status_code}: {res_r.text[:200]}")
            return None

        video_url = _extract_video_url(res_r.json())
        if not video_url:
            log.warning(f"Kling I2V: kein Video-URL: {str(res_r.json())[:200]}")
            return None

        v_r = requests.get(video_url, timeout=180)
        if v_r.status_code == 200 and len(v_r.content) > 10000:
            with open(output_path, "wb") as f:
                f.write(v_r.content)
            log.info(f"Kling I2V Video OK: {os.path.basename(output_path)}")
            return output_path
        log.warning(f"Kling I2V Download fehlgeschlagen: {v_r.status_code}")

    except requests.exceptions.Timeout:
        log.warning("Kling I2V Timeout")
    except Exception as e:
        log.warning(f"Kling I2V Fehler: {e}")
    return None
