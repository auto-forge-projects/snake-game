# snake-game

AutoForge ile üretilen proje (repo-per-project).

- Pipeline durumu: `pipeline-state.json`
- Deploy config: `deploy.json` (enabled:false — opt-in)
- SSH-push deploy: `.github/workflows/deploy-image.yml` + `deploy/remote-deploy.sh`
- CI/Actions: pipeline bitene kadar susturulur (`.githooks/commit-msg` her commit'e `[skip ci]` ekler); Faz 16 kapanışında `.pipeline-complete` işareti oluşunca CI+deploy normal koşar.
