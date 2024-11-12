
// - Imports - //

// Libraries.
import { ComponentFunc, MixDOM } from "mix-dom";
import { classNames } from "dom-types";
// Local.
import { UIAppTip, UIAppTipInfo } from "./UIAppTip";


// - Mixed component - //

export type UIAppInputProps = Omit<UIAppTipInfo<"input">["props"], "tag"> & {
    look?: "filled" | "edge" | "transparent";
    escToClearInput?: boolean;
    onValue?: (newValue: string) => void;
};
/** Simple input with hovertip. */
// Create the hover tip input - with access to the remote.
export const UIAppInput: ComponentFunc<{props:UIAppInputProps;}> = (_props, comp) => {
    // Prepare.
    const rootRef = new MixDOM.Ref<HTMLInputElement>();
    const onInput = (e: InputEvent) => {
        comp.props.onInput && comp.props.onInput(e);
        if (comp.props.onValue) {
            const el = rootRef.getElement();
            el && comp.props.onValue(el.value);
        }
    }
    const onKeyDown = (e: KeyboardEvent) => {
        comp.props.onKeyDown && comp.props.onKeyDown(e);
        if (e.key === "Escape" && comp.props.escToClearInput) {
            const el = rootRef.getElement();
            if (el && el.value) {
                el.value = "";
                comp.props.onValue && comp.props.onValue("");
            }
        }
    }
    // Render.
    return (props) => {
        const { look, escToClearInput, className, onKeyDown: _onKeyDown, rootRef: _rootRef, onInput: _onInput, ...passProps } = props;
        return <UIAppTip<"input"> {...passProps} rootRef={rootRef} onKeyDown={onKeyDown} onInput={onInput} tag="input" className={classNames("ui-app-input style-ui-input style-ui-focusable", "focusable-look-" + (look || "edge"), className)} />;
    }
};
