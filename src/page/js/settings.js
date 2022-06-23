/**
 * Copyright (c) 2022 Hydrogen Team. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const saveButton = document.getElementById("save-button");

let settingsOBJ;

saveButton.setAttribute("clicked", true);

document.addEventListener("change", (event) => {
    saveButton.removeAttribute("clicked");

    settingsOBJ = {
        theme: document.getElementById("theme").value,
        fontSize: document.getElementById("font-size").value,
        startPage: document.getElementById("start-page").value,
        searchEngine: document.getElementById("search-engine").value,
    };
});

saveButton.addEventListener("click", () => {
    saveButton.setAttribute("clicked", true);

    console.log(`_hydrogenInternal_message::SETTINGSUPDATE${JSON.stringify(settingsOBJ)}`);
});
