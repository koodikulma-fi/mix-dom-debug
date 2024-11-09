
// - Imports - //

// Libraries.
import { ComponentFunc, MixDOM } from "mix-dom";
import { classNames } from "dom-types";
// Common.
import { IconNames } from "../../../common/index";
// Local.
import { UIAppTip, UIAppTipInfo } from "./UIAppTip";
import { UIAppIcon } from "./UIAppIcon";


// - Mixed component - //

export type UIAppButtonProps = Omit<UIAppTipInfo<"button">["props"], "tag"> & {
    iconName?: IconNames;
    iconClassName?: string;
    toggled?: boolean;
    invisible?: boolean;
    look?: "filled" | "edge" | "transparent";
    size?: "no" | "narrow" | "large";
    /** Use this for onClick with modifier key support. */
    onPress?: (e: MouseEvent | KeyboardEvent) => void;
};
/** Simple button with hovertip. */
// Create the hover tip button - with access to the remote.
export const UIAppButton: ComponentFunc<{ props: UIAppButtonProps; }> = (_props, comp) => {
    // Callbacks.
    const onClick = (e: MouseEvent) => {
        comp.props.onPress && comp.props.onPress(e);
        comp.props.onClick && comp.props.onClick(e);
    }
    const onKeyDown = (e: KeyboardEvent) => {
        if (comp.props.onPress && (e.key === " " || e.key === "Enter") && !comp.props.disabled) {
            e.preventDefault();
            comp.props.onPress(e);
        }
        comp.props.onKeyDown && comp.props.onKeyDown(e);
    }
    // Render.
    return (props) => {
        const { look, size, invisible, iconName, iconClassName, className, disabled, onPress, onClick: _onClick, onKeyDown: _onKeyDown, toggled, ...passProps } = props;
        return <UIAppTip<"button">
                {...passProps}
                tag="button"
                disabled={invisible ? true : disabled}
                onKeyDown={onKeyDown}
                onClick={onClick}
                className={classNames(
                    "ui-app-button style-ui-button style-ui-focusable",
                    "focusable-look-" + (look || "edge"),
                    toggled !== undefined ? toggled ? "button-on" : "button-off" : undefined,
                    size && ("size-" + size),
                    invisible && "layout-no-pointer style-opacity-0",
                    className
                )}
            >
            {iconName !== undefined ? <UIAppIcon iconName={iconName} className={iconClassName} iconSize={size !== "narrow" && size !== "no" ? size : undefined} /> : null}{MixDOM.Content}
        </UIAppTip>;
    }
};
