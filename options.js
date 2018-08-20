function saveSetting() {
    const formData = new FormData(document.querySelector('form'))
    const data = {}
    for (const key of formData.keys()) {
        data[key] = formData.get(key)
    }
    // 修复 checkbox的值不被传递的问题
    // data['fixhistory'] = document.querySelector('#fixHistory').checked
    browser.storage.local.set(data)
}

browser.storage.local.get().then(storage => {
    // document.querySelector(`[name='fixhistory']`).checked = storage.fixhistory
    document.querySelector(`[name='position'][value='${storage.position}'`).checked = true
    document.querySelector(`[name='size'][value='${storage.size}'`).checked = true
})


document.addEventListener('change', async _ => {

    const target = _.target
    if (target.id === 'fixHistory') {
        // const permissionsToRequest = {
        //     permissions: ["tabs", "history"]
        // }

        // async function onResponse(response) {
        //     if (response) {
        //         saveSetting()
        //         console.log("Permission change was accepted");
        //     } else {
        //         target.checked = !target.checked
        //         console.log("Permission change was refused");
        //     }

        //     console.log(`Current permissions:`, await browser.permissions.getAll())
        // }
        // if (target.checked === true) {
        //     console.log('Request Ppermissions')
        //     browser.permissions.request(permissionsToRequest).then(onResponse)
        // }
        // if (target.checked === false) {
        //     console.log('Give up Ppermissions')
        //     browser.permissions.remove(permissionsToRequest).then(onResponse)
        // }
    } else {
        saveSetting()
    }
})

setTimeout(function () {
    for (const node of document.querySelectorAll('[i18n]')) {
        node.textContent = browser.i18n.getMessage(node.getAttribute('i18n'))
    }
}, 0)