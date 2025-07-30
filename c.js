// ==UserScript==
// @name         智能填充系统
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  自动填充方案
// @match        *://kie.ai/*
// @match        *://tryveo3.ai/*
// @match        *://veo3.bot/*

// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      co.taotile.ltd
// ==/UserScript==

(function() {
    'use strict';

    // 配置常量
    const CONFIG = {
        password: "aigc123456",
        remoteRulesUrl: "https://co.taotile.ltd/al.txt",
        fallbackRules: [""] // 备用本地规则
    };

    // 1. 增强元素查找（支持重试）
    const findInput = async (selector) => {
        let retry = 0;
        while (retry < 5) {
            const el = document.querySelector(selector);
            if (el) return el;
            await new Promise(r => setTimeout(r, 500));
            retry++;
        }
        return null;
    };

    // 2. 核弹级填充方法
    const nuclearFill = async (element, value) => {
        try {
            // 原生方式设置值
            Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype, "value"
            ).set.call(element, value);

            // 触发所有必要事件
            ['input', 'change', 'blur'].forEach(ev => {
                element.dispatchEvent(new Event(ev, {
                    bubbles: true,
                    cancelable: false
                }));
            });
            return true;
        } catch (e) {
            console.error('填充失败:', e);
            return false;
        }
    };

    // 3. 远程规则验证
    const verifyEmailPrefix = async (prefix) => {
        try {
            // 尝试获取远程规则
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: CONFIG.remoteRulesUrl + '?t=' + Date.now(),
                    onload: resolve,
                    onerror: reject
                });
            });

            if (response.status === 200) {
                const remoteRules = response.responseText
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean);

                // 验证规则：特殊前缀需完全匹配，其他前缀匹配开头
                return remoteRules.some(rule => {
                    if (rule.startsWith("chh") || rule.startsWith("cxianyu")) {
                        return prefix === rule;
                    }
                    return prefix.startsWith(rule);
                });
            }
        } catch (error) {
            console.warn('远程验证失败，使用本地规则:', error);
        }

        // 本地备用验证
        return CONFIG.fallbackRules.some(rule => prefix.startsWith(rule));
    };

    // 4. 主填充流程
    const performAutoFill = async () => {
        // 获取关键元素
        const elements = {
            email: await findInput('input[type="email"], input[placeholder*="mail"]'),
            username: await findInput('input[name="nickname"], input[placeholder*="user"]'),
            password: await findInput('input[type="password"][name="password"]'),
            confirm: await findInput('input[type="password"][name="confirmPassword"]')
        };

        // 验证元素是否存在
        if (!elements.email) {
            console.error('邮箱输入框未找到');
            return;
        }

        // 提取邮箱前缀
        const email = elements.email.value.trim();
        if (!email.includes('@')) return;
        const prefix = email.split('@')[0];

        // 验证邮箱前缀
        const isValid = await verifyEmailPrefix(prefix);
        if (!isValid) {
            GM_notification({
                title: '验证失败',
                text: `邮箱前缀 "${prefix}" 不在允许列表中`,
                timeout: 3000
            });
            return;
        }

        // 执行填充
        const results = await Promise.all([
            nuclearFill(elements.email, email),
            elements.username && nuclearFill(elements.username, prefix),
            elements.password && nuclearFill(elements.password, CONFIG.password),
            elements.confirm && nuclearFill(elements.confirm, CONFIG.password)
        ]);

        if (results.every(r => r !== false)) {
            console.log('✅ 自动填充完成', {
                email,
                username: prefix,
                password: CONFIG.password
            });
        }
    };

    // 5. 智能监听策略
    const setupObserver = () => {
        // 立即尝试一次
        performAutoFill();

        // 监听邮箱输入变化
        const emailObserver = new MutationObserver(() => {
            const emailInput = document.querySelector('input[type="email"]');
            if (emailInput && !emailInput.dataset.autoFillBound) {
                emailInput.dataset.autoFillBound = true;
                emailInput.addEventListener('blur', performAutoFill);
            }
        });

        emailObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // 启动执行
    if (document.readyState === 'complete') {
        setTimeout(setupObserver, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(setupObserver, 1000);
        });
    }
})();
