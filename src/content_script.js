let currentVideoElement = null
let currentContainer = null
let videoHeight = -1
let videoWidth = -1
let isPopup = false

const MIN_VALID_WIDTH = 100
const MIN_VALID_HEIGHT = 100

/**
 * 选项
 */
let config = null
browser.storage.local.get().then(cfg => {
    config = cfg
})
class Toolbar {
    constructor() {
        this.toolbar = document.createElement('div')
        this.toolbar.id = 'popup-tool'
        this.fixupInstance = null

        const html = `
        <div ><button id='x-popup' type='button'>${browser.i18n.getMessage('toolbar_popup')}</button></div>
        <div style='display:none;'><button id='x-restore' type='button'>${browser.i18n.getMessage('toolbar_restore')}</button></div>
        <div style='display:none;'><button id='x-remember-location' type='button'>${browser.i18n.getMessage('toolbar_remember')}</button></div>
		<div style='display:none;'><button id='x-setontop' type='button'>${browser.i18n.getMessage('toolbar_setontop')}</button></div>
        <div style='display:none;'><button id='x-unsetontop' type='button'>${browser.i18n.getMessage('toolbar_unsetontop')}</button></div>
        <div style='display:none;'><input id='x-opacity-range' min='60' max='255' value='255' type='range'></div>
    `
        const doc = (new DOMParser).parseFromString(html, "text/html");
        while (doc.body.firstElementChild instanceof HTMLElement) {
            this.toolbar.appendChild(doc.body.firstElementChild);
        }

        for (const btn of this.toolbar.querySelectorAll('button')) {
            btn.addEventListener('click', this.onClick.bind(this))
        }

        const rangeInput = this.toolbar.querySelector('input')

        rangeInput.addEventListener('input', (event) => {
            rangeInput.title = browser.i18n.getMessage('opacity', rangeInput.value)
            this.opacity = rangeInput.value
        })

    }
    display(locator) {

        const rect = locator.getBoundingClientRect()
        this.toolbar.style.left = `${rect.left}px`
        this.toolbar.style.top = `${rect.top}px`
        this.toolbar.style.display = ''
        this.mount()
    }

    /**
     * @param {boolean} isShow
     */
    set popupBtn(isShow) {
        if (isShow)
            this.showEl(this.toolbar.querySelector('#x-popup').parentElement)
        else
            this.hideEl(this.toolbar.querySelector('#x-popup').parentElement)
    }

    /**
     * @param {boolean} isShow
     */
    set restoreBtn(isShow) {
        if (!config.supportNative) this.hideEl(this.toolbar.querySelector('#x-opacity-range').parentElement)
        if (isShow) {
            this.showEl(this.toolbar.querySelector('#x-restore').parentElement)
            this.showEl(this.toolbar.querySelector('#x-remember-location').parentElement)
            if (config.supportNative) this.showEl(this.toolbar.querySelector('#x-opacity-range').parentElement)
        }
        else {
            this.hideEl(this.toolbar.querySelector('#x-restore').parentElement)
            this.hideEl(this.toolbar.querySelector('#x-remember-location').parentElement)
            if (config.supportNative) this.hideEl(this.toolbar.querySelector('#x-opacity-range').parentElement)
        }
    }

    /**
     * @param {boolean} flag
     */
    set alwaysOnTop(flag) {
        if (!config.supportNative) {
            this.hideEl(this.toolbar.querySelector('#x-setontop').parentElement)
            this.hideEl(this.toolbar.querySelector('#x-unsetontop').parentElement)
            return
        }
        if (flag) {
            this.showEl(this.toolbar.querySelector('#x-unsetontop').parentElement)
            this.hideEl(this.toolbar.querySelector('#x-setontop').parentElement)
            return browser.runtime.sendMessage({
                command: 'setOnTop',
            })
        }
        else {
            if (!isPopup)
                this.hideEl(this.toolbar.querySelector('#x-setontop').parentElement)
            else
                this.showEl(this.toolbar.querySelector('#x-setontop').parentElement)
            this.hideEl(this.toolbar.querySelector('#x-unsetontop').parentElement)
            return browser.runtime.sendMessage({
                command: 'unsetOnTop',
            })
        }
    }

