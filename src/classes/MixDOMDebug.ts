
// - Imports - //

// Library.
import { Context } from "data-signals";
import { Host, MixDOMTreeNode, newDef } from "mix-dom";
import { ClassType } from "mixin-types";
// Common.
import type { HostDebugAppState, HostDebugAppStateUpdate, HostDebugSettings, HostDebugSettingsInit } from "../shared";
import { consoleLog, appVersion, DebugContextSignals, DebugContextData, AppContexts, StateContextData, StateContextSignals, consoleWarn} from "../common/index";
// UI.
import { UIApp } from "../ui/app/UIApp";


// - Extra typing - //

/** Settings to initialize the app. */
export interface InitAppSettings {
    /** Url for the css file, defaults to: "https://unpkg.com/mix-dom-debug/MixDOMDebug.css" */
    cssUrl: string;
    /** Url for the font. Currently fixed to "Abel" from: "https://fonts.googleapis.com/css?family=Abel". */
    fontUrl: string;
    /** Whether adds the Google's prettify script for syntax highlighting. Defaults to true. Loaded from: "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js". */
    prettify: boolean;
    /** Whether adds the beautify script for JS code linebreaking and tabbing. Defaults to true. Loaded from: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js". */
    beautify: boolean;
    /** Whether adds the div#app-root inside document.body or not. Defaults to false. */
    addRoot: boolean;
    /** Whether adds a fade in element. Defaults to false. */
    useFadeIn: boolean;
}
/** The static class type for MixDOMDebug. */
export interface MixDOMDebugType extends ClassType<MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    debug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host: Host, settings?: Partial<HostDebugSettings>, state?: Partial<HostDebugAppState>) => MixDOMDebug;
}


