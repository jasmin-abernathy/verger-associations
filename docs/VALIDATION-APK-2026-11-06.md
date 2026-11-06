# APK Verger/SimpleX — installation corrigée, 6 novembre 2026

L'APK précédent contenait android:testOnly=true et était refusé par l'installation normale. Correctif : android.injected.testOnly=false et garde-fou sur le manifeste binaire final.

Build corrigé : https://github.com/jasmin-abernathy/simplex-chat/actions/runs/42195669279 — réussite, source 2a572f3eea0da8eaf81dae5fd4f1928f7923e812.

Test d'installation : https://github.com/jasmin-abernathy/simplex-chat/actions/runs/42195878999 — réussite. Android 11 Google APIs x86_64 avec support ARM64 : l'ancien APK est refusé avec INSTALL_FAILED_TEST_ONLY ; le nouveau s'installe via adb install sans -t, et pm path confirme le paquet chat.simplex.app.vergertest. Preuves conservées dans l'artefact verger-installation-proof. Empreinte téléchargée vérifiée ; manifeste final inspecté indépendamment, testOnly absent. Fichier livré remplacé par la version corrigée.

Portée : installation sur émulateur vérifiée, pas de test sur téléphone physique ni validation de l'affichage, du démarrage, des notifications ou des échanges entre deux comptes. Ne pas confondre cette preuve avec une validation complète des fonctions.