    /**
     * @param {number|string} value
     */
    set opacity(value) {
        if (!config.supportNative) return
        browser.runtime.sendMessage({
            command: 'changeOpacity',
            value: value,
        })
    }

    get parentElement() {
        return this.toolbar.parentElement
    }

    hideEl(el) {
        if (el instanceof HTMLElement) {
            el.style.display = 'none'
        }
    }
    showEl(el) {
        if (el instanceof HTMLElement) {
            el.style.display = 'block'
        }
    }
    remove() {
        this.toolbar.remove()
    }
    mount() {
        if (this.toolbar.parentElement == null)
            document.body.appendChild(this.toolbar)
    }

    async onClick(event) {
        const target = event.target
        this.fixupInstance = extensionRule.getRule().fixup
        // hideOtherElement(currentVideoElement)
        switch (target.id) {
            case 'x-popup':
                this.doPopup()
                break
            case 'x-restore':
                this.doRestore()
                break
            case 'x-remember-location':
                this.doRemember()
                break
            case 'x-setontop':
                this.alwaysOnTop = true
                break
            case 'x-unsetontop':
                this.alwaysOnTop = false
                break
            default:
                break
        }

    }

    async doPopup() {
        isPopup = true
        this.fixupInstance && this.fixupInstance.beforeCreate(currentContainer, currentVideoElement)
        const rect = currentContainer.getBoundingClientRect()
        videoHeight = rect.height
        videoWidth = rect.width
        await browser.runtime.sendMessage({
            command: 'create',
            height: rect.height,
            width: rect.width,
        })
        this.restoreBtn = true
        this.popupBtn = false
        console.info('popup window is created')
        // currentContainer.scrollIntoView({
        //     behavior: "instant",
        //     block: "start",
        //     inline: "start"
        // });
        popupToolBar.display(currentVideoElement)
        if (config.supportNative) {
            if (config.ontop)
                this.alwaysOnTop = true
            else
                this.alwaysOnTop = false
        }
        this.fixupInstance && this.fixupInstance.afterCreate(currentContainer, currentVideoElement)
    }

    async doRestore() {
        isPopup = false
        this.fixupInstance && this.fixupInstance.beforeDestory(currentContainer, currentVideoElement)
        // 恢复前去除置顶
        this.alwaysOnTop = false
        this.opacity = 255
        await browser.runtime.sendMessage({
            command: 'destory',
        })

        console.log('popup window is destory')
        const el = document.querySelector('#popup-tool-style')
        el && el.remove()
        this.popupBtn = true;
        this.restoreBtn = false;
        this.fixupInstance && this.fixupInstance.afterDestory(currentContainer, currentVideoElement)
    }
    async doRemember() {
        await browser.runtime.sendMessage({
            command: 'rememberLocation'
        })
    }

    async changeOpacity(value) {
        await browser.runtime.sendMessage({
            command: 'changeOpacity',
            value,
        })
    }
}

const popupToolBar = new Toolbar()

