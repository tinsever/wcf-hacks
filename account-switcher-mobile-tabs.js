(function() {
    try {
        require(['WoltLabSuite/Core/Ui/Page/Menu/User'], (PageMenuUser) => {
            const TargetClass = PageMenuUser.PageMenuUser || PageMenuUser.default;
            if (!TargetClass) return;

            const originalBuild = TargetClass.prototype.buildTabMenu;
            TargetClass.prototype.buildTabMenu = function() {
                const container = originalBuild.apply(this, arguments);
                const tabList = container.querySelector('.pageMenuUserTabList');
                
                if (tabList && window.innerWidth <= 1024) {
                    const tab = document.createElement("button");
                    tab.className = "pageMenuUserTab";
                    tab.id = "wcfCustomSwitchTab";
                    tab.type = "button";
                    tab.setAttribute('role', 'tab');
                    tab.setAttribute('aria-selected', 'false');
                    tab.innerHTML = '<fa-icon size="32" name="people-arrows" solid></fa-icon>';
                    
                    const panel = document.createElement("div");
                    panel.className = "pageMenuUserTabPanel";
                    panel.hidden = true;

                    panel.innerHTML = `
                        <div class="userMenu" tabindex="-1">
                            <div class="userMenuHeader">
                                <div class="userMenuTitle">Verlinkte Accounts</div>
                                <div class="userMenuButtons">
                                    <a href="https://www.your-forum-url.test/account-switch-add/" class="userMenuButton">
                                        <fa-icon size="24" name="plus" solid></fa-icon>
                                    </a>
                                </div>
                            </div>
                            <div class="userMenuContent userMenuContentScrollable"></div>
                            <div class="userMenuFooter">
                                <a href="https://www.your-forum-url.test/account-switch-accounts/" class="userMenuFooterLink">Alle Verlinkungen anzeigen</a>
                            </div>
                        </div>`;

                    this.tabs.push(tab);
                    this.tabPanels.set(tab, panel);

                    tab.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.openTab(tab); 
                    });

                    tabList.appendChild(tab);
                    container.appendChild(panel);
                    
                    fetchAccounts(panel);
                }
                return container;
            };
        });
    } catch (e) {}

    async function fetchAccounts(panel) {
        const token = document.querySelector('.xsrfTokenInput')?.value;
        if (!token) return;
        const response = await fetch(`https://www.your-forum-url.test/index.php?ajax-proxy/&t=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
            body: new URLSearchParams({
                actionName: "getAccountSwitchUserList",
                className: "wcf\\data\\user\\AccountSwitchUserAction",
                t: token
            })
        });
        const result = await response.json();
        const accounts = result.returnValues?.data || [];
        const html = accounts.map(acc => `
            <div class="userMenuItem">
                <div class="userMenuItemImage">${acc.image}</div>
                <div class="userMenuItemContent">
                    <a class="userMenuItemLink" href="${acc.link}">${acc.content}</a>
                    <div class="userMenuItemMeta"><div>${acc.rank}</div></div>
                </div>
            </div>`).join('');
        
        panel.querySelector('.userMenuContent').innerHTML = html || '<div class="userMenuContentStatus">Keine Accounts verknüpft</div>';
    }
})();
