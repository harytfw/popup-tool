$a = Get-Item './manifest.json'
$name = $a.FullName
$reg = 'HKCU:\Software\Mozilla\NativeMessagingHosts\popuptool.helper'
Remove-Item $reg
New-Item $reg -Value $name