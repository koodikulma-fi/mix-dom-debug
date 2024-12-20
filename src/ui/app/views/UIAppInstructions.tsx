
// - Imports - //

// Libraries.
import { MixDOM, ComponentFunc, ComponentProps, Component, ComponentFuncReturn } from "mix-dom";
import { classNames } from "dom-types";
// Common in UI.
import { UIAppButton, wrapTip } from "../common/index";
// Local.
import { escapeHTML, Prettify } from "./display/index";


// - Helpers - //

function Article() {
    return <article class="flex-col layout-gap-m layout-margin-l layout-fit-width style-ui-blog">{MixDOM.Content}</article>;
}
function Section() {
    return <section class="flex-col layout-padding-l layout-border-box layout-gap-l layout-fit-width">{MixDOM.Content}</section>;
}
function Aside() {
    return <aside class="style-ui-panel layout-margin-l">{MixDOM.Content}</aside>;
}
function Small(props: { italic?: boolean; bold?: boolean; wide?: boolean; }) {
    return <span class={classNames("style-text-small", props.wide && "layout-padding-m", props.italic && "style-text-italic", props.bold && "style-text-bold")}>{MixDOM.Content}</span>;
}
function H1() {
    return <h1 class="style-text-center layout-margin-l layout-padding-l style-ui-heading main">{MixDOM.Content}</h1>;
}
function H2() {
    return <h2 class="style-text-center style-ui-heading">{MixDOM.Content}</h2>;
}
function H3() {
    return <h3 class="style-ui-heading">{MixDOM.Content}</h3>;
}
function A(props: { href: string; target?: "_blank" | string & {}; }) {
    return <a class="style-ui-button style-ui-focusable focusable-look-edge size-narrow style-text-no-decoration" href={props.href} target={props.target || "_blank"}>{MixDOM.Content}</a>
}
function Code(props: { code: string; }) {
    return <Prettify code={props.code} className="style-ui-mini-panel layout-overflow-hidden" />;
}
function Pre(props: { code: string; }) {
    return <Prettify tag="pre" code={props.code} className="style-ui-mini-panel layout-scrollable style-scrollable" />;
}

interface SectionTogglableInfo<Names extends string = string> {
    props: { title: string; name: Names; visible?: boolean; toggleSection?: (name: Names, solo?: boolean) => void; };
}
const SectionTogglable = <Names extends string = string>(_props: ComponentProps<SectionTogglableInfo<Names>>, comp: Component<SectionTogglableInfo<Names>>): ComponentFuncReturn<SectionTogglableInfo<Names>> => {
    
    const renderSectionTip = () => wrapTip(<div>Toggle the section visibility.<br/> - Click with <b>Ctrl</b>/<b>Alt</b> to only show this section or all.</div>);
    const onPress = (e: MouseEvent | KeyboardEvent) => comp.props.toggleSection && comp.props.toggleSection(comp.props.name, e.ctrlKey || e.altKey || e.metaKey);

    return (props) => <Section>
        <H2>
            <UIAppButton
                look="transparent"
                // size="narrow"
                className={classNames(!props.visible && "style-dimmed")}
                renderTip={renderSectionTip}
                onPress={onPress}
            >
                {props.title}
            </UIAppButton>
        </H2>
        {props.visible ? MixDOM.Content : null}
    </Section>;
}


// - Component - //

