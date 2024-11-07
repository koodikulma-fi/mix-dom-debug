
// - Imports - //

import { ComponentFunc } from "mix-dom";


// - Mixable component - //

export interface MixEnabledInfo {
    props: { enabled?: boolean; }
    state: { enabled: boolean; };
    class: { toggleEnabled: () => void; };
}
export const MixEnabled: ComponentFunc<MixEnabledInfo> = (initProps, comp) => {
    // Note that we can just assign our own state with _functional_ mixing.
    // .. Even if there were many parts adding state - it's handled by the mixer.
    comp.state = {
        enabled: initProps.enabled || false
    };
    // Simple feature: toggle state on click.
    comp.toggleEnabled = () => comp.setInState("enabled", !comp.state.enabled);
    // Nothing to render.
	return null;
}
