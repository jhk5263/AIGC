// ==UserScript==
// @name         TopMediAI 视频下载器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在 TopMediAI 的文本转视频页面，当视频生成后自动添加一个下载按钮。
// @author       Gemini
// @match        https://www.topmediai.com/app/text-to-video
// @icon         https://www.topmediai.com/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_ID = 'tampermonkey-download-button';

    // 定义按钮的样式，使其与 "Regenerate" 按钮风格一致
    const BUTTON_CLASSES = "t-cursor-pointer t-flex t-justify-center t-items-center t-min-w-[116px] t-h-[28px] t-px-[10px] t-rounded-[6px] t-bg-[#F3F4F8] t-border-solid t-border-[#C4C6C9B3] hover:t-border-[#2D6EFF] hover:t-bg-[#EEF3FF] t-border-[1px] t-text-[#1C1D1F]";

    // 创建或更新下载按钮的函数
    function createOrUpdateDownloadButton() {
        // 1. 查找页面上的关键元素
        const regenerateBtn = document.querySelector('p.regenerate-btn');
        const videoSource = document.querySelector('div.video-center video > source');

        // 如果 "Regenerate" 按钮或视频源还未加载，则退出
        if (!regenerateBtn || !videoSource || !videoSource.src) {
            return;
        }

        const videoUrl = videoSource.src;

        // 2. 查找我们自己创建的下载按钮
        let downloadBtn = document.getElementById(SCRIPT_ID);

        // 3. 如果下载按钮不存在，就创建一个
        if (!downloadBtn) {
            downloadBtn = document.createElement('a');
            downloadBtn.id = SCRIPT_ID;
            downloadBtn.className = BUTTON_CLASSES;
            downloadBtn.style.marginLeft = '10px'; // 添加一点左边距
            downloadBtn.innerHTML = `<span class="t-text-[12px] t-text-[#1C1D1F]">下载视频</span>`;

            // 将新按钮插入到 "Regenerate" 按钮的后面
            regenerateBtn.insertAdjacentElement('afterend', downloadBtn);
            console.log('下载按钮已创建。');
        }

        // 4. 更新按钮的链接和下载文件名
        // 无论按钮是新建的还是已存在的，都更新其链接以确保它指向最新的视频
        downloadBtn.href = videoUrl;
        downloadBtn.setAttribute('download', 'topmediai-video.mp4'); // 设置默认下载文件名
    }

    // --- 核心逻辑 ---
    // 网站内容是动态加载的，所以我们需要监视DOM的变化
    // 当检测到页面元素变化时，就尝试执行创建/更新按钮的函数
    const observer = new MutationObserver(createOrUpdateDownloadButton);

    // 配置观察器以监视整个文档的子元素变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('TopMediAI 下载脚本已启动，正在等待视频元素加载...');
})();
