export const loadScript = (lib) => {
  return new Promise((resolve) => {
    const scriptTag = document.createElement('script')
    scriptTag.src = lib
    scriptTag.type = 'text/javascript'
    document.getElementsByTagName('head')[0].appendChild(scriptTag)
    scriptTag.onload = resolve
  })
}

export const loadIEPromise = () => {
  if (isIE()) {
    return new Promise((resolve) => {
      const scriptTag = document.createElement('script')
      scriptTag.src = './ie/es6-promise.js'
      scriptTag.type = 'text/javascript'
      document.getElementsByTagName('head')[0].appendChild(scriptTag)
      scriptTag.onload = resolve
    })
  }
}
function isIE (userAgent) {
  userAgent = userAgent || navigator.userAgent
  return userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1 || userAgent.indexOf('Edge/') > -1
}
