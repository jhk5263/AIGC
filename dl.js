// ==UserScript==
// @name         TopMediAI 视频下载器
// @namespace    http://tampermonkey.net/
// @version      1.22
// @description  在 TopMediAI 的文本转视频页面，当视频生成后自动添加一个下载按钮。
// @author       Gemini
// @match        *://www.topmediai.com/*
// @icon         https://www.topmediai.com/favicon.ico
// @grant        none
// @license      MIT
// @updateURL    https://co.taotile.ltd/dl.js
// @downloadURL  https://co.taotile.ltd/dl.js
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        button.download-btn.is-downloading, a.download-btn.is-downloading {
            pointer-events: none;
            opacity: 0.8;
        }
    `);

    /**
     * 从 URL 中提取文件名
     * @param {string} url - 视频链接
     * @returns {string} - 文件名
     */
    function getFilenameFromUrl(url) {
        if (!url) return 'topmediai-video.mp4';
        try {
            const pathname = new URL(url).pathname;
            return pathname.substring(pathname.lastIndexOf('/') + 1);
        } catch (e) {
            return 'topmediai-video.mp4';
        }
    }

    /**
     * 核心函数：为按钮绑定强制下载事件。
     * @param {Element} button - 目标按钮元素。
     * @param {Element} video - 目标视频元素。
     * @param {string} context - 日志上下文。
     */
    function setupForceDownload(button, video, context) {
        if (!button || !video || button.dataset.downloadHandlerAttached) {
            return;
        }
        button.dataset.downloadHandlerAttached = 'true';

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

            // *** 改动点：从URL中动态获取文件名 ***
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
                    tempLink.setAttribute('download', fileName); // 使用原始文件名

                    document.body.appendChild(tempLink);
                    tempLink.click();

                    document.body.removeChild(tempLink);
                    URL.revokeObjectURL(tempUrl);
                    console.log(`[Tampermonkey] 下载已触发 (${context})`);
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

        console.log(`[Tampermonkey] ${context} 的下载按钮已成功绑定新功能。`);
    }

    // --- 监视器逻辑 ---
    const observer = new MutationObserver(() => {

        // --- 主页面逻辑 ---
        const mainVideo = document.querySelector('video[controls]:not(.el-dialog__body video)');
        if (mainVideo) {
            const container = mainVideo.closest('.global-scrollbar-hide');
            if (container) {
                const mainButton = container.querySelector('button.download-btn');
                if (mainButton) {
                    setupForceDownload(mainButton, mainVideo, 'Main Page');
                }
            }
        }

        // --- 弹窗逻辑 ---
        const popupContainer = document.querySelector('.el-dialog__body');
        if (popupContainer) {
             const button = popupContainer.querySelector('button.download-btn');
             const video = popupContainer.querySelector('video');
             if (button && video && video.src && button.tagName === 'BUTTON') {
                 const newLink = document.createElement('a');
                 newLink.className = button.className;
                 newLink.innerHTML = button.innerHTML;
                 newLink.href = video.src;

                 // *** 改动点：从URL中动态获取文件名 ***
                 const fileName = getFilenameFromUrl(video.src);
                 newLink.setAttribute('download', fileName);

                 button.parentNode.replaceChild(newLink, button);
                 console.log('[Tampermonkey] 弹窗下载按钮已修正。');
             }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log('TopMediAI 下载脚本 v1.9 (保留原始文件名版) 已启动。');
})();
