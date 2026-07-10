$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\marga\callidus_youtube\ashwagandha-remotion'
$items = @(
  @('Q10EvidenceDeepDive','out\coenzym-q10-normalos-aoede-upload-fast.mp4'),
  @('NMNEvidenceDeepDive','out\nmn-normalos-aoede-upload-fast.mp4'),
  @('MagnesiumEvidenceDeepDive','out\magnesium-normalos-aoede-upload-fast.mp4'),
  @('VitaminD3K2EvidenceDeepDive','out\vitamin-d3-k2-normalos-aoede-upload-fast.mp4'),
  @('Omega3EvidenceDeepDive','out\omega-3-normalos-aoede-upload-fast.mp4')
)
foreach ($i in $items) {
  Write-Output ("## START " + $i[0] + " " + (Get-Date -Format o))
  npx remotion render src/index.ts $i[0] $i[1] --concurrency=8 --scale=0.5
  if ($LASTEXITCODE -ne 0) { throw "Render failed for $($i[0]) with exit code $LASTEXITCODE" }
  Write-Output ("## DONE " + $i[0] + " " + (Get-Date -Format o))
}
