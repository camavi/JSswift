class Start {
  constructor() {
    this.start();
  }
  start() {
    this.loadDependenceJS('_jsswift-fe/js/cms.js');
  }

  isCssUploaded = (linkCSS) => {
    const linkElements = document.getElementsByTagName('link');
    const fileCSS = [];
    for (let i in linkElements) {
      if (linkElements[i].rel === 'stylesheet' && linkElements[i].href) {
        fileCSS.push(linkElements[i].href);
      }
    }
    return fileCSS.includes(linkCSS);
  }
  isJSUploaded = (srcJS) => {
    const scriptElements = document.getElementsByTagName('script');
    const fileJSCaricati = [];
    for (let i in scriptElements) {
      if (scriptElements[i].src) {
        fileJSCaricati.push(scriptElements[i].src);
      }
    }
    return fileJSCaricati.includes(srcJS);
  }
  insertScript = async (src, type, func = null) => {
    let script = null;
    if (type === 'js') {
      script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      document.head.appendChild(script);
    } else if (type === 'css') {
      script = document.createElement('link');
      script.rel = 'stylesheet';
      script.type = 'text/css';
      script.href = src;
      document.head.appendChild(script);
    }
    script.onload = function () {
      if (typeof func === 'function' && script) {
        func();
      }
    }
  }
  loadDependenceJS = async (url, func) => {
    if (!this.isJSUploaded(url)) {
      this.insertScript(url, 'js', func);
    }
  }
  loadDependenceCSS = async (url, func) => {
    if (!this.isCssUploaded(url)) {
      this.insertScript(url, 'css', func);
    }
  }
}
const start = new Start();