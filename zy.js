// ==UserScript==
// @name         资源域名精确替换器
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  将不同原始域名精确替换为对应的加速域名
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 域名映射配置
    const domainMappings = {
        'file.aiquickdraw.com': 'fsp.taotile.ltd',
        'tempfile.aiquickdraw.com': 'sp.taotile.ltd'
    };

    // 检查URL是否需要替换
    function shouldReplace(url) {
        return Object.keys(domainMappings).some(domain => url.hostname === domain);
    }

    // 获取替换后的域名
    function getReplacementDomain(originalDomain) {
        return domainMappings[originalDomain] || originalDomain;
    }

    // 监听所有资源请求
    document.addEventListener('beforefetch', function(e) {
        const url = new URL(e.request.url);

        if (shouldReplace(url)) {
            // 替换域名
            url.hostname = getReplacementDomain(url.hostname);

            // 创建新请求
            const newRequest = new Request(url.toString(), e.request);

            // 阻止原始请求
            e.preventDefault();

            // 发起新请求
            fetch(newRequest).then(response => {
                e.respondWith(response);
            });
        }
    });

    // 替换页面中已有的资源链接
    function replaceExistingLinks() {
        // 处理所有可能包含资源的标签
        const tags = ['img', 'video', 'audio', 'source', 'iframe', 'embed', 'object', 'script', 'link'];

        tags.forEach(tag => {
            document.querySelectorAll(tag).forEach(element => {
                const src = element.src || element.href;
                if (src) {
                    for (const [original, replacement] of Object.entries(domainMappings)) {
                        if (src.includes(original)) {
                            element.src = src.replace(original, replacement);
                            break;
                        }
                    }
                }
            });
        });

        // 处理CSS背景图等内联样式
        document.querySelectorAll('[style]').forEach(element => {
            const style = element.getAttribute('style');
            if (style) {
                let newStyle = style;
                for (const [original, replacement] of Object.entries(domainMappings)) {
                    const regex = new RegExp(`https?://${original.replace(/\./g, '\\.')}`, 'g');
                    newStyle = newStyle.replace(regex, `https://${replacement}`);
                }
                if (newStyle !== style) {
                    element.setAttribute('style', newStyle);
                }
            }
        });
    }

    // 初始替换
    replaceExistingLinks();

    // 监听DOM变化，动态替换新加载的资源
    const observer = new MutationObserver(replaceExistingLinks);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'href', 'style']
    });

    // 监听动态创建的脚本和样式表
    const headObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeName === 'SCRIPT' && node.src) {
                    for (const [original, replacement] of Object.entries(domainMappings)) {
                        if (node.src.includes(original)) {
                            node.src = node.src.replace(original, replacement);
                            break;
                        }
                    }
                }
                if (node.nodeName === 'LINK' && node.href) {
                    for (const [original, replacement] of Object.entries(domainMappings)) {
                        if (node.href.includes(original)) {
                            node.href = node.href.replace(original, replacement);
                            break;
                        }
                    }
                }
            });
        });
    });
    headObserver.observe(document.head, {
        childList: true,
        subtree: true
    });

    // 重写XMLHttpRequest和fetch以拦截动态请求
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        if (typeof input === 'string') {
            for (const [original, replacement] of Object.entries(domainMappings)) {
                if (input.includes(original)) {
                    input = input.replace(original, replacement);
                    break;
                }
            }
        } else if (input instanceof Request) {
            const url = new URL(input.url);
            if (shouldReplace(url)) {
                url.hostname = getReplacementDomain(url.hostname);
                input = new Request(url.toString(), input);
            }
        }
        return originalFetch.call(this, input, init);
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        for (const [original, replacement] of Object.entries(domainMappings)) {
            if (url.includes(original)) {
                url = url.replace(original, replacement);
                break;
            }
        }
        return originalXHROpen.apply(this, arguments);
    };
})();
