// api/index.js
const path = require("path");

// ⚠️ Troque o arquivo abaixo conforme existir no seu dist:
// Geralmente é: dist/<app>/server/server.mjs  OU  dist/<app>/server/main.mjs
const serverEntry = path.join(process.cwd(), "dist/web-angular/server/server.mjs");

module.exports = async (req, res) => {
  const mod = await import(serverEntry);
  // Em muitos builds de Angular SSR modernos, o bundle exporta `app` (handler/express)
  // Se no seu export for diferente, ajuste aqui.
  const handler = mod.app || mod.default || mod;

  return handler(req, res);
};