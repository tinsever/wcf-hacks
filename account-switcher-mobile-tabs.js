(function() {
    const config = {
        enableSearch: true 
    };

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

                    const searchButtonHtml = config.enableSearch 
                        ? `<a class="userMenuButton wcfSearchToggleButton" style="cursor:pointer"><fa-icon size="24" name="search" solid></fa-icon></a>` 
                        : '';

                    const searchWrapperHtml = config.enableSearch 
                        ? `<div class="userMenuSearch wcfCustomSearchWrapper" style="display: none; padding: 10px 15px; background: var(--wcfContainerAccentBackground); border-bottom: 1px solid var(--wcfBorder)">
                               <input type="text" class="wcfCustomSearchInput" placeholder="Account suchen…" style="width: 100%; padding: 6px 10px; border: 1px solid var(--wcfInputBorder); border-radius: var(--wcfBorderRadius);">
                           </div>` 
                        : '';

                    panel.innerHTML = `
                        <div class="userMenu" tabindex="-1">
                            <div class="userMenuHeader">
                                <div class="userMenuTitle">Verlinkte Accounts</div>
                                <div class="userMenuButtons">
                                    ${searchButtonHtml}
                                    <a href="https://www.mein-forum.test/index.php?account-switch-add/" class="userMenuButton">
                                        <fa-icon size="24" name="plus" solid></fa-icon>
                                    </a>
                                </div>
                            </div>
                            ${searchWrapperHtml}
                            <div class="userMenuContent userMenuContentScrollable"></div>
                            <div class="userMenuFooter">
                                <a href="https://www.mein-forum.test/index.php?account-switch-accounts/" class="userMenuFooterLink">Alle Verlinkungen anzeigen</a>
                            </div>
                        </div>`;

                    this.tabs.push(tab);
                    this.tabPanels.set(tab, panel);

                    if (config.enableSearch) {
                        const searchWrapper = panel.querySelector('.wcfCustomSearchWrapper');
                        const searchInput = panel.querySelector('.wcfCustomSearchInput');
                        const toggleBtn = panel.querySelector('.wcfSearchToggleButton');

                        toggleBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const isHidden = searchWrapper.style.display === 'none';
                            searchWrapper.style.display = isHidden ? 'block' : 'none';
                            if (isHidden) searchInput.focus();
                        });

                        searchInput.addEventListener('input', (e) => {
                            const term = e.target.value.toLowerCase();
                            panel.querySelectorAll('.userMenuItem').forEach(item => {
                                const name = item.querySelector('.userMenuItemLink').textContent.toLowerCase();
                                item.hidden = !name.includes(term);
                            });
                        });
                    }

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
        const response = await fetch(`https://www.mein-forum.test/index.php?ajax-proxy/&t=${token}`, {
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