class Fixup {
    constructor() { }
    fixContainer(container) {
        if (!(container instanceof HTMLElement)) return
        currentContainer = container
    }
    fixVideoElement(video) {
        if (!(video instanceof HTMLElement)) return
        currentVideoElement = video
    }
    matched(container, video) { // 当fixup所在的规则成功匹配后 调用 matched

    }
    beforeCreate(container, video) {
        // throw new Error('This meathod is not implemented')
    }
    afterCreate(container, video) {
        // throw new Error('This meathod is not implemented')
    }
    beforeDestory(container, video) {
        // throw new Error('This meathod is not implemented')
    }
    afterDestory(container, video) {
        // throw new Error('This meathod is not implemented')
    }
    triggerClick(selector) {
        const el = document.querySelector(selector)
        if (!el) {
            console.warn('触发 ' + selector + ' 失败, 没有找到这个元素')
        }
        el && el.click()
    }
    removeScrollbar() {
        const style = document.createElement("style")
        style.id = 'popup-tool-style'
        style.type = "text/css"
        style.textContent = `
        html{
            overflow: hidden !important;
            height: 100% !important;
            width: 100% !important;
        }
        body{
            overflow: hidden !important;
            height: 100% !important;
            width: 100% !important;
        }
    `
        document.head.appendChild(style)
    }
    restoreScrollbar() {
        const el = document.querySelector('#popup-tool-style')
        el && el.remove()
    }
    setFullWindow(arg, includeParent = false) {
        // console.log(arg)
        let zIndex = 999999;
        const style = `display:initial;width:100% !important;height:100% !important;position:fixed !important;top:0px !important;left:0px !important;z-index:${zIndex};visibility: visible;background-color:black`
        if (typeof arg === 'string') {
            const el = document.querySelector(arg)
            arg = el
            setStyleArrtibute(arg, style)
        } else if (arg instanceof HTMLElement) {
            setStyleArrtibute(arg, style)
        }
        if (arg && includeParent) {
            let p = arg.parentElement
            while (p && p !== document.documentElement) {
                zIndex -= 1
                setStyleArrtibute(p, `z-index:${zIndex}`)
                p = p.parentElement
            }
        }
    }
    unsetFullWindow(arg, includeParent = false) {
        if (typeof arg === 'string') {
            const el = document.querySelector(arg)
            arg = el
            restoreStyleArrtibute(el)
        } else if (arg instanceof HTMLElement) {
            restoreStyleArrtibute(arg)
        }
        if (arg && includeParent) {
            let p = arg.parentElement
            while (p && p !== document.documentElement) {
                restoreStyleArrtibute(p)
                p = p.parentElement
            }
        }
    }
    createStyle(style) {
        const s = document.createElement('style')
        s.textContent = style
        return s
    }
}

