// ==UserScript==
// @name         TopMediAI 视频下载器(test)
// @namespace    http://tampermonkey.net/
// @version      1.26
// @description  在 TopMediAI 的文本转视频页面，当视频生成后自动添加一个下载按钮。
// @author       haway
// @match        *.topmediai.com/*
// @icon         https://www.topmediai.com/favicon.ico
// @grant        none
// @license      MIT
// @updateURL    https://co.taotile.ltd/dl.js
// @downloadURL  https://co.taotile.ltd/dl.js
// ==/UserScript==
(function() {
    'use strict';
    
    console.log('%cTopMediAI 下载脚本 v4.1 (调试版) 已启动。', 'color: blue; font-size: 16px; font-weight: bold;');

    GM_addStyle(`
        button.download-btn.is-downloading, a.download-btn.is-downloading {
            pointer-events: none;
            opacity: 0.8;
        }
    `);

    function getFilenameFromUrl(url) {
        if (!url) return 'topmediai-video.mp4';
        try {
            const pathname = new URL(url).pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return filename || 'topmediai-video.mp4';
        } catch (e) {
            return 'topmediai-video.mp4';
        }
    }

    function setupForceDownload(button, video, context) {
        if (!button || !video || button.dataset.downloadHandlerAttached) {
            return;
        }
        console.log(`%c[DEBUG] setupForceDownload 已调用!`, 'color: green; font-weight: bold;', { context, button, video });
        button.dataset.downloadHandlerAttached = 'true';
        
        if (button.tagName !== 'BUTTON') return;

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const originalButtonContent = button.innerHTML;
            const sourceElement = video.querySelector('source');
            const videoSrc = sourceElement ? sourceElement.src : video.src;
            if (!videoSrc) {
                console.error('[Tampermonkey] 无法找到有效的视频源链接。');
                return;
            }
            const fileName = getFilenameFromUrl(videoSrc);
            console.log(`[Tampermonkey] 开始强制下载 (${context}): ${fileName}`);
            button.innerHTML = '下载中...';
            button.classList.add('is-downloading');
            fetch(videoSrc)
                .then(response => response.blob())
                .then(blob => {
                    const tempUrl = URL.createObjectURL(blob);
                    const tempLink = document.createElement('a');
                    tempLink.style.display = 'none';
                    tempLink.href = tempUrl;
                    tempLink.setAttribute('download', fileName);
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                    URL.revokeObjectURL(tempUrl);
                })
                .catch(err => {
                    console.error('下载失败:', err);
                    button.innerHTML = '下载失败';
                })
                .finally(() => {
                    setTimeout(() => {
                        button.innerHTML = originalButtonContent;
                        button.classList.remove('is-downloading');
                    }, 1000);
                });
        }, true);
        console.log(`%c[DEBUG] ${context} 的下载按钮已成功绑定功能。`, 'color: green');
    }

    /**
     * 循环扫描并处理所有下载按钮
     */
    function processDownloadButtons() {
        console.log('%c--- [DEBUG] 页面发生变动，开始扫描下载按钮 ---', 'color: orange');
        
        const buttonsToProcess = document.querySelectorAll('button.download-btn:not([data-download-handler-attached])');
        console.log(`[DEBUG] 扫描结果：找到 ${buttonsToProcess.length} 个尚未处理的下载按钮。`);

        if (buttonsToProcess.length === 0) {
            const allButtons = document.querySelectorAll('.download-btn');
            console.log(`[DEBUG] 页面上总共有 ${allButtons.length} 个 class 含 "download-btn" 的元素。`);
        }

        buttonsToProcess.forEach((button, index) => {
            console.log(`[DEBUG] 正在处理第 ${index + 1} 个按钮:`, button);
            const popupContainer = button.closest('.el-dialog__body');

            if (popupContainer) {
                console.log('[DEBUG] 判断：此按钮在弹窗内。');
                const video = popupContainer.querySelector('video');
                if (video) {
                    console.log('[DEBUG] 在弹窗内找到了对应的 video 元素。准备绑定功能...');
                    setupForceDownload(button, video, 'Popup');
                } else {
                    console.error('[DEBUG] 错误：在弹窗内找到了按钮，但没找到 video 元素！');
                }
            } else {
                console.log('[DEBUG] 判断：此按钮在主页面。');
                const mainVideo = document.querySelector('video[controls]:not(.el-dialog__body video)');
                if (mainVideo) {
                    console.log('[DEBUG] 在主页面找到了带 controls 的 video 元素。准备绑定功能...');
                    setupForceDownload(button, mainVideo, 'Main Page');
                } else {
                    console.error('[DEBUG] 错误：在主页面找到了按钮，但没找到带 controls 的 video 元素！');
                }
            }
        });
        console.log('%c--- [DEBUG] 本次扫描结束 ---', 'color: orange');
    }

    const observer = new MutationObserver(processDownloadButtons);
    observer.observe(document.body, { childList: true, subtree: true });

})();
