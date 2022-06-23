/**
 * Copyright (c) 2022 Hydrogen Team. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

const fs = require("fs");
const path = require("path");

let timeout;
let timeout2 = 0;

module.exports = new (class NavigationManager {
    HOME_URL = "";

    SEARCH_ENGINES = {
        duckduckgo: "https://duckduckgo.com/?q=",
        google: "https://www.google.com/search?q=",
        bing: "https://www.bing.com/search?q=",
    };

    SEARCH_ENGINE_NAMES = {
        duckduckgo: "DuckDuckGo",
        google: "Google",
        bing: "Bing",
    };

    SEARCH_ENGINE_HOMEPAGES = {
        duckduckgo: "https://duckduckgo.com/",
        google: "https://www.google.com/",
        bing: "https://www.bing.com/",
    };

    SEARCH_ENGINE = "duckduckgo";
    SEARCH_ENGINE_URL = this.SEARCH_ENGINES[this.SEARCH_ENGINE];
    SEARCH_ENGINE_HOMEPAGE = this.SEARCH_ENGINE_HOMEPAGES[this.SEARCH_ENGINE];

    updateSearchEngine(searchEngine) {
        this.SEARCH_ENGINE = searchEngine;
        this.SEARCH_ENGINE_URL = this.SEARCH_ENGINES[searchEngine];
        this.SEARCH_ENGINE_HOMEPAGE = this.SEARCH_ENGINE_HOMEPAGES[searchEngine];

        this.win.webContents.executeJavaScript(`document.getElementById("url").placeholder = "Search with ${this.SEARCH_ENGINE_NAMES[this.SEARCH_ENGINE]} or Enter URL";0`);
    }

    async initialise(browserView, win) {
        this.browserView = browserView;
        this.webContents = browserView.webContents;
        this.win = win;

        this.SettingsPath = process.env.SETTINGS_PATH;

        if (this.SettingsPath !== undefined) {
            let data = fs.readFileSync(this.SettingsPath, { encoding: "utf-8" });

            const SettingsObject = JSON.parse(data);
            if (SettingsObject.searchEngine) {
                this.updateSearchEngine(SettingsObject.searchEngine);
            }

            if (SettingsObject.startPage) {
                this.HOME_URL = SettingsObject.startPage || this.SEARCH_ENGINE_HOMEPAGE;
            } else {
                this.HOME_URL = this.SEARCH_ENGINE_HOMEPAGE;
            }
        } else {
            this.HOME_URL = this.SEARCH_ENGINE_HOMEPAGE;
        }
    }

    reloadView() {
        this.webContents.reload();
    }

    backView() {
        this.webContents.goBack();
    }

    forwardView() {
        this.webContents.goForward();
    }

    goHome() {
        this.webContents.loadURL(this.HOME_URL);
    }

    handleBackAttribute() {
        if (this.webContents.canGoBack()) {
            return true;
        } else {
            return false;
        }
    }

    handleForwardAttribute() {
        if (this.webContents.canGoForward()) {
            return true;
        } else {
            return false;
        }
    }

    async updateURL(keyCode, url) {
        if (keyCode === 13) {
            this.win.webContents.executeJavaScript('document.getElementById("url").blur();0');
            let val = url || (await this.win.webContents.executeJavaScript('document.getElementById("url").value'));

            if (
                await this.win.webContents.executeJavaScript(`
                    document.getElementById("url").value.includes("about:blank") || document.getElementById("url").value.includes("about%blank")
                `)
            ) {
                this.webContents.loadFile(path.join(__dirname, "../", "page", "blank.html"));
                return this.updateNav(null, "Blank");
            } else if (
                await this.win.webContents.executeJavaScript(`
                    document.getElementById("url").value.includes("hydrogen:settings") || document.getElementById("url").value.includes("hydrogen%3Asettings")
                `)
            ) {
                this.webContents.loadFile(path.join(__dirname, "../", "page", "settings.html"));
                return this.updateNav(null, "Settings");
            } else if (
                await this.win.webContents.executeJavaScript(`
                    document.getElementById("url").value.includes("hydrogen:error") || document.getElementById("url").value.includes("hydrogen%3Aerror")
                `)
            ) {
                this.webContents.loadFile(path.join(__dirname, "../", "page", "error.html"));
                return this.updateNav(null, "error");
            } else if (
                await this.win.webContents.executeJavaScript(`
                    document.getElementById("url").value.includes("hydrogen:history") || document.getElementById("url").value.includes("hydrogen%3Ahistory")
                `)
            ) {
                this.webContents.loadFile(path.join(__dirname, "../", "page", "history.html"));
                return this.updateNav(null, "History");
            }

            if (val.includes(" ")) {
                return this.webContents.loadURL(this.SEARCH_ENGINE_URL + val.replaceAll(" ", "+"));
            }
            if (this.checkStringisURL(val) || this.checkStringHasAnyProtocol(val)) {
                this.webContents.loadURL(val);
            } else {
                if (this.checkStringHasExtension(val)) {
                    this.webContents.loadURL("http://" + val);
                } else {
                    this.webContents.loadURL(this.SEARCH_ENGINE_URL + val.replaceAll(" ", "+"));
                }
            }
        }
    }

    checkStringHasExtension(string) {
        const TLDEndings =
            "AAA\nAARP\nABARTH\nABB\nABBOTT\nABBVIE\nABC\nABLE\nABOGADO\nABUDHABI\nAC\nACADEMY\nACCENTURE\nACCOUNTANT\nACCOUNTANTS\nACO\nACTOR\nAD\nADAC\nADS\nADULT\nAE\nAEG\nAERO\nAETNA\nAF\nAFL\nAFRICA\nAG\nAGAKHAN\nAGENCY\nAI\nAIG\nAIRBUS\nAIRFORCE\nAIRTEL\nAKDN\nAL\nALFAROMEO\nALIBABA\nALIPAY\nALLFINANZ\nALLSTATE\nALLY\nALSACE\nALSTOM\nAM\nAMAZON\nAMERICANEXPRESS\nAMERICANFAMILY\nAMEX\nAMFAM\nAMICA\nAMSTERDAM\nANALYTICS\nANDROID\nANQUAN\nANZ\nAO\nAOL\nAPARTMENTS\nAPP\nAPPLE\nAQ\nAQUARELLE\nAR\nARAB\nARAMCO\nARCHI\nARMY\nARPA\nART\nARTE\nAS\nASDA\nASIA\nASSOCIATES\nAT\nATHLETA\nATTORNEY\nAU\nAUCTION\nAUDI\nAUDIBLE\nAUDIO\nAUSPOST\nAUTHOR\nAUTO\nAUTOS\nAVIANCA\nAW\nAWS\nAX\nAXA\nAZ\nAZURE\nBA\nBABY\nBAIDU\nBANAMEX\nBANANAREPUBLIC\nBAND\nBANK\nBAR\nBARCELONA\nBARCLAYCARD\nBARCLAYS\nBAREFOOT\nBARGAINS\nBASEBALL\nBASKETBALL\nBAUHAUS\nBAYERN\nBB\nBBC\nBBT\nBBVA\nBCG\nBCN\nBD\nBE\nBEATS\nBEAUTY\nBEER\nBENTLEY\nBERLIN\nBEST\nBESTBUY\nBET\nBF\nBG\nBH\nBHARTI\nBI\nBIBLE\nBID\nBIKE\nBING\nBINGO\nBIO\nBIZ\nBJ\nBLACK\nBLACKFRIDAY\nBLOCKBUSTER\nBLOG\nBLOOMBERG\nBLUE\nBM\nBMS\nBMW\nBN\nBNPPARIBAS\nBO\nBOATS\nBOEHRINGER\nBOFA\nBOM\nBOND\nBOO\nBOOK\nBOOKING\nBOSCH\nBOSTIK\nBOSTON\nBOT\nBOUTIQUE\nBOX\nBR\nBRADESCO\nBRIDGESTONE\nBROADWAY\nBROKER\nBROTHER\nBRUSSELS\nBS\nBT\nBUGATTI\nBUILD\nBUILDERS\nBUSINESS\nBUY\nBUZZ\nBV\nBW\nBY\nBZ\nBZH\nCA\nCAB\nCAFE\nCAL\nCALL\nCALVINKLEIN\nCAM\nCAMERA\nCAMP\nCANCERRESEARCH\nCANON\nCAPETOWN\nCAPITAL\nCAPITALONE\nCAR\nCARAVAN\nCARDS\nCARE\nCAREER\nCAREERS\nCARS\nCASA\nCASE\nCASH\nCASINO\nCAT\nCATERING\nCATHOLIC\nCBA\nCBN\nCBRE\nCBS\nCC\nCD\nCENTER\nCEO\nCERN\nCF\nCFA\nCFD\nCG\nCH\nCHANEL\nCHANNEL\nCHARITY\nCHASE\nCHAT\nCHEAP\nCHINTAI\nCHRISTMAS\nCHROME\nCHURCH\nCI\nCIPRIANI\nCIRCLE\nCISCO\nCITADEL\nCITI\nCITIC\nCITY\nCITYEATS\nCK\nCL\nCLAIMS\nCLEANING\nCLICK\nCLINIC\nCLINIQUE\nCLOTHING\nCLOUD\nCLUB\nCLUBMED\nCM\nCN\nCO\nCOACH\nCODES\nCOFFEE\nCOLLEGE\nCOLOGNE\nCOM\nCOMCAST\nCOMMBANK\nCOMMUNITY\nCOMPANY\nCOMPARE\nCOMPUTER\nCOMSEC\nCONDOS\nCONSTRUCTION\nCONSULTING\nCONTACT\nCONTRACTORS\nCOOKING\nCOOKINGCHANNEL\nCOOL\nCOOP\nCORSICA\nCOUNTRY\nCOUPON\nCOUPONS\nCOURSES\nCPA\nCR\nCREDIT\nCREDITCARD\nCREDITUNION\nCRICKET\nCROWN\nCRS\nCRUISE\nCRUISES\nCU\nCUISINELLA\nCV\nCW\nCX\nCY\nCYMRU\nCYOU\nCZ\nDABUR\nDAD\nDANCE\nDATA\nDATE\nDATING\nDATSUN\nDAY\nDCLK\nDDS\nDE\nDEAL\nDEALER\nDEALS\nDEGREE\nDELIVERY\nDELL\nDELOITTE\nDELTA\nDEMOCRAT\nDENTAL\nDENTIST\nDESI\nDESIGN\nDEV\nDHL\nDIAMONDS\nDIET\nDIGITAL\nDIRECT\nDIRECTORY\nDISCOUNT\nDISCOVER\nDISH\nDIY\nDJ\nDK\nDM\nDNP\nDO\nDOCS\nDOCTOR\nDOG\nDOMAINS\nDOT\nDOWNLOAD\nDRIVE\nDTV\nDUBAI\nDUNLOP\nDUPONT\nDURBAN\nDVAG\nDVR\nDZ\nEARTH\nEAT\nEC\nECO\nEDEKA\nEDU\nEDUCATION\nEE\nEG\nEMAIL\nEMERCK\nENERGY\nENGINEER\nENGINEERING\nENTERPRISES\nEPSON\nEQUIPMENT\nER\nERICSSON\nERNI\nES\nESQ\nESTATE\nET\nETISALAT\nEU\nEUROVISION\nEUS\nEVENTS\nEXCHANGE\nEXPERT\nEXPOSED\nEXPRESS\nEXTRASPACE\nFAGE\nFAIL\nFAIRWINDS\nFAITH\nFAMILY\nFAN\nFANS\nFARM\nFARMERS\nFASHION\nFAST\nFEDEX\nFEEDBACK\nFERRARI\nFERRERO\nFI\nFIAT\nFIDELITY\nFIDO\nFILM\nFINAL\nFINANCE\nFINANCIAL\nFIRE\nFIRESTONE\nFIRMDALE\nFISH\nFISHING\nFIT\nFITNESS\nFJ\nFK\nFLICKR\nFLIGHTS\nFLIR\nFLORIST\nFLOWERS\nFLY\nFM\nFO\nFOO\nFOOD\nFOODNETWORK\nFOOTBALL\nFORD\nFOREX\nFORSALE\nFORUM\nFOUNDATION\nFOX\nFR\nFREE\nFRESENIUS\nFRL\nFROGANS\nFRONTDOOR\nFRONTIER\nFTR\nFUJITSU\nFUN\nFUND\nFURNITURE\nFUTBOL\nFYI\nGA\nGAL\nGALLERY\nGALLO\nGALLUP\nGAME\nGAMES\nGAP\nGARDEN\nGAY\nGB\nGBIZ\nGD\nGDN\nGE\nGEA\nGENT\nGENTING\nGEORGE\nGF\nGG\nGGEE\nGH\nGI\nGIFT\nGIFTS\nGIVES\nGIVING\nGL\nGLASS\nGLE\nGLOBAL\nGLOBO\nGM\nGMAIL\nGMBH\nGMO\nGMX\nGN\nGODADDY\nGOLD\nGOLDPOINT\nGOLF\nGOO\nGOODYEAR\nGOOG\nGOOGLE\nGOP\nGOT\nGOV\nGP\nGQ\nGR\nGRAINGER\nGRAPHICS\nGRATIS\nGREEN\nGRIPE\nGROCERY\nGROUP\nGS\nGT\nGU\nGUARDIAN\nGUCCI\nGUGE\nGUIDE\nGUITARS\nGURU\nGW\nGY\nHAIR\nHAMBURG\nHANGOUT\nHAUS\nHBO\nHDFC\nHDFCBANK\nHEALTH\nHEALTHCARE\nHELP\nHELSINKI\nHERE\nHERMES\nHGTV\nHIPHOP\nHISAMITSU\nHITACHI\nHIV\nHK\nHKT\nHM\nHN\nHOCKEY\nHOLDINGS\nHOLIDAY\nHOMEDEPOT\nHOMEGOODS\nHOMES\nHOMESENSE\nHONDA\nHORSE\nHOSPITAL\nHOST\nHOSTING\nHOT\nHOTELES\nHOTELS\nHOTMAIL\nHOUSE\nHOW\nHR\nHSBC\nHT\nHU\nHUGHES\nHYATT\nHYUNDAI\nIBM\nICBC\nICE\nICU\nID\nIE\nIEEE\nIFM\nIKANO\nIL\nIM\nIMAMAT\nIMDB\nIMMO\nIMMOBILIEN\nIN\nINC\nINDUSTRIES\nINFINITI\nINFO\nING\nINK\nINSTITUTE\nINSURANCE\nINSURE\nINT\nINTERNATIONAL\nINTUIT\nINVESTMENTS\nIO\nIPIRANGA\nIQ\nIR\nIRISH\nIS\nISMAILI\nIST\nISTANBUL\nIT\nITAU\nITV\nJAGUAR\nJAVA\nJCB\nJE\nJEEP\nJETZT\nJEWELRY\nJIO\nJLL\nJM\nJMP\nJNJ\nJO\nJOBS\nJOBURG\nJOT\nJOY\nJP\nJPMORGAN\nJPRS\nJUEGOS\nJUNIPER\nKAUFEN\nKDDI\nKE\nKERRYHOTELS\nKERRYLOGISTICS\nKERRYPROPERTIES\nKFH\nKG\nKH\nKI\nKIA\nKIDS\nKIM\nKINDER\nKINDLE\nKITCHEN\nKIWI\nKM\nKN\nKOELN\nKOMATSU\nKOSHER\nKP\nKPMG\nKPN\nKR\nKRD\nKRED\nKUOKGROUP\nKW\nKY\nKYOTO\nKZ\nLA\nLACAIXA\nLAMBORGHINI\nLAMER\nLANCASTER\nLANCIA\nLAND\nLANDROVER\nLANXESS\nLASALLE\nLAT\nLATINO\nLATROBE\nLAW\nLAWYER\nLB\nLC\nLDS\nLEASE\nLECLERC\nLEFRAK\nLEGAL\nLEGO\nLEXUS\nLGBT\nLI\nLIDL\nLIFE\nLIFEINSURANCE\nLIFESTYLE\nLIGHTING\nLIKE\nLILLY\nLIMITED\nLIMO\nLINCOLN\nLINDE\nLINK\nLIPSY\nLIVE\nLIVING\nLK\nLLC\nLLP\nLOAN\nLOANS\nLOCKER\nLOCUS\nLOFT\nLOL\nLONDON\nLOTTE\nLOTTO\nLOVE\nLPL\nLPLFINANCIAL\nLR\nLS\nLT\nLTD\nLTDA\nLU\nLUNDBECK\nLUXE\nLUXURY\nLV\nLY\nMA\nMACYS\nMADRID\nMAIF\nMAISON\nMAKEUP\nMAN\nMANAGEMENT\nMANGO\nMAP\nMARKET\nMARKETING\nMARKETS\nMARRIOTT\nMARSHALLS\nMASERATI\nMATTEL\nMBA\nMC\nMCKINSEY\nMD\nME\nMED\nMEDIA\nMEET\nMELBOURNE\nMEME\nMEMORIAL\nMEN\nMENU\nMERCKMSD\nMG\nMH\nMIAMI\nMICROSOFT\nMIL\nMINI\nMINT\nMIT\nMITSUBISHI\nMK\nML\nMLB\nMLS\nMM\nMMA\nMN\nMO\nMOBI\nMOBILE\nMODA\nMOE\nMOI\nMOM\nMONASH\nMONEY\nMONSTER\nMORMON\nMORTGAGE\nMOSCOW\nMOTO\nMOTORCYCLES\nMOV\nMOVIE\nMP\nMQ\nMR\nMS\nMSD\nMT\nMTN\nMTR\nMU\nMUSEUM\nMUSIC\nMUTUAL\nMV\nMW\nMX\nMY\nMZ\nNA\nNAB\nNAGOYA\nNAME\nNATURA\nNAVY\nNBA\nNC\nNE\nNEC\nNET\nNETBANK\nNETFLIX\nNETWORK\nNEUSTAR\nNEW\nNEWS\nNEXT\nNEXTDIRECT\nNEXUS\nNF\nNFL\nNG\nNGO\nNHK\nNI\nNICO\nNIKE\nNIKON\nNINJA\nNISSAN\nNISSAY\nNL\nNO\nNOKIA\nNORTHWESTERNMUTUAL\nNORTON\nNOW\nNOWRUZ\nNOWTV\nNP\nNR\nNRA\nNRW\nNTT\nNU\nNYC\nNZ\nOBI\nOBSERVER\nOFFICE\nOKINAWA\nOLAYAN\nOLAYANGROUP\nOLDNAVY\nOLLO\nOM\nOMEGA\nONE\nONG\nONL\nONLINE\nOOO\nOPEN\nORACLE\nORANGE\nORG\nORGANIC\nORIGINS\nOSAKA\nOTSUKA\nOTT\nOVH\nPA\nPAGE\nPANASONIC\nPARIS\nPARS\nPARTNERS\nPARTS\nPARTY\nPASSAGENS\nPAY\nPCCW\nPE\nPET\nPF\nPFIZER\nPG\nPH\nPHARMACY\nPHD\nPHILIPS\nPHONE\nPHOTO\nPHOTOGRAPHY\nPHOTOS\nPHYSIO\nPICS\nPICTET\nPICTURES\nPID\nPIN\nPING\nPINK\nPIONEER\nPIZZA\nPK\nPL\nPLACE\nPLAY\nPLAYSTATION\nPLUMBING\nPLUS\nPM\nPN\nPNC\nPOHL\nPOKER\nPOLITIE\nPORN\nPOST\nPR\nPRAMERICA\nPRAXI\nPRESS\nPRIME\nPRO\nPROD\nPRODUCTIONS\nPROF\nPROGRESSIVE\nPROMO\nPROPERTIES\nPROPERTY\nPROTECTION\nPRU\nPRUDENTIAL\nPS\nPT\nPUB\nPW\nPWC\nPY\nQA\nQPON\nQUEBEC\nQUEST\nRACING\nRADIO\nRE\nREAD\nREALESTATE\nREALTOR\nREALTY\nRECIPES\nRED\nREDSTONE\nREDUMBRELLA\nREHAB\nREISE\nREISEN\nREIT\nRELIANCE\nREN\nRENT\nRENTALS\nREPAIR\nREPORT\nREPUBLICAN\nREST\nRESTAURANT\nREVIEW\nREVIEWS\nREXROTH\nRICH\nRICHARDLI\nRICOH\nRIL\nRIO\nRIP\nRO\nROCHER\nROCKS\nRODEO\nROGERS\nROOM\nRS\nRSVP\nRU\nRUGBY\nRUHR\nRUN\nRW\nRWE\nRYUKYU\nSA\nSAARLAND\nSAFE\nSAFETY\nSAKURA\nSALE\nSALON\nSAMSCLUB\nSAMSUNG\nSANDVIK\nSANDVIKCOROMANT\nSANOFI\nSAP\nSARL\nSAS\nSAVE\nSAXO\nSB\nSBI\nSBS\nSC\nSCA\nSCB\nSCHAEFFLER\nSCHMIDT\nSCHOLARSHIPS\nSCHOOL\nSCHULE\nSCHWARZ\nSCIENCE\nSCOT\nSD\nSE\nSEARCH\nSEAT\nSECURE\nSECURITY\nSEEK\nSELECT\nSENER\nSERVICES\nSES\nSEVEN\nSEW\nSEX\nSEXY\nSFR\nSG\nSH\nSHANGRILA\nSHARP\nSHAW\nSHELL\nSHIA\nSHIKSHA\nSHOES\nSHOP\nSHOPPING\nSHOUJI\nSHOW\nSHOWTIME\nSI\nSILK\nSINA\nSINGLES\nSITE\nSJ\nSK\nSKI\nSKIN\nSKY\nSKYPE\nSL\nSLING\nSM\nSMART\nSMILE\nSN\nSNCF\nSO\nSOCCER\nSOCIAL\nSOFTBANK\nSOFTWARE\nSOHU\nSOLAR\nSOLUTIONS\nSONG\nSONY\nSOY\nSPA\nSPACE\nSPORT\nSPOT\nSR\nSRL\nSS\nST\nSTADA\nSTAPLES\nSTAR\nSTATEBANK\nSTATEFARM\nSTC\nSTCGROUP\nSTOCKHOLM\nSTORAGE\nSTORE\nSTREAM\nSTUDIO\nSTUDY\nSTYLE\nSU\nSUCKS\nSUPPLIES\nSUPPLY\nSUPPORT\nSURF\nSURGERY\nSUZUKI\nSV\nSWATCH\nSWISS\nSX\nSY\nSYDNEY\nSYSTEMS\nSZ\nTAB\nTAIPEI\nTALK\nTAOBAO\nTARGET\nTATAMOTORS\nTATAR\nTATTOO\nTAX\nTAXI\nTC\nTCI\nTD\nTDK\nTEAM\nTECH\nTECHNOLOGY\nTEL\nTEMASEK\nTENNIS\nTEVA\nTF\nTG\nTH\nTHD\nTHEATER\nTHEATRE\nTIAA\nTICKETS\nTIENDA\nTIFFANY\nTIPS\nTIRES\nTIROL\nTJ\nTJMAXX\nTJX\nTK\nTKMAXX\nTL\nTM\nTMALL\nTN\nTO\nTODAY\nTOKYO\nTOOLS\nTOP\nTORAY\nTOSHIBA\nTOTAL\nTOURS\nTOWN\nTOYOTA\nTOYS\nTR\nTRADE\nTRADING\nTRAINING\nTRAVEL\nTRAVELCHANNEL\nTRAVELERS\nTRAVELERSINSURANCE\nTRUST\nTRV\nTT\nTUBE\nTUI\nTUNES\nTUSHU\nTV\nTVS\nTW\nTZ\nUA\nUBANK\nUBS\nUG\nUK\nUNICOM\nUNIVERSITY\nUNO\nUOL\nUPS\nUS\nUY\nUZ\nVA\nVACATIONS\nVANA\nVANGUARD\nVC\nVE\nVEGAS\nVENTURES\nVERISIGN\nVERSICHERUNG\nVET\nVG\nVI\nVIAJES\nVIDEO\nVIG\nVIKING\nVILLAS\nVIN\nVIP\nVIRGIN\nVISA\nVISION\nVIVA\nVIVO\nVLAANDEREN\nVN\nVODKA\nVOLKSWAGEN\nVOLVO\nVOTE\nVOTING\nVOTO\nVOYAGE\nVU\nVUELOS\nWALES\nWALMART\nWALTER\nWANG\nWANGGOU\nWATCH\nWATCHES\nWEATHER\nWEATHERCHANNEL\nWEBCAM\nWEBER\nWEBSITE\nWED\nWEDDING\nWEIBO\nWEIR\nWF\nWHOSWHO\nWIEN\nWIKI\nWILLIAMHILL\nWIN\nWINDOWS\nWINE\nWINNERS\nWME\nWOLTERSKLUWER\nWOODSIDE\nWORK\nWORKS\nWORLD\nWOW\nWS\nWTC\nWTF\nXBOX\nXEROX\nXFINITY\nXIHUAN\nXIN\nXN--11B4C3D\nXN--1CK2E1B\nXN--1QQW23A\nXN--2SCRJ9C\nXN--30RR7Y\nXN--3BST00M\nXN--3DS443G\nXN--3E0B707E\nXN--3HCRJ9C\nXN--3PXU8K\nXN--42C2D9A\nXN--45BR5CYL\nXN--45BRJ9C\nXN--45Q11C\nXN--4DBRK0CE\nXN--4GBRIM\nXN--54B7FTA0CC\nXN--55QW42G\nXN--55QX5D\nXN--5SU34J936BGSG\nXN--5TZM5G\nXN--6FRZ82G\nXN--6QQ986B3XL\nXN--80ADXHKS\nXN--80AO21A\nXN--80AQECDR1A\nXN--80ASEHDB\nXN--80ASWG\nXN--8Y0A063A\nXN--90A3AC\nXN--90AE\nXN--90AIS\nXN--9DBQ2A\nXN--9ET52U\nXN--9KRT00A\nXN--B4W605FERD\nXN--BCK1B9A5DRE4C\nXN--C1AVG\nXN--C2BR7G\nXN--CCK2B3B\nXN--CCKWCXETD\nXN--CG4BKI\nXN--CLCHC0EA0B2G2A9GCD\nXN--CZR694B\nXN--CZRS0T\nXN--CZRU2D\nXN--D1ACJ3B\nXN--D1ALF\nXN--E1A4C\nXN--ECKVDTC9D\nXN--EFVY88H\nXN--FCT429K\nXN--FHBEI\nXN--FIQ228C5HS\nXN--FIQ64B\nXN--FIQS8S\nXN--FIQZ9S\nXN--FJQ720A\nXN--FLW351E\nXN--FPCRJ9C3D\nXN--FZC2C9E2C\nXN--FZYS8D69UVGM\nXN--G2XX48C\nXN--GCKR3F0F\nXN--GECRJ9C\nXN--GK3AT1E\nXN--H2BREG3EVE\nXN--H2BRJ9C\nXN--H2BRJ9C8C\nXN--HXT814E\nXN--I1B6B1A6A2E\nXN--IMR513N\nXN--IO0A7I\nXN--J1AEF\nXN--J1AMH\nXN--J6W193G\nXN--JLQ480N2RG\nXN--JLQ61U9W7B\nXN--JVR189M\nXN--KCRX77D1X4A\nXN--KPRW13D\nXN--KPRY57D\nXN--KPUT3I\nXN--L1ACC\nXN--LGBBAT1AD8J\nXN--MGB9AWBF\nXN--MGBA3A3EJT\nXN--MGBA3A4F16A\nXN--MGBA7C0BBN0A\nXN--MGBAAKC7DVF\nXN--MGBAAM7A8H\nXN--MGBAB2BD\nXN--MGBAH1A3HJKRD\nXN--MGBAI9AZGQP6J\nXN--MGBAYH7GPA\nXN--MGBBH1A\nXN--MGBBH1A71E\nXN--MGBC0A9AZCG\nXN--MGBCA7DZDO\nXN--MGBCPQ6GPA1A\nXN--MGBERP4A5D4AR\nXN--MGBGU82A\nXN--MGBI4ECEXP\nXN--MGBPL2FH\nXN--MGBT3DHD\nXN--MGBTX2B\nXN--MGBX4CD0AB\nXN--MIX891F\nXN--MK1BU44C\nXN--MXTQ1M\nXN--NGBC5AZD\nXN--NGBE9E0A\nXN--NGBRX\nXN--NODE\nXN--NQV7F\nXN--NQV7FS00EMA\nXN--NYQY26A\nXN--O3CW4H\nXN--OGBPF8FL\nXN--OTU796D\nXN--P1ACF\nXN--P1AI\nXN--PGBS0DH\nXN--PSSY2U\nXN--Q7CE6A\nXN--Q9JYB4C\nXN--QCKA1PMC\nXN--QXA6A\nXN--QXAM\nXN--RHQV96G\nXN--ROVU88B\nXN--RVC1E0AM3E\nXN--S9BRJ9C\nXN--SES554G\nXN--T60B56A\nXN--TCKWE\nXN--TIQ49XQYJ\nXN--UNUP4Y\nXN--VERMGENSBERATER-CTB\nXN--VERMGENSBERATUNG-PWB\nXN--VHQUV\nXN--VUQ861B\nXN--W4R85EL8FHU5DNRA\nXN--W4RS40L\nXN--WGBH1C\nXN--WGBL6A\nXN--XHQ521B\nXN--XKC2AL3HYE2A\nXN--XKC2DL3A5EE0H\nXN--Y9A3AQ\nXN--YFRO4I67O\nXN--YGBI2AMMX\nXN--ZFR164B\nXXX\nXYZ\nYACHTS\nYAHOO\nYAMAXUN\nYANDEX\nYE\nYODOBASHI\nYOGA\nYOKOHAMA\nYOU\nYOUTUBE\nYT\nYUN\nZA\nZAPPOS\nZARA\nZERO\nZIP\nZM\nZONE\nZUERICH\nZW";

        const endingsArr = TLDEndings.split("\n");

        return endingsArr.some((ending) => {
            return string.toLowerCase().endsWith(`.${ending.toLowerCase()}`);
        });
    }

    handleUrl(event) {
        if (event.target.className === "link") {
            event.preventDefault();
            this.webContents.loadURL(event.target.href);
        } else if (event.target.className === "favicon") {
            event.preventDefault();
            this.webContents.loadURL(event.target.parentElement.href);
        }
    }

    handleDevtools() {
        if (this.webContents.isDevToolsOpened()) {
            this.webContents.closeDevTools();
        } else {
            this.webContents.openDevTools();
        }
    }

    checkStringHasAnyProtocol(string) {
        return /((.*:\/\/).*)/g.test(string);
    }

    checkStringisURL(string) {
        return /https\:\/\/|http\:\/\//g.test(string);
    }

    async updateNav(event, string) {
        if (timeout2 == 1) {
            const HISTORY = JSON.parse(fs.readFileSync(process.env.HISTORY_PATH, { encoding: "utf-8" }));
            let toWrite = [
                ...HISTORY,

                HISTORY.some((m) => {
                    return m.url !== this.webContents.getURL() && m.title !== this.webContents.getTitle();
                }) && {
                    url: this.webContents.getURL(),
                    title: await this.win.webContents.executeJavaScript(`document.getElementById("titlebar").innerHTML.replace(" - Hydrogen", "")`),
                },
            ];

            toWrite = toWrite.filter((obj, pos, arr) => {
                return arr.map((mapObj) => mapObj.url).indexOf(obj.url) === pos;
            });
            fs.writeFileSync(process.env.HISTORY_PATH, JSON.stringify(toWrite));
            timeout2 = 0;
        } else {
            timeout2 = 1;
        }

        if (this.webContents.canGoBack()) {
            this.win.webContents.executeJavaScript('document.querySelector("#back").classList.remove("disabled");0');
        } else {
            this.win.webContents.executeJavaScript('document.querySelector("#back").classList.add("disabled");0');
        }

        if (this.webContents.canGoForward()) {
            this.win.webContents.executeJavaScript('document.querySelector("#forward").classList.remove("disabled");0');
        } else {
            this.win.webContents.executeJavaScript('document.querySelector("#forward").classList.add("disabled");0');
        }

        if (this.webContents.getTitle() === "ABOUT:BLANK") {
            this.win.webContents.executeJavaScript('document.querySelector("#url").value = "";0');
            return this.win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "Document - Hydrogen";0`);
        } else if (this.webContents.getTitle() == "HYDROGEN:ERROR") {
            this.win.webContents.executeJavaScript('document.querySelector("#url").value = "";0');
            return this.win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "Problem Loading Page - Hydrogen";0`);
        } else if (this.webContents.getTitle() == "HYDROGEN:SETTINGS") {
            this.win.webContents.executeJavaScript('document.querySelector("#url").value = "";0');
            fs.readFile(process.env.SETTINGS_PATH, "utf-8", (error, obj) => {
                const Settings = JSON.parse(obj);
                this.webContents.executeJavaScript(`
                try {
                    document.querySelector("select#theme").value = "${Settings.theme}";
                    document.querySelector("select#font-size").value = "${Settings.fontSize}";
                    document.querySelector("input#start-page").value = "${Settings.startPage}";
                    document.querySelector("select#search-engine").value = "${Settings.searchEngine}";
                } catch (error) {
                    console.error(error);
                }
                ;0`);
            });
            return this.win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "Settings - Hydrogen";0`);
        } else if (this.webContents.getTitle() == "HYDROGEN:HISTORY") {
            this.win.webContents.executeJavaScript('document.querySelector("#url").value = "";0');
            fs.readFile(process.env.HISTORY_PATH, "utf-8", (error, obj) => {
                this.webContents.executeJavaScript(`
                    window._hydrogenHTML = \`\`
                    window._hydrogenHistory = JSON.parse(${JSON.stringify(obj)})

                    window._hydrogenHistory.forEach(item => {
                        if (item) {
                            window._hydrogenHTML += \`<a href="\${item.url}" class="history-item"><div class="title">\${item.title}</div><div class="url">\${item.url}</div></a>\`
                        }
                    })

                    document.querySelector(".history-list").innerHTML = window._hydrogenHTML
                ;0`);
            });
            return this.win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "History - Hydrogen";0`);
        }

        if (string) {
            this.win.setTitle(`${string} - Hydrogen`);
            this.win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "${string} - Hydrogen";0`);

            return this.win.webContents.executeJavaScript(`document.getElementById("url").value = "hydrogen:${string.toLowerCase()}";0`);
        }

        // prettier-ignore
        this.webContents.executeJavaScript(
            `window._hydrogenInternal_getFavicon = () => {let f;document.querySelectorAll("link").forEach((l) => {if (l.rel === "icon" || l.rel === "shortcut icon") {f = l.href;}});document.querySelectorAll("meta").forEach((m) => {if (m.getAttribute("itemprop") == "image") {f = m.content[0] !== "/" ? m.content : location.protocol + "//" + location.host + m.content;}});return f;};0`
        );

        // prettier-ignore
        this.webContents.insertCSS(`._hydrogenInternal_loaderElement {user-select: none !important;position: fixed !important;bottom: 0 !important;left: 0 !important;padding: 2px 4px !important;background: #252525 !important;z-index: 99999999 !important;border-right: thin solid #666666 !important;border-top: thin solid #666666 !important;font-size: 12px !important;font-weight: 600 !important;color: #ffffff !important;max-width: 400px !important;overflow: hidden !important;text-overflow: ellipsis !important;border-radius: 0 4px 0 0 !important;box-sizing: content-box !important;display: block !important;white-space: nowrap !important;}`,{ cssOrigin: "user" });

        // prettier-ignore

        this.webContents.executeJavaScript(
            `window._hydrogenInternal_loaderElement=document.createElement("div");_hydrogenInternal_loaderElement.classList.add("_hydrogenInternal_loaderElement");document.querySelectorAll("[href]").forEach((a)=>{a.addEventListener("mouseover",()=>{if(!a.href){return}_hydrogenInternal_loaderElement.innerHTML=a.href;document.body.appendChild(_hydrogenInternal_loaderElement)});a.addEventListener("mouseout",()=>{_hydrogenInternal_loaderElement.remove()});a.addEventListener("click",()=>{_hydrogenInternal_loaderElement.remove()})});0`
        );

        // prettier-ignore
        this.win.webContents.executeJavaScript(`if ("${await this.webContents.executeJavaScript("window._hydrogenInternal_getFavicon()")}" == "undefined") {if (document.querySelector("#omnibox svg") !== null) {const e = document.querySelector("#omnibox svg");e.insertAdjacentHTML("beforebegin", \`<svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.75a7.25 7.25 0 0 1 5.63 11.819l4.9 4.9a.75.75 0 0 1-.976 1.134l-.084-.073-4.901-4.9A7.25 7.25 0 1 1 10 2.75Zm0 1.5a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Z" fill="currentColor"/></svg>\`);e.remove();} else {const e = document.querySelector("#omnibox img");e.insertAdjacentHTML("beforebegin", \`<svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.75a7.25 7.25 0 0 1 5.63 11.819l4.9 4.9a.75.75 0 0 1-.976 1.134l-.084-.073-4.901-4.9A7.25 7.25 0 1 1 10 2.75Zm0 1.5a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Z" fill="currentColor" /></svg>\`); e.remove();}} else {if (document.querySelector("#omnibox svg")) {const e = document.querySelector("#omnibox svg");e.insertAdjacentHTML("beforebegin", '<img src="${await this.webContents.executeJavaScript(`window._hydrogenInternal_getFavicon()`)}"/>');e.remove();} else {const e = document.querySelector("#omnibox img");e.insertAdjacentHTML("beforebegin", '<img src="${await this.webContents.executeJavaScript(`window._hydrogenInternal_getFavicon()`)}"/>');e.remove(); }};0`);

        // prettier-ignore
        if (this.webContents.getURL().includes(path.join(__dirname, "../page"))) {
            this.win.webContents.executeJavaScript(
                `if(document.querySelector("#omnibox svg")){const e=document.querySelector("#omnibox svg");e.insertAdjacentHTML("beforebegin",'<svg class="secure-indicator" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a4 4 0 0 1 4 4v2h1.75A2.25 2.25 0 0 1 18 10.25V11c-.319 0-.637.11-.896.329l-.107.1c-.164.17-.33.323-.496.457L16.5 10.25a.75.75 0 0 0-.75-.75H4.25a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h9.888a6.024 6.024 0 0 0 1.54 1.5H4.25A2.25 2.25 0 0 1 2 19.75v-9.5A2.25 2.25 0 0 1 4.25 8H6V6a4 4 0 0 1 4-4Zm8.284 10.122c.992 1.036 2.091 1.545 3.316 1.545.193 0 .355.143.392.332l.008.084v2.501c0 2.682-1.313 4.506-3.873 5.395a.385.385 0 0 1-.253 0c-2.476-.86-3.785-2.592-3.87-5.13L14 16.585v-2.5c0-.23.18-.417.4-.417 1.223 0 2.323-.51 3.318-1.545a.389.389 0 0 1 .566 0ZM10 13.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0-10A2.5 2.5 0 0 0 7.5 6v2h5V6A2.5 2.5 0 0 0 10 3.5Z" fill="currentColor"/></svg>');e.remove()}else{const e=document.querySelector("#omnibox img");e.insertAdjacentHTML("beforebegin",'<svg class="secure-indicator" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a4 4 0 0 1 4 4v2h1.75A2.25 2.25 0 0 1 18 10.25V11c-.319 0-.637.11-.896.329l-.107.1c-.164.17-.33.323-.496.457L16.5 10.25a.75.75 0 0 0-.75-.75H4.25a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h9.888a6.024 6.024 0 0 0 1.54 1.5H4.25A2.25 2.25 0 0 1 2 19.75v-9.5A2.25 2.25 0 0 1 4.25 8H6V6a4 4 0 0 1 4-4Zm8.284 10.122c.992 1.036 2.091 1.545 3.316 1.545.193 0 .355.143.392.332l.008.084v2.501c0 2.682-1.313 4.506-3.873 5.395a.385.385 0 0 1-.253 0c-2.476-.86-3.785-2.592-3.87-5.13L14 16.585v-2.5c0-.23.18-.417.4-.417 1.223 0 2.323-.51 3.318-1.545a.389.389 0 0 1 .566 0ZM10 13.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0-10A2.5 2.5 0 0 0 7.5 6v2h5V6A2.5 2.5 0 0 0 10 3.5Z" fill="currentColor"/></svg>');e.remove()};0`
            );
        }

        if (event?.url == this.SEARCH_ENGINE_URL || event?.url == "about:blank") return;
        if (event?.url == this.HOME_URL) {
            this.win.setTitle(`Home - Hydrogen`);
            this.win.webContents.executeJavaScript('document.querySelector("#titlebar").innerHTML = `Home - Hydrogen`;0');

            return this.win.webContents.executeJavaScript('document.getElementById("url").value = "";0');
        }

        const newVal = event?.url || this.webContents.getURL();

        this.win.setTitle(`${this.webContents.getTitle()} - Hydrogen`);
        this.win.webContents.executeJavaScript(`document.querySelector("#titlebar").innerHTML = "${this.webContents.getTitle()} - Hydrogen";0`);

        this.win.webContents.executeJavaScript(`document.getElementById("url").value = "${newVal || "e"}";0`);

        if (!timeout) {
            timeout = setTimeout(() => {
                timeout = null;
            }, 100);
            this.updateNav();
        }
    }
})();
