
// - Imports - //

// Library.
import { Context } from "data-signals";
import { Host, newDef } from "mix-dom";
import { ClassType } from "mixin-types";
// Common.
import { consoleLog } from "../common/helpers";
import { appVersion } from "../common/appVersion";
import { HostDebugSettings, HostDebugLive, DebugContextSignals, DebugContextData, AppContexts, SettingsContextData, SettingsContextSignals} from "../common/typing";
// UI.
import { UIApp } from "../ui/app/UIApp";


// - Class - //

export interface MixDOMDebugType extends ClassType<MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    mixDOMDebug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host: Host, settings?: Partial<HostDebugSettings>) => MixDOMDebug;
}

export class MixDOMDebug {


    // - Members - //

    // Typing.
    ["constructor"]: MixDOMDebugType;

    /** Our own contexts. */
    public contexts: AppContexts;
    /** Our own host. */
    public ownHost: Host;
    /** For forcing refreshes. */
    public refreshId: {};
    /** Updates are delayed by a timer. */
    public updateTimer: number | null;

    constructor(container?: Element | null) {
        this.updateTimer = null;
        this.refreshId = {};
        this.contexts = {
            debug: new Context<DebugContextData, DebugContextSignals>({
                ...this.getSettingsAndLive(),
                host: null,
                focusedId: null,
            }),
            settings: new Context<SettingsContextData, SettingsContextSignals>({
                theme: "dark",
                filter: "",
                showCollapsed: false,
                showParents: false,
                showChildren: false,
                hideUnmatched: false,
                ignoreSelection: false,
                ignoreFilter: false,
                rowMode: "select-tip",
                shouldSelect: true,
                noneCollapsed: true,
                hiddenTipSections: []
            })
        };
        this.contexts.settings.listenTo("toggleTheme", () =>
            this.contexts.settings.setData({ theme: this.contexts.settings.data.theme === "dark" ? "light" : "dark" })
        );
        this.ownHost = new Host(
            newDef(UIApp, { refreshId: this.refreshId }),
            container || null,
            { onlyRunInContainer: true, renderTimeout: null },
            this.contexts
        );
        this.initialize();
    }


    // - Use API - //

    public setHost(host: Host, debugSettings?: Partial<HostDebugSettings> | null): void {
        // Prepare setup.
        const { settings, live } = this.getSettingsAndLive(debugSettings);
        // Remove existing.
        const already = this.contexts.debug.data.host;
        // Same.
        if (already && already === host) {
            // already.settings.focusSource && already.live.focusInListener && already.settings.focusSource.removeEventListener("focusin", already.live.focusInListener);
        }
        // New.
        else {
            // Clear.
            if (already)
                this.clearHostListeners(already);
            // Hook up.
            host.services.renderCycle.listenTo("onFinish", this.onUpdate, [host]);
        }
        // Set context data.
        // .. In Chrome, we need to delay this. If happens to be fully synchronous (the theory is), there seems to be some sort of micro-timing bug.
        // .. In the bug, there's some infinite loop somewhere. Very likely, it's context data -> host -> context data.
        window.setTimeout(() => this.contexts.debug.setData({ host: host, settings, live }), 0);
        // this.contexts.debug.setData({ host: host, settings, live });

        //
        // <-- SHOULD BE REFINED HERE IF THISIS THE FINAL SOLUTION..

        // <-- HEY... IT SEEMS TO BE COMPONENT SET STATE CONTEXT DATA -> INFINTE LOOP..!!!!


        // Log.
        consoleLog(settings, "MixDOMDebug: " + (already ? " Host re-added" : " Host added"), host);
    }

    public clearHost(): void {
        // Already.
        const data = this.contexts.debug.data;
        const host = data.host;
        if (!host)
            return;
        // Clear listeners.
        this.clearHostListeners(host);
        // Set context data.
        this.contexts.debug.setData({ host: null, focusedId: null, ...this.getSettingsAndLive() });
    }


    // - Refresh - //

    public refresh(forceRefresh?: boolean): void {
        // Set a new refresh id.
        if (forceRefresh)
            this.refreshId = {};
        // Update.
        this.contexts.debug.data.host?.updateRoot(newDef(UIApp, { refreshId: this.refreshId }));
    }

    // public refreshFocusFor(host: Host, doc: Document): void {
    //     // Get valid focus element.
    //     const elFocus = document.activeElement && document.activeElement !== document.body && document.body.contains(document.activeElement) ? document.activeElement : null;
    //     // Get tree node.
    //     let treeNode: MixDOMTreeNode | null = null;
    //     if (elFocus)
    //         treeNode = host.findTreeNodes(["dom"], 1, false, (tNode) => tNode.domNode === elFocus)[0] || null;
    //     // Send out.
    //     this.contexts.debug.sendSignal("domFocus", treeNode);
    //     // Update.
    //     this.refresh(true);
    // }


    // - Handlers - //

    // public updateHost(host: Host, cancelled?: boolean): void {
    public onUpdate = (cancelled?: boolean, host?: Host): void => {
        // Nothing.
        if (cancelled)
            return;
        // Already.
        if (this.updateTimer !== null)
            return;
        // Set up a timer.
        this.updateTimer = window.setTimeout(() => {
            // Mark as cleared.
            this.updateTimer = null;
            if (!this.ownHost.getContainerElement()) {
                host && this.clearHostListeners(host);
                return;
            }
            // Increase counter.
            const live = this.contexts.debug.data.live;
            const iUpdate = live ? live.iUpdate + 1 : 1;
            this.contexts.debug.setInData("live.iUpdate", iUpdate);
            // // Refresh.
            // this.refresh(true);
        }, 1);
    };



