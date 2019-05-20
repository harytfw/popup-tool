# popup-tool（视频弹出工具）

这是一个Firefox拓展，这个扩展的功能是弹出HTML5的视频到独立窗口, 目前支持的视频网站有 Youtube, Bilibili, 腾讯视频, 优酷, 爱奇艺, 斗鱼直播. 其他网站上的视频可能不能完美支持. 

### 支持的基本功能：

* 弹出视频
* 根据视频大小调整窗口的大小
* 记忆弹窗的位置和大小

### 特殊功能（需要安装外部程序）：

* 将弹出窗口置顶
* 设置窗口的透明度

### 安装扩展

请在 [AMO](https://addons.mozilla.org/zh-CN/firefox/addon/popup-tool/?src=search) 安装本扩展

### 外部程序

说明：这个外部程序只会修改弹出窗口的置顶选项和透明度，不会进行其它敏感操作。

### 安装外部程序教程

* 将本扩展的 github代码库 保存到本地

* 打开powershell，进入到 `native/` 目录，执行 `./add-to-registry.ps1` 来添加注册表信息

  * 如果出现运行错误，请使用管理员权限运行powershell，输入`Set-ExecutionPolicy RemoteSigned`，来暂时解除脚本的执行限制。然后重新执行`./add-to-registry.ps1`  脚本。

  * 执行成功之后，用管理员权限运行powershell，输入`Set-ExecutionPolicy Restricted` 恢复脚本的执行策略。

* 重新启动安装了拓展的Firefox

* 打开一个支持的视频网站，你将会在视频弹出的工具栏看到 “置顶” 的按钮，这说明外部程序安装成功。



