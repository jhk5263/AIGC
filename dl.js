// ==UserScript==
// @name         TopMediAI 视频下载器
// @namespace    http://tampermonkey.net/
// @version      1.2
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

    // --- 功能1: 处理主页面的下载按钮 ---
    function handleMainPageButton() {
        const SCRIPT_ID = 'tampermonkey-download-button';
        const regenerateBtn = document.querySelector('p.regenerate-btn');
        const videoSource = document.querySelector('div.video-center video > source');

        if (!regenerateBtn || !videoSource || !videoSource.src) {
            return;
        }

        let downloadBtn = document.getElementById(SCRIPT_ID);

        if (!downloadBtn) {
            downloadBtn = document.createElement('a');
            downloadBtn.id = SCRIPT_ID;
            downloadBtn.className = regenerateBtn.className; // 保持风格一致
            downloadBtn.style.marginLeft = '10px';
            downloadBtn.innerHTML = `<span class="t-text-[12px] t-text-[#1C1D1F]">下载视频</span>`;
            regenerateBtn.insertAdjacentElement('afterend', downloadBtn);
            console.log('主页面下载按钮已创建。');
        }

        downloadBtn.href = videoSource.src;
        downloadBtn.setAttribute('download', 'topmediai-video.mp4');
    }

    // --- 功能2: (新增) 修正弹出窗口的下载按钮 ---
    function handlePopupButton() {
        // 查找弹出窗口的容器
        const popupBody = document.querySelector('.el-dialog__body');
        if (!popupBody) {
            return; // 弹窗未打开
        }

        // 在弹窗内查找视频和下载按钮
        const buttonInPopup = popupBody.querySelector('button.download-btn');
        const videoInPopup = popupBody.querySelector('video');

        // 如果没有找到按钮或视频，或者按钮已经被我们替换过了 (变成了<a>标签)，则退出
        if (!buttonInPopup || !videoInPopup || !videoInPopup.src || buttonInPopup.tagName !== 'BUTTON') {
            return;
        }

        console.log('检测到弹窗下载按钮，开始修正...');

        // 创建一个新的<a>标签作为下载链接
        const newDownloadLink = document.createElement('a');

        // 1. 复制所有样式，让新链接看起来和旧按钮一模一样
        newDownloadLink.className = buttonInPopup.className;

        // 2. 复制按钮内部内容 (包括图标和文字)
        newDownloadLink.innerHTML = buttonInPopup.innerHTML;

        // 3. 设置链接地址和下载属性
        newDownloadLink.href = videoInPopup.src;
        newDownloadLink.setAttribute('download', 'topmediai-popup-video.mp4');

        // 4. 用新的<a>链接替换掉旧的<button>按钮
        buttonInPopup.parentNode.replaceChild(newDownloadLink, buttonInPopup);

        console.log('弹窗下载按钮已修正为直接下载链接。');
    }

    // --- 核心逻辑 ---
    // 使用 MutationObserver 监视整个页面的变化
    const observer = new MutationObserver(() => {
        handleMainPageButton(); // 检查主页面按钮
        handlePopupButton();    // 同时检查弹窗按钮
    });

    // 启动观察器
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('TopMediAI 下载脚本 v1.2 已启动。');
})();
