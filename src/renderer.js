/**
 * Copyright (c) 2022 Hydrogen Team. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const { ipcRenderer } = require("electron");
const fs = require("fs");
const info = require("../../package.json");

fs.readFile(process.env.SETTINGS_PATH, { encoding: "utf-8" }, (err, obj) => {
    const SettingsObject = JSON.parse(obj);

    if (typeof SettingsObject.theme !== "undefined") {
        document.body.classList.add(`theme-${SettingsObject.theme}`);
    }
});

console.log("%cHydrogen", "color: #7eaef1; font-size: 4em; font-weight: 700;");
console.log(`%cVersion: ${info.version}`, "color: #4d9fcc; font-size: 1.5em; font-weight: 400;");

document.body.classList.add("window-focused");

switch (process.platform) {
    case "darwin":
        document.body.classList.add(`platform-osx`);
        break;
    case "win32":
        document.body.classList.add(`platform-win`);
        break;
    case "linux":
        document.body.classList.add(`platform-lin`);
        break;
}

const byId = function (id) {
    return document.getElementById(id);
};

ipcRenderer.on("recFocus", (event, message) => {
    document.body.classList.add("window-focused");
});

ipcRenderer.on("recUnfocus", (event, message) => {
    document.body.classList.remove("window-focused");
});

const back = byId("back");
const forward = byId("forward");
const refresh = byId("refresh");
const home = byId("home");
const dev = byId("console");
const options = byId("settings");
const omni = byId("url");
const history = byId("history");

omni.addEventListener("contextmenu", () => {
    ipcRenderer.invoke("suggestionPopup");
});

function reloadView() {
    ipcRenderer.invoke("reloadView");
}

function historyPopup() {
    ipcRenderer.invoke("historyPopup");
}

function backView() {
    ipcRenderer.invoke("goBackView");
}

function forwardView() {
    ipcRenderer.invoke("goForwardView");
}

function goHome() {
    ipcRenderer.invoke("goHomeView");
}

async function updateURL(event) {
    ipcRenderer.invoke("updateURL", event.keyCode);
    const e = await ipcRenderer.invoke("checkStringHasExtension", event.target.value);
}

function handleUrl(event) {
    ipcRenderer.invoke("handleUrl", event);
}

function handleDevtools() {
    ipcRenderer.invoke("handleDevtools");
}

function devToolsContextMenu() {
    ipcRenderer.invoke("devToolsContextMenu");
}

function updateNav(event) {
    ipcRenderer.invoke("updateNav", event);
}

function settings() {
    ipcRenderer.invoke("settings");
}
function historyUpdate() {
    ipcRenderer.invoke("history");
}

function optionsMenu() {
    ipcRenderer.invoke("settingsContextMenu");
}

refresh.addEventListener("click", reloadView);
back.addEventListener("click", backView);
forward.addEventListener("click", forwardView);
home.addEventListener("click", goHome);
omni.addEventListener("keydown", updateURL);
dev.addEventListener("click", handleDevtools);
dev.addEventListener("contextmenu", devToolsContextMenu);
options.addEventListener("click", settings);
options.addEventListener("contextmenu", optionsMenu);
history.addEventListener("click", historyUpdate);
history.addEventListener("contextmenu", historyPopup);
