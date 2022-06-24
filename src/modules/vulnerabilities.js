/**
 * Copyright (c) 2022 Hydrogen Team. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const https = require("https");

module.exports = function getVulnerabilities() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "thecommieaxolotl.netlify.app",
            path: "/687964726f67656e/data.json",
            method: "GET",
        };

        const req = https.request(options, (res) => {
            res.on("data", (d) => {
                const data = d.toString("utf-8");
                resolve(JSON.parse(data));
            });
        });

        req.on("error", (error) => {
            reject(error);
        });

        req.end();
    });
};
