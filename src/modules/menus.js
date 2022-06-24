/**
 * Copyright (c) 2022 Hydrogen Team. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const { Menu, app } = require("electron");
const fs = require("fs");
const path = require("path");

const NavigationManager = require("./navigation");

const isMac = process.platform === "darwin";
const settingsPage = path.join(__dirname, "../page", "settings.html");

module.exports = new (class MenuManager {
    initialise(view, win) {
        this.view = view;
        this.win = win;
    }

    get settingsTemplate() {
        return [
            {
                label: "Open Settings",
                click: () => {
                    this.view.webContents.loadFile(settingsPage);
                },
            },
            { type: "separator" },
            {
                label: "View Official Site",
                click: () => {
                    NavigationManager.updateURL(13, "https://hydrogen.app");
                },
            },
            { type: "separator" },
            {
                label: "View",
                type: "submenu",
                submenu: [
                    {
                        label: "Back",
                        enabled: this.view.webContents.canGoBack(),
                        click: () => {
                            this.view.webContents.goBack();
                        },
                    },
                    {
                        label: "Forward",
                        enabled: this.view.webContents.canGoForward(),
                        click: () => {
                            this.view.webContents.goForward();
                        },
                    },
                    {
                        label: "Reload",
                        click: () => {
                            this.view.webContents.reload();
                        },
                    },
                    { type: "separator" },
                    {
                        label: "Select All",
                        role: "selectAll",
                        click: () => {
                            this.view.webContents.selectAll();
                        },
                    },
                    {
                        label: "Go Home",
                        click: () => {
                            NavigationManager.goHome();
                        },
                    },
                    { type: "separator" },
                    {
                        label: "Increase Zoom",
                        click: () => {
                            this.view.webContents.setZoomFactor(view.webContents.zoomFactor + 0.1);
                        },
                    },
                    {
                        label: "Decrease Zoom",
                        click: () => {
                            this.view.webContents.setZoomFactor(view.webContents.zoomFactor - 0.1);
                        },
                    },
                    { type: "separator" },
                    {
                        label: "View Page Source",
                        click: () => {
                            NavigationManager.updateURL(13, `view-source:${view.webContents.getURL()}`);
                        },
                    },
                    {
                        label: "Inspect",
                        click: () => {
                            NavigationManager.handleDevtools();
                        },
                    },
                ],
                click: () => {
                    NavigationManager.updateURL(13, "");
                },
            },
            { type: "separator" },
            {
                label: "Quit Hydrogen",
                click: () => {
                    app.quit();
                },
            },
        ];
    }

    get applicationTemplate() {
        return [
            // { role: 'appMenu' }
            ...(isMac
                ? [
                      {
                          label: app.name,
                          submenu: [
                              { role: "about" },
                              { type: "separator" },
                              {
                                  label: "Preferences",
                                  click: () => {
                                      this.view.webContents.loadFile(settingsPage);
                                      NavigationManager.updateNav(null, "settings");
                                  },
                                  accelerator: "CommandOrControl+,",
                              },
                              { role: "services" },
                              { type: "separator" },
                              { role: "hide" },
                              { role: "hideOthers" },
                              { role: "unhide" },
                              { type: "separator" },
                              { role: "quit" },
                          ],
                      },
                  ]
                : []),
            // { role: 'editMenu' }
            {
                label: "Edit",
                submenu: [
                    { role: "undo" },
                    { role: "redo" },
                    { type: "separator" },
                    { role: "cut" },
                    { role: "copy" },
                    { role: "paste" },
                    ...(isMac
                        ? [
                              { role: "pasteAndMatchStyle" },
                              { role: "delete" },
                              { role: "selectAll" },
                              { type: "separator" },
                              {
                                  label: "Speech",
                                  submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
                              },
                          ]
                        : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
                ],
            },
            {
                label: "View",
                submenu: [
                    {
                        label: "Reload",
                        click: () => {
                            this.view.webContents.reload();
                        },
                        accelerator: "CommandOrControl+R",
                    },
                    { type: "separator" },
                    {
                        label: "Reset Zoom",
                        click: () => {
                            this.view.webContents.setZoomFactor(1);
                        },
                    },
                    {
                        label: "Zoom In",
                        click: () => {
                            this.view.webContents.setZoomFactor(view.webContents.zoomFactor + 0.1);
                        },
                        accelerator: "CommandOrControl+Plus",
                    },
                    {
                        label: "Zoom Out",
                        click: () => {
                            this.view.webContents.setZoomFactor(view.webContents.zoomFactor - 0.1);
                        },
                        accelerator: "CommandOrControl+-",
                    },
                    { type: "separator" },
                    { role: "togglefullscreen" },
                ],
            },
            // { role: 'windowMenu' }
            {
                label: "Window",
                submenu: [
                    { role: "quit" },
                    { role: "close" },
                    { type: "separator" },
                    { role: "minimize" },
                    { role: "zoom" },
                    ...(isMac ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }] : [{ role: "close" }]),
                ],
            },
            {
                label: "Developer",
                submenu: [
                    {
                        label: "MDN Web Docs",
                        click: () => {
                            NavigationManager.updateURL(13, "https://developer.mozilla.org/en-US/");
                        },
                        accelerator: "CommandOrControl+Shift+Alt+M",
                    },
                    ...(isMac
                        ? [
                              {
                                  label: "Toggle Developer Tools",
                                  click: () => {
                                      this.view.webContents.toggleDevTools();
                                  },
                                  accelerator: "CommandOrControl+Alt+I",
                              },
                          ]
                        : [
                              {
                                  label: "Toggle Developer Tools",
                                  click: () => {
                                      this.view.webContents.toggleDevTools();
                                  },
                                  accelerator: "CommandOrControl+Shift+I",
                              },
                          ]),
                ],
            },
        ];
    }

    get historyTemplate() {
        return [
            {
                label: "Clear History",
                click: () => {
                    fs.writeFileSync(process.env.HISTORY_PATH, "[]");
                    this.view.webContents.clearHistory();
                    this.view.webContents.reload();
                },
            },
            { type: "separator" },
            {
                label: "Advanced",
                type: "submenu",
                submenu: [
                    {
                        label: "Clear History",
                        click: () => {
                            fs.writeFileSync(process.env.HISTORY_PATH, "[]");
                            this.view.webContents.clearHistory();
                            this.view.webContents.reload();
                        },
                    },
                    {
                        label: "Clear Cache",
                        click: () => {
                            this.view.webContents.session.clearCache();
                            this.view.webContents.reload();
                        },
                    },
                    {
                        label: "Clear Storage",
                        click: () => {
                            fs.writeFileSync(process.env.HISTORY_PATH, "[]");
                            this.view.webContents.session.clearStorageData();
                            this.view.webContents.reload();
                        },
                    },
                ],
            },
        ];
    }
    devToolsTemplate = [
        {
            label: "Open for View",
            click: () => {
                NavigationManager.handleDevtools();
            },
        },
        {
            label: "Open for Window",
            click: () => {
                this.win.webContents.openDevTools({ mode: "detach" });
            },
        },
    ];

    get applicationMenu() {
        return Menu.buildFromTemplate(this.applicationTemplate);
    }
    get historyMenu() {
        return Menu.buildFromTemplate(this.historyTemplate);
    }
    get settingsMenu() {
        return Menu.buildFromTemplate(this.settingsTemplate);
    }
    get devToolsMenu() {
        return Menu.buildFromTemplate(this.devToolsTemplate);
    }
})();