const extensionRule = {
    cacheObj: null, // {regexp:/./,selector:'',tagName:[],goodElements:[]} 缓存匹配到的规则
    first: true,
    rules: [

        {
            name: 'youtube',
            test: /https?:\/\/www\.youtube\.com\/watch\?v=.*/,
            selector: '.video-stream',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                    this.iframe = null
                    this.time = 0
                }
                matched() {
                }
                beforeCreate(_, video) {
                    video.pause()
                    this.time = Math.floor(video.currentTime)
                    const vid = new URL(location.href).searchParams.get('v')
                    this.iframe = document.createElement('iframe')
                    this.iframe.src = `${location.origin}/embed/${vid}?t=${Math.floor(this.time)}`
                }
                afterCreate(currentContainer, currentVideoElement) {
                    document.body.appendChild(this.iframe)
                    this.iframe.onload = () => {
                        this.iframeVideo.currentTime = this.time
                        this.iframe.contentDocument.addEventListener('mousemove', (e) => {
                            document.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, target: null, bubbles: true }))
                        })
                    }

                    this.removeScrollbar()
                    this.setFullWindow(this.iframe)
                }
                afterDestory(currentContainer, currentVideoElement) {
                    this.time = this.iframeVideo.currentTime
                    currentVideoElement.currentTime = this.time
                    this.restoreScrollbar()
                    this.unsetFullWindow(this.iframe)
                    this.iframe.remove()
                }

                /**
                 * @returns {HTMLVideoElement}
                 */
                get iframeVideo() {
                    return this.iframe.contentDocument.querySelector('#player video')
                }
            }
        },
        {
            name: 'bilibili',
            test: /^https?:\/\/www\.bilibili\.com\/video\/av\d+/,
            selector: '.player',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                    this.time = 0
                    this.paused = false
                }
                beforeCreate(container, video) {
                    this.time = video.currentTime
                    this.paused = video.paused
                    console.info('记录播放时间', this.time)
                    console.info('正在播放', !this.paused)
                }
                afterCreate(container, video) {
                    setTimeout(() => {
                        const realWindow = window.wrappedJSObject
                        realWindow.GrayManager.reload(realWindow.GrayManager.playerParams)
                    }, 500)
                    setTimeout(() => {
                        // 因为上面代码用GrayManage刷新视频, 导致参数 video 指向已经消失的元素 
                        video = document.querySelector('.player video'); // 重新获取video
                        !this.paused && video.play()
                        video.currentTime = this.time

                        console.info('恢复播放时间', this.time)
                        console.info('设置播放中', !this.paused)
                        this.fixVideoElement = video
                    }, 1800)
                    setTimeout(() => {
                        if (document.querySelector(`[data-text="网页全屏"]`)) {
                            this.triggerClick('.bilibili-player-video-web-fullscreen')
                            // this.triggerClick(`[name="web_fullscreen"]`)
                        }
                    }, 2000)
                }
                afterDestory() {
                    this.triggerClick('.bilibili-player-video-web-fullscreen')
                }
            }
        },
        {
            name: 'bilibili_live',
            test: /https?:\/\/live\.bilibili\.com\/\d+/,
            selector: '.player-section',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                matched(container, video, ) {

                }
                afterCreate() {
                    this.triggerClick('[data-title="网页全屏"]')
                    this.triggerClick('[data-title="重新载入"]')
                }
                afterDestory() {
                    this.triggerClick('[data-title="退出网页全屏"]')
                }
            }
        },
        {
            name: 'bilibili_bangumi',
            test: /https?:\/\/www\.bilibili\.com\/bangumi\/.*/,
            selector: '.player',
            tagName: ['video'],
            fixup: new class extends Fixup {
                constructor() {
                    super()
                    this.rule = /https?:\/\/www\.bilibili\.com\/bangumi\/.*/
                }
                afterCreate() {
                    this.triggerClick(`[name="web_fullscreen"]`)
                }
                afterDestory() {
                    this.triggerClick(`[name="web_fullscreen"]`)
                }
            }
        },
        {
            name: 'tencent_video',
            test: /https?:\/\/v\.qq\.com\/x\/cover\/.*/,
            selector: '#mod_player',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                afterCreate() {
                    this.triggerClick(`[data-report='browser-fullscreen']`)
                }
                afterDestory() {
                    this.triggerClick(`[data-report='browser-fullscreen']`)
                }
            }
        },
        {
            name: 'iqiyi',
            test: /https?:\/\/www\.iqiyi\.com\/v_.*/,
            selector: '.iqp-player',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                afterCreate() {
                    this.triggerClick(`[data-player-hook="webfullscreen"]`)
                }
                afterDestory() {
                    this.triggerClick(`[data-player-hook="webfullscreen"]`)
                }
            },
        },
        {
            name: 'youku',
            test: /https?\:\/\/v\.youku\.com\/v_show\/.*/,
            selector: '.playArea',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                    this.style = null
                }
                matched() {
                    this.style = this.createStyle(`
                    #module_basic_player,#player{
                        height: 100% !important;
                    }
                    
                    `)
                }
                afterCreate(container) {
                    this.removeScrollbar()
                    this.setFullWindow(container)
                    document.head.appendChild(this.style)
                }
                afterDestory(container) {
                    this.restoreScrollbar()
                    this.unsetFullWindow(container)
                    this.style.remove()
                }
            }
        },
        {
            name: 'mgtv',
            test: /https?:\/\/www\.mgtv\.com\/b\/\d+\/\d+\.html/,
            selector: '.c-player-video',
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                afterCreate(container, video) {
                    this.removeScrollbar()
                    this.triggerClick('mango-webscreen')
                }
                afterDestory(container, video) {
                    this.restoreScrollbar()
                    this.triggerClick('mango-webscreen')
                }
            }
        },
        {
            name: 'ifeng',
            test: /https?:\/\/v\.ifeng\.com\/video_\d+\.shtml/,
            tagName: ['video'],
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                afterCreate(container, video) {
                    this.removeScrollbar()
                    this.setFullWindow('#playerWrap')
                    this.setFullWindow('#playercontainer')
                }
            }
        },
        {
            name: 'douyu',
            selector: '#js-player-video',
            test: function () {
                return /https?:\/\/www\.douyu\.com\/\d+/.test(location.href)
            },
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                beforeCreate(_, __, ) {
                    this.removeScrollbar()
                    this.triggerClick('[title="网页全屏"]')
                    // callback({
                    //     currentContainer: document.querySelector('.PlayerCase')
                    // })
                }
                afterDestory() {
                    this.restoreScrollbar()
                    this.triggerClick('[title="退出网页全屏"]')
                }
            }
        },
        {
            name: 'Acfun',
            selector: '#ACFlashPlayer',
            test: /https?:\/\/www\.acfun\.cn\/v\/ac\d+/,
            fixup: new class extends Fixup {
                constructor() {
                    super()
                }
                afterCreate() {
                    this.triggerClick('.fullscreen-web .btn-span')
                }
                afterDestory() {
                    this.triggerClick('.fullscreen-web .btn-span')
                }
            }
        },
        {
            name: 'huya',
            test: /https?:\/\/www\.huya\.com\/[\d\w]+/,
            selector: '#player-wrap',
            fixup: new class extends Fixup {
                constructor() { super() }
                afterCreate() {
                    this.removeScrollbar()
                    this.triggerClick('#player-fullpage-btn')
                }
                afterDestory() {
                    this.restoreScrollbar()
                    this.triggerClick('#player-fullpage-btn')
                }
            }
        },
        {
            name: 'huomao',
            test: /https?:\/\/www\.huomao\.com\/\d+/,
            selector: '#playing-box-root',
            fixup: new class extends Fixup {
                constructor() { super() }
                afterCreate() {
                    this.removeScrollbar()
                    this.triggerClick('.page-full-screen')
                }
                afterDestory() {
                    this.restoreScrollbar()
                    this.triggerClick('.page-full-screen')
                }
            }
        },
        {
            name: 'DEFAULT',
            test: /./,
            tagName: ['video', 'object', 'embed'],
            fixup: new class extends Fixup {
                constructor() {
                    super()
                    this.controls = false
                }
                afterCreate(container, video) {
                    this.removeScrollbar()
                    this.setFullWindow(video, true)
                    if (video && video.tagName === 'VIDEO') {
                        this.controls = video.controls
                        video.controls = true
                    }
                }
                afterDestory(container, video) {
                    this.unsetFullWindow(video, true)
                    this.restoreScrollbar()
                    video && (video.controls = this.controls)
                }
            },
        }
    ],
    getRule(force = false) {
        // force: 强制重新获取规则
        if (this.first || force) {
            this.first = false
            for (const obj of this.rules) {
                let f = false
                if (obj.test instanceof RegExp && obj.test.test(location.href)) {
                    f = true
                } else if (obj.test instanceof Function && obj.test()) {
                    f = true
                }
                if (f) {
                    const c = obj.selector ? document.querySelector(obj.selector) : null

                    if (c && obj.name !== 'DEFAULT') {
                        browser.runtime.sendMessage({
                            command: 'availablePopup'
                        })
                        this.cacheObj = obj
                        console.info(`'${this.cacheObj.name}' policy is picked`)
                    }
                    else if (!c) {
                        this.cacheObj = this.rules.filter(o => o.name === 'DEFAULT')[0]
                        console.assert(this.cacheObj.name === 'DEFAULT', 'fallback rule is not right')
                        console.info(`'${this.cacheObj.name}' policy is picked instead of '${obj.name}'`)
                    }
                    this.cacheObj.fixup.matched(c, null)
                    this.cacheObj.goodElementMapping = new WeakMap() //存放匹配成功的元素， 事件触发的element -> 自己或用selector获取的元素
                    break
                }
            }
        }
        return this.cacheObj
    },
    match(target) {
        // console.log(target, 'start matching')
        this.cacheObj = this.getRule()

        const lowerCaseName = target.tagName.toLowerCase()
        if (this.cacheObj.name === 'DEFAULT') {
            //  使用默认方案
            if (this.cacheObj.tagName.includes(lowerCaseName)) {
                return {
                    customRule: false,
                    element: target
                }
            }
            return {
                customRule: false,
                element: null,
            }
        }

        if (!this.cacheObj.tagName && !this.cacheObj.selector) {
            console.log(this.cacheObj)
            console.error('tagName or selector must be provided')
            alert('tagName or selector must be provided')
        }
        if (this.cacheObj.goodElementMapping.has(target)) {
            // console.log(target, 'match cache', this.cacheObj.goodElementMapping.get(target))
        } else if (this.cacheObj.tagName && this.cacheObj.tagName.includes(lowerCaseName)) {
            // console.log(target, 'match tag name', this.cacheObj.tagName)
            this.cacheObj.goodElementMapping.set(target, target) //映射自己
        } else if (this.cacheObj.selector) {
            const _target = target
            const element = document.querySelector(this.cacheObj.selector)
            if (element) {
                while (target) {
                    // find from accesstor
                    if (target === element) {
                        this.cacheObj.goodElementMapping.set(_target, element) // 映射到由selector获得的元素
                        // console.log(target, 'match selector', this.cacheObj.selector)
                        break
                    }
                    target = target.parentElement
                }
            }
        }
        return {
            customRule: true,
            element: this.cacheObj.goodElementMapping.get(target)
        }
    }
}



