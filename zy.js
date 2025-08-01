// ==UserScript==
// @name         资源域名精确替换器
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  将不同原始域名精确替换为对应的加速域名
// @author       You
// @match        *://kie.ai/*
// @match        *://tryveo3.ai/*
// @match        *://veo3.bot/*
// @grant        none
// @updateURL    https://co.taotile.ltd/zy.js
// @downloadURL  https://co.taotile.ltd/zy.js
// ==/UserScript==

(function() {
    'use strict';

    // 域名映射配置
    const domainMappings = {
        'file.aiquickdraw.com': 'fsp.taotile.ltd',
        'tempfile.aiquickdraw.com': 'sp.taotile.ltd',
        'tempfile.1f6c22e0a6980b81e6d5c6c5f89b1984.r2.cloudflarestorage.com': 'tu.taotile.ltd'
    };
    
    // 重写 fetch
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        let newUrl = input instanceof Request ? input.url : input;
        
        try {
            const urlObj = new URL(newUrl);
            if (domainMappings[urlObj.hostname]) {
                urlObj.hostname = domainMappings[urlObj.hostname];
                newUrl = urlObj.toString();
            }
        } catch (e) {
            // URL可能是相对路径，忽略错误
        }

        if (input instanceof Request) {
            input = new Request(newUrl, input);
        } else {
            input = newUrl;
        }

        return originalFetch.call(this, input, init);
    };

    // 重写 XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        let newUrl = url;
        try {
            const urlObj = new URL(url, document.baseURI);
            if (domainMappings[urlObj.hostname]) {
                urlObj.hostname = domainMappings[urlObj.hostname];
                newUrl = urlObj.toString();
            }
        } catch (e) {
            // URL可能是相对路径，忽略错误
        }
        return originalXHROpen.call(this, method, newUrl, ...args);
    };

    // 替换DOM中已存在的元素
    const replaceDomElements = (context) => {
        const selector = 'img, script, link, video, audio, source, iframe, embed, object';
        context.querySelectorAll(selector).forEach(el => {
            const prop = (el.tagName === 'LINK' || el.tagName === 'A') ? 'href' : 'src';
            if (el[prop]) {
                try {
                    const urlObj = new URL(el[prop]);
                    if (domainMappings[urlObj.hostname]) {
                        urlObj.hostname = domainMappings[urlObj.hostname];
                        el[prop] = urlObj.toString();
                    }
                } catch (e) {
                     // URL可能是相对路径，忽略错误
                }
            }
        });
    };

    // 监听DOM变化
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    replaceDomElements(node);
                }
            });
        });
    });

    // 初始执行并开始监听
    replaceDomElements(document);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

})();
