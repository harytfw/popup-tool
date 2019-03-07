const OSWindowBorderTop = 30
const OSWindowBorderBottom = 10
const OSWindowBorderLeft = OSWindowBorderBottom
const OSWindowBorderRight = OSWindowBorderBottom

const optionalPermissions = new Set()
const tabId2WinIdMapping = new Map()
// const popupTabsPropertyMapping = new Map()

const originalWindowProperty = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    state: 'normal',
    type: 'normal',
}

function onError(error) {
    console.error(error)
}

async function createPopupWindow(options = {
    tab: null,
    height: -1,
    width: -1,
}) {

    // const shouldLogTab = await browser.permissions.contains({
    // 	permissions: ['history', 'tabs']
    // })
    // if (shouldLogTab) {
    // 	popupTabsPropertyMapping.set(options.tab.id, {
    // 		title: options.tab.title,
    // 		url: options.tab.url
    // 	})
    // }

    const originalWin = await browser.windows.get(options.tab.windowId)
    for (const k of Object.keys(originalWindowProperty)) {
        originalWindowProperty[k] = originalWin[k]
    }

    const createOption = {
        type: 'popup',
        state: 'normal',
        tabId: options.tab.id,
        titlePreface: options.tab.title,
        height: Math.round(options.height) /*+ OSWindowBorderTop + OSWindowBorderBottom*/,
        width: Math.round(options.width) /*+ OSWindowBorderLeft + OSWindowBorderRight*/,
    }
    const storage = await browser.storage.local.get()

    if (storage.size === 'auto') {
        createOption.height = Math.round(options.height)
        createOption.width = Math.round(options.width)
    } else if (storage.size === 'last') {
        createOption.height = Math.round(storage.lastHeight)
        createOption.width = Math.round(storage.lastWidth)
    }

    if (storage.position === 'center') {
        createOption.left = Math.round((window.screen.width - createOption.width) / 2)
        createOption.top = Math.round((window.screen.height - createOption.height) / 2)
    } else if (storage.position === 'last') {
        createOption.left = Math.round(storage.lastLeft)
        createOption.top = Math.round(storage.lastTop)
    }

    const win = await browser.windows.create(createOption).catch(onError)
    setTimeout(() => {
        browser.windows.update(win.id, {
            left: createOption.left,
            top: createOption.top
        })
    }, 1000)
    tabId2WinIdMapping.set(options.tab.id, options.tab.windowId)

}

async function destoryPopupWindow(tab) {

    const allWin = await browser.windows.getAll().catch(onError)

    const popupWinId = tab.windowId
    const originalWinId = tabId2WinIdMapping.has(tab.id) ? tabId2WinIdMapping.get(tab.id) : -1
    const originalWin = await browser.windows.get(originalWinId).catch(onError)
    if (allWin.length >= 2 && originalWin) { // 至少有弹窗和原来的窗口
        // 移动标签页到弹窗前的窗口
        await browser.tabs.move(tab.id, {
            windowId: originalWinId,
            index: -1
        }).catch(onError)

    } else if (allWin.length === 1) { // 只剩下弹窗
        // 新建新的窗口，并把标签页移动到这个窗口
        if (['minimized', 'maximized', 'fullscreen'].includes(originalWindowProperty.state)) {
            await browser.windows.create({
                tabId: tab.id,
                state: originalWindowProperty.state
            })
        } else {
            await browser.windows.create(Object.assign({
                tabId: tab.id
            }, originalWindowProperty)).catch(onError)
        }
    } else {
        //  标签页原来的窗口被用户关闭，那么获取已有的窗口，然后移动标签页
        const win = await browser.windows.getLastFocused().catch(onError)
        await browser.tabs.move(tab.id, {
            windowId: win.id,
            index: -1
        }).catch(onError)
    }

    await browser.tabs.update(tab.id, {
        active: true
    })
    // 关闭弹窗
    // await browser.windows.remove(popupWinId).catch(onError)
}

async function updatePopupWindow(options = {
    tabId: -1
}) {

}

// browser.runtime.onMessage.addListener( message => {
// 	createPopupWindow(message)
// })


// browser.menus.create({
// 	contexts: ['video'],
// 	title: 'Popup current video',
// })
// browser.menus.onClicked.addListener((info, tab) => {

// 	console.log(info, tab)
// 	// this.createPopupWindow()
// })


var nativePort = browser.runtime.connectNative(
    "popuptool.helper"
)
try {
    nativePort.postMessage('test message')
    browser.storage.local.set({ supportNative: true })
}
catch (e) {
    browser.storage.local.set({ supportNative: false })
}
browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.command === 'create') {
        await createPopupWindow({
            tab: sender.tab,
            height: message.height,
            width: message.width,
        })
        return {
            info: 'done'
        }
    } else if (message.command === 'destory') {
        await destoryPopupWindow(sender.tab)
        return {
            info: 'done'
        }
    } else if (message.command === 'update') {
        await updatePopupWindow({
            tabId: sender.tab.id,
        })
        return {
            info: 'done'
        }
    } else if (message.command === 'availablePopup') {
        browser.browserAction.setTitle({
            title: browser.i18n.getMessage('browserAction_enable'),
            tabId: sender.tab.id
        })
        browser.browserAction.setIcon({
            path: {
                96: browser.runtime.getURL('p-enable.png')
            },
            tabId: sender.tab.id
        })
    } else if (message.command === 'rememberLocation') {
        const win = await browser.windows.get(sender.tab.windowId)
        browser.storage.local.set({
            lastLeft: win.left,
            lastTop: win.top,
            lastHeight: win.height,
            lastWidth: win.width
        })
    } else if (message.command === 'setOnTop') {
        try {
            nativePort.postMessage('on')
        } catch (e) {
            // console.error(e)
        }
    } else if (message.command === 'unsetOnTop') {
        try {
            nativePort.postMessage('off')
        } catch (e) {
            // console.error(e)
        }
    } else if (message.command === 'changeOpacity') {
        try {
            nativePort.postMessage('opacity:' + message.value)
        } catch (e) {
            console.error(e)
        }
    }
})

browser.browserAction.setTitle({
    title: browser.i18n.getMessage('browserAction_disable'),
})

browser.browserAction.setIcon({
    path: {
        128: browser.runtime.getURL('p-disable.png')
    }
})

browser.tabs.onRemoved.addListener(tabId => {
    tabId2WinIdMapping.delete(tabId)
    // browser.storage.local.get('fixhistory').then(storage => {
    // 	if (storage.fixhistory === true) {
    // 		const obj = popupTabsPropertyMapping.get(tabId)
    // 		if (obj) {
    // 			browser.history.addUrl(obj)
    // 		}
    // 	}

    // 	popupTabsPropertyMapping.delete(tabId)
    // })
})

browser.browserAction.onClicked.addListener(tab => {
    browser.tabs.sendMessage(tab.id, {
        command: 'popupVideo'
    })
})

browser.windows.onRemoved.addListener(windowId => {
    console.info("Closed window: " + windowId);
});

browser.runtime.onInstalled.addListener(detail => {
    if (detail.reason === 'install') {
        browser.storage.local.set({
            size: 'auto',
            position: 'center',
            ontop: false,
            lastLeft: 0,
            lastTop: 0,
            lastHeight: 480,
            lastWidth: 640,
            fixhistory: false,
            supportNative:false,
        })
    }
})