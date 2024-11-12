
// - Imports - //

// Library.
import { Context } from "data-signals";
import { Host, MixDOMTreeNode, newDef } from "mix-dom";
import { ClassType } from "mixin-types";
// Common.
import { HostDebugAppState, HostDebugAppStateUpdate, HostDebugSettings, HostDebugSettingsInit } from "../shared";
import { consoleLog, appVersion, DebugContextSignals, DebugContextData, AppContexts, StateContextData, StateContextSignals, consoleWarn} from "../common/index";
// UI.
import { UIApp } from "../ui/app/UIApp";


// - Class - //

export interface MixDOMDebugType extends ClassType<MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    debug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host: Host, settings?: Partial<HostDebugSettings>, state?: Partial<HostDebugAppState>) => MixDOMDebug;
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
                settings: this.getSettings(null, false),
                host: null,
                iUpdate: 0,
            }),
            state: new Context<StateContextData, StateContextSignals>({
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
            }),
        };
        // Hook up.
        this.contexts.state.listenTo("toggleTheme", () => this.contexts.state.setData({
            theme: this.contexts.state.data.theme === "dark" ? "light" : "dark"
        }));
        this.contexts.state.listenTo("connectSubHost", (host, refresh) => {
            // Don't allow modifying root, nor own host.
            if (host === this.contexts.debug.data.host || host === this.ownHost)
                return;
            // Set and refresh.
            this.setHostListeners(host);
            refresh && this.refresh();
        });
        this.contexts.state.listenTo("disconnectSubHost", (host, refresh) => { 
            // Don't allow modifying root, nor own host.
            if (host === this.contexts.debug.data.host || host === this.ownHost)
                return;
            // Clear and refresh.
            this.clearHostListeners(host);
            refresh && this.refresh();
        });
        // Own host.
        this.ownHost = new Host(
            newDef(UIApp, { refreshId: this.refreshId }),
            container || null,
            { onlyRunInContainer: true },
            this.contexts
        );
    }


    // - Use API - //

    public setHost(host: Host, debugSettings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null): void {
        // Own host - never allow. Just skip the process entirely.
        if (host === this.ownHost) {
            const settings = debugSettings ? { ...this.contexts.debug.data.settings, ...debugSettings } : this.contexts.debug.data.settings;
            consoleWarn(settings, "MixDOMDebug: Tried to debug self.", host);
            return;
        }
        // Remove existing.
        const already = this.contexts.debug.data.host;
        // Changed.
        if (!already || already !== host) {
            // Clear.
            if (already)
                this.clearHostListeners(already);
            // Hook up.
            this.setHostListeners(host);
        }
        // Set context data.
        this.contexts.debug.setData({ host, iUpdate: 0 });
        this.updateSettings(debugSettings, appState);
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
        this.contexts.debug.setData({ host: null, iUpdate: 0 });
    }

    public updateSettings(debugSettings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null): void {
        // Update debug settings.
        if (debugSettings)
            this.contexts.debug.setInData("settings", this.getSettings(debugSettings));
        // Update app state.
        if (appState) {
            // Parse.
            const { selected, collapsed, includedSubHosts, ...appCoreState } = appState;
            // Set data.
            this.contexts.state.setData({ ...appCoreState });
            // Handle special signals.
            if (selected)
                this.contexts.state.sendSignalAs("delay", "modifySelected", selected as MixDOMTreeNode[], "reset");
            if (collapsed)
                this.contexts.state.sendSignalAs("delay", "modifyCollapsed", collapsed as MixDOMTreeNode[], "reset");
            if (includedSubHosts !== undefined)
                this.contexts.state.sendSignalAs("delay", "modifySubHosts", includedSubHosts as Host[] | boolean);
        }
    }


    // - Refresh - //

    public refresh(forceRefresh: boolean = true): void {
        // Set a new refresh id.
        if (forceRefresh)
            this.refreshId = {};
        // Update.
        this.ownHost.updateRoot(newDef(UIApp, { refreshId: this.refreshId }));
    }


    // - Handlers - //

    public onUpdate = (cancelled?: boolean, host?: Host): void => {
        // Nothing.
        if (cancelled)
            return;
        // Already.
        if (this.updateTimer !== null)
            return;
        // Set up a timer.
        this.updateTimer = window.setTimeout(() => {
            // If the debugger app was removed.
            this.updateTimer = null;
            // if (!this.ownHost.getContainerElement()) {
            //     host && this.clearHostListeners(host);
            //     return;
            // }
            // Increase counter.
            this.contexts.debug.setInData("iUpdate", (this.contexts.debug.data.iUpdate || 0) + 1);
        }, 1);
    };


    // - Helpers - //

    public getSettings(settings?: Partial<HostDebugSettings> | null, includeCurrent: boolean = true): HostDebugSettings {
        return {
            // Default.
            console: window.console,
            // Current.
            ...includeCurrent ? this.contexts.debug.data.settings : undefined,
            // Override.
            ...settings
        };
    }


    // - Private helpers - //
    
    private clearHostListeners(host: Host): void {
        // Clear listeners.
        host.services.renderCycle.unlistenTo("onFinish", this.onUpdate);
        // Log.
        consoleLog(this.contexts.debug.data.settings, "MixDOMDebug: Host removed", host);
    }

    private setHostListeners(host: Host): void {
        host.services.renderCycle.listenTo("onFinish", this.onUpdate, [host]);
        // Log.
        consoleLog(this.contexts.debug.data.settings, "MixDOMDebug: Host added", host);
    }


    // - Static - //

    /** Instance of the MixDOMDebug, once has started debugging. */
    public static debug: MixDOMDebug | null = null;

    /** Stop debugging the current host, if has one. */
    public static stopDebug = (skipContext?: boolean) => {
        if (MixDOMDebug.debug) {
            const contexts = MixDOMDebug.debug.contexts;
            const host = contexts.debug.data.host;
            host && MixDOMDebug.debug.clearHostListeners(host);
            !skipContext && contexts.debug.setData({ host: null }); // <-- clean up..!
            MixDOMDebug.debug = null;
        }
    }

    /** Start debugging the given host and initialize the app (unless already inited). */
    public static startDebug = (host?: Host | null, settings?: HostDebugSettingsInit | null, appState?: HostDebugAppStateUpdate | null): MixDOMDebug => {

        // Parse.
        const { rootElement, cssUrl, ...coreSettings } = settings || {};

        // Already inited.
        if (MixDOMDebug.debug) {
            host ? MixDOMDebug.debug.setHost(host, coreSettings, appState) : MixDOMDebug.debug.updateSettings(coreSettings, appState);
            return MixDOMDebug.debug;
        }

        // Initialize.
        MixDOMDebug.initApp(cssUrl, () => {
            // After has loaded all optional helper scripts, send a refresh.
            MixDOMDebug.debug && MixDOMDebug.debug.refresh();
        });

        // Start up debugging.
        const elRoot = rootElement && rootElement instanceof Element ? rootElement : document.body.querySelector(rootElement || "#app-root");

        // Create the app.
        MixDOMDebug.debug = new MixDOMDebug(elRoot);
        host ? MixDOMDebug.debug.setHost(host, coreSettings, appState) : MixDOMDebug.debug.updateSettings(coreSettings, appState);

        // Return the instance.
        return MixDOMDebug.debug;
    }
    
    /** Should only be called once. Adds the css, scripts and a couple of DOM elements to set up the app.
     * @param cssUrl This is only used for the css file.
     * @param onLoad Called after loading the two optional auxiliary scripts.
     *      - "prettify" is used for syntax highlighting,
     *      - "beautify" is used for line breaks and tabs fos JS.
     *      - If the codes are not present, they are simply skipped. After loading, refresh the app to take use of them.
     */
    public static initApp = (cssUrl?: string, onLoad?: () => void) => {

        // Parse url.
        if (!cssUrl)
            cssUrl = "https://unpkg.com/mix-dom-debug/MixDOMDebug.css";

        // Shortcuts.
        const w = window;
        const doc = w.document;
        const cssVersion = appVersion;

        // Modify html, head and body.
        // .. Modify <html/>.
        doc.documentElement.setAttribute("lang", "en");
        // .. Modify contents of <head/>.
        const elDummy = doc.createElement("div");
        elDummy.innerHTML = `
<title>MixDOMDebug | Debugger for MixDOM library</title>
<meta name='description' content="MixDOMDebug is an app for MixDOM library to debug a Host instance - shows the tree in details" />
<meta name='keywords' content='mix-dom-debug, mixdomdebug, mixdomjs, mix-dom-js, mix, dom, debug, service' />
<meta http-equiv='content-type' content='text/html' charset='utf-8' />
<meta name='viewport' content='width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' />
<link href='https://fonts.googleapis.com/css?family=Abel' rel='stylesheet' />
<link href="${cssUrl}?v=${cssVersion}" rel='stylesheet' type="text/css" />
`.trim();
        for (const elKid of elDummy.childNodes)
            doc.head.appendChild(elKid);
        // .. Modify <body/>.
        doc.body.style.cssText = "background: #222; margin: 0; padding: 0; width: 100%; height: 100%; font-family: 'Abel', Arial, sans-serif; font-size: 16px;";
        // .. Add fade in feature inside <body/>.
        const fadeIn = useFade(doc);

        // Script loader.
        let nToLoad = 0;
        const ready = () => {
            // Not yet.
            if (--nToLoad)
                return;
            // Finished.
            fadeIn();
            onLoad && onLoad();
        };

        // Load up optional dependency scripts.
        // .. Set scripts.
        const scriptsSrcs: string[] = [
            // For syntax highlighting JS code and HTML markup.
            "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js",
            // For linebreaking and tabbifying JS code.
            "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js"
        ];
        // .. Load up.
        scriptsSrcs.map(src => {
            nToLoad++;
            const script = w.document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", src);
            script.onload = ready;
            return script;
        }).forEach(script => w.document.body.appendChild(script));

    }
}


// - Local helper - //

/** Smooth fade feature. Returns fadeIn callback. */
function useFade(doc: Document): () => void {
    // Create.
    const divAppRoot = doc.createElement("div");
    divAppRoot.classList.add("ui");
    divAppRoot.id = "app-root";
    const divAppHide = doc.createElement("div");
    divAppHide.classList.add("ui");
    divAppHide.id = "app-hide";
    divAppHide.style.cssText = "position: absolute; inset: 0; z-index: 1; background: #222; opacity: 1; transition: opacity 150ms ease-in-out; pointer-events: none;";
    // Add to body.
    doc.body.appendChild(divAppRoot);
    doc.body.appendChild(divAppHide);
    // Return fade-in callback.
    return () => {
        // Get hider element.
        const el: HTMLElement | null = doc.querySelector("#app-hide");
        if (!el)
            return;
        // Start fading in.
        doc.body.style.removeProperty("background");
        el.style.setProperty("opacity", "0");
        // Remove hider element after fading completed.
        (doc.defaultView || window).setTimeout(() => {
            el.remove();
        }, 150);
    }
}
