# proyecto-tienda-subastas-1

Proyecto Node.js (Express + Socket.io + Mongoose).

Deployment info for Render:

- `render.yaml` is present and configured to deploy `main` branch.
- Build command: `npm ci`
- Start command: `npm start`
- Node version: 18.x (declared in `package.json` engines)

To deploy on Render:
1. Connect your GitHub repository `sllorennte/proyecto-tienda-subastas-1` to Render (Render Dashboard → New → Web Service).
2. Select branch `main` and allow Render to use `render.yaml` or configure via UI.
3. If Render is already connected, trigger a manual deploy from the Render dashboard or push a commit to `main` to trigger the webhook.

Secrets / env:
- Add production env vars in Render (e.g., `MONGODB_URI`, `JWT_SECRET`). Do NOT commit `.env` to the repo.

If you want, I can trigger a redeploy now by pushing a small commit (already prepared).