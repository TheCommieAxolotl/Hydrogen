/**
 * Copyright (c) 2022 Hydrogen Team. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const { app, contextBridge, BrowserWindow, BrowserView, nativeImage, Menu, MenuItem, ipcMain, session, clipboard, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
app.name = "Hydrogen";

const NavigationManager = require("./modules/navigation");
const MenuManager = require("./modules/menus");

let win;

process.env.SETTINGS_PATH = path.join(__dirname, "../", "data", "settings.json");
process.env.HISTORY_PATH = path.join(__dirname, "../", "data", "history.txt");
if (!fs.existsSync(process.env.SETTINGS_PATH)) {
    fs.writeFileSync(process.env.SETTINGS_PATH, "{}");
}
if (!fs.existsSync(process.env.HISTORY_PATH)) {
    fs.writeFileSync(process.env.HISTORY_PATH, "[]");
}

const createWindow = () => {
    win = new BrowserWindow({
        minWidth: 300,
        minHeight: 300,
        resizable: true,
        titleBarStyle: "hidden",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: false,
            nodeIntegration: true,
        },
        show: false,
    });

    const view = new BrowserView();
    win.setBrowserView(view);
    view.setBounds({ x: 0, y: 115, width: 800, height: 516 });
    view.setAutoResize({ width: true, height: true });

    NavigationManager.initialise(view, win);
    NavigationManager.goHome();
    MenuManager.initialise(view, win);

    let se = "duckduckgo";

    fs.readFile(process.env.SETTINGS_PATH, { encoding: "utf-8" }, (err, obj) => {
        const SettingsObject = JSON.parse(obj);

        if (SettingsObject.searchEngine) {
            se = SettingsObject.searchEngine;
        }

        NavigationManager.updateSearchEngine(se);
    });

    function getBlobFromURL(url) {
        return new Promise(function (resolve, reject) {
            https.get(url, (resp) => {
                let data = [];
                resp.on("data", (chunk) => {
                    data.push(chunk);
                });
                resp.on("end", () => {
                    resolve(Buffer.concat(data));
                });
            });
        });
    }

    view.webContents.on("console-message", (event, level, message, line, sourceId) => {
        if (sourceId.includes(path.join(__dirname, "page/js", "settings.js"))) {
            if (message.includes("_hydrogenInternal_message::")) {
                if (message.includes("SETTINGSUPDATE")) {
                    fs.writeFileSync(process.env.SETTINGS_PATH, message.replace("_hydrogenInternal_message::SETTINGSUPDATE", ""), { spaces: 2 });
                    const obj = JSON.parse(message.replace("_hydrogenInternal_message::SETTINGSUPDATE", ""));
                    NavigationManager.updateSearchEngine(obj.searchEngine);
                    win.webContents.reload();
                }
            }
        }
    });

    view.webContents.on("page-title-updated", (event, title) => {
        win.setTitle(`${title} - Hydrogen`);
        win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "${title} - Hydrogen"`);
    });

    view.webContents.on("page-favicon-updated", (event, favicons) => {
        console.log(favicons);
        // prettier-ignore
        win.webContents.executeJavaScript(`if (document.querySelector("#omnibox svg")) {const e = document.querySelector("#omnibox svg");e.insertAdjacentHTML("beforebegin", '<img src="${favicons[0]}"/>');e.remove();} else {const e = document.querySelector("#omnibox img");e.insertAdjacentHTML("beforebegin", '<img src="${favicons[0]}"/>');e.remove(); }`);
    });

    view.webContents.on("did-change-theme-color", (event, color) => {
        win.webContents.executeJavaScript(`document.querySelector(".indicator").style.width = "100vw"`);
        win.webContents.executeJavaScript(`document.querySelector(".indicator").style.backgroundColor = "${color}"`);
    });

    view.webContents.on(
        "context-menu",
        (event, click) => {
            event.preventDefault();
            const pageMenu = new Menu();

            if (click.dictionarySuggestions.length) {
                for (const suggestion of click.dictionarySuggestions) {
                    pageMenu.append(
                        new MenuItem({
                            label: suggestion,
                            click: () => view.webContents.replaceMisspelling(suggestion),
                        })
                    );
                }
                pageMenu.append(new MenuItem({ type: "separator" }));
            }
            if (click.misspelledWord) {
                pageMenu.append(
                    new MenuItem({
                        label: "Add to dictionary",
                        click: () => view.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
                    })
                );
            }
            if (click.misspelledWord || click.dictionarySuggestions.length) {
                pageMenu.append(new MenuItem({ type: "separator" }));
            }
            if (click.srcURL) {
                pageMenu.append(
                    new MenuItem({
                        label: "Save Image As",
                        click: async () => {
                            const filename = await dialog.showSaveDialog(view, {
                                buttonLabel: "Save",
                                defaultPath: `${app.getPath("downloads")}/download.png`,
                                filters: [
                                    {
                                        name: "Images",
                                        extensions: ["png", "jpeg"],
                                    },
                                    {
                                        name: "All Files",
                                        extensions: ["*"],
                                    },
                                ],
                                properties: ["openDirectory", "createDirectory"],
                            });

                            let image;
                            click.srcURL.includes("data:image")
                                ? (image = nativeImage.createFromDataURL(click.srcURL))
                                : (image = nativeImage.createFromBuffer(await getBlobFromURL(click.srcURL)));

                            if (image.isEmpty()) {
                                return dialog.showErrorBox("Error Saving Image", "Image could not be loaded");
                            }
                            fs.writeFile(filename.filePath, image.toPNG(), (err) => {
                                if (err) {
                                    dialog.showErrorBox("Error", err.message);
                                }
                            });
                        },
                    })
                );
                pageMenu.append(
                    new MenuItem({
                        label: "Copy Image",
                        click: async () => {
                            let image;
                            click.srcURL.includes("data:image")
                                ? (image = nativeImage.createFromDataURL(click.srcURL))
                                : (image = nativeImage.createFromBuffer(await getBlobFromURL(click.srcURL)));

                            if (image.isEmpty()) {
                                return dialog.showErrorBox("Error Saving Image", "Image could not be loaded");
                            }
                            clipboard.writeImage(image);
                        },
                    })
                );
                pageMenu.append(
                    new MenuItem({
                        label: "Copy Image URL",
                        click: () => {
                            clipboard.writeText(click.srcURL);
                        },
                    })
                );
                pageMenu.append(new MenuItem({ type: "separator" }));
            }
            if (click.linkURL) {
                pageMenu.append(
                    new MenuItem({
                        label: "Open Link",
                        click: () => {
                            NavigationManager.updateURL(13, click.linkURL);
                        },
                    })
                );
                pageMenu.append(
                    new MenuItem({
                        label: "Copy Link",
                        click: () => {
                            clipboard.writeText(click.linkURL);
                        },
                    })
                );
                pageMenu.append(new MenuItem({ type: "separator" }));
            }
            if (click.selectionText) {
                click.editFlags.canCopy &&
                    pageMenu.append(
                        new MenuItem({
                            label: "Copy",
                            role: "copy",
                            accelerator: "CommandOrControl+c",
                        })
                    );
                click.editFlags.canPaste &&
                    pageMenu.append(
                        new MenuItem({
                            label: "Paste",
                            role: "paste",
                            accelerator: "CommandOrControl+v",
                        })
                    );
                click.editFlags.canCut &&
                    pageMenu.append(
                        new MenuItem({
                            label: "Cut",
                            role: "cut",
                            accelerator: "CommandOrControl+x",
                        })
                    );
                click.editFlags.canSelectAll &&
                    pageMenu.append(
                        new MenuItem({
                            label: "Select All",
                            role: "selectall",
                            accelerator: "CommandOrControl+a",
                        })
                    );
                click.editFlags.canDelete &&
                    pageMenu.append(
                        new MenuItem({
                            label: "Delete",
                            role: "delete",
                        })
                    );
                pageMenu.append(new MenuItem({ type: "separator" }));
            }
            pageMenu.append(
                new MenuItem({
                    label: "Back",
                    enabled: view.webContents.canGoBack(),
                    click: () => {
                        view.webContents.goBack();
                    },
                })
            );
            pageMenu.append(
                new MenuItem({
                    label: "Forward",
                    enabled: view.webContents.canGoForward(),
                    click: () => {
                        view.webContents.goForward();
                    },
                })
            );
            pageMenu.append(
                new MenuItem({
                    label: "Reload",
                    click: () => {
                        view.webContents.reload();
                    },
                })
            );
            pageMenu.append(
                new MenuItem({
                    label: "Go Home",
                    click: () => {
                        NavigationManager.goHome();
                    },
                })
            );
            pageMenu.append(new MenuItem({ type: "separator" }));
            pageMenu.append(
                new MenuItem({
                    label: "Zoom In",
                    click: () => {
                        view.webContents.setZoomFactor(view.webContents.zoomFactor + 0.1);
                    },
                    accelerator: "CommandOrControl+Plus",
                })
            );
            pageMenu.append(
                new MenuItem({
                    label: "Zoom Out",
                    click: () => {
                        view.webContents.setZoomFactor(view.webContents.zoomFactor - 0.1);
                    },

                    accelerator: "CommandOrControl+-",
                })
            );
            pageMenu.append(new MenuItem({ type: "separator" }));
            pageMenu.append(
                new MenuItem({
                    label: "View Page Source",
                    click: () => {
                        NavigationManager.updateURL(13, `view-source:${view.webContents.getURL()}`);
                    },
                })
            );
            pageMenu.append(
                new MenuItem({
                    label: "Inspect Element",
                    click: () => {
                        view.webContents.inspectElement(click.x, click.y);
                    },
                })
            );
            pageMenu.popup(view.webContents);
        },
        false
    );

    view.webContents.on("did-start-loading", (e) => {
        NavigationManager.updateNav(e);
        if (view.webContents.getURL().includes("src/page/settings.html")) {
            win.setTitle("Settings - Hydrogen");
        }
        win.webContents.executeJavaScript(`document.querySelector(".indicator").style.width = "${Math.random() * 15}vw"`); // TODO: Replace Math.random with an actual progress indicator
        win.webContents.executeJavaScript(`document.querySelector(".indicator").style.backgroundColor = ""`);
    });
    view.webContents.on("did-stop-loading", (e) => {
        NavigationManager.updateNav(e);
        win.webContents.executeJavaScript(`document.querySelector(".indicator").style.width = "100vw"`);
        win.webContents.executeJavaScript(`document.querySelector(".indicator").style.backgroundColor = "transparent"`);
        setTimeout(() => {
            win.webContents.executeJavaScript(`document.querySelector(".indicator").style.width = "0vw"`);
        }, 500);
    });
    view.webContents.on("did-fail-load", (e) => {
        view.webContents.loadFile(path.join(__dirname, "page", "error.html"));
        NavigationManager.updateNav(null, "error");
        setTimeout(() => {
            win.webContents.executeJavaScript(`document.querySelector(".indicator").style.width = "100vw"`);
            win.webContents.executeJavaScript(`document.querySelector(".indicator").style.backgroundColor = "#eb6868"`);
        }, 800);
    });
    view.webContents.setWindowOpenHandler((e) => {
        NavigationManager.updateURL(13, e.url);
        return { action: "deny" };
    });
    ipcMain.handle("reloadView", async (event, arg) => {
        return NavigationManager.reloadView();
    });

    ipcMain.handle("checkStringHasExtension", async (event, arg) => {
        return NavigationManager.checkStringHasExtension(arg);
    });

    ipcMain.handle("goBackView", async (event, arg) => {
        return NavigationManager.backView();
    });

    ipcMain.handle("goForwardView", async (event, arg) => {
        return NavigationManager.forwardView();
    });

    ipcMain.handle("goHomeView", async (event, arg) => {
        return NavigationManager.goHome();
    });

    ipcMain.handle("handleBackAttribute", async (event, arg) => {
        return NavigationManager.handleBackAttribute();
    });

    ipcMain.handle("handleForwardAttribute", async (event, arg) => {
        return NavigationManager.handleForwardAttribute();
    });

    ipcMain.handle("updateURL", async (event, arg) => {
        return NavigationManager.updateURL(arg);
    });

    ipcMain.handle("handleUrl", async (event, arg) => {
        return NavigationManager.handleUrl(arg);
    });

    ipcMain.handle("handleDevtools", async (event, arg) => {
        return NavigationManager.handleDevtools();
    });

    ipcMain.handle("updateNav", async (event, arg) => {
        return NavigationManager.updateNav(arg);
    });

    ipcMain.handle("checkSpecialURLs", async (event, arg) => {
        return NavigationManager.checkSpecialURLs(arg);
    });

    ipcMain.handle("zoomIn", async (event, arg) => {
        return view.webContents.setZoomFactor(view.webContents.zoomFactor + 0.1);
    });

    ipcMain.handle("zoomOut", async (event, arg) => {
        return view.webContents.setZoomLevel(view.webContents.zoomLevel - 0.1);
    });

    ipcMain.handle("clearHistory", async (event, arg) => {
        view.webContents.clearHistory();
        fs.writeFileSync(process.env.HISTORY_PATH, "[]");
        return NavigationManager.reloadView();
    });

    const settingsPage = path.join(__dirname, "page", "settings.html");

    ipcMain.handle("settings", (event, arg) => {
        view.webContents.loadFile(settingsPage);
        NavigationManager.updateNav(null, "settings");
    });

    ipcMain.handle("history", (event, arg) => {
        view.webContents.loadFile(path.join(__dirname, "page", "history.html"));
        NavigationManager.updateNav(null, "history");
    });

    ipcMain.handle("suggestionPopup", (event, arg) => {
        const menu = new Menu();
        fs.readFile(process.env.HISTORY_PATH, { encoding: "utf-8" }, async (err, data) => {
            const historyArray = JSON.parse(data);
            const e = await historyArray.some(async (e) => {
                return e.url.includes((await win.webContents.executeJavaScript(`document.querySelector("#url").value`)) || "ohu1goyfit7dru67se56");
            });
            if (e) {
                await historyArray.forEach(async (element) => {
                    const startsWith = element.url?.includes(await win.webContents.executeJavaScript(`document.querySelector("#url").value`));
                    if (startsWith) {
                        menu.append(
                            new MenuItem({
                                label: element.title || element.url,
                                click: () => {
                                    NavigationManager.updateURL(13, element.url);
                                },
                            })
                        );
                    }
                });
                setTimeout(() => {
                    menu.popup(win.webContents);
                }, 200);
            }
        });
    });

    ipcMain.handle("devToolsContextMenu", (event, arg) => {
        MenuManager.devToolsMenu.popup(view.webContents);
    });

    ipcMain.handle("settingsContextMenu", async (event, arg) => {
        MenuManager.settingsMenu.popup(win.webContents);
    });

    ipcMain.handle("historyPopup", async (event, arg) => {
        MenuManager.historyMenu.popup(win.webContents);
    });

    win.webContents.on("new-window", (event, url) => {
        if (url.includes(__dirname)) {
            return;
        }

        event.preventDefault();
        view.webContents.loadURL(url);
    });

    app.once("ready", () => {
        contextBridge.exposeInMainWorld("view", view);
    });

    win.loadFile("src/page/index.html");

    win.on("focus", () => {
        win.webContents.send("recFocus");
    });

    win.on("blur", () => {
        win.webContents.send("recUnfocus");
    });

    win.once("ready-to-show", () => {
        win.show();
    });

    win.on("closed", function () {
        win = null;
    });

    ipcMain.handle("setTitle", (event, arg) => {
        win.setTitle(`${arg} - Hydrogen`);
    });

    Menu.setApplicationMenu(MenuManager.applicationMenu);
};

app.whenReady().then(() => {
    createWindow();
    session.defaultSession.loadExtension(path.join(__dirname, "assets", "builtins", "hydrogen-devtools"));

    ipcMain.handle("new-win", () => {
        createWindow();
    });
});

app.on("window-all-closed", () => {
    app.quit();
});