function setStyleArrtibute(target, value) {
    if (target.attributes['style']) {
        target.dataset['style'] = target.attributes['style'].value
    } else {
        target.dataset['style'] = ''
    }
    target.setAttribute('style', value)
}

function restoreStyleArrtibute(target) {
    target.setAttribute('style', target.dataset['style'])
    delete target.dataset['style']
}

/**
 * 查找可能的、相邻的 video 元素. 首先从target开始往祖先元素查找, 若找到元素的 id 或 className 包含 player 字符的元素则将它视为video容器元素, 再从这个容器元素里寻找符合条件的 video 元素
 * @param {HTMLElement} target 从target开始往祖先元素查找
 * @param {Boolean} findContainer 是否需要找容器, true 寻找容器, false 把 target 当成容器
 * @returns {[HTMLElement,HTMLElement]} 返回元素数组，第1个元素是Container(一定不为 null ), 第2个元素是Video(可能为 null ). 
 */
function searchVideoElement(target, findContainer = true) {

    const MAX_SEARCH_LEVEL = 2

    function check(t) {
        // 检查 id 或 className 是否含有player字符
        return (t.id && t.id.includes('player')) || (t.className && t.className.includes('player'))
    }

    let videoContaier = target;
    let currentLevel = 0
    // 找到疑似的video容器
    while (findContainer && videoContaier) {
        if (currentLevel >= MAX_SEARCH_LEVEL) {
            break
        }
        if (check(videoContaier)) {
            if (check(videoContaier.parentElement)) {
                // videoContaier.parentElement.parentElement也可能是容器，继续往上级查找
            } else {
                // 找到最终的容器
                break
            }
            currentLevel++
        }
        videoContaier = videoContaier.parentElement
    }

    if (!findContainer) {
        videoContaier = target.parentElement
    }

    if (!videoContaier) {
        // 没有找到
        return [null, null]
    }

    let targetVideo = null
    for (const video of videoContaier.querySelectorAll('video')) {
        // 对 容器内的video元素进行二次检查
        // 排除那些隐藏的、长宽太小的video元素

        const style = window.getComputedStyle(video)
        if (style['display'] === 'none') {
            continue
        }

        const rect = video.getBoundingClientRect()
        if (rect.width < MIN_VALID_WIDTH && rect.height < MIN_VALID_HEIGHT) {
            continue
        }

        targetVideo = video
        break
    }

    return [videoContaier, targetVideo]

}



