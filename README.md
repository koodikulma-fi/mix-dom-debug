# MixDOMDebug - instructions

---

## Using the launcher script

The easiest way to launch the debugger app is to include the tiny launcher script in your app, and use it to open up a new debugging window for the given host.

Including the launcher script simply adds one function to the global window: `openMixDOMDebug`

### Global usage

You can just add the launcher script to the document, and then use it to open a debugger for the host you want to debug.

1. So first, include the launcher script (inside `<body>`):

   ```html
   <script type="text/javacript" src="https://unpkg.com/mix-dom-debug/launcher.global.js" />
   ```

   

2. And then use it to debug a Host instance:

   ```js
   const debugWindow = window.openMixDOMDebug( host );
   ```

3. Use the returned window to access the static class (after it's loaded): `debugWindow.MixDOMDebug`

### Adding global script by JS

You can also do this programmatically. (Of course, you only need to add the script to the document once.)

```js
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
```

If you have the `mix-dom-debug` package downloaded / installed locally, you can of course point to its `"launcher.global.js"`.

### Module usage (import/require)

You can also install the [NPM package](https://www.npmjs.com/package/mix-dom-debug) and import the launcher as a sub module.

1. First, install: `mix-dom-debug` from the terminal (as a dev. dependency)

   ```
   npm -i mix-dom-debug --save-dev
   ```

2. Then import (or require) the launcher function:

   ```js
   import { openMixDOMDebug } from "mix-dom-debug";
   ```

3. And finally hook it up in your code (with typing support):

   ```js
   openMixDOMDebug(host, debugSettings, appState);
   ```

### About launcher arguments

The `openMixDOMDebug` function takes in 3 arguments, all of which are optional.

1. The host to debug: `host: Host | null`

2. Debug settings:

   ```ts
   interface debugSettings {
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
   ```

3. Initial app state:

   ```ts
   interface appState {
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
   }
   ```

   ```ts
   type TipSectionNames = "heading" | "code" | "props" | "state" | "contexts" |
       "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders";
   ```

## Manual launching

Using the launcher is of course optional: you can just open up the debugger manually.

### Manually (without launcher script)

The below code shows (approximately) what the `openMixDOMDebug` function actually does.

```js
function openMixDOMDebug(host, debugSettings, appState) {

    // Parse.
    let { scriptUrl, windowFeatures, windowTarget, onLoad, ...coreSettings } = {
        console: window.console,
        addRoot: true,
        useFadeIn: true,
        windowFeatures: "toolbar=0,scrollbars=0,location=0,resizable=1",
        windowTarget: "_blank",
        scriptUrl: "https://unpkg.com/mix-dom-debug/MixDOMDebug.js",
        ...debugSettings
    };
    if (coreSettings.cssUrl === undefined)
        coreSettings.cssUrl = scriptUrl.slice(0, scriptUrl.lastIndexOf("/") + 1) + "MixDOMDebug.css";

    // Open a window.
    const w = window.open(undefined, windowTarget, windowFeatures);

    // Generate contents.
    if (w) {

        // Prepare script.
        const script = w.document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", scriptUrl);

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
```

## Set host directly

If you have already launched the debug app with the launcher, the window contains a globally declared `MixDOMDebug` class.

### Changing the host

To start debugging a Host instance in this window (`debugWindow`) from another window, simply call:

```js
debugWindow.MixDOMDebug.startDebug( host ); // Feed in the `host` to debug.
```

Or you can use the `setHost(host, settings, appState)` and `clearHost()` methods directly:

```js
debugWindow.MixDOMDebug.debug.setHost( host );
```

Note that there's only 1 (or 0) instance at a time, accessible at: `debugWindow.MixDOMDebug.debug`

## Render the app manually

Finally, you can include the whole debugger app with the [NPM package](https://www.npmjs.com/package/mix-dom-debug).

### Import the app root

To render the app in a custom location within your app (instead of a new window), import the `MixDOMDebug` class, instantiate it and insert its own host `debug.ownHost` inside your app.

Note that it's okay to insert the debugger host inside the host you want to debug - it will be cut out from debugging itself. The below JSX-example demonstrates the principles.

```jsx
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
```
## See docs (mixdomjs.org) for more
To see a real time example of debugging, see the [mix-dom docs](https://mixdomjs.org) and open the **Debug** link in the top bar.
