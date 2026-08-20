const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PRODUCT_NAME = 'ASTRAL BLOOM';
const APP_ROOT = path.resolve(__dirname, '..');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function resolveAppFile(requestUrl) {
  const url = new URL(requestUrl);
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const resolved = path.resolve(APP_ROOT, relativePath);
  const safePrefix = `${APP_ROOT}${path.sep}`;
  return resolved === APP_ROOT || resolved.startsWith(safePrefix) ? resolved : null;
}

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    const filePath = resolveAppFile(request.url);
    if (!filePath) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    title: PRODUCT_NAME,
    autoHideMenuBar: true,
    backgroundColor: '#050714',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.loadURL('app://game/index.html');
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) event.preventDefault();
  });

  return window;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerAppProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
