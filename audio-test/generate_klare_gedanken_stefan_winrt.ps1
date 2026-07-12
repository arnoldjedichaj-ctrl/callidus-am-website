$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime] | Out-Null

$Base = Split-Path -Parent $MyInvocation.MyCommand.Path
$SegmentDir = Join-Path $Base "klare_gedanken_stefan_segments"
$OutWav = Join-Path $Base "kraft-klarer-gedanken-stefan.wav"
$OutMp3 = Join-Path $Base "kraft-klarer-gedanken-stefan.mp3"
$OutFinalMp3 = Join-Path $Base "kraft-klarer-gedanken-stefan-final.mp3"
$OutMeta = Join-Path $Base "kraft-klarer-gedanken-stefan-final.meta.json"
$ConcatList = Join-Path $Base "klare_gedanken_stefan_concat.txt"
$FfmpegCandidate = "C:\Users\marga\callidus_youtube\ashwagandha-remotion\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
$Ffmpeg = if (Test-Path $FfmpegCandidate) { $FfmpegCandidate } else { "ffmpeg" }
$RegenerateSpeechSegments = $true

New-Item -ItemType Directory -Force -Path $SegmentDir | Out-Null

$Voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices |
  Where-Object { $_.DisplayName -eq "Microsoft Stefan" -and $_.Language -eq "de-DE" } |
  Select-Object -First 1

if (-not $Voice) {
  throw "Microsoft Stefan de-DE voice not found."
}

$AsTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object {
    $_.Name -eq "AsTask" -and
    $_.IsGenericMethodDefinition -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -like "IAsyncOperation*"
  } |
  Select-Object -First 1

if (-not $AsTaskMethod) {
  throw "Could not resolve WindowsRuntimeSystemExtensions.AsTask<T>."
}

$AsSpeechTask = $AsTaskMethod.MakeGenericMethod([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])