function main(event) {
    if (isPopup) {
        return
    }
    const res = extensionRule.match(event.target)

    // res.customRule 自定义匹配的规则是否存在，不存在的话使用默认规则进行检查，
    // res.element 返回由规则指定的容器

    if (res.customRule && res.element) {

        // 使用自定义规则且匹配成功
        currentContainer = res.element
        currentVideoElement = searchVideoElement(res.element, false)[1]

        // console.log('1', currentContainer, currentVideoElement)
        if (!popupToolBar.parentElement) {
            //popupToolBar 没有父元素也就是没有添加到 document.body
            popupToolBar.display(currentContainer)
            return
        }
    }
    else if (!res.customRule && res.element) {
        // 使用了默认规则并且匹配成功
        if (event.target.tagName === 'OBJECT' || event.target.tagName === 'EMBED') {
            // flash 播放器
            const rect = event.target.getBoundingClientRect()
            if (rect.width <= MIN_VALID_WIDTH || rect.height <= MIN_VALID_HEIGHT) {
                currentContainer = currentVideoElement = null
            } else {
                currentContainer = currentVideoElement = event.target
            }
        } else {
            [currentContainer, currentVideoElement] = searchVideoElement(event.target, false)
        }
        if (currentVideoElement && !popupToolBar.parentElement) {
            popupToolBar.display(currentContainer)
        }
        // console.log(2, currentContainer, currentVideoElement)
    } else {

        // 检测是否在popupToolBar触发
        if (event.target.closest("#popup-tool")) return

        // 鼠标移动到其他地方，移除 toolbar
        popupToolBar.remove()

    }

}

