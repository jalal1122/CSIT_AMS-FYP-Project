async function loadApp() {
    const { default: app } = await import('./server.js');
}
loadApp();
