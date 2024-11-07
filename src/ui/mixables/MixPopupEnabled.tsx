
// - Imports - //

import { MixDOM, ComponentFuncMixable, ComponentRemoteType, ComponentTypeAny } from "mix-dom";
import { MixEnabled } from "./MixEnabled";


// - Mixable component - //

export interface MixPopupEnabledInfo {
	// We shall put popupContainer into our class and require another to implement it.
	// .. For example, MixAppPopupButton that would have access to the app root's element.
    // .. Putting it into props would require nesting components - we want to _mix_ them.
    class: {
        /** Either a remote, or a node for a portal - if none, uses document.body. */
        popupContainer: Node | ComponentRemoteType | null;
        /** The render output should simply include this component. */
        WithPopup: ComponentTypeAny;
    };
}

// export const MixPopupEnabled: ComponentFuncRequires<MixEnabledInfo, MixPopupEnabledInfo> = (_, comp) => {
export const MixPopupEnabled: ComponentFuncMixable<typeof MixEnabled, MixPopupEnabledInfo> = (_, comp) => {

    // Let's create a spread func that can be included in render output to provide the tip feature.
	// .. Note that the spread function is assumed to be in our own render output.
	// .. That said, we can very conveniently use our own comp instance in it, eg. comp.props.
    comp.WithPopup = () => {
        // If is enabled.
        if (comp.state.enabled) {
            // Prepare the content.
            const content = <div
                style={{
					position: "absolute",
					inset: 0,
					zIndex: 100,
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
                    background: "rgba(0,0,0,.9)",
                    color: "#aaa",
                    overflow: "hidden",
                }}
				>
                    <button
                        style="position: absolute; top: 1em; right: 1em;"
                        onClick={comp.toggleEnabled}
                    >Close</button>
                    <div>{MixDOM.Content}</div>
				</div>;
            // Return with container.
            return content == null ? null : (
                // If the popupContainer is a DOM node, uses portal - also if no container given.
                !comp.popupContainer || comp.popupContainer instanceof Node ? 
                    <MixDOM.Portal container={comp.popupContainer as Node | null || document.body}>
                        {content}
                    </MixDOM.Portal>
                // Otherwise it should be a ComponentRemote.
                // .. Could verify it by: comp.popupContainer.MIX_DOM_CLASS === "Remote"
                : <comp.popupContainer>{content}</comp.popupContainer>
            );
        }
        // Fallback to rendering nothing.
        return null;
    }
    // We won't render anything.
    // .. Instead we provide what what we want to be rendered as .WithPopup.
    return null;
}