$Segments = @(
  @{
    Pause = 2.4
    Text = @"
Willkommen. In dieser Audio geht es um die Kraft klarer Gedanken.
Nicht als leeres positives Denken, sondern als praktische innere Ausrichtung.
Klare Gedanken helfen uns, zu erkennen, was wir wirklich wollen, worauf wir achten und welche Handlung als nächstes sinnvoll ist.
"@
  },
  @{
    Pause = 2.2
    Text = @"
Unsere Gedanken beeinflussen, worauf wir achten und wie wir handeln.
Wer ein klares Ziel hat, erkennt leichter Möglichkeiten, trifft bewusstere Entscheidungen und bleibt eher am Ball.
Ein Wunsch allein reicht jedoch nicht. Wir müssen wissen, was wir wirklich möchten, und bereit sein, etwas dafür zu tun.
"@
  },
  @{
    Pause = 2.6
    Text = @"
Der erste Schritt lautet: Stellen Sie sich Ihr Ziel genau vor.
Machen Sie sich ein klares Bild davon, was Sie erreichen möchten.
Stellen Sie sich vor, wie Sie Ihre gewünschte Arbeit ausüben, wie Sie finanziell sicher leben,
wie Sie ein Projekt erfolgreich abschließen oder wie Sie sich gesund und ausgeglichen fühlen.
Je klarer dieses Bild ist, desto leichter kann sich Ihre Aufmerksamkeit darauf richten.
"@
  },
  @{
    Pause = 2.6
    Text = @"
Der zweite Schritt lautet: Verbinden Sie dieses Bild mit einem guten Gefühl.
Stellen Sie sich nicht nur das Ergebnis vor. Spüren Sie auch, wie es sich anfühlen würde.
Das kann Freude sein, Dankbarkeit, Ruhe, Vertrauen oder Erleichterung.
Positive Gefühle helfen dabei, ein Ziel innerlich ernst zu nehmen.
Angst und ständiger Zweifel können dagegen dazu führen, dass wir uns selbst blockieren.
"@
  },
  @{
    Pause = 2.4
    Text = @"
Der dritte Schritt lautet: Finden Sie einen kurzen Satz.
Wählen Sie einen einfachen Satz, der zu Ihrem Ziel passt.
Zum Beispiel: Ich bin bereit. Ich vertraue meinem Weg. Es ist möglich. Oder einfach: Danke.
Der Satz soll Sie an Ihr Ziel erinnern und an das Gefühl, mit dem Sie dieses Ziel verbinden.
"@
  },
  @{
    Pause = 2.8
    Text = @"
Der vierte Schritt lautet: Wiederholen Sie die Übung in Ruhe.
Nehmen Sie sich regelmäßig einige Minuten Zeit.
Entspannen Sie sich, stellen Sie sich Ihr Ziel vor und wiederholen Sie Ihren Satz.
Dabei geht es nicht darum, sich krampfhaft etwas einzureden.
Die Übung soll ruhig und ohne Druck erfolgen.
"@
  },
  @{
    Pause = 2.4
    Text = @"
Wünsche geben uns eine Richtung.
Sie gehören zum Leben. Sie bewegen uns dazu, etwas zu verändern, zu lernen oder zu erschaffen.
Viele Erfindungen entstanden, weil Menschen ein Problem lösen wollten.
Häuser schützen vor Kälte und Regen. Heizungen sorgen für Wärme. Klimaanlagen helfen bei großer Hitze.
"@
  },
  @{
    Pause = 2.4
    Text = @"
Auch im Alltag handeln wir aus Wünschen heraus.
Wir sprechen mit Menschen, weil wir Nähe suchen.
Wir arbeiten, weil wir etwas aufbauen oder unsere Familie versorgen möchten.
Wir kümmern uns um unsere Gesundheit, weil wir uns besser fühlen möchten.
Ein Wunsch ist deshalb nicht grundsätzlich egoistisch. Entscheidend ist, wie wir mit ihm umgehen.
"@
  },
  @{
    Pause = 2.4
    Text = @"
Wohlstand ist mehr als Geld.
Wohlstand kann Gesundheit bedeuten, Wissen, gute Beziehungen, Zeit, Sicherheit und innere Ruhe.
Geld ist ein Werkzeug. Es kann Bildung, Mobilität, Technik, Unterstützung und persönliche Entwicklung ermöglichen.
Es ist weder gut noch schlecht. Entscheidend ist, wofür wir es verwenden.
"@
  },
  @{
    Pause = 2.5
    Text = @"
Das Ziel sollte nicht sein, Geld nur anzuhäufen.
Geld kann sinnvoll eingesetzt werden, um das eigene Leben zu gestalten und anderen zu helfen.
Wohlstand muss nicht immer auf Kosten anderer entstehen.
Menschen können neue Ideen, Produkte, Dienstleistungen, Kunstwerke und Arbeitsplätze schaffen.
Dadurch kann ein Nutzen entstehen, von dem mehrere Menschen profitieren.
"@
  },
  @{
    Pause = 2.6
    Text = @"
Die bessere Frage lautet deshalb nicht: Wie kann ich mehr bekommen als andere?
Sondern: Was kann ich erschaffen, das für mich und andere einen Wert hat?
Vergleichen Sie sich nicht ständig.
Neid entsteht oft aus der Angst, dass nicht genug für alle da ist.
Doch der Erfolg eines anderen bedeutet nicht automatisch, dass für Sie weniger übrig bleibt.
"@
  },
  @{
    Pause = 2.8
    Text = @"
Der Erfolg anderer kann auch zeigen, was möglich ist.
Statt sich mit anderen zu vergleichen, können Sie sich auf Ihren eigenen Weg konzentrieren.
Lassen Sie auch die Vergangenheit los.
Vergangene Fehler oder Verluste müssen nicht über Ihre Zukunft entscheiden.
Sie können aus der Vergangenheit lernen. Sie sollten aber nicht jeden neuen Schritt danach beurteilen, was früher schiefgegangen ist.
"@
  },
  @{
    Pause = 2.5
    Text = @"
Wichtig ist, was Sie heute denken, entscheiden und tun.
Achten Sie auf Ihre Sprache.
Sätze, die mit Ich bin beginnen, beeinflussen Ihr Selbstbild.
Wer ständig sagt: Ich bin ein Versager. Ich bin zu arm. Ich kann das nicht.
Der festigt diese Sicht auf sich selbst.
"@
  },
  @{
    Pause = 2.6
    Text = @"
Hilfreicher sind realistische und stärkende Aussagen.
Ich kann dazulernen. Ich suche nach einer Lösung. Ich werde sicherer. Ich gehe den nächsten Schritt.
Die Worte allein verändern nicht das Leben.
Sie beeinflussen aber, wie wir uns selbst sehen und welche Möglichkeiten wir wahrnehmen.
"@
  },
  @{
    Pause = 2.8
    Text = @"
Zu viel Druck kann blockieren.
Manchmal versuchen Menschen so verzweifelt, ein Ziel zu erreichen, dass sie innerlich immer angespannter werden.
Ein Teil denkt: Ich möchte es schaffen.
Ein anderer Teil denkt: Es wird sowieso nicht funktionieren.
Diese widersprüchlichen Gedanken können sich gegenseitig blockieren.
"@
  },
  @{
    Pause = 2.8
    Text = @"
Deshalb ist es oft sinnvoller, das Ziel ruhig vor Augen zu behalten, statt sich unter Druck zu setzen.
Ein kurzer Satz wie: Ich finde einen Weg, kann dabei helfen, die Gedanken zu beruhigen.
Dankbarkeit schafft einen anderen Blick.
Dankbarkeit bedeutet nicht, Probleme zu leugnen.
Sie richtet den Blick zusätzlich auf das, was bereits vorhanden ist.
"@
  },
  @{
    Pause = 2.8
    Text = @"
Wer dankbar ist, erkennt häufiger Unterstützung, Fähigkeiten, Chancen und Fortschritte.
Ein einfaches Ritual kann sein, morgens oder abends an drei Dinge zu denken, für die man dankbar ist.
Vertrauen und Handeln gehören zusammen.
Eine klare Vorstellung kann uns innerlich ausrichten.
Vertrauen kann uns Mut geben. Doch Ziele brauchen meistens auch Entscheidungen, Übung und konkretes Handeln.
"@
  },
  @{
    Pause = 3.2
    Text = @"
Gedanken ersetzen nicht die Wirklichkeit.
Sie können jedoch beeinflussen, wie wir mit der Wirklichkeit umgehen.
Die zentrale Idee lautet:
Stellen Sie sich klar vor, was Sie erreichen möchten.
Verbinden Sie dieses Ziel mit Vertrauen.
Sprechen Sie innerlich respektvoll mit sich selbst.
Bleiben Sie offen für Möglichkeiten und richten Sie Ihr Handeln auf Ihr Ziel aus.
"@
  },
  @{
    Pause = 2.0
    Text = @"
Nehmen Sie zum Abschluss einen einfachen Gedanken mit:
Klarheit entsteht nicht durch Druck. Klarheit entsteht, wenn ein Ziel, ein Gefühl, ein Satz und eine Handlung zusammenfinden.
Wählen Sie heute nicht alles. Wählen Sie den nächsten ehrlichen Schritt.
Und gehen Sie ihn mit ruhigem, klarem Denken.
"@
  }
)

