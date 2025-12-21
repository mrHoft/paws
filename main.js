import { app, BrowserWindow } from 'electron/main'

const INNER = { width: 1280, height: 720 }

const createWindow = () => {
  const win = new BrowserWindow({
    width: INNER.width,
    height: INNER.height,
    autoHideMenuBar: true,
    center: true,
    show: false
  })

  win.once('ready-to-show', () => {
    const bounds = win.getBounds()
    const [contentWidth, contentHeight] = win.getContentSize()
    const diff = {
      width: bounds.width - contentWidth,
      height: bounds.height - contentHeight
    }

    win.setBounds({
      width: INNER.width + diff.width,
      height: INNER.height + diff.height
    })

    win.show()
  })

  win.loadFile('dist/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