export type SectionNames = "instructions" | "set-host" | "using-launcher" | "manual-launching" | "render-app" | "docs-example";
export interface UIAppInstructionsInfo {
    props: { refreshId?: any; };
    state: { hiddenSections: SectionNames[]; };
}
export const UIAppInstructions: ComponentFunc<UIAppInstructionsInfo> = (_props, comp) => {

    // Init.
    comp.state = { hiddenSections: [] };

    // Callbacks.
    const toggleSection = (name: SectionNames, solo?: boolean): void => {
        // Get.
        let sections = comp.state.hiddenSections.slice();
        const iName = sections.indexOf(name);
        // Toggle.
        if (solo) {
            const allSections = ["instructions", "set-host", "using-launcher", "manual-launching", "render-app", "docs-example"] satisfies SectionNames[];
            sections = sections.length === allSections.length - 1 && iName === -1 ? [] : allSections.filter(n => n !== name);
        }
        else
            iName === -1 ? sections.push(name) : sections.splice(iName, 1);
        // Set.
        comp.setInState("hiddenSections", sections);
    }

    // Use a component based spread - to help make code cleaner.
    const SectionHelper = (props: { name: SectionNames; title: string; }) =>
        <SectionTogglable<SectionNames>
            title={props.title}
            name={props.name}
            visible={!comp.state.hiddenSections.includes(props.name)}
            toggleSection={toggleSection}
        >
            {MixDOM.Content}
        </SectionTogglable>;

    // Render.
    return () => (
        <div class="ui-app-instructions layout-fit-size layout-padding-l layout-border-box layout-scrollable style-scrollable flex-col flex-align-items-center">
            <Article>

                <H1>MixDOMDebug</H1>

                <SectionHelper title="Instructions" name="instructions" >
                    <p class="style-text-center">You are viewing instructions for setting up the debugger <Small>(because no Host instance was given)</Small>.</p>
                </SectionHelper>
                <SectionHelper title="Set host directly" name="set-host" >

                    <p class="style-text-center">Since you're seeing this page, the debugger app is already running and available <Small>(in this window)</Small>, and so is the globally declared <Code code="MixDOMDebug"/> class.</p>

                    <Aside>
                        <H3>Changing the host</H3>
                        <p>To start debugging a Host instance in this window <Small>(<Code code="debugWindow" />)</Small> from another window, simply call: <Pre code="debugWindow.MixDOMDebug.startDebug( host ); // Feed in the `host` to debug."/></p>
                        <p>You can then use the <Code code="setHost(host, settings, appState)"/> and <Code code="clearHost()"/> methods directly: <Pre code="debugWindow.MixDOMDebug.debug.setHost( host );"/></p>
                        <p>Not using <Code code="startDebug"/> you can init the app with the static <Code code="initApp(settings?, onLoad?)"/> method. <Pre code="debugWindow.MixDOMDebug.initApp();" /></p>
                        <p>Note that <Code code="startDebug"/> / <Code code="stopDebug"/> sets the global instance: <Code code="debugWindow.MixDOMDebug.debug"/></p>
                    </Aside>

                </SectionHelper>
                <SectionHelper title="Using the launcher script" name="using-launcher">
                    <p class="style-text-center">Including the launcher script adds one function to the global window: <Code code="openMixDOMDebug"/></p>

                    <Aside>
                        <H3>Module usage <Small>(import/require)</Small></H3>
                        <p>You can install the <A href="https://www.npmjs.com/package/mix-dom-debug">NPM package</A> and import the launcher as a sub module.</p>
                        <ol class="style-ui-list">
                            <li><Small italic={true} wide={true}>1. </Small>First, install <Code code="mix-dom-debug"/> from the terminal <Small>(often as a dev. dependency)</Small>: <Pre code={escapeHTML(`npm install mix-dom-debug --save-dev`)} /></li>
                            <li><Small italic={true} wide={true}>2. </Small>Then import <Small>(or require)</Small> the launcher function: <Pre code={`import { openMixDOMDebug } from "mix-dom-debug/launcher";`} /></li>
                            <li><Small italic={true} wide={true}>3. </Small>And finally hook it up in your code <Small>(with typing support)</Small>: <Pre code={`openMixDOMDebug(host, debugSettings, appState);`} /></li>
                        </ol>
                    </Aside>

                    <Aside>
                        <H3>Global usage</H3>
                        <p>You can add the launcher script to the document, and then use it to open MixDOMDebug for the hosts you want to debug.</p>
                        <ol class="style-ui-list">
                            <li><Small italic={true} wide={true}>1. </Small>First, include the launcher script <Small>(inside <Code code={escapeHTML("<body>")}/>)</Small>: <Pre code={escapeHTML(`<script type="text/javacript" src="https://unpkg.com/mix-dom-debug/launcher.global.js" />`)} /></li>
                            <li><Small italic={true} wide={true}>2. </Small>Then use it to debug a Host instance: <Pre code={`const debugWindow = window.openMixDOMDebug( host ); `.trim()} /></li>
                            <li><Small italic={true} wide={true}>+ </Small>Use the returned window to access the static class <Small>(after it's loaded)</Small>: <Code code={`debugWindow.MixDOMDebug`} /></li>
                        </ol>
                    </Aside>

                    <Aside>
                        <H3>Adding global script by JS</H3>
                        <p>You can also do this programmatically. <Small>(Of course, you only need to add the script to the document once.)</Small></p>
                        <Pre code={`
// Prepare script.
const scriptUrl = "https://unpkg.com/mix-dom-debug/launcher.global.js";
const script = document.createElement("script");
script.setAttribute("type", "text/javascript");
script.setAttribute("src", scriptUrl);

// Add a listener to start debugging when the script is loaded.
let debugWindow = null;
script.addEventListener("load", () => debugWindow = window.openMixDOMDebug(host));

// Add the script to document.
document.body.appendChild(script);

`.trim()} />

                        <p>If you have the <Code code="mix-dom-debug"/> package downloaded / installed locally, you can of course point to its <Code code='"launcher.global.js"'/>.</p>
                    </Aside>

                    <Aside>
                        <H3>About launcher arguments</H3>
                        <p>The <Code code="openMixDOMDebug" /> function takes in 3 arguments, all of which are optional.</p>
                        <ol class="style-ui-list">
                            <li><Small italic={true} wide={true}>1. </Small>The host to debug: <Code code="host: Host | null"/></li>
                            <li><Small italic={true} wide={true}>2. </Small>Debug settings: <Pre code={`
interface DebugSettings {
    // Persistent.
    console?: Console;       // Default: window.console (in original window)
    // App setup.
    rootElement?: Element | string | null; // Defaults to "#app-root"
    prettify?: boolean;      // Default: true. Adds Google prettify for syntax highlight.
    beautify?: boolean;      // Default: true. Adds beautify JS for linebreaking and tabs.
    addRoot?: boolean;       // Default: true for launcher, false normally.
    useFadeIn?: boolean;     // Default: true for launcher, false normally.
    fontUrl?: string;        // Default: "https://fonts.googleapis.com/css?family=Abel"
    cssUrl?: string;         // Default: "https://unpkg.com/mix-dom-debug/MixDOMDebug.css"
    // Only for launcher.
    scriptUrl?: string;      // Default: "https://unpkg.com/mix-dom-debug/MixDOMDebug.js"
    windowFeatures?: string; // Default: "toolbar=0,scrollbars=0,location=0,resizable=1"
    windowTarget?: string;   // Default: "_blank"
    onLoad?: (debug, host, debugWindow) => void;    // Default: undefined
}
`.trim()}/></li>
                            <li><Small italic={true} wide={true}>3. </Small>Initial app state: <Pre code={`
interface DebugAppState {
    theme?: "dark" | "light";                   // Default: "dark"
    filter?: string;                            // Default: ""
    selected?: MixDOMTreeNode[];                // Default: []
    collapsed?: MixDOMTreeNode[];               // Default: []
    includedSubHosts?: Host[] | boolean;        // Default: false
    showCollapsed?: boolean;                    // Default: false
    showParents?: boolean;                      // Default: false
    showChildren?: boolean;                     // Default: false
    hideUnmatched?: boolean;                    // Default: false
    ignoreSelection?: boolean;                  // Default: false
    ignoreFilter?: boolean;                     // Default: false
    rowMode?: "select" | "select-tip" | "tip";  // Default: "select-tip"
    hiddenTipSections?: TipSectionNames[];      // Default: []
}`.trim()}/><Pre code={`
type TipSectionNames = "heading" | "code" | "props" | "state" | "contexts" |
    "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders";
`.trim()}/></li>
                        </ol>
                    </Aside>

                </SectionHelper>

                <SectionHelper title="Manual launching" name="manual-launching">
                    <p class="style-text-center">Using the launcher is of course optional: you can just open up the debugger manually.</p>
                    <Aside>

                        <H3>Manually <Small>(without launcher script)</Small></H3>
                        <p>The below code shows <Small>(approximately)</Small> what the <Code code="openMixDOMDebug" /> function actually does.</p>
                        <Pre code={`
function openMixDOMDebug(host, debugSettings, appState) {

    // Parse.
    const { scriptUrl: sUrl, windowFeatures, windowTarget, onLoad, ...coreSettings } = {
        console: window.console,
        addRoot: true,
        useFadeIn: true,
        windowFeatures: "toolbar=0,scrollbars=0,location=0,resizable=1",
        windowTarget: "_blank",
        scriptUrl: "https://unpkg.com/mix-dom-debug/MixDOMDebug.js",
        ...debugSettings
    };
    if (coreSettings.cssUrl === undefined)
        coreSettings.cssUrl = sUrl.slice(0, sUrl.lastIndexOf("/") + 1) + "MixDOMDebug.css";

    // Open a window.
    const w = window.open(undefined, windowTarget, windowFeatures);

    // Generate contents.
    if (w) {

        // Prepare script.
        const script = w.document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", sUrl);

        // Add load listener.
        script.addEventListener("load", () => {
            w.MixDOMDebug.startDebug(host, coreSettings, appState);
        });
        
        // Add window close listener.
        // .. We can use "beforeunload" to call a func inside,
        // .. since we are not trying to prevent the unloading.
        w.addEventListener("beforeunload", () => {
            w.MixDOMDebug?.stopDebug(true); // True to skip context update.
        });

        // Add script.
        w.document.body.appendChild(script);
    }

    // Return window.
    return w;
}
`.trim()} />
                    </Aside>

                </SectionHelper>

                <SectionHelper title="Render the app manually" name="render-app">
                    <p class="style-text-center">Finally, you can include the whole debugger app with the <A href="https://www.npmjs.com/package/mix-dom-debug" target="_blank">NPM package</A>.</p>
                    <Aside>
                        <H3>Import the debugger</H3>
                        <p>To render the app in a custom location within your app <Small>(instead of a new window)</Small>, import the <Code code="MixDOMDebug"/> class, instantiate it and insert its own host <Code code="debug.ownHost"/> inside your app.</p>
                        <p>Note that it's okay to insert the debugger host inside the host you want to debug - it will be cut out from debugging itself. The below JSX-example demonstrates the principles.</p>
                        <Pre code={escapeHTML(`
// Imports.
import { MixDOM } from "mix-dom";
import { MixDOMDebug } from "mix-dom-debug";

// Host to debug.
// .. Note that you could insert debug.ownHost inside, too.
const UIAppToDebug = () => <div class="app-to-debug">...</div>;
const hostToDebug = new Host(<UIAppToDebug/>);

// Initialize styles and optional scripts to this document.
MixDOMDebug.initApp(); // Can define more options here.

// Create a debug instance manually.
const debug = new MixDOMDebug(); // No need to give a container.
debug.setHost(hostToDebug);

// Insert the debugger's own host inside your dev. app.
const UIDevApp = () => <div class="dev-app">{debug.ownHost}</div>;
const devHost = new Host(<UIDevApp/>);

// Extra tips.
// debug.setHost(host, settings, appState);     // Set host + update settings.
// debug.updateSettings(settings, appState);    // Update settings.
// debug.clearHost(host);                       // Stop debugging.

`.trim())} />
                    </Aside>
                </SectionHelper>

                <SectionHelper title="See example at docs (mixdomjs.org)" name="docs-example">
                    <p class="style-text-center">To see a use case example, navigate to the <A href="https://mixdomjs.org">mix-dom docs</A>, and open the <b>Debug</b> link in the top bar.</p>
                </SectionHelper>

            </Article>
        </div>
    );
}