    // - Helpers - //

    public getSettingsAndLive(settings?: Partial<HostDebugSettings> | null, iUpdate: number = 0): { settings: HostDebugSettings; live: HostDebugLive; } {
        const basis: HostDebugSettings = {
            console: window.console,
            // focusSource: null
        };
        const live: HostDebugLive = {
            iUpdate
        };
        return {
            settings: settings ? { ...basis, ...settings } : basis,
            live
        };
    }

    public initialize(): void {

    }


    // - Private helpers - //
    
    private clearHostListeners(host: Host): void {
        // Clear listeners.
        // settings.focusSource && live.focusInListener && settings.focusSource.removeEventListener("focusin", live.focusInListener);
        host.services.renderCycle.unlistenTo("onFinish", this.onUpdate);
        // Refresh.
        consoleLog(this.contexts.debug.data.settings, "MixDOMDebug: Host removed", host);
    }


    // - Static - //

    /** Instance of the MixDOMDebug, once has started debugging. */
    public static mixDOMDebug: MixDOMDebug | null = null;
    /** Stop debugging the current host, if has one. */
    public static stopDebug = () => {
        if (MixDOMDebug.mixDOMDebug) {
            const host = MixDOMDebug.mixDOMDebug.contexts.debug.data.host;
            host && MixDOMDebug.mixDOMDebug.clearHostListeners(host);
            // MixDOMDebug.mixDOMDebug.clearHost();
            MixDOMDebug.mixDOMDebug = null;
        }
    }
    /** Start debugging the given host. */
    public static startDebug = (host: Host, settings?: Partial<HostDebugSettings>): MixDOMDebug => {

        const w = window;
        const cssVersion = appVersion;

        // FOR NOW..
        let baseUrl = "http://localhost/www/projects/MixDOM/mix-dom-debug/dist/";

        if (baseUrl && !baseUrl.endsWith("/"))
            baseUrl += "/";

        const cssUrl = baseUrl + "css/";

        w.document.documentElement.setAttribute("lang", "en");
        w.document.head.innerHTML = `<title>MixDOMDebug | Debugger for MixDOM library</title><meta name='description' content="MixDOMDebug provides a debugging view for MixDOM library hosts and contexts" /><meta name='keywords' content='mix-dom-debug, mixdomdebug, mixdomjs, mix-dom-js, mix, dom, debug, service' /><meta http-equiv='content-type' content='text/html' charset='utf-8' /><meta name='viewport' content='width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' /><meta name="google-site-verification" content="vuXdGK5mafeCIvjzenv2uDtR4S-nxq8crCSAW_Vgyg0" /><link href='https://fonts.googleapis.com/css?family=Abel' rel='stylesheet' /><link href="${cssUrl}prettify.css?v=${cssVersion}" rel='stylesheet' type="text/css" /><link href="${cssUrl}app.css?v=${cssVersion}" rel="stylesheet" type="text/css" /><link href="${cssUrl}common.css?v=${cssVersion}" rel='stylesheet' type="text/css" />`;
        w.document.body.style.cssText = "background: #222; margin: 0; padding: 0; width: 100%; height: 100%; font-family: 'Abel', Arial, sans-serif; font-size: 16px;";
        const divAppRoot = w.document.createElement("div");
        divAppRoot.classList.add("ui");
        divAppRoot.id = "app-root";
        const divAppHide = w.document.createElement("div");
        divAppHide.classList.add("ui");
        divAppHide.id = "app-hide";
        divAppHide.style.cssText = "position: absolute; inset: 0; z-index: 1; background: #222; opacity: 1; transition: opacity 150ms ease-in-out; pointer-events: none;";
        w.document.body.appendChild(divAppRoot);
        w.document.body.appendChild(divAppHide);

        let nToLoad = 0;
        const ready = () => {
            // Not yet.
            if (--nToLoad)
                return;
            // Get.
            const el: HTMLElement | null = w.document.querySelector("#app-hide");
            if (!el)
                return;
            // w.document.body.removeAttribute("style");
            w.document.body.style.removeProperty("background");
            el.style.setProperty("opacity", "0");
            window.setTimeout(() => {
                el.remove();
            }, 150);
        
            host && MixDOMDebug.mixDOMDebug && MixDOMDebug.mixDOMDebug.setHost(host, settings);
        }; // );

        // Load up dependencies.
        const scriptsSrcs: string[] = [
            // For syntax highlighting JS code and HTML markup.
            "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js",
            // For linebreaking and tabbifying JS code.
            "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js"
        ];
        scriptsSrcs.map(src => {
            nToLoad++;
            const script = w.document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", src);
            script.onload = ready;
            return script;
        }).forEach(script => w.document.body.appendChild(script));

        
        // Initialize.
        const elRoot = w.document.querySelector("#app-root");
        MixDOMDebug.mixDOMDebug = new MixDOMDebug(elRoot);

        return MixDOMDebug.mixDOMDebug;
    }
}