class SelectableLayer {
    constructor() {
        this.onKeypress = this.onKeypress.bind(this)

        this.map = new WeakMap()
        this.layer = document.createElement('div')
        this.subLayers = []
        this.videos = Array.from(document.querySelectorAll('video,object,embed')).filter(node => {
            const rect = node.getBoundingClientRect()
            return rect.height > 100 && rect.width > 100
        })
        let zIndex = 9999999
        const bodyRect = document.body.getBoundingClientRect()
        this.layer.setAttribute('style', `
            position:fixed;
            width:100%;
            height:100%;
            z-index:${zIndex};
            background-color: black;
            left: 0px;
            top: 0px;
            opacity: 0.5;
        `)
        const subLayerPrototype = document.createElement('div')
        subLayerPrototype.setAttribute('style', `
            position:absolute;
            z-index:${zIndex + 1};
            background-color:#9c4324;
            opacity:0.5;
            cursor:pointer;
        `)
        for (const video of this.videos) {
            const rect = video.getBoundingClientRect()
            const cloned = subLayerPrototype.cloneNode(true)
            cloned.className = 'x-layer'
            cloned.style.left = `${rect.left + window.scrollX}px`
            cloned.style.top = `${rect.top + window.scrollY}px`
            cloned.style.width = `${rect.width}px`
            cloned.style.height = `${rect.height}px`
            cloned.addEventListener('click', this.onClick.bind(this))
            document.body.appendChild(cloned)
            this.map.set(cloned, video)
            this.subLayers.push(cloned)
        }

        this.layer.addEventListener('click', this.onClick.bind(this))
        document.addEventListener('keypress', this.onKeypress)
    }
    display() {
        document.body.appendChild(this.layer)
        for (const a of this.subLayers) {
            document.body.appendChild(a)
        }
    }
    remove() {
        document.removeEventListener('keypress', this.onKeypress)
        this.layer.remove()
        for (const node of this.subLayers) {
            node.remove()
        }
    }
    onKeypress(event) {
        if (event.key === 'Escape') {
            this.remove()
        }
    }
    onClick(event) {
        if (event.target === this.layer) {
            this.remove()
            return
        } else {
            main({
                target: this.map.get(event.target)
            })
            popupToolBar.doPopup();
            this.remove()
        }
    }
}

let selectableLayer = null

browser.runtime.onMessage.addListener(message => {
    if (message.command === 'popupVideo') {
        const rule = extensionRule.getRule()
        if (rule.name === 'DEFAULT') {
            // alert('the rule should not be DEFAULT')
            // throw new Error('the rule should not be DEFAULT')
            if (!selectableLayer) selectableLayer = new SelectableLayer()
            selectableLayer.display()
            return
        } else {
            // 触发main，保证 currentContainer 和 currentVideoElement 都获取成功
            main({
                target: document.querySelector(rule.selector)
            })
            popupToolBar.doPopup()
        }
    }
})

window.addEventListener('resize', event => {
    if (isPopup) {
        event.preventDefault()
        event.stopPropagation()
    }
}, { capture: true, passive: false }
)

document.addEventListener('mouseover', main, {
    capture: true,
    passive: true
})


// browser.runtime.sendMessage({ command: 'insertCSS' })

let timeoutId = 0
let currentEventCount = 0
const timeToRemove = 2000
const MAX_EVENT_COUNT = 30 // 限制 mousemove 的触发频率
function tryRemoveToolbar() {
    // 如果正在使用工具栏，延迟到下一次
    if (document.activeElement.closest("#popup-tool")) {
        setTimeout(tryRemoveToolbar, timeToRemove)
        return
    }
    popupToolBar.remove()
}
document.addEventListener('mousemove', event => {
    if (document.fullscreenElement) {
        popupToolBar.remove()
        return
    }
    if (currentEventCount < MAX_EVENT_COUNT) {
        currentEventCount += 1
        return
    }
    currentEventCount = 0
    if (!isPopup) {
        main(event)
        return
    }
    if (event.y <= 100) {// 鼠标的 y坐标 < 100 的情况显示工具栏，其他情况隐藏
        popupToolBar.display(document.body)
        return
    }
    popupToolBar.remove()
}, { capture: true, passive: true }
)