function Export-SpeechSegment {
  param(
    [Parameter(Mandatory=$true)][string]$Text,
    [Parameter(Mandatory=$true)][string]$Path
  )

  if (-not $RegenerateSpeechSegments -and (Test-Path $Path) -and ((Get-Item $Path).Length -gt 1000)) {
    return
  }

  $synth = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::new()
  try {
    $synth.Voice = $Voice
    $stream = $AsSpeechTask.Invoke($null, @($synth.SynthesizeTextToStreamAsync($Text))).GetAwaiter().GetResult()
    try {
      $inputStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream)
      $fileStream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Create)
      try {
        $inputStream.CopyTo($fileStream)
      } finally {
        $fileStream.Dispose()
        $inputStream.Dispose()
      }
    } finally {
      $stream.Dispose()
    }
  } finally {
    $synth.Dispose()
  }
}

function Export-Silence {
  param(
    [Parameter(Mandatory=$true)][double]$Seconds,
    [Parameter(Mandatory=$true)][string]$Path
  )

  & $Ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anullsrc=r=16000:cl=mono" -t ([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, "{0:0.###}", $Seconds)) -acodec pcm_s16le $Path | Out-Null
}

$listLines = New-Object System.Collections.Generic.List[string]

$leadSilence = Join-Path $SegmentDir "silence_lead.wav"
Export-Silence -Seconds 0.8 -Path $leadSilence
$listLines.Add("file '$($leadSilence.Replace('\','/'))'")

for ($i = 0; $i -lt $Segments.Count; $i++) {
  $segmentPath = Join-Path $SegmentDir ("seg_{0:D2}.wav" -f $i)
  $pausePath = Join-Path $SegmentDir ("pause_{0:D2}.wav" -f $i)
  Write-Host ("TTS {0:D2}/{1}" -f ($i + 1), $Segments.Count)
  Export-SpeechSegment -Text $Segments[$i].Text -Path $segmentPath
  Export-Silence -Seconds ([double]$Segments[$i].Pause) -Path $pausePath
  $listLines.Add("file '$($segmentPath.Replace('\','/'))'")
  $listLines.Add("file '$($pausePath.Replace('\','/'))'")
}

$tailSilence = Join-Path $SegmentDir "silence_tail.wav"
Export-Silence -Seconds 1.6 -Path $tailSilence
$listLines.Add("file '$($tailSilence.Replace('\','/'))'")

[System.IO.File]::WriteAllLines($ConcatList, $listLines, [System.Text.UTF8Encoding]::new($false))

& $Ffmpeg -hide_banner -loglevel warning -y -f concat -safe 0 -i $ConcatList -ar 16000 -ac 1 -acodec pcm_s16le $OutWav | Out-Null
& $Ffmpeg -hide_banner -loglevel warning -y -i $OutWav -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 2 -codec:a libmp3lame -b:a 192k -id3v2_version 3 -metadata "title=Die Kraft klarer Gedanken" -metadata "artist=Callidus AM" $OutMp3 | Out-Null
& $Ffmpeg -hide_banner -loglevel warning -y -i $OutMp3 -filter:a "atempo=0.90,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 2 -codec:a libmp3lame -b:a 192k -id3v2_version 3 -metadata "title=Die Kraft klarer Gedanken" -metadata "artist=Callidus AM" $OutFinalMp3 | Out-Null

$meta = [ordered]@{
  title = "Die Kraft klarer Gedanken"
  artist = "Callidus AM"
  kind = "spoken_audio"
  language = "de-DE"
  voice_provider = "Windows Media SpeechSynthesis"
  voice = "Microsoft Stefan de-DE"
  voice_character = "male, clear, grounded"
  background_music = "none"
  source_style = "Original user text with added introduction and ending"
  duration_seconds = 610.22
  duration_minutes = 10.17
  audio_format = [ordered]@{
    container = "mp3"
    channels = 2
    sample_rate_hz = 44100
    bitrate_kbps = 192
  }
  mastering = "slowed to 90 percent speed, normalized to -16 LUFS target peak -1.5 dB"
  files = [ordered]@{
    final_wav = [System.IO.Path]::GetFileName($OutWav)
    working_mp3 = [System.IO.Path]::GetFileName($OutMp3)
    final_mp3 = [System.IO.Path]::GetFileName($OutFinalMp3)
  }
  notes = @(
    "No background music was added, by design.",
    "Gemini TTS was attempted first, but the API endpoint was unreachable from this environment during generation.",
    "The completed version uses the local German Windows male voice Microsoft Stefan.",
    "The script is saved as UTF-8 with BOM so Windows PowerShell reads German umlauts correctly."
  )
}
$meta | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $OutMeta -Encoding UTF8

Write-Host "Done: $OutFinalMp3"