// - Class - //

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
        else
            this.refresh();
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
        // Refresh in any case.
        this.refresh();
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
        const { rootElement, cssUrl, fontUrl, prettify, beautify, addRoot, useFadeIn, onLoad, ...coreSettings } = settings || {};

        // Already inited.
        if (MixDOMDebug.debug) {
            host ? MixDOMDebug.debug.setHost(host, coreSettings, appState) : MixDOMDebug.debug.updateSettings(coreSettings, appState);
            onLoad && onLoad(MixDOMDebug.debug, host || null, window);
            return MixDOMDebug.debug;
        }

        // Initialize.
        MixDOMDebug.initApp({
            cssUrl,
            fontUrl,
            prettify,
            beautify,
            addRoot,
            useFadeIn,
        }, () => {
            // Set host and settings.
            if (MixDOMDebug.debug)
                host ? MixDOMDebug.debug.setHost(host, coreSettings, appState) : MixDOMDebug.debug.updateSettings(coreSettings, appState);
            // Call loader.
            onLoad && onLoad(MixDOMDebug.debug, host || null, window);
        });

        // Start up debugging.
        const elRoot = rootElement && rootElement instanceof Element ? rootElement : rootElement === null ? null : document.body.querySelector(rootElement === undefined ? "#app-root" : rootElement);

        // Create the app.
        MixDOMDebug.debug = new MixDOMDebug(elRoot);

        // Return the instance.
        return MixDOMDebug.debug;
    }
    
    /** Should only be called once. Adds the css, scripts and a couple of DOM elements to set up the app.
     * @param settings A partial dictionary of settings.
     *      - cssUrl (string): Url for the css file, defaults to: "https://unpkg.com/mix-dom-debug/MixDOMDebug.css"
     *      - fontUrl (string): Url for the font. Currently fixed to "Abel" from: "https://fonts.googleapis.com/css?family=Abel".
     *      - prettify (boolean): Whether adds the Google's prettify script for syntax highlighting. Defaults to true. Loaded from: "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js".
     *      - beautify (boolean): Whether adds the beautify script for JS code linebreaking and tabbing. Defaults to true. Loaded from: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js".
     *      - addRoot (boolean): Whether adds the div#app-root.ui inside document.body or not. Defaults to false.
     *      - useFadeIn (boolean): Whether adds a fade in element. Defaults to false.
     * @param onLoad Called after loading the two optional auxiliary scripts.
     */
    public static initApp = (settings?: Partial<InitAppSettings> | null, onLoad?: (() => void) | null) => {

        // Parse url.
        if (!settings)
            settings = {};
        const cssUrl = settings.cssUrl ?? "https://unpkg.com/mix-dom-debug/MixDOMDebug.css";
        const fontUrl = settings.fontUrl ?? "https://fonts.googleapis.com/css?family=Abel";

        // Shortcuts.
        const doc = window.document;
        const cssVersion = appVersion;

        // Modify html, head and body.
        // .. Modify <html/>.
        doc.documentElement.setAttribute("lang", "en");
        // .. Modify <body/>.
        if (settings.addRoot) {
            // Get app root container.
            let elAppRoot = doc.body.querySelector("#app-root");
            // If didn't have, add.
            if (!elAppRoot) {
                // .. Set up background.
                doc.body.style.cssText = "background: #222; margin: 0; padding: 0; width: 100%; height: 100%; font-family: 'Abel', Arial, sans-serif; font-size: 16px;";
                // Add.
                elAppRoot = doc.createElement("div");
                elAppRoot.classList.add("ui");
                elAppRoot.id = "app-root";
                doc.body.appendChild(elAppRoot);
            }
        }
        // .. Add fade in feature inside <body/>.
        const fadeIn = settings.useFadeIn ? useFade(doc) : null;
        // .. Modify contents of <head/>.
        let elTitle = doc.head.querySelector("title");
        if (!elTitle) {
            elTitle = doc.createElement("title");
            elTitle.textContent = "MixDOMDebug | Debugger for MixDOM library";
            doc.head.appendChild(elTitle);
        }
        let elDescription = doc.head.querySelector("meta[name=description]");
        if (!elDescription) {
            elDescription = doc.createElement("meta");
            elDescription.setAttribute("name", "description");
            elDescription.setAttribute("content", "MixDOMDebug is an app for MixDOM library to debug a Host instance - shows the tree in details");
            doc.head.appendChild(elDescription);
        }
        let elHttpEquiv = doc.head.querySelector("meta[http-equiv=content-type]");
        if (!elHttpEquiv) {
            elHttpEquiv = doc.createElement("meta");
            elHttpEquiv.setAttribute("http-equiv", "content-type");
            elHttpEquiv.setAttribute("content", "text/html");
            elHttpEquiv.setAttribute("charset", "utf-8");
            doc.head.appendChild(elHttpEquiv);
        }
        let elViewport = doc.head.querySelector("meta[name=viewport]");
        if (!elViewport) {
            elViewport = doc.createElement("meta");
            elViewport.setAttribute("name", "viewport");
            elViewport.setAttribute("content", "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no");
            doc.head.appendChild(elViewport);
        }

        // Loader.
        let nToLoad = 0;
        const oneLoaded = () => {
            // Not yet.
            if (--nToLoad > 0)
                return;
            // Finished.
            fadeIn && fadeIn();
            onLoad && onLoad();
        };

        // Prepare styles.
        let checkCss = false;
        const addToHead: HTMLLinkElement[] = [];
        const elStyleLinks = [...doc.head.querySelectorAll("link[rel=stylesheet]")];
        const cssUrlVersion = `${cssUrl}?v=${cssVersion}`;
        let elCss = elStyleLinks.find(link => link.getAttribute("href") === cssUrlVersion) as HTMLLinkElement | null;
        if (!elCss) {
            elCss = doc.createElement("link");
            elCss.setAttribute("rel", "stylesheet");
            elCss.setAttribute("type", "text/css");
            elCss.setAttribute("href", cssUrlVersion);
            addToHead.push(elCss);
            nToLoad++;
            checkCss = true;
        }
        let elFont = elStyleLinks.find(link => link.getAttribute("href") === fontUrl) as HTMLLinkElement | null;
        if (!elFont) {
            elFont = doc.createElement("link");
            elFont.setAttribute("rel", "stylesheet");
            elFont.setAttribute("type", "text/css");
            elFont.setAttribute("href", fontUrl);
            addToHead.push(elFont);
            nToLoad++;
            const fontLoaded = () => {
                document.fonts.removeEventListener("loadingdone", fontLoaded);
                oneLoaded();
            }
            document.fonts.addEventListener("loadingdone", fontLoaded);
        }

        // Scripts.
        // .. Set scripts.
        const scriptsSrcs: string[] = [
            // For syntax highlighting JS code and HTML markup.
            settings.prettify !== false && "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js" || "",
            // For linebreaking and tabbifying JS code.
            settings.beautify !== false && "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js" || ""
        ].filter(s => s);
        // .. Load up.
        const existingScriptSrcs = [...doc.body.querySelectorAll("script")].map(s => s.getAttribute("src"));
        const addToBody = scriptsSrcs.map(src => {
            if (existingScriptSrcs.includes(src))
                return null;
            nToLoad++;
            const script = doc.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", src);
            script.onload = oneLoaded;
            return script;
        }).filter(s => s) as HTMLScriptElement[];

        // Nothing to load.
        if (!addToHead[0] && !addToBody[0])
            oneLoaded();
        // Start loading.
        else {
            // Add styles.
            for (const el of addToHead)
                doc.head.appendChild(el);
            // Add scripts.
            for (const el of addToBody)
                doc.body.appendChild(el);
            // Style load checker.
            if (checkCss) {
                // Create a dummy.
                const elDummy = document.createElement("div");
                elDummy.style.cssText = "display: none;";
                elDummy.classList.add("style-disabled");
                doc.body.appendChild(elDummy);
                // Check every 100ms.
                const styleInterval = window.setInterval(() => {
                    // Test.
                    if (window.getComputedStyle(elDummy).opacity === "1")
                        return;
                    // Finished.
                    elDummy.remove();
                    window.clearInterval(styleInterval);
                    oneLoaded();
                }, 100);
            }
        }
    }
}


// - Local helper - //

/** Smooth fade feature. Returns fadeIn callback. */
function useFade(doc: Document): () => void {
    // Create.
    const divAppHide = doc.createElement("div");
    divAppHide.classList.add("ui");
    divAppHide.id = "app-hide";
    divAppHide.style.cssText = "position: absolute; inset: 0; z-index: 1000; background: #222; opacity: 1; transition: opacity 150ms ease-in-out; pointer-events: none;";
    // Add to body.
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
