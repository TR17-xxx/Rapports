# Script PowerShell pour nettoyer les fichiers Vercel obsolètes
# Exécutez ce script UNIQUEMENT si vous êtes sûr de ne plus vouloir revenir à Vercel

Write-Host "🧹 Nettoyage des fichiers Vercel obsolètes..." -ForegroundColor Cyan
Write-Host ""

# Liste des fichiers à supprimer
$filesToDelete = @(
    "vercel.json",
    ".vercelignore",
    "VERCEL_DEPLOYMENT.md",
    "README_VERCEL.md",
    "CHANGELOG_FIX.md"
)

# Liste des dossiers à supprimer
$foldersToDelete = @(
    "api"
)

Write-Host "⚠️  ATTENTION : Cette action est irréversible !" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fichiers qui seront supprimés :" -ForegroundColor Yellow
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Write-Host "  - $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Dossiers qui seront supprimés :" -ForegroundColor Yellow
foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "  - $folder\" -ForegroundColor Red
    }
}

Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host ""
    Write-Host "❌ Nettoyage annulé." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🗑️  Suppression en cours..." -ForegroundColor Cyan

# Supprimer les fichiers
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Supprimé : $file" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Ignoré : $file (n'existe pas)" -ForegroundColor Gray
    }
}

# Supprimer les dossiers
foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Remove-Item $folder -Recurse -Force
        Write-Host "  ✅ Supprimé : $folder\" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Ignoré : $folder\ (n'existe pas)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 N'oubliez pas de commiter les changements :" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m ""Suppression des fichiers Vercel obsolètes""" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""
