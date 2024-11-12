
// - Imports - //

// Libraries.
import { MixDOM, ComponentCtxFunc, Host } from "mix-dom/camelCase";
import { classNames } from "dom-types";
// Common.
import type { AppContexts } from "../../common/index";
// UI Common.
import { UIAppTipRemote } from "./common/UIAppTip";
// Views.
import { UIAppHostTree } from "./views/UIAppHostTree";
import { UIAppTopBar } from "./views/UIAppTopBar";
import { UIAppInstructions } from "./views/UIAppInstructions";


// - Component - //

export interface UIAppInfo {
    props: { refreshId?: any; };
    state: {
        theme: "dark" | "light";
        host: Host | null;
    };
    contexts: AppContexts;
}

export const UIApp: ComponentCtxFunc<UIAppInfo> = function UIApp(_initProps, comp, cAPI) {

    comp.state = { theme: "dark", host: null };
    cAPI.listenToData("state.theme", "debug.host", (theme, host) => comp.setState({ theme, host}), [comp.state.theme, comp.state.host]);

    return (props, state) => {
        return <div
            class={classNames(
                "ui-app style-back-main style-front-main layout-fit-size flex-col",
                "color-theme-" + state.theme,
                "layout-theme-default",
                "transition-theme-default",
            )}
        >
            {state.host ?
                <>
                    <UIAppTopBar refreshId={props.refreshId} />
                    <div class="flex-row layout-fit-width flex-grow layout-overflow-hidden">
                        <UIAppHostTree refreshId={props.refreshId} listClassName="layout-padding-m layout-border-box" />
                    </div>
                </> : 
                <div class="flex-row layout-fit-width flex-grow layout-overflow-hidden">
                    <UIAppInstructions refreshId={props.refreshId} />
                </div>
            }
            <UIAppTipRemote.WithContent>
                <div class="popup-tip-container layout-abs-fill layout-z-high layout-overflow-hidden layout-no-pointer">
                    {UIAppTipRemote.Content}
                </div>
            </UIAppTipRemote.WithContent>
        </div>
    };
}
